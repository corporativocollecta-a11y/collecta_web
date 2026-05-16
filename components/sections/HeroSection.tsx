'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';

export function HeroSection() {
  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero/tech-plants.jpeg"
          alt="Agroindustria de precisión — Collecta"
          className="w-full h-full select-none"
          draggable={false}
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />
        {/* Gradient overlay for legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(10, 20, 30, 0.55) 0%, rgba(10, 20, 30, 0.35) 40%, rgba(10, 20, 30, 0.75) 100%)',
          }}
        />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
        className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 w-full text-center"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="font-sans text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold mb-8 leading-[1.05] text-white"
          style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
        >
          Rediseñando la cadena alimentaria
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6 }}
          className="text-lg sm:text-xl lg:text-2xl mb-10 max-w-3xl mx-auto text-white/90 leading-relaxed"
          style={{ textShadow: '0 1px 10px rgba(0,0,0,0.5)' }}
        >
          Un ecosistema integrado de producción, tecnología y comercialización que impulsa la
          transformación de la agroindustria en América Latina.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 mt-16 sm:mt-24"
        >
          {[
            { href: '#clientes', label: 'Clientes' },
            { href: '#productores', label: 'Productores' },
            { href: '#impacto', label: 'Aliados' },
          ].map((btn) => (
            <LiquidGlassButton
              key={btn.href}
              href={btn.href}
              tint="green"
              size="lg"
              className="w-full sm:w-auto"
            >
              {btn.label}
            </LiquidGlassButton>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
