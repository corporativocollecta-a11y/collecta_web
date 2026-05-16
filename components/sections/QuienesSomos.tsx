"use client";

import dynamic from "next/dynamic";

const Globe = dynamic(() => import("@/components/3d/Globe"), {
  ssr: false,
  loading: () => <div style={{ width: "100%", aspectRatio: "1/1" }} />,
});

export default function QuienesSomos() {
  return (
    <section
      id="quienes-somos"
      style={{
        background: "#0f1612",
        color: "#eaf5ee",
        padding: "80px 80px 120px",
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 80,
          alignItems: "center",
        }}
      >
        {/* ── Columna izquierda: copy ─────────────────────────────── */}
        <div>
          <div
            className="text-sm sm:text-base font-semibold tracking-[0.22em] uppercase"
            style={{
              color: "#4ADE80",
              marginBottom: 16,
            }}
          >
            Quiénes somos
          </div>

          <h2
            className="text-4xl sm:text-5xl font-bold"
            style={{
              lineHeight: 1.1,
              margin: "0 0 32px",
              color: "#ffffff",
              textWrap: "balance",
            }}
          >
            Una empresa mexicana, una visión global
          </h2>

          <p
            className="text-base sm:text-lg leading-relaxed"
            style={{
              margin: "0 0 20px",
              color: "rgba(207,230,227,0.75)",
              maxWidth: 560,
            }}
          >
            Collecta es una empresa mexicana que produce y comercializa
            hortalizas con una operación integrada de principio a fin.
            Habilitamos la producción desde el origen, trabajamos de cerca con
            agricultores y cuidamos cada etapa: planeación, producción en
            campo, cosecha y empaque.
          </p>

          <p
            className="text-base sm:text-lg leading-relaxed"
            style={{
              margin: 0,
              color: "rgba(207,230,227,0.75)",
              maxWidth: 560,
            }}
          >
            Todo con trazabilidad e inocuidad, para entregar abasto confiable
            y calidad consistente a clientes exigentes que comparten nuestra
            visión de transformación.
          </p>
        </div>

        {/* ── Columna derecha: globo 3D ───────────────────────────── */}
        <div>
          <div
            style={{
              position: "relative",
              width: "100%",
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
