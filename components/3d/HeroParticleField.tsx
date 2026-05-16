'use client';

import { useEffect, useRef } from 'react';

interface HeroParticleFieldProps {
  className?: string;
  /** Number of drifting points. @default 80 */
  count?: number;
  /** Point color (hex). @default 0x4ADE80 */
  color?: number;
  /** Background clear color (hex). Ignored when `transparent` is true. @default 0x030D07 */
  background?: number;
  /** Render with a transparent canvas instead of a solid background. @default false */
  transparent?: boolean;
}

/**
 * Three.js particle field — 80 small dots drifting in 3D space, connected
 * with thin lines when they come close. The camera nudges in response to
 * cursor movement so the whole field feels parallax. Ported 1:1 from the
 * Collecta premium mockup hero canvas.
 */
export default function HeroParticleField({
  className,
  count = 80,
  color = 0x4ade80,
  background = 0x0f1612,
  transparent = false,
}: HeroParticleFieldProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    let disposed = false;
    let raf = 0;
    let cleanup: (() => void) | null = null;

    (async () => {
      const THREE = await import('three');
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        powerPreference: 'high-performance',
        alpha: transparent,
      });
      renderer.setPixelRatio(1);
      if (transparent) {
        renderer.setClearColor(0x000000, 0); // fully transparent
      } else {
        renderer.setClearColor(background);
      }

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 1000);
      camera.position.z = 6;

      const COUNT = count;
      const pArr = new Float32Array(COUNT * 3);
      const vel = new Float32Array(COUNT * 3);
      for (let i = 0; i < COUNT; i++) {
        pArr[i * 3] = (Math.random() - 0.5) * 13;
        pArr[i * 3 + 1] = (Math.random() - 0.5) * 8;
        pArr[i * 3 + 2] = (Math.random() - 0.5) * 4;
        vel[i * 3] = (Math.random() - 0.5) * 0.006;
        vel[i * 3 + 1] = (Math.random() - 0.5) * 0.006;
        vel[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pArr, 3));
      const pMat = new THREE.PointsMaterial({
        color,
        size: 0.07,
        transparent: true,
        opacity: 0.75,
      });
      const points = new THREE.Points(pGeo, pMat);
      scene.add(points);

      const MAX_LINES = (COUNT * (COUNT - 1)) / 2;
      const lArr = new Float32Array(MAX_LINES * 6);
      const lGeo = new THREE.BufferGeometry();
      lGeo.setAttribute('position', new THREE.BufferAttribute(lArr, 3));
      lGeo.setDrawRange(0, 0);
      const lMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.12,
      });
      const lines = new THREE.LineSegments(lGeo, lMat);
      scene.add(lines);

      const mouse = { x: 0, y: 0 };

      function resize() {
        const r = wrapper!.getBoundingClientRect();
        const W = r.width || 1;
        const H = r.height || 1;
        renderer.setSize(W, H, false);
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
      }

      function onMove(e: PointerEvent) {
        const r = canvas!.getBoundingClientRect();
        mouse.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
        mouse.y = -((e.clientY - r.top) / r.height - 0.5) * 2;
      }

      canvas.addEventListener('pointermove', onMove);

      let fr = 0;
      function tick() {
        if (disposed) return;
        fr++;
        // Drift points; bounce off invisible walls so they stay on-screen.
        for (let i = 0; i < COUNT; i++) {
          pArr[i * 3] += vel[i * 3];
          pArr[i * 3 + 1] += vel[i * 3 + 1];
          pArr[i * 3 + 2] += vel[i * 3 + 2];
          if (Math.abs(pArr[i * 3]) > 6.5) vel[i * 3] *= -1;
          if (Math.abs(pArr[i * 3 + 1]) > 4) vel[i * 3 + 1] *= -1;
          if (Math.abs(pArr[i * 3 + 2]) > 2) vel[i * 3 + 2] *= -1;
        }
        pGeo.attributes.position.needsUpdate = true;

        // Rebuild line list every 3rd frame for performance.
        if (fr % 3 === 0) {
          let lc = 0;
          for (let i = 0; i < COUNT; i++) {
            for (let j = i + 1; j < COUNT; j++) {
              const dx = pArr[i * 3] - pArr[j * 3];
              const dy = pArr[i * 3 + 1] - pArr[j * 3 + 1];
              const dz = pArr[i * 3 + 2] - pArr[j * 3 + 2];
              if (dx * dx + dy * dy + dz * dz < 7) {
                lArr[lc * 6] = pArr[i * 3];
                lArr[lc * 6 + 1] = pArr[i * 3 + 1];
                lArr[lc * 6 + 2] = pArr[i * 3 + 2];
                lArr[lc * 6 + 3] = pArr[j * 3];
                lArr[lc * 6 + 4] = pArr[j * 3 + 1];
                lArr[lc * 6 + 5] = pArr[j * 3 + 2];
                lc++;
              }
            }
          }
          lGeo.setDrawRange(0, lc * 2);
          lGeo.attributes.position.needsUpdate = true;
        }

        // Subtle parallax: camera follows the cursor with easing.
        camera.position.x += (mouse.x * 0.4 - camera.position.x) * 0.03;
        camera.position.y += (mouse.y * 0.3 - camera.position.y) * 0.03;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      }

      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(wrapper);
      raf = requestAnimationFrame(tick);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        canvas!.removeEventListener('pointermove', onMove);
        renderer.dispose();
        pGeo.dispose();
        lGeo.dispose();
        pMat.dispose();
        lMat.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
