// ============================================================================
// Costo de producción contra precio al productor (window.COSTOS_FIRA, scripts/procesar_costos_fira.py): costo por kg
// de FIRA Agrocostos (2015–2022, llevado a pesos de hoy con la inflación) por estado y tipo (agricultura protegida o
// cielo abierto) contra el precio medio rural del SIAP 2025. Sección en Producto, dato del estado en Entidad y en el
// precio neto semanal de exportación.
// ============================================================================
(function () {
  const C = () => window.COSTOS_FIRA;
  const mxn = n => "$" + n.toFixed(2);
  const pct = x => (x >= 0 ? "+" : "−") + Math.abs(Math.round(x * 100)) + "%";
  const TIPO = { protegida: "protegida", abierto: "cielo abierto" };
  const disponible = k => !!C()?.productos?.[k] && Object.keys(C().productos[k]).length > 0;
  const nombre = id => window.ESTADOS?.find(e => e.id === id)?.nombre ?? id;
  // Para cada estado, el costo de cielo abierto si existe (se compara mejor con el precio rural); si no, el protegido
  const costoEstado = (k, id) => {
    const l = C()?.productos?.[k]?.[id];
    return l ? (l.find(x => x[0] === "abierto") ?? l[0]) : null;
  };
  const filas = k => Object.entries(C().productos[k]).flatMap(([id, l]) => l.map(([tipo, costo, anio, rend, n]) => {
    const rural = C().rural?.[k]?.[id];
    return { id, tipo, costo, anio, rend, n, rural, margen: rural ? (rural - costo) / rural : null };
  })).sort((a, b) => (b.margen ?? -9) - (a.margen ?? -9));

  function resumen(k) {
    if (!disponible(k)) return "";
    const g = filas(k).filter(x => x.margen != null);
    if (!g.length) return "";
    const pos = g.filter(x => x.margen > 0).length;
    return `El precio rural cubre el costo en ${pos} de ${g.length} ${g.length === 1 ? "caso" : "casos"} (estado y tipo de cultivo) con costo FIRA`;
  }
  function html(k) {
    if (!disponible(k)) return "";
    const F = filas(k);
    const a0 = Math.min(...F.map(f => f.anio)), a1 = Math.max(...F.map(f => f.anio)), rango = a0 === a1 ? a0 : `${a0}–${a1}`;
    return `
      <div class="desplaza"><table class="compacta">
        <tr><th>Estado</th><th>Tipo</th><th class="num">Costo $/kg</th><th class="num">Precio rural $/kg</th><th class="num">Margen sobre el precio</th></tr>
        ${F.map(f => `<tr class="clic" data-id="${f.id}"><td>${nombre(f.id)}</td><td>${TIPO[f.tipo]}<br><span class="est">FIRA ${f.anio} · ${f.rend} t/ha</span></td>
          <td class="num">${mxn(f.costo)}</td><td class="num">${f.rural ? mxn(f.rural) : "—"}</td>
          <td class="num">${f.margen == null ? "—" : `<span class="tag ${f.margen >= 0.15 ? "ok" : f.margen >= 0 ? "alerta-tag" : "exc"}">${pct(f.margen)}</span>`}</td></tr>`).join("")}
      </table></div>
      <p class="sub"><span>Costo: FIRA Agrocostos, costo paramétrico por hectárea entre el rendimiento esperado, del año más reciente con dato (${rango}), llevado a pesos de ${C().actualizadoA} con la inflación (${C().indice}).</span>
        <span>Precio: precio medio rural del SIAP 2025 en el estado (todas las calidades y destinos).</span>
        <span>FIRA advierte que son pocas observaciones y no representan al estado: sirven como orden de magnitud.</span>
        <span>La agricultura protegida (invernadero, malla) suele venderse más cara que el promedio rural, sobre todo para exportar: su margen aquí sale castigado.</span></p>`;
  }
  function estadoTexto(k, id) {
    const c = costoEstado(k, id), rural = C()?.rural?.[k]?.[id];
    if (!c) return "";
    return `costo de producir ${mxn(c[1])}/kg (FIRA ${c[2]}, ${TIPO[c[0]]})` + (rural ? ` contra ${mxn(rural)}/kg de precio rural (${pct((rural - c[1]) / rural)})` : "");
  }
  window.Costos = { disponible, html, resumen, estadoTexto, costoEstado };
})();
