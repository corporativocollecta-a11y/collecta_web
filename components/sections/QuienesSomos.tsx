"use client";

import dynamic from "next/dynamic";
import { useT } from "@/lib/i18n/LocaleProvider";

const Globe = dynamic(() => import("@/components/3d/Globe"), {
  ssr: false,
  loading: () => <div style={{ width: "100%", aspectRatio: "1/1" }} />,
});

export default function QuienesSomos() {
  const t = useT();
  return (
    <section
      id="quienes-somos"
      className="py-16 sm:py-20 lg:py-24 pb-24 sm:pb-28 lg:pb-32 px-5 sm:px-8 lg:px-20"
      style={{
        background: "#0f1612",
        color: "#eaf5ee",
      }}
    >
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-20 items-center">
        {/* ── Columna izquierda: copy ─────────────────────────────── */}
        {/* Mobile: copy first (order-1), globe below (order-2).
            Desktop: copy on the left (lg:order-1), globe on the right
            (lg:order-2) — same as before. */}
        <div className="order-1 lg:order-1">
          <div
            className="text-xs sm:text-sm lg:text-base font-semibold tracking-[0.22em] uppercase mb-4"
            style={{ color: "#00FF80" }}
          >
            {t('quienes.kicker')}
          </div>

          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8"
            style={{
              lineHeight: 1.1,
              color: "#ffffff",
              textWrap: "balance",
            }}
          >
            {t('quienes.title')}
          </h2>

          <p
            className="text-base sm:text-lg leading-relaxed mb-5"
            style={{
              color: "rgba(207,230,227,0.75)",
              maxWidth: 560,
            }}
          >
            {t('quienes.p1')}
          </p>

          <p
            className="text-base sm:text-lg leading-relaxed"
            style={{
              color: "rgba(207,230,227,0.75)",
              maxWidth: 560,
            }}
          >
            {t('quienes.p2')}
          </p>
        </div>

        {/* ── Columna derecha: globo 3D ───────────────────────────── */}
        <div className="order-2 lg:order-2">
          <div
            className="relative w-full mx-auto max-w-md lg:max-w-none"
            style={{
              aspectRatio: "1 / 1",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <Globe
              theme="teal"
              autoRotate={0.0012}
              graticule={true}
              wireframe={true}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
