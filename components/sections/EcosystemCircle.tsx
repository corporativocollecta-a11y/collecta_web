'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Reusable Gear SVG component
interface GearProps {
  active?: boolean;
  teeth?: number;
  uniqueId?: string;
}

// Generate gear path with trapezoidal teeth
function generateGearPath(
  teeth: number,
  outerR: number,
  rootR: number
): string {
  const angleStep = (Math.PI * 2) / teeth;
  const toothBaseRatio = 0.55; // tooth base width
  const toothTipRatio = 0.32; // tooth tip width (narrower = trapezoidal)
  const points: string[] = [];

  for (let i = 0; i < teeth; i++) {
    const baseAngle = i * angleStep;
    const baseLeft = baseAngle - (angleStep * toothBaseRatio) / 2;
    const tipLeft = baseAngle - (angleStep * toothTipRatio) / 2;
    const tipRight = baseAngle + (angleStep * toothTipRatio) / 2;
    const baseRight = baseAngle + (angleStep * toothBaseRatio) / 2;

    const polar = (r: number, a: number) => ({
      x: r * Math.cos(a - Math.PI / 2),
      y: r * Math.sin(a - Math.PI / 2),
    });

    const p1 = polar(rootR, baseLeft);
    const p2 = polar(outerR, tipLeft);
    const p3 = polar(outerR, tipRight);
    const p4 = polar(rootR, baseRight);

    if (i === 0) points.push(`M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`);
    else points.push(`L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`);
    points.push(`L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`);
    points.push(`L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`);
    points.push(`L ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`);
  }
  points.push('Z');
  return points.join(' ');
}

function Gear({ active = false, teeth = 12, uniqueId = 'gear' }: GearProps) {
  const gearPath = generateGearPath(teeth, 48, 36);

  // Color palettes for active and inactive states
  const colors = active
    ? {
        light: '#F59E0B',
        mid: '#F59E0B',
        dark: '#F59E0B',
        darker: '#8B6B3A',
        innerBg: '#FAF8F5',
        shadow: 'rgba(184, 148, 80, 0.5)',
      }
    : {
        light: '#FAF8F5',
        mid: '#E8DFD3',
        dark: '#C8B89E',
        darker: '#A89E8D',
        innerBg: '#FAF8F5',
        shadow: 'rgba(168, 158, 141, 0.35)',
      };

  return (
    <svg
      viewBox="-50 -50 100 100"
      className="w-full h-full"
      style={{
        filter: `drop-shadow(0 3px 8px ${colors.shadow})`,
      }}
    >
      <defs>
        {/* Metallic body gradient */}
        <radialGradient id={`${uniqueId}-body`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor={colors.light} />
          <stop offset="45%" stopColor={colors.mid} />
          <stop offset="100%" stopColor={colors.dark} />
        </radialGradient>

        {/* Inner depth gradient (creates 3D hole effect) */}
        <radialGradient id={`${uniqueId}-hole`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colors.innerBg} />
          <stop offset="70%" stopColor={colors.innerBg} />
          <stop offset="95%" stopColor={colors.dark} stopOpacity={0.5} />
          <stop offset="100%" stopColor={colors.darker} stopOpacity={0.8} />
        </radialGradient>

        {/* Subtle highlight on top edge */}
        <linearGradient id={`${uniqueId}-shine`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.6} />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
      </defs>

      <g>
        {/* Outer dark edge for depth */}
        <path
          d={gearPath}
          fill={colors.darker}
          transform="translate(0.4, 0.6)"
        />

        {/* Main gear body with metallic gradient */}
        <path
          d={gearPath}
          fill={`url(#${uniqueId}-body)`}
          stroke={colors.darker}
          strokeWidth={0.8}
          strokeLinejoin="round"
        />

        {/* Top shine overlay */}
        <path
          d={gearPath}
          fill={`url(#${uniqueId}-shine)`}
          opacity={0.5}
        />

        {/* Outer ring detail (subtle bevel) */}
        <circle
          r={32}
          fill="none"
          stroke={colors.darker}
          strokeWidth={0.5}
          opacity={0.4}
        />

        {/* Inner hole with depth */}
        <circle r={24} fill={`url(#${uniqueId}-hole)`} />

        {/* Inner ring stroke */}
        <circle
          r={24}
          fill="none"
          stroke={colors.darker}
          strokeWidth={1.2}
        />

        {/* Inner highlight ring (subtle) */}
        <circle
          r={22.5}
          fill="none"
          stroke={colors.light}
          strokeWidth={0.6}
          opacity={0.7}
        />
      </g>
    </svg>
  );
}

const nodes = [
  {
    id: 1,
    title: 'Invertimos en capital productivo',
    short: 'Capital',
    description:
      'Aportamos insumos, tecnología y supervisión técnica al productor sin generar deuda. Un modelo de coproducción donde compartimos riesgo y utilidad.',
    // Stacked coins - perfectly centered (top=4.5, bottom=19.5, center=12)
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        preserveAspectRatio="xMidYMid meet"
      >
        <ellipse cx={12} cy={7} rx={7} ry={2.5} />
        <path d="M5 7v3.5c0 1.4 3.13 2.5 7 2.5s7-1.1 7-2.5V7" />
        <path d="M5 13.5v3.5c0 1.4 3.13 2.5 7 2.5s7-1.1 7-2.5v-3.5" />
      </svg>
    ),
  },
  {
    id: 2,
    title: 'Controlamos la producción',
    short: 'Control',
    description:
      'Operamos directamente desde el origen: planeación, siembra, supervisión técnica en campo y cosecha. No somos broker, somos operador.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <circle cx={12} cy={12} r={9} />
        <path d="M12 7v5l3 3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 3,
    title: 'Incorporamos tecnología de precisión',
    short: 'Tecnología',
    description:
      'Drones, monitoreo geoespectral, estaciones meteorológicas, IA para análisis de datos y control inteligente de plagas integrados al campo.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x={3} y={3} width={18} height={18} rx={2} />
        <path d="M7 8h10M7 12h10M7 16h6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 4,
    title: 'Garantizamos trazabilidad',
    short: 'Trazabilidad',
    description:
      'Análisis de agua y suelo, documentación completa, certificaciones y registros auditables de principio a fin de cada producto.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M9 12l2 2 4-4M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 5,
    title: 'Llevamos la producción al mercado',
    short: 'Mercado',
    description:
      'Empaque, logística y comercialización a clientes corporativos exigentes. Continuidad de abasto con calidad consistente y entregas puntuales.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M3 17h2l1-9h12l1 9h2M6 17h12M9 21a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 6,
    title: 'Integramos toda la cadena',
    short: 'Integración',
    description:
      'Un solo operador desde la siembra hasta el cliente final. Sin fragmentación, sin intermediarios, con responsabilidad completa.',
    // Chain links - represents integrated supply chain
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        preserveAspectRatio="xMidYMid meet"
      >
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.72-1.71" />
      </svg>
    ),
  },
];

// Position calculation: 6 nodes around a circle, starting from top, clockwise
function getNodePosition(index: number, radius: number) {
  const angle = (index / 6) * 2 * Math.PI - Math.PI / 2; // start at top
  return {
    x: 50 + (radius * Math.cos(angle)) / 5,
    y: 50 + (radius * Math.sin(angle)) / 5,
    angle,
  };
}

export function EcosystemCircle() {
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const radius = 200; // visual radius for layout

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Container with aspect ratio */}
      <div className="relative w-full aspect-square sm:aspect-[4/3] max-h-[600px]">
        {/* SVG for connection arcs */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background circle path */}
          <circle
            cx={50}
            cy={50}
            r={38}
            fill="none"
            stroke="rgba(245, 158, 11, 0.25)"
            strokeWidth={0.3}
            strokeDasharray="0.5 0.8"
          />

          {/* Animated flow circle */}
          <motion.circle
            cx={50}
            cy={50}
            r={38}
            fill="none"
            stroke="url(#flowGradient)"
            strokeWidth={0.4}
            strokeLinecap="round"
            strokeDasharray="8 230"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '50px 50px' }}
          />

          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity={0} />
              <stop offset="50%" stopColor="#F59E0B" stopOpacity={1} />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
            </linearGradient>
          </defs>
        </svg>

        {/* Center main gear with logo - wrapper handles centering, motion handles only animation */}
        <div
          className="absolute top-1/2 left-1/2 z-10"
          style={{
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative w-32 h-32 sm:w-44 sm:h-44 flex items-center justify-center"
          >
            {/* Big rotating gear (counter-clockwise, slower) */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: -360 }}
              transition={{
                duration: 60,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <Gear active={false} teeth={16} uniqueId="gear-center" />
            </motion.div>

            {/* Logo on top (does not rotate) - flex centered */}
            <img
              src="/assets/logo-icon.png"
              alt="Collecta"
              className="relative z-10 pointer-events-none object-contain"
              style={{
                display: 'block',
                width: '5rem',
                height: '3.85rem',
              }}
            />
          </motion.div>
        </div>

        {/* Nodes */}
        {nodes.map((node, index) => {
          const pos = getNodePosition(index, radius);
          const isActive = activeNode === node.id;

          return (
            <div
              key={node.id}
              className="absolute z-20"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onMouseEnter={() => setActiveNode(node.id)}
              onMouseLeave={() => setActiveNode(null)}
              onClick={() => setActiveNode(isActive ? null : node.id)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: 0.2 + index * 0.15,
                  type: 'spring',
                  stiffness: 100,
                }}
              >
              <motion.button
                animate={{
                  scale: isActive ? 1.12 : 1,
                }}
                whileHover={{ scale: 1.12 }}
                className="group cursor-pointer relative"
              >
                {/* Gear with icon - this is the bounding box that gets centered */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                  {/* Rotating gear (alternating direction per node) */}
                  <motion.div
                    className="absolute inset-0"
                    animate={{
                      rotate: index % 2 === 0 ? 360 : -360,
                    }}
                    transition={{
                      duration: isActive ? 12 : 25,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    <Gear
                      active={isActive}
                      teeth={12}
                      uniqueId={`gear-node-${node.id}`}
                    />
                  </motion.div>

                  {/* Static icon on top (does not rotate) */}
                  <div
                    className="relative z-10 w-6 h-6 sm:w-7 sm:h-7 transition-colors duration-300"
                    style={{
                      color: isActive ? '#FFFFFF' : '#F59E0B',
                    }}
                  >
                    {node.icon}
                  </div>
                </div>

                {/* Label positioned absolutely below — does NOT affect bounding box centering */}
                <span
                  className="absolute top-full left-1/2 mt-2 text-[10px] sm:text-xs font-semibold tracking-wide uppercase whitespace-nowrap"
                  style={{
                    color: isActive ? '#F59E0B' : '#4A4A4A',
                    transform: 'translateX(-50%)',
                  }}
                >
                  {node.short}
                </span>
              </motion.button>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Description below, changes based on hover/click */}
      <div className="mt-4 sm:mt-6 min-h-[80px] sm:min-h-[100px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeNode ?? 'default'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-center max-w-2xl mx-auto px-4"
          >
            {activeNode ? (
              <>
                <h4
                  className="text-lg sm:text-xl font-bold mb-2"
                  style={{ color: '#2A2A2A' }}
                >
                  {nodes.find((n) => n.id === activeNode)?.title}
                </h4>
                <p
                  className="text-sm sm:text-base leading-relaxed"
                  style={{ color: '#4A4A4A' }}
                >
                  {nodes.find((n) => n.id === activeNode)?.description}
                </p>
              </>
            ) : (
              <p
                className="text-sm sm:text-base italic"
                style={{ color: '#8B7D6B' }}
              >
                Pasa el cursor sobre cada punto del ciclo para conocer cómo Collecta
                transforma cada etapa de la cadena agroalimentaria.
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
