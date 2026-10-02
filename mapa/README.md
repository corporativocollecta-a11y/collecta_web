# Mapa interactivo agroalimentario — México (fase 1)

Plataforma para visualizar **quién produce qué**, **si cada entidad se autoabastece**, **a cuántas personas alcanza la
producción**, **cuánto se exporta y a dónde**, y **cómo podría reorganizarse la distribución** para reducir costos.

## Cómo abrirlo

```bash
node servidor.js
```

Luego abre http://localhost:8080

## Interfaz

- **Mapa a pantalla completa** con paneles flotantes traslúcidos y plegables (‹ ›): catálogo de productos (buscador, filtro frutas/hortalizas), barra de capas y panel de análisis. Al plegarlos, el mapa se reencuadra solo.
- **Mapa de color por territorio** (coropletas): estados de México, estados o regiones de los 15 países y países en Latinoamérica/Mundo, coloreados por autosuficiencia (o dependencia de importaciones, consumo o rendimiento). El interruptor *Volumen* agrega círculos del tamaño de la producción. Contornos de Natural Earth (dominio público), unidos a las regiones de cada vista y simplificados: `python scripts/construir_geo.py` → `data/geo/<país>.js` y `data/geo/paises.js` (se cargan al abrir cada vista).
- **Titular sobre el mapa** con tres cifras del producto en la vista activa: producción, consumo por persona y parte importada. Las tablas quedan en el panel.
- **Enlaces directos**: la vista actual (región o país, producto, métrica, selección y pestaña) vive en el `#` de la URL; el botón de cadena la copia. Ej.: `…/mapa-agroalimentario#v=global&p=aguacate&m=opp&t=balance`. En México, `n=mun` abre la vista de municipios y `mm=` su métrica (`autosuficiencia`, `rendimiento`, `sequia`).
- **Modo presentación** (`js/recorrido.js`): recorrido guiado de 8 pasos por los hallazgos del reporte 2025 (precio al productor, abasto de jitomate, concentración en Michoacán, dependencia de EE. UU., frontera → mayoreo, México primer exportador mundial, oportunidades en Europa, sequía). Cada paso es un enlace directo más la sección que se abre, con texto en español e inglés. Se abre con el botón de pantalla de la cabecera o con `…/mapa-agroalimentario#tour` (`#tour=5` empieza en el paso 5; `&l=en` en inglés). Teclado: → / Espacio / AvPág, ← / RePág, Inicio / Fin, Esc para salir (funciona con presentadores inalámbricos). Para cambiar pasos se edita el arreglo `PASOS`.
- **Comparar lado a lado** (`js/comparar.js`, botón de dos columnas en la cabecera): dos países en un producto, dos productos en un país o dos estados de México en un producto, con tarjetas, tabla de cifras clave (se resalta el valor mayor; en "lugar" y "sequía" gana el menor) y series de 10 años en la misma gráfica (A en lima, B en naranja). Países y productos: FAOSTAT 2024 y serie 2015–2024 (`data/historia.js`); en productos la gráfica es un índice (primeros dos años = 100) porque los volúmenes difieren mucho. Estados: SIAP 2025 (producción, parte nacional, superficie, rendimiento, valor, precio rural, demanda, autosuficiencia, sequía) y serie SIAP 2016–2025 por estado. Abre con el contexto de la vista (en México, el estado elegido contra el mayor productor; en Mundo o un país, México contra ese país). Enlace: `cmp=<paises|productos|estados>.<A>.<B>.<producto o país>`, p. ej. `#v=mx&p=arandano&cmp=paises.484.604.arandano` (México contra Perú en berries). Se imprime sola con su botón de PDF.
  - Serie por estado: `python scripts/procesar_historia_estados.py [2016] [2025]` descarga con `curl` los cierres municipales que falten a `data/fuentes/siap_historia/` (el servidor de la DGSIAP corta conexiones; se reintenta) y escribe `data/historia_estados.js` (76 kB, carga diferida). Hasta 2017 la columna del cultivo se llama "Nomcultivo Sin Um". El cierre de 2020 y 2021 no trae arándano: esos años quedan vacíos (no cero) y la línea se corta.
- **Ficha en PDF**: el botón de documento imprime la vista en tema claro con titular, mapa, leyenda, pestaña abierta en dos columnas y el enlace a la vista (“Guardar como PDF” del navegador).
- **Inglés**: botón EN/ES. `js/idioma.js` traduce el texto ya pintado con plantillas (`data/traduccion_en.js`, generado por `scripts/traducir_en.py`): nombres y cifras se sustituyen por marcadores. Lo que no tiene plantilla queda en español; `Idioma.pendientes()` en la consola lista lo que falta.
- **Rutas limpias**: solo las principales (20 en México, 3 orígenes por país, 12–15 en Latinoamérica/Mundo), trazo fino animado en el sentido del flujo sobre un halo tenue y orígenes con brillo. Naranja = importación.
- **Pestañas Producto y Exportar**: *Producto* es el mercado interno (balance, precios SNIIM/PROFECO, estacionalidad, sequía, historia de 10 años, entidades y municipios); *Exportar* reúne el comercio exterior (destinos, calendario comercial, competencia en EE. UU., flete de la frontera a cada ciudad, volumen por cruce, precio neto al productor por estado, acceso a mercados, "Dónde puede vender México" y precios de Europa). Existe en México, en Latinoamérica/Mundo y en las 24 vistas por país (ahí: de dónde importa, a dónde exporta, cuánto le vende México y el acceso de México a ese mercado). Dentro de cada pestaña, secciones plegables (`js/secciones.js`) con un resumen de una línea siempre visible; se recuerda cuáles abrió la persona. En la ficha en PDF las secciones abiertas salen completas y las cerradas solo con su resumen, así quien imprime elige qué entra. Enlace: `t=exportar`.
- **Pestaña Resumen**: tablero nacional de todos los productos (autosuficiencia, parte del precio que llega al productor, exportación, cosecha mensual) ordenable, con hallazgos calculados automáticamente.
- **Modo oscuro por omisión** (vista de presentación) y modo claro (botón de luna; se recuerda por navegador).
- **Móvil** (menos de 900 px): mapa a pantalla completa, productos en una tira horizontal y el análisis en una hoja inferior que se expande con la asa o al tocar un territorio. Revisado a 375 px: cabecera en dos renglones; desde 1100 px el reporte, presentación, comparar, ficha, enlace, ayuda y tema pasan al menú "⋯", tablas compactas y las anchas (Resumen, flete a cada ciudad, "Dónde puede vender México", mercado de destino) con desplazamiento horizontal y la primera columna fija (`.desplaza`). En modo presentación se ocultan titular, capas y tira de productos y la tarjeta sube arriba.
- **Guía rápida** la primera vez (botón “?” para volver a verla) y enlace al reporte de hallazgos 2025.
- **Reporte de hallazgos** (`reporte/hallazgos-agroalimentarios.html`, fragmento HTML que `publicar_web.py` envuelve y publica en `/mapa-agroalimentario/reporte`): misma identidad que el mapa (tokens de color claro/oscuro, Instrument Serif, Geist y Geist Mono, isotipo incrustado en base64 desde `img/isotipo-color.png`), oscuro por omisión con botón de tema (comparte la preferencia `tema` con el mapa), barra con "Abrir el mapa" y "Modo presentación", e impresión en claro. Los enlaces al mapa se escriben relativos (`../index.html`) y el script de publicación los cambia a `/mapa-agroalimentario`.
- Identidad Collecta (como collectaproduce.com): isotipo, Instrument Serif (titulares y cifras grandes), Geist (interfaz), Geist Mono (datos); fondo verde noche `#0B120D`, verde lima `#9FD36A` (producción, excedente) y naranja señal `#F2703A` (déficit, importación). La escala del mapa vive en variables CSS `--c-*` y `js/paleta.js` la lee, así que cambia con el tema.

## Fase LATAM (en curso)

Selector **México / Latinoamérica** en la cabecera. En *Latinoamérica*:

- Mapa de 34 países de América Latina y el Caribe: burbuja = producción; color = autosuficiencia, consumo aparente por persona o rendimiento frente al promedio regional.
- *Resumen*: 28 productos con producción regional, país líder, lugar y participación de México, y exportación regional.
- *Producto*: ranking de productores con tendencia de 5 años, principales exportadores e importadores, y países que no cubren su consumo.
- *País*: portafolio de cada país (producción, lugar regional, autosuficiencia y kg por persona).
- Fuente: FAOSTAT (FAO), 2024, descargas masivas de la región Américas (`python scripts/procesar_faostat.py`). La API de FAOSTAT exige autenticación; las descargas masivas no.
- Sin partida FAO propia: tomate verde, nopal, zarzamora y nuez. Partidas agrupadas: mango (con guayaba), brócoli (con coliflor), calabacita (con calabaza), zanahoria (con nabo), lechuga (con achicoria); plátano suma banano y plátano macho.
- **Comercio bilateral** (interruptor *Rutas comerciales*): arcos curvos de quién le vende a quién por producto, con EE. UU., Canadá y regiones fuera de América (Europa, Asia y Oceanía, Medio Oriente y África) como anclas en el borde del mapa. Al seleccionar un país se ven solo sus rutas (morado = lo que compra). Paneles: principales rutas, a dónde va la exportación latinoamericana, a quién vende y a quién compra cada país. Fuente: matriz detallada de comercio de FAOSTAT (`python scripts/procesar_faostat_bilateral.py`; archivo de 420 MB, 8.5 GB sin comprimir, procesado en flujo). Salidas de países latinoamericanos según el exportador; llegadas desde fuera de la región según el importador, para no contar dos veces.

## Vistas por país (motor común)

Selector **Ver país…** en la cabecera. Todos los países usan el mismo motor (`js/subnacional.js`) y el mismo formato de
datos (`scripts/subnacional_comun.py` → `data/sub_<código>.js`, `window.SUBNACIONAL`):

- Producción por región (estado, provincia…) de la fuente oficial de cada país, marcada como publicada o estimada.
- Demanda por región = población × consumo aparente nacional (producción + importación − exportación).
- Comercio del país con FAOSTAT 2024 (importación = la mayor entre lo que registra el país y lo que reportan sus proveedores).
- Mapa: autosuficiencia o dependencia de importaciones por región; arcos desde los principales países de origen (estimación).
- Para agregar un país: un script que obtenga producción y población por región y llame a `escribir_pais(...)`, y una línea
  `<script src="data/sub_xx.js">` en `index.html`.

Países integrados:

| País | Nivel | Fuente | Script |
|---|---|---|---|
| Estados Unidos | 50 estados + DC | USDA NASS 2025, Censo Agropecuario 2022, Census Bureau 2025 | `procesar_usda.py` |
| Brasil | 27 estados | IBGE, Producción Agrícola Municipal 2025 y estimaciones de población 2025 (API SIDRA) | `procesar_ibge.py` |
| Colombia | 32 departamentos + Bogotá | EVA 2025 (MinAgricultura/UPRA, datos.gov.co) y proyecciones de población DANE 2025 (vía TerriData, DNP) | `procesar_eva.py` |
| Canadá | 10 provincias + 3 territorios | Statistics Canada 2025: tablas 32-10-0364, 32-10-0365, 32-10-0456 (invernadero), 32-10-0358 (papa) y 17-10-0009 (población) | `procesar_statcan.py` |
| Perú | 24 departamentos + Callao | MIDAGRI, boletín "El Agro en Cifras" dic. 2025 (cuadro C.18, preliminar) e INEI población 2025 | `procesar_midagri.py` (+ `leer_agro_cifras.py`) |
| España | 17 comunidades autónomas + Ceuta y Melilla | MAPA superficies y producciones 2025 (provisional; patata 2024) e INE población 1-ene-2025 (tabla 56940) | `procesar_mapa_es.py` |
| Italia | 20 regiones | ISTAT coltivazioni 2025 (API SDMX, producción cosechada) y población al 1-ene-2025 | `procesar_istat.py` |
| Turquía | 81 provincias | TÜİK 2025: producción vegetal y población ADNKS (sistema MEDAS) | `procesar_tuik.py` |
| Chile | 16 regiones | Superficie ESH 2024 (INE) y catastros frutícolas CIREN-ODEPA; papa y tomate industrial INE 2024/25; Censo 2024; FAOSTAT | `procesar_odepa.py` |
| Polonia | 16 voivodatos | GUS, Bank Danych Lokalnych (API): frutas y papa 2025; población 2025 | `procesar_gus.py` |
| Filipinas | 18 regiones | PSA OpenSTAT (API PxWeb): producción 2025; Censo de Población 2024 | `procesar_psa.py` |
| Ecuador | 24 provincias | INEC ESPAC 2025; proyección de población 2025 (base Censo 2022) | `procesar_espac.py` |
| Japón | 47 prefecturas | MAFF, estadística de producción de hortalizas y frutales 2024 (e-Stat); población 2024 | `procesar_maff.py` |
| Francia | 18 regiones (con ultramar) | Agreste, Statistique agricole annuelle 2025 (provisional); población Eurostat 2025 | `procesar_agreste.py` |
| Australia | 8 estados y territorios | ABS Australian Agriculture: Horticulture 2024-25; población ABS jun-2025 | `procesar_abs.py` |
| Países Bajos | 12 provincias | CBS StatLine 2025 (API OData); población CBS 2025 | `procesar_cbs.py` |
| Bélgica | 11 provincias (con Bruselas-Capital) | Eurostat: papa 2024 por provincia, superficies 2023; FAOSTAT 2024; población Eurostat 2025 | `procesar_eurostat_be.py` |
| Portugal | 9 regiones NUTS II (2024) | INE Portugal, producción vegetal 2025 (API JSON); población INE 2025 | `procesar_ine_pt.py` |
| Grecia | 13 regiones (periferias) | ELSTAT, Encuesta Agrícola Anual 2024; población Eurostat 2025 | `procesar_elstat.py` |
| Nueva Zelanda | 16 regiones | Stats NZ, superficie 2024 y censo agropecuario 2022; FAOSTAT 2024; población 2025 | `procesar_statsnz.py` |
| Guatemala | 22 departamentos | FAOSTAT 2024 repartido por superficie MAGA 2020 (El Agro en Cifras 2023); población INE 2023 | `procesar_maga_gt.py` |
| Costa Rica | 7 provincias | INEC ENA 2024 (o FAOSTAT) repartida por superficie del Censo Agropecuario 2014; población Censo 2022 | `procesar_cenagro_cr.py` |
| Honduras | 18 departamentos | INE, Censo Agropecuario Nacional 2024 (preliminar); proyección de población INE 2024 | `procesar_can_hn.py` |
| Corea del Sur | 17 provincias | Estadística de Corea (KOSIS), encuesta de producción de cultivos 2024–2025; población registrada 2026 | `procesar_kosis.py` |

### Brasil

- 23 productos con cifra oficial por estado (tablas 1612 y 1613 de la PAM). Piña: el IBGE la reporta en miles de frutos; se reparte la producción nacional de FAOSTAT en toneladas.
- "Chile" corresponde solo a pimiento morrón (pimentão); "noz" es sobre todo nuez pecanera.
- Respuestas crudas de la API en `data/fuentes/ibge/`.

### Colombia

- 30 productos. Producción oficial por municipio de las Evaluaciones Agropecuarias Municipales (conjunto `uejq-wxrr` de datos.gov.co), sumada por departamento y por periodo (semestres A y B de los cultivos transitorios).
- Agrupaciones alineadas con la FAO: plátano = plátano + banano; chile = ají + pimentón; calabacita = ahuyama + calabacín. Cebolla es solo de bulbo (la cebolla de rama es otro cultivo). Mora va como zarzamora.
- El sitio del DANE bloquea descargas automáticas: la población se toma de la descarga "Demografía y población" de TerriData (DNP), que publica las mismas proyecciones DANE (urbana + rural).

### Canadá

- 22 productos. Se suman campo e invernadero: la mayor parte del jitomate, pepino y pimiento fresco de Canadá es de invernadero (Ontario). La cifra de campo del jitomate incluye el de industria.
- Donde Statistics Canada suprime una cifra provincial, el resto del total nacional se reparte según la superficie cosechada (marcado como estimado).
- Productos solo de vistas por país: arándano rojo (cranberry) y cereza (`data/productos_paises.js`).

### Perú

- 20 productos. El portal SIEA del MIDAGRI y gob.pe no son accesibles desde fuera de Perú; el repositorio institucional del MIDAGRI sí publica el boletín mensual "El Agro en Cifras". La edición de diciembre trae la producción enero-diciembre por región (cuadro C.18).
- `leer_agro_cifras.py` lee el cuadro con las posiciones de las palabras (las cifras usan espacio como separador de miles) y verifica que la suma de regiones cuadre con el total nacional en cada cultivo.
- Lima incluye Lima Metropolitana (como el departamento del INEI). Chile = ají + piquillo + pimiento.

### España

- 28 productos. Base de datos provincial (hoja `BD_…`) de las tablas globales del MAPA, sumada por comunidad autónoma.
- El tomate incluye el de industria (Extremadura). El plátano de Canarias no está en esas tablas: se asigna a Canarias la producción de FAOSTAT (estimado).
- España reexporta: en aguacate, mango y berries importa más de lo que consume. El mapa limita la parte importada al 100% del consumo y lo indica.

### Italia

- 26 productos. API SDMX del ISTAT (lenta: 1-3 minutos por consulta; las descargas quedan en `data/fuentes/istat/`). Producción cosechada en quintales (÷10 = t), campo e invernadero sumados.
- El tomate incluye el de industria (5.4 de 6.6 Mt). Papa = común + temprana (cuadra con FAOSTAT). Coliflor y brócoli van juntos, como en el ISTAT y la FAO.
- Productos solo de vistas por país: kiwi, mandarina (con clementina) y cereza.

### Turquía

- 30 productos, 81 provincias, cifras oficiales 2025 de TÜİK sin estimaciones propias.
- MEDAS (biruni.tuik.gov.tr/medas) no tiene API ni descarga directa: la consulta (Production Quantity, Tonne, 2025, NUTS3) se hizo en el navegador, se sumó por producto del mapa y se guardó en `data/fuentes/tuik/` con sumas de control que el script verifica.
- 2025 tuvo heladas fuertes: el chabacano (Malatya) y la cereza cayeron mucho respecto a un año normal.
- Productos solo de vistas por país: chabacano y granada (además de mandarina, kiwi y cereza).

### Chile

- 23 productos, 16 regiones. Chile publica por región la **superficie** de frutales y hortalizas, no la producción: la producción nacional de FAOSTAT 2024 se reparte según la superficie oficial (todo marcado como estimado). Papa y tomate industrial tienen producción oficial por región (INE 2024/25).
- Cereza, kiwi y mandarina: producción y comercio 2024 tomados del archivo bruto de FAOSTAT (`data/fuentes/faostat/`), porque no están en `global.js`.
- Sin uva de mesa: la FAO no separa la uva de mesa de la de vino. Sin pomelo: la FAO registra más exportación que producción.
- Población del Censo 2024 (conteo, no proyección). India quedó pendiente: sus tablas por cultivo y estado solo están en agriwelfare.gov.in, que bloquea el acceso desde fuera del país.

### Segunda ronda de países (septiembre 2026)

- **Polonia:** solo frutas (manzana, pera, cereza, fresa, berries) y papa: el GUS no publica hortalizas por especie y voivodato.
- **Filipinas:** 17 regiones productoras más Metro Manila, incluida la nueva Negros Island Region (NIR), que ya aparece en producción y censo. El API de PSA usa el índice del año ("15" = 2025), no el texto.
- **Ecuador:** banano, orito y plátano juntos (partida FAO); incluye maracuyá, tomate de árbol y cebolla blanca.
- **Japón:** el MAFF solo encuesta las prefecturas productoras principales; el resto nacional se reparte por población (estimado).
- **Francia:** incluye regiones de ultramar (plátano de Guadalupe y Martinica). Brócoli y coliflor juntos (Francia exporta mucha coliflor).
- **Australia:** año fiscal 2024-25; uva solo de mesa.
- `subnacional_comun.fao_bruto()` toma producción y comercio de cultivos que no están en `global.js` (cereza, kiwi, mandarina, chabacano) de los archivos brutos mundiales de FAOSTAT, con caché por país.
- **No se pudieron cargar:** China (el anuario ya no publica agricultura por provincia y la base de datos de NBS bloquea el acceso), India (agriwelfare.gov.in bloqueado), Indonesia (BPS con verificación anti-bots; su API requiere clave gratuita), Alemania (datos por cultivo y estado solo en GENESIS con cuenta registrada), Argentina (solo granos por provincia), Marruecos (solo nacional), Sudáfrica y Egipto (sin datos regionales accesibles). Eurostat por regiones solo trae papa y agregados.

### Tercera ronda: Europa (septiembre 2026)

- **Países Bajos:** papa y cebolla publicadas por provincia (CBS 85636NED). Hortalizas de invernadero y campo (jitomate, pimiento, pepino, berenjena), fresa, manzana y pera: cosecha nacional de CBS (37738, 84499NED) repartida por la superficie de cada cultivo en la provincia (80780ned), estimado. Berries, cereza y uva: FAOSTAT 2024 repartido por superficie. Países Bajos reexporta mucho: sus porcentajes de importación superan su consumo.
- **Bélgica:** Statbel bloquea las descargas automáticas (desafío anti-bots), así que se usa Eurostat, cuyas regiones NUTS 2 son las 11 provincias. Papa publicada por provincia (apro_cpshr 2024); el resto, producción nacional de FAOSTAT 2024 repartida por la superficie del grupo de cultivos de la encuesta de explotaciones 2023 (bajo vidrio, aire libre, pepita, hueso, berries): todo estimado y con repartos gruesos.
- **Portugal:** INE, indicador 0013082 (NUTS II versión 2024), 2025, todo publicado. El INE publica las hortalizas solo a nivel nacional: no se incluyen. El jitomate es solo tomate para industria; la uva, solo de mesa. Los contornos de las regiones NUTS 2024 se aproximan con los distritos (Natural Earth no trae las regiones nuevas).
- **Grecia:** ELSTAT, "Areas and production" 2024 (último año publicado), cuadros 02F, 03a, 04 y 05b, todo publicado. Uva solo de mesa; tomate con industria, aire libre e invernadero. Sin aguacate, plátano ni toronja.

### Nueva Zelanda y Corea del Sur

- **Nueva Zelanda:** Stats NZ solo publica por región la superficie de frutales y hortalizas (encuesta 2024 y censo 2022), no la producción. La producción nacional de FAOSTAT 2024 se reparte según esa superficie: todo estimado. Las cifras suprimidas de 2024 reciben el resto nacional según el censo 2022; el tomate pondera ×6 la superficie de invernadero. Durazno y mandarina se omiten (el dato de FAOSTAT no es verosímil).
- **Corea del Sur:** producción oficial por provincia de la Encuesta de producción de cultivos (KOSIS): 2025 en manzana, pera y cebolla; 2024 en el resto. KOSIS bloquea las descargas automáticas: las tablas se leyeron en su página pública (sin cuenta) y se guardaron en `data/fuentes/kr/` con suma de control. Incluye col (repollo y col china), caqui y melón coreano; el chile suma chile rojo seco y verde. Población registrada de junio de 2026, antes de la fusión de Gwangju y Jeolla del Sur.

### Guatemala, Costa Rica y Honduras

- **Honduras:** producción por departamento del Censo Agropecuario Nacional 2024 del INE (año agrícola 2023-2024, preliminar, en toneladas), publicada, salvo banano y plátano: el censo no capta el banano de exportación, así que se usa FAOSTAT 2024 repartido según el censo. Islas de la Bahía no aparece en los cuadros. Población: proyecciones del INE 2024.
- **Costa Rica:** la Encuesta Nacional Agropecuaria del INEC es solo nacional; la producción 2024 (ENA o, donde no se publica, FAOSTAT) se reparte según la superficie por provincia del Censo Agropecuario 2014: todo estimado. inec.cr bloquea las descargas directas; el censo se tomó de la copia que publica la Oficina Nacional Forestal. Población del Censo 2022.
- **Guatemala:** no hay producción de frutas y hortalizas por departamento (la ENA del INE solo cubre granos básicos y cultivos industriales; sus páginas piden hCaptcha y no se usaron). La producción de FAOSTAT 2024 se reparte según la superficie por departamento del Mapa de Cobertura y Uso de la Tierra 2020 del MAGA (El Agro en Cifras 2023), a veces por grupo de cultivos (cítricos, musáceas, hortalizas): todo estimado. En sandía y plátano FAOSTAT registra más exportación que producción. Población: estimaciones del INE 2023.

### Productos solo de vistas por país

`data/productos_paises.js` (`window.PRODUCTOS_PAISES`) define productos que no existen en la vista México ni en FAOSTAT
por separado: tomate de árbol, lulo, maracuyá, uchuva, gulupa, granadilla, mandarina, cebolla de rama (Colombia), arándano rojo y cereza (Canadá), kiwi (Italia), chabacano y granada (Turquía), col y caqui (Nueva Zelanda y Corea).
Se muestran sin comercio: el balance supone que lo producido se consume en el país.

## Vista Estados Unidos

Opción **Estados Unidos** del selector *Ver país…*: la misma lógica que México, por estado.

- **Producción por estado**: USDA NASS Quick Stats 2025, series de mercado fresco (`python scripts/filtrar_nass.py data/fuentes/usda/qs.crops_AAAAMMDD.txt.gz` y luego `python scripts/procesar_usda.py`). NASS solo encuesta estados principales y reserva ("(D)") muchas cifras estatales de mercado fresco: el resto del total nacional se reparte según la superficie del **Censo Agropecuario 2022** (`qs.census2022.txt.gz`, filtrado a `censo2022_frutas_hortalizas.tsv`). Cada estado queda marcado como publicado o estimado.
- Sandía, melón y berenjena (sin encuesta anual de NASS) usan la producción nacional de FAOSTAT repartida con el censo; plátano, mango y piña, solo total nacional.
- **Población 2025**: Census Bureau (`NST-EST2025-ALLDATA.csv`).
- **Consumo aparente** = producción + importación − exportación (FAOSTAT); demanda por estado = población × consumo por persona.
- **Abasto desde México**: exportación de México a EE. UU. (matriz de FAOSTAT). Si México reporta más de lo que EE. UU. registra como importación, se usa la cifra mayor (caso brócoli). En el mapa, la exportación mexicana se reparte entre los estados según su déficit (estimación).
- **Calendario comercial**: embarques semanales del USDA (reporte 1662) por procedencia —producción de EE. UU., cruces de México y puertos de importación por región de origen— con la línea de precio de mayoreo; marca los meses con precio al menos 5% arriba de la mediana. En la vista México (pestaña Producto) y en EE. UU.
- **Competencia en EE. UU.**: importaciones mensuales de EE. UU. por país de origen, UN Comtrade (API pública sin clave, un mes por consulta): `python scripts/procesar_competencia.py 2025` → `data/competencia_eua.js`. Temporada de cada competidor = meses con al menos la mitad de su mes más fuerte. Nuez excluida (EE. UU. la registra en otra subpartida). La API del censo de EE. UU. ya exige clave.
- **De la frontera a cada ciudad**: precio FOB en el cruce + flete en camión refrigerado (USDA National Truck Rate Report, reporte 2375: mediana 2025 por ruta desde Nogales y el sur de Texas a 9 ciudades; ÷ 18,144 kg por carga de 40,000 lb) contra el mayoreo de cada ciudad; se elige el cruce más barato. En el mapa, rutas del cruce a cada ciudad con la tarifa.
- **Precio neto al productor** (pestaña Entidad en México): precio FOB en cada cruce × tipo de cambio 2025 (Reserva Federal, 19.21) menos flete desde la capital del estado con la tarifa del simulador. Es un techo: el FOB incluye empaque, enfriado, agente aduanal y margen del exportador.
  - **Por semana y mejor ventana para vender** (`python scripts/procesar_neto_semanal.py` → `data/neto_semanal.js`, 10 kB, carga diferida): FOB semanal del producto mexicano en cada cruce (USDA 2402/2403, mediana de la semana con al menos 3 cotizaciones) × tipo de cambio de esa semana (FRED DEXMXUS diario) menos el flete al cruce que más deja. Tarifa del estado = tarifa del simulador × (0.6 + 0.4 × diésel del estado / diésel nacional promedio 2025), con el diésel promedio mensual por estado de la CNE (xlsx "Precios promedio diarios y mensuales en estaciones de servicio", cuadro 1.4; se baja el último mes publicado a `data/fuentes/cne/`). Gráfica por semana del año: perfil típico (mediana 2021 al año anterior) y últimos 12 meses; meses de cosecha del estado (avance SIAP). Mejor ventana = las 4 semanas seguidas con mayor neto típico dentro de la cosecha. Solo los 9 productos con precio de frontera del USDA (jitomate, chile, pepino, limón, brócoli, lechuga, zanahoria, uva, melón). FRED se baja con urllib (con curl no responde).
- **Precios de mayoreo (USDA AMS Market News 2025)**: reportes diarios de 11 mercados terminales activos (Atlanta, Baltimore, Boston, Chicago, Columbia, Detroit, Los Ángeles, Miami, Nueva York, Filadelfia, Asheville; frutas, hortalizas, cebolla y papa) y los reportes de punto de embarque de Phoenix, que cotizan el producto mexicano al cruzar por Nogales, McAllen y Otay Mesa (precio FOB). Clave en `.env` como `USDA_AMS_API_KEY` (la misma del COS; HTTP Basic con la clave como usuario). `python scripts/descargar_ams.py 2025` (420 archivos, ~24 MB en `data/fuentes/usda/ams/`) y `python scripts/procesar_ams.py 2025` → `data/precios_eua.js`.
  - Método: precio = punto medio del rango "mostly" (o bajo–alto), sin orgánicos. Un solo empaque de referencia por producto para comparar ciudades, orígenes y meses en US$/kg: el más cotizado con peso conocido o, si el producto mexicano es ≥ 15% de las cotizaciones, su empaque más cotizado. Pesos escritos en el empaque o peso estándar del USDA para cajas por volumen (tabla `ESTANDAR`). La parte de origen mexicano cuenta cotizaciones, no volumen.
  - Mapa (interruptor *Precios USDA*): mercados terminales coloreados por precio frente a la mediana y cruces con México con su precio FOB. Panel *Producto*: precio por ciudad, por origen, por mes y la brecha frontera → mayoreo.
  - Sin precio comparable: coliflor, sandía y piña (sus cajas no traen peso). Sin precio en la frontera: productos que no cruzan por esos puntos o cuya caja no trae peso (aguacate, fresa, mango, berries, espárrago, entre otros).

## Fase global

Tercera opción del selector: **Mundo**. Misma interfaz que Latinoamérica (mapa por país, Resumen, Producto, País y rutas de comercio) con **231 países** y 27 productos, FAOSTAT 2024.

- Datos: `python scripts/procesar_faostat.py global` (archivos `*_E_All_Data.zip`) y `python scripts/procesar_faostat_bilateral.py global` (matriz detallada; solo lo que reporta cada exportador; rutas que suman 95% del volumen, hasta 150 por producto, más las 20 mayores de México).
- Se excluyen los agregados regionales de la FAO y el área "China" (351), que duplica China continental, Hong Kong, Macao y Taiwán.
- Coordenadas: código M49 → ISO2 (catálogo de Comtrade) → centroide (Google DSPL `countries.csv`, en `data/fuentes/faostat/centroides_paises.csv`). Nombres en español con `Intl.DisplayNames` del navegador.
- Ojo: Países Bajos y otros centros logísticos aparecen como grandes exportadores por reexportación (p. ej. aguacate).

## Qué hace hoy (MVP)

| Módulo | Descripción |
|---|---|
| **Mapa** | Burbujas por entidad: tamaño = volumen producido, color = autosuficiencia (déficit → gran abastecedor). Líneas = flujos internos estimados; punteadas moradas = importaciones. |
| **Balance** | Producción, consumo, exportación, importación, % de autosuficiencia nacional y "a cuántos mexicanos alcanza". Destinos de exportación. Ranking de entidades. |
| **Entidad** | Clic en un estado: si se autoabastece, a cuántas personas más surte, quién lo abastece, a dónde manda su excedente y su portafolio completo de productos. Escenario de choque (sequía/expansión). |
| **Municipios** | Botón *Estados / Municipios*: coropleta de 2,475 municipios coloreada por producción, autosuficiencia local o rendimiento (t/ha vs. promedio nacional). Clic en un municipio: producción, lugar nacional, % del estado, rendimiento, valor, cobertura de su población y portafolio de productos. Ranking de municipios en *Balance*. |
| **Precios (SNIIM)** | En *Balance*: precio rural vs. mayoreo, estacionalidad mensual, variedades y centrales más baratas/caras. En el mapa: *Red observada* (estado de origen → central, coloreada por precio). En *Entidad*: quién abastece sus centrales y a qué centrales surte. |
| **Estacionalidad** | En *Balance*: cosecha mensual nacional (Panorama) vs. precio mensual de mayoreo (SNIIM) y al consumidor (PROFECO), correlación precio–cosecha, cobertura de la demanda mes a mes y escenario de escalonamiento de cosecha (siembras escalonadas, invernadero, almacenamiento) con su efecto estimado en la volatilidad del precio. |
| **Simulador** | Consumo, producción, exportaciones, flete y merma. Cadena de precio completa productor → transporte → intermediación → mayoreo → consumidor ("de cada $100, cuánto llega al productor"), con escenarios de reducción de intermediación mayorista, margen minorista y ruta directa. |

34 productos. Hortalizas: jitomate, chile verde/pimiento morrón, papa, cebolla, brócoli, pepino, tomate verde, calabacita,
zanahoria, lechuga, berenjena, coliflor, espárrago y nopal. Frutas: aguacate, limón, naranja, plátano, mango, fresa,
manzana, sandía, melón, papaya, piña, uva, toronja, pera, durazno, arándano, frambuesa, guayaba, nuez pecanera y zarzamora.

Cobertura de fuentes: todos tienen producción SIAP (entidad y municipio). Faltan:
- **Comercio exterior**: tomate verde y nopal (sin fracción propia; van en 070999 "las demás hortalizas"); coliflor y
  guayaba (van en 070410 y 080450, ya asignadas a brócoli y mango: no se duplican). Frambuesa y zarzamora comparten
  081020: su comercio es una **estimación** repartida en proporción a la producción SIAP (`COMPARTIDAS` en
  `procesar_comercio.py`).
- **Panorama** (consumo per cápita oficial y cosecha mensual): zanahoria (sin ficha; usa consumo aparente).
- **SNIIM** (mayoreo): arándano y frambuesa (no están en su catálogo).
- **PROFECO** (consumidor, MXN/kg): lechuga y coliflor (se venden por pieza); arándano, berenjena, espárrago,
  frambuesa y zarzamora (no se registran). Nuez: solo nuez en mitades a granel (sin cáscara).

## Estado de los datos

| Dato | Estado |
|---|---|
| Producción por entidad y municipio, precio medio rural | ✅ **Oficial: SIAP, Cierre agrícola municipal 2025** (`data/fuentes/Cierre_agricola_mun_2025.csv`) |
| Población | ✅ CONAPO, proyección 2025 por entidad; municipal: Censo 2020 (INEGI) escalado con el crecimiento de su entidad |
| Límites municipales | ✅ CONABIO, División política municipal 1:250,000 2023 (derivada del Marco Geoestadístico INEGI), simplificada a ≈100 m — `python scripts/procesar_municipios.py` |
| Exportación, importación (t y USD), países destino y origen | ✅ **Oficial: estadística de comercio exterior de México (INEGI/SE) 2025, vía API de UN Comtrade** — `python scripts/procesar_comercio.py 2025` |
| Precios de mayoreo por central, origen y mes; red de abasto observada | ✅ **Oficial: SNIIM (SE) 2025**, 43 centrales, 53 variedades — `python scripts/procesar_sniim.py 2025` |
| Precio al consumidor por estado, tipo de comercio, variedad y mes | ✅ **Oficial: PROFECO, Quién es Quién en los Precios 2025** (≈450 mil registros, mediana MXN/kg) — `python scripts/procesar_profeco.py data/fuentes/QQP_2025.rar` |
| Consumo anual per cápita | ✅ **Oficial: Panorama Agroalimentario 2025 (SIAP, datos 2024)**, con página de cada ficha — `python scripts/procesar_panorama.py data/fuentes/Panorama_Agroalimentario_2025.pdf 2025` (requiere `pip install pypdf`) |

`data/productos.js` solo conserva valores de respaldo y metadatos (nombre, color, notas); todas las cifras en uso se sobrescriben con las fuentes oficiales.

La demanda = población CONAPO × consumo per cápita oficial (Panorama). En el simulador puede usarse el consumo aparente del
año: (producción SIAP − exportación + importación) ÷ población. En frutas ambos coinciden (±3%); en jitomate (−39%), chile
(−46%) y cebolla (−36%) la producción 2025 cayó respecto a 2024 mientras las exportaciones se mantuvieron.
Limitaciones conocidas: el comercio es solo en fresco (no incluye congelados, jugos ni procesados); algunas fracciones
agrupan productos (080450 mango+guayaba, 070410 brócoli+coliflor, 070993 calabacita+calabaza, 070610 zanahoria+nabo,
080930 durazno+nectarina); en pepino (892 mil t vs. 752 mil t) y calabacita (490 mil t vs. 434 mil t) la exportación
oficial supera la producción SIAP, por lo que esos productos usan el consumo de referencia. En uva, el SIAP no separa
mesa e industria (vino): la producción incluye ambas, mientras el consumo per cápita es el de "uva fruta" del Panorama.
En berenjena la exportación oficial (88 mil t) también supera la producción SIAP (48 mil t). La nuez pecanera no tiene
subpartida propia en el SA: México la reporta en 080231/080232 ("nueces de nogal") y 080299, que se suman (incluyen algo
de nuez de Castilla y mezclan nuez con y sin cáscara, mientras el SIAP reporta nuez con cáscara).

Para actualizar la producción oficial a otro año:

1. Descarga el CSV del *Cierre de la producción agrícola municipal* en https://nube.siap.gob.mx/cierreagricola/
2. Guárdalo en `data/fuentes/`
3. `python scripts/procesar_siap.py data/fuentes/<archivo>.csv`

Esto genera `data/produccion_siap.js` (producción oficial por entidad) y `data/produccion_municipal.js`
(producción, superficie y valor por municipio); ambos se cargan solos.

## Oportunidades, riesgos y comparación internacional

- **Confianza del dato**: cada país y producto muestra "Dato oficial por región" (≥ 90% de las toneladas publicadas por región), "mixto" (30–90%) o "estimado" (< 30%, repartido con superficie, población u otra clave). El selector de países marca con "(estimado)" a los países mayormente estimados.
- **Catálogo internacional ampliado** (Latinoamérica y Mundo, 39 productos): mandarina, cereza, kiwi, chabacano, ciruela, coco, ajo, col, ejote, chile seco, café verde y cacao en grano (grupo "Otros cultivos").
- **Velocidad**: en el sitio, cada archivo del mapa lleva `?v=<huella del contenido>` (lo agrega `scripts/publicar_web.py`) y se guarda en caché un año; los que se cargan después (contornos, historia, municipios) un día. La traducción al inglés solo se descarga si se pide. Los archivos ya viajan comprimidos (brotli).

- **Oportunidad para México** (vista Mundo o Latinoamérica, menú de color): lo que cada país importa y no le compra a México, en valor, con el precio que paga (FAOSTAT 2024, matriz bilateral según lo que reporta el **país comprador**; si no reporta, lo que declara México). Tabla "Dónde puede vender México" en la pestaña Producto. La parte mexicana viene de `data/desde_mexico.js` (85 kB, lo genera `procesar_mercados.py` junto con `mercados.js`); los países fuera de esa lista usan la matriz del exportador (`global_comercio.js`/`latam_comercio.js`).
- **Precio del productor europeo**: precio en empacadora 2025 por país (Comisión Europea, Agri-food data portal, API pública `api.tech.ec.europa.eu/agrifood`; la API anterior se retiró en octubre de 2025) en US$/kg, frente al precio FOB mexicano en la frontera: `python scripts/procesar_precios_ue.py 2025` → `data/precios_ue.js`.
- **Canadá: mayoreo en Toronto y Montreal**: InfoHort (Agriculture and Agri-Food Canada, datos abiertos `od-do.agr.gc.ca`, reporte diario 2023-2027) por país de origen; US$/kg con el peso del empaque y DEXCAUS de FRED; producto mexicano frente a otros orígenes y frente al mayoreo de EE. UU. (no se compara aguacate —peso de caja supuesto—, cebolla ni pepino —otra variedad—); flete estimado con la tarifa por km del USDA. En Exportar, en la ficha de decisión y en la vista de Canadá. Se actualiza cada martes: `python scripts/procesar_precios_canada.py` → `data/precios_canada.js`.
- **Oferta, demanda y rutas en el mundo**: por producto, excedente y faltante de cada país (consumo aparente FAOSTAT), comercio de ida y vuelta, distancia media real y ruta mínima (problema de transporte con programación lineal, scipy) sobre la matriz de comercio de FAOSTAT 2024. Vista Mundo → Producto y México → Balance; resumen en `analisis/oferta_demanda_global.md`. Anual (no entra en la actualización semanal; requiere scipy): `python scripts/analisis_oferta_demanda.py 2024` → `data/oferta_global.js` (carga diferida).
- **Granos y leguminosas** (octubre de 2026): maíz blanco, maíz amarillo, frijol, trigo, sorgo, arroz, soya, cebada y garbanzo, con los mismos procesos que las frutas y hortalizas (producción por estado y municipio, avance mensual y alerta de oferta, costos FIRA, siniestros, consumo por estado ENIGH, PROFECO, SNIIM, FAOSTAT) más:
  - **Maíz por color**: el cierre municipal del SIAP solo publica "maíz grano"; la parte blanca y amarilla de cada estado sale del avance del SIAP por variedad (`procesar_avance_siap.py`, variedades 440 y 438) y se aplica a sus municipios y a los años anteriores.
  - **Balanzas disponibilidad-consumo del SIAP** (`procesar_balanzas_siap.py` → `data/balanzas_siap.js`): oferta y demanda del ciclo comercial con meses estimados (maíz blanco y amarillo, frijol, arroz, trigo panificable y cristalino).
  - **Comercio de granos**: lo que México reporta a Comtrade queda muy por debajo de lo real (maíz 2024: 7.8 contra 23.9 Mt); `procesar_comercio.py` usa la balanza del SIAP o, sin ella, el mayor entre Comtrade y el espejo de FAOSTAT; países de la matriz de FAOSTAT.
  - **USDA PSD** (`procesar_psd.py` → `data/psd_granos.js`): balance y proyección de México y del mundo (México, 1.er importador de maíz).
  - **Precio internacional** (`procesar_precios_granos.py` → `data/precios_granos.js`): Pink Sheet del Banco Mundial (maíz, trigo HRW, arroz tailandés, soya) y FMI vía FRED (cebada); sin serie vigente de sorgo (se usa el maíz).
  - **SNIIM granos**: consulta semanal propia (`ResultadosConsultaFechaGranos.aspx?Semana=&Mes=&Anio=&ProductoId=`), semanas 2 y 4 de cada mes, caché por semana en `data/fuentes/sniim_granos/`.
  - **Pronóstico semanal y alertas de granos**: `procesar_pronostico_sniim.py` pronostica 8 semanas el mayoreo de maíz blanco, frijol, arroz y garbanzo (SNIIM, todas las semanas desde 2022); su historia semanal se guarda en `data/sniim_granos_historia.js` para que la actualización automática solo pida las semanas nuevas. `construir_alertas.py` agrega alertas del precio internacional de granos (±8% en el mes o ±25% contra hace un año; maíz, trigo, arroz, soya y cebada), en el mapa y en el correo.
  - En el mapa: `js/granos.js` (balanza, México y el mundo, precio internacional contra el nacional, de dónde llega la importación); el maíz de las vistas internacionales es "Maíz grano" (FAOSTAT no separa colores).
- **Sequía**: Monitor de Sequía de México (CONAGUA) por municipio, cruzado con la producción municipal del SIAP: parte de la producción de cada producto en municipios con sequía moderada o peor, nacional (pestaña Producto) y por estado (pestaña Entidad); color "Sequía hoy" en la vista de municipios. `python scripts/procesar_sequia.py 2025` → `data/sequia.js`.
- **Embarques semanales por origen** (`js/embarques.js`): cuánto sale cada semana de cada zona productora de EE. UU. (Salinas, Imperial, Yuma, San Joaquín, Florida, Georgia, Washington, Idaho…), de cada cruce con México (Texas, Nogales, Otay Mesa, Calexico/San Luis) y de cada puerto de importación (con sus países de origen). En la vista de EE. UU.: interruptor *Embarques* (círculos del tamaño de lo embarcado en la semana) y sección "Quién abastece a EE. UU. cada semana" en Producto, con selector de semana, comparación con la misma semana del año anterior y las últimas 52 semanas por origen; la misma sección está en Exportar de México. Fuente: USDA AMS, reporte 1662 (National Shipping Point Trends), semanal desde febrero de 2021 (antes la API no lo tiene). El USDA no dice de qué estado de México viene lo que cruza: en Exportar de México se **estima** repartiendo lo que cruzó cada semana entre los estados con excedente (producción SIAP − consumo propio) según su cercanía a cada cruce (peso exp(−km/400)); en aguacate solo Michoacán y Jalisco, los autorizados por EE. UU. Las filas "UNITED STATES" (totales nacionales de papa y cebolla) se omiten porque duplican a los distritos. Los distritos que suman California/Arizona con cruces de México van como "mixto" para no inflar a ninguno.
  - `python scripts/descargar_historia_ams.py 2019` (embarques 1662, frontera 2402/2403 y mayoreo de Los Ángeles, Chicago y Nueva York; lo ya descargado no se vuelve a pedir; el mes en curso se guarda como `.parcial` y se vuelve a pedir la siguiente vez) → `python scripts/procesar_embarques.py` → `data/embarques.js`.
- **Cosecha mensual por estado** (SIAP, Avance de Siembras y Cosechas; `python scripts/procesar_avance_siap.py 2025 12` → `data/avance_siap.js`, carga diferida): la página `nube.agricultura.gob.mx/avance_agricola/` responde a una llamada xajax `reporte` con la situación acumulada al cierre de cada mes por estado (superficie sembrada, cosechada, siniestrada y producción; ciclo OI+PV y perennes, riego+temporal). Cosecha del mes = acumulado del mes − acumulado anterior. Hoy solo es respaldo para repartir lo que cruza cada semana (cosecha del mes − consumo mensual del estado) cuando no hay registro de la SE. Respuestas crudas en `data/fuentes/siap_avance/`.
- **De qué estados viene lo que cruzó** (`js/embarques.js`; `python scripts/procesar_origen_exportacion.py` → `data/origen_exportacion.js`, carga diferida): lo que el USDA reporta por cruce se reparte entre estados con el registro de la Secretaría de Economía (Data México, cubo `economy_foreign_trade_ent`: exportación a EE. UU. por estado, mes y fracción SA, en US$) del mes de la semana; si el mes aún no se publica (~2 meses de retraso), el mismo mes del año anterior. Cada estado se asigna a los cruces por cercanía. La Ciudad de México se quita (domicilio de comercializadoras). Validación (octubre de 2026, 21 productos, ponderado por valor, contra el registro de 2025): el método anterior (excedente mensual SIAP − consumo, por cercanía) coincidía 62% mes a mes y 70% en el año; casi no asignaba nada a Baja California (44% de la cebolla, 45% de la lechuga, 30% de la fresa registradas) y daba a Michoacán el limón persa que exporta Veracruz. El registro del mismo mes del año anterior coincidió 94% mes a mes y 96% en el año; calibrar el método SIAP con factores por estado de 2024 solo llegó a 79%. Ojo: la SE asigna al estado del domicilio del exportador, no al de la huerta. Crudos por año en `data/fuentes/datamexico/`.
- **Pronóstico de 8 semanas del mayoreo en México** (`js/pronostico_sniim.js`; `python scripts/procesar_pronostico_sniim.py` → `data/pronostico_sniim.js`, 38 kB, carga diferida; sección en Producto): mediana semanal del precio frecuente de la variedad principal (si no alcanza, la siguiente; p. ej. mango Ataulfo cuando el Kent apenas empieza) en todas las centrales del SNIIM desde 2019. Mismo método que el pronóstico del USDA (estacionalidad × nivel reciente o persistencia, lo que haya acertado más en la prueba de 104 semanas; banda 20–80%). 32 productos; error mediano 8.5% a 4 semanas y 11% a 8; la estacionalidad mejora en 18 (sobre todo limón, chile, mango, aguacate). El año en curso se vuelve a pedir si la copia tiene más de 6 días; un año de una variedad ≈ 9 MB.
- **Resumen ejecutivo de una línea** (bajo el nombre del producto en Producto): producción y estado líder, parte exportada y destino principal, si alcanza para el consumo y oferta por venir (alerta SIAP). Cada parte en su `<span>` para la traducción.
- **Frescura de los datos** (`python scripts/construir_frescura.py` → `data/frescura.js`; se corre al final de `actualizar_semanal.py` y de `actualizacion_automatica.py`): hasta qué fecha llega cada una de las 16 fuentes, cada cuánto se publica y su retraso normal. Tabla "Qué tan al día están los datos" en Fuentes; el punto de la cabecera se pone ámbar si se atrasa una fuente diaria, semanal o mensual.
- **Carga diferida real** (`Seccion.alAbrir` en `js/secciones.js`): historia de 10 años (936 kB), embarques y pronóstico del USDA (~400 kB), precio neto semanal y pronóstico del SNIIM se bajan hasta que se abre su sección; mientras, el resumen de la sección dice "Ábrela para ver…".
- **Revisión automática** (`node scripts/qa_mapa.mjs [--rapido]`): abre Chrome sin pantalla por el protocolo DevTools (sin instalar nada; Node 22+) con su propio servidor en el puerto 8093, recorre ~20 vistas a 1280 y 375 px con todas las secciones abiertas y revisa errores de consola, desborde horizontal en teléfono y textos sin traducir al inglés (`Idioma.pendientes()`). Informe en `analisis/qa_<fecha>.md`; plantillas pendientes en `data/fuentes/plantillas_pendientes.json` para `scripts/traducir_en.py`. Sale con código 1 si encuentra algo. Falsos positivos conocidos: siglas (USDA, SIAP), nombres de cruces y los requisitos de acceso, que se traducen con sus campos `_en`.
- **Consumo por estado (ENIGH 2024)** (`python scripts/procesar_enigh.py` → `data/consumo_regional.js`, 12 kB): kilos comprados por los hogares en la semana de referencia (tabla gastoshogar, claves de la nueva serie, con factor de expansión) entre población (concentradohogar) por producto y estado; índice frente al nacional, acercado a 1 con pocos hogares (K = 40) y acotado a 0.4–2.5. `js/modelo.js` multiplica la demanda de cada estado por su índice y reescala para que la demanda nacional no cambie. Se puede apagar en el simulador ("Consumo por estado"); la pestaña Entidad muestra el índice. Ej.: jitomate Tlaxcala 1.5×, Chihuahua 0.41× (solo 40% de sus hogares compró jitomate en la semana, contra 80% en Tlaxcala). Mide compras de hogares: no restaurantes ni industria. Zip de 103 MB en `data/fuentes/enigh/`.
- **Helada y lluvia fuerte en los próximos días** (`js/clima.js`; `python scripts/procesar_clima_smn.py` → `data/clima_smn.js`, 24 kB; sección en Producto): pronóstico POR HORA del SMN por municipio (`webservices/?method=3`; el diario, `method=1`, devuelve fechas de 2023) → temperatura mínima y lluvia NETA de cada día completo (la lluvia horaria trae ~14% de negativos que compensan al valor anterior; sumar solo positivos infla varias veces) cruzado con la producción municipal del SIAP: parte de la producción con helada (≤ 0 °C), riesgo de helada (≤ 3 °C), lluvia fuerte (≥ 25 mm) y muy fuerte (≥ 50 mm), y municipios con más producción afectada. Vence: el mapa lo muestra solo si se generó hace 3 días o menos. **Se actualiza solo a diario en el sitio**: GitHub Actions en collecta_web (`.github/workflows/clima-smn.yml`, 13:15 UTC = 7:15 en CDMX, y a mano con "Run workflow") corre `scripts/clima_smn.py` (copia de este script que hace `publicar_web.py`) con `--datos` e `--index`: regenera `clima_smn.js`, la fila del SMN en `frescura.js` y las huellas `?v=` en `index.html`, y hace commit si cambió (Vercel despliega). Por eso, antes de publicar a mano hay que hacer `git pull` en collecta_web: `publicar_web.py` se detiene si origin/main tiene commits nuevos, y si el clima del sitio es más reciente que el del proyecto lo trae al proyecto (y regenera la frescura) antes de copiar.
- **Adenda 2026 del reporte** (`reporte/hallazgos-agroalimentarios.html`, sección 16): origen real de lo exportado (SE), lo que reportan los compradores (Canadá, EE. UU.), mejor ventana para vender y diésel, qué tanto se puede anticipar el precio (SNIIM y alerta de siembras), consumo por estado (ENIGH) y clima (SMN).
- **Movimientos de la semana** (`js/alertas.js`; `python scripts/construir_alertas.py` → `data/alertas_precio.js`, en `actualizar_semanal.py`): por producto, precio en EE. UU. (USDA) o en México (SNIIM) ±15% en dos semanas o ±30% contra las mismas 4 semanas del año anterior; pronóstico a 8 semanas ±20% (solo si su error típico a 8 semanas es menor a 30%); lo que cruzó de México en dos semanas ±30% contra un año antes (≥ 1,000 t). No se usa el "nivel contra lo normal" del pronóstico: compara pesos de hoy con años atrás y la inflación lo sesga. Bloque en Resumen (8 productos con el movimiento más fuerte) y lista bajo la línea ejecutiva de cada producto. **Correo semanal**: GitHub Actions en collecta_web (`.github/workflows/alertas-correo.yml`, martes 22:00 UTC = 16:00 CDMX, después de la actualización semanal, y a mano con "Run workflow") corre `scripts/enviar_alertas.py` (copia de este proyecto que hace `publicar_web.py`) con `--datos public/mapa-agroalimentario/data`: HTML + texto plano por Gmail SMTP (smtp.gmail.com:465). Secretos del repo: `GMAIL_USUARIO`, `GMAIL_CLAVE_APP` (contraseña de aplicación de Google) y `ALERTAS_PARA` (separados por coma; van en copia oculta). Sin secretos no envía y deja un aviso. Las alertas las renueva la actualización semanal automática (abajo); si tienen más de 9 días, el correo lo advierte al principio. Vista previa sin enviar: `python scripts/enviar_alertas.py --datos data --prueba salida.html`.
- **La mejor ciudad cada mes** (sección "De la frontera a cada ciudad"): `procesar_ams.py` guarda medianas mensuales por ciudad (`mercadosMes`) y por cruce (`crucesMes`); con el flete mensual de cada ruta se elige cada mes la ciudad con mayor diferencia entre mayoreo y lo que cuesta llegar.
- **Pérdidas por siniestro en 10 años** (`js/siniestros.js`; `python scripts/procesar_siniestros.py` → `data/siniestros.js`, 30 kB; sección en Producto y dato en Entidad): superficie siniestrada ÷ sembrada por año, producto, estado y modalidad (riego/temporal) con los cierres municipales 2016–2025 del SIAP. Sin causa (el cierre no la trae). Excluye filas municipales que parecen errores de captura: siembran más de 3× su mediana de otros años y pierden ≥ 90% (p. ej. calabacita 2025 en Valle de Santiago, Gto.: 7,100 ha y 7,087 siniestradas); quedan listadas en `excluidos`. Pérdidas típicas: 0.5–1.5% en hortalizas; perennes casi sin registro.
- **Costo de producción contra precio al productor** (`js/costos.js`; `python scripts/procesar_costos_fira.py` → `data/costos_fira.js`; sección en Producto, dato en Entidad y en la mejor ventana de exportación): FIRA Agrocostos (archivo completo `https://www.fira.gob.mx/Nd/agrocosto_data_completa.csv`, 2015–2022; trae nombres de personal de FIRA que NO se copian) → CostoUnitario ($/t) del año más reciente por producto, estado y tipo (agricultura protegida o cielo abierto, según su "Modalidad"), sin establecimiento ni años pre-productivos ni rendimientos < 0.5 t/ha (errores). Llevado a pesos de hoy con el índice de precios de la OCDE vía FRED (hasta julio de 2024) y después la inflación anual de 2025 (aproximación: INEGI y Banxico piden clave). Contra el precio medio rural SIAP 2025 del estado. FIRA advierte que no es representativo del estado.
- **Actualización semanal automática** (GitHub Actions en collecta_web, `.github/workflows/actualizacion-semanal.yml`, martes 20:00 UTC = 14:00 CDMX): `publicar_web.py` mantiene en `collecta_web/mapa/` un espejo del proyecto (scripts, js, css, img, reporte, `data/*.js`, `data/geo`, `index.html`; sin `data/fuentes` ni `.env`). El flujo corre ahí `actualizar_semanal.py` (la clave del USDA va en el secreto `USDA_AMS_API_KEY`; `descargar_ams.clave()` la lee de la variable de entorno o de `.env`), guarda las descargas crudas en la caché de Actions (`mapa/data/fuentes`, ~300 MB), publica con `publicar_web.py "$GITHUB_WORKSPACE"` y hace commit. La primera vez (o si se pierde la caché): "Run workflow" con `inicial` = true baja la historia (USDA desde 2019, SE desde 2021; SNIIM desde 2019 lo baja solo). El clima diario y la semanal comparten el grupo de concurrencia `mapa-datos` y hacen `git pull --rebase` antes de push. Al publicar a mano: primero `git -C <collecta_web> pull`; `publicar_web.py` trae al proyecto los archivos de `AUTOMATICOS` cuando la copia del sitio tiene un "generado" más reciente o del mismo día. Si corregiste y regeneraste esos datos a mano el mismo día, publica con `--sin-traer` para que no los reemplace.
- **Sequía automática** (`python scripts/actualizar_sequia.py`, paso de `actualizar_semanal.py`): baja `MunicipiosSequia.xlsx` de la CONAGUA (quincenal) y corre `procesar_sequia.py` con el año anterior; entra cada martes con la actualización de GitHub. Ya no hace falta la tarea mensual de Windows para la sequía.
- **Alertas por producto y destinatario** (`scripts/enviar_alertas.py`): el secreto `ALERTAS_PARA` acepta el formato simple ("a@x.com, b@y.com": todos reciben todo) o con filtro ("a@x.com: jitomate, aguacate; b@y.com; c@z.com: limón"; nombre del mapa o clave, con o sin acentos, basta el inicio). Se manda un correo por cada combinación de productos (copia oculta). Si nadie de una lista tiene movimientos, el correo lo dice. Producto no reconocido → aviso en Actions; si ninguno se reconoce, recibe todo. Prueba sin enviar: `--prueba salida.html --para "..."`.
- **Planear la venta** (`js/planeador.js`; pestaña Exportar con un estado elegido): con el volumen del año (por omisión 1% de la producción del estado) y el margen del mayorista (25% por omisión, 0–50%), compara cada mes exportar (neto típico en la frontera, `PreciosEUA.netoMensual`) contra la mejor central de abasto (precio SNIIM del año × estacionalidad del mes × (1 − margen) − flete; solo centrales con ≥ 200 cotizaciones) y reparte el volumen según la cosecha mensual del estado (avance SIAP). Sin el margen, el mercado nacional ganaba siempre porque el SNIIM registra el precio de reventa del mayorista y el FOB es la primera venta.
- **Ficha de decisión** (inicio de la pestaña Exportar, `fichaDecision` en `js/app.js`): acceso y arancel a EE. UU. (`data/acceso.js`), neto por kg exportando (`PreciosEUA.netoMejor`, con antidumping si aplica) contra neto típico en el mercado nacional (`Planeador.centralAnual`: mediana de las centrales con ≥ 200 cotizaciones, mayoreo − 25% de margen − flete; la mejor plaza aparte) y los mejores meses con producto mexicano (≥ 10% de lo embarcado).
- **Precios no comparables** (`Paleta.precioNoComparable`): pera, durazno y nuez no calculan "de cada $100 al productor" (otra variedad o presentación entre rural, mayoreo y consumidor).
- **Alerta de oferta** (`js/alerta.js`; `python scripts/procesar_alerta_oferta.py` → `data/alerta_oferta.js`): con el avance de siembras y cosechas del SIAP al último corte publicado (hoy, 31 de agosto de 2026) contra el **promedio de los dos años anteriores al mismo corte** (un solo año atípico no dispara la alerta). Cultivos cíclicos: superficie por cosechar (sembrada − cosechada − siniestrada), lo que falta por salir al mercado; perennes: producción acumulada a la fecha. Mide oferta, no precio: la prueba 2019–2026 (`python scripts/backtest_alerta.py`, resultados en `analisis/`, no se publica) no encontró relación con el precio de mayoreo en EE. UU. 0–16 semanas después, por eso no entra al pronóstico. Niveles: ≥ +15% riesgo alto de sobreoferta, +5 a +15% más oferta, ±5% similar, −5 a −15% menos oferta, ≤ −15% posible escasez; sin señal si la base es menor a 500 ha por cosechar o 5,000 t. Aparece como bloque "Lo que viene en los próximos meses" en Resumen (México), como sección en Producto (tabla de 3 años y por estado) y como color del mapa de estados (*Oferta por venir (SIAP)*; enlace `me=oferta`). Primer corte: más oferta en sandía (+40%), calabacita (+32%) y pepino (+14%); menos en coliflor, zanahoria, chile (−26%), melón, lechuga y cebolla (−20%). Es un indicador, no un pronóstico: no considera rendimientos, clima ni demanda. Se actualiza con `actualizar_semanal.py` (el mes que el SIAP aún no publica no se guarda).
- **Pronóstico de 8 semanas** (sección en Exportar de México y de EE. UU.): precio semanal de referencia (el mismo empaque del mapa, mayoreo de LA/Chicago/NY o FOB en la frontera) y oferta por origen (EE. UU., México, importación). Método explicable: la misma semana en años anteriores × el nivel de las últimas cuatro semanas frente a esas semanas en otros años (factor acotado 0.5–2). La banda 20–80% y el error medio (MAPE a 1, 4 y 8 semanas) salen de probar el mismo método sobre los dos últimos años; si el error es alto, la sección lo dice. `python scripts/procesar_pronostico.py` → `data/pronostico.js`. Actualizar cada semana (el USDA publica los lunes): `python scripts/actualizar_semanal.py` (descarga el año en curso, procesa embarques y pronóstico) y publicar. Resultado de la prueba hacia atrás (septiembre 2026): a 1–3 semanas "el precio no cambia" acierta igual o mejor, así que se usa el último precio; la estacionalidad mejora a 5–8 semanas en jitomate, limón, durazno, lechuga, fresa, pera, melón, naranja y berenjena (p. ej. limón a 8 semanas: 35% de error contra 52%; durazno 21% contra 43%). Error a 4 semanas: de 3% (manzana) a 38% (calabacita, fresa).
- **Vista por mercado de destino** (`js/mercado.js`, pestaña Exportar en todas las vistas): selector de país comprador (70 que más importan; destacados EE. UU., Canadá, Alemania, Reino Unido, Francia, Países Bajos, España, Japón, China y Corea), y enlace desde cada fila de "Dónde puede vender México" y desde la pestaña Exportar de cada país. Muestra cuánto importa y a qué precio medio, la parte y el lugar de México entre sus proveedores, **productos con oportunidad** (compra al menos US$5 M fuera de México, México ya exporta al menos US$20 M de ese producto y el acceso no está cerrado; se ordenan por lo que compra fuera de México y por lo que paga frente al precio medio de exportación de México; "con condiciones" pesa menos), el producto elegido con sus proveedores y su acceso, todo lo que importa, a quién le compra (suma de productos) y acceso/arancel por producto si el país está entre los 7 mercados revisados. Solo frutas y hortalizas (sin café ni cacao). En Mundo y Latinoamérica el país se resalta en el mapa con sus rutas. Enlace: `t=exportar&mc=<M49>` (ej. `#v=global&p=jitomate&t=exportar&mc=276`).
  - Datos: `python scripts/procesar_mercados.py 2024` → `data/mercados.js` (522 kB, carga diferida): matriz detallada de FAOSTAT según lo que reporta el **país comprador** (5610/5622); si no reporta un producto, lo que declaran sus proveedores (espejo). 135 compradores con al menos US$20 M al año; 8 proveedores mayores por producto más "otros" (México siempre se conserva).
  - Desde octubre de 2026 "Dónde puede vender México" usa la misma fuente. Antes usaba lo que reportan los exportadores, y en Canadá la diferencia era grande: Canadá registra US$322 M de berries y US$116 M de fresa comprados a México, que la matriz del exportador casi no registra. También sube la parte mexicana de las berries en EE. UU. (52% según EE. UU., contra ~27% según México).
- **Acceso a mercados** (pestaña Producto en México y en Mundo; columna "Acceso" en "Dónde puede vender México"): matriz de 29 productos frescos × 7 mercados (EE. UU., Canadá, UE, Reino Unido, Japón, China, Corea) con situación (abierto / con condiciones / cerrado), requisito principal, arancel para origen México y la URL de cada dato, en español e inglés. `python scripts/construir_acceso.py` → `data/acceso.js` (tabla curada; fuentes crudas en `data/fuentes/acceso/`). Fuentes: USDA APHIS ACIR y USITC HTS; CFIA AIRS y CBSA; Reglamento (UE) 2019/2072 y Access2Markets; DEFRA y UK Trade Tariff; MAFF y Aduana de Japón; GACC y arancel de China 2026; APQA y arancel de Corea. "Abierto" en UE, Japón y Corea = no figura como prohibido ni con requisitos especiales. No incluye límites de residuos, normas de comercialización ni registro de huertos. Consulta: septiembre de 2026.
- **Historia de 10 años**: `python scripts/procesar_historia.py` → `data/historia.js` (carga diferida por `js/historia.js`).
- **Actualización anual**: `python scripts/actualizar_todo.py <año>` corre las fuentes que se descargan solas (comercio de México, SNIIM, USDA AMS, competencia, precios de la UE, sequía) y lista las que requieren descarga manual. No publica.
- Pendientes: Alemania (GENESIS exige registro), Indonesia (BPS bloquea el acceso; los archivos de data.go.id apuntan a una dirección interna 10.42.0.15).

## Fuentes evaluadas para siguientes fases (septiembre 2026)

- **Comercio por estado:** Data México (API tesseract en `https://www.economia.gob.mx/apidatamexico/tesseract/`; el dominio `api.datamexico.org` ya no resuelve), cubo `economy_foreign_trade_ent`: exportación mensual por estado y HS6 en USD, a julio de 2026. Sin kg y sin aduana; el estado es el del domicilio de la empresa (sale Aguascalientes exportando tomate).
- **Aduanas:** no hay datos abiertos de aduana × fracción. INEGI (cubo OLAP de la balanza comercial mensual, fracción/NICO × país con cantidad, a jul-2026) y Banxico (cubo de comercio exterior) son interactivos; el detalle por aduana solo está en el laboratorio de microdatos de INEGI. ANAM publica informes mensuales en PDF sin producto. SIAVI se quedó en nov-2021.
- **Frontera en tiempo casi real:** BTS Border Crossing Entry Data (Socrata `keg4-3bc2`, sin clave): camiones por puerto y mes (ago-2026). UN Comtrade (vista previa pública, sin clave): importaciones mensuales de EE. UU. desde México en toneladas (jul-2026).
- **Semillas:** no hay estadística pública de semilla vendida (SNICS solo publica el catálogo de variedades en PDF; SENASICA no publica permisos). Lo más cercano: importación de semilla de hortalizas (HS 120991, Comtrade: US$478 M en 2024) y, mejor, la **superficie sembrada** del avance mensual del SIAP.
- **Consumo:** ENIGH 2024 (INEGI, microdatos CSV), USDA ERS Food Availability (hasta 2022), hojas de balance de FAOSTAT.
- **Choques de oferta:** pronóstico municipal del SMN (JSON), Monitor de Sequía (ya integrado); niveles de presas de CONAGUA bloqueados por un sistema anti-bots (no se usan). Diésel por estación (CRE/CNE, XML).
- Requieren clave o cuenta (no se usan): API de comercio del Census, USDA FAS GATS, Banxico SIE, INEGI BIE, NASS Quick Stats (el archivo masivo de NASS sí es libre).

## Estructura

```
index.html            interfaz
css/styles.css
js/modelo.js          balance oferta-demanda, asignación de flujos y costos logísticos
js/app.js             mapa (Leaflet), paneles y simulador
js/secciones.js       secciones plegables de los paneles (título + resumen de una línea)
js/recorrido.js       modo presentación (#tour)
js/mercado.js         vista por mercado de destino (data/mercados.js, scripts/procesar_mercados.py)
js/alerta.js          alerta de oferta (data/alerta_oferta.js, scripts/procesar_alerta_oferta.py)
js/embarques.js       embarques semanales por origen, origen estimado por estado y pronóstico (data/embarques.js, data/pronostico.js, data/origen_exportacion.js, data/avance_siap.js)
js/comparar.js        comparar lado a lado (data/historia_estados.js, scripts/procesar_historia_estados.py)
js/paleta.js          escala de color del mapa, carga de contornos, coropletas y rutas animadas
js/precios_eua.js     precios de mayoreo de EE. UU., frontera, calendario comercial, competencia y precio neto
js/precios_ue.js      precio del productor europeo frente a México
js/precios_canada.js  mayoreo en Toronto y Montreal por origen (InfoHort)
js/oferta_global.js   oferta, demanda y rutas de comercio en el mundo (FAOSTAT)
js/granos.js          granos: balanza SIAP, balance USDA, precio internacional e importación
js/sequia.js          riesgo de sequía (CONAGUA) sobre la producción municipal
js/historia.js        series de 10 años y "quién crece y quién cae"
js/idioma.js          versión en inglés (plantillas de data/traduccion_en.js)
data/precios_eua.js   precios USDA AMS procesados
data/geo/             contornos por país y de países (scripts/construir_geo.py, Natural Earth)
img/isotipo-color.png isotipo de Collecta
data/estados.js       población INEGI 2020, coordenadas, centrales de abasto
data/municipios_geo.js      polígonos + población municipal (carga diferida)
data/produccion_municipal.js  t, ha cosechadas y valor por municipio (SIAP)
data/comercio_oficial.js    exportación/importación oficial
js/municipal.js       vista municipal
js/precios.js         precios de mayoreo y red observada
js/estacionalidad.js  cosecha mensual vs. precios, cobertura mensual y escalonamiento
js/resumen.js         tablero nacional y catálogo de productos
js/latam.js           vista Latinoamérica (FAOSTAT)
data/latam.js         datos FAOSTAT procesados por país y producto
data/latam_comercio.js  rutas de comercio bilateral (FAOSTAT)
data/global.js        datos FAOSTAT de todos los países
data/global_comercio.js  rutas de comercio mundiales
data/precios_sniim.js precios SNIIM procesados
data/precios_consumidor.js  precios PROFECO procesados
data/consumo_oficial.js     consumo per cápita (Panorama) y población CONAPO
data/productos.js     metadatos y valores de respaldo por producto
scripts/procesar_siap.py  ingesta de datos oficiales SIAP
servidor.js           servidor local de desarrollo
```

## Hoja de ruta

1. **Datos oficiales** — ✅ SIAP municipal, ✅ comercio exterior, ✅ SNIIM, ✅ PROFECO, ✅ Panorama Agroalimentario + CONAPO.
2. ~~**Vista municipal**~~ ✅ — pendiente: separar pimiento morrón de chiles (el SIAP municipal no publica variedad).
3. **Estacionalidad** — producción mensual (SIAP avance de siembras y cosechas): una entidad puede ser excedentaria en enero y deficitaria en julio.
4. **Red real de distribución** — volúmenes de entrada a centrales de abasto (SNIIM), red carretera (RNC-IMT) y tiempos de traslado.
5. **Optimización** — programación lineal de transporte con capacidades, cadena de frío y centros de acopio regionales; escenarios de precio al consumidor.
6. **LATAM y global** — FAOSTAT y UN Comtrade con la misma lógica de balance por país.
