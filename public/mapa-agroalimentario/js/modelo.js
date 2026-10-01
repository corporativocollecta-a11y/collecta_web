// ============================================================================
// Modelo de balance oferta-demanda y distribución (por producto)
// ----------------------------------------------------------------------------
// 1. Demanda por entidad = población × consumo per cápita.
// 2. Cada entidad se abastece primero con su propia producción.
// 3. Las exportaciones salen de los excedentes, proporcional al excedente de cada entidad.
// 4. El excedente restante se asigna a las entidades deficitarias con un algoritmo
//    de "costo mínimo" (pares origen-destino ordenados por distancia).
// 5. El déficit que no se cubre se atiende con importaciones (vía Nuevo Laredo).
// Los flujos son una ESTIMACIÓN del modelo, no flujos observados.
// ============================================================================
(function () {
  const FACTOR_CARRETERA = 1.25; // distancia carretera ≈ 1.25 × línea recta

  function distanciaKm(a, b) {
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
    const h = Math.sin(dLat / 2) ** 2 +
      Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h)) * FACTOR_CARRETERA;
  }

  function centralMasCercana(punto) {
    let mejor = null, dMin = Infinity;
    for (const c of window.CENTRALES) {
      const d = distanciaKm(punto, c);
      if (d < dMin) { dMin = d; mejor = c; }
    }
    return mejor;
  }

  // Si el consumo aparente es inverosímil (< 50% de la referencia, p. ej. exportación preliminar
  // mayor que la producción oficial), se usa el consumo per cápita de referencia.
  function consumoAparente(p, pobTotal) {
    const aparente = (p.nacional - p.exportacion + p.importacion) * 1000 / pobTotal;
    return aparente >= p.consumoPC * 0.5 ? aparente : p.consumoPC;
  }
  const datosInconsistentes = (p, pobTotal) =>
    (p.nacional - p.exportacion + p.importacion) * 1000 / pobTotal < p.consumoPC * 0.5;

  // escenario: { consumoPC, factorProd: {id: factor}, factorExport, tarifa, mermaPor1000, margenCentral, ruta }
  function calcular(clave, esc) {
    const p = window.PRODUCTOS[clave];
    const E = window.ESTADOS;
    const pobTotal = E.reduce((s, e) => s + e.pob, 0);
    // Base de consumo: "oficial" (Panorama Agroalimentario SIAP) o "aparente"
    // ((producción − exportación + importación) / población del mismo año)
    const base = esc.baseConsumo ?? (p.consumoOficial ? "oficial" : "aparente");
    const pcAparente = (p.nacional - p.exportacion + p.importacion) * 1000 / pobTotal;
    const pc = esc.consumoPC ?? (base === "oficial" && p.consumoOficial ? p.consumoPC : consumoAparente(p, pobTotal));

    // Producción desglosada + remanente "otras entidades" repartido por población
    const listada = Object.values(p.estados).reduce((s, v) => s + v, 0);
    const remanente = Math.max(0, p.nacional - listada);
    const pobNoListada = E.filter(e => !p.estados[e.id]).reduce((s, e) => s + e.pob, 0) || 1;

    // Consumo por estado (ENIGH 2024, data/consumo_regional.js): índice del consumo por persona de cada estado frente
    // al nacional, reescalado para que la demanda nacional no cambie (solo cambia el reparto entre estados).
    // esc.consumoRegional === false → mismo consumo por persona en todo el país.
    const reg = esc.consumoRegional === false ? null : window.CONSUMO_REGIONAL?.productos?.[clave]?.indice;
    const escala = reg ? E.reduce((s, e) => s + e.pob * (reg[e.id] ?? 1), 0) / pobTotal : 1;
    const indice = id => reg ? (reg[id] ?? 1) / escala : 1;

    const filas = E.map(e => {
      const base = p.estados[e.id] ?? remanente * e.pob / pobNoListada;
      const factor = esc.factorProd?.[e.id] ?? 1;
      const prod = base * factor * (esc.factorProdNacional ?? 1);
      const demanda = e.pob * pc * indice(e.id) / 1000;
      const local = Math.min(prod, demanda);
      return {
        ...e, prod, demanda, local, estimado: !p.estados[e.id], indiceConsumo: indice(e.id),
        excedente: prod - local, deficit: demanda - local,
        autosuf: demanda > 0 ? prod / demanda : 0,
        personas: prod * 1000 / pc,
        exporta: 0, envia: 0, recibe: 0, importa: 0
      };
    });

    const prodNac = filas.reduce((s, f) => s + f.prod, 0);
    const demNac = filas.reduce((s, f) => s + f.demanda, 0);
    const excTotal = filas.reduce((s, f) => s + f.excedente, 0);

    // Exportaciones desde excedentes
    const exportObjetivo = p.exportacion * (esc.factorExport ?? 1);
    const exportReal = Math.min(exportObjetivo, excTotal);
    filas.forEach(f => {
      f.exporta = excTotal > 0 ? f.excedente / excTotal * exportReal : 0;
      f.disponible = f.excedente - f.exporta;
      f.faltante = f.deficit;
    });

    // Asignación de costo mínimo (greedy por distancia)
    const pares = [];
    for (const o of filas) if (o.disponible > 0)
      for (const d of filas) if (d.faltante > 0 && d !== o)
        pares.push({ o, d, km: distanciaKm(o, d) });
    pares.sort((a, b) => a.km - b.km);

    const flujos = [];
    for (const par of pares) {
      if (par.o.disponible <= 0 || par.d.faltante <= 0) continue;
      const t = Math.min(par.o.disponible, par.d.faltante);
      par.o.disponible -= t; par.d.faltante -= t;
      par.o.envia += t; par.d.recibe += t;
      flujos.push({ origen: par.o, destino: par.d, t, kmDirecto: par.km });
    }

    // Déficit restante → importaciones
    const puerta = window.PUERTA_IMPORT;
    filas.forEach(f => {
      if (f.faltante > 1) {
        f.importa = f.faltante;
        flujos.push({ origen: { ...puerta, id: "IMP", nombre: puerta.nombre }, destino: f,
                      t: f.faltante, kmDirecto: distanciaKm(puerta, f), importado: true });
        f.faltante = 0;
      }
    });

    // Logística: ruta directa vs. vía central de abasto
    const tarifa = esc.tarifa ?? 2.2;             // MXN por tonelada-km
    const merma1000 = (esc.mermaPor1000 ?? 4) / 100; // fracción perdida por cada 1,000 km
    const margenCentral = (esc.margenCentral ?? 20) / 100; // sobreprecio por intermediación en central

    let tkmDir = 0, tkmCen = 0, costoDir = 0, costoCen = 0, mermaDir = 0, mermaCen = 0, tMov = 0;
    flujos.forEach(fl => {
      const central = centralMasCercana(fl.destino);
      fl.central = central;
      fl.kmCentral = distanciaKm(fl.origen, central) + distanciaKm(central, fl.destino);
      tMov += fl.t;
      tkmDir += fl.t * fl.kmDirecto;            tkmCen += fl.t * fl.kmCentral;
      costoDir += fl.t * fl.kmDirecto * tarifa; costoCen += fl.t * fl.kmCentral * tarifa;
      mermaDir += fl.t * Math.min(0.3, merma1000 * fl.kmDirecto / 1000);
      mermaCen += fl.t * Math.min(0.3, merma1000 * fl.kmCentral / 1000);
    });

    const valorMerma = t => t * 1000 * p.precioRural;
    const kgMov = tMov * 1000 || 1;
    const logistica = {
      toneladasMovidas: tMov,
      directo: {
        km: tMov ? tkmDir / tMov : 0, costo: costoDir, merma: mermaDir,
        costoKg: (costoDir + valorMerma(mermaDir)) / kgMov
      },
      centrales: {
        km: tMov ? tkmCen / tMov : 0, costo: costoCen, merma: mermaCen,
        costoKg: (costoCen + valorMerma(mermaCen)) / kgMov + p.precioRural * margenCentral
      }
    };
    // transporte + merma por kg, sin sobreprecio de intermediación
    logistica.directo.transporteKg = logistica.directo.costoKg;
    logistica.centrales.transporteKg = (costoCen + valorMerma(mermaCen)) / kgMov;
    logistica.ahorroKg = logistica.centrales.costoKg - logistica.directo.costoKg;
    logistica.ahorroTotal = logistica.ahorroKg * kgMov;

    const importTotal = filas.reduce((s, f) => s + f.importa, 0);
    const excedenteSinMercado = filas.reduce((s, f) => s + Math.max(0, f.disponible), 0);

    return {
      producto: p, clave, pc, pcAparente, base, regional: !!reg, filas, flujos, logistica,
      inconsistente: datosInconsistentes(p, pobTotal),
      nacional: {
        produccion: prodNac, demanda: demNac, pobTotal,
        exportacion: exportReal, importacionModelo: importTotal,
        importacionReportada: p.importacion,
        autosuficiencia: prodNac / demNac,
        personasProduccion: prodNac * 1000 / pc,
        personasTrasExport: (prodNac - exportReal) * 1000 / pc,
        excedenteSinMercado,
        entidadesAutosuf: filas.filter(f => f.autosuf >= 1).length
      }
    };
  }

  window.Modelo = { calcular, distanciaKm, consumoAparente };
})();
