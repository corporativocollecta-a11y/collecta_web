"use client";

import { useRef, useState } from "react";
import { useLang } from "@/components/lang-provider";
import type { Copy, Lang } from "@/lib/i18n";
import {
  HUBS,
  MAP,
  MAP_H,
  MAP_W,
  ROUTES,
  TRIPS,
  type Hub,
} from "@/components/north-america-map-data";

const LIME = "#9fd36a";
const SIGNAL = "#f2703a";
const INK = "rgb(238 235 227";

/* The hub data is generated with Spanish names; English overrides live here, keyed by hub id. */
const HUB_EN: Record<string, { name?: string; sub?: string }> = {
  puebla: { sub: "Origin" },
  nogales: { sub: "Crossing" },
  mcallen: { sub: "Crossing · Reynosa" },
  la: { name: "Los Angeles" },
  ny: { name: "New York" },
};
const hubName = (h: Hub, lang: Lang) => (lang === "en" && HUB_EN[h.id]?.name) || h.name;
const hubSub = (h: Hub, lang: Lang) => (lang === "en" && HUB_EN[h.id]?.sub) || h.sub;

const T: Copy<{
  title: string;
  desc: string;
  countries: [string, string, string];
  routeTo: (name: string) => string;
  locale: string;
  via: string;
  reference: string;
  hint: string;
  hintShort: string;
}> = {
  en: {
    title: "Collecta coverage across North America",
    desc: "Map of Mexico, the United States and Canada with reference routes. They leave from Puebla; through Nogales they reach Los Angeles, and through Reynosa into McAllen they reach Chicago, Toronto, Montreal, New York, Vancouver, Calgary, Edmonton and Winnipeg. Each destination can be selected to see its approximate distance.",
    countries: ["CANADA", "UNITED STATES", "MEXICO"],
    routeTo: (name) => `View reference route to ${name}`,
    locale: "en-US",
    via: "via",
    reference: "Reference routes",
    hint: "We deliver across the U.S. and Canada. Tap a destination to see its route.",
    hintShort: "Tap a destination",
  },
  es: {
    title: "Cobertura de Collecta en Norteamérica",
    desc: "Mapa de México, Estados Unidos y Canadá con rutas de referencia. Salen de Puebla; por Nogales llegan a Los Ángeles y por Reynosa hacia McAllen a Chicago, Toronto, Montreal, Nueva York, Vancouver, Calgary, Edmonton y Winnipeg. Cada destino se puede seleccionar para ver su distancia aproximada.",
    countries: ["CANADÁ", "ESTADOS UNIDOS", "MÉXICO"],
    routeTo: (name) => `Ver ruta de referencia a ${name}`,
    locale: "es-MX",
    via: "vía",
    reference: "Rutas de referencia",
    hint: "Entregamos en todo EE.UU. y Canadá. Toca un destino para ver su ruta.",
    hintShort: "Toca un destino",
  },
};

/** Label placement per hub so neighbours (Toronto / Nueva York) don't collide. */
const LABEL: Record<
  string,
  { dx: number; dy: number; anchor?: "start" | "end" }
> = {
  puebla: { dx: 18, dy: 5 },
  nogales: { dx: 14, dy: -10 },
  mcallen: { dx: 14, dy: 4 },
  la: { dx: -14, dy: 4, anchor: "end" },
  chicago: { dx: -14, dy: -10, anchor: "end" },
  ny: { dx: 14, dy: 16 },
  toronto: { dx: 12, dy: -12 },
  montreal: { dx: 12, dy: -10 },
  vancouver: { dx: -14, dy: 4, anchor: "end" },
  calgary: { dx: 14, dy: 10 },
  edmonton: { dx: 14, dy: -6 },
  winnipeg: { dx: 14, dy: 4 },
};

function HubMark({ h, dim, on, lang }: { h: Hub; dim: boolean; on: boolean; lang: Lang }) {
  const sub = hubSub(h, lang);
  const l = LABEL[h.id] ?? { dx: 12, dy: 4 };
  const color = h.kind === "origin" ? SIGNAL : LIME;
  return (
    <g
      style={{
        opacity: dim ? 0.3 : 1,
        transition: "opacity 200ms cubic-bezier(0.23,1,0.32,1)",
      }}
    >
      {/* the border crossing breathes: it is the one point every lane depends on */}
      {h.kind === "cross" && (
        <circle
          cx={h.x}
          cy={h.y}
          r={16}
          fill="none"
          stroke={LIME}
          strokeWidth={1.2}
          className="map-ping"
          opacity={0.7}
        />
      )}
      {h.kind === "dest" && on && (
        <circle cx={h.x} cy={h.y} r={17} fill={LIME} fillOpacity={0.18} />
      )}
      {h.kind === "origin" && (
        <>
          <circle cx={h.x} cy={h.y} r={22} fill={SIGNAL} opacity={0.12} />
          <circle cx={h.x} cy={h.y} r={9} fill={SIGNAL} className="map-ping" />
        </>
      )}
      {h.kind === "cross" ? (
        <rect
          x={h.x - 5}
          y={h.y - 5}
          width={10}
          height={10}
          transform={`rotate(45 ${h.x} ${h.y})`}
          fill="#0b120d"
          stroke={LIME}
          strokeWidth={2}
        />
      ) : (
        <>
          <circle
            cx={h.x}
            cy={h.y}
            r={h.kind === "origin" ? 9 : 5.5}
            fill={color}
          />
          {h.kind === "dest" && (
            <circle
              cx={h.x}
              cy={h.y}
              r={11}
              fill="none"
              stroke={LIME}
              strokeOpacity={0.4}
            />
          )}
        </>
      )}
      <text
        x={h.x + l.dx}
        y={h.y + l.dy}
        textAnchor={l.anchor ?? "start"}
        fill={`${INK} / 0.95)`}
        fontFamily="var(--font-geist-mono)"
        fontSize={h.kind === "origin" ? 17 : 14}
        letterSpacing="1.5"
        stroke="#0b120d"
        strokeWidth={5}
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        {hubName(h, lang).toUpperCase()}
      </text>
      {sub && (
        <text
          x={h.x + l.dx}
          y={h.y + l.dy + 16}
          textAnchor={l.anchor ?? "start"}
          fill={`${INK} / 0.5)`}
          fontFamily="var(--font-geist-mono)"
          fontSize={11}
          letterSpacing="1.5"
          stroke="#0b120d"
          strokeWidth={4}
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          {sub.toUpperCase()}
        </text>
      )}
    </g>
  );
}

const canHover = () => matchMedia("(hover: hover) and (pointer: fine)").matches;

export function NorthAmericaMap() {
  const lang = useLang();
  const tx = T[lang];
  const [active, setActive] = useState<string | null>(null);
  // what was selected before this press: focus may select first, the click must not undo it
  const pressedWasActive = useRef(false);
  const trip = active ? TRIPS[active] : null;
  const dest = active ? HUBS.find((h) => h.id === active) : null;
  // a hub stays lit if it is on the selected trip's path
  const onTrip = (id: string) => {
    if (!active) return true;
    if (id === active || id === "puebla") return true;
    if (id === "nogales") return trip?.via === "Nogales";
    if (id === "mcallen") return trip?.via === "Reynosa";
    return false;
  };

  return (
    <div
      className="relative h-full w-full"
      onMouseLeave={() => {
        if (canHover()) setActive(null);
      }}
    >
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="h-full w-full"
        role="group"
        aria-labelledby="na-map-title na-map-desc"
      >
        <title id="na-map-title">{tx.title}</title>
        <desc id="na-map-desc">{tx.desc}</desc>
        <defs>
          <pattern
            id="dots-mx"
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="3.5" cy="3.5" r="1.7" fill={LIME} />
          </pattern>
          <pattern
            id="dots-us"
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="3.5" cy="3.5" r="1.4" fill={`${INK} / 0.34)`} />
          </pattern>
          <pattern
            id="dots-ca"
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="3.5" cy="3.5" r="1.4" fill={`${INK} / 0.22)`} />
          </pattern>
          <pattern
            id="dots-other"
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="3.5" cy="3.5" r="1.1" fill={`${INK} / 0.08)`} />
          </pattern>
          <radialGradient id="mx-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={LIME} stopOpacity="0.16" />
            <stop offset="1" stopColor={LIME} stopOpacity="0" />
          </radialGradient>
        </defs>

        <path
          d={MAP.graticule}
          fill="none"
          stroke={`${INK} / 0.05)`}
          strokeWidth={1}
        />
        <ellipse cx={470} cy={600} rx={260} ry={170} fill="url(#mx-glow)" />

        <path d={MAP.others} fill="url(#dots-other)" />
        <path
          d={MAP.ca}
          fill="url(#dots-ca)"
          stroke={`${INK} / 0.12)`}
          strokeWidth={0.8}
        />
        <path
          d={MAP.us}
          fill="url(#dots-us)"
          stroke={`${INK} / 0.18)`}
          strokeWidth={0.8}
        />
        <path
          d={MAP.mx}
          fill="url(#dots-mx)"
          stroke={LIME}
          strokeOpacity={0.55}
          strokeWidth={1.2}
        />

        <g
          fontFamily="var(--font-geist-mono)"
          letterSpacing="8"
          fill={`${INK} / 0.28)`}
          fontSize={20}
        >
          <text x={560} y={148}>
            {tx.countries[0]}
          </text>
          <text x={160} y={372} fontSize={14} letterSpacing={5}>
            {tx.countries[1]}
          </text>
          <text x={120} y={655} fill={LIME} fillOpacity={0.75}>
            {tx.countries[2]}
          </text>
        </g>

        <g
          style={{
            opacity: active ? 0.18 : 1,
            transition: "opacity 200ms cubic-bezier(0.23,1,0.32,1)",
          }}
        >
          {ROUTES.map((r, i) => (
            <g key={r.id}>
              <path
                d={r.d}
                fill="none"
                stroke={LIME}
                strokeOpacity={0.22}
                strokeWidth={5}
                strokeLinecap="round"
              />
              <path
                d={r.d}
                fill="none"
                stroke={LIME}
                strokeWidth={2}
                strokeLinecap="round"
                className="route"
              />
              <circle r={5} fill="#eeebe3" className="route-pulse">
                <animateMotion
                  dur={`${5 + (i % 4) * 1.2}s`}
                  begin={`${i * 0.7}s`}
                  repeatCount="indefinite"
                  path={r.d}
                />
              </circle>
            </g>
          ))}
        </g>

        {/* the selected trip, drawn in solid over the dimmed network */}
        {trip && (
          <g key={active}>
            <path
              d={trip.d}
              fill="none"
              stroke={LIME}
              strokeOpacity={0.3}
              strokeWidth={9}
              strokeLinecap="round"
            />
            <path
              d={trip.d}
              fill="none"
              stroke={LIME}
              strokeWidth={3}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="1"
              className="trip-draw"
            />
            <circle r={6} fill="#eeebe3">
              <animateMotion
                dur="2.4s"
                repeatCount="indefinite"
                path={trip.d}
              />
            </circle>
          </g>
        )}

        {HUBS.map((h) => (
          <HubMark key={h.id} h={h} dim={!onTrip(h.id)} on={h.id === active} lang={lang} />
        ))}

        {/* destinations are the controls; a generous invisible target around each dot */}
        {HUBS.filter((h) => h.kind === "dest").map((h) => (
          <circle
            key={`hit-${h.id}`}
            cx={h.x}
            cy={h.y}
            r={24}
            fill="transparent"
            role="button"
            tabIndex={0}
            aria-label={tx.routeTo(hubName(h, lang))}
            aria-pressed={active === h.id}
            className="cursor-pointer outline-none focus-visible:stroke-[#9fd36a] focus-visible:stroke-2"
            onMouseEnter={(e) => {
              if (matchMedia("(hover: hover) and (pointer: fine)").matches)
                setActive(h.id);
              void e;
            }}
            onFocus={(e) => {
            // keyboard focus previews; a tap focuses too, so let the click decide
            if (e.currentTarget.matches(":focus-visible")) setActive(h.id);
          }}
            onBlur={() => setActive(null)}
            onPointerDown={() => {
              pressedWasActive.current = active === h.id;
            }}
            onClick={() => setActive(pressedWasActive.current ? null : h.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActive((a) => (a === h.id ? null : h.id));
              }
              if (e.key === "Escape") setActive(null);
            }}
          />
        ))}
      </svg>

      {/* trip readout; with nothing selected it says what the map is: a reference, not a boundary */}
      <div
        aria-live="polite"
        className="pointer-events-none absolute top-2 right-2 max-w-[15rem] sm:top-auto rounded-md border border-white/12 bg-[#0b120d]/85 px-2.5 py-2 font-mono text-[9px] backdrop-blur-md sm:right-5 sm:bottom-5 sm:rounded-lg sm:px-3.5 sm:py-3 sm:text-[11px]"
      >
        {trip && dest ? (
          <>
            <div className="tracking-[0.08em] text-foreground uppercase">
              Puebla → {hubName(dest, lang)}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-foreground/65">
              <span className="text-primary">
                ~{trip.km.toLocaleString(tx.locale)} km
              </span>
              <span>{tx.via} {trip.via}</span>
              <span>1 °C</span>
            </div>
          </>
        ) : (
          <>
            <div className="tracking-[0.08em] text-foreground/85 uppercase">
              {tx.reference}
            </div>
            <div className="mt-1.5 hidden leading-relaxed text-foreground/55 sm:block">
              {tx.hint}
            </div>
            <div className="mt-1 text-foreground/55 sm:hidden">{tx.hintShort}</div>
          </>
        )}
      </div>
    </div>
  );
}
