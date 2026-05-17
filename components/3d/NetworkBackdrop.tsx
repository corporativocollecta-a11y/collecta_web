'use client';

/**
 * NetworkBackdrop — Réplica fiel del SVG del "Collecta Premium Mockup V2".
 *
 * - 4 hubs: México (origen) → Collecta (núcleo) → EE.UU. y Canadá (mercados).
 * - 3 rutas curvas (Bézier) con stroke-dasharray animado.
 * - Puntos luminosos que viajan a lo largo de cada ruta.
 * - Concentric circles pulsando en cada hub.
 * - Sin recuadros laterales (agricultores / trazabilidad / asset light / USD).
 */

import type { CSSProperties } from 'react';

interface NetworkBackdropProps {
  className?: string;
  style?: CSSProperties;
  /** Ignorado — mantenido por compatibilidad con la API previa. */
  chips?: unknown[];
  /** Ignorado — mantenido por compatibilidad con la API previa. */
  hubs?: unknown[];
  /** Ignorado — mantenido por compatibilidad con la API previa. */
  accent?: string;
  /** Ignorado — mantenido por compatibilidad con la API previa. */
  pointCount?: number;
  /** Ignorado — mantenido por compatibilidad con la API previa. */
  linkDistance?: number;
}

export default function NetworkBackdrop({ className, style }: NetworkBackdropProps) {
  return (
    <div className={className} style={style}>
      {/* Versión ampliada (~22%) del mockup: viewBox 300×390. Floating animation.
          Responsive: w-full hasta max-w-[330px], aspect ratio preservado por el viewBox. */}
      <svg
        viewBox="0 0 300 390"
        className="block w-full max-w-[330px] h-auto mx-auto"
        style={{ animation: 'floatY 5s ease-in-out infinite' }}
        aria-hidden
      >
        <defs>
          {/* Patrón de cuadrícula sutil de fondo */}
          <pattern id="cgr" width="18" height="18" patternUnits="userSpaceOnUse">
            <path d="M18 0L0 0 0 18" fill="none" stroke="rgba(0,255,128,.045)" strokeWidth=".5" />
          </pattern>
        </defs>

        {/* Fondo con cuadrícula */}
        <rect width="300" height="390" fill="url(#cgr)" />

        {/* Círculos concéntricos guía alrededor del núcleo Collecta */}
        <circle cx="150" cy="200" r="95" fill="none" stroke="rgba(0,255,128,.05)" strokeWidth=".5" />
        <circle cx="150" cy="200" r="68" fill="none" stroke="rgba(0,255,128,.07)" strokeWidth=".5" />

        {/* Rutas curvas — núcleo de la visualización */}
        <path
          id="p1"
          d="M150 320 Q144 258 150 200"
          stroke="#00FF80"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="5 3"
          opacity=".55"
        >
          <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1.9s" repeatCount="indefinite" />
        </path>
        <path
          id="p2"
          d="M150 200 Q90 152 72 104"
          stroke="#00FF80"
          strokeWidth="1.1"
          fill="none"
          strokeDasharray="5 3"
          opacity=".42"
        >
          <animate attributeName="stroke-dashoffset" from="100" to="0" dur="2.4s" repeatCount="indefinite" />
        </path>
        <path
          id="p3"
          d="M150 200 Q210 152 228 104"
          stroke="#00FF80"
          strokeWidth="1.1"
          fill="none"
          strokeDasharray="5 3"
          opacity=".42"
        >
          <animate attributeName="stroke-dashoffset" from="100" to="0" dur="2.9s" repeatCount="indefinite" />
        </path>

        {/* Puntos luminosos que viajan por las rutas */}
        <circle r="3.5" fill="#00FF80" opacity=".9">
          <animateMotion dur="1.9s" repeatCount="indefinite">
            <mpath href="#p1" />
          </animateMotion>
        </circle>
        <circle r="2" fill="#00FF80" opacity=".5">
          <animateMotion dur="1.9s" repeatCount="indefinite" begin="0.95s">
            <mpath href="#p1" />
          </animateMotion>
        </circle>
        <circle r="2.5" fill="#00FF80" opacity=".8">
          <animateMotion dur="2.4s" repeatCount="indefinite" begin=".4s">
            <mpath href="#p2" />
          </animateMotion>
        </circle>
        <circle r="2.5" fill="#00FF80" opacity=".8">
          <animateMotion dur="2.9s" repeatCount="indefinite" begin=".9s">
            <mpath href="#p3" />
          </animateMotion>
        </circle>

        {/* MÉXICO — origen estratégico */}
        <circle cx="150" cy="320" r="42" fill="rgba(0,255,128,.05)" stroke="rgba(0,255,128,.12)" strokeWidth=".5" />
        <circle cx="150" cy="320" r="27" fill="rgba(0,255,128,.09)" stroke="rgba(0,255,128,.24)" strokeWidth=".8">
          <animate attributeName="r" values="27;29;27" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx="150" cy="320" r="10" fill="rgba(0,255,128,.4)" stroke="#00FF80" strokeWidth="1.5" />
        <circle cx="150" cy="320" r="4.5" fill="#00FF80" />
        <text x="150" y="360" textAnchor="middle" fill="#00FF80" fontSize="10" letterSpacing="2" fontWeight="600">
          MÉXICO
        </text>
        <text x="150" y="374" textAnchor="middle" fill="rgba(236,248,237,.55)" fontSize="10" letterSpacing="1">
          ORIGEN ESTRATÉGICO
        </text>

        {/* COLLECTA — núcleo (azul eléctrico para destacarlo del resto) */}
        <g>
          <circle
            cx="150"
            cy="200"
            r="50"
            fill="none"
            stroke="rgba(59,130,246,.18)"
            strokeWidth=".8"
            strokeDasharray="6 4"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 150 200"
              to="360 150 200"
              dur="18s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
        <circle cx="150" cy="200" r="36" fill="rgba(59,130,246,.10)" stroke="rgba(59,130,246,.26)" strokeWidth=".8" />
        <circle cx="150" cy="200" r="24" fill="rgba(59,130,246,.14)" stroke="rgba(59,130,246,.45)" strokeWidth="1">
          <animate attributeName="r" values="24;26;24" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="150" cy="200" r="9" fill="rgba(59,130,246,.55)" stroke="#3B82F6" strokeWidth="1.5" />
        <circle cx="150" cy="200" r="3.5" fill="#3B82F6" />
        <text x="150" y="240" textAnchor="middle" fill="#3B82F6" fontSize="9.5" letterSpacing="2.5" fontWeight="600">
          COLLECTA
        </text>
        <text x="150" y="253" textAnchor="middle" fill="rgba(236,248,237,.55)" fontSize="10" letterSpacing="1">
          ECOSISTEMA · COS
        </text>

        {/* EE.UU. — mercado */}
        <circle cx="72" cy="104" r="32" fill="rgba(0,255,128,.05)" stroke="rgba(0,255,128,.18)" strokeWidth=".5" />
        <circle cx="72" cy="104" r="20" fill="rgba(0,255,128,.09)" stroke="rgba(0,255,128,.3)" strokeWidth=".8" />
        <circle cx="72" cy="104" r="5.5" fill="#00FF80" opacity=".85" />
        <text x="72" y="138" textAnchor="middle" fill="rgba(236,248,237,.85)" fontSize="9.5" letterSpacing="1.5" fontWeight="500">
          EE.UU.
        </text>

        {/* Canadá — mercado (verde, como México y EE.UU.) */}
        <circle cx="228" cy="104" r="30" fill="rgba(0,255,128,.05)" stroke="rgba(0,255,128,.18)" strokeWidth=".5" />
        <circle cx="228" cy="104" r="18" fill="rgba(0,255,128,.09)" stroke="rgba(0,255,128,.3)" strokeWidth=".8" />
        <circle cx="228" cy="104" r="5" fill="#00FF80" opacity=".85" />
        <text x="228" y="136" textAnchor="middle" fill="rgba(236,248,237,.85)" fontSize="9.5" letterSpacing="1.5" fontWeight="500">
          CANADÁ
        </text>
      </svg>
    </div>
  );
}
