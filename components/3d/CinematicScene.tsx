'use client';

import React, { Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';

interface CinematicSceneProps {
  children: React.ReactNode;
  autoRotate?: boolean;
  cameraPosition?: [number, number, number];
  loading?: React.ReactNode;
}

export function CinematicScene({
  children,
  autoRotate = false,
  cameraPosition = [5, 5, 8],
  loading = null,
}: CinematicSceneProps) {
  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: cameraPosition, fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full"
      >
        <PerspectiveCamera makeDefault position={cameraPosition} fov={50} />

        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 8]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <OrbitControls
          autoRotate={autoRotate}
          autoRotateSpeed={2}
          enableZoom={true}
          enableDamping={true}
          dampingFactor={0.05}
          maxDistance={100}
          minDistance={2}
        />

        <Suspense fallback={null}>
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
}
