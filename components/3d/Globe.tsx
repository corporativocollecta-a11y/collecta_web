"use client";

import { useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type GlobeTheme = "teal" | "midnight" | "forest" | "mono" | "amber";
export type GlobeStyle = "filled" | "outline" | "dots";

export interface GlobeProps {
  /** Color palette. @default "teal" */
  theme?: GlobeTheme;
  /** How continents are drawn. @default "filled" */
  style?: GlobeStyle;
  /** Show lat/lon graticule. @default true */
  graticule?: boolean;
  /** Show country borders (only with style="filled"). @default false */
  borders?: boolean;
  /** Show the faint wireframe shell over the surface. @default true */
  wireframe?: boolean;
  /** Auto-rotation speed in radians/frame. 0 disables. @default 0.0018 */
  autoRotate?: number;
  /** Initial camera distance (1.5 = surface, 5.2 = comfortable). @default 5.2 */
  distance?: number;
  /** Container className passthrough */
  className?: string;
  /** Container inline style passthrough. Named `containerStyle` (not `style`)
      because the GlobeStyle prop above already occupies that name and TS does
      not allow duplicate keys on an interface. */
  containerStyle?: React.CSSProperties;
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const THEMES: Record<GlobeTheme, {
  bg: string; ocean: string; land: string; outline: string; grid: string;
}> = {
  teal:     { bg: "#06181c", ocean: "#1E3A5F", land: "#4d8a9f", outline: "#7cc9bd", grid: "rgba(124,201,189,0.06)" },
  midnight: { bg: "#040a18", ocean: "#0a1b36", land: "#23477f", outline: "#6aa2e0", grid: "rgba(106,162,224,0.06)" },
  forest:   { bg: "#0a160c", ocean: "#10261a", land: "#3a7a4c", outline: "#83c596", grid: "rgba(131,197,150,0.06)" },
  mono:     { bg: "#0a0a0b", ocean: "#1a1a1c", land: "#3a3a3e", outline: "#888a90", grid: "rgba(180,180,180,0.05)" },
  amber:    { bg: "#170c05", ocean: "#341b08", land: "#9c5a1f", outline: "#e9a45d", grid: "rgba(233,164,93,0.05)" },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Globe({
  theme = "teal",
  style = "filled",
  graticule = true,
  borders = false,
  wireframe = true,
  autoRotate = 0.0018,
  distance = 5.2,
  className,
  containerStyle,
}: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{ dispose: () => void; update: (p: Partial<GlobeProps>) => void } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      // Dynamic imports keep Three.js out of the server bundle and let
      // Next 16 tree-shake / chunk-split it cleanly.
      const [THREE, d3geo, topojsonClient] = await Promise.all([
        import("three"),
        import("d3-geo"),
        import("topojson-client"),
      ]);
      if (disposed) return;

      const W = () => container.clientWidth;
      const H = () => container.clientHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, W() / H(), 0.1, 100);
      camera.position.set(0, 0, distance);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
      renderer.setSize(W(), H());
      container.appendChild(renderer.domElement);

      const earthGroup = new THREE.Group();
      scene.add(earthGroup);

      // Wireframe shell
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x9adcd1, wireframe: true, transparent: true, opacity: 0.07,
      });
      const wire = new THREE.Mesh(new THREE.SphereGeometry(1.508, 36, 24), wireMat);
      earthGroup.add(wire);

      // Earth
      const tex = new THREE.CanvasTexture(document.createElement("canvas"));
      tex.anisotropy = 8;
      tex.colorSpace = THREE.SRGBColorSpace;
      const earthMat = new THREE.MeshBasicMaterial({ color: 0xffffff, map: tex });
      const earth = new THREE.Mesh(new THREE.SphereGeometry(1.5, 128, 96), earthMat);
      earthGroup.add(earth);

      // Load world atlas (cached by the browser between mounts)
      const world: { objects: { countries: unknown } } = await fetch(
        "https://unpkg.com/world-atlas@2/countries-110m.json"
      ).then(r => r.json());
      if (disposed) { renderer.dispose(); return; }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const features = (topojsonClient as any).feature(world, (world as any).objects.countries);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bordersMesh = (topojsonClient as any).mesh(world, (world as any).objects.countries, (a: unknown, b: unknown) => a !== b);

      function paint(opts: {
        theme: GlobeTheme; style: GlobeStyle; graticule: boolean; borders: boolean;
      }) {
        const T = THEMES[opts.theme];
        const TW = 2048, TH = 1024;
        const c = (tex.image as HTMLCanvasElement) || document.createElement("canvas");
        c.width = TW; c.height = TH;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = T.ocean; ctx.fillRect(0, 0, TW, TH);

        if (opts.graticule) {
          ctx.strokeStyle = T.grid; ctx.lineWidth = 1;
          for (let lon = -180; lon <= 180; lon += 15) {
            const x = ((lon + 180) / 360) * TW;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, TH); ctx.stroke();
          }
          for (let lat = -75; lat <= 75; lat += 15) {
            const y = ((90 - lat) / 180) * TH;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(TW, y); ctx.stroke();
          }
        }

        const proj = d3geo.geoEquirectangular().scale(TW / (2 * Math.PI)).translate([TW / 2, TH / 2]);
        const path = d3geo.geoPath(proj, ctx);

        if (opts.style === "dots") {
          const m = document.createElement("canvas");
          m.width = TW; m.height = TH;
          const mctx = m.getContext("2d")!;
          mctx.fillStyle = "#000";
          const mpath = d3geo.geoPath(proj, mctx);
          mctx.beginPath(); mpath(features); mctx.fill();
          const data = mctx.getImageData(0, 0, TW, TH).data;
          const step = 9, r = 2.1;
          ctx.fillStyle = T.land;
          for (let y = step / 2; y < TH; y += step) {
            for (let x = step / 2; x < TW; x += step) {
              const idx = ((y | 0) * TW + (x | 0)) * 4 + 3;
              if (data[idx] > 128) {
                const lat = 90 - (y / TH) * 180;
                const rr = r * Math.max(0.35, Math.cos((lat * Math.PI) / 180));
                ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
              }
            }
          }
        } else if (opts.style === "outline") {
          ctx.strokeStyle = T.outline; ctx.lineWidth = 1.4;
          ctx.beginPath(); path(features); ctx.stroke();
        } else {
          ctx.fillStyle = T.land;
          ctx.beginPath(); path(features); ctx.fill();
          ctx.strokeStyle = T.outline; ctx.lineWidth = 1.1;
          ctx.beginPath(); path(features); ctx.stroke();
          if (opts.borders) {
            ctx.strokeStyle = T.ocean; ctx.lineWidth = 0.7;
            ctx.beginPath(); path(bordersMesh); ctx.stroke();
          }
        }

        tex.image = c;
        tex.needsUpdate = true;
      }

      // ── Initial paint ──
      const config = {
        theme, style, graticule, borders, wireframe, autoRotate,
      };
      paint({ theme: config.theme, style: config.style, graticule: config.graticule, borders: config.borders });
      wire.visible = config.wireframe;

      // ── Interaction ──
      const st = { rotX: 0.2, rotY: 0.6, auto: config.autoRotate, dragging: false, lastX: 0, lastY: 0, vx: 0, vy: 0 };
      const dom = renderer.domElement;
      dom.style.touchAction = "none";
      dom.style.cursor = "grab";
      dom.style.display = "block";
      dom.style.width = "100%";
      dom.style.height = "100%";

      const onDown = (e: PointerEvent) => {
        st.dragging = true; dom.style.cursor = "grabbing";
        st.lastX = e.clientX; st.lastY = e.clientY; st.vx = st.vy = 0;
        dom.setPointerCapture(e.pointerId);
      };
      const onMove = (e: PointerEvent) => {
        if (!st.dragging) return;
        const dx = (e.clientX - st.lastX) * 0.006;
        const dy = (e.clientY - st.lastY) * 0.006;
        st.rotY += dx; st.rotX += dy;
        st.rotX = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, st.rotX));
        st.vx = dx; st.vy = dy; st.lastX = e.clientX; st.lastY = e.clientY;
      };
      const onUp = () => { st.dragging = false; dom.style.cursor = "grab"; };
      // Zoom intentionally disabled: the globe sits at a fixed `distance`.
      // Wheel events bubble up so the page scrolls naturally when the user
      // scrolls over the globe, and pinch gestures on touch devices have no
      // effect on the globe size.
      dom.addEventListener("pointerdown", onDown);
      dom.addEventListener("pointermove", onMove);
      dom.addEventListener("pointerup", onUp);
      dom.addEventListener("pointercancel", onUp);

      // ── Animate ──
      let raf = 0;
      const tick = () => {
        if (!st.dragging) {
          st.rotY += st.vx * 0.85; st.rotX += st.vy * 0.85;
          st.vx *= 0.94; st.vy *= 0.94;
          st.rotY += st.auto;
        }
        earthGroup.rotation.y = st.rotY; earthGroup.rotation.x = st.rotX;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      // ── Resize ──
      const ro = new ResizeObserver(() => {
        renderer.setSize(W(), H());
        camera.aspect = W() / H();
        camera.updateProjectionMatrix();
      });
      ro.observe(container);

      apiRef.current = {
        update: (p) => {
          if (p.theme !== undefined || p.style !== undefined || p.graticule !== undefined || p.borders !== undefined) {
            paint({
              theme: p.theme ?? config.theme,
              style: p.style ?? config.style,
              graticule: p.graticule ?? config.graticule,
              borders: p.borders ?? config.borders,
            });
            if (p.theme) config.theme = p.theme;
            if (p.style) config.style = p.style;
            if (p.graticule !== undefined) config.graticule = p.graticule;
            if (p.borders !== undefined) config.borders = p.borders;
          }
          if (p.wireframe !== undefined) wire.visible = p.wireframe;
          if (p.autoRotate !== undefined) st.auto = p.autoRotate;
        },
        dispose: () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          dom.removeEventListener("pointerdown", onDown);
          dom.removeEventListener("pointermove", onMove);
          dom.removeEventListener("pointerup", onUp);
          dom.removeEventListener("pointercancel", onUp);
          renderer.dispose();
          if (dom.parentNode === container) container.removeChild(dom);
        },
      };

      cleanup = apiRef.current.dispose;
    })();

    return () => {
      disposed = true;
      cleanup?.();
      apiRef.current = null;
    };
    // We deliberately mount once; subsequent prop changes go through the update path.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hot-swap props without remounting the scene
  useEffect(() => {
    apiRef.current?.update({ theme, style, graticule, borders, wireframe, autoRotate });
  }, [theme, style, graticule, borders, wireframe, autoRotate]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "transparent",
        overflow: "hidden",
        ...containerStyle,
      }}
    />
  );
}
