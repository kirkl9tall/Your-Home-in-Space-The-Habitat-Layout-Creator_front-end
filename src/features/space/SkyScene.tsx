import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface SkySceneProps {
  seed?: number;
  starCount?: number;
  far?: number;
  sunDirection?: [number, number, number];
  className?: string;
}

// Starfield component that creates the points
function Starfield({ 
  seed = 42, 
  starCount = 8000, 
  far = 1000 
}: { 
  seed: number; 
  starCount: number; 
  far: number; 
}) {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Memoized star geometry and material
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    
    // Seeded random number generator for consistent star patterns
    const seedRandom = (seed: number) => {
      let x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
    
    let seedValue = seed;
    
    for (let i = 0; i < starCount; i++) {
      // Spherical distribution for natural star field
      const radius = far * 0.8 + (seedRandom(seedValue++) * far * 0.2);
      const theta = seedRandom(seedValue++) * Math.PI * 2;
      const phi = Math.acos(2 * seedRandom(seedValue++) - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Vary star brightness and color temperature
      const brightness = 0.3 + seedRandom(seedValue++) * 0.7;
      const temp = seedRandom(seedValue++);
      
      if (temp > 0.8) {
        // Blue-white stars
        colors[i * 3] = brightness * 0.8;
        colors[i * 3 + 1] = brightness * 0.9;
        colors[i * 3 + 2] = brightness;
      } else if (temp > 0.6) {
        // White stars
        colors[i * 3] = brightness;
        colors[i * 3 + 1] = brightness;
        colors[i * 3 + 2] = brightness;
      } else if (temp > 0.3) {
        // Yellow stars
        colors[i * 3] = brightness;
        colors[i * 3 + 1] = brightness * 0.9;
        colors[i * 3 + 2] = brightness * 0.7;
      } else {
        // Red stars
        colors[i * 3] = brightness;
        colors[i * 3 + 1] = brightness * 0.6;
        colors[i * 3 + 2] = brightness * 0.4;
      }
    }
    
    return { positions, colors };
  }, [seed, starCount, far]);
  
  // Gentle twinkling animation
  useFrame((state) => {
    if (pointsRef.current) {
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.6 + 0.2 * Math.sin(state.clock.elapsedTime * 0.5);
    }
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        sizeAttenuation={false}
        vertexColors={true}
        transparent={true}
        opacity={0.8}
      />
    </points>
  );
}

// Optional sun sprite
function Sun({ direction }: { direction: [number, number, number] }) {
  const sunRef = useRef<THREE.Sprite>(null);
  
  useFrame((state) => {
    if (sunRef.current) {
      // Gentle pulsing effect
      const scale = 50 + 10 * Math.sin(state.clock.elapsedTime * 0.3);
      sunRef.current.scale.setScalar(scale);
    }
  });
  
  const sunPosition = useMemo(() => {
    const [x, y, z] = direction;
    const length = Math.sqrt(x * x + y * y + z * z);
    return [
      (x / length) * 800,
      (y / length) * 800,
      (z / length) * 800
    ] as [number, number, number];
  }, [direction]);
  
  return (
    <sprite ref={sunRef} position={sunPosition}>
      <spriteMaterial
        map={null}
        color="#FFA500"
        transparent={true}
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  );
}

export function SkyScene({
  seed = 42,
  starCount = 8000,
  far = 1000,
  sunDirection = [1, 0.5, 0.2],
  className = ""
}: SkySceneProps) {
  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ 
          position: [0, 0, 10], 
          fov: 60,
          far: far * 1.2
        }}
        style={{ background: '#000000' }}
      >
        <OrbitControls
          enableDamping={true}
          dampingFactor={0.05}
          enablePan={false}
          enableZoom={true}
          minDistance={5}
          maxDistance={100}
        />
        
        <Starfield 
          seed={seed}
          starCount={starCount}
          far={far}
        />
        
        {sunDirection && (
          <Sun direction={sunDirection} />
        )}
        
        {/* Ambient light to prevent complete darkness */}
        <ambientLight intensity={0.1} color="#ffffff" />
      </Canvas>
    </div>
  );
}