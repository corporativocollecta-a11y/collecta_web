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

/**
 * One step of the supply / process journey.
 */
export type TimelineStep = {
  /** SVG icon — receives a 24x24 viewBox and `currentColor` strokes. */
  icon: React.ReactNode;
  title: string;
  description: string;
};

interface HorizontalTimelineProps
  extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** The ordered list of steps. Optimised for 3–5 nodes. */
  steps: TimelineStep[];
  /** Accent / active color (default Collecta gold). */
  accent?: string;
  /** Inactive track color (default Collecta navy). */
  trackColor?: string;
  /** "Halo" color around node — should match the card background. */
  haloColor?: string;
}

/**
 * Horizontal scroll-progress timeline.
 *
 * Visual language: editorial / Liquid Glass — backdrop blur on nodes, soft
 * specular highlights, and a gold progress track that fills as the section
 * scrolls into view. Each node lights up (color shift + soft glow) when the
 * progress reaches its threshold.
 *
 * Respects `prefers-reduced-motion`: if reduced motion is preferred the
 * scroll-linked animations are disabled and the timeline shows its final
 * "all-active" state from the start.
 *
 * @example
 *   <HorizontalTimeline
 *     steps={[
 *       { icon: <PlanIcon />, title: 'Plan', description: '...' },
 *       { icon: <RunIcon />,  title: 'Run',  description: '...' },
 *       { icon: <ShipIcon />, title: 'Ship', description: '...' },
 *     ]}
 *   />
 */
export function HorizontalTimeline({
  steps,
  accent = '#00FF80',
  trackColor = '#1E3A5F',
  haloColor = '#FAF8F5',
  className,
  ...props
}: HorizontalTimelineProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const reduceMotion = !!useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 80%', 'center 50%'],
  });

  // Map scroll progress (0–1) to track fill (0–66.66% of container, the
  // distance between the centers of the first and last node).
  const TRACK_INSET = 16.67; // percent — also where the first/last node sits
  const TRACK_SPAN = 100 - TRACK_INSET * 2; // 66.66%
  const progressWidth = useTransform(
    scrollYProgress,
    [0, 1],
    ['0%', `${TRACK_SPAN}%`]
  );

  return (
    <div
      ref={containerRef}
      data-slot="horizontal-timeline"
      className={cn('relative max-w-5xl mx-auto', className)}
      {...props}
    >
      {/* TRACKS (desktop only) */}
      <div className="relative">
        {/* Base track — soft navy line, always visible */}
        <div
          aria-hidden="true"
          className="hidden sm:block absolute top-9 h-[3px] rounded-full"
          style={{
            left: `${TRACK_INSET}%`,
            right: `${TRACK_INSET}%`,
            background: `linear-gradient(90deg, ${trackColor}33 0%, ${trackColor}1A 50%, ${trackColor}33 100%)`,
          }}
        />
        {/* Progress track — gold, fills with scroll */}
        <motion.div
          aria-hidden="true"
          className="hidden sm:block absolute top-9 h-[3px] rounded-full"
          style={{
            left: `${TRACK_INSET}%`,
            width: reduceMotion ? `${TRACK_SPAN}%` : progressWidth,
            // Progress track is now solid electric green — no amber, no glow.
            background: '#00FF80',
          }}
        />

        <ol
          className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-14 relative"
          aria-label="Proceso operativo en 3 pasos"
        >
          {steps.map((step, i) => {
            const threshold = steps.length > 1 ? i / (steps.length - 1) : 0;
            return (
              <TimelineNode
                key={i}
                step={step}
                index={i}
                threshold={threshold}
                scrollYProgress={scrollYProgress}
                accent={accent}
                trackColor={trackColor}
                haloColor={haloColor}
                reduceMotion={reduceMotion}
              />
            );
          })}
        </ol>
      </div>
    </div>
  );
}

interface TimelineNodeProps {
  step: TimelineStep;
  index: number;
  threshold: number;
  scrollYProgress: MotionValue<number>;
  accent: string;
  trackColor: string;
  haloColor: string;
  reduceMotion: boolean;
}

function TimelineNode({
  step,
  index,
  threshold,
  scrollYProgress,
  accent,
  trackColor,
  haloColor,
  reduceMotion,
}: TimelineNodeProps) {
  // Smooth band around `threshold` so the node "lights up" as the progress
  // line sweeps through it instead of snapping.
  const BAND = 0.06;
  const lo = Math.max(0, threshold - BAND);
  const hi = Math.min(1, threshold + BAND);

  const nodeBackground = useTransform(scrollYProgress, [lo, hi], [trackColor, accent]);
  const nodeScale = useTransform(scrollYProgress, [lo, threshold, hi], [1, 1.08, 1]);
  const glowOpacity = useTransform(scrollYProgress, [lo, threshold, 1], [0, 0.9, 0.9]);
  const numberOpacity = useTransform(scrollYProgress, [lo, hi], [0.7, 1]);

  return (
    <motion.li
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.55,
        delay: 0.25 + index * 0.12,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group flex flex-col items-center text-center"
    >
      {/* NODE — icon inside a glass disc */}
      <motion.div
        className="relative mb-5"
        style={reduceMotion ? undefined : { scale: nodeScale }}
      >
        {/* Glass node */}
        <motion.span
          className={cn(
            'relative z-10 inline-flex items-center justify-center',
            'w-14 h-14 sm:w-16 sm:h-16 rounded-full text-white',
            'transition-transform duration-300 will-change-transform',
            'group-hover:rotate-[8deg]'
          )}
          style={{
            backgroundColor: reduceMotion ? accent : nodeBackground,
            // No drop shadow on the amber nodes — they sit flat on the card.
            // Only the halo ring is kept so the timeline still appears to
            // "thread through" each node.
            boxShadow: `0 0 0 5px ${haloColor}`,
          }}
        >
          <span className="block w-6 h-6 sm:w-7 sm:h-7">{step.icon}</span>
        </motion.span>
      </motion.div>

      {/* Step label — small, gold, all-caps */}
      <motion.span
        className="text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase mb-2"
        style={{
          color: accent,
          opacity: reduceMotion ? 1 : numberOpacity,
        }}
      >
        Paso {String(index + 1).padStart(2, '0')}
      </motion.span>

      <h5
        className="font-bold text-base sm:text-lg mb-2 transition-colors duration-300 group-hover:text-[color:var(--collecta-navy,#1E3A5F)]"
        style={{ color: '#2A2A2A' }}
      >
        {step.title}
      </h5>

      <p
        className="text-sm sm:text-base leading-relaxed max-w-xs mx-auto"
        style={{ color: '#4A4A4A' }}
      >
        {step.description}
      </p>
    </motion.li>
  );
}

export type { HorizontalTimelineProps };
