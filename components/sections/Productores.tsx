'use client';

import React from 'react';
import { motion } from 'framer-motion';

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

const producerBenefits = [
  {
    title: 'Apoyo para producir',
    shortTitle: 'Apoyo para producir',
    description:
      'Brindamos recursos al agricultor para fortalecer y aumentar su producción en campo.',
    image: '/beneficios/socio-bg.jpeg',
  },
  {
    title: 'Acompañamiento e integración de tecnología en campo',
    shortTitle: 'Tecnología en campo',
    description:
      'Respaldamos el trabajo en campo con seguimiento y herramientas para reducir fallas durante la producción.',
    image: '/beneficios/trazabilidad.jpeg',
  },
  {
    title: 'Venta de la producción en mercados de alto valor',
    shortTitle: 'Mercados de alto valor',
    description:
      'Colocamos la producción en mercados de exportación para cuidar el valor de cada cosecha.',
    image: '/beneficios/visibilidad.jpeg',
  },
];

// Each benefit gets its own accent colour for the number + bottom border so
// the five cards read as a series of distinct milestones.
const partnerBenefits = [
  {
    title: 'Insumos sin deuda',
    description:
      'Acceso continuo a insumos agrícolas sin cargos financieros ni endeudamiento.',
    accent: '#00FF80', // electric green
  },
  {
    title: 'Crecimiento sostenido',
    description:
      'Aumento progresivo de superficie de siembra ciclo tras ciclo.',
    accent: '#14B8A6', // teal (sustituye al ámbar para alinear con la paleta verde)
  },
  {
    title: 'Mercados competitivos',
    description:
      'Tu producción accede a canales de alto valor y clientes exigentes.',
    accent: '#EF4444', // red
  },
  {
    title: 'Pagos transparentes',
    description:
      'Liquidaciones claras, oportunas y verificables en cada cosecha.',
    accent: '#3B82F6', // blue
  },
  {
    title: 'Operación integrada',
    description:
      'Procesos productivos y financieros bajo una sola gestión ordenada.',
    accent: '#14B8A6', // teal
  },
];

export function Productores() {
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
            Para Pequeños y Medianos Productores
          </p>
          <h2
            className="font-sans text-4xl sm:text-5xl font-bold mb-6"
            style={{ color: '#FFFFFF' }}
          >
            Crecer sin endeudarse
          </h2>
          <p
            className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.78)' }}
          >
            En Collecta buscamos trabajar con agricultores para construir una relación seria,
            clara y de largo plazo. Nos interesa sumar productores que quieran fortalecer su trabajo
            en campo y ampliar su capacidad de crecimiento.
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
            Beneficios para el productor
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
                className="group h-[480px]"
                style={{ perspective: '1200px' }}
              >
                <div
                  className="relative h-full w-full transition-transform duration-700 ease-out group-hover:[transform:rotateY(180deg)] focus-within:[transform:rotateY(180deg)]"
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
              Lo que ganas siendo socio de Collecta
            </h3>
            <p
              className="max-w-2xl mx-auto"
              style={{ color: 'rgba(255,255,255,0.78)' }}
            >
              Beneficios concretos que transforman la operación y la economía de tu tierra.
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
