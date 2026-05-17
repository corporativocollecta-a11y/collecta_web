'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

const stats = [
  {
    value: 4000,
    suffix: '+',
    label: 'Hectáreas',
    description: 'En operación integrada',
  },
  {
    value: 300,
    suffix: '+',
    label: 'Productores',
    description: 'En la red de coproducción',
  },
  {
    value: 9,
    suffix: '',
    label: 'Cultivos',
    description: 'Hortalizas diversificadas',
  },
  {
    value: 95,
    suffix: '%',
    label: 'Trazabilidad',
    description: 'Productos auditables',
  },
];

interface CompanyStatsProps {
  /** Optional title above the stats row. */
  title?: string;
  /** Optional caption below the stats row. */
  caption?: string;
}

/**
 * Inline 4-up stats row — used directly on the page (no outer container).
 *
 * Each metric sits in its own navy mini-card with a gold number, white label,
 * and short description. The grid drops to 2 cols on tablet and 1 col on
 * mobile. Numbers animate with the existing odometer-style counter when the
 * row enters the viewport.
 */
export function CompanyStats({ title, caption }: CompanyStatsProps = {}) {
  return (
    <div className="w-full">
      {title ? (
        <motion.h3
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-sm font-medium tracking-widest uppercase mb-4"
          style={{ color: '#00FF80' }}
        >
          {title}
        </motion.h3>
      ) : null}

      {/* Minimal stats row — borrowed from the Collecta premium mockup.
          No card backgrounds, just big serif numbers in electric green,
          tiny tracking-widest labels, and faint vertical dividers between
          columns. Top/bottom hairlines frame the whole row. */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4"
        style={{
          borderTop: '1px solid rgba(74, 222, 128, 0.11)',
          borderBottom: '1px solid rgba(74, 222, 128, 0.11)',
        }}
      >
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-center px-4 py-8 sm:py-10"
            style={{
              borderRight:
                i < stats.length - 1
                  ? '1px solid rgba(0, 255, 128, 0.08)'
                  : undefined,
            }}
          >
            <div
              className="leading-none mb-3"
              style={{
                color: '#00FF80',
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(28px, 3.5vw, 44px)',
                fontWeight: 400,
                letterSpacing: '-0.01em',
              }}
            >
              <AnimatedCounter end={stat.value} suffix={stat.suffix} duration={2} />
            </div>
            <p
              className="uppercase mb-1"
              style={{
                color: 'rgba(236, 248, 237, 0.55)',
                fontSize: 10,
                letterSpacing: '0.22em',
                fontWeight: 500,
              }}
            >
              {stat.label}
            </p>
            <p
              className="text-xs sm:text-sm leading-tight"
              style={{ color: 'rgba(236, 248, 237, 0.35)' }}
            >
              {stat.description}
            </p>
          </motion.div>
        ))}
      </div>

      {caption ? (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-sm mt-8 text-center max-w-xl mx-auto"
          style={{ color: '#6A6A6A' }}
        >
          {caption}
        </motion.p>
      ) : null}
    </div>
  );
}
