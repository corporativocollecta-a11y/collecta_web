'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CollectaBox } from '@/components/sections/CollectaBox';

const features = [
  {
    icon: '◐',
    title: 'Programación de entregas',
    description: 'Planeación financiera y estratégica con visibilidad total.',
  },
  {
    icon: '◑',
    title: 'Comunicación en tiempo real',
    description: 'Acceso inmediato a datos, reportes y estado de pedidos.',
  },
  {
    icon: '◒',
    title: 'Control de riesgos',
    description: 'Documentación completa, certificaciones y trazabilidad auditable.',
  },
  {
    icon: '◓',
    title: 'Continuidad de abasto',
    description: 'Diversificación geográfica y agronómica para minimizar interrupciones.',
  },
];

export default function PreviewCajaPage() {
  return (
    <main className="min-h-screen">
      {/* Banner de "preview" */}
      <div
        className="w-full px-6 py-4 text-center"
        style={{
          background: 'linear-gradient(90deg, #F59E0B 0%, #F59E0B 100%)',
          color: 'white',
        }}
      >
        <p className="font-bold text-sm tracking-wide">
          🔍 PÁGINA DE PREVIEW · No afecta la página real
        </p>
        <p className="text-xs opacity-90 mt-0.5">
          La página principal sigue intacta en{' '}
          <a href="/" className="underline">/</a>
        </p>
      </div>

      {/* ============================================================
           VISTA 1: La caja sola sobre fondo pastel (estilo Equifruit)
         ============================================================ */}
      <section
        className="w-full py-20 px-4"
        style={{
          background: 'linear-gradient(135deg, #EDE0EE 0%, #E8DCEB 100%)',
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p
              className="text-xs font-bold tracking-widest uppercase mb-3"
              style={{ color: '#6A4A8A' }}
            >
              Vista 1 · Aislada (referencia Equifruit)
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold mb-3"
              style={{ color: '#2A2A2A' }}
            >
              La caja Collecta
            </h2>
            <p className="text-sm" style={{ color: '#5A5A5A' }}>
              Renderizado 3D con CSS, 3 caras visibles, animación suave continua
            </p>
          </div>
          <CollectaBox />
        </div>
      </section>

      {/* ============================================================
           VISTA 2: Integrada en el layout real de Clientes.tsx
         ============================================================ */}
      <section
        id="clientes-preview"
        className="relative py-24 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-light/10 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-light/10 rounded-full blur-3xl translate-y-1/2" />

        <div className="mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-10">
            <p
              className="text-xs font-bold tracking-widest uppercase mb-3"
              style={{ color: '#F59E0B' }}
            >
              Vista 2 · Integrada en la sección actual
            </p>
            <p className="text-sm" style={{ color: '#5A5A5A' }}>
              Cómo se vería reemplazando el QR/marco actual
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="font-sans text-3xl sm:text-4xl font-bold text-primary-dark mb-6">
                Por qué los clientes nos eligen
              </h3>
              <p className="text-lg text-primary mb-8 leading-relaxed">
                No somos un broker. No somos un intermediario. Somos un operador integrado
                que asume la responsabilidad completa de la cadena, desde el primer surco
                hasta la entrega final.
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
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-secondary-light/30 flex items-center justify-center text-2xl text-secondary-dark">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary-dark mb-1">{feature.title}</h4>
                      <p className="text-primary">{feature.description}</p>
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
              className="relative flex flex-col items-center"
            >
              <CollectaBox />
              <div className="text-center mt-6 max-w-sm">
                <p
                  className="text-base sm:text-lg font-bold leading-tight"
                  style={{ color: '#2A2A2A' }}
                >
                  Trazabilidad <span style={{ color: '#F59E0B' }}>al alcance</span>
                </p>
                <p
                  className="text-[12px] sm:text-sm italic leading-snug mt-1"
                  style={{ color: '#6A6A6A' }}
                >
                  Cada caja Collecta lleva un QR para consultar la trazabilidad
                  completa del producto.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================================
           PIE — link de regreso
         ============================================================ */}
      <footer className="py-12 text-center bg-neutral-50">
        <a
          href="/"
          className="inline-block px-6 py-3 rounded-lg font-medium"
          style={{ background: '#F59E0B', color: 'white' }}
        >
          ← Volver a la página principal
        </a>
      </footer>
    </main>
  );
}
