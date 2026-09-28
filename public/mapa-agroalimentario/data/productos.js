// ============================================================================
// METADATOS Y VALORES DE RESPALDO POR PRODUCTO
// ----------------------------------------------------------------------------
// Nombre, tipo, color y notas de cada producto (34: 13 originales + 21 añadidos con datos 2025).
// Las cifras numéricas de este archivo son valores de respaldo (los 13 originales: aproximaciones
// ref. 2023; los 21 añadidos: tomados de las salidas oficiales 2025) y SOLO se usan si falta el
// archivo oficial correspondiente; index.html carga después los datos oficiales que las sobrescriben:
//   data/produccion_siap.js    producción por entidad y precio rural (SIAP)
//   data/comercio_oficial.js   exportación, importación y países (INEGI/SE vía Comtrade)
//   data/consumo_oficial.js    consumo per cápita (Panorama SIAP) y población (CONAPO)
//   data/precios_sniim.js      precios de mayoreo (SNIIM)
//   data/precios_consumidor.js precios al consumidor (PROFECO)
// Unidades: toneladas (t), kg/persona/año, MXN/kg.
// ============================================================================
window.PRODUCTOS = {
  jitomate: {
    nombre: "Jitomate", tipo: "Hortaliza", color: "#d9463b",
    nacional: 3380000, consumoPC: 13.0, exportacion: 1900000, importacion: 5000,
    precioRural: 9, precioConsumidor: 26,
    destinos: { "Estados Unidos": 0.985, "Canadá": 0.012, "Otros": 0.003 },
    estados: { "25": 720000, "24": 330000, "16": 270000, "14": 200000, "32": 190000, "02": 160000,
               "26": 150000, "22": 90000, "17": 110000, "08": 110000, "21": 100000, "05": 100000,
               "11": 90000, "20": 80000, "18": 40000, "15": 60000, "13": 40000, "19": 30000 }
  },
  chile: {
    nombre: "Chile verde y pimiento morrón", tipo: "Hortaliza", color: "#3f9b3a",
    nacional: 3200000, consumoPC: 15.5, exportacion: 1150000, importacion: 20000,
    precioRural: 10, precioConsumidor: 30,
    destinos: { "Estados Unidos": 0.975, "Canadá": 0.02, "Otros": 0.005 },
    nota: "El SIAP reporta el pimiento morrón dentro de 'Chile verde' y el archivo municipal no separa variedades. En comercio, la fracción 070960 incluye chiles y pimientos.",
    estados: { "08": 820000, "25": 620000, "32": 330000, "24": 200000, "26": 190000, "14": 170000,
               "16": 150000, "11": 110000, "03": 100000, "28": 80000, "10": 70000, "02": 60000,
               "22": 40000, "31": 30000, "21": 30000, "13": 20000 }
  },
  aguacate: {
    nombre: "Aguacate", tipo: "Fruta", color: "#5b7b2a",
    nacional: 2970000, consumoPC: 8.0, exportacion: 1250000, importacion: 2000,
    precioRural: 25, precioConsumidor: 60,
    destinos: { "Estados Unidos": 0.80, "Canadá": 0.07, "Japón": 0.05, "España/Países Bajos": 0.04, "Otros": 0.04 },
    estados: { "16": 2150000, "14": 300000, "15": 150000, "18": 70000, "17": 60000, "12": 40000,
               "21": 30000, "07": 20000, "30": 15000, "20": 15000 }
  },
  limon: {
    nombre: "Limón", tipo: "Fruta", color: "#9bc53d",
    nacional: 3100000, consumoPC: 15.0, exportacion: 800000, importacion: 2000,
    precioRural: 9, precioConsumidor: 30,
    destinos: { "Estados Unidos": 0.92, "Países Bajos": 0.03, "Reino Unido": 0.02, "Otros": 0.03 },
    estados: { "16": 850000, "30": 820000, "20": 290000, "06": 280000, "28": 150000, "12": 110000,
               "31": 90000, "27": 80000, "14": 80000, "21": 70000, "24": 60000, "04": 30000, "07": 30000 }
  },
  naranja: {
    nombre: "Naranja", tipo: "Fruta", color: "#f28c28",
    nacional: 4800000, consumoPC: 30.0, exportacion: 60000, importacion: 50000,
    precioRural: 3.5, precioConsumidor: 20,
    destinos: { "Estados Unidos": 0.90, "Otros": 0.10 },
    nota: "Una parte relevante se destina a jugo (exportación de jugo concentrado no incluida en fresco).",
    estados: { "30": 2400000, "28": 470000, "24": 360000, "19": 280000, "21": 270000, "31": 190000,
               "26": 150000, "27": 130000, "20": 100000, "13": 80000, "04": 60000, "22": 30000, "07": 50000 }
  },
  platano: {
    nombre: "Plátano", tipo: "Fruta", color: "#e8c547",
    nacional: 2500000, consumoPC: 14.5, exportacion: 600000, importacion: 5000,
    precioRural: 5, precioConsumidor: 22,
    destinos: { "Estados Unidos": 0.85, "Otros": 0.15 },
    estados: { "07": 820000, "27": 620000, "30": 280000, "16": 180000, "06": 160000, "20": 110000,
               "14": 90000, "18": 80000, "12": 70000, "21": 40000 }
  },
  mango: {
    nota: "La fracción arancelaria 080450 agrupa mango, guayaba y mangostán; el mango representa la gran mayoría.",
    nombre: "Mango", tipo: "Fruta", color: "#f5a623",
    nacional: 2300000, consumoPC: 11.0, exportacion: 430000, importacion: 1000,
    precioRural: 7, precioConsumidor: 30,
    destinos: { "Estados Unidos": 0.85, "Canadá": 0.11, "Japón": 0.02, "Otros": 0.02 },
    estados: { "25": 450000, "12": 400000, "18": 330000, "07": 250000, "20": 230000, "16": 200000,
               "30": 130000, "14": 100000, "06": 70000, "17": 30000, "28": 30000 }
  },
  papa: {
    nota: "Importación: solo papa fresca y para siembra (0701). Las papas congeladas/procesadas (2004.10) no están incluidas y son un volumen importante.",
    nombre: "Papa", tipo: "Hortaliza", color: "#a67c52",
    nacional: 1900000, consumoPC: 17.5, exportacion: 10000, importacion: 550000,
    precioRural: 9, precioConsumidor: 28,
    destinos: { "Estados Unidos": 0.6, "Otros": 0.4 },
    origenImport: "Estados Unidos (fresca y procesada)",
    estados: { "26": 400000, "25": 370000, "30": 150000, "15": 140000, "08": 130000, "21": 120000,
               "19": 110000, "16": 100000, "11": 80000, "05": 60000, "14": 60000, "29": 40000, "07": 40000 }
  },
  cebolla: {
    nombre: "Cebolla", tipo: "Hortaliza", color: "#b983c9",
    nacional: 1700000, consumoPC: 9.5, exportacion: 420000, importacion: 30000,
    precioRural: 7, precioConsumidor: 25,
    destinos: { "Estados Unidos": 0.99, "Otros": 0.01 },
    estados: { "08": 330000, "32": 180000, "28": 180000, "02": 140000, "21": 130000, "11": 110000,
               "16": 100000, "17": 70000, "26": 60000, "14": 60000, "24": 60000, "15": 40000, "01": 30000 }
  },
  brocoli: {
    nota: "Comercio: fracción 070410 (brócoli y coliflor en fresco). El brócoli congelado (071080) no está incluido.",
    nombre: "Brócoli", tipo: "Hortaliza", color: "#2e7d4f",
    nacional: 720000, consumoPC: 1.8, exportacion: 400000, importacion: 2000,
    precioRural: 7, precioConsumidor: 35,
    destinos: { "Estados Unidos": 0.95, "Canadá": 0.03, "Otros": 0.02 },
    estados: { "11": 480000, "16": 70000, "21": 50000, "14": 40000, "26": 25000, "32": 15000,
               "22": 15000, "01": 10000 }
  },
  fresa: {
    nombre: "Fresa", tipo: "Fruta", color: "#e0245e",
    nacional: 600000, consumoPC: 2.2, exportacion: 220000, importacion: 3000,
    precioRural: 20, precioConsumidor: 60,
    destinos: { "Estados Unidos": 0.97, "Canadá": 0.02, "Otros": 0.01 },
    estados: { "16": 380000, "02": 110000, "11": 55000, "14": 25000, "15": 15000, "03": 7000 }
  },
  pepino: {
    nota: "Comercio: fracción 070700 (pepinos y pepinillos).",
    nombre: "Pepino", tipo: "Hortaliza", color: "#6fbf73",
    nacional: 1100000, consumoPC: 2.3, exportacion: 800000, importacion: 1000,
    precioRural: 5, precioConsumidor: 20,
    destinos: { "Estados Unidos": 0.99, "Otros": 0.01 },
    estados: { "25": 380000, "26": 250000, "16": 100000, "02": 60000, "17": 40000, "14": 40000,
               "11": 30000, "31": 20000, "24": 20000 }
  },
  manzana: {
    nombre: "Manzana", tipo: "Fruta", color: "#c0392b",
    nacional: 720000, consumoPC: 8.0, exportacion: 1000, importacion: 300000,
    precioRural: 12, precioConsumidor: 45,
    destinos: { "Estados Unidos": 1.0 },
    origenImport: "Estados Unidos, Chile",
    estados: { "08": 560000, "05": 80000, "10": 45000, "21": 25000, "30": 5000, "32": 5000 }
  },
  tomate_verde: {
    nota: "Tomate verde o tomatillo (Physalis). No tiene fracción arancelaria propia (va dentro de 070999, 'las demás hortalizas'), por lo que no hay exportación/importación oficial por producto; se asume comercio exterior nulo.",
    nombre: "Tomate verde", tipo: "Hortaliza", color: "#9fb83a",
    nacional: 666292, consumoPC: 3.8, exportacion: 0, importacion: 0,
    precioRural: 6.29, precioConsumidor: 38,
    destinos: {},
    estados: { "25": 133000, "32": 74000, "14": 72000, "21": 58000, "15": 47000, "16": 44000, "18": 40000, "11": 27000, "26": 20000, "02": 19000, "13": 17000, "30": 15000 }
  },
  calabacita: {
    nota: "Comercio: fracción 070993 (calabazas en fresco, incluye calabaza madura y calabacita). La exportación oficial supera la producción SIAP de calabacita, por lo que el balance usa el consumo per cápita del Panorama.",
    nombre: "Calabacita", tipo: "Hortaliza", color: "#3a8f7a",
    nacional: 433961, consumoPC: 0.535, exportacion: 489801, importacion: 3264,
    precioRural: 6.73, precioConsumidor: 35,
    destinos: {"Estados Unidos": 0.9462, "Japón": 0.0514, "Otros": 0.0024},
    estados: { "26": 99000, "21": 65000, "25": 38000, "16": 31000, "13": 30000, "32": 22000, "14": 20000, "31": 19000, "17": 18000, "15": 14000, "11": 13000, "20": 12000 }
  },
  zanahoria: {
    nota: "El Panorama Agroalimentario 2025 no incluye ficha de zanahoria: el consumo per cápita es de respaldo (consumo aparente 2025 = producción − exportación + importación). Comercio: fracción 070610 (zanahorias y nabos).",
    nombre: "Zanahoria", tipo: "Hortaliza", color: "#ed7d31",
    nacional: 359270, consumoPC: 1.2, exportacion: 204001, importacion: 476,
    precioRural: 4.29, precioConsumidor: 15,
    destinos: {"Estados Unidos": 0.9472, "Canadá": 0.0372, "Honduras": 0.015, "Otros": 0.0006},
    estados: { "21": 103000, "11": 87000, "32": 71000, "15": 26000, "29": 19000, "01": 10000, "26": 8000, "30": 7000, "22": 6000, "02": 6000, "28": 5000, "16": 5000 }
  },
  lechuga: {
    nota: "Comercio: fracciones 070511 y 070519 (lechuga repollada y demás lechugas). PROFECO la registra por pieza, por lo que no hay precio al consumidor por kg; el valor de respaldo es aproximado.",
    nombre: "Lechuga", tipo: "Hortaliza", color: "#b5d99c",
    nacional: 510062, consumoPC: 2.3, exportacion: 285345, importacion: 63722,
    precioRural: 5.66, precioConsumidor: 28,
    destinos: {"Estados Unidos": 0.9895, "Canadá": 0.0101},
    estados: { "11": 139000, "32": 84000, "21": 72000, "01": 60000, "26": 43000, "02": 38000, "22": 20000, "24": 13000, "15": 12000, "16": 9000, "29": 7000, "14": 6000 }
  },
  sandia: {
    nombre: "Sandía", tipo: "Fruta", color: "#e8455f",
    nacional: 1251639, consumoPC: 4.0, exportacion: 432463, importacion: 694,
    precioRural: 5.56, precioConsumidor: 19,
    destinos: {"Estados Unidos": 1.0},
    estados: { "08": 288000, "26": 228000, "30": 131000, "14": 113000, "12": 83000, "18": 59000, "20": 56000, "25": 42000, "04": 37000, "07": 35000, "16": 26000, "05": 26000 }
  },
  melon: {
    nota: "Comercio: fracción 080719 (melones distintos de la sandía).",
    nombre: "Melón", tipo: "Fruta", color: "#f2c57c",
    nacional: 601438, consumoPC: 3.7, exportacion: 111923, importacion: 17093,
    precioRural: 6.47, precioConsumidor: 34,
    destinos: {"Estados Unidos": 0.9972, "Otros": 0.0028},
    estados: { "10": 175000, "16": 131000, "12": 112000, "05": 53000, "26": 53000, "20": 19000, "06": 17000, "08": 14000, "18": 6000, "11": 5000, "14": 4000, "24": 4000 }
  },
  papaya: {
    nombre: "Papaya", tipo: "Fruta", color: "#ff8a5c",
    nacional: 1151033, consumoPC: 7.1, exportacion: 230417, importacion: 0,
    precioRural: 7.22, precioConsumidor: 39,
    destinos: {"Estados Unidos": 0.9895, "Canadá": 0.0105},
    estados: { "20": 313000, "06": 212000, "07": 158000, "30": 127000, "16": 126000, "12": 56000, "14": 35000, "24": 27000, "04": 19000, "28": 18000, "18": 14000, "31": 12000 }
  },
  pina: {
    nombre: "Piña", tipo: "Fruta", color: "#b8962e",
    nacional: 1744484, consumoPC: 9.6, exportacion: 62800, importacion: 73,
    precioRural: 6.03, precioConsumidor: 32,
    destinos: {"Estados Unidos": 1.0},
    estados: { "30": 1325000, "20": 199000, "18": 65000, "27": 61000, "06": 38000, "14": 35000, "23": 11000, "07": 8000, "04": 2000, "12": 449, "28": 322, "13": 280 }
  },
  uva: {
    nota: "SIAP reporta 'Uva' sin separar mesa e industria (vino); el consumo per cápita es de la ficha 'Uva fruta' del Panorama. Comercio: fracción 080610 (uva fresca; excluye pasas).",
    nombre: "Uva", tipo: "Fruta", color: "#6a3d9a",
    nacional: 527114, consumoPC: 2.2, exportacion: 200394, importacion: 138568,
    precioRural: 26.52, precioConsumidor: 90,
    destinos: {"Estados Unidos": 0.9887, "Otros": 0.0113},
    estados: { "26": 341000, "32": 94000, "02": 35000, "14": 25000, "01": 14000, "05": 5000, "11": 5000, "22": 4000, "18": 2000, "08": 1000, "24": 906, "21": 485 }
  },
  toronja: {
    nota: "Comercio: fracción 080540 (toronjas y pomelos).",
    nombre: "Toronja", tipo: "Fruta", color: "#e98a9b",
    nacional: 472392, consumoPC: 3.6, exportacion: 6719, importacion: 6763,
    precioRural: 5.26, precioConsumidor: 39,
    destinos: {"Estados Unidos": 0.9985, "Otros": 0.0015},
    estados: { "30": 281000, "16": 78000, "28": 48000, "31": 22000, "19": 18000, "26": 13000, "21": 8000, "25": 1000, "27": 857, "14": 672, "10": 417, "03": 394 }
  },
  pera: {
    nota: "Producción nacional muy pequeña: el consumo se cubre sobre todo con importaciones (EE. UU., Argentina).",
    nombre: "Pera", tipo: "Fruta", color: "#c5d86d",
    nacional: 26242, consumoPC: 0.781, exportacion: 34, importacion: 55839,
    precioRural: 6.7, precioConsumidor: 60,
    destinos: {"Belice": 1.0},
    estados: { "21": 13000, "16": 6000, "17": 2000, "30": 2000, "07": 805, "15": 509, "09": 298, "20": 265, "13": 230, "10": 210, "32": 124, "12": 101 }
  },
  durazno: {
    nota: "Comercio: fracción 080930 (duraznos, incluidos griñones y nectarinas).",
    nombre: "Durazno", tipo: "Fruta", color: "#f4a582",
    nacional: 260449, consumoPC: 2.2, exportacion: 5, importacion: 35623,
    precioRural: 11.96, precioConsumidor: 98,
    destinos: {"Belice": 1.0},
    estados: { "32": 95000, "08": 38000, "16": 31000, "21": 20000, "15": 16000, "07": 12000, "29": 10000, "12": 7000, "01": 7000, "17": 5000, "20": 4000, "10": 4000 }
  },
  arandano: {
    nota: "Comercio: fracción 081040 (arándanos y demás Vaccinium). SNIIM y PROFECO no lo cotizan: sin precio de mayoreo ni al consumidor oficial; los valores de respaldo son aproximados.",
    nombre: "Arándano", tipo: "Fruta", color: "#3d5a98",
    nacional: 86284, consumoPC: 0.101, exportacion: 51583, importacion: 89,
    precioRural: 56.61, precioConsumidor: 170,
    destinos: {"Estados Unidos": 0.9479, "Japón": 0.028, "Canadá": 0.0237},
    estados: { "14": 32000, "25": 24000, "16": 11000, "11": 8000, "02": 5000, "21": 2000, "18": 2000, "06": 1000, "15": 182, "29": 14 }
  },
  berenjena: {
    nota: "Comercio: fracción 070930. La exportación oficial 2025 supera la producción SIAP, por lo que el balance usa el consumo per cápita del Panorama. PROFECO no la registra (precio al consumidor de respaldo aproximado).",
    nombre: "Berenjena", tipo: "Hortaliza", color: "#5b2a6e",
    nacional: 47957, consumoPC: 0.062, exportacion: 87672, importacion: 0,
    precioRural: 10.76, precioConsumidor: 73,
    destinos: {"Estados Unidos": 0.9947, "Otros": 0.0053},
    estados: { "25": 28000, "18": 10000, "26": 4000, "31": 2000, "12": 2000, "24": 1000, "03": 160, "17": 146, "21": 104 }
  },
  coliflor: {
    nota: "Sin comercio exterior propio: la coliflor va en la fracción 070410 junto con el brócoli, que ya la tiene asignada (no se duplica). PROFECO la registra por pieza, sin precio por kg (valor de respaldo aproximado).",
    nombre: "Coliflor", tipo: "Hortaliza", color: "#bfae86",
    nacional: 87465, consumoPC: 0.338, exportacion: 0, importacion: 0,
    precioRural: 6.65, precioConsumidor: 45,
    destinos: {},
    estados: { "11": 28000, "13": 16000, "21": 14000, "32": 6000, "16": 5000, "22": 5000, "01": 4000, "02": 3000, "24": 3000, "26": 2000, "14": 1000, "29": 365 }
  },
  esparrago: {
    nota: "Comercio: fracción 070920. PROFECO no lo registra (precio al consumidor de respaldo aproximado).",
    nombre: "Espárrago", tipo: "Hortaliza", color: "#7c9a2e",
    nacional: 298434, consumoPC: 1.3, exportacion: 94457, importacion: 8,
    precioRural: 45.2, precioConsumidor: 238,
    destinos: {"Estados Unidos": 0.9999},
    estados: { "26": 169000, "03": 49000, "11": 45000, "02": 14000, "22": 10000, "16": 3000, "25": 3000, "05": 1000, "01": 1000, "10": 972, "08": 468, "14": 371 }
  },
  frambuesa: {
    nota: "Comercio ESTIMADO: la fracción 081020 agrupa frambuesa, zarzamora y moras; su volumen y valor se reparten entre frambuesa y zarzamora en proporción a la producción SIAP 2025 (mismos destinos). SNIIM y PROFECO no la cotizan (precios de respaldo aproximados).",
    nombre: "Frambuesa", tipo: "Fruta", color: "#a8325e",
    nacional: 166124, consumoPC: 0.357, exportacion: 50124, importacion: 0,
    precioRural: 51.43, precioConsumidor: 154,
    destinos: {"Estados Unidos": 0.8602, "Alemania": 0.0581, "Países Bajos": 0.0189, "Japón": 0.0174, "España": 0.0151, "Otros": 0.0303},
    estados: { "14": 110000, "16": 30000, "02": 20000, "11": 4000, "21": 2000, "15": 138, "06": 40, "29": 17, "09": 6 }
  },
  guayaba: {
    nota: "Sin comercio exterior propio: la guayaba va en la fracción 080450 junto con el mango, que ya la tiene asignada (no se duplica).",
    nombre: "Guayaba", tipo: "Fruta", color: "#d17a5c",
    nacional: 310149, consumoPC: 2.2, exportacion: 0, importacion: 0,
    precioRural: 7.78, precioConsumidor: 55,
    destinos: {},
    estados: { "16": 202000, "01": 65000, "32": 24000, "15": 10000, "14": 3000, "12": 2000, "11": 1000, "10": 677, "21": 438, "06": 386, "07": 335, "18": 277 }
  },
  nopal: {
    nota: "Nopalitos (nopal verdura; excluye nopal forrajero). Sin fracción arancelaria propia (va dentro de 070999, 'las demás hortalizas'): sin comercio exterior oficial.",
    nombre: "Nopal", tipo: "Hortaliza", color: "#26a69a",
    nacional: 789690, consumoPC: 5.9, exportacion: 0, importacion: 0,
    precioRural: 4.51, precioConsumidor: 44,
    destinos: {},
    estados: { "17": 369000, "09": 168000, "15": 72000, "21": 37000, "16": 30000, "14": 30000, "01": 22000, "32": 15000, "28": 11000, "11": 8000, "02": 7000, "13": 6000 }
  },
  nuez: {
    nota: "Nuez pecanera con cáscara (SIAP). El SA no tiene subpartida propia: México la reporta sobre todo en 080231/080232 ('nueces de nogal', con y sin cáscara) más 080299; incluye algo de nuez de Castilla y mezcla nuez con y sin cáscara. Precio PROFECO: nuez en mitades a granel (sin cáscara).",
    nombre: "Nuez pecanera", tipo: "Fruta", color: "#8b5a2b",
    nacional: 176348, consumoPC: 1.2, exportacion: 46749, importacion: 17533,
    precioRural: 77.29, precioConsumidor: 343,
    destinos: {"Estados Unidos": 0.937, "China": 0.0318, "Países Bajos": 0.0197, "Reino Unido": 0.0055, "Otros": 0.006},
    estados: { "08": 105000, "26": 27000, "05": 21000, "10": 13000, "13": 3000, "19": 3000, "21": 1000, "24": 961, "01": 701, "32": 466, "20": 426, "14": 393 }
  },
  zarzamora: {
    nota: "Comercio ESTIMADO: la fracción 081020 agrupa frambuesa, zarzamora y moras; su volumen y valor se reparten entre frambuesa y zarzamora en proporción a la producción SIAP 2025 (mismos destinos). PROFECO no la registra (precio al consumidor de respaldo aproximado).",
    nombre: "Zarzamora", tipo: "Fruta", color: "#2d1e4a",
    nacional: 275963, consumoPC: 1.4, exportacion: 83265, importacion: 0,
    precioRural: 33.34, precioConsumidor: 78,
    destinos: {"Estados Unidos": 0.8602, "Alemania": 0.0581, "Países Bajos": 0.0189, "Japón": 0.0174, "España": 0.0151, "Otros": 0.0303},
    estados: { "16": 246000, "14": 22000, "02": 3000, "25": 2000, "06": 2000, "26": 800, "21": 614, "11": 233, "15": 143, "17": 38, "22": 16, "09": 15 }
  }
};
