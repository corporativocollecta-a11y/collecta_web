'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ODSCard } from '@/components/ui/ODSCard';

const odsAlignment = [
  { number: '2', name: 'Hambre cero' },
  { number: '8', name: 'Trabajo decente' },
  { number: '12', name: 'Producción responsable' },
  { number: '13', name: 'Acción por el clima' },
  { number: '15', name: 'Vida de ecosistemas' },
  { number: '17', name: 'Alianzas' },
];

// 5 acciones que se distribuyen en una rueda radial (desktop) o pila vertical (móvil).
const actions = [
  {
    title: 'Invertimos en el desarrollo productivo del campo',
    description:
      'Esto fortalece a productores con alto potencial que aún operan con recursos insuficientes para escalar su producción y mejorar sus condiciones de vida.',
  },
  {
    title: 'Llevamos tecnología de precisión con propósito',
    description:
      'Cerramos la brecha tecnológica que limita la capacidad del productor para trabajar con mejores herramientas, tomar mejores decisiones y fortalecer su producción.',
  },
  {
    title: 'Reducimos la huella ambiental',
    description:
      'Reducimos el desperdicio de alimentos, promovemos un uso más preciso del agua y una reducción del uso innecesario de agroquímicos.',
  },
  {
    title: 'Acercamos al productor a prácticas más sostenibles',
    description:
      'Ayudamos a reducir el impacto ambiental de la producción y a construir una base agrícola más sostenible a largo plazo.',
  },
  {
    title: 'Ordenamos una cadena históricamente fragmentada',
    description:
      'Permitimos una cadena trazable y articulada, con mayor valor para la producción y mejores condiciones para llevar alimentos de alta calidad al mercado.',
  },
];

function ActionsWheel() {
  // Tamaño del contenedor cuadrado.
  const wheelSize = 1100;
  // Radio donde se posicionan los nodos (px) — coincide con el círculo exterior.
  const radius = 420;
  // Diámetro del círculo interno (donde vive "Nuestro modelo").
  const innerDiameter = 200;

  return (
    <>
      {/* Desktop / lg+: rueda radial con 5 nodos a 72° */}
      <div
        className="hidden lg:block relative mx-auto"
        style={{ width: wheelSize, height: wheelSize, maxWidth: '100%' }}
      >
        {/* Anillo exterior — donde se sientan los nodos */}
        <div
          aria-hidden
          className="absolute rounded-full pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            width: radius * 2,
            height: radius * 2,
            transform: 'translate(-50%, -50%)',
            border: '1px dashed rgba(74, 222, 128, 0.22)',
          }}
        />

        {/* Anillo medio giratorio con marcadores — sentido horario */}
        <motion.div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            width: (radius - 60) * 2,
            height: (radius - 60) * 2,
            x: '-50%',
            y: '-50%',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <circle
              cx="50"
              cy="50"
              r="49"
              fill="none"
              stroke="rgba(74, 222, 128, 0.30)"
              strokeWidth="0.25"
              strokeDasharray="2 3"
            />
            {/* 3 marcadores visibles para ver el giro */}
            {[0, 120, 240].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const cx = 50 + Math.cos(rad) * 49;
              const cy = 50 + Math.sin(rad) * 49;
              return (
                <circle
                  key={angle}
                  cx={cx}
                  cy={cy}
                  r="0.9"
                  fill="#4ADE80"
                  opacity="0.85"
                />
              );
            })}
          </svg>
        </motion.div>

        {/* Anillo interior, sentido contrario, con un solo marcador */}
        <motion.div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            width: (radius - 120) * 2,
            height: (radius - 120) * 2,
            x: '-50%',
            y: '-50%',
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 45, ease: 'linear', repeat: Infinity }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <circle
              cx="50"
              cy="50"
              r="49"
              fill="none"
              stroke="rgba(74, 222, 128, 0.22)"
              strokeWidth="0.2"
              strokeDasharray="1 2"
            />
            {/* 2 marcadores en lados opuestos */}
            {[45, 225].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const cx = 50 + Math.cos(rad) * 49;
              const cy = 50 + Math.sin(rad) * 49;
              return (
                <circle
                  key={angle}
                  cx={cx}
                  cy={cy}
                  r="0.7"
                  fill="#4ADE80"
                  opacity="0.65"
                />
              );
            })}
          </svg>
        </motion.div>

        {/* SVG de líneas radiales del centro a cada nodo (la "estrella") */}
        <svg
          aria-hidden
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${wheelSize} ${wheelSize}`}
        >
          {actions.map((_, i) => {
            const angle = -90 + i * 72;
            const rad = (angle * Math.PI) / 180;
            const cx = wheelSize / 2;
            const cy = wheelSize / 2;
            // Línea va desde el borde del círculo interno hasta justo antes del numbered circle.
            const innerR = innerDiameter / 2;
            const outerR = radius - 30;
            const x1 = cx + Math.cos(rad) * innerR;
            const y1 = cy + Math.sin(rad) * innerR;
            const x2 = cx + Math.cos(rad) * outerR;
            const y2 = cy + Math.sin(rad) * outerR;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(74, 222, 128, 0.22)"
                strokeWidth="1"
                strokeDasharray="3 4"
              />
            );
          })}
        </svg>

        {/* Núcleo central — círculo interno donde vive "Nuestro modelo".
            Wrapper externo maneja el posicionamiento (transform no lo toca Framer Motion);
            motion.div interno solo anima scale/opacity. */}
        <div
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: innerDiameter,
            height: innerDiameter,
          }}
        >
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="w-full h-full flex flex-col items-center justify-center text-center rounded-full"
          style={{
            background:
              'radial-gradient(circle at center, rgba(74, 222, 128, 0.20) 0%, rgba(74, 222, 128, 0.05) 60%, transparent 100%)',
            boxShadow: 'inset 0 0 0 1.5px rgba(74, 222, 128, 0.45)',
          }}
        >
          <p
            className="text-sm uppercase tracking-[0.28em] font-semibold mb-2"
            style={{ color: '#4ADE80' }}
          >
            Nuestro modelo
          </p>
          <p className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
            5 acciones
          </p>
        </motion.div>
        </div>

        {/* 5 nodos en círculo */}
        {actions.map((item, i) => {
          const angle = -90 + i * 72;
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          // Wrapper de posicionamiento — su transform NO lo toca Framer Motion.
          // Anclamos el CENTRO del círculo numerado al punto radial:
          //   -50% horizontal = centrado horizontal del card respecto al punto
          //   -28px vertical  = sube el card 28px (radio del círculo 56/2) para
          //                      que el centro del círculo coincida con la circunferencia.
          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -28px)',
                width: 260,
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.12 }}
                className="flex flex-col items-center"
                style={{
                  textAlign: 'center',
                  /* Origen de la animación de escala: el centro del círculo
                     numerado (28px desde el top, 50% horizontal del card). */
                  transformOrigin: '50% 28px',
                }}
              >
                <motion.div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg mb-4 cursor-pointer"
                  style={{
                    backgroundColor: 'rgba(3, 13, 7, 0.85)',
                    color: '#4ADE80',
                    boxShadow:
                      'inset 0 0 0 1.5px rgba(74, 222, 128, 0.55), 0 0 18px rgba(74, 222, 128, 0.25)',
                  }}
                  whileHover={{
                    scale: 1.15,
                    boxShadow:
                      'inset 0 0 0 2px rgba(74, 222, 128, 0.95), 0 0 38px rgba(74, 222, 128, 0.65), 0 0 16px rgba(74, 222, 128, 0.45)',
                  }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  {i + 1}
                </motion.div>
                <h4
                  className="font-bold text-base sm:text-lg mb-2 leading-tight w-full"
                  style={{ color: '#FFFFFF', textAlign: 'center' }}
                >
                  {item.title}
                </h4>
                <p
                  className="text-sm leading-relaxed w-full"
                  style={{ color: 'rgba(255,255,255,0.78)', textAlign: 'center' }}
                >
                  {item.description}
                </p>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Móvil / tablet: pila vertical */}
      <div className="lg:hidden space-y-6">
        {actions.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="flex gap-4 items-start"
          >
            <div
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
              style={{
                backgroundColor: 'rgba(74, 222, 128, 0.12)',
                color: '#4ADE80',
                boxShadow: 'inset 0 0 0 1.5px rgba(74, 222, 128, 0.4)',
              }}
            >
              {i + 1}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-base mb-1" style={{ color: '#FFFFFF' }}>
                {item.title}
              </h4>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.78)' }}
              >
                {item.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}

export function Impacto() {
  return (
    <section
      id="impacto"
      className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #FAF8F5 0%, #F5F2ED 50%, #E8DFD3 100%)',
        color: '#FFFFFF',
      }}
    >
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
            style={{ color: '#4ADE80' }}
          >
            Impacto Medible y Escalable
          </p>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-6"
            style={{ color: '#FFFFFF' }}
          >
            Transformación con propósito
          </h2>
          <p
            className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.78)' }}
          >
            No medimos solo producción. Medimos el cambio sistémico que generamos en la cadena agroalimentaria,
            la economía rural y la sostenibilidad del campo mexicano.
          </p>
        </motion.div>

        {/* "Por qué ahora" - Context section. Fondo navy sólido con patrón
            isométrico de cubos en SVG inline. */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden mb-20 rounded-2xl p-12 border max-w-6xl mx-auto"
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
                id="isoCubes"
                width="56"
                height="97"
                patternUnits="userSpaceOnUse"
                patternTransform="scale(1.1)"
              >
                {/* Cara superior del cubo */}
                <polygon
                  points="28,0 56,16.17 28,32.33 0,16.17"
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="0.8"
                />
                {/* Cara izquierda */}
                <polygon
                  points="0,16.17 28,32.33 28,64.67 0,48.5"
                  fill="none"
                  stroke="rgba(255,255,255,0.10)"
                  strokeWidth="0.8"
                />
                {/* Cara derecha */}
                <polygon
                  points="56,16.17 28,32.33 28,64.67 56,48.5"
                  fill="none"
                  stroke="rgba(255,255,255,0.10)"
                  strokeWidth="0.8"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#isoCubes)" />
          </svg>
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <p
              className="text-sm font-medium tracking-widest uppercase mb-4"
              style={{ color: '#4ADE80' }}
            >
              Por qué ahora
            </p>
            <h3
              className="text-2xl sm:text-3xl font-bold mb-8"
              style={{ color: '#4ADE80' }}
            >
              México necesita transformación
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {[
                'Envejecimiento de agricultores responsables del campo',
                'Baja tasa de acceso a crédito y seguro agrícola',
                'Adopción tecnológica limitada en el sector',
                'Desperdicio alimentario y estrés hídrico crecientes',
                'Soberanía alimentaria como prioridad nacional',
                'Inversión creciente en transformación agroindustrial',
              ].map((reason, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div
                    className="flex-shrink-0 w-2 h-2 rounded-full mt-2"
                    style={{ backgroundColor: '#4ADE80' }}
                  />
                  <p
                    className="leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.82)' }}
                  >
                    {reason}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Impact Areas */}
        <div className="mb-20">
          <div style={{ transform: 'translateY(70px)' }}>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <p
                className="text-sm sm:text-base font-semibold tracking-[0.22em] uppercase mb-4"
                style={{ color: '#4ADE80' }}
              >
                Áreas de Impacto
              </p>
              <h3
                className="text-2xl sm:text-3xl font-bold"
                style={{ color: '#FFFFFF' }}
              >
                Donde generamos cambio real
              </h3>
            </motion.div>
          </div>

          {/* Contexto narrativo + 5 acciones */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="-mt-4 max-w-6xl mx-auto"
          >
            <ActionsWheel />
          </motion.div>
        </div>

        {/* ODS Alignment */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="rounded-2xl p-12 border"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderColor: 'rgba(74, 222, 128, 0.25)',
          }}
        >
          <div className="text-center mb-10">
            <p
              className="text-sm sm:text-base font-semibold tracking-[0.22em] uppercase mb-4"
              style={{ color: '#4ADE80' }}
            >
              Alineación Global
            </p>
            <h3
              className="text-2xl sm:text-3xl font-bold mb-3"
              style={{ color: '#FFFFFF' }}
            >
              Objetivos de Desarrollo Sostenible
            </h3>
            <p
              className="max-w-2xl mx-auto"
              style={{ color: 'rgba(255,255,255,0.78)' }}
            >
              Nuestro modelo contribuye directamente a 6 de los 17 ODS de Naciones Unidas.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
            {odsAlignment.map((ods, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <ODSCard number={Number(ods.number)} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
