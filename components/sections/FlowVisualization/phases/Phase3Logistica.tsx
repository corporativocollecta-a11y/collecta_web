'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FLOW_COLORS, VIEW_W, VIEW_H } from '../types';

interface Phase3LogisticaProps {
  active: boolean;
  onSubChange?: (sub: number) => void;
}

const STROKE_MAIN = '#2A2A2A';
const STROKE_WIDTH = 2.8;
const STEEL = '#5B7BA6';
const TERRACOTTA = '#B85A3D';

/**
 * FASE 3 — Logística (Carretera)
 *
 * SUB 0 (0 → 5s): Camión avanza por la carretera de izquierda a derecha,
 *                  con líneas de carretera fluyendo, postes y paisaje pasando
 * SUB 1 (5 → 9s): Camión lateral + panel GPS con ruta + indicador de cadena fría
 */
export function Phase3Logistica({ active, onSubChange }: Phase3LogisticaProps) {
  const [sub, setSub] = useState(0);

  useEffect(() => {
    if (!active) {
      setSub(0);
      return;
    }
    const t1 = setTimeout(() => setSub(1), 5000);
    return () => clearTimeout(t1);
  }, [active]);

  useEffect(() => {
    onSubChange?.(sub);
  }, [sub, onSubChange]);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: FLOW_COLORS.cream }}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="skyGradient3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={FLOW_COLORS.frost} stopOpacity={0.5} />
            <stop offset="100%" stopColor={FLOW_COLORS.cream} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="roadGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={FLOW_COLORS.line} stopOpacity={0.18} />
            <stop offset="100%" stopColor={FLOW_COLORS.line} stopOpacity={0.35} />
          </linearGradient>
        </defs>

        {/* === CIELO === */}
        <rect x={0} y={0} width={VIEW_W} height={420} fill="url(#skyGradient3)" />

        {/* === MONTAÑAS LEJANAS === */}
        <DistantMountains active={active} />

        {/* === NUBES (drift continuo) === */}
        <DriftingCloud cx={250} cy={80} scale={0.9} />
        <DriftingCloud cx={900} cy={60} scale={0.8} delay={3} />
        <DriftingCloud cx={550} cy={110} scale={0.7} delay={6} />

        {/* === HORIZONTE / COLINAS === */}
        <motion.path
          d="M -20 380 Q 200 340 400 360 T 800 350 T 1220 360 L 1220 420 L -20 420 Z"
          fill={FLOW_COLORS.leafLight}
          fillOpacity={0.1}
          stroke={STROKE_MAIN}
          strokeWidth={2.2}
          strokeOpacity={0.65}
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: active ? 1 : 0 }}
          transition={{ duration: 1, delay: 0.4 }}
        />

        {/* === CARRETERA === */}
        <Road active={active} />

        {/* === PÁJAROS LEJANOS === */}
        <Birds delay={1.5} />

        {/* ============================================================
             SUB 0 — Camión avanzando por la carretera
           ============================================================ */}
        <AnimatePresence>
          {sub === 0 && (
            <motion.g key="sub0" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              {/* Postes y árboles que pasan (movimiento) */}
              <PassingScenery />

              {/* Camión grande en carretera */}
              <RoadTruck delay={0.4} />
            </motion.g>
          )}
        </AnimatePresence>

        {/* ============================================================
             SUB 1 — Camión + panel GPS + cadena fría
           ============================================================ */}
        <AnimatePresence>
          {sub === 1 && (
            <motion.g key="sub1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              {/* Camión estático en primer plano */}
              <CloseUpTruck />

              {/* Panel GPS (mapa con ruta) */}
              <GPSPanel x={140} y={170} delay={0.4} />

              {/* Panel de cadena fría */}
              <ColdChainPanel x={870} y={170} delay={0.7} />

              {/* Líneas conectoras del camión a los paneles */}
              <motion.path
                d="M 290 250 Q 400 280 540 350"
                fill="none"
                stroke={STROKE_MAIN}
                strokeWidth={1.6}
                strokeDasharray="6 4"
                opacity={0.55}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 1.2 }}
              />
              <motion.path
                d="M 1010 250 Q 880 280 720 350"
                fill="none"
                stroke={STROKE_MAIN}
                strokeWidth={1.6}
                strokeDasharray="6 4"
                opacity={0.55}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 1.5 }}
              />
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
    </div>
  );
}

/* ============================================================
   DISTANT MOUNTAINS
   ============================================================ */

function DistantMountains({ active }: { active: boolean }) {
  return (
    <g>
      <motion.path
        d="M -50 360 L 100 280 L 230 320 L 380 250 L 520 295 L 680 240 L 830 285 L 980 235 L 1120 275 L 1250 250 L 1250 380 L -50 380 Z"
        fill={FLOW_COLORS.slate}
        fillOpacity={0.05}
        stroke={FLOW_COLORS.slate}
        strokeWidth={1.2}
        strokeOpacity={0.35}
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={active ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{ pathLength: { duration: 1, delay: 0.2 } }}
      />
      <motion.path
        d="M -50 380 L 80 320 L 220 350 L 360 295 L 500 335 L 660 280 L 820 320 L 970 285 L 1120 315 L 1250 295 L 1250 400 L -50 400 Z"
        fill={FLOW_COLORS.slate}
        fillOpacity={0.08}
        stroke={FLOW_COLORS.slate}
        strokeWidth={1.4}
        strokeOpacity={0.45}
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={active ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{ pathLength: { duration: 1, delay: 0.4 } }}
      />
    </g>
  );
}

/* ============================================================
   DRIFTING CLOUD — nubes que se mueven lento
   ============================================================ */

function DriftingCloud({ cx, cy, scale = 1, delay = 0 }: { cx: number; cy: number; scale?: number; delay?: number }) {
  return (
    <motion.g
      animate={{ x: [-200, VIEW_W + 200] }}
      transition={{ duration: 30, repeat: Infinity, delay, ease: 'linear' }}
    >
      <g transform={`translate(${cx - VIEW_W / 2}, ${cy}) scale(${scale})`}>
        <ellipse cx={0} cy={0} rx={42} ry={14} fill="white" fillOpacity={0.15} stroke={STROKE_MAIN} strokeWidth={2} />
        <ellipse cx={-22} cy={-6} rx={22} ry={12} fill="white" fillOpacity={0.15} stroke={STROKE_MAIN} strokeWidth={2} />
        <ellipse cx={18} cy={-8} rx={20} ry={11} fill="white" fillOpacity={0.15} stroke={STROKE_MAIN} strokeWidth={2} />
      </g>
    </motion.g>
  );
}

/* ============================================================
   ROAD — carretera con líneas centrales animadas
   ============================================================ */

function Road({ active }: { active: boolean }) {
  const roadTop = 480;
  const roadBottom = 590;

  return (
    <g>
      {/* Asfalto */}
      <rect
        x={0}
        y={roadTop}
        width={VIEW_W}
        height={roadBottom - roadTop}
        fill="url(#roadGradient)"
      />
      {/* Borde superior de la carretera */}
      <motion.line
        x1={0}
        y1={roadTop}
        x2={VIEW_W}
        y2={roadTop}
        stroke={STROKE_MAIN}
        strokeWidth={2}
        strokeOpacity={0.6}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: active ? 1 : 0 }}
        transition={{ duration: 0.7, delay: 0.6 }}
      />
      {/* Borde inferior */}
      <motion.line
        x1={0}
        y1={roadBottom}
        x2={VIEW_W}
        y2={roadBottom}
        stroke={STROKE_MAIN}
        strokeWidth={2}
        strokeOpacity={0.6}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: active ? 1 : 0 }}
        transition={{ duration: 0.7, delay: 0.65 }}
      />

      {/* Líneas centrales segmentadas (animadas) */}
      <motion.g
        animate={{ x: [0, -120] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <rect
            key={i}
            x={i * 120}
            y={(roadTop + roadBottom) / 2 - 4}
            width={70}
            height={8}
            rx={2}
            fill={FLOW_COLORS.gold}
            fillOpacity={0.85}
            stroke={STROKE_MAIN}
            strokeWidth={1.2}
          />
        ))}
      </motion.g>

      {/* Suelo más allá (campo) */}
      <rect x={0} y={roadBottom} width={VIEW_W} height={VIEW_H - roadBottom} fill={FLOW_COLORS.beige} fillOpacity={0.5} />
    </g>
  );
}

/* ============================================================
   PASSING SCENERY — postes/árboles que pasan en bucle
   ============================================================ */

function PassingScenery() {
  // Postes telefónicos pasando
  return (
    <g>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.g
          key={`pole-${i}`}
          animate={{ x: [VIEW_W + 60, -200] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.7,
            ease: 'linear',
          }}
        >
          <Pole cx={0} baseY={460} />
        </motion.g>
      ))}

      {/* Árboles pasando (fila más cercana) */}
      {[0, 1, 2].map((i) => (
        <motion.g
          key={`tree-${i}`}
          animate={{ x: [VIEW_W + 100, -200] }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            delay: i * 1.2,
            ease: 'linear',
          }}
        >
          <PassingTree cx={0} baseY={475} scale={0.7} />
        </motion.g>
      ))}
    </g>
  );
}

function Pole({ cx, baseY }: { cx: number; baseY: number }) {
  return (
    <g>
      {/* Poste vertical */}
      <line x1={cx} y1={baseY} x2={cx} y2={baseY - 100} stroke={STROKE_MAIN} strokeWidth={2.4} strokeLinecap="round" />
      {/* Cruceta horizontal */}
      <line x1={cx - 20} y1={baseY - 92} x2={cx + 20} y2={baseY - 92} stroke={STROKE_MAIN} strokeWidth={2} strokeLinecap="round" />
      {/* Aisladores */}
      <circle cx={cx - 16} cy={baseY - 90} r={3} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={1.4} />
      <circle cx={cx + 16} cy={baseY - 90} r={3} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={1.4} />
      {/* Cables (sutiles) */}
      <line x1={cx - 16} y1={baseY - 90} x2={cx + 16} y2={baseY - 90} stroke={STROKE_MAIN} strokeWidth={1} opacity={0.4} />
    </g>
  );
}

function PassingTree({ cx, baseY, scale }: { cx: number; baseY: number; scale: number }) {
  return (
    <g transform={`translate(${cx}, ${baseY}) scale(${scale})`}>
      <ellipse cx={0} cy={2} rx={20} ry={3} fill={STROKE_MAIN} opacity={0.1} />
      <line x1={0} y1={0} x2={0} y2={-25} stroke={STROKE_MAIN} strokeWidth={2.4} strokeLinecap="round" />
      <circle cx={0} cy={-32} r={18} fill={FLOW_COLORS.leaf} fillOpacity={0.22} stroke={STROKE_MAIN} strokeWidth={2.4} />
      <ellipse cx={-10} cy={-3} rx={12} ry={9} fill={FLOW_COLORS.leafDark} fillOpacity={0.18} stroke={STROKE_MAIN} strokeWidth={2} />
    </g>
  );
}

/* ============================================================
   ROAD TRUCK — camión avanzando por la carretera
   ============================================================ */

function RoadTruck({ delay }: { delay: number }) {
  // El camión está estático centrado pero las líneas y el paisaje pasan
  // Pequeña oscilación vertical para sugerir movimiento
  return (
    <motion.g
      initial={{ opacity: 0, x: -50 }}
      animate={{
        opacity: 1,
        x: 0,
        y: [0, -2, 0, 2, 0],
      }}
      transition={{
        opacity: { duration: 0.5, delay },
        x: { duration: 0.6, delay, ease: 'easeOut' },
        y: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      <g transform="translate(550, 480) scale(1.7)">
        {/* Sombra */}
        <ellipse cx={-30} cy={15} rx={78} ry={5} fill={STROKE_MAIN} opacity={0.15} />

        {/* Caja de carga */}
        <rect x={-95} y={-58} width={95} height={54} fill={FLOW_COLORS.cream} fillOpacity={0.85} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} rx={6} />
        <line x1={-82} y1={-46} x2={-12} y2={-46} stroke={STROKE_MAIN} strokeWidth={1.2} opacity={0.4} />
        <line x1={-82} y1={-26} x2={-12} y2={-26} stroke={STROKE_MAIN} strokeWidth={1.2} opacity={0.4} />

        {/* Logo COLLECTA */}
        <rect x={-72} y={-42} width={48} height={18} rx={2} fill={FLOW_COLORS.gold} fillOpacity={0.7} stroke={STROKE_MAIN} strokeWidth={1.6} />
        <text x={-48} y={-30} textAnchor="middle" fontSize={9} fontWeight={800} fill={STROKE_MAIN} fontFamily="system-ui" letterSpacing={1}>COLLECTA</text>

        {/* Indicador de carga (cadena fría) */}
        <circle cx={-22} cy={-30} r={8} fill={STEEL} fillOpacity={0.5} stroke={STROKE_MAIN} strokeWidth={1.6} />
        <text x={-22} y={-26} textAnchor="middle" fontSize={10} fontWeight={700} fill={STROKE_MAIN} fontFamily="system-ui">❄</text>

        {/* Cabina */}
        <path d="M 0 -54 Q 0 -56 2 -56 L 32 -56 Q 34 -56 36 -54 L 52 -28 L 52 -4 Q 52 -2 50 -2 L 0 -2 Z" fill={FLOW_COLORS.gold} fillOpacity={0.2} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
        <path d="M 6 -50 L 30 -50 L 42 -28 L 6 -28 Z" fill={FLOW_COLORS.frost} fillOpacity={0.5} stroke={STROKE_MAIN} strokeWidth={2} />
        <line x1={14} y1={-48} x2={26} y2={-30} stroke="white" strokeWidth={1.4} opacity={0.7} />
        <line x1={20} y1={-48} x2={32} y2={-30} stroke="white" strokeWidth={1.4} opacity={0.5} />

        <circle cx={49} cy={-10} r={3.5} fill={FLOW_COLORS.goldLight} stroke={STROKE_MAIN} strokeWidth={1.5} />
        <line x1={47} y1={-2} x2={53} y2={-2} stroke={STROKE_MAIN} strokeWidth={2.4} strokeLinecap="round" />

        {/* Ruedas (3 - tipo camión grande) */}
        <g>
          <circle cx={-65} cy={0} r={13} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
          <circle cx={-65} cy={0} r={7} fill={FLOW_COLORS.gold} fillOpacity={0.85} stroke={STROKE_MAIN} strokeWidth={1.6} />
          <circle cx={-65} cy={0} r={2} fill={STROKE_MAIN} />
          <animateTransform attributeName="transform" type="rotate" from="0 -65 0" to="-360 -65 0" dur="0.6s" repeatCount="indefinite" />
        </g>
        <g>
          <circle cx={-30} cy={0} r={13} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
          <circle cx={-30} cy={0} r={7} fill={FLOW_COLORS.gold} fillOpacity={0.85} stroke={STROKE_MAIN} strokeWidth={1.6} />
          <circle cx={-30} cy={0} r={2} fill={STROKE_MAIN} />
          <animateTransform attributeName="transform" type="rotate" from="0 -30 0" to="-360 -30 0" dur="0.6s" repeatCount="indefinite" />
        </g>
        <g>
          <circle cx={28} cy={0} r={13} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
          <circle cx={28} cy={0} r={7} fill={FLOW_COLORS.gold} fillOpacity={0.85} stroke={STROKE_MAIN} strokeWidth={1.6} />
          <circle cx={28} cy={0} r={2} fill={STROKE_MAIN} />
          <animateTransform attributeName="transform" type="rotate" from="0 28 0" to="-360 28 0" dur="0.6s" repeatCount="indefinite" />
        </g>
      </g>
    </motion.g>
  );
}

/* ============================================================
   CLOSE-UP TRUCK — camión estático en primer plano (Sub 1)
   ============================================================ */

function CloseUpTruck() {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 180, damping: 18 }}
      style={{ transformOrigin: '650px 450px' }}
    >
      <g transform="translate(650, 480) scale(2.2)">
        <ellipse cx={-30} cy={15} rx={78} ry={5} fill={STROKE_MAIN} opacity={0.15} />

        <rect x={-95} y={-58} width={95} height={54} fill={FLOW_COLORS.cream} fillOpacity={0.85} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} rx={6} />
        <line x1={-82} y1={-46} x2={-12} y2={-46} stroke={STROKE_MAIN} strokeWidth={1.2} opacity={0.4} />
        <line x1={-82} y1={-26} x2={-12} y2={-26} stroke={STROKE_MAIN} strokeWidth={1.2} opacity={0.4} />

        <rect x={-72} y={-42} width={48} height={18} rx={2} fill={FLOW_COLORS.gold} fillOpacity={0.7} stroke={STROKE_MAIN} strokeWidth={1.6} />
        <text x={-48} y={-30} textAnchor="middle" fontSize={9} fontWeight={800} fill={STROKE_MAIN} fontFamily="system-ui" letterSpacing={1}>COLLECTA</text>

        <circle cx={-22} cy={-30} r={8} fill={STEEL} fillOpacity={0.5} stroke={STROKE_MAIN} strokeWidth={1.6} />
        <text x={-22} y={-26} textAnchor="middle" fontSize={10} fontWeight={700} fill={STROKE_MAIN} fontFamily="system-ui">❄</text>

        <path d="M 0 -54 Q 0 -56 2 -56 L 32 -56 Q 34 -56 36 -54 L 52 -28 L 52 -4 Q 52 -2 50 -2 L 0 -2 Z" fill={FLOW_COLORS.gold} fillOpacity={0.2} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
        <path d="M 6 -50 L 30 -50 L 42 -28 L 6 -28 Z" fill={FLOW_COLORS.frost} fillOpacity={0.5} stroke={STROKE_MAIN} strokeWidth={2} />
        <line x1={14} y1={-48} x2={26} y2={-30} stroke="white" strokeWidth={1.4} opacity={0.7} />

        <circle cx={49} cy={-10} r={3.5} fill={FLOW_COLORS.goldLight} stroke={STROKE_MAIN} strokeWidth={1.5} />
        <line x1={47} y1={-2} x2={53} y2={-2} stroke={STROKE_MAIN} strokeWidth={2.4} strokeLinecap="round" />

        {/* Ruedas (estáticas porque está parado) */}
        <circle cx={-65} cy={0} r={13} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
        <circle cx={-65} cy={0} r={7} fill={FLOW_COLORS.gold} fillOpacity={0.85} stroke={STROKE_MAIN} strokeWidth={1.6} />
        <circle cx={-65} cy={0} r={2} fill={STROKE_MAIN} />

        <circle cx={-30} cy={0} r={13} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
        <circle cx={-30} cy={0} r={7} fill={FLOW_COLORS.gold} fillOpacity={0.85} stroke={STROKE_MAIN} strokeWidth={1.6} />
        <circle cx={-30} cy={0} r={2} fill={STROKE_MAIN} />

        <circle cx={28} cy={0} r={13} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
        <circle cx={28} cy={0} r={7} fill={FLOW_COLORS.gold} fillOpacity={0.85} stroke={STROKE_MAIN} strokeWidth={1.6} />
        <circle cx={28} cy={0} r={2} fill={STROKE_MAIN} />
      </g>
    </motion.g>
  );
}

/* ============================================================
   GPS PANEL — mapa con ruta + pin
   ============================================================ */

function GPSPanel({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay, type: 'spring', stiffness: 200, damping: 16 }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      <g transform={`translate(${x}, ${y})`}>
        {/* Marco del card */}
        <rect
          x={-110}
          y={-70}
          width={220}
          height={160}
          rx={12}
          fill={FLOW_COLORS.cream}
          fillOpacity={0.96}
          stroke={STROKE_MAIN}
          strokeWidth={STROKE_WIDTH}
        />

        {/* Header bar */}
        <rect x={-110} y={-70} width={220} height={26} rx={12} fill={FLOW_COLORS.gold} fillOpacity={0.5} stroke={STROKE_MAIN} strokeWidth={1.6} />
        <text x={-95} y={-52} fontSize={11} fontWeight={800} fill={STROKE_MAIN} fontFamily="system-ui" letterSpacing={1}>GPS · RUTA</text>

        {/* Mini mapa: cuadrícula */}
        {[0, 1, 2, 3].map((i) => (
          <line
            key={`h-${i}`}
            x1={-100}
            y1={-30 + i * 25}
            x2={100}
            y2={-30 + i * 25}
            stroke={STROKE_MAIN}
            strokeWidth={0.8}
            opacity={0.25}
          />
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={`v-${i}`}
            x1={-100 + i * 50}
            y1={-35}
            x2={-100 + i * 50}
            y2={75}
            stroke={STROKE_MAIN}
            strokeWidth={0.8}
            opacity={0.25}
          />
        ))}

        {/* Ruta (línea curva) */}
        <motion.path
          d="M -85 60 Q -50 30 -10 35 Q 30 40 50 10 Q 70 -10 90 -20"
          fill="none"
          stroke={TERRACOTTA}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: delay + 0.4 }}
        />

        {/* Pin de origen */}
        <circle cx={-85} cy={60} r={4} fill={FLOW_COLORS.leafDark} fillOpacity={0.8} stroke={STROKE_MAIN} strokeWidth={1.6} />

        {/* Pin de destino (animado) */}
        <motion.g
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <path
            d="M 90 -30 Q 96 -30 96 -24 Q 96 -16 90 -10 Q 84 -16 84 -24 Q 84 -30 90 -30 Z"
            fill={TERRACOTTA}
            fillOpacity={0.85}
            stroke={STROKE_MAIN}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
          <circle cx={90} cy={-23} r={2} fill={FLOW_COLORS.cream} />
        </motion.g>

        {/* Camión actual en la ruta (movimiento) */}
        <motion.circle
          cx={0}
          cy={0}
          r={5}
          fill={FLOW_COLORS.gold}
          stroke={STROKE_MAIN}
          strokeWidth={1.6}
          animate={{
            cx: [-85, -10, 50, 90],
            cy: [60, 35, 10, -20],
          }}
          transition={{ duration: 4, repeat: Infinity, delay: delay + 1.5, ease: 'easeInOut' }}
        />
      </g>
    </motion.g>
  );
}

/* ============================================================
   COLD CHAIN PANEL — temperatura monitoreada
   ============================================================ */

function ColdChainPanel({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay, type: 'spring', stiffness: 200, damping: 16 }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      <g transform={`translate(${x}, ${y})`}>
        {/* Marco del card */}
        <rect
          x={-110}
          y={-70}
          width={220}
          height={160}
          rx={12}
          fill={FLOW_COLORS.cream}
          fillOpacity={0.96}
          stroke={STROKE_MAIN}
          strokeWidth={STROKE_WIDTH}
        />

        {/* Header */}
        <rect x={-110} y={-70} width={220} height={26} rx={12} fill={STEEL} fillOpacity={0.45} stroke={STROKE_MAIN} strokeWidth={1.6} />
        <text x={-95} y={-52} fontSize={11} fontWeight={800} fill={STROKE_MAIN} fontFamily="system-ui" letterSpacing={1}>CADENA FRÍA</text>

        {/* Termómetro grande */}
        <g transform="translate(-60, 5)">
          <rect x={-8} y={-30} width={16} height={50} rx={8} fill={FLOW_COLORS.frost} fillOpacity={0.7} stroke={STROKE_MAIN} strokeWidth={2} />
          <circle cx={0} cy={26} r={14} fill={STEEL} fillOpacity={0.7} stroke={STROKE_MAIN} strokeWidth={2.2} />
          <line x1={-4} y1={-22} x2={4} y2={-22} stroke={STROKE_MAIN} strokeWidth={1.2} />
          <line x1={-4} y1={-12} x2={4} y2={-12} stroke={STROKE_MAIN} strokeWidth={1.2} />
          <line x1={-4} y1={-2} x2={4} y2={-2} stroke={STROKE_MAIN} strokeWidth={1.2} />
        </g>

        {/* Temperatura grande */}
        <text x={20} y={5} fontSize={32} fontWeight={800} fill={STROKE_MAIN} fontFamily="system-ui">2°C</text>
        <text x={20} y={28} fontSize={9} fill={STROKE_MAIN} opacity={0.75} fontFamily="system-ui">monitoreado en vivo</text>

        {/* Gráfica sutil (línea con datos) */}
        <motion.path
          d="M -100 65 L -80 60 L -60 62 L -40 58 L -20 60 L 0 56 L 20 58 L 40 56 L 60 58 L 80 56 L 100 58"
          fill="none"
          stroke={STEEL}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: delay + 0.4 }}
        />

        {/* Punto pulsante en la gráfica */}
        <motion.circle
          cx={100}
          cy={58}
          r={4}
          fill={STEEL}
          stroke={STROKE_MAIN}
          strokeWidth={1.6}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      </g>
    </motion.g>
  );
}

/* ============================================================
   BIRDS
   ============================================================ */

function Birds({ delay }: { delay: number }) {
  return (
    <motion.g
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: VIEW_W + 100, opacity: [0, 1, 1, 0] }}
      transition={{
        x: { duration: 12, delay, ease: 'linear', repeat: Infinity },
        opacity: { duration: 12, delay, times: [0, 0.1, 0.85, 1], repeat: Infinity },
      }}
    >
      <BirdShape cx={0} cy={140} scale={0.9} flapDelay={0} />
      <BirdShape cx={45} cy={155} scale={0.7} flapDelay={0.15} />
      <BirdShape cx={20} cy={170} scale={0.6} flapDelay={0.3} />
    </motion.g>
  );
}

function BirdShape({ cx, cy, scale, flapDelay }: { cx: number; cy: number; scale: number; flapDelay: number }) {
  return (
    <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
      <motion.path
        d="M -8 0 Q -4 -6 0 0 Q 4 -6 8 0"
        fill="none"
        stroke={STROKE_MAIN}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{
          d: [
            'M -8 0 Q -4 -6 0 0 Q 4 -6 8 0',
            'M -8 -2 Q -4 -2 0 -4 Q 4 -2 8 -2',
            'M -8 0 Q -4 -6 0 0 Q 4 -6 8 0',
          ],
        }}
        transition={{ duration: 0.7, repeat: Infinity, delay: flapDelay, ease: 'easeInOut' }}
        opacity={0.6}
      />
    </g>
  );
}
