import * as THREE from "three";
import { useEffect } from "react";
import { setTerrainSampler } from "./heightSampler";

export default function SimpleMarsGround({
  sizeM = 2000,
  heightScale = 120
}: {
  sizeM?: number;
  heightScale?: number;
}) {
  // Provide a simple flat sampler for testing
  useEffect(() => {
    const sampler = (x: number, z: number) => {
      // Simple sine wave terrain for testing
      const height = Math.sin(x * 0.01) * Math.cos(z * 0.01) * heightScale * 0.1;
      return height;
    };
    setTerrainSampler(sampler, sizeM, heightScale);
  }, [sizeM, heightScale]);

  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[sizeM, sizeM, 64, 64]} />
      <meshStandardMaterial
        color="#cd853f" // Mars rust color
        roughness={1.0}
        metalness={0.0}
      />
    </mesh>
  );
}