'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ODSCard } from '@/components/ui/ODSCard';
import { useT } from '@/lib/i18n/LocaleProvider';

const odsAlignment = [
  { number: '2', name: 'Hambre cero' },
  { number: '8', name: 'Trabajo decente' },
  { number: '12', name: 'Producción responsable' },
  { number: '13', name: 'Acción por el clima' },
  { number: '15', name: 'Vida de ecosistemas' },
  { number: '17', name: 'Alianzas' },
];

// 5 actions metadata — translated inside the component via useT().
const ACTIONS_META = [
  { titleKey: 'impacto.action.1.title', descKey: 'impacto.action.1.description' },
  { titleKey: 'impacto.action.2.title', descKey: 'impacto.action.2.description' },
  { titleKey: 'impacto.action.3.title', descKey: 'impacto.action.3.description' },
  { titleKey: 'impacto.action.4.title', descKey: 'impacto.action.4.description' },
  { titleKey: 'impacto.action.5.title', descKey: 'impacto.action.5.description' },
] as const;

function ActionsWheel() {
  const t = useT();
  const actions = ACTIONS_META.map((a) => ({
    title: t(a.titleKey),
    description: t(a.descKey),
  }));
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
            border: '1px dashed rgba(0, 255, 128, 0.22)',
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
              stroke="rgba(0, 255, 128, 0.30)"
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
                  fill="#00FF80"
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
              stroke="rgba(0, 255, 128, 0.22)"
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
                  fill="#00FF80"
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
                stroke="rgba(0, 255, 128, 0.22)"
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
              'radial-gradient(circle at center, rgba(0, 255, 128, 0.20) 0%, rgba(0, 255, 128, 0.05) 60%, transparent 100%)',
            boxShadow: 'inset 0 0 0 1.5px rgba(0, 255, 128, 0.45)',
          }}
        >
          <p
            className="text-sm uppercase tracking-[0.28em] font-semibold mb-2"
            style={{ color: '#00FF80' }}
          >
            {t('impacto.wheel.modelo')}
          </p>
          <p className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {t('impacto.wheel.acciones')}
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
                    color: '#00FF80',
                    boxShadow:
                      'inset 0 0 0 1.5px rgba(0, 255, 128, 0.55), 0 0 18px rgba(0, 255, 128, 0.25)',
                  }}
                  whileHover={{
                    scale: 1.15,
                    boxShadow:
                      'inset 0 0 0 2px rgba(0, 255, 128, 0.95), 0 0 38px rgba(0, 255, 128, 0.65), 0 0 16px rgba(0, 255, 128, 0.45)',
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

      {/* Móvil / tablet: rueda compacta visual + pila vertical de detalles.
          Mantiene la robustez visual de la rueda radial sin sacrificar legibilidad. */}
      <div className="lg:hidden">
        {/* Rueda compacta — 320px diámetro con 5 nodos numerados alrededor de
            un núcleo central "NUESTRO MODELO · 5 acciones". Solo visual; el
            detalle de cada acción va en la pila vertical de abajo. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative mx-auto mb-12"
          style={{ width: 320, height: 320 }}
        >
          {/* Anillo exterior dasheado (donde se sientan los nodos) */}
          <div
            aria-hidden
            className="absolute rounded-full pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              width: 260,
              height: 260,
              transform: 'translate(-50%, -50%)',
              border: '1px dashed rgba(0, 255, 128, 0.22)',
            }}
          />

          {/* Anillo medio giratorio sutil */}
          <motion.div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              width: 200,
              height: 200,
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
                stroke="rgba(0, 255, 128, 0.30)"
                strokeWidth="0.4"
                strokeDasharray="2 3"
              />
              {[0, 120, 240].map((angle) => {
                const rad = (angle * Math.PI) / 180;
                const cx = 50 + Math.cos(rad) * 49;
                const cy = 50 + Math.sin(rad) * 49;
                return (
                  <circle key={angle} cx={cx} cy={cy} r="1.2" fill="#00FF80" opacity="0.85" />
                );
              })}
            </svg>
          </motion.div>

          {/* SVG líneas radiales del centro a cada nodo */}
          <svg
            aria-hidden
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 320 320"
          >
            {actions.map((_, i) => {
              const angle = -90 + i * 72;
              const rad = (angle * Math.PI) / 180;
              const cx = 160;
              const cy = 160;
              const innerR = 55;
              const outerR = 110;
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
                  stroke="rgba(0, 255, 128, 0.22)"
                  strokeWidth="1"
                  strokeDasharray="3 4"
                />
              );
            })}
          </svg>

          {/* Núcleo central */}
          <div
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 110,
              height: 110,
            }}
          >
            <div
              className="w-full h-full flex flex-col items-center justify-center text-center rounded-full"
              style={{
                background:
                  'radial-gradient(circle at center, rgba(0, 255, 128, 0.20) 0%, rgba(0, 255, 128, 0.05) 60%, transparent 100%)',
                boxShadow: 'inset 0 0 0 1.5px rgba(0, 255, 128, 0.45)',
              }}
            >
              <p
                className="text-[9px] uppercase tracking-[0.22em] font-semibold mb-1"
                style={{ color: '#00FF80' }}
              >
                {t('impacto.wheel.modelo')}
              </p>
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {t('impacto.wheel.acciones')}
              </p>
            </div>
          </div>

          {/* 5 nodos numerados a 130px del centro.
              IMPORTANTE: wrapper externo maneja posicionamiento porque Framer
              Motion sobrescribe el `transform` cuando anima scale. Sin el
              wrapper, el translate(-50%,-50%) se pierde y los nodos quedan
              anclados por la esquina superior-izquierda en vez del centro. */}
          {actions.map((_, i) => {
            const angle = -90 + i * 72;
            const rad = (angle * Math.PI) / 180;
            const x = Math.cos(rad) * 130;
            const y = Math.sin(rad) * 130;
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{
                    backgroundColor: 'rgba(3, 13, 7, 0.85)',
                    color: '#00FF80',
                    boxShadow:
                      'inset 0 0 0 1.5px rgba(0, 255, 128, 0.55), 0 0 12px rgba(0, 255, 128, 0.25)',
                  }}
                >
                  {i + 1}
                </motion.div>
              </div>
            );
          })}
        </motion.div>

        {/* Pila vertical de detalles */}
        <div className="space-y-6">
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
                  backgroundColor: 'rgba(0, 255, 128, 0.12)',
                  color: '#00FF80',
                  boxShadow: 'inset 0 0 0 1.5px rgba(0, 255, 128, 0.4)',
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
      </div>
    </>
  );
}

export function Impacto() {
  const t = useT();
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
            style={{ color: '#00FF80' }}
          >
            {t('impacto.kicker')}
          </p>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-6"
            style={{ color: '#FFFFFF' }}
          >
            {t('impacto.title')}
          </h2>
          <p
            className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.78)' }}
          >
            {t('impacto.subtitle')}
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
              style={{ color: '#00FF80' }}
            >
              {t('impacto.por_que.kicker')}
            </p>
            <h3
              className="text-2xl sm:text-3xl font-bold mb-8"
              style={{ color: '#00FF80' }}
            >
              {t('impacto.por_que.title')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {[
                t('impacto.por_que.r1'),
                t('impacto.por_que.r2'),
                t('impacto.por_que.r3'),
                t('impacto.por_que.r4'),
                t('impacto.por_que.r5'),
                t('impacto.por_que.r6'),
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
                    style={{ backgroundColor: '#00FF80' }}
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
          <div className="lg:translate-y-[70px]">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <p
                className="text-sm sm:text-base font-semibold tracking-[0.22em] uppercase mb-4"
                style={{ color: '#00FF80' }}
              >
                {t('impacto.areas.kicker')}
              </p>
              <h3
                className="text-2xl sm:text-3xl font-bold"
                style={{ color: '#FFFFFF' }}
              >
                {t('impacto.areas.title')}
              </h3>
            </motion.div>
          </div>

          {/* Contexto narrativo + 5 acciones */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:-mt-4 max-w-6xl mx-auto"
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
            borderColor: 'rgba(0, 255, 128, 0.25)',
          }}
        >
          <div className="text-center mb-10">
            <p
              className="text-sm sm:text-base font-semibold tracking-[0.22em] uppercase mb-4"
              style={{ color: '#00FF80' }}
            >
              {t('impacto.ods.kicker')}
            </p>
            <h3
              className="text-2xl sm:text-3xl font-bold mb-3"
              style={{ color: '#FFFFFF' }}
            >
              {t('impacto.ods.title')}
            </h3>
            <p
              className="max-w-2xl mx-auto"
              style={{ color: 'rgba(255,255,255,0.78)' }}
            >
              {t('impacto.ods.subtitle')}
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
