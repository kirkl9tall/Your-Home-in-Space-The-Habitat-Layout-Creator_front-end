import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { setTerrainSampler } from "./heightSampler";

type Props = {
  sizeM?: number;
  segments?: number;
  heightScale?: number;
  albedoUrl?: string;
  heightUrl?: string;
  normalUrl?: string;
  normalRepeat?: number;
  showGrid?: boolean;
};

export default function RealMarsTerrain({
  sizeM = 2000,
  segments = 512,
  heightScale = 120,
  showGrid = true,
}: Props) {
  const { gl } = useThree();

  // Create simple procedural textures for Mars terrain
  const albedo = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Create a Mars-like surface with some variation
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, '#b85c32');
    gradient.addColorStop(0.5, '#9c4f2a');
    gradient.addColorStop(1, '#7a3f22');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add some noise
    for (let i = 0; i < 1000; i++) {
      ctx.fillStyle = `rgba(${120 + Math.random() * 60}, ${50 + Math.random() * 30}, ${20 + Math.random() * 20}, 0.1)`;
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }, []);

  const height = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Create height variation
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, '#a0a0a0');
    gradient.addColorStop(0.7, '#808080');
    gradient.addColorStop(1, '#606060');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }, []);

  const normalMaybe: THREE.Texture | null = null; // No normal map to avoid loading errors

  const maxAniso = gl.capabilities.getMaxAnisotropy();
  const asSRGB = (t: THREE.Texture) => ((t as any).colorSpace = THREE.SRGBColorSpace);
  const asLinear = (t: THREE.Texture) => ((t as any).colorSpace = THREE.LinearSRGBColorSpace);

  // Configure texture properties
  if (albedo) { 
    albedo.wrapS = albedo.wrapT = THREE.RepeatWrapping; 
    asSRGB(albedo); 
    albedo.anisotropy = maxAniso; 
  }
  if (height) { 
    height.wrapS = height.wrapT = THREE.RepeatWrapping; 
    asLinear(height); 
    height.anisotropy = maxAniso; 
  }
  const normal = normalMaybe; // No normal map

  // Cache height pixels once (fast sampling)
  const heightData = useMemo(() => {
    if (!height?.image) return null;
    const img = height.image as HTMLImageElement | HTMLCanvasElement;
    const c = document.createElement("canvas");
    c.width = (img as HTMLImageElement).width;
    c.height = (img as HTMLImageElement).height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img as HTMLImageElement, 0, 0);
    const { data, width, height: h } = ctx.getImageData(0, 0, c.width, c.height);
    return { data, width, height: h };
  }, [height]);

  const sampleHeight01 = (u: number, v: number) => {
    if (!heightData) return 0.5;
    const { data, width, height } = heightData;
    const x = Math.max(0, Math.min(width - 1, u * (width - 1)));
    const y = Math.max(0, Math.min(height - 1, (1 - v) * (height - 1))); // flip Y
    const x0 = Math.floor(x), x1 = Math.min(width - 1, x0 + 1);
    const y0 = Math.floor(y), y1 = Math.min(height - 1, y0 + 1);
    const sx = x - x0, sy = y - y0;
    const idx = (xx: number, yy: number) => ((yy * width + xx) << 2);
    const h00 = data[idx(x0, y0)] / 255;
    const h10 = data[idx(x1, y0)] / 255;
    const h01 = data[idx(x0, y1)] / 255;
    const h11 = data[idx(x1, y1)] / 255;
    const h0 = h00 * (1 - sx) + h10 * sx;
    const h1 = h01 * (1 - sx) + h11 * sx;
    return h0 * (1 - sy) + h1 * sy;
  };

  useEffect(() => {
    const sampler = (x: number, z: number) => {
      const u = THREE.MathUtils.clamp(x / sizeM + 0.5, 0, 1);
      const v = THREE.MathUtils.clamp(z / sizeM + 0.5, 0, 1);
      const h01 = sampleHeight01(u, v);
      return (h01 - 0.5) * heightScale; // matches displacementBias
    };
    setTerrainSampler(sampler, sizeM, heightScale);
  }, [sizeM, heightScale, heightData]);

  const hasTextures = !!(albedo && height);

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow name="marsTerrain">
        <planeGeometry args={[sizeM, sizeM, segments, segments]} />
        {hasTextures ? (
          <meshStandardMaterial
            map={albedo}
            normalMap={normal ?? undefined}
            displacementMap={height}
            displacementScale={heightScale}
            displacementBias={-0.5 * heightScale}
            roughness={0.95}
            metalness={0.0}
          />
        ) : (
          <meshStandardMaterial color={0x9c4f2a} roughness={0.95} metalness={0} />
        )}
      </mesh>
      {showGrid && (
        <gridHelper args={[sizeM, 80, 0x6d3a25, 0x3b2218]} position={[0, 0.01, 0]} />
      )}
    </group>
  );
}