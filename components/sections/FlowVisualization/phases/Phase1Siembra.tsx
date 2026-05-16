'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FLOW_COLORS, VIEW_W, VIEW_H } from '../types';

interface Phase1SiembraProps {
  active: boolean;
  onSubChange?: (sub: number) => void;
}

const STROKE_MAIN = '#2A2A2A';
const STROKE_WIDTH = 2.8;
const TERRACOTTA = '#B85A3D'; // acento de techo

// Paleta de strokes coloreados — reemplazan al negro para look orgánico (estilo SVGator)
const STROKE_SUN = '#E08020'; // naranja intenso para el sol
const STROKE_CLOUD = '#3D7AB8'; // azul intenso para nubes
const STROKE_EARTH = '#5C4628'; // café oscuro para estructuras de tierra (granero, valla)
const STROKE_HILL = '#7A5530'; // café medio para colinas
const STROKE_TREE = '#1F5A2A'; // verde oscuro para árboles
const STROKE_TERRACOTTA = '#7E3A22'; // terracotta oscuro para techo del granero
const STROKE_BIRD = '#5C4030'; // marrón para pájaros
const STROKE_BUTTERFLY = '#8B6510'; // dorado oscuro para mariposas
const STROKE_LETTUCE = '#1F5A2A'; // verde oscuro para lechuga
const STROKE_SACK = '#3A2A18'; // marrón oscuro para costales
const STROKE_TRUCK = '#4A3520'; // marrón oscuro para camión

// Paleta del tractor John Deere
const TRACTOR_GREEN = '#3D7A2C';
const TRACTOR_GREEN_DARK = '#1A3F14';
const TRACTOR_YELLOW = '#F5D434';
const TRACTOR_TIRE = '#1F1F1F';

/**
 * FASE 1 — Siembra (estilo SVGator densificado)
 *
 * SUB 0 (0 → 5.5s): Stroke-draw del paisaje + costales caen (caída de 2s c/u)
 * SUB 1 (5.5 → 10s): Sol, aspersores trazándose, brotes con bounce, mariposas
 * SUB 2 (10 → 15s): Plantas maduras + camión cruza + pájaros
 */
export function Phase1Siembra({ active, onSubChange }: Phase1SiembraProps) {
  const [sub, setSub] = useState(0);

  useEffect(() => {
    if (!active) {
      setSub(0);
      return;
    }
    const t1 = setTimeout(() => setSub(1), 8500);
    const t2 = setTimeout(() => setSub(2), 13000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
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
        {/* ===== DEFS: gradientes y patterns ===== */}
        <defs>
          <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={FLOW_COLORS.frost} stopOpacity={0.45} />
            <stop offset="100%" stopColor={FLOW_COLORS.cream} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="mountainGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={FLOW_COLORS.earth} stopOpacity={0.06} />
            <stop offset="100%" stopColor={FLOW_COLORS.earth} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* ===== CIELO con gradiente ===== */}
        <rect x={0} y={0} width={VIEW_W} height={420} fill="url(#skyGradient)" />

        {/* ===== MONTAÑAS LEJANAS (más profundidad) ===== */}
        <DistantMountains active={active} />

        {/* ===== NUBES DRIFT (minimalistas, animadas) ===== */}
        <DriftingClouds />

        {/* ===== COLINAS (stroke-draw) ===== */}
        <LandscapeIntro active={active} />

        {/* ===== GRANERO (ancla visual estilo SVGator) ===== */}
        <Barn active={active} />

        {/* ===== ÁRBOLES DEL PERÍMETRO (estilo SVGator) ===== */}
        <PerimeterTree cx={70} cy={425} scale={0.85} active={active} delay={1.0} />
        <PerimeterTree cx={140} cy={430} scale={0.6} active={active} delay={1.1} />
        <PerimeterTree cx={1080} cy={430} scale={0.6} active={active} delay={1.15} />
        <PerimeterTree cx={1150} cy={425} scale={0.85} active={active} delay={1.05} />

        {/* ===== POSTES DE VALLA ===== */}
        <FencePosts active={active} />

        {/* ===== TIERRA (cambia color en Sub 2) ===== */}
        <motion.rect
          x={0}
          y={420}
          width={VIEW_W}
          height={VIEW_H - 420}
          animate={{
            fill: sub >= 2 ? FLOW_COLORS.leafLight : FLOW_COLORS.earthLight,
            fillOpacity: sub >= 2 ? 0.25 : 0.2,
          }}
          transition={{ duration: 1 }}
        />

        {/* ===== HILERAS DE CULTIVO (verde continuo, stroke-draw) ===== */}
        {[0, 1, 2, 3, 4].map((i) => {
          const y = 460 + i * 45;
          return (
            <motion.line
              key={`row-${i}`}
              x1={-50}
              y1={y}
              x2={VIEW_W + 50}
              y2={y}
              stroke={FLOW_COLORS.leaf}
              strokeWidth={1.6}
              strokeLinecap="round"
              opacity={0.55}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: active ? 1 : 0 }}
              transition={{ duration: 3.6, ease: 'easeInOut', delay: 0.6 + i * 0.1 }}
            />
          );
        })}

        {/* ===== MARCAS DE SURCO (Vs invertidas) ===== */}
        <FurrowMarks active={active} />

        {/* ===== PIEDRAS DISPERSAS ===== */}
        <Stones active={active} />

        {/* ===== MECHONES DE PASTO ===== */}
        <GrassTufts active={active} />

        {/* ============================================================
             SUB 0 — APLICACIÓN DE INSUMOS
           ============================================================ */}
        <AnimatePresence>
          {sub === 0 && (
            <motion.g
              key="sub0"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Dron esparciendo insumos sobre la parcela (paso lento) */}
              <Drone delay={0.5} duration={7.5} />
            </motion.g>
          )}
        </AnimatePresence>

        {/* ============================================================
             SUB 1 — RIEGO Y CRECIMIENTO
           ============================================================ */}
        <AnimatePresence>
          {sub === 1 && (
            <motion.g
              key="sub1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Sun cx={1050} cy={120} r={58} />

              {/* Brotes — 2 hileras intercaladas (15 brotes total) */}
              {/* Hilera 1 (fondo) */}
              <Sprout x={80} y={555} delay={1.4} />
              <Sprout x={230} y={560} delay={1.5} />
              <Sprout x={380} y={555} delay={1.6} />
              <Sprout x={540} y={560} delay={1.7} />
              <Sprout x={700} y={555} delay={1.8} />
              <Sprout x={860} y={560} delay={1.9} />
              <Sprout x={1020} y={555} delay={2.0} />
              <Sprout x={1170} y={560} delay={2.1} />

              {/* Hilera 2 (frente, intercalada) */}
              <Sprout x={150} y={605} delay={2.2} />
              <Sprout x={310} y={600} delay={2.3} />
              <Sprout x={470} y={605} delay={2.4} />
              <Sprout x={620} y={605} delay={2.5} />
              <Sprout x={780} y={600} delay={2.6} />
              <Sprout x={940} y={605} delay={2.7} />
              <Sprout x={1100} y={600} delay={2.8} />

              {/* Mariposas durante riego */}
              <Butterfly cx={400} cy={300} delay={2.0} />
              <Butterfly cx={850} cy={250} delay={2.5} variant="alt" />

              {/* Pájaros */}
              <Birds delay={1.0} />
            </motion.g>
          )}
        </AnimatePresence>

        {/* ============================================================
             SUB 2 — COSECHA EN MARCHA
           ============================================================ */}
        <AnimatePresence>
          {sub === 2 && (
            <motion.g
              key="sub2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <MaturePlant x={120} y={555} delay={0.0} />
              <MaturePlant x={280} y={570} delay={0.15} />
              <MaturePlant x={440} y={560} delay={0.3} />
              <MaturePlant x={600} y={575} delay={0.45} />
              <MaturePlant x={760} y={565} delay={0.6} />
              <MaturePlant x={920} y={580} delay={0.75} />
              <MaturePlant x={1080} y={570} delay={0.9} />
              <MaturePlant x={1180} y={560} delay={1.05} />

              <Tractor startX={-150} endX={VIEW_W + 150} delay={1.0} duration={6.5} />

              {/* Pájaros continúan */}
              <Birds delay={0.5} />
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
      {/* Capa lejana (café claro, más sutil) */}
      <motion.path
        d="M -50 360 L 100 280 L 230 320 L 380 250 L 520 295 L 680 240 L 830 285 L 980 235 L 1120 275 L 1250 250 L 1250 380 L -50 380 Z"
        fill="url(#mountainGradient)"
        stroke={FLOW_COLORS.earth}
        strokeWidth={1.6}
        strokeOpacity={0.7}
        strokeLinejoin="round"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={active ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{
          pathLength: { duration: 4.8, ease: 'easeInOut', delay: 0.2 },
          opacity: { duration: 0.8, delay: 0.3 },
        }}
      />
      {/* Capa intermedia (café oscuro, más prominente al frente) */}
      <motion.path
        d="M -50 380 L 80 320 L 220 350 L 360 295 L 500 335 L 660 280 L 820 320 L 970 285 L 1120 315 L 1250 295 L 1250 400 L -50 400 Z"
        fill={FLOW_COLORS.earth}
        fillOpacity={0.04}
        stroke={FLOW_COLORS.earthDark}
        strokeWidth={1.8}
        strokeOpacity={0.85}
        strokeLinejoin="round"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={active ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{
          pathLength: { duration: 4.8, ease: 'easeInOut', delay: 0.4 },
          opacity: { duration: 0.8, delay: 0.5 },
        }}
      />
    </g>
  );
}

/* ============================================================
   LANDSCAPE INTRO (colinas + nubes)
   ============================================================ */

function LandscapeIntro({ active }: { active: boolean }) {
  return (
    <g>
      <motion.path
        d="M 0 380 Q 200 320 420 360 T 820 340 T 1200 360 L 1200 420 L 0 420 Z"
        fill={FLOW_COLORS.leafLight}
        stroke={STROKE_HILL}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
        initial={{ pathLength: 0, fillOpacity: 0 }}
        animate={
          active
            ? { pathLength: 1, fillOpacity: 0.08 }
            : { pathLength: 0, fillOpacity: 0 }
        }
        transition={{
          pathLength: { duration: 3.6, ease: 'easeInOut', delay: 0.6 },
          fillOpacity: { duration: 0.6, delay: 4.0 },
        }}
      />
    </g>
  );
}

/* ============================================================
   DRIFTING CLOUDS — minimalistas (línea única, sin fill)
   ============================================================ */

const CLOUD_PATH =
  'M -34 0 Q -38 -8 -28 -12 Q -24 -22 -12 -18 Q -2 -28 10 -20 Q 20 -28 28 -16 Q 38 -14 32 -2 L 32 0 Z';

function DriftingClouds() {
  const clouds = [
    { initialX: 0, cy: 65, scale: 1.5, duration: 70 },
    { initialX: 280, cy: 105, scale: 1.1, duration: 90 },
    { initialX: 540, cy: 55, scale: 1.3, duration: 80 },
    { initialX: 800, cy: 125, scale: 0.9, duration: 100 },
    { initialX: 1080, cy: 80, scale: 1.2, duration: 75 },
  ];

  return (
    <g>
      {clouds.map((c, i) => (
        <DriftingCloud key={i} {...c} />
      ))}
    </g>
  );
}

function DriftingCloud({
  initialX,
  cy,
  scale,
  duration,
}: {
  initialX: number;
  cy: number;
  scale: number;
  duration: number;
}) {
  return (
    <motion.g
      animate={{ x: [0, VIEW_W + 300] }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    >
      <g transform={`translate(${initialX - 200}, ${cy}) scale(${scale})`}>
        <path
          d={CLOUD_PATH}
          fill="none"
          stroke={STROKE_CLOUD}
          strokeWidth={2.4}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={0.9}
        />
      </g>
    </motion.g>
  );
}

/* ============================================================
   FENCE POSTS
   ============================================================ */

function FencePosts({ active }: { active: boolean }) {
  const posts = [80, 320, 600, 880, 1120];
  const top = 380;
  const bottom = 425;

  return (
    <g>
      {/* Vigas horizontales (líneas largas detrás) */}
      <motion.line
        x1={posts[0]}
        y1={top + 8}
        x2={posts[posts.length - 1]}
        y2={top + 8}
        stroke={STROKE_EARTH}
        strokeWidth={1.4}
        strokeOpacity={0.7}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: active ? 1 : 0 }}
        transition={{ duration: 3.2, delay: 1.4 }}
      />
      <motion.line
        x1={posts[0]}
        y1={top + 22}
        x2={posts[posts.length - 1]}
        y2={top + 22}
        stroke={STROKE_EARTH}
        strokeWidth={1.4}
        strokeOpacity={0.7}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: active ? 1 : 0 }}
        transition={{ duration: 3.2, delay: 1.5 }}
      />

      {/* Postes verticales */}
      {posts.map((x, i) => (
        <motion.line
          key={`post-${i}`}
          x1={x}
          y1={top}
          x2={x}
          y2={bottom}
          stroke={STROKE_EARTH}
          strokeWidth={1.8}
          strokeOpacity={0.75}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: active ? 1 : 0 }}
          transition={{ duration: 2.0, delay: 1.2 + i * 0.05 }}
        />
      ))}
    </g>
  );
}

/* ============================================================
   FURROW MARKS (V invertidas en hileras)
   ============================================================ */

function FurrowMarks({ active }: { active: boolean }) {
  const rows = [462, 507, 552, 597, 642];
  const xs = [60, 180, 290, 420, 540, 660, 780, 900, 1020, 1140];

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: active ? 0.7 : 0 }}
      transition={{ duration: 0.6, delay: 1.6 }}
    >
      {rows.map((y, ri) =>
        xs.map((x, xi) => {
          // Alternar para que no estén alineadas
          const offset = ri % 2 === 0 ? 0 : 30;
          const px = x + offset;
          if (px > VIEW_W - 20) return null;
          return (
            <path
              key={`furrow-${ri}-${xi}`}
              d={`M ${px - 4} ${y + 2} L ${px} ${y - 3} L ${px + 4} ${y + 2}`}
              fill="none"
              stroke={FLOW_COLORS.leafDark}
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })
      )}
    </motion.g>
  );
}

/* ============================================================
   STONES
   ============================================================ */

function Stones({ active }: { active: boolean }) {
  const stones = [
    { cx: 75, cy: 645, rx: 6, ry: 3 },
    { cx: 410, cy: 660, rx: 8, ry: 3.5 },
    { cx: 700, cy: 650, rx: 5, ry: 2.5 },
    { cx: 980, cy: 660, rx: 7, ry: 3 },
    { cx: 1160, cy: 640, rx: 5, ry: 2.5 },
  ];
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.6, delay: 1.7 }}
    >
      {stones.map((s, i) => (
        <ellipse
          key={`stone-${i}`}
          cx={s.cx}
          cy={s.cy}
          rx={s.rx}
          ry={s.ry}
          fill={FLOW_COLORS.slate}
          fillOpacity={0.18}
          stroke={STROKE_EARTH}
          strokeWidth={1.2}
        />
      ))}
    </motion.g>
  );
}

/* ============================================================
   GRASS TUFTS
   ============================================================ */

function GrassTufts({ active }: { active: boolean }) {
  const tufts = [
    { x: 30, y: 440 },
    { x: 470, y: 442 },
    { x: 880, y: 438 },
    { x: 1170, y: 440 },
    { x: 200, y: 660 },
    { x: 800, y: 658 },
  ];
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.6, delay: 1.8 }}
    >
      {tufts.map((t, i) => (
        <g key={`tuft-${i}`} transform={`translate(${t.x}, ${t.y})`}>
          <path d="M -5 0 Q -6 -8 -3 -12" fill="none" stroke={FLOW_COLORS.leafDark} strokeWidth={1.4} strokeLinecap="round" opacity={0.6} />
          <path d="M 0 0 Q 0 -10 1 -14" fill="none" stroke={FLOW_COLORS.leafDark} strokeWidth={1.4} strokeLinecap="round" opacity={0.6} />
          <path d="M 5 0 Q 6 -8 4 -12" fill="none" stroke={FLOW_COLORS.leafDark} strokeWidth={1.4} strokeLinecap="round" opacity={0.6} />
        </g>
      ))}
    </motion.g>
  );
}

/* ============================================================
   BUTTERFLY (Sub 1)
   ============================================================ */

function Butterfly({
  cx,
  cy,
  delay,
  variant = 'main',
}: {
  cx: number;
  cy: number;
  delay: number;
  variant?: 'main' | 'alt';
}) {
  const wingColor = variant === 'main' ? FLOW_COLORS.gold : FLOW_COLORS.slateLight;

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        x: [0, 60, 30, 90, 50, 100, 130],
        y: [0, -20, -10, -30, -5, -25, -15],
      }}
      transition={{
        duration: 4.5,
        times: [0, 0.1, 0.3, 0.5, 0.7, 0.85, 1],
        delay,
        ease: 'easeInOut',
      }}
    >
      <g transform={`translate(${cx}, ${cy})`}>
        {/* Cuerpo */}
        <line x1={0} y1={-3} x2={0} y2={3} stroke={STROKE_BUTTERFLY} strokeWidth={1.6} strokeLinecap="round" />
        {/* Ala superior izquierda */}
        <motion.ellipse
          cx={-5}
          cy={-2}
          rx={5.5}
          ry={3.5}
          fill={wingColor}
          fillOpacity={0.7}
          stroke={STROKE_BUTTERFLY}
          strokeWidth={1.2}
          animate={{ scaleX: [1, 0.6, 1] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '0px -2px' }}
        />
        {/* Ala superior derecha */}
        <motion.ellipse
          cx={5}
          cy={-2}
          rx={5.5}
          ry={3.5}
          fill={wingColor}
          fillOpacity={0.7}
          stroke={STROKE_BUTTERFLY}
          strokeWidth={1.2}
          animate={{ scaleX: [1, 0.6, 1] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '0px -2px' }}
        />
        {/* Ala inferior izquierda */}
        <motion.ellipse
          cx={-4}
          cy={3}
          rx={4}
          ry={2.5}
          fill={wingColor}
          fillOpacity={0.65}
          stroke={STROKE_BUTTERFLY}
          strokeWidth={1}
          animate={{ scaleX: [1, 0.6, 1] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '0px 3px' }}
        />
        <motion.ellipse
          cx={4}
          cy={3}
          rx={4}
          ry={2.5}
          fill={wingColor}
          fillOpacity={0.65}
          stroke={STROKE_BUTTERFLY}
          strokeWidth={1}
          animate={{ scaleX: [1, 0.6, 1] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '0px 3px' }}
        />
      </g>
    </motion.g>
  );
}

/* ============================================================
   BIRDS (siluetas tipo "M")
   ============================================================ */

function Birds({ delay }: { delay: number }) {
  return (
    <motion.g
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: VIEW_W + 100, opacity: [0, 1, 1, 0] }}
      transition={{
        x: { duration: 14, delay, ease: 'linear' },
        opacity: { duration: 14, delay, times: [0, 0.1, 0.85, 1] },
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
        stroke={STROKE_BIRD}
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
        opacity={0.85}
      />
    </g>
  );
}

/* ============================================================
   FALLING SACK
   ============================================================ */

interface FallingSackProps {
  x: number;
  landY: number;
  label: string;
  color: string;
  delay: number;
  totalDuration: number;
}

function FallingSack({ x, landY, label, color, delay, totalDuration }: FallingSackProps) {
  // Caída real de 1s: balance entre rápido y visible
  const start = delay / totalDuration;
  const fallEnd = (delay + 1.0) / totalDuration;
  const settle = (delay + 1.2) / totalDuration;
  const fadeOut = Math.min(1, (delay + 2.0) / totalDuration);

  return (
    <>
      <motion.g
        initial={{ y: -280, opacity: 0, rotate: -15 }}
        animate={{
          y: [-280, -280, 0, 8, 0, 0],
          opacity: [0, 1, 1, 1, 1, 0],
          rotate: [-15, -15, 5, -2, 0, 0],
        }}
        transition={{
          duration: totalDuration,
          times: [0, start, fallEnd, settle, (settle + fadeOut) / 2, fadeOut],
          ease: 'easeIn',
        }}
      >
        <g transform={`translate(${x}, ${landY}) scale(0.65)`}>
          <path
            d="M -34 -48 Q -40 -8 -36 28 Q -34 42 -20 46 L 20 46 Q 34 42 36 28 Q 40 -8 34 -48 L 28 -48 Q 28 -44 22 -44 L -22 -44 Q -28 -44 -28 -48 Z"
            fill={color}
            fillOpacity={0.45}
            stroke={STROKE_SACK}
            strokeWidth={STROKE_WIDTH}
            strokeLinejoin="round"
          />
          <path
            d="M -22 -48 L -26 -60 L -14 -56 L -6 -62 L 0 -56 L 6 -62 L 14 -56 L 26 -60 L 22 -48 Z"
            fill={color}
            fillOpacity={0.35}
            stroke={STROKE_SACK}
            strokeWidth={STROKE_WIDTH}
            strokeLinejoin="round"
          />
          <circle cx={0} cy={-5} r={14} fill={color} fillOpacity={0.5} stroke={STROKE_SACK} strokeWidth={1.8} />
          <text x={0} y={1} textAnchor="middle" fontSize={16} fontWeight={700} fill={STROKE_SACK} fontFamily="system-ui">
            {label}
          </text>
        </g>
      </motion.g>

      <motion.ellipse
        cx={x}
        cy={landY + 35}
        rx={30}
        ry={4}
        fill={STROKE_EARTH}
        opacity={0}
        animate={{
          opacity: [0, 0, 0.4, 0],
          rx: [26, 26, 46, 56],
        }}
        transition={{
          duration: totalDuration,
          times: [0, fallEnd, settle, fadeOut],
          ease: 'easeOut',
        }}
      />
    </>
  );
}

/* ============================================================
   SUN
   ============================================================ */

function Sun({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const rays = Array.from({ length: 8 });
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={`0 ${cx} ${cy}`}
          to={`360 ${cx} ${cy}`}
          dur="24s"
          repeatCount="indefinite"
        />
        {rays.map((_, i) => {
          const angle = (i * 360) / rays.length;
          const rad = (angle * Math.PI) / 180;
          const x1 = cx + Math.cos(rad) * (r + 12);
          const y1 = cy + Math.sin(rad) * (r + 12);
          const x2 = cx + Math.cos(rad) * (r + 35);
          const y2 = cy + Math.sin(rad) * (r + 35);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={STROKE_SUN} strokeWidth={STROKE_WIDTH} strokeLinecap="round" opacity={0.95} />;
        })}
      </g>
      {/* Disco solar amarillo vibrante */}
      <circle cx={cx} cy={cy} r={r} fill="#FFC93C" fillOpacity={0.95} stroke={STROKE_SUN} strokeWidth={STROKE_WIDTH} />
      {/* Brillo interior amarillo más claro */}
      <circle cx={cx} cy={cy} r={r - 8} fill="#FFE066" fillOpacity={0.8} />
      {/* Anillo decorativo naranja */}
      <circle cx={cx} cy={cy} r={r - 14} fill="none" stroke={STROKE_SUN} strokeWidth={1.4} opacity={0.5} />
    </motion.g>
  );
}

/* ============================================================
   SPRINKLER
   ============================================================ */

/* ============================================================
   DRON (quadcopter sobrevolando la parcela)
   ============================================================ */

const DRONE_BODY = '#3A4250'; // gris oscuro acerado
const DRONE_STROKE = '#1F2530';

function Drone({ delay, duration = 5 }: { delay: number; duration?: number }) {
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      {/* Movimiento horizontal del dron (left → right) con bobbing vertical */}
      <motion.g
        initial={{ x: -100 }}
        animate={{
          x: [-100, VIEW_W + 100],
        }}
        transition={{
          duration,
          delay,
          ease: 'easeInOut',
        }}
      >
        <motion.g
          animate={{ y: [0, -4, 0, 4, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <DroneShape />
        </motion.g>
      </motion.g>
    </motion.g>
  );
}

function DroneShape() {
  const droneY = 270;
  return (
    <g transform={`translate(0, ${droneY})`}>
      {/* Sombra proyectada sobre la parcela */}
      <ellipse cx={0} cy={190} rx={30} ry={4} fill={STROKE_EARTH} opacity={0.18} />

      {/* === BRAZOS EN X (perspectiva 3/4) === */}
      {/* Frontales (más visibles) */}
      <line x1={-13} y1={-3} x2={-34} y2={-14} stroke={DRONE_STROKE} strokeWidth={2.8} strokeLinecap="round" />
      <line x1={13} y1={-3} x2={34} y2={-14} stroke={DRONE_STROKE} strokeWidth={2.8} strokeLinecap="round" />
      {/* Traseros (más cortos por perspectiva) */}
      <line x1={-13} y1={3} x2={-26} y2={11} stroke={DRONE_STROKE} strokeWidth={2.4} strokeLinecap="round" opacity={0.85} />
      <line x1={13} y1={3} x2={26} y2={11} stroke={DRONE_STROKE} strokeWidth={2.4} strokeLinecap="round" opacity={0.85} />

      {/* === CUERPO PRINCIPAL (forma estilizada) === */}
      <path
        d="M -14 -10 Q -16 -10 -16 -7 L -16 7 Q -16 10 -14 10 L 14 10 Q 16 10 16 7 L 16 -7 Q 16 -10 14 -10 Z"
        fill={DRONE_BODY}
        stroke={DRONE_STROKE}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      {/* Banda lateral acento (estilo industrial) */}
      <line x1={-14} y1={-3} x2={14} y2={-3} stroke={TRACTOR_YELLOW} strokeWidth={1.4} opacity={0.85} />
      {/* Highlight superior */}
      <line x1={-11} y1={-7} x2={11} y2={-7} stroke="white" strokeWidth={0.8} opacity={0.3} />

      {/* LED frontal (amarillo) */}
      <circle cx={12} cy={0} r={1.8} fill={TRACTOR_YELLOW} stroke={DRONE_STROKE} strokeWidth={0.6} />
      {/* LED trasero (rojo) */}
      <circle cx={-12} cy={0} r={1.6} fill="#D14B3A" stroke={DRONE_STROKE} strokeWidth={0.6} />

      {/* === TANQUE DE INSUMOS (debajo del cuerpo) === */}
      <rect x={-10} y={10} width={20} height={7} rx={2} fill={DRONE_BODY} stroke={DRONE_STROKE} strokeWidth={1.8} />
      {/* Línea decorativa del tanque */}
      <line x1={-7} y1={13.5} x2={7} y2={13.5} stroke={TRACTOR_YELLOW} strokeWidth={0.8} opacity={0.7} />

      {/* === BARRA DE ASPERSIÓN (debajo del tanque) === */}
      <line x1={-15} y1={17} x2={15} y2={17} stroke={DRONE_STROKE} strokeWidth={2.2} strokeLinecap="round" />
      {/* Boquillas (3 pequeñas) */}
      <circle cx={-9} cy={18.5} r={0.8} fill={DRONE_STROKE} />
      <circle cx={0} cy={18.5} r={0.8} fill={DRONE_STROKE} />
      <circle cx={9} cy={18.5} r={0.8} fill={DRONE_STROKE} />

      {/* === 4 ROTORES (con motion blur) === */}
      <Rotor cx={-34} cy={-14} size={10} />
      <Rotor cx={34} cy={-14} size={10} />
      <Rotor cx={-26} cy={11} size={7.5} />
      <Rotor cx={26} cy={11} size={7.5} />

      {/* === CONO DE ASPERSIÓN === */}
      <SprayCone />
    </g>
  );
}

function SprayCone() {
  return (
    <g>
      {/* Capa exterior del cono (difusa, más ancha) */}
      <motion.path
        d="M -14 19 L -34 90 L 34 90 L 14 19 Z"
        fill="#A8D8F0"
        animate={{ opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Capa media */}
      <motion.path
        d="M -10 19 L -24 80 L 24 80 L 10 19 Z"
        fill="#4FA3E0"
        animate={{ opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
      />
      {/* Núcleo del cono (más denso) */}
      <motion.path
        d="M -6 19 L -14 70 L 14 70 L 6 19 Z"
        fill="#4FA3E0"
        animate={{ opacity: [0.45, 0.65, 0.45] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      />

      {/* Líneas de flujo dinámico (chorros animados) */}
      {[-10, -5, 0, 5, 10].map((offset, i) => {
        const spread = offset * 2.4;
        return (
          <line
            key={i}
            x1={offset * 0.8}
            y1={19}
            x2={offset * 0.8 + spread}
            y2={75}
            stroke={STROKE_CLOUD}
            strokeWidth={1}
            strokeOpacity={0.65}
            strokeDasharray="4 3"
            strokeLinecap="round"
          >
            <animate
              attributeName="stroke-dashoffset"
              from={0}
              to={-7}
              dur="0.5s"
              repeatCount="indefinite"
            />
          </line>
        );
      })}
    </g>
  );
}

function Rotor({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  return (
    <g>
      {/* Disco translúcido (motion blur del rotor girando) */}
      <ellipse cx={cx} cy={cy} rx={size} ry={size * 0.3} fill={DRONE_STROKE} opacity={0.15} />
      {/* Aspas en cruz - 2 líneas rotando rápido */}
      <line
        x1={cx - size}
        y1={cy}
        x2={cx + size}
        y2={cy}
        stroke={DRONE_STROKE}
        strokeWidth={1.6}
        opacity={0.55}
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={`0 ${cx} ${cy}`}
          to={`360 ${cx} ${cy}`}
          dur="0.18s"
          repeatCount="indefinite"
        />
      </line>
      <line
        x1={cx - size}
        y1={cy}
        x2={cx + size}
        y2={cy}
        stroke={DRONE_STROKE}
        strokeWidth={1.4}
        opacity={0.4}
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={`90 ${cx} ${cy}`}
          to={`450 ${cx} ${cy}`}
          dur="0.18s"
          repeatCount="indefinite"
        />
      </line>
      {/* Hub central */}
      <circle cx={cx} cy={cy} r={2.2} fill={DRONE_BODY} stroke={DRONE_STROKE} strokeWidth={1} />
      <circle cx={cx} cy={cy} r={0.8} fill={DRONE_STROKE} />
    </g>
  );
}


/* ============================================================
   SPROUT
   ============================================================ */

// Verdes intensos para brotes (germinación fresca)
const SPROUT_GREEN = '#2EAA55';
const SPROUT_GREEN_LIGHT = '#5BD96E';
const SPROUT_STROKE = '#0F6E2C'; // verde oscuro intenso para contornos

function Sprout({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <motion.g
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 0.6, delay, type: 'spring', stiffness: 300, damping: 12 }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      {/* Sombra suave */}
      <ellipse cx={x} cy={y + 4} rx={14} ry={2.5} fill={STROKE_MAIN} opacity={0.1} />

      <g transform={`translate(${x}, ${y}) scale(1.4)`}>
        {/* Tallo (verde intenso) */}
        <line x1={0} y1={0} x2={0} y2={-22} stroke={SPROUT_STROKE} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />

        {/* Hoja izquierda (path orgánico, forma de almendra) */}
        <path
          d="M 0 -16 Q -14 -18 -14 -28 Q -3 -22 0 -16 Z"
          fill={SPROUT_GREEN}
          fillOpacity={0.9}
          stroke={SPROUT_STROKE}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {/* Nervadura central izq */}
        <path
          d="M 0 -16 Q -7 -22 -12 -27"
          fill="none"
          stroke={SPROUT_STROKE}
          strokeWidth={1}
          opacity={0.7}
          strokeLinecap="round"
        />

        {/* Hoja derecha (espejo) */}
        <path
          d="M 0 -16 Q 14 -18 14 -28 Q 3 -22 0 -16 Z"
          fill={SPROUT_GREEN}
          fillOpacity={0.9}
          stroke={SPROUT_STROKE}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {/* Nervadura central der */}
        <path
          d="M 0 -16 Q 7 -22 12 -27"
          fill="none"
          stroke={SPROUT_STROKE}
          strokeWidth={1}
          opacity={0.7}
          strokeLinecap="round"
        />

        {/* Hoja superior (más pequeña, verde más claro - crecimiento nuevo) */}
        <path
          d="M 0 -22 Q -4 -26 0 -33 Q 4 -26 0 -22 Z"
          fill={SPROUT_GREEN_LIGHT}
          fillOpacity={0.95}
          stroke={SPROUT_STROKE}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </g>
    </motion.g>
  );
}

/* ============================================================
   MATURE PLANT — Lechuga (roseta orgánica)
   ============================================================ */

function MaturePlant({
  x,
  y,
  delay,
  scale = 1.25,
}: {
  x: number;
  y: number;
  delay: number;
  scale?: number;
}) {
  return (
    <motion.g
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 0.5, delay, type: 'spring', stiffness: 220, damping: 14 }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      {/* Sombra suave */}
      <ellipse cx={x} cy={y + 10} rx={28 * scale} ry={4 * scale} fill={STROKE_LETTUCE} opacity={0.18} />

      <g transform={`translate(${x}, ${y}) scale(${scale})`}>
        <LechugaShape />
      </g>
    </motion.g>
  );
}

function LechugaShape() {
  // Hoja vertical estilo lechuga romana: estrecha en base, ancha al medio, redondeada arriba, bordes ondulados.
  // Origen en la base (0,0), crece hacia arriba (Y negativa). Altura ~42 unidades.
  const LEAF = `
    M 0 0
    Q -2 -2 -4 -4
    C -8 -8 -11 -11 -10 -15
    C -8 -19 -12 -22 -11 -26
    C -8 -30 -13 -33 -10 -37
    C -7 -41 -4 -42 0 -42
    C 4 -42 7 -41 10 -37
    C 13 -33 8 -30 11 -26
    C 12 -22 8 -19 10 -15
    C 11 -11 8 -8 4 -4
    Q 2 -2 0 0
    Z
  `;
  // Nervadura central crema
  const RIB = 'M 0 -2 L 0 -36';
  // Nervaduras laterales (herringbone)
  const VEINS_LEFT = 'M 0 -12 Q -4 -10 -7 -8 M 0 -22 Q -5 -20 -8 -18 M 0 -30 Q -4 -28 -7 -27';
  const VEINS_RIGHT = 'M 0 -12 Q 4 -10 7 -8 M 0 -22 Q 5 -20 8 -18 M 0 -30 Q 4 -28 7 -27';
  const RIB_CREAM = '#F0E8B8';

  return (
    <>
      {/* Hojas de fondo (asomando detrás de las principales) */}
      <g transform="rotate(-38) translate(0, 3) scale(0.85)">
        <path d={LEAF} fill={FLOW_COLORS.leafDark} fillOpacity={0.75} stroke={STROKE_LETTUCE} strokeWidth={1.5} strokeLinejoin="round" />
      </g>
      <g transform="rotate(38) translate(0, 3) scale(0.85)">
        <path d={LEAF} fill={FLOW_COLORS.leafDark} fillOpacity={0.75} stroke={STROKE_LETTUCE} strokeWidth={1.5} strokeLinejoin="round" />
      </g>
      <g transform="rotate(-22) translate(-2, 1) scale(0.92)">
        <path d={LEAF} fill={SPROUT_GREEN} fillOpacity={0.85} stroke={STROKE_LETTUCE} strokeWidth={1.5} strokeLinejoin="round" />
      </g>
      <g transform="rotate(22) translate(2, 1) scale(0.92)">
        <path d={LEAF} fill={SPROUT_GREEN} fillOpacity={0.85} stroke={STROKE_LETTUCE} strokeWidth={1.5} strokeLinejoin="round" />
      </g>

      {/* 3 hojas principales al frente con nervadura central crema */}
      {/* Hoja izquierda */}
      <g transform="rotate(-10) translate(-8, 0)">
        <path d={LEAF} fill={SPROUT_GREEN_LIGHT} fillOpacity={0.95} stroke={STROKE_LETTUCE} strokeWidth={1.8} strokeLinejoin="round" />
        <path d={VEINS_LEFT} fill="none" stroke={STROKE_LETTUCE} strokeWidth={0.7} opacity={0.55} strokeLinecap="round" />
        <path d={VEINS_RIGHT} fill="none" stroke={STROKE_LETTUCE} strokeWidth={0.7} opacity={0.55} strokeLinecap="round" />
        <path d={RIB} fill="none" stroke={RIB_CREAM} strokeWidth={2.2} strokeLinecap="round" />
        <path d={RIB} fill="none" stroke={STROKE_LETTUCE} strokeWidth={0.5} opacity={0.4} strokeLinecap="round" />
      </g>

      {/* Hoja central (al frente, ligeramente más grande) */}
      <g transform="scale(1.05)">
        <path d={LEAF} fill={SPROUT_GREEN_LIGHT} fillOpacity={0.98} stroke={STROKE_LETTUCE} strokeWidth={1.8} strokeLinejoin="round" />
        <path d={VEINS_LEFT} fill="none" stroke={STROKE_LETTUCE} strokeWidth={0.7} opacity={0.55} strokeLinecap="round" />
        <path d={VEINS_RIGHT} fill="none" stroke={STROKE_LETTUCE} strokeWidth={0.7} opacity={0.55} strokeLinecap="round" />
        <path d={RIB} fill="none" stroke={RIB_CREAM} strokeWidth={2.4} strokeLinecap="round" />
        <path d={RIB} fill="none" stroke={STROKE_LETTUCE} strokeWidth={0.5} opacity={0.4} strokeLinecap="round" />
      </g>

      {/* Hoja derecha */}
      <g transform="rotate(10) translate(8, 0)">
        <path d={LEAF} fill={SPROUT_GREEN_LIGHT} fillOpacity={0.95} stroke={STROKE_LETTUCE} strokeWidth={1.8} strokeLinejoin="round" />
        <path d={VEINS_LEFT} fill="none" stroke={STROKE_LETTUCE} strokeWidth={0.7} opacity={0.55} strokeLinecap="round" />
        <path d={VEINS_RIGHT} fill="none" stroke={STROKE_LETTUCE} strokeWidth={0.7} opacity={0.55} strokeLinecap="round" />
        <path d={RIB} fill="none" stroke={RIB_CREAM} strokeWidth={2.2} strokeLinecap="round" />
        <path d={RIB} fill="none" stroke={STROKE_LETTUCE} strokeWidth={0.5} opacity={0.4} strokeLinecap="round" />
      </g>
    </>
  );
}

/* ============================================================
   TRACTOR
   ============================================================ */

interface TractorProps {
  startX: number;
  endX: number;
  delay: number;
  duration: number;
}

function Tractor({ startX, endX, delay, duration }: TractorProps) {
  const tractorY = 455;
  const tractorScale = 1.4;

  return (
    <motion.g
      initial={{ x: startX, opacity: 0 }}
      animate={{ x: endX - startX, opacity: 1 }}
      transition={{
        x: { duration, delay, ease: 'easeOut' },
        opacity: { duration: 0.4, delay },
      }}
    >
      <g transform={`translate(0, ${tractorY}) scale(${tractorScale})`}>
        {/* Sombra */}
        <ellipse cx={-5} cy={20} rx={82} ry={5} fill={TRACTOR_TIRE} opacity={0.3} />

        {/* === BLOQUE MOTOR (capó al frente, derecha) === */}
        <rect
          x={18}
          y={-26}
          width={44}
          height={24}
          rx={3}
          fill={TRACTOR_GREEN}
          stroke={TRACTOR_GREEN_DARK}
          strokeWidth={STROKE_WIDTH}
        />
        {/* Línea amarilla horizontal acento Deere */}
        <line x1={18} y1={-10} x2={62} y2={-10} stroke={TRACTOR_YELLOW} strokeWidth={2.4} />

        {/* Rejilla frontal negra */}
        <rect x={55} y={-22} width={7} height={18} fill={TRACTOR_TIRE} stroke={TRACTOR_GREEN_DARK} strokeWidth={1.4} />
        {/* Líneas horizontales rejilla */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={`grille-${i}`}
            x1={55}
            y1={-20 + i * 3.5}
            x2={62}
            y2={-20 + i * 3.5}
            stroke="#3A3A3A"
            strokeWidth={0.8}
          />
        ))}

        {/* Faro delantero amarillo (intermitente lateral) */}
        <rect x={56} y={-26} width={6} height={3} fill={TRACTOR_YELLOW} stroke={TRACTOR_GREEN_DARK} strokeWidth={1} />

        {/* === CUERPO CENTRAL (chasis entre cabina y motor) === */}
        <rect
          x={-10}
          y={-12}
          width={32}
          height={14}
          fill={TRACTOR_GREEN}
          stroke={TRACTOR_GREEN_DARK}
          strokeWidth={STROKE_WIDTH}
        />
        {/* Línea amarilla del chasis */}
        <line x1={-10} y1={-3} x2={22} y2={-3} stroke={TRACTOR_YELLOW} strokeWidth={2} />

        {/* === CABINA DEL OPERADOR === */}
        <path
          d="M -18 -58 Q -20 -60 -16 -60 L 22 -60 Q 26 -60 24 -58 L 28 -22 L -22 -22 Z"
          fill={TRACTOR_GREEN}
          stroke={TRACTOR_GREEN_DARK}
          strokeWidth={STROKE_WIDTH}
          strokeLinejoin="round"
        />

        {/* Postes verticales (frame de cabina) */}
        <line x1={-14} y1={-58} x2={-18} y2={-22} stroke={TRACTOR_GREEN_DARK} strokeWidth={2.2} strokeLinecap="round" />
        <line x1={22} y1={-58} x2={26} y2={-22} stroke={TRACTOR_GREEN_DARK} strokeWidth={2.2} strokeLinecap="round" />

        {/* === VENTANA GRANDE (cristal) === */}
        <path
          d="M -10 -56 L 20 -56 L 23 -28 L -13 -28 Z"
          fill="#E8F2F5"
          fillOpacity={0.9}
          stroke={TRACTOR_GREEN_DARK}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        {/* División vertical de la ventana */}
        <line x1={5} y1={-56} x2={5} y2={-28} stroke={TRACTOR_GREEN_DARK} strokeWidth={1.8} />
        {/* Reflejos en cristal */}
        <line x1={-6} y1={-52} x2={0} y2={-32} stroke="white" strokeWidth={1.5} opacity={0.75} />
        <line x1={10} y1={-52} x2={16} y2={-32} stroke="white" strokeWidth={1.5} opacity={0.55} />

        {/* === LUZ BALIZA AMARILLA EN TECHO === */}
        <line x1={20} y1={-60} x2={20} y2={-66} stroke={TRACTOR_GREEN_DARK} strokeWidth={1.4} />
        <circle cx={20} cy={-68} r={2.8} fill={TRACTOR_YELLOW} stroke={TRACTOR_GREEN_DARK} strokeWidth={1.4} />

        {/* === TUBO DE ESCAPE VERTICAL === */}
        <rect
          x={-24}
          y={-70}
          width={5}
          height={48}
          fill={TRACTOR_GREEN_DARK}
          stroke={TRACTOR_GREEN_DARK}
          strokeWidth={1.4}
        />
        <ellipse cx={-21.5} cy={-70} rx={4} ry={1.6} fill={TRACTOR_GREEN_DARK} />

        {/* Humo del escape */}
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={`exhaust-${i}`}
            cx={-21.5}
            cy={-74}
            r={2}
            fill="white"
            fillOpacity={0.6}
            stroke={STROKE_CLOUD}
            strokeWidth={0.8}
            strokeOpacity={0.5}
            animate={{
              cy: [-74, -92],
              cx: [-21.5, -18 + i * 1.5],
              r: [2, 4],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.6,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* === ETIQUETA COLLECTA EN CHASIS === */}
        <rect
          x={-8}
          y={-9}
          width={26}
          height={5}
          rx={1}
          fill={TRACTOR_YELLOW}
          stroke={TRACTOR_GREEN_DARK}
          strokeWidth={1}
        />
        <text
          x={5}
          y={-4.7}
          textAnchor="middle"
          fontSize={4.5}
          fontWeight={800}
          fill={TRACTOR_GREEN_DARK}
          fontFamily="system-ui"
          letterSpacing={0.5}
        >
          COLLECTA
        </text>

        {/* === ESCALÓN PARA SUBIR A CABINA === */}
        <line x1={-18} y1={-12} x2={-18} y2={6} stroke={TRACTOR_GREEN_DARK} strokeWidth={1.6} strokeLinecap="round" />
        <line x1={-22} y1={-2} x2={-14} y2={-2} stroke={TRACTOR_GREEN_DARK} strokeWidth={1.6} strokeLinecap="round" />
        <line x1={-22} y1={4} x2={-14} y2={4} stroke={TRACTOR_GREEN_DARK} strokeWidth={1.6} strokeLinecap="round" />

        {/* === RUEDA TRASERA GRANDE (izquierda, distintivo del tractor) === */}
        <g>
          {/* Neumático negro grande */}
          <circle cx={-32} cy={2} r={22} fill={TRACTOR_TIRE} stroke={TRACTOR_GREEN_DARK} strokeWidth={STROKE_WIDTH} />
          {/* Banda de rodadura (12 marcas radiales agresivas) */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = -32 + Math.cos(angle) * 16.5;
            const y1 = 2 + Math.sin(angle) * 16.5;
            const x2 = -32 + Math.cos(angle) * 21.5;
            const y2 = 2 + Math.sin(angle) * 21.5;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#000"
                strokeWidth={2}
                opacity={0.65}
              />
            );
          })}
          {/* Disco/llanta amarilla */}
          <circle cx={-32} cy={2} r={13} fill={TRACTOR_YELLOW} stroke={TRACTOR_GREEN_DARK} strokeWidth={2} />
          {/* Radios curvados del disco (estilo Deere) */}
          {Array.from({ length: 5 }).map((_, i) => {
            const angle = ((i * 72 - 90) * Math.PI) / 180;
            const x1 = -32 + Math.cos(angle) * 3.5;
            const y1 = 2 + Math.sin(angle) * 3.5;
            const x2 = -32 + Math.cos(angle) * 11;
            const y2 = 2 + Math.sin(angle) * 11;
            return (
              <line
                key={`spoke-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={TRACTOR_GREEN_DARK}
                strokeWidth={1.6}
                opacity={0.65}
                strokeLinecap="round"
              />
            );
          })}
          {/* Cubo central */}
          <circle cx={-32} cy={2} r={3.2} fill={TRACTOR_GREEN_DARK} />
          <animateTransform attributeName="transform" type="rotate" from="0 -32 2" to="-360 -32 2" dur="2.6s" repeatCount="indefinite" />
        </g>

        {/* === RUEDA DELANTERA PEQUEÑA (derecha) === */}
        <g>
          {/* Neumático negro */}
          <circle cx={48} cy={6} r={12} fill={TRACTOR_TIRE} stroke={TRACTOR_GREEN_DARK} strokeWidth={STROKE_WIDTH} />
          {/* Banda de rodadura */}
          {Array.from({ length: 10 }).map((_, i) => {
            const angle = (i * 36 * Math.PI) / 180;
            const x1 = 48 + Math.cos(angle) * 8.5;
            const y1 = 6 + Math.sin(angle) * 8.5;
            const x2 = 48 + Math.cos(angle) * 11.5;
            const y2 = 6 + Math.sin(angle) * 11.5;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#000"
                strokeWidth={1.4}
                opacity={0.65}
              />
            );
          })}
          {/* Disco/llanta amarillo */}
          <circle cx={48} cy={6} r={6} fill={TRACTOR_YELLOW} stroke={TRACTOR_GREEN_DARK} strokeWidth={1.6} />
          {/* Radios pequeños */}
          {[0, 72, 144, 216, 288].map((angleDeg) => {
            const rad = ((angleDeg - 90) * Math.PI) / 180;
            const x2 = 48 + Math.cos(rad) * 5;
            const y2 = 6 + Math.sin(rad) * 5;
            return <line key={angleDeg} x1={48} y1={6} x2={x2} y2={y2} stroke={TRACTOR_GREEN_DARK} strokeWidth={1} opacity={0.6} />;
          })}
          <circle cx={48} cy={6} r={1.8} fill={TRACTOR_GREEN_DARK} />
          <animateTransform attributeName="transform" type="rotate" from="0 48 6" to="-360 48 6" dur="1.4s" repeatCount="indefinite" />
        </g>
      </g>
    </motion.g>
  );
}

/* ============================================================
   BARN — granero como ancla visual (estilo SVGator building)
   ============================================================ */

function Barn({ active }: { active: boolean }) {
  // Posicionado a la izquierda-fondo, entre colina y campo
  const cx = 230;
  const baseY = 420;
  const w = 80;
  const h = 50;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.7 }}
      transition={{ duration: 0.7, delay: 1.2, type: 'spring', stiffness: 200, damping: 18 }}
      style={{ transformOrigin: `${cx}px ${baseY}px` }}
    >
      {/* Sombra */}
      <ellipse cx={cx} cy={baseY + 2} rx={w / 2 + 6} ry={3} fill={STROKE_EARTH} opacity={0.18} />

      {/* Cuerpo del granero */}
      <rect
        x={cx - w / 2}
        y={baseY - h}
        width={w}
        height={h}
        fill={FLOW_COLORS.cream}
        fillOpacity={0.5}
        stroke={STROKE_EARTH}
        strokeWidth={STROKE_WIDTH}
      />

      {/* Techo a dos aguas (terracotta - acento estilo SVGator) */}
      <path
        d={`M ${cx - w / 2 - 4} ${baseY - h} L ${cx} ${baseY - h - 24} L ${cx + w / 2 + 4} ${baseY - h} Z`}
        fill={TERRACOTTA}
        fillOpacity={0.7}
        stroke={STROKE_TERRACOTTA}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />

      {/* Línea decorativa del techo */}
      <line
        x1={cx - w / 2 - 4}
        y1={baseY - h + 1}
        x2={cx + w / 2 + 4}
        y2={baseY - h + 1}
        stroke={STROKE_TERRACOTTA}
        strokeWidth={1.4}
        opacity={0.7}
      />

      {/* Puerta del granero (X tradicional) */}
      <rect
        x={cx - 12}
        y={baseY - 30}
        width={24}
        height={30}
        fill={FLOW_COLORS.earthDark}
        fillOpacity={0.2}
        stroke={STROKE_EARTH}
        strokeWidth={2}
      />
      <line x1={cx - 12} y1={baseY - 30} x2={cx + 12} y2={baseY} stroke={STROKE_EARTH} strokeWidth={1.4} opacity={0.65} />
      <line x1={cx + 12} y1={baseY - 30} x2={cx - 12} y2={baseY} stroke={STROKE_EARTH} strokeWidth={1.4} opacity={0.65} />
      <line x1={cx} y1={baseY - 30} x2={cx} y2={baseY} stroke={STROKE_EARTH} strokeWidth={1.4} opacity={0.65} />

      {/* Ventana en el techo */}
      <circle
        cx={cx}
        cy={baseY - h - 8}
        r={4}
        fill={FLOW_COLORS.frost}
        fillOpacity={0.7}
        stroke={STROKE_CLOUD}
        strokeWidth={1.6}
      />
      <line x1={cx - 4} y1={baseY - h - 8} x2={cx + 4} y2={baseY - h - 8} stroke={STROKE_CLOUD} strokeWidth={1} opacity={0.6} />
      <line x1={cx} y1={baseY - h - 12} x2={cx} y2={baseY - h - 4} stroke={STROKE_CLOUD} strokeWidth={1} opacity={0.6} />

      {/* Detalle: tablones laterales sutiles */}
      <line x1={cx - w / 2 + 8} y1={baseY - h + 4} x2={cx - w / 2 + 8} y2={baseY - 4} stroke={STROKE_EARTH} strokeWidth={1} opacity={0.4} />
      <line x1={cx + w / 2 - 8} y1={baseY - h + 4} x2={cx + w / 2 - 8} y2={baseY - 4} stroke={STROKE_EARTH} strokeWidth={1} opacity={0.4} />

      {/* Chimenea con humo */}
      <rect
        x={cx + 18}
        y={baseY - h - 18}
        width={8}
        height={14}
        fill={TERRACOTTA}
        fillOpacity={0.55}
        stroke={STROKE_TERRACOTTA}
        strokeWidth={1.6}
      />
      {/* Humo - 3 nubecitas que suben */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={`smoke-${i}`}
          cx={cx + 22}
          cy={baseY - h - 22}
          r={3}
          fill="white"
          fillOpacity={0.6}
          stroke={STROKE_CLOUD}
          strokeWidth={1}
          strokeOpacity={0.5}
          animate={{
            cy: [baseY - h - 22, baseY - h - 50],
            cx: [cx + 22, cx + 30 + i * 2],
            r: [3, 6],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 1.0,
            ease: 'easeOut',
          }}
        />
      ))}
    </motion.g>
  );
}

/* ============================================================
   PERIMETER TREE (estilo SVGator)
   ============================================================ */

function PerimeterTree({
  cx,
  cy,
  scale = 1,
  active,
  delay,
}: {
  cx: number;
  cy: number;
  scale?: number;
  active: boolean;
  delay: number;
}) {
  return (
    <motion.g
      transform={`translate(${cx}, ${cy}) scale(${scale})`}
      initial={{ opacity: 0, scale: scale * 0.5 }}
      animate={{ opacity: active ? 1 : 0, scale: active ? scale : scale * 0.5 }}
      transition={{ duration: 0.6, delay, type: 'spring', stiffness: 180, damping: 14 }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      {/* Sombra */}
      <ellipse cx={0} cy={2} rx={26} ry={3} fill={STROKE_MAIN} opacity={0.1} />
      {/* Tronco */}
      <line x1={0} y1={0} x2={0} y2={-30} stroke={STROKE_EARTH} strokeWidth={2.4} strokeLinecap="round" />
      {/* Arbusto base (más grande, atrás) */}
      <ellipse cx={-12} cy={-4} rx={15} ry={11} fill={FLOW_COLORS.leafDark} fillOpacity={0.4} stroke={STROKE_TREE} strokeWidth={2} />
      {/* Copa principal */}
      <circle cx={0} cy={-36} r={20} fill={FLOW_COLORS.leaf} fillOpacity={0.55} stroke={STROKE_TREE} strokeWidth={STROKE_WIDTH} />
      {/* Tronco visible dentro de la copa (rama central) */}
      <line x1={0} y1={-16} x2={0} y2={-32} stroke={STROKE_EARTH} strokeWidth={1.2} opacity={0.6} />
      {/* Pequeñas ramitas */}
      <line x1={0} y1={-28} x2={-6} y2={-32} stroke={STROKE_TREE} strokeWidth={1.2} opacity={0.6} strokeLinecap="round" />
      <line x1={0} y1={-26} x2={6} y2={-30} stroke={STROKE_TREE} strokeWidth={1.2} opacity={0.6} strokeLinecap="round" />
    </motion.g>
  );
}
