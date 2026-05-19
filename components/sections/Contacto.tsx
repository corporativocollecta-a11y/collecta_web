'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormCliente } from '@/components/sections/FormCliente';
import { FormProductor } from '@/components/sections/FormProductor';
import { useT } from '@/lib/i18n/LocaleProvider';

type FormType = 'cliente' | 'productor';

export function Contacto() {
  const t = useT();
  const [activeForm, setActiveForm] = useState<FormType>('cliente');

  return (
    <section
      id="contacto"
      data-keep-bg
      className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden"
      style={{ backgroundColor: '#0f1612' }}
    >
      {/* Background image — agricultural field.
          Responsive: portrait crop on mobile (<=1024px), wide crop on
          tablet+/desktop. <picture> lets the browser download only the
          asset that matches the viewport. */}
      <picture aria-hidden className="absolute inset-0 z-0 block">
        <source media="(max-width: 1024px)" srcSet="/beneficios/contacto-mobile.jpeg" />
        <img
          src="/beneficios/contacto.jpeg"
          alt=""
          className="w-full h-full object-cover object-center"
        />
      </picture>
      {/* Dark overlay for readability */}
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(3, 13, 7, 0.55) 0%, rgba(3, 13, 7, 0.28) 50%, rgba(3, 13, 7, 0.12) 100%)',
        }}
      />

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-start">
          {/* Left: Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-2 lg:sticky lg:top-24"
          >
            <p
              className="text-sm font-medium tracking-widest uppercase mb-4"
              style={{ color: '#00FF80' }}
            >
              {t('contacto.kicker')}
            </p>
            <h2
              className="text-4xl sm:text-5xl font-bold mb-6"
              style={{ color: '#00FF80' }}
            >
              {t('contacto.title')}
            </h2>
            <p
              className="text-lg sm:text-xl mb-10 leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.78)' }}
            >
              {t('contacto.subtitle')}
            </p>

            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl"
                  style={{
                    backgroundColor: 'rgba(0, 255, 128, 0.12)',
                    color: '#00FF80',
                  }}
                >
                  ✉
                </div>
                <div>
                  <h4
                    className="font-semibold mb-1"
                    style={{ color: '#FFFFFF' }}
                  >
                    {t('contacto.info.email')}
                  </h4>
                  <a
                    href="mailto:contacto@collectaproduce.com"
                    className="hover:opacity-70 transition-opacity"
                    style={{ color: 'rgba(255,255,255,0.78)' }}
                  >
                    contacto@collectaproduce.com
                  </a>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl"
                  style={{
                    backgroundColor: 'rgba(0, 255, 128, 0.12)',
                    color: '#00FF80',
                  }}
                >
                  ◉
                </div>
                <div>
                  <h4
                    className="font-semibold mb-1"
                    style={{ color: '#FFFFFF' }}
                  >
                    {t('contacto.info.location')}
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.78)' }}>{t('contacto.info.location.value')}</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl"
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    color: '#3B82F6',
                  }}
                >
                  ◈
                </div>
                <div>
                  <h4
                    className="font-semibold mb-1"
                    style={{ color: '#FFFFFF' }}
                  >
                    {t('contacto.info.platform')}
                  </h4>
                  <a
                    href="/plataforma"
                    className="hover:opacity-70 transition-opacity"
                    style={{ color: 'rgba(255,255,255,0.78)' }}
                  >
                    collectaproduce.com/plataforma
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-3 rounded-2xl border"
            style={{
              background: '#FFFFFF',
              borderColor: 'rgba(0, 0, 0, 0.08)',
            }}
          >
            {/* Tabs Selector */}
            <div
              className="flex justify-center gap-4 p-4 pt-8 sm:pt-10 border-b"
              style={{ borderColor: 'rgba(0, 0, 0, 0.06)' }}
            >
              <button
                onClick={() => setActiveForm('cliente')}
                className="flex-1 max-w-xs py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 relative"
                style={{
                  backgroundColor:
                    activeForm === 'cliente' ? '#00FF80' : 'transparent',
                  color: activeForm === 'cliente' ? '#0a1a0d' : '#4A4A4A',
                }}
              >
                {t('contacto.tab.cliente')}
                <span
                  className="block text-[9px] font-normal mt-0.5 opacity-90"
                  style={{
                    color:
                      activeForm === 'cliente'
                        ? 'rgba(10, 26, 13, 0.75)'
                        : '#8B7D6B',
                  }}
                >
                  {t('contacto.tab.cliente.sub')}
                </span>
              </button>
              <button
                onClick={() => setActiveForm('productor')}
                className="flex-1 max-w-xs py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 relative"
                style={{
                  backgroundColor:
                    activeForm === 'productor' ? '#00FF80' : 'transparent',
                  color: activeForm === 'productor' ? '#0a1a0d' : '#4A4A4A',
                }}
              >
                {t('contacto.tab.productor')}
                <span
                  className="block text-[9px] font-normal mt-0.5 opacity-90"
                  style={{
                    color:
                      activeForm === 'productor'
                        ? 'rgba(10, 26, 13, 0.75)'
                        : '#8B7D6B',
                  }}
                >
                  {t('contacto.tab.productor.sub')}
                </span>
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6 sm:p-8 lg:p-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeForm}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeForm === 'cliente' ? (
                    <FormCliente />
                  ) : (
                    <FormProductor />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
