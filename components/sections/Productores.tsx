'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useT } from '@/lib/i18n/LocaleProvider';

// Icon: Apoyo para producir — cupped hand offering a growing sprout
const IconApoyo = (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Cupped hand */}
    <path d="M 22 64 Q 22 82, 42 82 L 58 82 Q 78 82, 78 64" />
    {/* Wrist hints */}
    <path d="M 30 82 L 30 90" strokeOpacity={0.45} />
    <path d="M 70 82 L 70 90" strokeOpacity={0.45} />

    {/* Sprout — breathing scale + tiny sway */}
    <motion.g
      style={{ transformOrigin: '50px 72px' }}
      animate={{ scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] }}
      transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Stem */}
      <path d="M 50 72 L 50 40" strokeWidth={2.8} />
      {/* Left leaf */}
      <path d="M 50 52 Q 38 50, 34 40 Q 46 42, 50 52 Z" />
      {/* Right leaf */}
      <path d="M 50 56 Q 62 54, 66 44 Q 54 46, 50 56 Z" />
      {/* Sprout tip */}
      <circle cx="50" cy="38" r="2.8" fill="currentColor" stroke="none" />
    </motion.g>
  </svg>
);

// Icon: Acompañamiento e integración de tecnología — magnifier over field, pulse signal
const IconAcompanamiento = (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Field horizon */}
    <line x1="14" y1="80" x2="86" y2="80" strokeOpacity={0.35} />
    {/* Side crops */}
    <path d="M 22 80 L 22 72 M 22 74 Q 26 72, 26 76" strokeOpacity={0.55} strokeWidth={2} />
    <path d="M 78 80 L 78 72 M 78 74 Q 74 72, 74 76" strokeOpacity={0.55} strokeWidth={2} />

    {/* Pulse rings — emanate outward from the magnifier */}
    <motion.circle
      cx="42" cy="42" r="20"
      strokeOpacity={0.45}
      strokeWidth={1.6}
      style={{ transformOrigin: '42px 42px' }}
      animate={{ scale: [1, 1.7], opacity: [0.55, 0] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }}
    />
    <motion.circle
      cx="42" cy="42" r="20"
      strokeOpacity={0.45}
      strokeWidth={1.6}
      style={{ transformOrigin: '42px 42px' }}
      animate={{ scale: [1, 1.7], opacity: [0.55, 0] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut', delay: 1.3 }}
    />

    {/* Magnifier — gentle bob */}
    <motion.g
      animate={{ y: [0, -1.8, 0, 1.8, 0] }}
      transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Lens */}
      <circle cx="42" cy="42" r="18" strokeWidth={2.6} />
      {/* Handle */}
      <line x1="55" y1="55" x2="72" y2="72" strokeWidth={3.2} />
      {/* Inner leaf — what we're inspecting */}
      <path d="M 42 40 L 42 50" strokeWidth={1.8} />
      <path d="M 42 44 Q 36 42, 34 37 Q 40 39, 42 44 Z" strokeWidth={1.8} />
      <path d="M 42 47 Q 48 45, 50 40 Q 44 42, 42 47 Z" strokeWidth={1.8} />
    </motion.g>
  </svg>
);

// Icon: Venta en mercados de alto valor — rising bars + arrow climbing
const IconMercados = (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Axis */}
    <line x1="18" y1="82" x2="86" y2="82" />
    <line x1="18" y1="82" x2="18" y2="22" />

    {/* Three rising bars — each grows on a loop with a staggered delay */}
    <motion.rect
      x="28" y="64" width="11" height="18" rx="1.2"
      fill="currentColor" stroke="none" opacity={0.7}
      style={{ transformOrigin: '33.5px 82px' }}
      animate={{ scaleY: [0.35, 1, 0.35] }}
      transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.rect
      x="46" y="50" width="11" height="32" rx="1.2"
      fill="currentColor" stroke="none" opacity={0.85}
      style={{ transformOrigin: '51.5px 82px' }}
      animate={{ scaleY: [0.35, 1, 0.35] }}
      transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
    />
    <motion.rect
      x="64" y="36" width="11" height="46" rx="1.2"
      fill="currentColor" stroke="none"
      style={{ transformOrigin: '69.5px 82px' }}
      animate={{ scaleY: [0.35, 1, 0.35] }}
      transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
    />

    {/* Rising arrow */}
    <motion.g
      animate={{ y: [1.5, -2.5, 1.5] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path d="M 22 60 L 80 22" strokeWidth={2.6} />
      <polyline points="66 19 80 22 77 36" strokeWidth={2.6} />
    </motion.g>
  </svg>
);

// Benefit metadata uses i18n keys; the component resolves them via useT().
const producerBenefitsMeta = [
  { titleKey: 'prod.beneficio.apoyo.title',   shortKey: 'prod.beneficio.apoyo.short',   descKey: 'prod.beneficio.apoyo.description',   image: '/beneficios/socio-bg.jpeg' },
  { titleKey: 'prod.beneficio.tec.title',     shortKey: 'prod.beneficio.tec.short',     descKey: 'prod.beneficio.tec.description',     image: '/beneficios/trazabilidad.jpeg' },
  { titleKey: 'prod.beneficio.mercado.title', shortKey: 'prod.beneficio.mercado.short', descKey: 'prod.beneficio.mercado.description', image: '/beneficios/visibilidad.jpeg' },
] as const;

// Each partner benefit gets its own accent colour for the number + bottom
// border so the five cards read as a series of distinct milestones.
const partnerBenefitsMeta = [
  { titleKey: 'prod.socio.insumos.title',      descKey: 'prod.socio.insumos.description',      accent: '#00FF80' },
  { titleKey: 'prod.socio.crecimiento.title',  descKey: 'prod.socio.crecimiento.description',  accent: '#14B8A6' },
  { titleKey: 'prod.socio.mercados.title',     descKey: 'prod.socio.mercados.description',     accent: '#EF4444' },
  { titleKey: 'prod.socio.pagos.title',        descKey: 'prod.socio.pagos.description',        accent: '#3B82F6' },
  { titleKey: 'prod.socio.operacion.title',    descKey: 'prod.socio.operacion.description',    accent: '#14B8A6' },
] as const;

export function Productores() {
  const t = useT();
  const producerBenefits = producerBenefitsMeta.map((b) => ({
    title: t(b.titleKey),
    shortTitle: t(b.shortKey),
    description: t(b.descKey),
    image: b.image,
  }));
  const partnerBenefits = partnerBenefitsMeta.map((b) => ({
    title: t(b.titleKey),
    description: t(b.descKey),
    accent: b.accent,
  }));
  return (
    <section id="productores" className="relative py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-neutral-light to-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 25px 25px, #8B7D6B 2%, transparent 0%)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p
            className="text-sm sm:text-base font-semibold tracking-[0.22em] uppercase mb-4"
            style={{ color: '#00FF80' }}
          >
            {t('prod.kicker')}
          </p>
          <h2
            className="font-sans text-4xl sm:text-5xl font-bold mb-6"
            style={{ color: '#FFFFFF' }}
          >
            {t('prod.title')}
          </h2>
          <p
            className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.78)' }}
          >
            {t('prod.subtitle')}
          </p>
        </motion.div>

        {/* Beneficios para el productor — 3 animated golden-circle benefits */}
        <div className="mb-20">
          <motion.h3
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-sans text-2xl sm:text-3xl font-bold text-center mb-14"
            style={{ color: '#FFFFFF' }}
          >
            {t('prod.beneficios.title')}
          </motion.h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {producerBenefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.7,
                  delay: 0.15 * i,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group md:h-[480px]"
                style={{ perspective: '1200px' }}
              >
                {/* Mobile view — stacked card: image at top, navy panel with
                    full title + description below. No flip (Safari/Chrome
                    mobile don't honor backface-visibility consistently). */}
                <div
                  className="md:hidden rounded-2xl overflow-hidden flex flex-col"
                  style={{
                    background: '#142657',
                    border: '1px solid rgba(255,255,255,0.18)',
                    boxShadow:
                      '0 18px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,255,128,0.10), 0 0 30px rgba(0,255,128,0.10)',
                  }}
                >
                  {/* Image hero — same artwork as the desktop front face */}
                  <div className="relative w-full aspect-[4/3] overflow-hidden">
                    <img
                      src={benefit.image}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* Soft fade at the bottom of the image to blend into navy */}
                    <div
                      className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(20, 38, 87, 0) 0%, #142657 100%)',
                      }}
                    />
                  </div>
                  {/* Text panel */}
                  <div className="p-7 pt-5 flex flex-col">
                    <p
                      className="text-3xl font-bold leading-none mb-4"
                      style={{ color: '#00FF80' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </p>
                    <h5 className="text-xl font-bold text-white mb-3 leading-tight">
                      {benefit.title}
                    </h5>
                    <p className="text-white/85 leading-relaxed text-sm">
                      {benefit.description}
                    </p>
                  </div>
                </div>

                {/* Desktop view — 3D flip card */}
                <div
                  className="hidden md:block relative h-full w-full transition-transform duration-700 ease-out group-hover:[transform:rotateY(180deg)] focus-within:[transform:rotateY(180deg)]"
                  style={{ transformStyle: 'preserve-3d' }}
                  tabIndex={0}
                >
                  {/* Front face — split design para las 3 tarjetas.
                      i===0: navy arriba + imagen abajo (diagonal hacia arriba-derecha).
                      i===1: imagen arriba + navy abajo (diagonal invertida).
                      i===2: igual que i===0 (navy arriba + imagen abajo). */}
                  {i === 0 || i === 1 || i === 2 ? (
                    <div
                      className="absolute inset-0 rounded-2xl overflow-hidden"
                      style={{
                        backfaceVisibility: 'hidden',
                        background: '#172E66',
                        border: '1px solid rgba(255,255,255,0.18)',
                        boxShadow:
                          '0 18px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(74,222,128,0.10), 0 0 30px rgba(74,222,128,0.10)',
                      }}
                    >
                      {/* Patrón isométrico de cubos en el área navy */}
                      <svg
                        aria-hidden
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <pattern
                            id={`isoCubesCard-${i}`}
                            width="56"
                            height="97"
                            patternUnits="userSpaceOnUse"
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
                        <rect width="100%" height="100%" fill={`url(#isoCubesCard-${i})`} />
                      </svg>

                      {i === 1 ? (
                        <>
                          {/* Card del medio: invertida (imagen arriba, navy abajo) con
                              el mismo tamaño de área navy (~25%) que las otras. */}
                          <div
                            className="absolute inset-0 overflow-hidden"
                            style={{
                              clipPath: 'polygon(0 0, 100% 0, 100% 62%, 0 85%)',
                            }}
                          >
                            <img
                              src={benefit.image}
                              alt=""
                              aria-hidden="true"
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          </div>
                          <div className="absolute left-0 right-0 bottom-0 z-10 px-7 pb-8">
                            <h5 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                              {benefit.shortTitle}
                            </h5>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Cards 1 y 3: navy + título arriba, imagen abajo */}
                          <div className="relative z-10 px-7 pt-10">
                            <h5 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                              {benefit.shortTitle}
                            </h5>
                          </div>
                          <div
                            className="absolute inset-0 overflow-hidden"
                            style={{
                              clipPath: 'polygon(0 38%, 100% 15%, 100% 100%, 0 100%)',
                            }}
                          >
                            <img
                              src={benefit.image}
                              alt=""
                              aria-hidden="true"
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div
                      className="absolute inset-0 rounded-2xl overflow-hidden"
                      style={{
                        backfaceVisibility: 'hidden',
                        border: '1px solid rgba(255,255,255,0.18)',
                        boxShadow:
                          '0 18px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(74,222,128,0.10), 0 0 30px rgba(74,222,128,0.10)',
                      }}
                    >
                      <img
                        src={benefit.image}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            'linear-gradient(180deg, rgba(15, 30, 55, 0) 0%, rgba(15, 30, 55, 0) 55%, rgba(30, 58, 95, 0.55) 80%, rgba(15, 30, 55, 0.92) 100%)',
                        }}
                      />
                      <div className="relative z-10 p-6 h-full flex flex-col justify-end text-center">
                        <h5
                          className="text-xl sm:text-2xl font-bold text-white leading-tight"
                          style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
                        >
                          {benefit.shortTitle}
                        </h5>
                      </div>
                    </div>
                  )}

                  {/* Back face — solid navy with full title + description */}
                  <div
                    className="absolute inset-0 rounded-2xl overflow-hidden p-7 flex flex-col justify-center text-center"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      background: '#142657',
                      border: '1px solid rgba(255,255,255,0.18)',
                      boxShadow:
                        '0 18px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,255,128,0.10), 0 0 30px rgba(0,255,128,0.10)',
                    }}
                  >
                    <p
                      className="text-3xl sm:text-4xl font-bold leading-none mb-5"
                      style={{ color: '#00FF80' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </p>
                    <h5 className="text-xl font-bold text-white mb-4 leading-tight">
                      {benefit.title}
                    </h5>
                    <p className="text-white/85 leading-relaxed text-sm sm:text-base">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Partner benefits — 5 image cards with frosted glass panel inside */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <h3
              className="font-sans text-2xl sm:text-3xl font-bold mb-4"
              style={{ color: '#FFFFFF' }}
            >
              {t('prod.socio.title')}
            </h3>
            <p
              className="max-w-2xl mx-auto"
              style={{ color: 'rgba(255,255,255,0.78)' }}
            >
              {t('prod.socio.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 lg:gap-4">
            {partnerBenefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.6,
                  delay: 0.1 * i,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -4 }}
                // Minimal milestone card: dark glass surface, coloured bottom
                // border, numbered eyebrow, bold title, soft description.
                className="relative rounded-xl p-7 lg:p-8 transition-shadow duration-300 hover:shadow-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(74, 222, 128, 0.25)',
                }}
              >
                {/* Step number eyebrow (01 02 03…) */}
                <span
                  aria-hidden="true"
                  className="block font-mono text-sm tracking-[0.32em] font-semibold mb-5"
                  style={{ color: '#00FF80' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h4
                  className="font-sans text-lg lg:text-xl font-bold leading-tight mb-4"
                  style={{ color: '#FFFFFF' }}
                >
                  {benefit.title}
                </h4>
                <p
                  className="text-base leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.65)' }}
                >
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
