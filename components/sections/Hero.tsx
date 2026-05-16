'use client';

import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface HeroProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  cta?: {
    label: string;
    href: string;
    variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  };
  background?: 'dark' | 'gradient';
  align?: 'center' | 'left';
  fullHeight?: boolean;
  children?: React.ReactNode;
}

export function Hero({
  title,
  subtitle,
  description,
  cta,
  background = 'dark',
  align = 'center',
  fullHeight = true,
  children,
}: HeroProps) {
  const bgStyles = {
    dark: '',
    gradient: '',
  };

  const inlineBackground = {
    dark: { backgroundColor: '#FAF8F5' },
    gradient: {
      background:
        'linear-gradient(135deg, #FAF8F5 0%, #F5F2ED 50%, #E8DFD3 100%)',
    },
  };

  const alignStyles = {
    center: 'text-center',
    left: 'text-left',
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' as const },
    },
  };

  return (
    <section
      style={inlineBackground[background]}
      className={clsx(
        fullHeight ? 'min-h-screen' : 'h-auto',
        'relative overflow-hidden flex items-start justify-center pt-24 sm:pt-28 pb-8',
        'text-[#2A2A2A]'
      )}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute top-20 right-0 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: '#F59E0B' }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: '#8B7D6B' }}
        />
      </div>

      <motion.div
        className={clsx(
          'relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 w-full',
          alignStyles[align]
        )}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {subtitle && (
          <motion.p
            className="text-sm sm:text-base font-medium tracking-wider uppercase mb-3"
            style={{ color: '#F59E0B' }}
            variants={itemVariants}
          >
            {subtitle}
          </motion.p>
        )}

        {typeof title === 'string' ? (
          <motion.h1
            className="font-sans text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight"
            style={{ color: '#2A2A2A' }}
            variants={itemVariants}
          >
            {title}
          </motion.h1>
        ) : (
          <motion.div variants={itemVariants} className="mb-4">
            {title}
          </motion.div>
        )}

        {description && (
          <motion.p
            className="text-base sm:text-lg mb-6 max-w-2xl mx-auto"
            style={{ color: '#4A4A4A' }}
            variants={itemVariants}
          >
            {description}
          </motion.p>
        )}

        {cta && (
          <motion.div variants={itemVariants}>
            <a
              href={cta.href}
              className={clsx(
                'inline-block px-8 py-4 font-medium rounded-lg transition-all duration-300 text-base',
                cta.variant === 'primary' && 'bg-accent-default text-white hover:bg-accent-dark',
                cta.variant === 'secondary' && 'bg-secondary-default text-white hover:bg-secondary-dark',
                cta.variant === 'outline' && 'border-2 border-white text-white hover:bg-white hover:text-neutral-dark',
                !cta.variant && 'bg-accent-default text-white hover:bg-accent-dark'
              )}
            >
              {cta.label}
            </a>
          </motion.div>
        )}

        {children && (
          <motion.div variants={itemVariants} className="mt-4 sm:mt-6">
            {children}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
