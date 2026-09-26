/* Soil life rising into the page: the same microbes as the footer (dots, rods, a few lime
   ones), none in the upper half, then more and a little brighter the deeper you go, until
   they meet the footer's soil. Background only, behind all content. Pure CSS: transform
   drift on tiny elements, in bands that only animate while on screen; reduced motion
   leaves them still. Positions are in
   % of the page, so they need no measuring and are the same on server and client. */

import type { CSSProperties } from "react";
import { PauseOffscreen } from "@/components/pause-offscreen";

const COUNT = 170;
const FROM = 0.5; // share of the page where they start
const TO = 0.95; // the footer starts at ~96% of the page on every size
const BANDS = 6; // each band animates only while on screen

function rng(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

const r = rng(29);
const MICROBES = Array.from({ length: COUNT }, (_, k) => {
  const depth = Math.sqrt(r()); // more of them near the bottom
  const y = FROM + (TO - FROM) * depth;
  const lime = k % 7 === 0;
  return {
    x: 2 + r() * 96,
    y: y * 100,
    rod: k % 3 === 0,
    big: k % 4 === 0,
    rot: Math.round(r() * 180),
    alpha: (lime ? 0.16 : 0.08) + depth * (lime ? 0.26 : 0.16),
    lime,
    dx: ((r() - 0.5) * 18).toFixed(1),
    dy: ((r() - 0.5) * 14).toFixed(1),
    dur: (7 + r() * 6).toFixed(1),
    delay: (-r() * 12).toFixed(1),
  };
});

export function PageMicrobes() {
  return (
    <div
      aria-hidden
      className="page-microbes pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <style>{`
        @keyframes pm-wander{0%,100%{transform:translate(0,0)}33%{transform:translate(var(--dx),calc(var(--dy) * -0.6))}66%{transform:translate(calc(var(--dx) * -0.5),var(--dy))}}
        .pm-band > span{position:absolute;animation:pm-wander var(--dur) ease-in-out var(--delay) infinite}
        .pm-band[data-offscreen] > span{animation-play-state:paused}
        @media (prefers-reduced-motion: reduce){.pm-band > span{animation:none}}
      `}</style>
      {Array.from({ length: BANDS }, (_, b) => {
        const y0 = FROM + ((TO - FROM) * b) / BANDS;
        const h = (TO - FROM) / BANDS;
        return (
          <PauseOffscreen
            key={b}
            className="pm-band absolute inset-x-0"
            style={{ top: `${(y0 * 100).toFixed(3)}%`, height: `${(h * 100).toFixed(3)}%` }}
          >
            {MICROBES.filter((m) => m.y >= y0 * 100 && (m.y < (y0 + h) * 100 || b === BANDS - 1)).map((m, k) => (
              <span
                key={k}
                style={
                  {
                    left: `${m.x.toFixed(2)}%`,
                    top: `${(((m.y / 100 - y0) / h) * 100).toFixed(2)}%`,
                    width: m.rod ? 6 : m.big ? 3.6 : 2.4,
                    height: m.rod ? 2.2 : m.big ? 3.6 : 2.4,
                    borderRadius: 999,
                    rotate: m.rod ? `${m.rot}deg` : undefined,
                    background: m.lime
                      ? `rgb(159 211 106 / ${m.alpha.toFixed(3)})`
                      : `rgb(238 235 227 / ${m.alpha.toFixed(3)})`,
                    "--dx": `${m.dx}px`,
                    "--dy": `${m.dy}px`,
                    "--dur": `${m.dur}s`,
                    "--delay": `${m.delay}s`,
                  } as CSSProperties
                }
              />
            ))}
          </PauseOffscreen>
        );
      })}
    </div>
  );
}
