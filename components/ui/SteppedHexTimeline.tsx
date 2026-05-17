'use client';

import * as React from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import type { TimelineStep } from '@/components/ui/HorizontalTimeline';

interface SteppedHexTimelineProps
  extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** Exactly 3 steps for the zigzag layout. */
  steps: TimelineStep[];
  /** Accent / active color (Collecta gold). */
  accent?: string;
  /** Inactive pedestal color (Collecta navy). */
  trackColor?: string;
  /** Card background — used to "halo" pedestals & for the spacer. */
  cardBg?: string;
}

/**
 * Stepped hexagonal timeline. Three 3-D pedestals arranged in a zigzag,
 * topped by light beams projecting each step's icon, connected by curving
 * arrows. Inspired by editorial process diagrams.
 *
 * The composition is a single SVG (`viewBox 0 0 1100 740`) so pedestals and
 * connectors scale together. Labels live inside `<foreignObject>` so HTML
 * typography stays crisp at any zoom.
 *
 * Animations:
 *  - Pedestals cross-fade navy → gold as `scrollYProgress` passes their slot
 *  - Connectors animate `pathLength` 0 → 1 between consecutive slots
 *  - Labels fade-up with a stagger
 *  - `prefers-reduced-motion` disables motion and shows the final state
 *
 * @example
 *   <SteppedHexTimeline steps={[a, b, c]} />
 */
export function SteppedHexTimeline({
  steps,
  accent = '#F59E0B',
  trackColor = '#1E3A5F',
  cardBg = '#FAF8F5',
  className,
  ...props
}: SteppedHexTimelineProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const reduceMotion = !!useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 85%', 'center 45%'],
  });

  if (process.env.NODE_ENV !== 'production' && steps.length !== 3) {
    // eslint-disable-next-line no-console
    console.warn(
      `SteppedHexTimeline expects 3 steps, got ${steps.length}. Mobile layout will still render correctly.`
    );
  }

  // Slot anchors inside the 1100x740 viewBox. Each pedestal is drawn relative
  // to (x, y) and occupies a 200x280 logical box.
  const stepPositions = [
    { x: 70, y: 60 },   // Step 1 — top
    { x: 390, y: 220 }, // Step 2 — dropped down (zigzag)
    { x: 710, y: 60 },  // Step 3 — top
  ];

  // Connector paths between consecutive pedestal "shoulders" — right shoulder
  // of N to left shoulder of N+1. Smooth cubic beziers.
  // Coordinates are in viewBox space.
  const connectors = [
    // Step 1 (top) → Step 2 (bottom)
    {
      d: 'M 220 215 C 290 275, 360 320, 430 365',
      start: 0.18,
      end: 0.5,
    },
    // Step 2 (bottom) → Step 3 (top)
    {
      d: 'M 550 365 C 620 320, 690 275, 760 215',
      start: 0.5,
      end: 0.82,
    },
  ];

  return (
    <div
      ref={containerRef}
      data-slot="stepped-hex-timeline"
      className={cn('relative w-full', className)}
      {...props}
    >
      {/* Desktop / tablet — full zigzag composition */}
      <div className="hidden md:block">
        <svg
          viewBox="0 0 1100 740"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          role="img"
          aria-label="Proceso operativo en 3 pasos"
        >
          <defs>
            {/* Navy pedestal facets */}
            <linearGradient id="hexTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3D5F87" />
              <stop offset="100%" stopColor={trackColor} />
            </linearGradient>
            <linearGradient id="hexRight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2E4870" />
              <stop offset="100%" stopColor="#162840" />
            </linearGradient>
            <linearGradient id="hexLeft" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#223857" />
              <stop offset="100%" stopColor="#0E1B30" />
            </linearGradient>

            {/* Gold pedestal facets (active state) */}
            <linearGradient id="hexTopActive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F1D89B" />
              <stop offset="100%" stopColor={accent} />
            </linearGradient>
            <linearGradient id="hexRightActive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C49558" />
              <stop offset="100%" stopColor="#86601E" />
            </linearGradient>
            <linearGradient id="hexLeftActive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A07A3A" />
              <stop offset="100%" stopColor="#5C401B" />
            </linearGradient>

            {/* Light beam — bright at top (where icon sits), fades down */}
            <linearGradient id="beamGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset="55%" stopColor={accent} stopOpacity="0.45" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.10" />
            </linearGradient>

            {/* Connector gradient */}
            <linearGradient id="connector" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={accent} stopOpacity="0.9" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.55" />
            </linearGradient>

            {/* Arrow head at the end of each connector */}
            <marker
              id="arrowhead"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={accent} />
            </marker>

            {/* Ground shadow */}
            <radialGradient id="groundShadow">
              <stop offset="0%" stopColor="#000" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* CONNECTORS — drawn before pedestals so pedestals overlap them */}
          {connectors.map((c, i) => (
            <ConnectorPath
              key={i}
              d={c.d}
              scrollYProgress={scrollYProgress}
              start={c.start}
              end={c.end}
              reduceMotion={reduceMotion}
            />
          ))}

          {/* PEDESTALS + LABELS */}
          {steps.slice(0, 3).map((step, i) => {
            const slot = stepPositions[i];
            const threshold = i / 2; // 0, 0.5, 1
            const labelY = slot.y + 305; // sits just under the pedestal base
            return (
              <React.Fragment key={i}>
                <Pedestal
                  x={slot.x}
                  y={slot.y}
                  index={i}
                  step={step}
                  scrollYProgress={scrollYProgress}
                  threshold={threshold}
                  reduceMotion={reduceMotion}
                />
                <foreignObject
                  x={slot.x - 30}
                  y={labelY}
                  width="260"
                  height="140"
                >
                  <div
                    style={{
                      textAlign: 'center',
                      fontFamily:
                        '"Geist", ui-sans-serif, system-ui, -apple-system, sans-serif',
                      color: '#2A2A2A',
                    }}
                  >
                    <h5
                      style={{
                        fontWeight: 700,
                        fontSize: '18px',
                        marginBottom: '6px',
                        lineHeight: 1.25,
                      }}
                    >
                      {step.title}
                    </h5>
                    <p
                      style={{
                        fontSize: '14px',
                        lineHeight: 1.55,
                        color: '#4A4A4A',
                        margin: 0,
                      }}
                    >
                      {step.description}
                    </p>
                  </div>
                </foreignObject>
              </React.Fragment>
            );
          })}
        </svg>
      </div>

      {/* Mobile fallback — stack vertically with small 3D-ish nodes */}
      <div className="md:hidden space-y-10">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="flex items-start gap-5"
          >
            <span
              className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-white"
              style={{
                background: `linear-gradient(135deg, #3D5F87, ${trackColor})`,
                boxShadow: `0 0 0 5px ${cardBg}, 0 8px 24px rgba(20, 35, 60, 0.25), inset 0 1px 0 rgba(255,255,255,0.25)`,
              }}
            >
              <span className="block w-7 h-7">{step.icon}</span>
            </span>
            <div className="flex-1 pt-1">
              <span
                className="block text-[10px] font-semibold tracking-[0.18em] uppercase mb-1"
                style={{ color: accent }}
              >
                Paso {String(i + 1).padStart(2, '0')}
              </span>
              <h5 className="font-bold text-base mb-1" style={{ color: '#2A2A2A' }}>
                {step.title}
              </h5>
              <p className="text-sm leading-relaxed" style={{ color: '#4A4A4A' }}>
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PEDESTAL — single hexagonal 3-D step (icon on top of light beam, sitting on
// top of a prism with number on the front face).
// ---------------------------------------------------------------------------
//
// Local coordinates inside the pedestal group (200 wide × 280 tall):
//
//   y=34   icon center (~100, 50)         32x32 icon, white stroke
//   y=30   beam top edge      (70..130)   wider end (60 wide)
//   y=125  beam bottom edge   (85..115)   narrower end (30 wide)
//   y=130  hex back-top point at (100,130)
//   y=145  hex side shoulders A(50,145), C(150,145)
//   y=175  hex back-bottom shoulders F(50,175), D(150,175)
//   y=190  hex front point E(100, 190)
//   y=235  prism bottom side shoulders F'(50,235), D'(150,235)
//   y=250  prism front bottom point E'(100, 250)
//   y=260  ground shadow ellipse
//
// ---------------------------------------------------------------------------

const HEX_TOP_POINTS = '50,145 100,130 150,145 150,175 100,190 50,175';
const HEX_FRONT_LEFT_POINTS = '50,175 100,190 100,250 50,235';
const HEX_FRONT_RIGHT_POINTS = '100,190 150,175 150,235 100,250';
const BEAM_POINTS = '70,30 130,30 115,125 85,125';
const HIGHLIGHT_TOP = '50,145 100,130 150,145';

interface PedestalProps {
  x: number;
  y: number;
  index: number;
  step: TimelineStep;
  scrollYProgress: MotionValue<number>;
  threshold: number;
  reduceMotion: boolean;
}

function Pedestal({
  x,
  y,
  index,
  step,
  scrollYProgress,
  threshold,
  reduceMotion,
}: PedestalProps) {
  const BAND = 0.09;
  const lo = Math.max(0, threshold - BAND);
  const hi = Math.min(1, threshold + BAND);

  const activeOpacity = useTransform(scrollYProgress, [lo, hi], [0, 1]);

  // Resize the user-provided icon to render at 32x32 inside the parent SVG,
  // and force white stroke for contrast against the beam.
  const sizedIcon = React.isValidElement(step.icon)
    ? React.cloneElement(
        step.icon as React.ReactElement<React.SVGProps<SVGSVGElement>>,
        {
          width: 32,
          height: 32,
          stroke: '#FFFFFF',
          strokeWidth: 1.6,
        }
      )
    : step.icon;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Soft ground shadow */}
      <ellipse cx={100} cy={262} rx={78} ry={9} fill="url(#groundShadow)" />

      {/* NAVY pedestal (default) */}
      <g>
        <polygon points={HEX_TOP_POINTS} fill="url(#hexTop)" />
        <polygon points={HEX_FRONT_LEFT_POINTS} fill="url(#hexLeft)" />
        <polygon points={HEX_FRONT_RIGHT_POINTS} fill="url(#hexRight)" />
      </g>

      {/* GOLD pedestal (active — fades in with scroll) */}
      <motion.g style={reduceMotion ? { opacity: 1 } : { opacity: activeOpacity }}>
        <polygon points={HEX_TOP_POINTS} fill="url(#hexTopActive)" />
        <polygon points={HEX_FRONT_LEFT_POINTS} fill="url(#hexLeftActive)" />
        <polygon points={HEX_FRONT_RIGHT_POINTS} fill="url(#hexRightActive)" />
      </motion.g>

      {/* Specular edge along the very top */}
      <polyline
        points={HIGHLIGHT_TOP}
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {/* Light beam (rendered over the pedestal so it visually "lands" on it) */}
      <polygon points={BEAM_POINTS} fill="url(#beamGrad)" />

      {/* Number on the front face */}
      <text
        x={100}
        y={220}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily='"Geist", ui-sans-serif, system-ui, sans-serif'
        fontWeight={700}
        fontSize={24}
        fill="#FFFFFF"
        letterSpacing="1"
      >
        {String(index + 1).padStart(2, '0')}
      </text>

      {/* Icon — placed at the wider top of the beam */}
      <g transform="translate(84, 34)" stroke="#FFFFFF" fill="none">
        {sizedIcon}
      </g>
    </g>
  );
}

// ---------------------------------------------------------------------------
// CONNECTOR — animated bezier path between pedestals.
// ---------------------------------------------------------------------------

interface ConnectorPathProps {
  d: string;
  scrollYProgress: MotionValue<number>;
  start: number;
  end: number;
  reduceMotion: boolean;
}

function ConnectorPath({
  d,
  scrollYProgress,
  start,
  end,
  reduceMotion,
}: ConnectorPathProps) {
  const pathLength = useTransform(scrollYProgress, [start, end], [0, 1]);

  return (
    <motion.path
      d={d}
      fill="none"
      stroke="url(#connector)"
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
      markerEnd="url(#arrowhead)"
      style={{
        pathLength: reduceMotion ? 1 : pathLength,
      }}
    />
  );
}

export type { SteppedHexTimelineProps };
