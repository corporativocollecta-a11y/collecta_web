'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { HorizontalTimeline, type TimelineStep } from '@/components/ui/HorizontalTimeline';

// Canvas-based animation is client-only; lazy load to keep it out of the SSR bundle.
const NetworkBackdrop = dynamic(() => import('@/components/3d/NetworkBackdrop'), { ssr: false });
const HeroParticleField = dynamic(() => import('@/components/3d/HeroParticleField'), { ssr: false });

// Supply-process icons — drawn on a 24x24 grid, currentColor strokes so the
// HorizontalTimeline can recolor them through the node's text color.
// Each icon now has a subtle Framer Motion animation that loops forever and
// matches the metaphor of the stage (chart drawing, sprout swaying, truck
// rolling).

const sharedSvgProps = {
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  preserveAspectRatio: 'xMidYMid meet' as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// PLANEACIÓN COMERCIAL — animated dashboard
// • Three bars grow & morph in a staggered loop ("market is reshaping").
// • A line plot draws itself across the top, pulsing every cycle.
// • A bright cursor dot slides along the line trajectory.
// ─────────────────────────────────────────────────────────────────────────────
const IconClipboardChart = (
  <svg {...sharedSvgProps}>
    {/* Axes */}
    <line x1={3} y1={20} x2={21} y2={20} />
    <line x1={3} y1={20} x2={3} y2={5} opacity={0.55} />

    {/* Bar 1 — shortest */}
    <motion.rect
      x={6}
      width={2.4}
      rx={0.5}
      animate={{ height: [4, 8, 5, 9, 4], y: [16, 12, 15, 11, 16] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
    />
    {/* Bar 2 — middle */}
    <motion.rect
      x={10}
      width={2.4}
      rx={0.5}
      animate={{ height: [7, 5, 11, 8, 7], y: [13, 15, 9, 12, 13] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
    />
    {/* Bar 3 — tallest */}
    <motion.rect
      x={14}
      width={2.4}
      rx={0.5}
      animate={{ height: [10, 12, 8, 14, 10], y: [10, 8, 12, 6, 10] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
    />

    {/* Trend line — draws & undraws */}
    <motion.path
      d="M6 11 L11 7 L15 9 L19 5"
      stroke="currentColor"
      strokeOpacity={0.85}
      initial={{ pathLength: 0 }}
      animate={{ pathLength: [0, 1, 1, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.5, 0.85, 1], ease: 'easeInOut' }}
    />

    {/* Cursor dot following the trend line */}
    <motion.circle
      r={1.3}
      fill="currentColor"
      animate={{ cx: [6, 11, 15, 19, 6], cy: [11, 7, 9, 5, 11] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
    />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// EJECUCIÓN EN ORIGEN — sprout grows from soil
// • Water drop falls, stem extends upward, then two leaves unfurl in sequence.
// • Sun in the corner pulses with rays. Full cycle restarts after a beat.
// ─────────────────────────────────────────────────────────────────────────────
const IconFieldSprout = (
  <svg {...sharedSvgProps}>
    {/* Ground */}
    <line x1={3} y1={20} x2={21} y2={20} />
    <path d="M3 20s2-1 4-1 4 1 6 1 4-1 6-1 2 1 2 1" opacity={0.45} />

    {/* Sun — pulsing core */}
    <motion.circle
      cx={20}
      cy={5}
      r={1.5}
      fill="currentColor"
      animate={{ scale: [1, 1.35, 1], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: '20px 5px' }}
    />
    {/* Sun rays */}
    {[0, 45, 90, 135].map((deg) => (
      <motion.line
        key={deg}
        x1={20}
        y1={2}
        x2={20}
        y2={3}
        stroke="currentColor"
        strokeOpacity={0.7}
        style={{ transformOrigin: '20px 5px', transform: `rotate(${deg}deg)` }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: deg / 360 }}
      />
    ))}

    {/* Falling water drop — repeats every cycle */}
    <motion.circle
      cx={12}
      r={0.9}
      fill="currentColor"
      animate={{ cy: [4, 18, 18], opacity: [0, 1, 0] }}
      transition={{ duration: 4, repeat: Infinity, times: [0, 0.18, 0.2], ease: 'easeIn' }}
    />

    {/* Stem — grows up after the drop hits */}
    <motion.line
      x1={12}
      y1={20}
      x2={12}
      stroke="currentColor"
      initial={{ y2: 20 }}
      animate={{ y2: [20, 20, 11, 11, 20] }}
      transition={{ duration: 4, repeat: Infinity, times: [0, 0.2, 0.55, 0.92, 1], ease: 'easeOut' }}
    />

    {/* Right leaf — unfurls after stem reaches mid-height */}
    <motion.path
      d="M12 12c0-3 2-5 5-5 0 3-2 5-5 5z"
      style={{ transformOrigin: '12px 12px' }}
      animate={{
        scale: [0, 0, 1, 1.05, 1, 0],
        opacity: [0, 0, 1, 1, 1, 0],
        rotate: [-15, -15, 0, 4, -4, -15],
      }}
      transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.6, 0.75, 0.92, 1], ease: 'easeOut' }}
    />

    {/* Left leaf — slightly later than the right leaf */}
    <motion.path
      d="M12 14c0-3-2-5-5-5 0 3 2 5 5 5z"
      style={{ transformOrigin: '12px 14px' }}
      animate={{
        scale: [0, 0, 1, 1.05, 1, 0],
        opacity: [0, 0, 1, 1, 1, 0],
        rotate: [15, 15, 0, -4, 4, 15],
      }}
      transition={{ duration: 4, repeat: Infinity, times: [0, 0.55, 0.7, 0.82, 0.92, 1], ease: 'easeOut' }}
    />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// EMPAQUE Y ENTREGA — truck rolling with speed lines + exhaust puff
// • Truck body bobs subtly while wheels spin fast.
// • Speed lines stream from the back, fading in/out.
// • Exhaust puff rises and fades on a loop.
// ─────────────────────────────────────────────────────────────────────────────
const IconBoxTruck = (
  <svg {...sharedSvgProps}>
    {/* Speed lines streaming from the back */}
    <motion.line
      x1={1}
      y1={9}
      x2={4}
      y2={9}
      stroke="currentColor"
      strokeOpacity={0.8}
      animate={{ x1: [3, 0, 3], x2: [5, 2, 5], opacity: [0, 1, 0] }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'easeOut' }}
    />
    <motion.line
      x1={0.5}
      y1={13}
      x2={3.5}
      y2={13}
      stroke="currentColor"
      strokeOpacity={0.6}
      animate={{ x1: [2.5, -0.5, 2.5], x2: [4.5, 1.5, 4.5], opacity: [0, 1, 0] }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
    />
    <motion.line
      x1={1}
      y1={16}
      x2={4}
      y2={16}
      stroke="currentColor"
      strokeOpacity={0.5}
      animate={{ x1: [3, 0, 3], x2: [5, 2, 5], opacity: [0, 1, 0] }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'easeOut', delay: 0.55 }}
    />

    {/* Truck body — gentle vertical bob (suspension feel) */}
    <motion.g
      animate={{ y: [0, -0.4, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <rect x={4} y={7} width={11} height={9} rx={1} />
      <path d="M15 10h3l2.5 3V16H15" />
      <line x1={4} y1={10.5} x2={15} y2={10.5} opacity={0.5} />
    </motion.g>

    {/* Wheels — fast spinning rim spokes */}
    <motion.g
      style={{ transformOrigin: '8px 18px' }}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
    >
      <circle cx={8} cy={18} r={1.8} />
      <line x1={8} y1={16.4} x2={8} y2={19.6} strokeOpacity={0.55} />
      <line x1={6.4} y1={18} x2={9.6} y2={18} strokeOpacity={0.55} />
    </motion.g>
    <motion.g
      style={{ transformOrigin: '17px 18px' }}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
    >
      <circle cx={17} cy={18} r={1.8} />
      <line x1={17} y1={16.4} x2={17} y2={19.6} strokeOpacity={0.55} />
      <line x1={15.4} y1={18} x2={18.6} y2={18} strokeOpacity={0.55} />
    </motion.g>

    {/* Exhaust puff — rises and fades from the cab */}
    <motion.circle
      cx={21.5}
      cy={11}
      r={0.7}
      fill="currentColor"
      animate={{ cy: [11, 7, 7], r: [0.5, 1.2, 1.4], opacity: [0, 0.65, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
    />
  </svg>
);

const SUPPLY_STEPS: TimelineStep[] = [
  {
    icon: IconClipboardChart,
    title: 'Planeación comercial',
    description:
      'Definimos productos, volúmenes, calibres, especificaciones y ventanas de entrega para estructurar el abasto.',
  },
  {
    icon: IconFieldSprout,
    title: 'Ejecución en origen',
    description:
      'Seleccionamos parcelas, asignamos producción e integramos supervisión técnica y tecnología en campo.',
  },
  {
    icon: IconBoxTruck,
    title: 'Empaque y entrega',
    description:
      'Coordinamos empaque, cadena de frío y envío al punto de entrega acordado.',
  },
];

// Step icons for the 4-stage flow (Producción / Empacado / Trazabilidad / Logística)
const IconProduccion = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" preserveAspectRatio="xMidYMid meet">
    {/* Satellite body */}
    <rect x={10} y={10} width={4} height={4} rx={0.5} />
    {/* Solar panels */}
    <rect x={2} y={9} width={6} height={6} rx={0.4} />
    <rect x={16} y={9} width={6} height={6} rx={0.4} />
    {/* Panel grid lines */}
    <line x1={5} y1={9} x2={5} y2={15} />
    <line x1={19} y1={9} x2={19} y2={15} />
    {/* Antenna */}
    <line x1={12} y1={10} x2={12} y2={4} />
    <circle cx={12} cy={3} r={1} fill="currentColor" />
    {/* Signal */}
    <path d="M9 6c0-1.5 1.5-3 3-3" opacity={0.6} />
    <path d="M15 6c0-1.5-1.5-3-3-3" opacity={0.6} />
  </svg>
);

const IconEmpacado = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" preserveAspectRatio="xMidYMid meet">
    {/* 3D box */}
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.5 7 12 12 20.5 7" />
    <line x1={12} y1={22} x2={12} y2={12} />
    {/* QR-ish dots on top face */}
    <circle cx={9} cy={5.5} r={0.5} fill="currentColor" />
    <circle cx={11} cy={5.5} r={0.5} fill="currentColor" />
    <circle cx={13} cy={5.5} r={0.5} fill="currentColor" />
  </svg>
);

const IconTrazabilidadFlow = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" preserveAspectRatio="xMidYMid meet">
    {/* Soil */}
    <path d="M3 19h18" />
    <path d="M5 19c0-1 1-2 2-2M17 19c0 -1 1-2 2-2" opacity={0.5} />
    {/* Stem */}
    <path d="M12 19v-7" />
    {/* Leaves */}
    <path d="M12 12c0-3 2-6 5-6 0 3-2 6-5 6z" />
    <path d="M12 14c0-3-2-6-5-6 0 3 2 6 5 6z" />
    {/* Top sprout */}
    <path d="M12 12c0-2 1-4 2-4" opacity={0.7} />
  </svg>
);

const IconLogistica = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" preserveAspectRatio="xMidYMid meet">
    {/* Document */}
    <rect x={4} y={3} width={13} height={18} rx={1.5} />
    {/* Pie chart inside */}
    <circle cx={8.5} cy={8} r={2} />
    <path d="M8.5 8L10.5 8" />
    <path d="M8.5 8L8.5 10" />
    {/* Bars */}
    <line x1={12} y1={11} x2={14.5} y2={11} />
    <line x1={12} y1={14} x2={14.5} y2={14} />
    <rect x={6} y={13} width={2} height={5} fill="currentColor" opacity={0.7} />
    <rect x={9} y={11.5} width={2} height={6.5} fill="currentColor" opacity={0.7} />
    <rect x={12} y={16} width={2} height={2} fill="currentColor" opacity={0.7} />
  </svg>
);

const flowSteps = [
  { icon: IconProduccion, label: 'Producción' },
  { icon: IconEmpacado, label: 'Empacado' },
  { icon: IconTrazabilidadFlow, label: 'Trazabilidad' },
  { icon: IconLogistica, label: 'Logística' },
];

export function Ecosistema() {
  return (
    <section
      id="ecosistema"
      className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #FFFFFF 0%, #FAF8F5 100%)',
      }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2
            className="text-4xl sm:text-5xl font-bold mb-6"
            style={{ color: '#FFFFFF' }}
          >
            Producimos desde el campo mexicano.
          </h2>
          <p
            className="text-lg sm:text-xl max-w-4xl mx-auto leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.78)' }}
          >
            Trabajamos con pequeños y medianos agricultores para producir hortalizas de alta
            calidad y nos encargamos de llevar esa producción al mercado con una operación
            integrada:
          </p>
        </motion.div>

        {/* Operational flow — 7 nodes inside an outlined panel, centered */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative rounded-2xl mx-auto max-w-6xl px-6 py-10 sm:px-10 sm:py-12"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(0, 255, 128, 0.25)',
          }}
        >
          {/* Panel header */}
          <p
            className="font-mono text-xs sm:text-sm tracking-[0.32em] uppercase mb-10 text-center"
            style={{ color: 'rgba(0, 255, 128, 0.85)' }}
          >
            Flujo operativo completo — COS monitorea cada etapa
          </p>

          {/* 7-node grid — responsive layout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 sm:gap-6 lg:gap-2 w-full">
            {[
              // Each node has a tiny inline SVG icon picked to match the stage.
              {
                label: 'CAMPO',
                sub: 'Insumos',
                // Sprout pushing out of soil
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <line x1={3} y1={20} x2={21} y2={20} />
                    <line x1={12} y1={20} x2={12} y2={12} />
                    <path d="M12 12c0-3 2-5 5-5 0 3-2 5-5 5z" />
                    <path d="M12 14c0-3-2-5-5-5 0 3 2 5 5 5z" />
                  </svg>
                ),
              },
              {
                label: 'SUPERVISIÓN',
                sub: 'Precisión',
                // Magnifying glass — inspection / oversight
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx={10.5} cy={10.5} r={6.5} />
                    <line x1={15.5} y1={15.5} x2={21} y2={21} />
                    <circle cx={10.5} cy={10.5} r={1.5} fill="currentColor" />
                  </svg>
                ),
              },
              {
                label: 'COSECHA',
                sub: 'Calidad',
                // Basket of produce
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9h18l-2 11H5L3 9z" />
                    <path d="M8 9l3-5M16 9l-3-5" />
                    <line x1={9} y1={13} x2={9} y2={17} />
                    <line x1={15} y1={13} x2={15} y2={17} />
                  </svg>
                ),
              },
              {
                label: 'EMPAQUE',
                sub: 'Inocuidad',
                // 3D box / package
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                    <polyline points="3.5 7 12 12 20.5 7" />
                    <line x1={12} y1={22} x2={12} y2={12} />
                  </svg>
                ),
              },
              {
                label: 'TRAZABILIDAD',
                sub: 'Verificable',
                // QR-style code square
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <rect x={3} y={3} width={7} height={7} rx={1} />
                    <rect x={14} y={3} width={7} height={7} rx={1} />
                    <rect x={3} y={14} width={7} height={7} rx={1} />
                    <line x1={14} y1={14} x2={17} y2={14} />
                    <line x1={17} y1={14} x2={17} y2={17} />
                    <line x1={14} y1={17} x2={14} y2={20} />
                    <line x1={17} y1={20} x2={20} y2={20} />
                    <line x1={20} y1={14} x2={20} y2={17} />
                  </svg>
                ),
              },
              {
                label: 'LOGÍSTICA',
                sub: 'Frío',
                // Cold-chain truck
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <rect x={1.5} y={6} width={12} height={10} rx={1} />
                    <path d="M13.5 10h4l2.5 3v3h-6.5" />
                    <circle cx={6.5} cy={18} r={1.8} />
                    <circle cx={17} cy={18} r={1.8} />
                  </svg>
                ),
              },
              {
                label: 'CLIENTE',
                sub: 'B2B',
                // Storefront / B2B building
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l1.5-4h15L21 9" />
                    <path d="M4 9v11h16V9" />
                    <path d="M3 9c0 1.5 1.3 2.5 2.5 2.5S8 10.5 8 9M8 9c0 1.5 1.3 2.5 2.5 2.5S13 10.5 13 9M13 9c0 1.5 1.3 2.5 2.5 2.5S18 10.5 18 9M18 9c0 1.5 1.3 2.5 2.5 2.5S21 10.5 21 9" />
                    <rect x={10} y={13} width={4} height={7} />
                  </svg>
                ),
              },
            ].map((node, i) => (
              <motion.div
                key={node.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="flex flex-col items-center text-center relative"
              >
                {/* Circle node — soft green glass with icon. Hover: scale + glow */}
                <motion.span
                  aria-hidden="true"
                  className="inline-flex items-center justify-center rounded-full mb-3 cursor-pointer"
                  style={{
                    width: 64,
                    height: 64,
                    background:
                      'radial-gradient(circle at 35% 30%, rgba(0,255,128,0.18) 0%, rgba(0,255,128,0.04) 70%)',
                    border: '1.5px solid rgba(0, 255, 128, 0.55)',
                    boxShadow:
                      '0 0 20px rgba(0,255,128,0.15), inset 0 0 12px rgba(0,255,128,0.10)',
                    color: '#00FF80',
                  }}
                  whileHover={{
                    scale: 1.12,
                    borderColor: 'rgba(0, 255, 128, 0.95)',
                    boxShadow:
                      '0 0 40px rgba(0,255,128,0.55), 0 0 18px rgba(0,255,128,0.4), inset 0 0 18px rgba(0,255,128,0.22)',
                  }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <span style={{ width: 24, height: 24, display: 'block' }}>{node.icon}</span>
                </motion.span>
                <p
                  className="font-mono text-[10px] sm:text-xs font-bold tracking-[0.18em] mb-1"
                  style={{ color: '#FFFFFF' }}
                >
                  {node.label}
                </p>
                <p
                  className="text-[9px] sm:text-xs"
                  style={{ color: 'rgba(255,255,255,0.55)' }}
                >
                  {node.sub}
                </p>

                {/* Connector ">" between nodes (desktop only, hidden on last) */}
                {i < 6 && (
                  <span
                    aria-hidden="true"
                    className="hidden lg:block absolute -right-1 top-1/2 -translate-y-1/2"
                    style={{
                      color: 'rgba(0, 255, 128, 0.45)',
                      fontFamily: 'monospace',
                      fontSize: 14,
                      lineHeight: 1,
                    }}
                  >
                    &gt;
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>


        {/* Socios en abastecimiento */}
        <div className="mt-48 sm:mt-56">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-16"
          >
            {/* Small green eyebrow — matches "Nuestra razón de ser" in size & colour */}
            <p
              className="text-sm sm:text-base font-semibold tracking-[0.22em] uppercase mb-4"
              style={{ color: '#00FF80' }}
            >
              Clientes
            </p>
            <h3
              className="text-4xl sm:text-5xl font-bold mb-4"
              style={{ color: '#FFFFFF' }}
            >
              Más que proveedores, socios en su abastecimiento
            </h3>
            <p
              className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.78)' }}
            >
              Para quienes priorizan calidad, trazabilidad y cumplimiento.
            </p>
          </motion.div>

          {/* Beneficios tangibles — Flip cards */}
          <div className="mb-16 sm:mb-20">
            <div className="text-center mb-10">
              <h4
                className="text-2xl sm:text-3xl font-bold mb-3"
                style={{ color: '#FFFFFF' }}
              >
                Beneficios tangibles de nuestro modelo y zona de cobertura actualmente
              </h4>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16 mt-12 sm:mt-16">
              {/* Stack of horizontal cards anchored to the LEFT column.
                  Right two thirds of the page stay free on desktop.
                  Negative margin pulls the stack out of the section's
                  horizontal padding so it sits hard against the page edge. */}
              <div className="lg:col-span-5 lg:-ml-16 xl:-ml-[72px] flex flex-col gap-4">
              {[
                {
                  title: 'Datos operativos',
                  description:
                    'Información verificable para auditorías, FSVP y seguimiento operativo desde nuestra plataforma.',
                  image: '/beneficios/visibilidad.jpeg',
                  metric: '100%',
                  metricLabel: 'Visibilidad digital',
                },
                {
                  title: 'Trazabilidad Total',
                  description:
                    'Auditable de extremo a extremo. Control absoluto sobre riesgos alimentarios e inocuidad.',
                  image: '/beneficios/trazabilidad.jpeg',
                  metric: '24/7',
                  metricLabel: 'Monitoreo continuo',
                },
                {
                  title: 'Calidad Consistente',
                  description:
                    'Mayor porcentaje de calidad, menos rechazos, comunicación en tiempo real.',
                  image: '/beneficios/fragmentacion.jpeg',
                  metric: '<5%',
                  metricLabel: 'Rechazos típicos',
                },
                {
                  title: 'Modelo Vertical',
                  description:
                    'Un solo operador desde la siembra hasta la venta. Sin intermediarios, sin fragmentación.',
                  image: '/beneficios/contacto.jpeg',
                  metric: '100%',
                  metricLabel: 'Cadena integrada',
                },
              ].map((item: { title: string; description: string; image: string; metric?: string; metricLabel?: string; frontTitle?: string }, i) => {
                // Each row gets its own dot colour so the stack reads as a series.
                const dotColors = ['#00FF80', '#3B82F6', '#F59E0B', '#14B8A6'];
                const dot = dotColors[i % dotColors.length];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="flex items-start gap-5 rounded-xl p-5 sm:p-6 transition-shadow duration-300 hover:shadow-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(0, 255, 128, 0.25)',
                    }}
                  >
                    {/* Coloured anchor — small ring with a glowing dot at center */}
                    <span
                      aria-hidden="true"
                      className="flex-shrink-0 inline-flex items-center justify-center rounded-full"
                      style={{
                        width: 42,
                        height: 42,
                        border: `1px solid ${dot}55`,
                        background: `${dot}10`,
                      }}
                    >
                      <span
                        className="block rounded-full"
                        style={{
                          width: 10,
                          height: 10,
                          background: dot,
                          boxShadow: `0 0 10px ${dot}80`,
                        }}
                      />
                    </span>
                    <div className="min-w-0">
                      <h5
                        className="font-sans text-base sm:text-lg font-bold leading-snug mb-1.5"
                        style={{ color: '#FFFFFF' }}
                      >
                        {item.title}
                      </h5>
                      <p
                        className="text-sm sm:text-base leading-relaxed"
                        style={{ color: 'rgba(255,255,255,0.65)' }}
                      >
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              </div>

              {/* Right column — Network del mockup V2 a tamaño nativo (270×352)
                  con el campo de partículas Three.js de fondo (los "vectores").
                  Solo se muestra en desktop (lg+). */}
              <div className="hidden lg:block lg:col-span-7 relative min-h-[480px]">
                <HeroParticleField transparent />
                <div
                  className="absolute inset-0 flex items-center justify-end pr-16 xl:pr-28 pointer-events-none"
                  style={{ transform: 'translateY(-28px)' }}
                >
                  <NetworkBackdrop />
                </div>
              </div>
            </div>
          </div>

          {/* Section title — restored above the dark-green plants panel */}
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl font-bold text-center mt-32 mb-8"
            style={{ color: '#FFFFFF' }}
          >
            Proceso operativo de abastecimiento
          </motion.h3>

          {/* Proceso operativo — dark-green plants panel with 3 glass cards.
              Stretched edge-to-edge (negative margins push past the section
              padding) and made shorter vertically so it reads wide & thin. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative lg:-mx-8 xl:-mx-16"
          >
            {/* Cards row — bare cards on the page background, no panel frame */}
            <div className="relative z-10 px-6 py-8 sm:px-12 sm:py-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-6 items-stretch">
                {SUPPLY_STEPS.map((step, i) => (
                  <React.Fragment key={step.title}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.15 }}
                      className="relative rounded-2xl px-5 py-5 flex flex-col items-center justify-center gap-3 transition-transform duration-300 hover:-translate-y-1"
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(0, 255, 128, 0.25)',
                      }}
                    >
                      <div className="w-12 h-12 text-white">{step.icon}</div>
                      <p className="text-white text-lg sm:text-xl font-bold tracking-wide text-center leading-tight">
                        {step.title}
                      </p>
                      <p
                        className="text-sm leading-snug text-center"
                        style={{ color: 'rgba(255,255,255,0.75)' }}
                      >
                        {step.description}
                      </p>
                    </motion.div>

                    {/* Arrow connector (desktop only) — electric green,
                        slides right + glows on a loop to imply forward flow. */}
                    {i < SUPPLY_STEPS.length - 1 && (
                      <motion.div
                        className="hidden lg:flex absolute z-20 items-center justify-center pointer-events-none"
                        style={{
                          left: `calc(${((i + 1) * 100) / SUPPLY_STEPS.length}% - 12px)`,
                          top: '50%',
                          color: '#00FF80',
                        }}
                        animate={{
                          x: ['-60%', '-40%', '-60%'],
                          opacity: [0.55, 1, 0.55],
                          filter: [
                            'drop-shadow(0 0 0px rgba(74,222,128,0))',
                            'drop-shadow(0 0 6px rgba(74,222,128,0.85))',
                            'drop-shadow(0 0 0px rgba(74,222,128,0))',
                          ],
                        }}
                        transition={{
                          duration: 1.8,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: i * 0.4,
                        }}
                      >
                        <svg
                          width={24}
                          height={24}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1={5} y1={12} x2={19} y2={12} />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </motion.div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
