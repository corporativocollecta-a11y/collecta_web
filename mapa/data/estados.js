// Entidades federativas de México
// Población: INEGI, Censo de Población y Vivienda 2020.
// lat/lon: principal centro de consumo de la entidad (se usa para calcular distancias logísticas).
window.ESTADOS = [
  { id: "01", abr: "AGS",  nombre: "Aguascalientes",      pob: 1425607,  lat: 21.88, lon: -102.29 },
  { id: "02", abr: "BC",   nombre: "Baja California",     pob: 3769020,  lat: 32.52, lon: -116.40 },
  { id: "03", abr: "BCS",  nombre: "Baja California Sur", pob: 798447,   lat: 24.14, lon: -110.31 },
  { id: "04", abr: "CAMP", nombre: "Campeche",            pob: 928363,   lat: 19.85, lon: -90.53 },
  { id: "05", abr: "COAH", nombre: "Coahuila",            pob: 3146771,  lat: 25.42, lon: -101.00 },
  { id: "06", abr: "COL",  nombre: "Colima",              pob: 731391,   lat: 19.24, lon: -103.72 },
  { id: "07", abr: "CHIS", nombre: "Chiapas",             pob: 5543828,  lat: 16.75, lon: -93.12 },
  { id: "08", abr: "CHIH", nombre: "Chihuahua",           pob: 3741869,  lat: 28.63, lon: -106.07 },
  { id: "09", abr: "CDMX", nombre: "Ciudad de México",    pob: 9209944,  lat: 19.43, lon: -99.13 },
  { id: "10", abr: "DGO",  nombre: "Durango",             pob: 1832650,  lat: 24.02, lon: -104.66 },
  { id: "11", abr: "GTO",  nombre: "Guanajuato",          pob: 6166934,  lat: 20.95, lon: -101.35 },
  { id: "12", abr: "GRO",  nombre: "Guerrero",            pob: 3540685,  lat: 17.55, lon: -99.50 },
  { id: "13", abr: "HGO",  nombre: "Hidalgo",             pob: 3082841,  lat: 20.10, lon: -98.76 },
  { id: "14", abr: "JAL",  nombre: "Jalisco",             pob: 8348151,  lat: 20.67, lon: -103.35 },
  { id: "15", abr: "MEX",  nombre: "Estado de México",    pob: 16992418, lat: 19.35, lon: -99.45 },
  { id: "16", abr: "MICH", nombre: "Michoacán",           pob: 4748846,  lat: 19.70, lon: -101.19 },
  { id: "17", abr: "MOR",  nombre: "Morelos",             pob: 1971520,  lat: 18.92, lon: -99.23 },
  { id: "18", abr: "NAY",  nombre: "Nayarit",             pob: 1235456,  lat: 21.50, lon: -104.89 },
  { id: "19", abr: "NL",   nombre: "Nuevo León",          pob: 5784442,  lat: 25.67, lon: -100.31 },
  { id: "20", abr: "OAX",  nombre: "Oaxaca",              pob: 4132148,  lat: 17.06, lon: -96.72 },
  { id: "21", abr: "PUE",  nombre: "Puebla",              pob: 6583278,  lat: 19.04, lon: -98.20 },
  { id: "22", abr: "QRO",  nombre: "Querétaro",           pob: 2368467,  lat: 20.59, lon: -100.39 },
  { id: "23", abr: "QROO", nombre: "Quintana Roo",        pob: 1857985,  lat: 21.16, lon: -86.85 },
  { id: "24", abr: "SLP",  nombre: "San Luis Potosí",     pob: 2822255,  lat: 22.15, lon: -100.98 },
  { id: "25", abr: "SIN",  nombre: "Sinaloa",             pob: 3026943,  lat: 24.80, lon: -107.39 },
  { id: "26", abr: "SON",  nombre: "Sonora",              pob: 2944840,  lat: 29.07, lon: -110.96 },
  { id: "27", abr: "TAB",  nombre: "Tabasco",             pob: 2402598,  lat: 17.99, lon: -92.93 },
  { id: "28", abr: "TAMS", nombre: "Tamaulipas",          pob: 3527735,  lat: 24.50, lon: -98.60 },
  { id: "29", abr: "TLAX", nombre: "Tlaxcala",            pob: 1342977,  lat: 19.32, lon: -98.24 },
  { id: "30", abr: "VER",  nombre: "Veracruz",            pob: 8062579,  lat: 19.40, lon: -96.60 },
  { id: "31", abr: "YUC",  nombre: "Yucatán",             pob: 2320898,  lat: 20.97, lon: -89.62 },
  { id: "32", abr: "ZAC",  nombre: "Zacatecas",           pob: 1622138,  lat: 22.77, lon: -102.58 }
];

// Principales centrales de abasto (nodos de acopio y redistribución)
window.CENTRALES = [
  { id: "CEDA",  nombre: "Central de Abasto CDMX (Iztapalapa)", lat: 19.37, lon: -99.09 },
  { id: "GDL",   nombre: "Mercado de Abastos Guadalajara",      lat: 20.65, lon: -103.37 },
  { id: "MTY",   nombre: "Central de Abasto Estrella, Monterrey", lat: 25.73, lon: -100.25 }
];

// Principal punto de entrada de importaciones terrestres (para cubrir déficits)
window.PUERTA_IMPORT = { nombre: "Nuevo Laredo (aduana)", lat: 27.48, lon: -99.51 };
