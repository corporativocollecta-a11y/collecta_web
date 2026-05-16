'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

// New rich globe (Three.js + d3-geo + topojson). Lazy-loaded client-side so
// the heavy three.js / atlas payload doesn't ship in the server bundle.
const Globe = dynamic(() => import('@/components/3d/Globe'), {
  ssr: false,
  loading: () => <GlobePlaceholder />,
});

function GlobePlaceholder() {
  return (
    <div
      className="w-full h-[500px] rounded-lg flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #FAF8F5 0%, #E8DFD3 100%)',
      }}
    >
      <div className="animate-pulse" style={{ color: '#F59E0B' }}>
        Cargando red de operaciones...
      </div>
    </div>
  );
}

interface GlobeShowcaseProps {
  /** Height in CSS units (px, vh, etc.). @default "500px" */
  height?: string;
  /** Optional caption beneath the globe. */
  caption?: string;
}

/**
 * Showcase wrapper for the interactive globe.
 *
 * Wraps the dynamic import (the globe pulls in three.js + d3-geo +
 * topojson and only loads client-side), the lazy mount-on-view, the
 * motion entrance, and the optional caption.
 *
 * Globe needs an explicit container height — we provide it via the outer
 * `<div style={{ height }}>`.
 */
export function GlobeShowcase({
  height = '500px',
  caption,
}: GlobeShowcaseProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div
        style={{ width: '100%', height }}
        className="rounded-lg overflow-hidden"
      >
        <Globe theme="teal" autoRotate={0.0018} />
      </div>
      {caption ? (
        <p className="text-center text-sm mt-4" style={{ color: '#6A6A6A' }}>
          {caption}
        </p>
      ) : null}
    </motion.div>
  );
}
