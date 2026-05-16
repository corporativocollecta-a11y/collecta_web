'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FLOW_COLORS, VIEW_W, VIEW_H } from '../types';

interface Phase4ClienteProps {
  active: boolean;
  onSubChange?: (sub: number) => void;
}

const STROKE_MAIN = '#2A2A2A';
const STROKE_WIDTH = 2.8;
const TERRACOTTA = '#B85A3D';
const STEEL = '#5B7BA6';
const ACCENT_GREEN = '#5B7B3F';

/**
 * FASE 4 — Cliente (entrega y verificación)
 *
 * SUB 0 (0 → 4s): Camión COLLECTA llega a bodega del cliente,
 *                  se descarga una caja en el dock
 * SUB 1 (4 → 10s): Tablet/teléfono escanea QR de la caja
 *                   → check verde "Trazabilidad confirmada"
 */
export function Phase4Cliente({ active, onSubChange }: Phase4ClienteProps) {
  const [sub, setSub] = useState(0);

  useEffect(() => {
    if (!active) {
      setSub(0);
      return;
    }
    const t1 = setTimeout(() => setSub(1), 4000);
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
          <linearGradient id="skyGradient4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={FLOW_COLORS.frost} stopOpacity={0.45} />
            <stop offset="100%" stopColor={FLOW_COLORS.cream} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* === CIELO === */}
        <rect x={0} y={0} width={VIEW_W} height={420} fill="url(#skyGradient4)" />

        {/* === MONTAÑAS LEJANAS === */}
        <DistantMountains active={active} />

        {/* === NUBES === */}
        <Cloud cx={250} cy={80} scale={0.9} active={active} delay={0.4} />
        <Cloud cx={950} cy={70} scale={0.8} active={active} delay={0.5} />

        {/* === SUELO === */}
        <rect x={0} y={420} width={VIEW_W} height={VIEW_H - 420} fill={FLOW_COLORS.beige} fillOpacity={0.45} />
        <motion.line
          x1={0}
          y1={420}
          x2={VIEW_W}
          y2={420}
          stroke={STROKE_MAIN}
          strokeWidth={1.6}
          strokeOpacity={0.5}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: active ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />

        {/* === BODEGA CLIENTE === */}
        <ClientWarehouse active={active} />

        {/* === ÁRBOLES === */}
        <SideTree cx={90} cy={425} scale={0.85} active={active} delay={1.0} />
        <SideTree cx={1120} cy={425} scale={0.85} active={active} delay={1.1} />

        {/* === PÁJAROS === */}
        <Birds delay={1.5} />

        {/* ============================================================
             SUB 0 — Camión llega y descarga
           ============================================================ */}
        <AnimatePresence>
          {sub === 0 && (
            <motion.g key="sub0" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <ArrivingTruck delay={0.5} />
              {/* Caja descargada al final */}
              <UnloadedBox delay={2.8} />
            </motion.g>
          )}
        </AnimatePresence>

        {/* ============================================================
             SUB 1 — Escaneo de QR + verificación
           ============================================================ */}
        <AnimatePresence>
          {sub === 1 && (
            <motion.g key="sub1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              {/* Caja con QR central */}
              <BoxWithQR x={420} y={530} delay={0.2} />

              {/* Tablet que escanea */}
              <ScanningTablet x={780} y={500} delay={0.6} />

              {/* Línea de scan láser */}
              <ScanLaser />

              {/* Check verificado (aparece después) */}
              <VerificationCheck delay={3.2} />

              {/* Etiqueta de trazabilidad */}
              <TrazabilityCard delay={3.8} />
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
    <motion.path
      d="M -50 380 L 100 320 L 230 350 L 380 290 L 520 335 L 680 280 L 830 320 L 980 285 L 1120 315 L 1250 295 L 1250 410 L -50 410 Z"
      fill={FLOW_COLORS.slate}
      fillOpacity={0.06}
      stroke={FLOW_COLORS.slate}
      strokeWidth={1.4}
      strokeOpacity={0.4}
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={active ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
      transition={{
        pathLength: { duration: 0.9, delay: 0.3 },
        opacity: { duration: 0.5, delay: 0.4 },
      }}
    />
  );
}

/* ============================================================
   CLOUD
   ============================================================ */

function Cloud({
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
      initial={{ opacity: 0 }}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.6, delay }}
    >
      <ellipse cx={0} cy={0} rx={42} ry={14} fill="white" fillOpacity={0.05} stroke={STROKE_MAIN} strokeWidth={2} />
      <ellipse cx={-22} cy={-6} rx={22} ry={12} fill="white" fillOpacity={0.05} stroke={STROKE_MAIN} strokeWidth={2} />
      <ellipse cx={18} cy={-8} rx={20} ry={11} fill="white" fillOpacity={0.05} stroke={STROKE_MAIN} strokeWidth={2} />
    </motion.g>
  );
}

/* ============================================================
   CLIENT WAREHOUSE — bodega del cliente/distribuidor
   Estilo más comercial (con techo a dos aguas, no industrial)
   ============================================================ */

function ClientWarehouse({ active }: { active: boolean }) {
  const baseY = 420;
  const cx = 600;
  const w = 700;
  const h = 180;
  const left = cx - w / 2;
  const right = cx + w / 2;
  const top = baseY - h;

  return (
    <motion.g
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: active ? 1 : 0, y: active ? 0 : 30 }}
      transition={{ duration: 0.7, delay: 0.7 }}
    >
      {/* Sombra */}
      <ellipse cx={cx} cy={baseY + 2} rx={w / 2 + 30} ry={6} fill={STROKE_MAIN} opacity={0.1} />

      {/* Cuerpo principal */}
      <rect
        x={left}
        y={top}
        width={w}
        height={h}
        fill={FLOW_COLORS.cream}
        fillOpacity={0.7}
        stroke={STROKE_MAIN}
        strokeWidth={STROKE_WIDTH}
      />

      {/* Techo a dos aguas con acento terracotta */}
      <path
        d={`M ${left - 10} ${top} L ${cx} ${top - 50} L ${right + 10} ${top} Z`}
        fill={TERRACOTTA}
        fillOpacity={0.55}
        stroke={STROKE_MAIN}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      {/* Línea decorativa del techo */}
      <line
        x1={left - 10}
        y1={top + 1}
        x2={right + 10}
        y2={top + 1}
        stroke={STROKE_MAIN}
        strokeWidth={1.4}
        opacity={0.6}
      />

      {/* Letrero del cliente */}
      <g transform={`translate(${cx}, ${top + 40})`}>
        <rect
          x={-100}
          y={-16}
          width={200}
          height={36}
          rx={6}
          fill={FLOW_COLORS.cream}
          fillOpacity={0.95}
          stroke={STROKE_MAIN}
          strokeWidth={2}
        />
        <text
          x={0}
          y={8}
          textAnchor="middle"
          fontSize={16}
          fontWeight={800}
          fill={STROKE_MAIN}
          fontFamily="system-ui"
          letterSpacing={3}
        >
          CLIENTE
        </text>
      </g>

      {/* Loading dock central (1 puerta grande) */}
      <g>
        {/* Marco */}
        <rect
          x={cx - 70}
          y={baseY - 100}
          width={140}
          height={100}
          fill={FLOW_COLORS.beige}
          fillOpacity={0.6}
          stroke={STROKE_MAIN}
          strokeWidth={STROKE_WIDTH}
        />
        {/* Cortina (líneas) */}
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1={cx - 70}
            y1={baseY - 100 + i * 25}
            x2={cx + 70}
            y2={baseY - 100 + i * 25}
            stroke={STROKE_MAIN}
            strokeWidth={1.2}
            opacity={0.4}
          />
        ))}
        {/* Manija */}
        <rect x={cx - 5} y={baseY - 12} width={10} height={6} fill={STROKE_MAIN} opacity={0.6} />
      </g>

      {/* Ventanas laterales grandes (estilo retail) */}
      <ClientWindow cx={left + 80} cy={baseY - 60} />
      <ClientWindow cx={right - 80} cy={baseY - 60} />

      {/* Logos del cliente (decoración) */}
      <circle cx={left + 50} cy={top + 40} r={10} fill={FLOW_COLORS.gold} fillOpacity={0.4} stroke={STROKE_MAIN} strokeWidth={1.6} />
      <circle cx={right - 50} cy={top + 40} r={10} fill={FLOW_COLORS.gold} fillOpacity={0.4} stroke={STROKE_MAIN} strokeWidth={1.6} />
    </motion.g>
  );
}

function ClientWindow({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <rect
        x={cx - 35}
        y={cy - 30}
        width={70}
        height={60}
        fill={FLOW_COLORS.frost}
        fillOpacity={0.6}
        stroke={STROKE_MAIN}
        strokeWidth={2.2}
      />
      <line x1={cx} y1={cy - 30} x2={cx} y2={cy + 30} stroke={STROKE_MAIN} strokeWidth={1.6} />
      <line x1={cx - 35} y1={cy} x2={cx + 35} y2={cy} stroke={STROKE_MAIN} strokeWidth={1.6} />
      <line x1={cx - 30} y1={cy - 25} x2={cx - 12} y2={cy - 7} stroke="white" strokeWidth={1.4} opacity={0.8} />
    </g>
  );
}

/* ============================================================
   SIDE TREE
   ============================================================ */

function SideTree({
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
      <ellipse cx={0} cy={2} rx={26} ry={3} fill={STROKE_MAIN} opacity={0.1} />
      <line x1={0} y1={0} x2={0} y2={-30} stroke={STROKE_MAIN} strokeWidth={2.4} strokeLinecap="round" />
      <ellipse cx={-12} cy={-4} rx={15} ry={11} fill={FLOW_COLORS.leafDark} fillOpacity={0.18} stroke={STROKE_MAIN} strokeWidth={2} />
      <circle cx={0} cy={-36} r={20} fill={FLOW_COLORS.leaf} fillOpacity={0.22} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
      <line x1={0} y1={-16} x2={0} y2={-32} stroke={STROKE_MAIN} strokeWidth={1.2} opacity={0.45} />
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
        x: { duration: 14, delay, ease: 'linear' },
        opacity: { duration: 14, delay, times: [0, 0.1, 0.85, 1] },
      }}
    >
      <BirdShape cx={0} cy={130} scale={0.9} flapDelay={0} />
      <BirdShape cx={45} cy={145} scale={0.7} flapDelay={0.15} />
      <BirdShape cx={20} cy={160} scale={0.6} flapDelay={0.3} />
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

/* ============================================================
   ARRIVING TRUCK — camión Collecta llega al dock
   ============================================================ */

function ArrivingTruck({ delay }: { delay: number }) {
  return (
    <motion.g
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 220, opacity: 1 }}
      transition={{
        x: { duration: 2.5, delay, ease: 'easeOut' },
        opacity: { duration: 0.4, delay },
      }}
    >
      <g transform="translate(0, 510) scale(1.5)">
        <ellipse cx={-30} cy={15} rx={78} ry={5} fill={STROKE_MAIN} opacity={0.15} />

        <rect x={-95} y={-58} width={95} height={54} fill={FLOW_COLORS.cream} fillOpacity={0.85} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} rx={6} />
        <line x1={-82} y1={-46} x2={-12} y2={-46} stroke={STROKE_MAIN} strokeWidth={1.2} opacity={0.4} />
        <line x1={-82} y1={-26} x2={-12} y2={-26} stroke={STROKE_MAIN} strokeWidth={1.2} opacity={0.4} />

        <rect x={-72} y={-42} width={48} height={18} rx={2} fill={FLOW_COLORS.gold} fillOpacity={0.7} stroke={STROKE_MAIN} strokeWidth={1.6} />
        <text x={-48} y={-30} textAnchor="middle" fontSize={9} fontWeight={800} fill={STROKE_MAIN} fontFamily="system-ui" letterSpacing={1}>COLLECTA</text>

        <path d="M 0 -54 Q 0 -56 2 -56 L 32 -56 Q 34 -56 36 -54 L 52 -28 L 52 -4 Q 52 -2 50 -2 L 0 -2 Z" fill={FLOW_COLORS.gold} fillOpacity={0.2} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
        <path d="M 6 -50 L 30 -50 L 42 -28 L 6 -28 Z" fill={FLOW_COLORS.frost} fillOpacity={0.5} stroke={STROKE_MAIN} strokeWidth={2} />
        <line x1={14} y1={-48} x2={26} y2={-30} stroke="white" strokeWidth={1.4} opacity={0.7} />

        <circle cx={49} cy={-10} r={3.5} fill={FLOW_COLORS.goldLight} stroke={STROKE_MAIN} strokeWidth={1.5} />
        <line x1={47} y1={-2} x2={53} y2={-2} stroke={STROKE_MAIN} strokeWidth={2.4} strokeLinecap="round" />

        <g>
          <circle cx={-65} cy={0} r={13} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
          <circle cx={-65} cy={0} r={7} fill={FLOW_COLORS.gold} fillOpacity={0.85} stroke={STROKE_MAIN} strokeWidth={1.6} />
          <circle cx={-65} cy={0} r={2} fill={STROKE_MAIN} />
          <animateTransform attributeName="transform" type="rotate" from="0 -65 0" to="-360 -65 0" dur="1.5s" repeatCount="indefinite" />
        </g>
        <g>
          <circle cx={-30} cy={0} r={13} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
          <circle cx={-30} cy={0} r={7} fill={FLOW_COLORS.gold} fillOpacity={0.85} stroke={STROKE_MAIN} strokeWidth={1.6} />
          <circle cx={-30} cy={0} r={2} fill={STROKE_MAIN} />
          <animateTransform attributeName="transform" type="rotate" from="0 -30 0" to="-360 -30 0" dur="1.5s" repeatCount="indefinite" />
        </g>
        <g>
          <circle cx={28} cy={0} r={13} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
          <circle cx={28} cy={0} r={7} fill={FLOW_COLORS.gold} fillOpacity={0.85} stroke={STROKE_MAIN} strokeWidth={1.6} />
          <circle cx={28} cy={0} r={2} fill={STROKE_MAIN} />
          <animateTransform attributeName="transform" type="rotate" from="0 28 0" to="-360 28 0" dur="1.5s" repeatCount="indefinite" />
        </g>
      </g>
    </motion.g>
  );
}

/* ============================================================
   UNLOADED BOX — caja descargada en el dock
   ============================================================ */

function UnloadedBox({ delay }: { delay: number }) {
  return (
    <motion.g
      initial={{ y: -50, opacity: 0, rotate: -20 }}
      animate={{ y: 0, opacity: 1, rotate: 0 }}
      transition={{ duration: 0.7, delay, type: 'spring', stiffness: 200, damping: 14 }}
      style={{ transformOrigin: '450px 540px' }}
    >
      <g transform="translate(450, 540)">
        <ellipse cx={0} cy={20} rx={36} ry={4} fill={STROKE_MAIN} opacity={0.15} />
        <rect x={-28} y={-30} width={56} height={50} rx={2} fill={FLOW_COLORS.gold} fillOpacity={0.5} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
        <line x1={-28} y1={-5} x2={28} y2={-5} stroke={STROKE_MAIN} strokeWidth={1.4} opacity={0.5} />
        <line x1={0} y1={-30} x2={0} y2={20} stroke={STROKE_MAIN} strokeWidth={1.4} opacity={0.5} />
        {/* Marca C */}
        <circle cx={0} cy={-5} r={10} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={1.8} />
        <text x={0} y={-1} textAnchor="middle" fontSize={12} fontWeight={800} fill={STROKE_MAIN} fontFamily="system-ui">C</text>
      </g>
    </motion.g>
  );
}

/* ============================================================
   BOX WITH QR — caja con código QR escaneable
   ============================================================ */

function BoxWithQR({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.7, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay, type: 'spring', stiffness: 180, damping: 16 }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      <g transform={`translate(${x}, ${y}) scale(1.4)`}>
        {/* Sombra */}
        <ellipse cx={0} cy={42} rx={56} ry={5} fill={STROKE_MAIN} opacity={0.18} />

        {/* Caja */}
        <rect x={-50} y={-50} width={100} height={90} rx={3} fill={FLOW_COLORS.gold} fillOpacity={0.5} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
        {/* Líneas decorativas */}
        <line x1={-50} y1={-20} x2={50} y2={-20} stroke={STROKE_MAIN} strokeWidth={1.2} opacity={0.5} />
        <line x1={0} y1={-50} x2={0} y2={40} stroke={STROKE_MAIN} strokeWidth={1.2} opacity={0.5} />

        {/* Marca C */}
        <circle cx={-32} cy={-32} r={9} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={1.6} />
        <text x={-32} y={-29} textAnchor="middle" fontSize={11} fontWeight={800} fill={STROKE_MAIN} fontFamily="system-ui">C</text>

        {/* Código QR (etiqueta blanca con cuadritos) */}
        <g transform="translate(0, 10)">
          <rect x={-22} y={-18} width={44} height={44} rx={2} fill="white" stroke={STROKE_MAIN} strokeWidth={2} />
          {/* Patrones QR */}
          {/* Esquinas */}
          <rect x={-19} y={-15} width={10} height={10} fill={STROKE_MAIN} />
          <rect x={-17} y={-13} width={6} height={6} fill="white" />
          <rect x={-15} y={-11} width={2} height={2} fill={STROKE_MAIN} />

          <rect x={9} y={-15} width={10} height={10} fill={STROKE_MAIN} />
          <rect x={11} y={-13} width={6} height={6} fill="white" />
          <rect x={13} y={-11} width={2} height={2} fill={STROKE_MAIN} />

          <rect x={-19} y={13} width={10} height={10} fill={STROKE_MAIN} />
          <rect x={-17} y={15} width={6} height={6} fill="white" />
          <rect x={-15} y={17} width={2} height={2} fill={STROKE_MAIN} />

          {/* Pixeles internos */}
          {[
            [-7, -13], [-3, -13], [3, -13],
            [-7, -9], [1, -9], [5, -9],
            [-7, -5], [-3, -5], [-1, -5], [3, -5],
            [-7, -1], [-3, -1], [3, -1],
            [-3, 3], [1, 3], [5, 3],
            [-7, 7], [-1, 7], [3, 7],
            [-3, 11], [3, 11], [7, 11],
            [-3, 15], [1, 15], [5, 15],
            [-3, 19], [3, 19],
          ].map(([cx, cy], i) => (
            <rect key={i} x={cx - 1} y={cy - 1} width={2} height={2} fill={STROKE_MAIN} />
          ))}
        </g>
      </g>
    </motion.g>
  );
}

/* ============================================================
   SCANNING TABLET — tablet con vista de escaneo
   ============================================================ */

function ScanningTablet({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <motion.g
      initial={{ opacity: 0, x: 50, rotate: 10 }}
      animate={{ opacity: 1, x: 0, rotate: 0 }}
      transition={{ duration: 0.6, delay, type: 'spring', stiffness: 180, damping: 16 }}
    >
      <g transform={`translate(${x}, ${y}) rotate(-10)`}>
        {/* Sombra */}
        <ellipse cx={0} cy={92} rx={70} ry={5} fill={STROKE_MAIN} opacity={0.15} />

        {/* Cuerpo de la tablet */}
        <rect x={-65} y={-90} width={130} height={180} rx={10} fill={STROKE_MAIN} fillOpacity={0.85} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
        {/* Pantalla */}
        <rect x={-58} y={-82} width={116} height={156} rx={4} fill={FLOW_COLORS.cream} fillOpacity={0.95} stroke={STROKE_MAIN} strokeWidth={1.6} />

        {/* Header de la app */}
        <rect x={-58} y={-82} width={116} height={20} rx={4} fill={FLOW_COLORS.gold} fillOpacity={0.5} stroke={STROKE_MAIN} strokeWidth={1.4} />
        <text x={0} y={-69} textAnchor="middle" fontSize={9} fontWeight={800} fill={STROKE_MAIN} fontFamily="system-ui" letterSpacing={1}>COLLECTA · SCAN</text>

        {/* Vista de cámara con marco de escaneo */}
        <rect x={-46} y={-50} width={92} height={92} rx={2} fill={STEEL} fillOpacity={0.15} stroke={STROKE_MAIN} strokeWidth={1.4} strokeDasharray="4 3" />

        {/* Esquinas del scanner (marca de captura) */}
        {[
          [-46, -50], [46, -50], [-46, 42], [46, 42],
        ].map(([cx, cy], i) => {
          const dx = cx > 0 ? -10 : 10;
          const dy = cy > 0 ? -10 : 10;
          return (
            <g key={i}>
              <line x1={cx} y1={cy} x2={cx + dx} y2={cy} stroke={ACCENT_GREEN} strokeWidth={2.4} strokeLinecap="round" />
              <line x1={cx} y1={cy} x2={cx} y2={cy + dy} stroke={ACCENT_GREEN} strokeWidth={2.4} strokeLinecap="round" />
            </g>
          );
        })}

        {/* Mini QR dentro del visor (objetivo capturado) */}
        <g transform="translate(0, -4) scale(0.55)">
          <rect x={-22} y={-18} width={44} height={44} rx={2} fill="white" stroke={STROKE_MAIN} strokeWidth={1.4} />
          <rect x={-19} y={-15} width={10} height={10} fill={STROKE_MAIN} />
          <rect x={9} y={-15} width={10} height={10} fill={STROKE_MAIN} />
          <rect x={-19} y={13} width={10} height={10} fill={STROKE_MAIN} />
          {[[-3, -3], [3, -3], [-3, 3], [3, 3], [-7, -1], [-3, 7], [3, 7]].map(([cx, cy], i) => (
            <rect key={i} x={cx - 1} y={cy - 1} width={2} height={2} fill={STROKE_MAIN} />
          ))}
        </g>

        {/* Status text */}
        <text x={0} y={60} textAnchor="middle" fontSize={9} fontWeight={700} fill={ACCENT_GREEN} fontFamily="system-ui">ESCANEANDO...</text>
      </g>
    </motion.g>
  );
}

/* ============================================================
   SCAN LASER — línea láser horizontal entre tablet y caja
   ============================================================ */

function ScanLaser() {
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{
        duration: 3,
        delay: 1.2,
        times: [0, 0.1, 0.85, 1],
      }}
    >
      {/* Línea láser que va y viene */}
      <motion.line
        x1={780}
        y1={500}
        x2={420}
        y2={530}
        stroke={ACCENT_GREEN}
        strokeWidth={2.2}
        opacity={0.7}
        strokeDasharray="4 3"
        animate={{ strokeDashoffset: [0, -20] }}
        transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
      />

      {/* Punto rojo en la caja (target) */}
      <motion.circle
        cx={420}
        cy={530}
        r={6}
        fill={ACCENT_GREEN}
        opacity={0.5}
        animate={{ scale: [1, 1.5, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </motion.g>
  );
}

/* ============================================================
   VERIFICATION CHECK — palomita verde grande
   ============================================================ */

function VerificationCheck({ delay }: { delay: number }) {
  const cx = 600;
  const cy = 250;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay, type: 'spring', stiffness: 200, damping: 14 }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      <g transform={`translate(${cx}, ${cy})`}>
        {/* Glow exterior */}
        <motion.circle
          cx={0}
          cy={0}
          r={48}
          fill={ACCENT_GREEN}
          fillOpacity={0.2}
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* Círculo principal */}
        <circle cx={0} cy={0} r={38} fill={ACCENT_GREEN} fillOpacity={0.6} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />

        {/* Palomita */}
        <motion.path
          d="M -16 0 L -4 12 L 18 -12"
          fill="none"
          stroke="white"
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.2 }}
        />
      </g>
    </motion.g>
  );
}

/* ============================================================
   TRAZABILITY CARD — tarjeta de info de trazabilidad
   ============================================================ */

function TrazabilityCard({ delay }: { delay: number }) {
  const x = 600;
  const y = 380;

  return (
    <motion.g
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        opacity: { duration: 0.5, delay },
        y: { duration: 0.6, delay, ease: 'easeOut' },
      }}
    >
      <g transform={`translate(${x}, ${y})`}>
        <rect
          x={-150}
          y={-32}
          width={300}
          height={64}
          rx={10}
          fill={FLOW_COLORS.cream}
          fillOpacity={0.97}
          stroke={STROKE_MAIN}
          strokeWidth={STROKE_WIDTH}
        />

        {/* Header */}
        <rect x={-150} y={-32} width={300} height={20} rx={10} fill={ACCENT_GREEN} fillOpacity={0.55} stroke={STROKE_MAIN} strokeWidth={1.4} />
        <text x={0} y={-18} textAnchor="middle" fontSize={10} fontWeight={800} fill={STROKE_MAIN} fontFamily="system-ui" letterSpacing={1.5}>TRAZABILIDAD CONFIRMADA</text>

        {/* Líneas de detalles */}
        <text x={-130} y={4} fontSize={10} fontWeight={700} fill={STROKE_MAIN} fontFamily="system-ui">LOTE</text>
        <text x={-130} y={20} fontSize={11} fontWeight={800} fill={STROKE_MAIN} fontFamily="system-ui">#CL-2025-0428</text>

        <text x={20} y={4} fontSize={10} fontWeight={700} fill={STROKE_MAIN} fontFamily="system-ui">ORIGEN</text>
        <text x={20} y={20} fontSize={11} fontWeight={800} fill={STROKE_MAIN} fontFamily="system-ui">Sinaloa, MX</text>

        {/* Check mini */}
        <circle cx={130} cy={12} r={10} fill={ACCENT_GREEN} fillOpacity={0.7} stroke={STROKE_MAIN} strokeWidth={1.6} />
        <path d="M 125 12 L 129 16 L 135 8" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </motion.g>
  );
}
