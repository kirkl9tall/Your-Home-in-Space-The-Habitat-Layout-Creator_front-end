import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Professional Mars surface specification
interface MarsSurfaceProps {
  onModulePlace?: (position: THREE.Vector3, moduleType: string) => void;
  width?: number;
  height?: number;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  showAtmosphere?: boolean;
  showStars?: boolean;
  enableShadows?: boolean;
}

// Advanced Perlin noise implementation for realistic terrain
class AdvancedNoise {
  private permutation: number[];
  
  constructor(seed: number = 42) {
    this.permutation = this.generatePermutation(seed);
  }
  
  private generatePermutation(seed: number): number[] {
    const p = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    
    // Shuffle using seed
    let rand = seed;
    for (let i = 255; i > 0; i--) {
      rand = (rand * 9301 + 49297) % 233280;
      const j = Math.floor((rand / 233280) * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    
    return [...p, ...p];
  }
  
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  
  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }
  
  private grad(hash: number, x: number, y: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
  
  noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    const u = this.fade(x);
    const v = this.fade(y);
    
    const A = this.permutation[X] + Y;
    const B = this.permutation[X + 1] + Y;
    
    return this.lerp(v,
      this.lerp(u, this.grad(this.permutation[A], x, y),
                   this.grad(this.permutation[B], x - 1, y)),
      this.lerp(u, this.grad(this.permutation[A + 1], x, y - 1),
                   this.grad(this.permutation[B + 1], x - 1, y - 1))
    );
  }
  
  octaveNoise(x: number, y: number, octaves: number, persistence: number): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      value += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    
    return value / maxValue;
  }
  
  ridgedNoise(x: number, y: number, octaves: number): number {
    return 1 - Math.abs(this.octaveNoise(x, y, octaves, 0.5));
  }
}

// Mars geological features generator
class MarsGeology {
  private noise: AdvancedNoise;
  
  constructor() {
    this.noise = new AdvancedNoise(12345);
  }
  
  generateHeight(x: number, z: number, terrainSize: number): number {
    const nx = x / terrainSize;
    const nz = z / terrainSize;
    
    // Base terrain with multiple octaves
    let height = 0;
    
    // Large-scale features (continental)
    height += this.noise.octaveNoise(nx * 0.5, nz * 0.5, 4, 0.6) * 800;
    
    // Medium-scale features (regional)
    height += this.noise.octaveNoise(nx * 2, nz * 2, 6, 0.5) * 200;
    
    // Small-scale features (local)
    height += this.noise.octaveNoise(nx * 8, nz * 8, 4, 0.4) * 50;
    
    // Ridged features for Mars-like erosion patterns
    height += this.noise.ridgedNoise(nx * 4, nz * 4, 3) * 100;
    
    // Olympus Mons-style shield volcano
    const volcanoDistance = Math.sqrt((nx - 0.3) ** 2 + (nz - 0.3) ** 2);
    if (volcanoDistance < 0.2) {
      const volcanoHeight = Math.pow(1 - volcanoDistance / 0.2, 2) * 600;
      height += volcanoHeight;
    }
    
    // Impact crater
    const craterDistance = Math.sqrt((nx + 0.2) ** 2 + (nz - 0.4) ** 2);
    if (craterDistance < 0.1) {
      const craterDepth = Math.pow(1 - craterDistance / 0.1, 1.5) * 150;
      height -= craterDepth;
      
      // Crater rim
      if (craterDistance > 0.07) {
        height += (craterDistance - 0.07) / 0.03 * 80;
      }
    }
    
    // Canyon system
    const canyonFactor = Math.abs(nz - 0.1 - Math.sin(nx * Math.PI * 3) * 0.05);
    if (canyonFactor < 0.02 && Math.abs(nx) < 0.6) {
      const canyonDepth = (0.02 - canyonFactor) / 0.02 * 120;
      height -= canyonDepth;
    }
    
    return Math.max(-100, height);
  }
  
  getMaterialType(height: number, slope: number): number {
    if (height < 50) return 0; // Lowland basalt
    if (height > 400) return 1; // Highland rock
    if (slope > 0.3) return 2; // Exposed bedrock
    if (height > 200) return 3; // Iron-rich regolith
    return 4; // Standard regolith
  }
}

// Professional Mars atmosphere system
class MarsAtmosphere {
  static createSkyShader(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        sunPosition: { value: new THREE.Vector3(-0.3, 0.4, 0.8) },
        rayleighCoeff: { value: new THREE.Vector3(5.5e-6, 13.0e-6, 22.4e-6) },
        mieCoeff: { value: 21e-6 },
        sunIntensity: { value: 22.0 },
        atmosphereRadius: { value: 6420000 },
        planetRadius: { value: 3390000 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vSunDirection;
        uniform vec3 sunPosition;
        
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          vSunDirection = normalize(sunPosition);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPosition;
        varying vec3 vSunDirection;
        uniform vec3 rayleighCoeff;
        uniform float mieCoeff;
        uniform float sunIntensity;
        uniform float atmosphereRadius;
        uniform float planetRadius;
        
        vec3 calculateScattering(vec3 rayDir, vec3 sunDir) {
          float mu = dot(rayDir, sunDir);
          float rayleighPhase = 3.0 / (16.0 * 3.14159) * (1.0 + mu * mu);
          float g = 0.76;
          float miePhase = 3.0 / (8.0 * 3.14159) * ((1.0 - g * g) * (1.0 + mu * mu)) / 
                          ((2.0 + g * g) * pow(1.0 + g * g - 2.0 * g * mu, 1.5));
          
          float height = length(vWorldPosition) - planetRadius;
          float hr = 8400.0; // Rayleigh scale height
          float hm = 1200.0; // Mie scale height
          
          float rayleighDensity = exp(-height / hr);
          float mieDensity = exp(-height / hm);
          
          vec3 rayleighScattering = rayleighCoeff * rayleighDensity * rayleighPhase;
          vec3 mieScattering = vec3(mieCoeff * mieDensity * miePhase);
          
          return (rayleighScattering + mieScattering) * sunIntensity;
        }
        
        void main() {
          vec3 rayDir = normalize(vWorldPosition);
          vec3 scattering = calculateScattering(rayDir, vSunDirection);
          
          // Mars atmosphere color (butterscotch/salmon)
          vec3 marsColor = vec3(0.8, 0.6, 0.4);
          scattering *= marsColor;
          
          // Height-based atmosphere density
          float height = max(0.0, rayDir.y);
          float atmosphereDensity = 1.0 - pow(height, 0.4);
          
          // Horizon glow
          float horizon = 1.0 - abs(rayDir.y);
          vec3 horizonColor = vec3(0.9, 0.7, 0.5) * pow(horizon, 3.0) * 0.3;
          
          vec3 finalColor = scattering * atmosphereDensity + horizonColor;
          
          // Add space background for upper atmosphere
          if (rayDir.y > 0.1) {
            finalColor = mix(finalColor, vec3(0.02, 0.01, 0.05), pow(rayDir.y - 0.1, 2.0));
          }
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.BackSide
    });
  }
}

// Main Mars Canvas Component
const ProfessionalMarsCanvas: React.FC<MarsSurfaceProps> = ({
  onModulePlace,
  width = 800,
  height = 600,
  quality = 'high',
  showAtmosphere = true,
  showStars = true,
  enableShadows = true
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const controlsRef = useRef<OrbitControls>();
  const terrainRef = useRef<THREE.Mesh>();
  const animationIdRef = useRef<number>();
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [stats, setStats] = useState({
    vertices: 0,
    terrain: '0km²',
    features: 'Loading...',
    atmosphere: 'Initializing...'
  });

  // Quality settings
  const qualitySettings = {
    low: { segments: 256, terrainSize: 5000, shadowMapSize: 1024, starCount: 2000 },
    medium: { segments: 512, terrainSize: 8000, shadowMapSize: 2048, starCount: 4000 },
    high: { segments: 1024, terrainSize: 12000, shadowMapSize: 4096, starCount: 8000 },
    ultra: { segments: 2048, terrainSize: 16000, shadowMapSize: 8192, starCount: 15000 }
  };
  
  const settings = qualitySettings[quality];
  
  // Professional terrain generation
  const createProfessionalTerrain = useCallback(() => {
    const geometry = new THREE.PlaneGeometry(
      settings.terrainSize, 
      settings.terrainSize, 
      settings.segments, 
      settings.segments
    );
    
    geometry.rotateX(-Math.PI / 2);
    
    const positions = geometry.attributes.position;
    const colors: number[] = [];
    const normals: number[] = [];
    
    const geology = new MarsGeology();
    const materials = [
      new THREE.Color(0x4a3428), // Lowland basalt
      new THREE.Color(0x8b6914), // Highland rock
      new THREE.Color(0x654321), // Exposed bedrock
      new THREE.Color(0xa0522d), // Iron-rich regolith
      new THREE.Color(0xcd853f)  // Standard regolith
    ];
    
    const heightData: number[][] = [];
    
    // Generate height data
    for (let i = 0; i <= settings.segments; i++) {
      heightData[i] = [];
      for (let j = 0; j <= settings.segments; j++) {
        const x = (i / settings.segments - 0.5) * settings.terrainSize;
        const z = (j / settings.segments - 0.5) * settings.terrainSize;
        heightData[i][j] = geology.generateHeight(x, z, settings.terrainSize);
      }
    }
    
    // Apply height data and calculate slopes
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      
      const gridX = Math.floor((x / settings.terrainSize + 0.5) * settings.segments);
      const gridZ = Math.floor((z / settings.terrainSize + 0.5) * settings.segments);
      
      let height = 0;
      if (gridX >= 0 && gridX < settings.segments && gridZ >= 0 && gridZ < settings.segments) {
        height = heightData[gridX][gridZ];
      }
      
      positions.setY(i, height);
      
      // Calculate slope for material selection
      let slope = 0;
      if (gridX > 0 && gridX < settings.segments - 1 && gridZ > 0 && gridZ < settings.segments - 1) {
        const dx = heightData[gridX + 1][gridZ] - heightData[gridX - 1][gridZ];
        const dz = heightData[gridX][gridZ + 1] - heightData[gridX][gridZ - 1];
        slope = Math.sqrt(dx * dx + dz * dz) / (settings.terrainSize / settings.segments * 2);
      }
      
      const materialType = geology.getMaterialType(height, slope);
      const color = materials[materialType];
      
      colors.push(color.r, color.g, color.b);
    }
    
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.1
    });
    
    const terrain = new THREE.Mesh(geometry, material);
    terrain.receiveShadow = enableShadows;
    terrain.castShadow = false;
    
    return { terrain, heightData };
  }, [settings, enableShadows]);
  
  // Professional star field
  const createStarField = useCallback(() => {
    if (!showStars) return null;
    
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(settings.starCount * 3);
    const starColors = new Float32Array(settings.starCount * 3);
    const starSizes = new Float32Array(settings.starCount);
    
    for (let i = 0; i < settings.starCount; i++) {
      const i3 = i * 3;
      
      // Spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 50000;
      
      starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i3 + 1] = radius * Math.cos(phi);
      starPositions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      // Realistic star colors and magnitudes
      const starType = Math.random();
      if (starType < 0.76) {
        // Main sequence (white/yellow)
        starColors[i3] = 1.0;
        starColors[i3 + 1] = 0.95 + Math.random() * 0.05;
        starColors[i3 + 2] = 0.8 + Math.random() * 0.2;
        starSizes[i] = 1 + Math.random() * 2;
      } else if (starType < 0.9) {
        // Blue giants
        starColors[i3] = 0.7 + Math.random() * 0.3;
        starColors[i3 + 1] = 0.8 + Math.random() * 0.2;
        starColors[i3 + 2] = 1.0;
        starSizes[i] = 2 + Math.random() * 4;
      } else {
        // Red giants
        starColors[i3] = 1.0;
        starColors[i3 + 1] = 0.4 + Math.random() * 0.3;
        starColors[i3 + 2] = 0.2 + Math.random() * 0.3;
        starSizes[i] = 1.5 + Math.random() * 3;
      }
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    
    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float time;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // Subtle twinkling effect
          float twinkle = sin(time * 0.001 + position.x * 0.0001) * 0.3 + 0.7;
          
          gl_PointSize = size * twinkle;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float distance = length(gl_PointCoord - vec2(0.5));
          if (distance > 0.5) discard;
          
          float alpha = 1.0 - smoothstep(0.0, 0.5, distance);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    
    return new THREE.Points(starGeometry, starMaterial);
  }, [showStars, settings.starCount]);

  // Professional lighting system
  const createLightingSystem = useCallback((scene: THREE.Scene) => {
    // Sun (primary light source)
    const sunLight = new THREE.DirectionalLight(0xfff4e6, 3.0);
    sunLight.position.set(-5000, 3000, 2000);
    sunLight.castShadow = enableShadows;
    
    if (enableShadows) {
      sunLight.shadow.mapSize.width = settings.shadowMapSize;
      sunLight.shadow.mapSize.height = settings.shadowMapSize;
      sunLight.shadow.camera.near = 1;
      sunLight.shadow.camera.far = 15000;
      sunLight.shadow.camera.left = -8000;
      sunLight.shadow.camera.right = 8000;
      sunLight.shadow.camera.top = 8000;
      sunLight.shadow.camera.bottom = -8000;
      sunLight.shadow.bias = -0.0001;
    }
    
    scene.add(sunLight);
    
    // Fill light (bounced light from atmosphere)
    const fillLight = new THREE.DirectionalLight(0xe6b894, 0.5);
    fillLight.position.set(2000, 1000, -3000);
    scene.add(fillLight);
    
    // Ambient light (space environment)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
    scene.add(ambientLight);
    
    // Atmospheric glow
    if (showAtmosphere) {
      const atmosphereGeometry = new THREE.SphereGeometry(30000, 64, 32);
      const atmosphereMaterial = MarsAtmosphere.createSkyShader();
      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      scene.add(atmosphere);
    }
  }, [enableShadows, showAtmosphere, settings.shadowMapSize]);

  // Module placement system
  const getTerrainHeight = useCallback((x: number, z: number): number => {
    if (!terrainRef.current) return 0;
    
    const raycaster = new THREE.Raycaster();
    raycaster.set(new THREE.Vector3(x, 1000, z), new THREE.Vector3(0, -1, 0));
    
    const intersects = raycaster.intersectObject(terrainRef.current);
    return intersects.length > 0 ? intersects[0].point.y : 0;
  }, []);

  // Initialize scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x8b6914, 8000, 25000);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      1,
      100000
    );
    camera.position.set(-2000, 800, 1500);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = enableShadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Create terrain
    const { terrain, heightData } = createProfessionalTerrain();
    terrainRef.current = terrain;
    scene.add(terrain);

    // Create star field
    const stars = createStarField();
    if (stars) scene.add(stars);

    // Setup lighting
    createLightingSystem(scene);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 100;
    controls.maxDistance = 15000;
    controls.maxPolarAngle = Math.PI / 2.2;
    controlsRef.current = controls;

    // Update stats
    setStats({
      vertices: (settings.segments + 1) * (settings.segments + 1),
      terrain: `${(settings.terrainSize / 1000).toFixed(1)}km²`,
      features: 'Olympus Mons, Impact Crater, Canyon System, Ridged Plains',
      atmosphere: showAtmosphere ? 'Mars Atmospheric Scattering' : 'Space Environment'
    });

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      if (stars && stars.material instanceof THREE.ShaderMaterial) {
        stars.material.uniforms.time.value = performance.now();
      }
      
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    setIsLoaded(true);

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [createProfessionalTerrain, createStarField, createLightingSystem, settings, enableShadows, showAtmosphere]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !mountRef.current) return;
      
      cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mountRef} 
        className="w-full h-full"
        style={{ width, height }}
      />
      
      {/* Professional UI Overlay */}
      <div className="absolute top-4 left-4 bg-black/70 text-white p-4 rounded-lg font-mono text-sm">
        <div className="text-orange-400 font-bold mb-2">MARS SURFACE ANALYSIS</div>
        <div>Vertices: {stats.vertices.toLocaleString()}</div>
        <div>Terrain: {stats.terrain}</div>
        <div>Quality: {quality.toUpperCase()}</div>
        <div>Features: {stats.features}</div>
        <div>Atmosphere: {stats.atmosphere}</div>
        <div className="mt-2 text-orange-300">
          {isLoaded ? '● SURFACE READY' : '● INITIALIZING...'}
        </div>
      </div>
      
      {/* Controls Help */}
      <div className="absolute bottom-4 right-4 bg-black/70 text-white p-3 rounded-lg font-mono text-xs">
        <div className="text-orange-400 mb-1">CONTROLS</div>
        <div>Mouse: Orbit Camera</div>
        <div>Wheel: Zoom</div>
        <div>Drag: Pan View</div>
      </div>
    </div>
  );
};

export default ProfessionalMarsCanvas;