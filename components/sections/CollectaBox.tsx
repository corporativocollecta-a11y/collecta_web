'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * CollectaBox — caja 3D estilo mockup fotográfico (referencia: Equifruit)
 * con el diseño de la caja de brócoli Collecta y una cara lateral con QR
 * de trazabilidad.
 *
 * 3 caras visibles: FRONT (long side, broccoli design), RIGHT (short side, QR),
 * TOP (Collecta branding). Renderizado con CSS 3D transforms.
 */

// Dimensiones de la caja (proporciones tipo caja exportadora de brócoli)
const W = 340; // ancho frente (lado largo)
const H = 140; // alto de la caja
const D = 210; // profundidad (lado corto)

const halfW = W / 2;
const halfH = H / 2;
const halfD = D / 2;

const BROCCOLI_GREEN = '#5BB04A';
const BROCCOLI_GREEN_DARK = '#3A7A2B';
const COLLECTA_BLUE = '#4FA0CC';
const COLLECTA_BLUE_DARK = '#3B8AB5';

/* ============================================================
   BROCCOLI ILUSTRACIÓN — SVG outlined (estilo lineart)
   ============================================================ */

function BroccoliIllustration({
  size = 90,
  color = BROCCOLI_GREEN,
}: {
  size?: number;
  color?: string;
}) {
  const sw = size / 28;
  return (
    <svg
      viewBox="0 0 100 110"
      width={size}
      height={size * 1.1}
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {/* Florets cluster (cabeza del brócoli) */}
      <circle cx={28} cy={40} r={14} />
      <circle cx={48} cy={28} r={16} />
      <circle cx={70} cy={40} r={14} />
      <circle cx={36} cy={52} r={11} />
      <circle cx={60} cy={52} r={11} />
      <circle cx={48} cy={57} r={9} />
      {/* Tallo trapezoidal */}
      <path d="M 36 60 Q 38 62 42 62 L 56 62 Q 60 62 62 60 L 60 94 Q 58 100 50 100 Q 42 100 40 94 Z" />
      {/* Líneas verticales del tallo */}
      <line x1={45} y1={70} x2={44} y2={90} />
      <line x1={51} y1={70} x2={52} y2={90} />
    </svg>
  );
}

/* ============================================================
   FRONT FACE — Lado largo con diseño broccoli
   ============================================================ */

function FrontFace() {
  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        background: '#FFFFFF',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
      }}
    >
      {/* Banda azul lateral izquierda */}
      <div
        className="absolute top-0 bottom-0 left-0"
        style={{
          width: 46,
          background: `linear-gradient(180deg, ${COLLECTA_BLUE} 0%, ${COLLECTA_BLUE_DARK} 100%)`,
        }}
      >
        {/* Icono broccoli pequeño en blanco (en la banda) */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
          <BroccoliIllustration size={26} color="#FFFFFF" />
          <span
            className="text-white mt-1 font-bold"
            style={{ fontSize: 7, letterSpacing: 1.5 }}
          >
            BROCCOLI
          </span>
        </div>
      </div>

      {/* Banda superior — pequeño logo Collecta + "Fresh produce" */}
      <div
        className="absolute top-0 right-0 flex items-center"
        style={{
          left: 46,
          height: 18,
          paddingLeft: 8,
          paddingRight: 8,
          background: 'rgba(248,250,251,0.7)',
          borderBottom: '1px solid rgba(0,0,0,0.04)',
        }}
      >
        <img
          src="/assets/logo-icon.png"
          alt=""
          style={{ width: 12, height: 12 }}
        />
        <span
          className="ml-1 font-bold"
          style={{ fontSize: 8, color: '#374151', letterSpacing: 1 }}
        >
          COLLECTA
        </span>
        <span
          className="ml-auto"
          style={{ fontSize: 7, color: '#374151', letterSpacing: 0.5 }}
        >
          Fresh produce{' '}
          <span style={{ color: BROCCOLI_GREEN_DARK, fontWeight: 700 }}>
            from Mexico
          </span>
        </span>
      </div>

      {/* Ilustración central + texto "Natural & Delicious BROCCOLI" */}
      <div
        className="absolute flex items-center"
        style={{
          top: 22,
          bottom: 14,
          left: 54,
          right: 8,
        }}
      >
        <div className="flex-shrink-0">
          <BroccoliIllustration size={80} />
        </div>
        <div className="ml-2 flex-1">
          <div
            className="italic"
            style={{ fontSize: 11, color: '#374151', lineHeight: 1 }}
          >
            Natural & Delicious
          </div>
          <div
            className="font-black"
            style={{
              fontSize: 30,
              color: BROCCOLI_GREEN_DARK,
              letterSpacing: -1,
              lineHeight: 1,
              marginTop: 2,
            }}
          >
            BROCCOLI
          </div>
        </div>
      </div>

      {/* Banda azul inferior delgada */}
      <div
        className="absolute bottom-0 right-0 flex items-center justify-center"
        style={{
          left: 46,
          height: 10,
          background: COLLECTA_BLUE,
        }}
      >
        <span
          className="text-white"
          style={{ fontSize: 6, letterSpacing: 1.5, opacity: 0.95 }}
        >
          PREMIUM FRESH PRODUCE · COLLECTA
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   RIGHT FACE — Lado corto con QR de trazabilidad
   ============================================================ */

function RightFace() {
  return (
    <div
      className="w-full h-full relative flex flex-col items-center justify-between"
      style={{
        background: '#FFFFFF',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
        padding: 10,
      }}
    >
      {/* Header con logo Collecta */}
      <div className="flex items-center">
        <img
          src="/assets/logo-icon.png"
          alt=""
          style={{ width: 14, height: 14 }}
        />
        <span
          className="ml-1.5 font-bold"
          style={{ fontSize: 9, color: '#374151', letterSpacing: 2 }}
        >
          COLLECTA
        </span>
      </div>

      {/* QR centrado */}
      <div
        className="flex items-center justify-center"
        style={{ width: '78%', aspectRatio: '1 / 1' }}
      >
        <img
          src="/assets/qr-trazabilidad.png"
          alt="QR Trazabilidad Collecta"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Footer con CTA */}
      <div className="text-center" style={{ marginBottom: 2 }}>
        <p
          className="font-bold"
          style={{ fontSize: 8.5, color: '#1A1A1A', letterSpacing: 1.8 }}
        >
          ESCANEA
        </p>
        <p
          className="italic"
          style={{ fontSize: 7, color: '#6A6A6A', lineHeight: 1.1, marginTop: 1 }}
        >
          para ver la trazabilidad
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   TOP FACE — Tapa con branding Collecta
   ============================================================ */

function TopFace() {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background:
          'linear-gradient(180deg, #F8F8F6 0%, #ECECEA 100%)',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
      }}
    >
      <img
        src="/assets/logo.png"
        alt="Collecta"
        style={{
          width: '60%',
          maxWidth: 220,
          opacity: 0.7,
        }}
      />
    </div>
  );
}

/* ============================================================
   COLLECTA BOX — Componente principal
   ============================================================ */

export function CollectaBox() {
  return (
    <div
      className="w-full flex items-center justify-center relative"
      style={{ minHeight: 460, perspective: 1500 }}
    >
      {/* Wrapper de motion (opacity + scale) — la rotación 3D va en inner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Inner — aquí la rotación 3D estática + animación suave continua */}
        <motion.div
          className="relative"
          style={{
            width: W,
            height: H,
            transformStyle: 'preserve-3d',
          }}
          animate={{
            rotateX: [-20, -22, -20],
            rotateY: [-30, -28, -30],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* FRONT face — lado largo con broccoli */}
          <div
            className="absolute inset-0"
            style={{
              transform: `translateZ(${halfD}px)`,
              backfaceVisibility: 'hidden',
            }}
          >
            <FrontFace />
          </div>

          {/* RIGHT face — lado corto con QR */}
          <div
            className="absolute"
            style={{
              width: D,
              height: H,
              left: halfW - halfD,
              top: 0,
              transform: `rotateY(90deg) translateZ(${halfW}px)`,
              backfaceVisibility: 'hidden',
            }}
          >
            <RightFace />
          </div>

          {/* TOP face — tapa */}
          <div
            className="absolute"
            style={{
              width: W,
              height: D,
              left: 0,
              top: halfH - halfD,
              transform: `rotateX(90deg) translateZ(${halfH}px)`,
              backfaceVisibility: 'hidden',
            }}
          >
            <TopFace />
          </div>

          {/* Sombra proyectada debajo de la caja */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              width: W * 1.15,
              height: 22,
              left: -W * 0.075,
              top: H + 60,
              background:
                'radial-gradient(ellipse, rgba(60,40,20,0.32) 0%, rgba(60,40,20,0.08) 55%, transparent 80%)',
              filter: 'blur(6px)',
              transform: 'rotateX(90deg)',
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
