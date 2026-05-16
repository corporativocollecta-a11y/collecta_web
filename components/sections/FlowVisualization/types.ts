export type PhaseId = 'siembra' | 'empaque' | 'logistica' | 'cliente';

export interface Phase {
  id: PhaseId;
  index: number;
  label: string;
  title: string;
  description: string;
  image: string;
  imageAlt?: string; // optional alternate background (e.g. green field for Phase 1)
  metric?: { value: string; label: string };
  durationMs: number; // total time this phase plays before advancing
  subLabels: string[]; // labels for each subphase, displayed above the canvas
}

export const PHASES: Phase[] = [
  {
    id: 'siembra',
    index: 0,
    label: 'Siembra',
    title: 'Habilitamos la producción',
    description:
      'Aportamos semilla, fertilizantes y agroquímicos al productor. La parcela se prepara, se siembra, se riega y se cosecha bajo nuestro protocolo.',
    image: '/flow/phase1.png',
    imageAlt: '/flow/phase1-green.png',
    metric: { value: '0%', label: 'deuda para el productor' },
    durationMs: 14000,
    subLabels: ['Aplicación de insumos', 'Riego y crecimiento', 'Cosecha en marcha'],
  },
  {
    id: 'empaque',
    index: 1,
    label: 'Empaque',
    title: 'Operación integrada',
    description:
      'El producto llega a nuestra bodega. Se lava, desinfecta, empaca y se conserva en frío bajo estándares corporativos antes de cargarse al destino.',
    image: '/flow/phase2.png',
    metric: { value: '<4h', label: 'campo a frío' },
    durationMs: 16000,
    subLabels: [
      'Recepción de producto',
      'Insumos postcosecha',
      'Lavado, desinfección y empaque',
      'Conservación en frío',
      'Carga para embarque',
    ],
  },
  {
    id: 'logistica',
    index: 2,
    label: 'Logística',
    title: 'Distribución trazable',
    description:
      'El embarque sale rumbo al cliente con seguimiento GPS y manejo de cadena fría. Cada lote conserva su historia desde origen.',
    image: '/flow/phase3.png',
    metric: { value: '100%', label: 'cadena fría monitoreada' },
    durationMs: 9000,
    subLabels: ['Embarque en ruta', 'Trazabilidad activa'],
  },
  {
    id: 'cliente',
    index: 3,
    label: 'Cliente',
    title: 'Trazabilidad confirmada',
    description:
      'El cliente recibe la mercancía y verifica origen, lote y manejo escaneando el QR de cada caja. Visto bueno emitido y ciclo cerrado.',
    image: '/flow/phase4.png',
    metric: { value: '100%', label: 'lotes con QR auditable' },
    durationMs: 10000,
    subLabels: ['Entrega al cliente', 'Trazabilidad verificada'],
  },
];

export const PHASE_COUNT = PHASES.length;

// Brand color palette (matches design system + the IA images)
export const FLOW_COLORS = {
  cream: '#FAF8F5',
  beige: '#F5F2ED',
  earth: '#8B6B3A',
  earthDark: '#5C4628',
  earthLight: '#C8A878',
  earthSoil: '#A47A4A',
  goldLight: '#F59E0B',
  gold: '#F59E0B',
  goldDark: '#F59E0B',
  leaf: '#7A8B5C',
  leafDark: '#556B3F',
  leafLight: '#A8B888',
  ink: '#2A2A2A',
  inkSoft: '#4A4A4A',
  line: '#3A3A3A',
  slate: '#5B7BA6',
  slateLight: '#8FA8C2',
  frost: '#D6E8F2',
} as const;

export const STROKE = {
  thin: 1.2,
  medium: 1.8,
  bold: 2.4,
} as const;

// Canvas viewBox — matches the 16:9 aspect of the IA images
export const VIEW_W = 1200;
export const VIEW_H = 675;
