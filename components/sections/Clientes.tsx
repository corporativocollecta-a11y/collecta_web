'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useT } from '@/lib/i18n/LocaleProvider';

const featuresMeta = [
  { color: '#3B82F6', titleKey: 'clientes.feature.programacion.title', descKey: 'clientes.feature.programacion.description' },
  { color: '#14B8A6', titleKey: 'clientes.feature.comunicacion.title', descKey: 'clientes.feature.comunicacion.description' },
  { color: '#00FF80', titleKey: 'clientes.feature.riesgos.title',      descKey: 'clientes.feature.riesgos.description' },
  { color: '#F59E0B', titleKey: 'clientes.feature.continuidad.title',  descKey: 'clientes.feature.continuidad.description' },
] as const;

export function Clientes() {
  const t = useT();
  const features = featuresMeta.map((f) => ({
    color: f.color,
    title: t(f.titleKey),
    description: t(f.descKey),
  }));
  return (
    <section id="clientes" className="relative pt-4 pb-28 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl relative z-10">
        {/* Features in two columns */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-[100px] lg:gap-12 items-center mb-[100px] lg:mb-20"
        >
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h3
              className="font-sans text-2xl sm:text-3xl font-bold mb-6"
              style={{ color: '#FFFFFF' }}
            >
              {t('clientes.heading')}
            </h3>
            <p
              className="text-lg mb-8 leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.78)' }}
            >
              {t('clientes.lead')}
            </p>
            <div className="space-y-4">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex gap-4 items-start"
                >
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: `${feature.color}1A`,
                      boxShadow: `inset 0 0 0 1.5px ${feature.color}66`,
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: feature.color,
                        boxShadow: `0 0 12px ${feature.color}99`,
                      }}
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1" style={{ color: '#FFFFFF' }}>
                      {feature.title}
                    </h4>
                    <p style={{ color: 'rgba(255,255,255,0.78)' }}>{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative flex items-center justify-center"
          >
            {/* Wrapper interno con oscilación continua (rotate ± 3° + float Y ± 5px) */}
            <motion.div
              animate={{ rotate: [-3, 3, -3], y: [-5, 5, -5] }}
              transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
              className="w-full flex items-center justify-center"
              style={{ transformOrigin: 'center' }}
            >
            <img
              src="/assets/caja-brocoli.png"
              alt="Caja Collecta — Brócoli & Trazabilidad"
              className="w-full max-w-[800px] h-auto select-none mx-auto scale-[1.3] lg:scale-[1.15] lg:translate-x-12"
              draggable={false}
              style={{
                transformOrigin: 'center',
                filter:
                  'drop-shadow(0 30px 40px rgba(80, 60, 30, 0.22)) drop-shadow(0 10px 16px rgba(80, 60, 30, 0.14))',
              }}
            />
            </motion.div>
          </motion.div>
        </div>

        {/* CTA - Plataforma. Fondo navy sólido con patrón isométrico de cubos. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden rounded-2xl p-12 text-center border max-w-6xl mx-auto"
          style={{
            background: '#172E66',
            borderColor: 'rgba(255,255,255,0.10)',
          }}
        >
          {/* Patrón isométrico de cubos — efecto de fondo decorativo */}
          <svg
            aria-hidden
            className="absolute inset-0 w-full h-full pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="isoCubesCTA"
                width="56"
                height="97"
                patternUnits="userSpaceOnUse"
                patternTransform="scale(1.1)"
              >
                <polygon
                  points="28,0 56,16.17 28,32.33 0,16.17"
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="0.8"
                />
                <polygon
                  points="0,16.17 28,32.33 28,64.67 0,48.5"
                  fill="none"
                  stroke="rgba(255,255,255,0.10)"
                  strokeWidth="0.8"
                />
                <polygon
                  points="56,16.17 28,32.33 28,64.67 56,48.5"
                  fill="none"
                  stroke="rgba(255,255,255,0.10)"
                  strokeWidth="0.8"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#isoCubesCTA)" />
          </svg>

          <div className="relative z-10">
            <h3
              className="text-2xl sm:text-3xl font-bold mb-4"
              style={{ color: '#00FF80' }}
            >
              {t('clientes.cta.title')}
            </h3>
            <p
              className="text-lg mb-8 max-w-2xl mx-auto"
              style={{ color: 'rgba(255,255,255,0.82)' }}
            >
              {t('clientes.cta.body')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/plataforma"
                className="inline-block px-8 py-4 font-semibold rounded-lg transition-colors duration-300"
                style={{ backgroundColor: '#00FF80', color: '#0a1a0d' }}
              >
                {t('clientes.cta.primary')}
              </a>
              <a
                href="#contacto"
                className="inline-block px-8 py-4 border-2 font-medium rounded-lg transition-all duration-300"
                style={{ borderColor: 'rgba(255,255,255,0.45)', color: '#FFFFFF' }}
              >
                {t('clientes.cta.secondary')}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
