"use client";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { Sky, OrbitControls } from "@react-three/drei";
import React from "react";

function Atmosphere() {
  const { scene } = useThree();
  React.useEffect(() => {
    scene.fog = new THREE.FogExp2(0x120d0a, 0.0011); // dusty haze
    return () => { scene.fog = null as any; };
  }, [scene]);
  return null;
}

export default function SceneFrame({ children }: { children: React.ReactNode }) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        (gl as any).outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.15;
      }}
      shadows
      camera={{ fov: 55, near: 0.1, far: 200000, position: [-420, 320, 520] }}
    >
      <Sky
        distance={450000}
        sunPosition={[-400, 350, 120]}
        turbidity={10}
        rayleigh={1.8}
        mieCoefficient={0.008}
        mieDirectionalG={0.9}
      />
      <Atmosphere />

      <ambientLight intensity={0.3} />
      <directionalLight
        position={[-400, 350, 120]}
        intensity={1.25}
        color={0xfff4e6}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <OrbitControls enableDamping dampingFactor={0.06} minDistance={20} maxDistance={50000} maxPolarAngle={Math.PI / 1.95} />

      {children}
    </Canvas>
  );
}
