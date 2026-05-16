'use client';

import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface PillarProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index?: number;
  variant?: 'light' | 'dark';
}

export function Pillar({
  icon,
  title,
  description,
  index = 0,
  variant = 'light',
}: PillarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: 'easeOut' }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className={clsx(
        'group relative p-8 rounded-2xl border transition-all duration-300',
        'cursor-pointer overflow-hidden',
        variant === 'light' &&
          'bg-white border-border-light hover:border-accent-default hover:shadow-xl',
        variant === 'dark' &&
          'bg-neutral-dark/50 border-white/10 backdrop-blur-sm hover:border-accent-default/50 hover:bg-neutral-dark/70'
      )}
    >
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity">
        <div
          className="absolute inset-0 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)' }}
        />
      </div>

      {/* Number indicator */}
      <div
        className={clsx(
          'absolute top-4 right-6 font-sans text-6xl font-bold opacity-10',
          variant === 'light' ? 'text-primary-dark' : 'text-white'
        )}
      >
        0{index + 1}
      </div>

      {/* Icon */}
      <div className="mb-6 relative z-10">
        <div
          className={clsx(
            'w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-300',
            'group-hover:scale-110 group-hover:rotate-3',
            variant === 'light'
              ? 'bg-gradient-to-br from-secondary-light/30 to-accent-light/30'
              : 'bg-gradient-to-br from-accent-default/20 to-secondary-default/20'
          )}
        >
          <div
            className={clsx(
              'w-8 h-8 flex items-center justify-center',
              variant === 'light' ? 'text-secondary-dark' : 'text-accent-default'
            )}
          >
            {icon}
          </div>
        </div>
      </div>

      {/* Content */}
      <h3
        className={clsx(
          'font-sans text-2xl font-bold mb-3 relative z-10',
          variant === 'light' ? 'text-primary-dark' : 'text-white'
        )}
      >
        {title}
      </h3>
      <p
        className={clsx(
          'text-base leading-relaxed relative z-10',
          variant === 'light' ? 'text-primary' : 'text-neutral-light'
        )}
      >
        {description}
      </p>

      {/* Bottom indicator line */}
      <div className="absolute bottom-0 left-0 h-1 w-0 group-hover:w-full bg-gradient-to-r from-secondary-default to-accent-default transition-all duration-500" />
    </motion.div>
  );
}
