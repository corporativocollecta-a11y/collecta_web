'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Number that:
 *  • counts up from 0 to `end` over `duration` seconds when it enters the
 *    viewport (eased like an odometer slowing down at the target)
 *  • spins on the Y axis (180° → 0°) while doing so, giving the digits a
 *    physical "rolodex" feel
 *  • restarts every time the section re-enters view, not just the first time
 *
 * Uses a native IntersectionObserver instead of framer-motion's useInView so
 * that the trigger is robust against scroll containers / margin oddities.
 */
export function AnimatedCounter({
  end,
  duration = 2,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);
  const [display, setDisplay] = useState(0);

  // Native intersection observer — fires as soon as ANY part of the number
  // enters the viewport, no margin trimming.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setInView(entry.isIntersecting);
        }
      },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Count-up driver. easeOutCubic decelerates into the target so it lands
  // softly, matching the rolodex spin.
  useEffect(() => {
    if (!inView) {
      setDisplay(0);
      return;
    }
    const start = performance.now();
    const totalMs = duration * 1000;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / totalMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(end * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDisplay(end);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, end, duration]);

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : Math.round(display).toLocaleString('en-US');

  return (
    <motion.span
      ref={ref}
      className={className}
      style={{
        display: 'inline-block',
        transformStyle: 'preserve-3d',
        perspective: '600px',
      }}
      initial={{ rotateY: -180, scale: 0.9, opacity: 0 }}
      animate={
        inView
          ? { rotateY: 0, scale: 1, opacity: 1 }
          : { rotateY: -180, scale: 0.9, opacity: 0 }
      }
      transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
    >
      <span aria-hidden="true">
        {prefix}
        {formatted}
        {suffix}
      </span>
      <span className="sr-only">
        {prefix}
        {end.toLocaleString('en-US')}
        {suffix}
      </span>
    </motion.span>
  );
}
