'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

const features = [
  {
    color: '#3B82F6', // azul
    title: 'Programación de entregas',
    description: 'Planeación financiera y estratégica con visibilidad total.',
  },
  {
    color: '#14B8A6', // teal (sustituye al ámbar)
    title: 'Comunicación en tiempo real',
    description: 'Acceso inmediato a datos, reportes y estado de pedidos.',
  },
  {
    color: '#4ADE80', // verde eléctrico
    title: 'Control de riesgos',
    description: 'Documentación completa, certificaciones y trazabilidad auditable.',
  },
  {
    color: '#F59E0B', // ámbar (acento humano/campo)
    title: 'Continuidad de abasto',
    description: 'Diversificación geográfica y agronómica para minimizar interrupciones.',
  },
];

export function Clientes() {
  return (
    <section id="clientes" className="relative pt-4 pb-28 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl relative z-10">
        {/* Features in two columns */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20"
          style={{ transform: 'translateY(-40px)' }}
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
              Por qué los clientes nos eligen
            </h3>
            <p
              className="text-lg mb-8 leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.78)' }}
            >
              No somos un broker. No somos un intermediario. Somos un operador integrado que asume
              la responsabilidad completa de la cadena, desde el primer surco hasta la entrega final.
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
              className="w-full max-w-[800px] h-auto select-none"
              draggable={false}
              style={{
                transform: 'scale(1.15) translateX(48px)',
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
              style={{ color: '#4ADE80' }}
            >
              Accede a tu Dashboard
            </h3>
            <p
              className="text-lg mb-8 max-w-2xl mx-auto"
              style={{ color: 'rgba(255,255,255,0.82)' }}
            >
              Como cliente Collecta, tienes acceso a la plataforma con visibilidad completa de tus pedidos,
              trazabilidad en vivo y comunicación directa con el equipo operativo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://app.collectagroup.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-4 font-semibold rounded-lg transition-colors duration-300"
                style={{ backgroundColor: '#4ADE80', color: '#0a1a0d' }}
              >
                Ingresar a la plataforma →
              </a>
              <a
                href="#contacto"
                className="inline-block px-8 py-4 border-2 font-medium rounded-lg transition-all duration-300"
                style={{ borderColor: 'rgba(255,255,255,0.45)', color: '#FFFFFF' }}
              >
                Hablemos de tu cadena
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
