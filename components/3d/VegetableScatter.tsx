'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Vegetable {
  id: string;
  name: string;
  emoji: string;       // fallback while real PNGs aren't dropped in
  src: string;         // /vegetables/<file>.png — replace with hyper-real cutouts
  size: number;        // base render size (px)
}

const VEGETABLES: Vegetable[] = [
  { id: 'brocoli',        name: 'Brócoli',        emoji: '🥦', src: '/vegetables/brocoli.png',        size: 125 },
  { id: 'zanahoria',      name: 'Zanahoria',      emoji: '🥕', src: '/vegetables/zanahoria.png',      size: 120 },
  { id: 'lechuga',        name: 'Lechuga',        emoji: '🥬', src: '/vegetables/lechuga.png',        size: 130 },
  { id: 'repollo-morado', name: 'Repollo morado', emoji: '🥬', src: '/vegetables/repollo-morado.png', size: 125 },
  { id: 'coliflor',       name: 'Coliflor',       emoji: '🥦', src: '/vegetables/coliflor.png',       size: 125 },
  { id: 'tomate',         name: 'Tomate',         emoji: '🍅', src: '/vegetables/tomate.png',         size: 110 },
  { id: 'morron',         name: 'Morrón',         emoji: '🫑', src: '/vegetables/morron.png',         size: 115 },
  { id: 'pepino',         name: 'Pepino',         emoji: '🥒', src: '/vegetables/pepino.png',         size: 120 },
];

// 6 slots evenly spaced across the band, alternating Y between two rows
// to give every tile ~17% horizontal breathing room. With max tile ≈ 130px on a
// ~1100px container (~12% width), neighbours never visually collide.
const SLOTS: { x: number; y: number }[] = [
  { x: 8,  y: 40 },
  { x: 25, y: 75 },
  { x: 42, y: 35 },
  { x: 58, y: 75 },
  { x: 75, y: 35 },
  { x: 92, y: 70 },
];

interface ActiveItem {
  veg: Vegetable;
  slot: { x: number; y: number };
  rotation: number;
  appearDelay: number;
  key: number;
}

function useImageAvailable(src: string): boolean {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setAvailable(true);
    img.onerror = () => setAvailable(false);
    img.src = src;
  }, [src]);
  return available;
}

function VegetableTile({ item }: { item: ActiveItem }) {
  const hasImage = useImageAvailable(item.veg.src);
  const { slot, veg, rotation, appearDelay } = item;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${slot.x}%`,
        top: `${slot.y}%`,
        width: veg.size,
        height: veg.size,
        marginLeft: -veg.size / 2,
        marginTop: -veg.size / 2,
      }}
      initial={{ opacity: 0, scale: 0.4, rotate: rotation - 30, y: 20 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0.4, 1, 1, 0.6],
        rotate: [rotation - 30, rotation, rotation + 6, rotation + 12],
        y: [20, 0, -8, -28],
      }}
      transition={{
        duration: 5.5,
        delay: appearDelay,
        times: [0, 0.18, 0.78, 1],
        ease: 'easeInOut',
      }}
    >
      {hasImage ? (
        <motion.img
          src={veg.src}
          alt={veg.name}
          width={veg.size}
          height={veg.size}
          className="w-full h-full object-contain select-none"
          draggable={false}
          style={{
            // PNGs are RGBA (transparent background) — no blend mode needed.
            // Double drop-shadow gives soft realistic depth on the cream Hero.
            filter:
              'drop-shadow(0 14px 22px rgba(80, 60, 30, 0.22)) drop-shadow(0 4px 6px rgba(80, 60, 30, 0.12))',
          }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : (
        <motion.div
          className="w-full h-full flex items-center justify-center select-none"
          style={{
            fontSize: veg.size * 0.85,
            lineHeight: 1,
            filter: 'drop-shadow(0 10px 14px rgba(80, 60, 30, 0.18))',
          }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {veg.emoji}
        </motion.div>
      )}
    </motion.div>
  );
}

interface VegetableScatterProps {
  height?: number | string;
}

export function VegetableScatter({ height = 320 }: VegetableScatterProps) {
  const [tick, setTick] = useState(0);

  // Build active set: shuffle vegetables and assign slots with staggered delays
  const items: ActiveItem[] = useMemo(() => {
    const shuffled = [...VEGETABLES].sort(() => Math.random() - 0.5);
    return SLOTS.map((slot, i) => {
      const veg = shuffled[i % shuffled.length];
      return {
        veg,
        slot,
        rotation: (Math.random() - 0.5) * 24,
        appearDelay: i * 0.35 + Math.random() * 0.2,
        key: tick * 100 + i,
      };
    });
  }, [tick]);

  // Cycle the whole set every ~8s so vegetables rotate in/out continuously
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 6500);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height }}
      aria-hidden
    >
      <AnimatePresence>
        {items.map((item) => (
          <VegetableTile key={item.key} item={item} />
        ))}
      </AnimatePresence>

      {/* Soft horizon shadow under the scatter to ground the tiles */}
      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          bottom: '6%',
          width: '70%',
          height: 28,
          background: 'radial-gradient(ellipse at center, rgba(80,60,30,0.12) 0%, rgba(80,60,30,0) 70%)',
        }}
      />
    </div>
  );
}
