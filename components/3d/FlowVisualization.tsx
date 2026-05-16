'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';

// Stage representation - cada etapa del proceso
function FlowStage({
  position,
  color,
  scale = 1,
  delay = 0,
}: {
  position: [number, number, number];
  color: string;
  scale?: number;
  delay?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime() + delay;
      meshRef.current.rotation.y = t * 0.3;
      meshRef.current.position.y = position[1] + Math.sin(t * 0.8) * 0.15;
    }
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <icosahedronGeometry args={[0.6, 1]} />
      <meshStandardMaterial
        color={color}
        roughness={0.3}
        metalness={0.6}
        emissive={color}
        emissiveIntensity={0.15}
      />
    </mesh>
  );
}

// Connecting beam between stages
function FlowConnection({
  start,
  end,
  color,
}: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
}) {
  const lineRef = useRef<THREE.Line>(null);

  const points = useMemo(() => {
    return [
      new THREE.Vector3(...start),
      new THREE.Vector3(...end),
    ];
  }, [start, end]);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  useFrame(({ clock }) => {
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      material.opacity = 0.3 + Math.sin(clock.getElapsedTime() * 2) * 0.2;
    }
  });

  return (
    <primitive
      ref={lineRef}
      object={new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 })
      )}
    />
  );
}

// Particle stream flowing along the path
function FlowParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 80;

  const positions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3] = -6 + (i / particleCount) * 12;
      arr[i * 3 + 1] = Math.sin(i * 0.5) * 0.3;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      const t = clock.getElapsedTime();
      const positionAttr = pointsRef.current.geometry.attributes.position;

      for (let i = 0; i < particleCount; i++) {
        const x = ((i / particleCount) * 12 - 6 + t * 1.5) % 12 - 6;
        positionAttr.array[i * 3] = x;
        positionAttr.array[i * 3 + 1] = Math.sin(x * 0.8 + t) * 0.3;
      }
      positionAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={particleCount}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#F59E0B"
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function FlowScene() {
  // 5 stages: siembra, producción, cosecha, empaque, distribución
  const stages: {
    position: [number, number, number];
    color: string;
    delay: number;
  }[] = [
    { position: [-5, 0, 0], color: '#8B7D6B', delay: 0 },     // siembra (terroso)
    { position: [-2.5, 0, 0], color: '#A89E8D', delay: 0.5 },  // producción
    { position: [0, 0, 0], color: '#F59E0B', delay: 1 },       // cosecha (acento)
    { position: [2.5, 0, 0], color: '#A89E8D', delay: 1.5 },   // empaque
    { position: [5, 0, 0], color: '#8B7D6B', delay: 2 },       // distribución
  ];

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-5, 5, 5]} intensity={0.3} color="#F59E0B" />
      <pointLight position={[5, 5, 5]} intensity={0.3} color="#8B7D6B" />

      {/* Stages */}
      {stages.map((stage, i) => (
        <Float key={i} speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
          <FlowStage {...stage} />
        </Float>
      ))}

      {/* Connections */}
      {stages.slice(0, -1).map((stage, i) => (
        <FlowConnection
          key={`conn-${i}`}
          start={stage.position}
          end={stages[i + 1].position}
          color="#F59E0B"
        />
      ))}

      {/* Flowing particles */}
      <FlowParticles />
    </>
  );
}

interface FlowVisualizationProps {
  height?: string | number;
}

export function FlowVisualization({ height = '500px' }: FlowVisualizationProps) {
  return (
    <div style={{ width: '100%', height }} className="rounded-lg overflow-hidden">
      <Canvas
        camera={{ position: [0, 2, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <FlowScene />
      </Canvas>
    </div>
  );
}
