// ============================================================================
// Productos que solo aparecen en las vistas por país (motor común, js/subnacional.js).
// No tienen datos de México (SIAP) ni partida propia en FAOSTAT: no entran en las vistas México, Latinoamérica ni Mundo.
// ============================================================================
window.PRODUCTOS_PAISES = {
  tomate_arbol: { nombre: "Tomate de árbol", tipo: "Fruta", color: "#c2410c" },
  lulo:         { nombre: "Lulo", tipo: "Fruta", color: "#e0a526" },
  maracuya:     { nombre: "Maracuyá", tipo: "Fruta", color: "#b58900" },
  uchuva:       { nombre: "Uchuva", tipo: "Fruta", color: "#f59e0b" },
  gulupa:       { nombre: "Gulupa", tipo: "Fruta", color: "#6b2d5c" },
  granadilla:   { nombre: "Granadilla", tipo: "Fruta", color: "#d4a017" },
  mandarina:    { nombre: "Mandarina", tipo: "Fruta", color: "#f97316" },
  cebolla_rama: { nombre: "Cebolla de rama", tipo: "Hortaliza", color: "#65a30d" },
  arandano_rojo: { nombre: "Arándano rojo (cranberry)", tipo: "Fruta", color: "#b91c1c" },
  cereza:       { nombre: "Cereza", tipo: "Fruta", color: "#9f1239" },
  kiwi:         { nombre: "Kiwi", tipo: "Fruta", color: "#7c8f2e" },
  chabacano:    { nombre: "Chabacano (albaricoque)", tipo: "Fruta", color: "#f4a340" },
  granada:      { nombre: "Granada", tipo: "Fruta", color: "#be123c" },
  col:          { nombre: "Col (repollo y col china)", tipo: "Hortaliza", color: "#4d7c0f" },
  caqui:        { nombre: "Caqui", tipo: "Fruta", color: "#ea580c" },
  ciruela:      { nombre: "Ciruela", tipo: "Fruta", color: "#7e22ce" },
  coco:         { nombre: "Coco", tipo: "Fruta", color: "#a16207" },
  ajo:          { nombre: "Ajo", tipo: "Hortaliza", color: "#d6d3d1" },
  maiz:         { nombre: "Maíz grano", tipo: "Grano", color: "#e9c46a" },   // vistas internacionales (FAOSTAT no separa colores)
  ejote:        { nombre: "Ejote", tipo: "Hortaliza", color: "#16a34a" },
  chile_seco:   { nombre: "Chile seco", tipo: "Hortaliza", color: "#991b1b" },
  cafe:         { nombre: "Café", tipo: "Otro", color: "#78350f" },
  cacao:        { nombre: "Cacao", tipo: "Otro", color: "#7c2d12" }
};
