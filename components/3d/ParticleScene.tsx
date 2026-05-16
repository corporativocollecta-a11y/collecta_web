'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function ParticlesContent() {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate particle positions once
  const positions = useMemo(() => {
    const count = 800;
    const arr = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 4;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 3;

      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = height;
      arr[i * 3 + 2] = Math.sin(angle) * radius;
    }

    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.1;
      pointsRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={positions.length / 3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#6B5D52"
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

interface ParticleSceneProps {
  height?: string | number;
}

export function ParticleScene({ height = '400px' }: ParticleSceneProps) {
  return (
    <div style={{ width: '100%', height }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'low-power',
        }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <ParticlesContent />
      </Canvas>
    </div>
  );
}
