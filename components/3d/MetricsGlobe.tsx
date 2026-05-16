'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  CONTINENTS,
  MEXICO_ORIGIN,
  ARC_DESTINATIONS,
  type Polyline,
} from '@/lib/geo/continents';

const RADIUS = 2;

// Convert (lng, lat) to a point on the sphere surface
function lngLatToVec3(lng: number, lat: number, radius = RADIUS): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

// Subdivide a polyline so points hug the sphere surface (great-circle interpolation)
function densifyPolyline(line: Polyline, segments = 6): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < line.length - 1; i++) {
    const a = lngLatToVec3(line[i][0], line[i][1], RADIUS + 0.005);
    const b = lngLatToVec3(line[i + 1][0], line[i + 1][1], RADIUS + 0.005);
    for (let s = 0; s < segments; s++) {
      const t = s / segments;
      const v = new THREE.Vector3().lerpVectors(a, b, t).normalize().multiplyScalar(RADIUS + 0.005);
      out.push(v);
    }
  }
  // close last point
  const last = lngLatToVec3(line[line.length - 1][0], line[line.length - 1][1], RADIUS + 0.005);
  out.push(last);
  return out;
}

// Build a great-circle arc curve between two surface points, lifted into the air
function buildArc(from: THREE.Vector3, to: THREE.Vector3, lift = 0.7): THREE.QuadraticBezierCurve3 {
  const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
  const dist = from.distanceTo(to);
  mid.normalize().multiplyScalar(RADIUS + lift * (dist / RADIUS));
  return new THREE.QuadraticBezierCurve3(from.clone(), mid, to.clone());
}

// =====================================================================
// CONTINENTS LAYER — drawn as line segments
// =====================================================================
function ContinentLines() {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    CONTINENTS.forEach((line) => {
      // Higher subdivision (16) gives smoother great-circle interpolation between coords
      const points = densifyPolyline(line, 16);
      for (let i = 0; i < points.length - 1; i++) {
        positions.push(points[i].x, points[i].y, points[i].z);
        positions.push(points[i + 1].x, points[i + 1].y, points[i + 1].z);
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, []);

  return (
    <lineSegments geometry={geometry}>
      {/* Boomitra-style pale teal outline (#D4FCFF) — bright but soft on the
          teal landmass below, giving the planet a crisp etched silhouette. */}
      <lineBasicMaterial color="#D4FCFF" transparent opacity={0.9} linewidth={1} />
    </lineSegments>
  );
}

// =====================================================================
// CONTINENT FILLS — closed polygons raised slightly above the ocean,
// shaded with PBR so they catch light like in the Boomitra header globe.
// =====================================================================
function ContinentFills() {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const indices: number[] = [];
    let vertexOffset = 0;

    CONTINENTS.forEach((line) => {
      // Lift continents slightly off the ocean surface so the rim picks up
      // a subtle shadow line — gives a "bas-relief" feel.
      const liftR = RADIUS + 0.012;

      // Compute spherical centroid of the polyline (used as fan apex)
      const centroid = new THREE.Vector3();
      const projected = line.map(([lng, lat]) =>
        lngLatToVec3(lng, lat, liftR)
      );
      projected.forEach((p) => centroid.add(p));
      centroid.normalize().multiplyScalar(liftR);

      // Vertex 0 is the centroid; ring vertices follow
      positions.push(centroid.x, centroid.y, centroid.z);
      projected.forEach((p) => positions.push(p.x, p.y, p.z));

      // Fan triangulation — for each consecutive ring pair, build a tri to the centroid
      for (let i = 1; i < projected.length; i++) {
        indices.push(vertexOffset, vertexOffset + i, vertexOffset + i + 1);
      }
      vertexOffset += projected.length + 1;
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry}>
      {/* Boomitra-exact teal (#36757D) — flat, no shading. The continents
          read as a single calm landmass against the slightly darker ocean. */}
      <meshBasicMaterial
        color="#36757D"
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

// =====================================================================
// MERIDIANS + PARALLELS — subtle globe scaffolding
// =====================================================================
function GlobeGrid() {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const STEPS = 64;

    // Meridians (every 30°)
    for (let lng = -180; lng < 180; lng += 30) {
      for (let i = 0; i < STEPS; i++) {
        const lat1 = -90 + (180 * i) / STEPS;
        const lat2 = -90 + (180 * (i + 1)) / STEPS;
        const a = lngLatToVec3(lng, lat1, RADIUS);
        const b = lngLatToVec3(lng, lat2, RADIUS);
        positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }

    // Parallels (every 30°)
    for (let lat = -60; lat <= 60; lat += 30) {
      for (let i = 0; i < STEPS; i++) {
        const lng1 = -180 + (360 * i) / STEPS;
        const lng2 = -180 + (360 * (i + 1)) / STEPS;
        const a = lngLatToVec3(lng1, lat, RADIUS);
        const b = lngLatToVec3(lng2, lat, RADIUS);
        positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, []);

  return (
    <lineSegments geometry={geometry}>
      {/* Boomitra's globe has no grid, but a barely-there meridian set keeps
          the silhouette feeling spherical at small sizes. Same teal as outlines
          so it disappears into the planet rather than competing. */}
      <lineBasicMaterial color="#D4FCFF" transparent opacity={0.06} />
    </lineSegments>
  );
}

// =====================================================================
// ANIMATED ARCS — flow from Mexico → US/Canada destinations
// =====================================================================
interface ArcProps {
  from: THREE.Vector3;
  to: THREE.Vector3;
  delay: number;
  cycleDuration: number;
}

function AnimatedArc({ from, to, delay, cycleDuration }: ArcProps) {
  const headRef = useRef<THREE.Mesh>(null);
  // 3 trailing comets behind the head with decreasing size + opacity
  const trail1Ref = useRef<THREE.Mesh>(null);
  const trail2Ref = useRef<THREE.Mesh>(null);
  const trail3Ref = useRef<THREE.Mesh>(null);

  const { curve, points, threeLine } = useMemo(() => {
    const c = buildArc(from, to, 0.5);
    const pts = c.getPoints(64);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    geo.setDrawRange(0, 0);
    const mat = new THREE.LineBasicMaterial({
      color: '#F59E0B',
      transparent: true,
      opacity: 0.95,
    });
    const line = new THREE.Line(geo, mat);
    return { curve: c, points: pts, threeLine: line };
  }, [from, to]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const local = ((t - delay) % cycleDuration) / cycleDuration;
    const progress = Math.max(0, Math.min(1, local));

    // Ease in/out
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    const drawCount = Math.floor(eased * points.length);
    threeLine.geometry.setDrawRange(0, drawCount);

    const visible = progress > 0.02 && progress < 0.98;

    if (headRef.current) {
      const tip = curve.getPoint(eased);
      headRef.current.position.copy(tip);
      headRef.current.visible = visible;
      const scale = 0.55 + 0.55 * Math.sin(progress * Math.PI);
      headRef.current.scale.setScalar(scale);
    }

    // Position the trailing "particles" slightly behind the head.
    const trailOffsets = [0.04, 0.075, 0.115];
    const trailRefs = [trail1Ref, trail2Ref, trail3Ref];
    trailRefs.forEach((ref, idx) => {
      if (!ref.current) return;
      const tEased = Math.max(0, eased - trailOffsets[idx]);
      const p = curve.getPoint(tEased);
      ref.current.position.copy(p);
      // Trail particles only visible once the head has had time to lead.
      ref.current.visible = visible && eased > trailOffsets[idx] + 0.01;
      const trailScale = (0.55 + 0.55 * Math.sin(progress * Math.PI)) * (1 - idx * 0.1);
      ref.current.scale.setScalar(trailScale);
    });
  });

  return (
    <group>
      <primitive object={threeLine} />
      {/* Bright head — leading the arc */}
      <mesh ref={headRef}>
        <sphereGeometry args={[0.055, 14, 14]} />
        <meshBasicMaterial color="#FFEFC8" />
      </mesh>
      {/* Trail particles */}
      <mesh ref={trail1Ref}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial color="#E8C088" transparent opacity={0.7} />
      </mesh>
      <mesh ref={trail2Ref}>
        <sphereGeometry args={[0.028, 10, 10]} />
        <meshBasicMaterial color="#F59E0B" transparent opacity={0.42} />
      </mesh>
      <mesh ref={trail3Ref}>
        <sphereGeometry args={[0.02, 10, 10]} />
        <meshBasicMaterial color="#F59E0B" transparent opacity={0.20} />
      </mesh>
    </group>
  );
}

// =====================================================================
// DESTINATION MARKER — pulsing dot at each arc destination
// =====================================================================
interface DestinationMarkerProps {
  position: THREE.Vector3;
  delay: number;
}

function DestinationMarker({ position, delay }: DestinationMarkerProps) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + delay;
    if (ringRef.current) {
      const phase = (Math.sin(t * 1.6) + 1) / 2; // 0..1
      const s = 1 + 0.7 * phase;
      ringRef.current.scale.setScalar(s);
      const m = ringRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.55 * (1 - phase);
    }
  });

  return (
    <group position={position}>
      {/* Solid core */}
      <mesh>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshBasicMaterial color="#F59E0B" />
      </mesh>
      {/* Pulsing halo */}
      <mesh ref={ringRef}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshBasicMaterial color="#F59E0B" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

// =====================================================================
// ORIGIN MARKER (Mexico) — pulsing dot
// =====================================================================
function OriginMarker({ position }: { position: THREE.Vector3 }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      const s = 1 + 0.4 * Math.sin(t * 2);
      ringRef.current.scale.setScalar(s);
      const m = ringRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.6 - 0.4 * ((Math.sin(t * 2) + 1) / 2);
    }
  });

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color="#F59E0B" />
      </mesh>
      <mesh ref={ringRef}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshBasicMaterial color="#F59E0B" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

// =====================================================================
// MAIN GLOBE GROUP
// =====================================================================
function GlobeContent() {
  const groupRef = useRef<THREE.Group>(null);

  const origin = useMemo(
    () => lngLatToVec3(MEXICO_ORIGIN[0], MEXICO_ORIGIN[1], RADIUS + 0.01),
    []
  );

  const arcs = useMemo(() => {
    return ARC_DESTINATIONS.map((dest, i) => {
      const to = lngLatToVec3(dest.coords[0], dest.coords[1], RADIUS + 0.01);
      return {
        from: origin,
        to,
        delay: i * 0.55,
        cycleDuration: 5.5,
      };
    });
  }, [origin]);

  // Mexico (lng=-100, lat=22.5) maps to (≈-0.16, 0.38, 0.91)·R — near +Z but high up.
  // Tilt the globe forward (+X rotation) so lat 22.5° lands closer to vertical center.
  const baseRotY = 0.05;
  const baseRotX = 0.35; // ≈ 20° forward tilt → Mexico drops to mid-screen

  // Gentle oscillation around the Americas
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      groupRef.current.rotation.y = baseRotY + Math.sin(t * 0.18) * 0.12;
      groupRef.current.rotation.x = baseRotX + Math.sin(t * 0.11) * 0.025;
    }
  });

  return (
    <group ref={groupRef} rotation={[baseRotX, baseRotY, 0]}>
      {/* Ocean — Boomitra-style flat dark teal sphere. No PBR/shading: it
          reads as a single solid colour so the continents pop crisply on top
          (identical recipe to Boomitra's d3 canvas globe). */}
      <mesh>
        <sphereGeometry args={[RADIUS * 0.995, 128, 128]} />
        <meshBasicMaterial color="#1B4D52" />
      </mesh>

      {/* Continent fills (#36757D) — sit just above the ocean shell */}
      <ContinentFills />

      {/* Single soft rim — Boomitra's globe has a faint glow at the edge
          where the sphere meets the page. One BackSide shell is enough; no
          gold/atmosphere layers. */}
      <mesh>
        <sphereGeometry args={[RADIUS * 1.04, 64, 64]} />
        <meshBasicMaterial
          color="#D4FCFF"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Continent outlines drawn over the fills for crisp edges */}
      <ContinentLines />
      <OriginMarker position={origin} />

      {arcs.map((arc, i) => (
        <AnimatedArc
          key={i}
          from={arc.from}
          to={arc.to}
          delay={arc.delay}
          cycleDuration={arc.cycleDuration}
        />
      ))}

      {/* Pulsing destination markers — each offset so they breathe out of sync */}
      {ARC_DESTINATIONS.map((d, i) => {
        const pos = lngLatToVec3(d.coords[0], d.coords[1], RADIUS + 0.01);
        return <DestinationMarker key={i} position={pos} delay={i * 0.55} />;
      })}
    </group>
  );
}

interface MetricsGlobeProps {
  height?: string | number;
}

export function MetricsGlobe({ height = '500px' }: MetricsGlobeProps) {
  return (
    <div style={{ width: '100%', height }} className="rounded-lg overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      >
        {/* Boomitra-style globe is intentionally flat (it uses 2D canvas).
            We use only ambient light so MeshBasicMaterial reads exactly as
            its hex colour, no shading, no specular highlight. */}
        <ambientLight intensity={1} />
        <GlobeContent />
      </Canvas>
    </div>
  );
}
