'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FLOW_COLORS, VIEW_W, VIEW_H } from '../types';

interface Phase2EmpaqueProps {
  active: boolean;
  onSubChange?: (sub: number) => void;
}

const STROKE_MAIN = '#2A2A2A';
const STROKE_WIDTH = 2.8;
const TERRACOTTA = '#B85A3D';
const STEEL = '#5B7BA6';

// Paleta de strokes coloreados (consistente con Phase 1)
const STROKE_EARTH = '#5C4628'; // café oscuro para estructuras
const STROKE_TERRACOTTA = '#7E3A22'; // terracotta oscuro
const STROKE_SUN = '#E08020'; // naranja para luces/sol
const TRACTOR_YELLOW = '#F5D434'; // amarillo de seguridad/safety

/**
 * FASE 2 — Empaque (Bodega Collecta)
 *
 * SUB 0 (0 → 3.5s): Camión chico llega al loading dock
 * SUB 1 (3.5 → 6.5s): Tarimas con cajas + bidón químico postcosecha
 * SUB 2 (6.5 → 10s): Cinta transportadora (lavado / desinfección / empaque)
 * SUB 3 (10 → 13s): Cuarto frío (frost overlay + termómetro)
 * SUB 4 (13 → 16s): Camión grande sale cargado
 */
export function Phase2Empaque({ active, onSubChange }: Phase2EmpaqueProps) {
  const [sub, setSub] = useState(0);

  useEffect(() => {
    if (!active) {
      setSub(0);
      return;
    }
    const t1 = setTimeout(() => setSub(1), 6500);
    const t2 = setTimeout(() => setSub(2), 9500);
    const t3 = setTimeout(() => setSub(3), 13000);
    const t4 = setTimeout(() => setSub(4), 16000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
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
        <defs>
          <linearGradient id="skyGradient2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={FLOW_COLORS.frost} stopOpacity={0.45} />
            <stop offset="100%" stopColor={FLOW_COLORS.cream} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="floorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={FLOW_COLORS.beige} stopOpacity={0.6} />
            <stop offset="100%" stopColor={FLOW_COLORS.beige} stopOpacity={0.3} />
          </linearGradient>
        </defs>

        {/* === CIELO === */}
        <rect x={0} y={0} width={VIEW_W} height={420} fill="url(#skyGradient2)" />

        {/* === MONTAÑAS LEJANAS === */}
        <DistantMountains active={active} />

        {/* === NUBES DRIFT (minimalistas, animadas) === */}
        <DriftingClouds />

        {/* === SUELO/PISO === */}
        <rect x={0} y={420} width={VIEW_W} height={VIEW_H - 420} fill="url(#floorGradient)" />
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
          transition={{ duration: 0.7, delay: 0.5 }}
        />

        {/* === BODEGA COLLECTA (siempre visible) === */}
        <Warehouse active={active} />

        {/* === ÁRBOLES FLANQUEANDO === */}
        <SideTree cx={90} cy={425} scale={0.85} active={active} delay={1.0} />
        <SideTree cx={150} cy={430} scale={0.55} active={active} delay={1.1} />
        <SideTree cx={1120} cy={425} scale={0.85} active={active} delay={1.0} />
        <SideTree cx={1060} cy={430} scale={0.55} active={active} delay={1.1} />

        {/* === MARCAS DEL PISO (líneas del loading dock) === */}
        <DockMarkings active={active} />

        {/* === PÁJAROS === */}
        <Birds delay={1.5} />

        {/* ============================================================
             SUB 0 — CAMIÓN CHICO LLEGA
           ============================================================ */}
        <AnimatePresence>
          {sub === 0 && (
            <motion.g key="sub0" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <SmallTruck startX={-180} parkX={520} parkY={520} delay={4.5} duration={1.7} />
            </motion.g>
          )}
        </AnimatePresence>

        {/* ============================================================
             SUB 1 — TARIMAS + BIDÓN
           ============================================================ */}
        <AnimatePresence>
          {sub === 1 && (
            <motion.g key="sub1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <PalletStack x={380} y={580} delay={0.2} />
              <PalletStack x={560} y={575} delay={0.6} />
              <PalletStack x={740} y={580} delay={1.0} />
              <ChemicalDrum x={870} y={575} delay={1.4} />
            </motion.g>
          )}
        </AnimatePresence>

        {/* ============================================================
             SUB 2 — CINTA TRANSPORTADORA
           ============================================================ */}
        <AnimatePresence>
          {sub === 2 && (
            <motion.g key="sub2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <ConveyorScene />
            </motion.g>
          )}
        </AnimatePresence>

        {/* ============================================================
             SUB 3 — CUARTO FRÍO
           ============================================================ */}
        <AnimatePresence>
          {sub === 3 && (
            <motion.g key="sub3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <ColdRoomOverlay />
            </motion.g>
          )}
        </AnimatePresence>

        {/* ============================================================
             SUB 4 — CAMIÓN GRANDE SALE
           ============================================================ */}
        <AnimatePresence>
          {sub === 4 && (
            <motion.g key="sub4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <LargeTruck startX={500} endX={VIEW_W + 200} parkY={510} delay={0.8} duration={2.5} />
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
   DRIFTING CLOUDS — minimalistas (línea única, sin fill, drift continuo)
   ============================================================ */

const STROKE_CLOUD = '#3D7AB8'; // azul intenso para nubes
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
   WAREHOUSE — Bodega Collecta
   ============================================================ */

function Warehouse({ active }: { active: boolean }) {
  // Bodega centrada, base y=420, altura 260 (más separación techo↔andenes)
  const baseY = 420;
  const cx = 600;
  const w = 740;
  const h = 260;
  const left = cx - w / 2; // 230
  const right = cx + w / 2; // 970
  const top = baseY - h; // 160

  return (
    <g>
      {/* Sombra base (aparece al inicio) */}
      <motion.ellipse
        cx={cx}
        cy={baseY + 2}
        rx={w / 2 + 30}
        ry={6}
        fill={STROKE_MAIN}
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 0.1 : 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      />

      {/* 1. PAREDES — stroke-draw progresivo + fill opaco (oculta montañas) */}
      <motion.rect
        x={left}
        y={top}
        width={w}
        height={h}
        fill={FLOW_COLORS.cream}
        stroke={STROKE_EARTH}
        strokeWidth={STROKE_WIDTH}
        initial={{ pathLength: 0, fillOpacity: 0 }}
        animate={
          active
            ? { pathLength: 1, fillOpacity: 1 }
            : { pathLength: 0, fillOpacity: 0 }
        }
        transition={{
          pathLength: { duration: 1.8, ease: 'easeInOut', delay: 0.3 },
          fillOpacity: { duration: 0.5, delay: 1.9 },
        }}
      />

      {/* 2. ARCOTECHO — bóveda curva con stroke-draw */}
      <ArchedRoof active={active} left={left} right={right} top={top} />

      {/* 3. BANDA TERRACOTTA superior (después del techo) */}
      <motion.rect
        x={left}
        y={top}
        width={w}
        height={14}
        fill={TERRACOTTA}
        fillOpacity={0.7}
        stroke={STROKE_TERRACOTTA}
        strokeWidth={1.6}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: active ? 1 : 0, scaleX: active ? 1 : 0 }}
        transition={{ duration: 0.5, delay: 2.4 }}
        style={{ transformOrigin: `${cx}px ${top}px` }}
      />

      {/* 4. LOGO COLLECTA — logo real directo sobre la fachada (sin recuadro) */}
      <g transform={`translate(${cx}, ${top + 80})`}>
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 2.7, type: 'spring', stiffness: 220, damping: 14 }}
        >
          <image
            href="/assets/logo.png"
            x={-160}
            y={-28}
            width={320}
            height={58}
            preserveAspectRatio="xMidYMid meet"
          />
        </motion.g>
      </g>

      {/* 5. ANDENES DE CARGA — staggered (canopy + sellos + puerta + plataforma) */}
      {[0, 1, 2].map((i) => {
        const dx = left + 160 + i * 210;
        const dockTop = baseY - 110;
        const hoodHeight = 14;
        const plateHeight = 10;
        const doorTop = dockTop + hoodHeight;
        const doorBottom = baseY - plateHeight;
        const doorHeight = doorBottom - doorTop;
        const sealWidth = 8;
        return (
          <motion.g
            key={`dock-${i}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: active ? 1 : 0, y: active ? 0 : 30 }}
            transition={{ duration: 0.5, delay: 3.0 + i * 0.25, type: 'spring', stiffness: 200, damping: 18 }}
          >
            {/* === CANOPY/HOOD SUPERIOR (toldo oscuro tipo cortina industrial) === */}
            <path
              d={`M ${dx - 52} ${dockTop} L ${dx + 52} ${dockTop} L ${dx + 52} ${dockTop + 10} Q ${dx + 25} ${dockTop + hoodHeight + 2} ${dx} ${dockTop + hoodHeight} Q ${dx - 25} ${dockTop + hoodHeight + 2} ${dx - 52} ${dockTop + 10} Z`}
              fill="#2A2A2A"
              stroke={STROKE_EARTH}
              strokeWidth={1.2}
              strokeLinejoin="round"
            />

            {/* === PUERTA ENROLLABLE (panel claro con líneas horizontales) === */}
            <rect
              x={dx - 42}
              y={doorTop}
              width={84}
              height={doorHeight}
              fill={FLOW_COLORS.cream}
              stroke={STROKE_EARTH}
              strokeWidth={1.2}
            />
            {/* Líneas horizontales (segmentos de la puerta enrollable) */}
            {[1, 2, 3, 4].map((line) => (
              <line
                key={line}
                x1={dx - 42}
                y1={doorTop + (doorHeight / 5) * line}
                x2={dx + 42}
                y2={doorTop + (doorHeight / 5) * line}
                stroke={STROKE_EARTH}
                strokeWidth={1}
                opacity={0.4}
              />
            ))}
            {/* Ventana/visor en el centro de la puerta */}
            <rect
              x={dx - 12}
              y={doorTop + doorHeight * 0.42}
              width={24}
              height={3.5}
              fill="#2A2A2A"
              rx={0.5}
            />

            {/* === SELLO LATERAL IZQUIERDO (cortina oscura con franjas amarillas diagonales) === */}
            <rect
              x={dx - 50}
              y={doorTop}
              width={sealWidth}
              height={doorHeight}
              fill="#2A2A2A"
            />
            {Array.from({ length: 9 }).map((_, k) => {
              const y0 = doorTop + k * 11;
              return (
                <line
                  key={`stripe-l-${k}`}
                  x1={dx - 50}
                  y1={y0 + 9}
                  x2={dx - 42}
                  y2={y0 + 2}
                  stroke={TRACTOR_YELLOW}
                  strokeWidth={2.4}
                />
              );
            })}

            {/* === SELLO LATERAL DERECHO (espejo, diagonal opuesto) === */}
            <rect
              x={dx + 42}
              y={doorTop}
              width={sealWidth}
              height={doorHeight}
              fill="#2A2A2A"
            />
            {Array.from({ length: 9 }).map((_, k) => {
              const y0 = doorTop + k * 11;
              return (
                <line
                  key={`stripe-r-${k}`}
                  x1={dx + 42}
                  y1={y0 + 2}
                  x2={dx + 50}
                  y2={y0 + 9}
                  stroke={TRACTOR_YELLOW}
                  strokeWidth={2.4}
                />
              );
            })}

            {/* === PLATAFORMA DE MUELLE (dock plate verde con bordes amarillos) === */}
            <rect
              x={dx - 50}
              y={doorBottom}
              width={100}
              height={plateHeight}
              fill="#5B7B3F"
              stroke={STROKE_EARTH}
              strokeWidth={1.2}
            />
            {/* Bordes amarillos del dock plate */}
            <rect x={dx - 50} y={doorBottom} width={100} height={2} fill={TRACTOR_YELLOW} />
            <rect x={dx - 50} y={doorBottom + plateHeight - 2} width={100} height={2} fill={TRACTOR_YELLOW} />
          </motion.g>
        );
      })}

      {/* 7. LÁMPARAS (encienden al final) */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.4, delay: 4.0 }}
      >
        {[160, 370, 580].map((offset, i) => {
          const dx = left + offset;
          return <DockLamp key={`lamp-${i}`} cx={dx} baseY={baseY} />;
        })}
      </motion.g>

      {/* 8. TURBINAS DE VENTILACIÓN sobre el arcotecho (rotando) */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.5, delay: 4.1 }}
      >
        {/* 3 turbinas posicionadas sobre la curva del arco — flujo lateral lento */}
        <RoofTurbine cx={left + 200} cy={top - 18} duration="1.2s" />
        <RoofTurbine cx={cx} cy={top - 28} duration="1.0s" />
        <RoofTurbine cx={right - 200} cy={top - 18} duration="1.4s" />
      </motion.g>
    </g>
  );
}

/* ============================================================
   ARCHED ROOF — Bóveda curva (techo industrial moderno)
   ============================================================ */

function ArchedRoof({
  active,
  left,
  right,
  top,
}: {
  active: boolean;
  left: number;
  right: number;
  top: number;
}) {
  const cx = (left + right) / 2;
  const peakHeight = 45;

  // Arco principal (silueta exterior del techo)
  const outerArc = `M ${left - 6} ${top + 4} Q ${cx} ${top - peakHeight} ${right + 6} ${top + 4}`;

  // Sombra interior del arco (sugiere profundidad/grosor)
  const innerShadow = `M ${left + 6} ${top + 2} Q ${cx} ${top - peakHeight + 8} ${right - 6} ${top + 2}`;

  return (
    <>
      {/* Forma rellena debajo del arco (el cuerpo del techo) — opaca para ocultar montañas */}
      <motion.path
        d={`M ${left - 6} ${top + 4} Q ${cx} ${top - peakHeight} ${right + 6} ${top + 4} L ${right - 6} ${top + 4} L ${left + 6} ${top + 4} Z`}
        fill={FLOW_COLORS.cream}
        stroke="none"
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.6, delay: 2.3 }}
      />

      {/* Arco exterior — stroke-draw protagonista */}
      <motion.path
        d={outerArc}
        fill="none"
        stroke={STROKE_EARTH}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: active ? 1 : 0 }}
        transition={{ duration: 1.4, ease: 'easeInOut', delay: 1.0 }}
      />

      {/* Línea interior (sombra del grosor del techo) */}
      <motion.path
        d={innerShadow}
        fill="none"
        stroke={STROKE_EARTH}
        strokeWidth={1.2}
        strokeOpacity={0.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: active ? 1 : 0 }}
        transition={{ duration: 1.2, ease: 'easeInOut', delay: 1.6 }}
      />
    </>
  );
}

/* ============================================================
   DOCK LAMP — Luminaria industrial sobre el andén
   ============================================================ */

function DockLamp({ cx, baseY }: { cx: number; baseY: number }) {
  const cableTop = baseY - 140;
  const cableBottom = baseY - 132;
  const shadeBottom = baseY - 120;

  return (
    <g>
      {/* Anclaje a la pared */}
      <rect x={cx - 3} y={cableTop - 1.5} width={6} height={1.8} fill={STROKE_EARTH} rx={0.5} />

      {/* Cable/varilla colgante */}
      <line
        x1={cx}
        y1={cableTop}
        x2={cx}
        y2={cableBottom}
        stroke={STROKE_EARTH}
        strokeWidth={1.4}
      />

      {/* Cono de luz (gradiente sutil que ilumina hacia el andén) */}
      <path
        d={`M ${cx - 10} ${shadeBottom + 1} L ${cx - 17} ${shadeBottom + 18} L ${cx + 17} ${shadeBottom + 18} L ${cx + 10} ${shadeBottom + 1} Z`}
        fill="#FFE066"
        opacity={0.22}
      />

      {/* Pantalla acampanada (trapecio invertido) */}
      <path
        d={`M ${cx - 4} ${cableBottom} L ${cx - 10} ${shadeBottom} L ${cx + 10} ${shadeBottom} L ${cx + 4} ${cableBottom} Z`}
        fill={FLOW_COLORS.beige}
        fillOpacity={0.95}
        stroke={STROKE_EARTH}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />

      {/* Línea de borde inferior de la pantalla (acento) */}
      <line
        x1={cx - 11}
        y1={shadeBottom}
        x2={cx + 11}
        y2={shadeBottom}
        stroke={STROKE_EARTH}
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* Pequeña hendidura interior del shade (detalle) */}
      <line
        x1={cx - 7}
        y1={cableBottom + 3}
        x2={cx + 7}
        y2={cableBottom + 3}
        stroke={STROKE_EARTH}
        strokeWidth={0.6}
        opacity={0.4}
      />

      {/* Bombilla cálida visible debajo */}
      <ellipse
        cx={cx}
        cy={shadeBottom + 1.5}
        rx={3.2}
        ry={2.6}
        fill="#FFD93D"
        stroke={STROKE_SUN}
        strokeWidth={1.2}
      />
      {/* Brillo del bulbo */}
      <ellipse cx={cx - 1} cy={shadeBottom + 0.8} rx={1} ry={0.6} fill="white" opacity={0.7} />
    </g>
  );
}

/* ============================================================
   ROOF TURBINE — Extractor de aire industrial (gira con SMIL)
   ============================================================ */

function RoofTurbine({
  cx,
  cy,
  duration = '0.8s',
}: {
  cx: number;
  cy: number;
  duration?: string;
}) {
  const r = 11; // radio del cuerpo
  return (
    <g>
      {/* Base de montaje (placa metálica sobre el techo) */}
      <rect
        x={cx - 16}
        y={cy + 14}
        width={32}
        height={4}
        rx={1}
        fill={FLOW_COLORS.beige}
        stroke={STROKE_EARTH}
        strokeWidth={1.4}
      />

      {/* Conector entre base y cuerpo */}
      <rect
        x={cx - 12}
        y={cy + 8}
        width={24}
        height={6}
        fill={FLOW_COLORS.cream}
        stroke={STROKE_EARTH}
        strokeWidth={1.4}
      />

      {/* Anillo inferior del cuerpo (elipse en perspectiva) */}
      <ellipse
        cx={cx}
        cy={cy + 8}
        rx={r}
        ry={2.5}
        fill={FLOW_COLORS.cream}
        stroke={STROKE_EARTH}
        strokeWidth={1.4}
      />

      {/* Cuerpo cilíndrico (silueta de fondo, estático) */}
      <rect
        x={cx - r + 1}
        y={cy - 8}
        width={(r - 1) * 2}
        height={16}
        fill={FLOW_COLORS.cream}
        fillOpacity={0.85}
        stroke="none"
      />

      {/* === ASPAS CON MOVIMIENTO HORIZONTAL (izquierda → derecha) === */}
      {/* clipPath para que las aspas solo se vean dentro del cuerpo cilíndrico */}
      <defs>
        <clipPath id={`turbine-clip-${Math.round(cx)}-${Math.round(cy)}`}>
          <rect x={cx - r + 1} y={cy - 8} width={(r - 1) * 2} height={16} />
        </clipPath>
      </defs>
      <g clipPath={`url(#turbine-clip-${Math.round(cx)}-${Math.round(cy)})`}>
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            from="0 0"
            to="4 0"
            dur={duration}
            repeatCount="indefinite"
          />
          {/* Barras verticales equidistantes (spacing 4) — al desplazarse 4 unidades, el patrón loop-ea sin salto */}
          {Array.from({ length: 12 }).map((_, i) => {
            const x = cx - r - 8 + i * 4;
            return (
              <line
                key={i}
                x1={x}
                y1={cy - 7}
                x2={x}
                y2={cy + 7}
                stroke={STROKE_EARTH}
                strokeWidth={1.4}
                opacity={0.8}
              />
            );
          })}
        </g>
      </g>

      {/* Marcos verticales del cuerpo (laterales, estáticos) */}
      <line
        x1={cx - r + 1}
        y1={cy - 7}
        x2={cx - r + 1}
        y2={cy + 7}
        stroke={STROKE_EARTH}
        strokeWidth={1.6}
      />
      <line
        x1={cx + r - 1}
        y1={cy - 7}
        x2={cx + r - 1}
        y2={cy + 7}
        stroke={STROKE_EARTH}
        strokeWidth={1.6}
      />

      {/* Anillo superior */}
      <ellipse
        cx={cx}
        cy={cy - 7}
        rx={r - 1}
        ry={2.4}
        fill={FLOW_COLORS.cream}
        stroke={STROKE_EARTH}
        strokeWidth={1.4}
      />

      {/* Domo curvo superior (cap) */}
      <path
        d={`M ${cx - r + 2} ${cy - 7} Q ${cx} ${cy - 18} ${cx + r - 2} ${cy - 7}`}
        fill={FLOW_COLORS.beige}
        fillOpacity={0.7}
        stroke={STROKE_EARTH}
        strokeWidth={1.6}
        strokeLinecap="round"
      />

      {/* Pequeño pináculo en la cima */}
      <line
        x1={cx}
        y1={cy - 17}
        x2={cx}
        y2={cy - 22}
        stroke={STROKE_EARTH}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy - 23} r={1.2} fill={STROKE_EARTH} />
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
   DOCK MARKINGS — líneas amarillas del piso
   ============================================================ */

function DockMarkings({ active }: { active: boolean }) {
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: active ? 0.5 : 0 }}
      transition={{ duration: 0.6, delay: 1.4 }}
    >
      {/* Líneas guía del loading dock */}
      {[300, 500, 700, 900].map((x, i) => (
        <line
          key={`guide-${i}`}
          x1={x}
          y1={428}
          x2={x}
          y2={620}
          stroke={FLOW_COLORS.gold}
          strokeWidth={2}
          strokeDasharray="8 6"
          opacity={0.7}
        />
      ))}
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
        x: { duration: 16, delay, ease: 'linear' },
        opacity: { duration: 16, delay, times: [0, 0.1, 0.85, 1] },
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
   SMALL TRUCK — llega desde la izquierda, se estaciona
   ============================================================ */

function SmallTruck({
  startX,
  parkX,
  parkY,
  delay,
  duration,
}: {
  startX: number;
  parkX: number;
  parkY: number;
  delay: number;
  duration: number;
}) {
  return (
    <motion.g
      initial={{ x: startX, opacity: 0 }}
      animate={{ x: parkX, opacity: 1 }}
      transition={{
        x: { duration, delay, ease: 'easeOut' },
        opacity: { duration: 0.4, delay },
      }}
    >
      <g transform={`translate(0, ${parkY}) scale(1.5)`}>
        <ellipse cx={-30} cy={20} rx={70} ry={5} fill={STROKE_MAIN} opacity={0.12} />
        <rect x={-80} y={-46} width={80} height={42} rx={5} fill={FLOW_COLORS.cream} fillOpacity={0.5} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
        <line x1={-70} y1={-36} x2={-12} y2={-36} stroke={STROKE_MAIN} strokeWidth={1.2} opacity={0.4} />
        <line x1={-70} y1={-20} x2={-12} y2={-20} stroke={STROKE_MAIN} strokeWidth={1.2} opacity={0.4} />

        {/* Icono Collecta en la caja del camión */}
        <image
          href="/assets/logo-icon.png"
          x={-56}
          y={-38}
          width={24}
          height={24}
          preserveAspectRatio="xMidYMid meet"
        />

        {/* Cabina */}
        <path d="M 0 -46 Q 0 -48 2 -48 L 26 -48 Q 28 -48 30 -46 L 44 -24 L 44 -2 Q 44 0 42 0 L 0 0 Z" fill={FLOW_COLORS.gold} fillOpacity={0.2} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
        <path d="M 5 -42 L 24 -42 L 35 -24 L 5 -24 Z" fill={FLOW_COLORS.frost} fillOpacity={0.5} stroke={STROKE_MAIN} strokeWidth={1.8} />
        <line x1={12} y1={-40} x2={22} y2={-26} stroke="white" strokeWidth={1.2} opacity={0.7} />

        {/* Faro */}
        <circle cx={42} cy={-8} r={3} fill={FLOW_COLORS.goldLight} stroke={STROKE_MAIN} strokeWidth={1.4} />

        {/* Ruedas */}
        <g>
          <circle cx={-58} cy={2} r={11} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
          <circle cx={-58} cy={2} r={6} fill={FLOW_COLORS.gold} fillOpacity={0.85} stroke={STROKE_MAIN} strokeWidth={1.4} />
          <circle cx={-58} cy={2} r={1.8} fill={STROKE_MAIN} />
          <animateTransform attributeName="transform" type="rotate" from="0 -58 2" to="-360 -58 2" dur="1.5s" repeatCount="indefinite" />
        </g>
        <g>
          <circle cx={22} cy={2} r={11} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
          <circle cx={22} cy={2} r={6} fill={FLOW_COLORS.gold} fillOpacity={0.85} stroke={STROKE_MAIN} strokeWidth={1.4} />
          <circle cx={22} cy={2} r={1.8} fill={STROKE_MAIN} />
          <animateTransform attributeName="transform" type="rotate" from="0 22 2" to="-360 22 2" dur="1.5s" repeatCount="indefinite" />
        </g>
      </g>
    </motion.g>
  );
}

/* ============================================================
   PALLET STACK — tarima con cajas
   ============================================================ */

function PalletStack({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <motion.g
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, type: 'spring', stiffness: 220, damping: 18 }}
    >
      <g transform={`translate(${x}, ${y})`}>
        {/* Sombra */}
        <ellipse cx={0} cy={4} rx={50} ry={5} fill={STROKE_MAIN} opacity={0.1} />

        {/* Tarima de madera (3 tablones) */}
        <rect x={-46} y={-8} width={92} height={10} fill={FLOW_COLORS.earthLight} fillOpacity={0.35} stroke={STROKE_MAIN} strokeWidth={2} />
        <line x1={-30} y1={-8} x2={-30} y2={2} stroke={STROKE_MAIN} strokeWidth={1.2} opacity={0.5} />
        <line x1={0} y1={-8} x2={0} y2={2} stroke={STROKE_MAIN} strokeWidth={1.2} opacity={0.5} />
        <line x1={30} y1={-8} x2={30} y2={2} stroke={STROKE_MAIN} strokeWidth={1.2} opacity={0.5} />

        {/* Stack de cajas (3 cajas en pirámide) */}
        {/* Caja inferior izq */}
        <rect x={-40} y={-38} width={36} height={30} rx={2} fill={FLOW_COLORS.gold} fillOpacity={0.4} stroke={STROKE_MAIN} strokeWidth={2} />
        <line x1={-40} y1={-23} x2={-4} y2={-23} stroke={STROKE_MAIN} strokeWidth={1} opacity={0.5} />
        <line x1={-22} y1={-38} x2={-22} y2={-8} stroke={STROKE_MAIN} strokeWidth={1} opacity={0.5} />

        {/* Caja inferior der */}
        <rect x={4} y={-38} width={36} height={30} rx={2} fill={FLOW_COLORS.gold} fillOpacity={0.4} stroke={STROKE_MAIN} strokeWidth={2} />
        <line x1={4} y1={-23} x2={40} y2={-23} stroke={STROKE_MAIN} strokeWidth={1} opacity={0.5} />
        <line x1={22} y1={-38} x2={22} y2={-8} stroke={STROKE_MAIN} strokeWidth={1} opacity={0.5} />

        {/* Caja superior centrada */}
        <rect x={-18} y={-66} width={36} height={28} rx={2} fill={FLOW_COLORS.goldLight} fillOpacity={0.5} stroke={STROKE_MAIN} strokeWidth={2} />
        <line x1={-18} y1={-52} x2={18} y2={-52} stroke={STROKE_MAIN} strokeWidth={1} opacity={0.5} />
        <line x1={0} y1={-66} x2={0} y2={-38} stroke={STROKE_MAIN} strokeWidth={1} opacity={0.5} />

      </g>
    </motion.g>
  );
}

/* ============================================================
   CHEMICAL DRUM — bidón postcosecha
   ============================================================ */

function ChemicalDrum({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <motion.g
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, type: 'spring', stiffness: 220, damping: 18 }}
    >
      <g transform={`translate(${x}, ${y})`}>
        <ellipse cx={0} cy={4} rx={32} ry={4} fill={STROKE_MAIN} opacity={0.1} />

        {/* Cuerpo cilíndrico */}
        <path
          d="M -22 -64 Q -24 -60 -24 -50 L -24 -10 Q -24 0 -16 2 L 16 2 Q 24 0 24 -10 L 24 -50 Q 24 -60 22 -64 Z"
          fill={STEEL}
          fillOpacity={0.25}
          stroke={STROKE_MAIN}
          strokeWidth={STROKE_WIDTH}
          strokeLinejoin="round"
        />
        {/* Tapa superior */}
        <ellipse cx={0} cy={-64} rx={22} ry={6} fill={STEEL} fillOpacity={0.45} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
        {/* Tapa interior (círculo) */}
        <circle cx={0} cy={-64} r={6} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={1.6} />

        {/* Bandas/anillos del cilindro */}
        <line x1={-23} y1={-46} x2={23} y2={-46} stroke={STROKE_MAIN} strokeWidth={1.4} opacity={0.5} />
        <line x1={-23} y1={-26} x2={23} y2={-26} stroke={STROKE_MAIN} strokeWidth={1.4} opacity={0.5} />

        {/* Etiqueta de advertencia */}
        <rect x={-14} y={-40} width={28} height={20} rx={1} fill={FLOW_COLORS.cream} fillOpacity={0.95} stroke={STROKE_MAIN} strokeWidth={1.6} />
        <text x={0} y={-26} textAnchor="middle" fontSize={11} fontWeight={800} fill={TERRACOTTA} fontFamily="system-ui">⚠</text>
      </g>
    </motion.g>
  );
}

/* ============================================================
   CONVEYOR SCENE — cinta transportadora con 3 estaciones
   ============================================================ */

function ConveyorScene() {
  const beltY = 540;
  const beltLeft = 200;
  const beltRight = 1000;

  return (
    <g>
      {/* Cinta transportadora */}
      <g>
        {/* Cuerpo de la cinta */}
        <rect
          x={beltLeft}
          y={beltY}
          width={beltRight - beltLeft}
          height={26}
          fill={FLOW_COLORS.beige}
          fillOpacity={0.5}
          stroke={STROKE_MAIN}
          strokeWidth={STROKE_WIDTH}
        />
        {/* Líneas de la cinta (animadas) */}
        <motion.g
          animate={{ x: [0, -40] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((i) => (
            <line
              key={i}
              x1={beltLeft + i * 40}
              y1={beltY + 6}
              x2={beltLeft + i * 40}
              y2={beltY + 20}
              stroke={STROKE_MAIN}
              strokeWidth={1.4}
              opacity={0.45}
            />
          ))}
        </motion.g>

        {/* Ruedas extremas de la cinta */}
        <g>
          <circle cx={beltLeft} cy={beltY + 13} r={16} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
          <circle cx={beltLeft} cy={beltY + 13} r={6} fill={STROKE_MAIN} fillOpacity={0.3} />
          <animateTransform attributeName="transform" type="rotate" from={`0 ${beltLeft} ${beltY + 13}`} to={`360 ${beltLeft} ${beltY + 13}`} dur="1.5s" repeatCount="indefinite" />
        </g>
        <g>
          <circle cx={beltRight} cy={beltY + 13} r={16} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
          <circle cx={beltRight} cy={beltY + 13} r={6} fill={STROKE_MAIN} fillOpacity={0.3} />
          <animateTransform attributeName="transform" type="rotate" from={`0 ${beltRight} ${beltY + 13}`} to={`360 ${beltRight} ${beltY + 13}`} dur="1.5s" repeatCount="indefinite" />
        </g>

        {/* Soporte/postes de la cinta */}
        <line x1={beltLeft} y1={beltY + 30} x2={beltLeft} y2={beltY + 80} stroke={STROKE_MAIN} strokeWidth={2.4} strokeLinecap="round" />
        <line x1={beltRight} y1={beltY + 30} x2={beltRight} y2={beltY + 80} stroke={STROKE_MAIN} strokeWidth={2.4} strokeLinecap="round" />
        <line x1={(beltLeft + beltRight) / 2} y1={beltY + 30} x2={(beltLeft + beltRight) / 2} y2={beltY + 80} stroke={STROKE_MAIN} strokeWidth={2.4} strokeLinecap="round" />
      </g>

      {/* Estación 1: LAVADO (regadera con gotas) */}
      <Station x={350} y={beltY - 10} type="lavado" delay={0.2} />

      {/* Estación 2: DESINFECCIÓN (luz UV) */}
      <Station x={600} y={beltY - 10} type="desinfeccion" delay={0.6} />

      {/* Estación 3: EMPAQUE (caja) */}
      <Station x={850} y={beltY - 10} type="empaque" delay={1.0} />

      {/* Cajas moviéndose por la cinta */}
      <MovingBox startX={beltLeft - 30} endX={beltRight + 30} duration={6} delay={0.5} />
      <MovingBox startX={beltLeft - 30} endX={beltRight + 30} duration={6} delay={2.5} />
      <MovingBox startX={beltLeft - 30} endX={beltRight + 30} duration={6} delay={4.5} />
    </g>
  );
}

function Station({
  x,
  y,
  type,
  delay,
}: {
  x: number;
  y: number;
  type: 'lavado' | 'desinfeccion' | 'empaque';
  delay: number;
}) {
  return (
    <motion.g
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, type: 'spring', stiffness: 200, damping: 15 }}
    >
      <g transform={`translate(${x}, ${y})`}>
        {type === 'lavado' && <WashIcon />}
        {type === 'desinfeccion' && <SanitizeIcon />}
        {type === 'empaque' && <PackIcon />}
      </g>
    </motion.g>
  );
}

function WashIcon() {
  return (
    <g>
      {/* Regadera (cabeza) */}
      <path
        d="M -28 -100 L 28 -100 L 22 -85 L -22 -85 Z"
        fill={STEEL}
        fillOpacity={0.4}
        stroke={STROKE_MAIN}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <line x1={-22} y1={-85} x2={22} y2={-85} stroke={STROKE_MAIN} strokeWidth={1.6} />
      {/* Tubo */}
      <line x1={0} y1={-100} x2={0} y2={-110} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />

      {/* Gotas animadas */}
      {[-14, 0, 14].map((dx, i) => (
        <circle
          key={i}
          cx={dx}
          cy={-78}
          r={3}
          fill={STEEL}
          fillOpacity={0.5}
          stroke={STROKE_MAIN}
          strokeWidth={1.2}
        >
          <animate
            attributeName="cy"
            values={`-78;${-78 + 60}`}
            dur="0.8s"
            begin={`${i * 0.2}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;1;0"
            dur="0.8s"
            begin={`${i * 0.2}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* Etiqueta */}
      <rect x={-30} y={20} width={60} height={20} rx={4} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={1.6} />
      <text x={0} y={34} textAnchor="middle" fontSize={10} fontWeight={700} fill={STROKE_MAIN} fontFamily="system-ui">LAVADO</text>
    </g>
  );
}

function SanitizeIcon() {
  return (
    <g>
      {/* Tubo UV (cilindro vertical) */}
      <rect
        x={-22}
        y={-110}
        width={44}
        height={26}
        rx={4}
        fill={FLOW_COLORS.cream}
        fillOpacity={0.7}
        stroke={STROKE_MAIN}
        strokeWidth={STROKE_WIDTH}
      />
      {/* Líneas UV (luz) */}
      <line x1={-14} y1={-104} x2={14} y2={-104} stroke="#9F6BC4" strokeWidth={2} opacity={0.7} />
      <line x1={-14} y1={-94} x2={14} y2={-94} stroke="#9F6BC4" strokeWidth={2} opacity={0.7} />

      {/* Rayos de luz UV */}
      {[-12, 0, 12].map((dx, i) => (
        <motion.line
          key={i}
          x1={dx}
          y1={-84}
          x2={dx}
          y2={-30}
          stroke="#9F6BC4"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          opacity={0.6}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      {/* Etiqueta */}
      <rect x={-46} y={20} width={92} height={20} rx={4} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={1.6} />
      <text x={0} y={34} textAnchor="middle" fontSize={10} fontWeight={700} fill={STROKE_MAIN} fontFamily="system-ui">DESINFECCIÓN</text>
    </g>
  );
}

function PackIcon() {
  return (
    <g>
      {/* Caja siendo cerrada (con tapas abiertas) */}
      <g>
        <rect
          x={-22}
          y={-100}
          width={44}
          height={36}
          rx={2}
          fill={FLOW_COLORS.gold}
          fillOpacity={0.45}
          stroke={STROKE_MAIN}
          strokeWidth={STROKE_WIDTH}
        />
        {/* Tapas */}
        <motion.g
          animate={{ rotate: [0, -45, -45, 0, 0] }}
          transition={{ duration: 2, repeat: Infinity, times: [0, 0.3, 0.5, 0.8, 1] }}
          style={{ transformOrigin: '-22px -100px' }}
        >
          <line x1={-22} y1={-100} x2={0} y2={-100} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
        </motion.g>
        <motion.g
          animate={{ rotate: [0, 45, 45, 0, 0] }}
          transition={{ duration: 2, repeat: Infinity, times: [0, 0.3, 0.5, 0.8, 1] }}
          style={{ transformOrigin: '22px -100px' }}
        >
          <line x1={0} y1={-100} x2={22} y2={-100} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
        </motion.g>

        {/* Líneas de la caja */}
        <line x1={-22} y1={-82} x2={22} y2={-82} stroke={STROKE_MAIN} strokeWidth={1.2} opacity={0.5} />
        <line x1={0} y1={-100} x2={0} y2={-64} stroke={STROKE_MAIN} strokeWidth={1.2} opacity={0.5} />

      </g>

      {/* Etiqueta */}
      <rect x={-30} y={20} width={60} height={20} rx={4} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={1.6} />
      <text x={0} y={34} textAnchor="middle" fontSize={10} fontWeight={700} fill={STROKE_MAIN} fontFamily="system-ui">EMPAQUE</text>
    </g>
  );
}

function MovingBox({ startX, endX, duration, delay }: { startX: number; endX: number; duration: number; delay: number }) {
  return (
    <motion.g
      initial={{ x: startX, opacity: 0 }}
      animate={{ x: endX, opacity: [0, 1, 1, 0] }}
      transition={{
        x: { duration, delay, ease: 'linear', repeat: Infinity },
        opacity: { duration, delay, times: [0, 0.05, 0.95, 1], repeat: Infinity },
      }}
    >
      <g transform="translate(0, 530)">
        <rect x={-12} y={-20} width={24} height={20} rx={2} fill={FLOW_COLORS.gold} fillOpacity={0.5} stroke={STROKE_MAIN} strokeWidth={1.8} />
        <line x1={-12} y1={-10} x2={12} y2={-10} stroke={STROKE_MAIN} strokeWidth={1} opacity={0.5} />
        <line x1={0} y1={-20} x2={0} y2={0} stroke={STROKE_MAIN} strokeWidth={1} opacity={0.5} />
      </g>
    </motion.g>
  );
}

/* ============================================================
   SNOWFLAKE — copo de nieve SVG (6 brazos con ramitas)
   ============================================================ */

function Snowflake({
  size,
  color,
  opacity = 1,
}: {
  size: number;
  color: string;
  opacity?: number;
}) {
  const r = size / 2;
  const sw = Math.max(size / 14, 0.9); // stroke width proporcional
  // 3 ejes a 0°, 60°, 120° (forman 6 brazos)
  return (
    <g
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      fill="none"
      opacity={opacity}
    >
      {[0, 60, 120].map((angle) => (
        <g key={angle} transform={`rotate(${angle})`}>
          {/* Eje principal */}
          <line x1={-r} y1={0} x2={r} y2={0} />
          {/* Ramitas en el extremo derecho */}
          <line x1={r * 0.5} y1={0} x2={r * 0.78} y2={-r * 0.28} />
          <line x1={r * 0.5} y1={0} x2={r * 0.78} y2={r * 0.28} />
          {/* Ramitas en el extremo izquierdo */}
          <line x1={-r * 0.5} y1={0} x2={-r * 0.78} y2={-r * 0.28} />
          <line x1={-r * 0.5} y1={0} x2={-r * 0.78} y2={r * 0.28} />
        </g>
      ))}
      {/* Pequeño hexágono en el centro (núcleo del copo) */}
      <circle cx={0} cy={0} r={sw * 1.2} fill={color} stroke="none" />
    </g>
  );
}

/* ============================================================
   COLD ROOM OVERLAY — efecto frío con copos
   ============================================================ */

function ColdRoomOverlay() {
  return (
    <g>
      {/* Overlay azul */}
      <motion.rect
        x={0}
        y={0}
        width={VIEW_W}
        height={VIEW_H}
        fill={FLOW_COLORS.frost}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ duration: 0.8 }}
      />
      <motion.rect
        x={0}
        y={0}
        width={VIEW_W}
        height={VIEW_H}
        fill={STEEL}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 0.8 }}
      />

      {/* Copos de nieve cayendo (SVG real, 6 brazos con ramitas) */}
      {Array.from({ length: 18 }).map((_, i) => {
        const x = 40 + i * 65;
        const dur = 3 + (i % 3);
        const size = 14 + (i % 3) * 4;
        return (
          <motion.g
            key={i}
            initial={{ y: -20, opacity: 0, rotate: 0 }}
            animate={{
              y: [0, VIEW_H + 40],
              opacity: [0, 0.8, 0.8, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: dur,
              delay: i * 0.15,
              repeat: Infinity,
              times: [0, 0.1, 0.85, 1],
              ease: 'linear',
            }}
          >
            <g transform={`translate(${x}, -20)`}>
              <Snowflake size={size} color={STEEL} opacity={0.75} />
            </g>
          </motion.g>
        );
      })}

      {/* Termómetro central */}
      <motion.g
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.6, type: 'spring', stiffness: 200, damping: 16 }}
        style={{ transformOrigin: `${VIEW_W / 2}px 350px` }}
      >
        <g transform={`translate(${VIEW_W / 2}, 350)`}>
          {/* Fondo del card */}
          <rect
            x={-130}
            y={-50}
            width={260}
            height={100}
            rx={12}
            fill={FLOW_COLORS.cream}
            fillOpacity={0.95}
            stroke={STROKE_MAIN}
            strokeWidth={STROKE_WIDTH}
          />

          {/* Ícono termómetro */}
          <g transform="translate(-90, 0)">
            <rect x={-6} y={-30} width={12} height={40} rx={6} fill={FLOW_COLORS.frost} fillOpacity={0.7} stroke={STROKE_MAIN} strokeWidth={2} />
            <circle cx={0} cy={14} r={10} fill={STEEL} fillOpacity={0.6} stroke={STROKE_MAIN} strokeWidth={2} />
            <line x1={-3} y1={-22} x2={3} y2={-22} stroke={STROKE_MAIN} strokeWidth={1.2} />
            <line x1={-3} y1={-12} x2={3} y2={-12} stroke={STROKE_MAIN} strokeWidth={1.2} />
            <line x1={-3} y1={-2} x2={3} y2={-2} stroke={STROKE_MAIN} strokeWidth={1.2} />
            {/* Copo decorativo (SVG real) */}
            <g transform="translate(0, -42)">
              <Snowflake size={18} color={STEEL} opacity={0.9} />
            </g>
          </g>

          {/* Texto */}
          <text x={-55} y={-12} fontSize={11} fontWeight={700} fill={STROKE_MAIN} fontFamily="system-ui" letterSpacing={1.5}>
            CUARTO FRÍO
          </text>
          <text x={-55} y={20} fontSize={32} fontWeight={800} fill={STROKE_MAIN} fontFamily="system-ui">
            2°C
          </text>
          <text x={-55} y={38} fontSize={10} fill={STROKE_MAIN} opacity={0.7} fontFamily="system-ui">
            humedad 90%
          </text>
        </g>
      </motion.g>
    </g>
  );
}

/* ============================================================
   LARGE TRUCK — sale cargado
   ============================================================ */

function LargeTruck({
  startX,
  endX,
  parkY,
  delay,
  duration,
}: {
  startX: number;
  endX: number;
  parkY: number;
  delay: number;
  duration: number;
}) {
  return (
    <motion.g
      initial={{ x: startX, opacity: 0 }}
      animate={{ x: endX, opacity: 1 }}
      transition={{
        x: { duration, delay, ease: 'easeIn' },
        opacity: { duration: 0.4, delay },
      }}
    >
      <g transform={`translate(0, ${parkY}) scale(1.5)`}>
        <ellipse cx={-30} cy={15} rx={78} ry={5} fill={STROKE_MAIN} opacity={0.12} />

        {/* Caja de carga */}
        <rect x={-95} y={-58} width={95} height={54} fill={FLOW_COLORS.cream} fillOpacity={0.5} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} rx={6} />
        <line x1={-82} y1={-46} x2={-12} y2={-46} stroke={STROKE_MAIN} strokeWidth={1.2} opacity={0.4} />
        <line x1={-82} y1={-26} x2={-12} y2={-26} stroke={STROKE_MAIN} strokeWidth={1.2} opacity={0.4} />

        {/* Icono Collecta en la caja del camión */}
        <image
          href="/assets/logo-icon.png"
          x={-67}
          y={-48}
          width={30}
          height={30}
          preserveAspectRatio="xMidYMid meet"
        />

        {/* Cabina */}
        <path d="M 0 -54 Q 0 -56 2 -56 L 32 -56 Q 34 -56 36 -54 L 52 -28 L 52 -4 Q 52 -2 50 -2 L 0 -2 Z" fill={FLOW_COLORS.gold} fillOpacity={0.2} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
        <path d="M 6 -50 L 30 -50 L 42 -28 L 6 -28 Z" fill={FLOW_COLORS.frost} fillOpacity={0.5} stroke={STROKE_MAIN} strokeWidth={2} />
        <line x1={14} y1={-48} x2={26} y2={-30} stroke="white" strokeWidth={1.4} opacity={0.7} />
        <line x1={20} y1={-48} x2={32} y2={-30} stroke="white" strokeWidth={1.4} opacity={0.5} />

        <circle cx={49} cy={-10} r={3.5} fill={FLOW_COLORS.goldLight} stroke={STROKE_MAIN} strokeWidth={1.5} />
        <line x1={47} y1={-2} x2={53} y2={-2} stroke={STROKE_MAIN} strokeWidth={2.4} strokeLinecap="round" />

        {/* Ruedas */}
        <g>
          <circle cx={-65} cy={0} r={13} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
          <circle cx={-65} cy={0} r={7} fill={FLOW_COLORS.gold} fillOpacity={0.85} stroke={STROKE_MAIN} strokeWidth={1.6} />
          <circle cx={-65} cy={0} r={2} fill={STROKE_MAIN} />
          <animateTransform attributeName="transform" type="rotate" from="0 -65 0" to="-360 -65 0" dur="1.8s" repeatCount="indefinite" />
        </g>
        <g>
          <circle cx={-30} cy={0} r={13} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
          <circle cx={-30} cy={0} r={7} fill={FLOW_COLORS.gold} fillOpacity={0.85} stroke={STROKE_MAIN} strokeWidth={1.6} />
          <circle cx={-30} cy={0} r={2} fill={STROKE_MAIN} />
          <animateTransform attributeName="transform" type="rotate" from="0 -30 0" to="-360 -30 0" dur="1.8s" repeatCount="indefinite" />
        </g>
        <g>
          <circle cx={28} cy={0} r={13} fill={FLOW_COLORS.cream} stroke={STROKE_MAIN} strokeWidth={STROKE_WIDTH} />
          <circle cx={28} cy={0} r={7} fill={FLOW_COLORS.gold} fillOpacity={0.85} stroke={STROKE_MAIN} strokeWidth={1.6} />
          <circle cx={28} cy={0} r={2} fill={STROKE_MAIN} />
          <animateTransform attributeName="transform" type="rotate" from="0 28 0" to="-360 28 0" dur="1.8s" repeatCount="indefinite" />
        </g>
      </g>
    </motion.g>
  );
}
