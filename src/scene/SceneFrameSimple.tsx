import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Sky, Stars, OrbitControls } from "@react-three/drei";
import { Suspense } from "react";

export default function SceneFrame({ children }: { children: React.ReactNode }) {
  return (
    <Canvas
      camera={{ position: [-420, 320, 520], fov: 55 }}
      gl={{ 
        antialias: true, 
        powerPreference: "high-performance",
        alpha: false 
      }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
      shadows
    >
      <Suspense fallback={null}>
        <Sky
          distance={450000}
          sunPosition={[0.4, 0.25, 0.1]}
          mieCoefficient={0.004}
          mieDirectionalG={0.8}
          rayleigh={0.3}
          turbidity={1.1}
        />
        <Stars radius={2000} depth={50} fade />

        <ambientLight intensity={0.3} />
        <directionalLight position={[300, 500, 200]} intensity={1.0} castShadow />

        <OrbitControls 
          enableDamping 
          dampingFactor={0.05}
          minDistance={80}
          maxDistance={2400}
          maxPolarAngle={Math.PI / 1.95}
          target={[0, 0, 0]}
        />

        {children}
      </Suspense>
    </Canvas>
  );
}