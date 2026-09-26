"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/lang-provider";
import type { Copy } from "@/lib/i18n";

const FEED = [
  { lot: "BRC-2291", stage: 0, place: "Puebla", ok: true },
  { lot: "BRC-2288", stage: 1, place: "Puebla", ok: true },
  { lot: "CLF-1104", stage: 2, place: "Tlaxcala", ok: true },
  { lot: "BRC-2275", stage: 3, place: "Reynosa, Tamps.", ok: true },
  { lot: "LCG-0931", stage: 4, place: "Puebla", ok: false },
  { lot: "BRC-2263", stage: 5, place: "Toronto, ON", ok: true },
];

/* stage names by FEED[].stage index */
const T: Copy<{ stages: string[]; live: string; review: string; traceable: string; cold: string; steps: string }> = {
  en: {
    stages: ["Harvest", "Packing · 2 °C", "Supervision", "In transit", "Inspection", "Delivered"],
    live: "COS · live",
    review: "review",
    traceable: "traceable",
    cold: "cold",
    steps: "stages",
  },
  es: {
    stages: ["Cosecha", "Empaque · 2 °C", "Supervisión", "En tránsito", "Inspección", "Entregado"],
    live: "COS · en vivo",
    review: "revisión",
    traceable: "trazable",
    cold: "frío",
    steps: "etapas",
  },
};

function useClock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "America/Mexico_City",
    });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** Decorative telemetry panel. Sample data — it's a brand illustration, not a live feed. */
export function CosConsole() {
  const t = T[useLang()];
  const now = useClock();
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setOffset((o) => (o + 1) % FEED.length), 2600);
    return () => clearInterval(id);
  }, []);

  const rows = Array.from({ length: 4 }, (_, i) => FEED[(offset + i) % FEED.length]);

  return (
    <div
      aria-hidden
      className="w-full max-w-sm rounded-2xl border border-(--line) bg-background/55 p-4 font-mono text-[11px] leading-relaxed backdrop-blur-md"
    >
      <div className="flex items-center justify-between border-b border-(--line) pb-3 text-foreground/60">
        <span className="flex items-center gap-2 text-foreground">
          <span className="live-dot" /> {t.live}
        </span>
        <span className="tabular-nums">{now ?? "--:--:--"} CDMX</span>
      </div>
      <ul className="mt-2 divide-y divide-(--line)">
        {rows.map((r) => (
          <li
            key={`${r.lot}-${offset}`}
            className="fade-up grid grid-cols-[5.5rem_1fr_auto] items-center gap-2 py-2"
          >
            <span className="text-primary">{r.lot}</span>
            <span className="truncate text-foreground/80">{t.stages[r.stage]}</span>
            <span className={r.ok ? "text-foreground/50" : "text-signal"}>{r.ok ? r.place : t.review}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-(--line) pt-3 text-foreground/50">
        <div>
          <div className="text-foreground">95%</div>{t.traceable}
        </div>
        <div>
          <div className="text-foreground">2 °C</div>{t.cold}
        </div>
        <div>
          <div className="text-foreground">8/8</div>{t.steps}
        </div>
      </div>
    </div>
  );
}
