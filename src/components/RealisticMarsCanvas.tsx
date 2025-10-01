import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Realistic Mars terrain noise functions
const noise = {
  simplex2: (x: number, y: number): number => {
    // Multi-octave noise for realistic Mars terrain
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    
    for (let i = 0; i < 4; i++) {
      value += amplitude * Math.sin(x * frequency * 12.9898 + y * frequency * 78.233) * 0.5;
      amplitude *= 0.5;
      frequency *= 2;
    }
    
    return Math.max(-1, Math.min(1, value));
  },
  
  ridgedNoise: (x: number, y: number): number => {
    return 1 - Math.abs(noise.simplex2(x, y));
  }
};

export type RealisticMarsCanvasProps = {
  terrainSize?: number;
  segments?: number;
  heightScale?: number;
  showGrid?: boolean;
  onModulePlace?: (moduleData: {
    id: string;
    type: string;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
  }) => void;
};

// Mars geological materials
const MARS_MATERIALS = {
  basalt: { color: 0x2a1a0f, roughness: 0.95, metalness: 0.1 },
  ironOxide: { color: 0x8b4513, roughness: 0.9, metalness: 0.05 },
  sandstone: { color: 0xd2b48c, roughness: 0.8, metalness: 0.02 },
  volcanic: { color: 0x1a0f0a, roughness: 1.0, metalness: 0.0 },
  ice: { color: 0xe8f2ff, roughness: 0.1, metalness: 0.8 }
};

// Module configuration
const MODULE_TYPES = {
  crew: { color: 0x4a90e2, geometry: [4, 2.5, 6] },
  lab: { color: 0x7ed321, geometry: [3, 3, 3, 8] }, // cylinder
  storage: { color: 0xf5a623, geometry: [2.5, 2.5, 2.5] },
  power: { color: 0xd0021b, geometry: [3, 2, 3] },
  default: { color: 0x9013fe, geometry: [3, 2, 3] }
};

let moduleIdCounter = 0;
const generateModuleId = () => `mars_module_${Date.now()}_${++moduleIdCounter}`;

// Terrain height sampler for precise module placement
let globalTerrainSampler: ((x: number, z: number) => number) | null = null;

export const getTerrainHeight = (x: number, z: number): number => {
  return globalTerrainSampler ? globalTerrainSampler(x, z) : 0;
};

const RealisticMarsCanvas: React.FC<RealisticMarsCanvasProps> = ({
  onModulePlace,
  terrainSize = 10000, // 10km x 10km main terrain
  segments = 1024,
  heightScale = 800,
  showGrid = false
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const controlsRef = useRef<OrbitControls>();
  const terrainRef = useRef<THREE.Mesh>();
  const animationIdRef = useRef<number>();
  const placedModulesRef = useRef<THREE.Group>(new THREE.Group());
  
  const [isLoaded, setIsLoaded] = useState(false);

  // Create realistic Mars terrain with geological features
  const createMarsTerrainGeometry = () => {
    const geometry = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    const colors: number[] = [];
    const vertex = new THREE.Vector3();

    // Create height sampler function
    const createHeightSampler = () => {
      const heightData: number[][] = [];
      
      // Initialize height grid
      for (let i = 0; i <= segments; i++) {
        heightData[i] = [];
        for (let j = 0; j <= segments; j++) {
          heightData[i][j] = 0;
        }
      }

      // Generate terrain features
      for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i);
        
        const x = vertex.x / terrainSize;
        const z = vertex.z / terrainSize;
        
        let height = 0;

        // Base Mars terrain - realistic rolling hills and plains
        height += noise.simplex2(x * 2, z * 2) * heightScale * 0.3;
        height += noise.simplex2(x * 6, z * 6) * heightScale * 0.15;
        height += noise.ridgedNoise(x * 4, z * 4) * heightScale * 0.2;
        
        // 1. Gentle volcanic shield (Olympus Mons style - more realistic)
        const volcX = x - 0.1;
        const volcZ = z - 0.1;
        const volcDist = Math.sqrt(volcX * volcX + volcZ * volcZ);
        if (volcDist < 0.3) {
          const volcHeight = Math.pow(1 - volcDist / 0.3, 3) * heightScale * 0.8;
          height += volcHeight;
        }

        // 2. Subtle impact crater
        const craterX = x + 0.2;
        const craterZ = z + 0.3;
        const craterDist = Math.sqrt(craterX * craterX + craterZ * craterZ);
        if (craterDist < 0.15) {
          if (craterDist < 0.1) {
            height -= (0.1 - craterDist) / 0.1 * heightScale * 0.3;
          } else {
            height += (craterDist - 0.1) / 0.05 * heightScale * 0.1;
          }
        }

        // 3. Small canyon system
        if (Math.abs(z + 0.05) < 0.03 && Math.abs(x) < 0.4) {
          const canyonDepth = (0.03 - Math.abs(z + 0.05)) / 0.03 * heightScale * 0.25;
          height -= canyonDepth;
        }

        // 4. Small scattered craters (more realistic)
        const smallCraters = [
          { x: 0.15, z: 0.25, size: 0.08, depth: 0.2 },
          { x: -0.3, z: 0.1, size: 0.06, depth: 0.15 },
          { x: 0.4, z: -0.2, size: 0.05, depth: 0.1 },
          { x: -0.1, z: -0.35, size: 0.07, depth: 0.18 }
        ];

        smallCraters.forEach(crater => {
          const craterX = (x - crater.x) / crater.size;
          const craterZ = (z - crater.z) / crater.size;
          const craterDist = Math.sqrt(craterX * craterX + craterZ * craterZ);
          
          if (craterDist < 1.0) {
            const craterDepth = Math.pow(1.0 - craterDist, 2) * heightScale * crater.depth;
            height -= craterDepth;
          }
        });

        // 5. Mesa formations (Colorado Plateau style)
        const mesas = [
          { x: 0.15, z: -0.15, size: 0.3 },
          { x: -0.6, z: 0.4, size: 0.25 },
          { x: 0.5, z: 0.8, size: 0.2 }
        ];

        mesas.forEach(mesa => {
          const mesaX = (x - mesa.x) / mesa.size;
          const mesaZ = (z - mesa.z) / mesa.size;
          const mesaDist = Math.sqrt(mesaX * mesaX + mesaZ * mesaZ);
          
          if (mesaDist < 1.0) {
            if (mesaDist < 0.6) {
              // Flat mesa top
              height = Math.max(height, heightScale * 0.8);
            } else if (mesaDist < 1.0) {
              // Mesa slopes
              const slopeHeight = (1.0 - mesaDist) * heightScale * 0.6;
              height = Math.max(height, height + slopeHeight);
            }
          }
        });

        // 6. Regional terrain variation
        height += Math.sin(x * Math.PI * 3) * Math.cos(z * Math.PI * 2) * heightScale * 0.3;
        height += Math.sin(x * Math.PI * 8) * Math.cos(z * Math.PI * 6) * heightScale * 0.15;
        height += Math.sin(x * Math.PI * 20) * Math.cos(z * Math.PI * 25) * heightScale * 0.08;

        // 7. Polar ice caps
        if (z > 0.6 || z < -0.6) {
          const iceThickness = Math.abs(z) - 0.6;
          height += iceThickness * heightScale * 0.4;
        }

        positions.setY(i, height);
        
        // Store in height grid for sampler
        const col = Math.floor((i % (segments + 1)));
        const row = Math.floor(i / (segments + 1));
        if (row < heightData.length && col < heightData[row].length) {
          heightData[row][col] = height;
        }
      }

      // Create sampler function
      return (worldX: number, worldZ: number) => {
        const normalizedX = (worldX / terrainSize + 0.5) * segments;
        const normalizedZ = (worldZ / terrainSize + 0.5) * segments;
        
        const col = Math.max(0, Math.min(segments, Math.floor(normalizedX)));
        const row = Math.max(0, Math.min(segments, Math.floor(normalizedZ)));
        
        return heightData[row] ? (heightData[row][col] || 0) : 0;
      };
    };

    // Generate terrain and create sampler
    globalTerrainSampler = createHeightSampler();

    // Generate realistic geological colors
    for (let i = 0; i < positions.count; i++) {
      const height = positions.getY(i);
      const x = positions.getX(i);
      const z = positions.getZ(i);

      const normalizedHeight = (height + heightScale * 2) / (heightScale * 4);
      
      let color = new THREE.Color(0xcd853f); // Base Mars color

      // Geological color mapping
      if (normalizedHeight < 0.2) {
        // Deep areas - dark basalt
        color = new THREE.Color(MARS_MATERIALS.basalt.color);
      } else if (normalizedHeight < 0.4) {
        // Mid-low areas - iron oxide
        color = new THREE.Color(MARS_MATERIALS.ironOxide.color);
      } else if (normalizedHeight > 0.8) {
        // High areas - exposed sandstone
        color = new THREE.Color(MARS_MATERIALS.sandstone.color);
      }

      // Ice caps
      if (Math.abs(z) > terrainSize * 0.3 && normalizedHeight > 0.6) {
        color.lerp(new THREE.Color(MARS_MATERIALS.ice.color), 0.5);
      }

      // Add geological noise
      const noise = (Math.random() - 0.5) * 0.1;
      color.r = Math.max(0, Math.min(1, color.r + noise));
      color.g = Math.max(0, Math.min(1, color.g + noise * 0.5));
      color.b = Math.max(0, Math.min(1, color.b + noise * 0.3));

      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    return geometry;
  };

  // Create module mesh
  const createModuleMesh = (type: string) => {
    const moduleType = MODULE_TYPES[type as keyof typeof MODULE_TYPES] || MODULE_TYPES.default;
    
    let geometry: THREE.BufferGeometry;
    if (moduleType.geometry.length === 4) {
      // Cylinder for lab
      const [radius, height, radialSegments] = moduleType.geometry as [number, number, number, number];
      geometry = new THREE.CylinderGeometry(radius, radius, height, radialSegments);
    } else {
      // Box for others
      const [width, height, depth] = moduleType.geometry as [number, number, number];
      geometry = new THREE.BoxGeometry(width, height, depth);
    }

    const material = new THREE.MeshStandardMaterial({
      color: moduleType.color,
      roughness: 0.6,
      metalness: 0.3
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { type, id: generateModuleId() };

    return mesh;
  };

  // Create realistic rock field
  const createRockField = (scene: THREE.Scene) => {
    const rockTypes = [
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.DodecahedronGeometry(1, 0),
      new THREE.BoxGeometry(1, 0.7, 1.3),
      new THREE.OctahedronGeometry(1, 0)
    ];

    const rockMaterials = Object.values(MARS_MATERIALS).map(mat => 
      new THREE.MeshStandardMaterial(mat)
    );

    for (let i = 0; i < 500; i++) {
      const rockGeometry = rockTypes[Math.floor(Math.random() * rockTypes.length)];
      const rockMaterial = rockMaterials[Math.floor(Math.random() * rockMaterials.length)];
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);

      // Position rocks realistically
      const x = (Math.random() - 0.5) * terrainSize * 0.9;
      const z = (Math.random() - 0.5) * terrainSize * 0.9;
      const y = getTerrainHeight(x, z);

      // Size distribution - mostly small with some large boulders
      const scale = Math.pow(Math.random(), 1.5) * 4 + 0.3;
      rock.scale.set(
        scale * (0.8 + Math.random() * 0.4),
        scale * (0.6 + Math.random() * 0.4),
        scale * (0.9 + Math.random() * 0.2)
      );

      rock.position.set(x, y, z);
      rock.rotation.set(
        Math.random() * Math.PI * 0.2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 0.2
      );

      rock.castShadow = true;
      rock.receiveShadow = true;

      scene.add(rock);
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Deep space black
    sceneRef.current = scene;

    // Camera setup for MASSIVE landscape viewing
    const camera = new THREE.PerspectiveCamera(
      65, // Even wider field of view for epic landscapes
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      100000 // Extended far plane to see distant mountains and terrain
    );
    camera.position.set(-500, 300, 400);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: false,
      powerPreference: "high-performance"
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Advanced rendering settings
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Create REALISTIC Mars sky dome with space environment
    const skyGeometry = new THREE.SphereGeometry(25000, 64, 32);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x000000) }, // Pure black space
        horizonColor: { value: new THREE.Color(0x1a0e0a) }, // Very dark reddish horizon
        sunDirection: { value: new THREE.Vector3(-0.5, 0.4, 0.2) },
        atmosphereThickness: { value: 0.02 } // Very thin Mars atmosphere
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        uniform vec3 sunDirection;
        uniform float atmosphereThickness;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        
        void main() {
          vec3 direction = normalize(vWorldPosition);
          
          // Height above horizon (0 = horizon, 1 = zenith)
          float height = max(0.0, direction.y);
          
          // Distance from sun
          float sunDistance = dot(direction, sunDirection);
          
          // Atmospheric scattering effect (very subtle for Mars)
          float scattering = pow(max(0.0, sunDistance), 8.0) * atmosphereThickness;
          
          // Horizon glow (very faint)
          float horizonGlow = pow(1.0 - height, 4.0) * 0.1;
          
          // Mix colors
          vec3 skyColor = mix(horizonColor, topColor, height);
          
          // Add subtle sun glow
          skyColor += vec3(0.3, 0.2, 0.1) * scattering;
          
          // Add horizon atmosphere
          skyColor += vec3(0.2, 0.1, 0.05) * horizonGlow;
          
          gl_FragColor = vec4(skyColor, 1.0);
        }
      `,
      side: THREE.BackSide
    });
    
    const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skyDome);

    // Create realistic star field with proper distribution
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 8000;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      
      // Distribute stars in celestial sphere
      const radius = 20000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1); // Uniform distribution on sphere
      
      starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i3 + 1] = radius * Math.cos(phi);
      starPositions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      // Realistic star colors (most are white, some blue/red giants)
      const starType = Math.random();
      if (starType < 0.7) {
        // White stars (most common)
        starColors[i3] = 1.0;
        starColors[i3 + 1] = 1.0;
        starColors[i3 + 2] = 1.0;
      } else if (starType < 0.85) {
        // Blue giants
        starColors[i3] = 0.8;
        starColors[i3 + 1] = 0.9;
        starColors[i3 + 2] = 1.0;
      } else {
        // Red giants
        starColors[i3] = 1.0;
        starColors[i3 + 1] = 0.7;
        starColors[i3 + 2] = 0.6;
      }
      
      // Realistic star magnitude distribution
      starSizes[i] = Math.pow(Math.random(), 3) * 8 + 1; // Power law distribution
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    
    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float distance = length(gl_PointCoord - vec2(0.5));
          if (distance > 0.5) discard;
          
          float alpha = 1.0 - smoothstep(0.1, 0.5, distance);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Add distant Mars moons - Phobos and Deimos
    const phobosGeometry = new THREE.SphereGeometry(8, 16, 8);
    const phobosMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4a3428,
      roughness: 0.9,
      metalness: 0.1
    });
    const phobos = new THREE.Mesh(phobosGeometry, phobosMaterial);
    phobos.position.set(15000, 8000, -12000);
    scene.add(phobos);

    const deimosGeometry = new THREE.SphereGeometry(4, 12, 6);
    const deimosMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3a2a1f,
      roughness: 0.95,
      metalness: 0.05
    });
    const deimos = new THREE.Mesh(deimosGeometry, deimosMaterial);
    deimos.position.set(-18000, 12000, 16000);
    scene.add(deimos);

    // Enhanced lighting system for MASSIVE Mars landscape
    const sunLight = new THREE.DirectionalLight(0xfff4e6, 6.0); // Slightly warmer sunlight
    sunLight.position.set(-2000, 1500, 800);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 8192; // Higher resolution shadows for massive terrain
    sunLight.shadow.mapSize.height = 8192;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 15000; // Extended shadow distance
    sunLight.shadow.camera.left = -8000; // Larger shadow area
    sunLight.shadow.camera.right = 8000;
    sunLight.shadow.camera.top = 8000;
    sunLight.shadow.camera.bottom = -8000;
    sunLight.shadow.bias = -0.0001;
    scene.add(sunLight);

    // Secondary fill light to illuminate distant mountains
    const fillLight = new THREE.DirectionalLight(0x4a3428, 1.5);
    fillLight.position.set(1000, 500, -800);
    scene.add(fillLight);

    // Minimal but realistic ambient lighting for space environment
    const ambientLight = new THREE.AmbientLight(0x2a1810, 0.15);
    scene.add(ambientLight);

    // Add rim lighting to enhance massive landscape depth
    const rimLight = new THREE.DirectionalLight(0x8b5a3c, 2.0);
    rimLight.position.set(500, 200, 1500);
    scene.add(rimLight);

    // Create MASSIVE Mars terrain system with multiple layers
    const mainTerrainGeometry = createMarsTerrainGeometry();
    const mainTerrainMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.1
    });
    
    const mainTerrain = new THREE.Mesh(mainTerrainGeometry, mainTerrainMaterial);
    mainTerrain.receiveShadow = true;
    mainTerrain.name = 'mars-terrain-main';
    terrainRef.current = mainTerrain;
    scene.add(mainTerrain);

    // Create DISTANT TERRAIN LAYERS for massive landscape extending to horizon
    const createDistantTerrainLayer = (size: number, segments: number, scale: number, yOffset: number, opacity: number) => {
      const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
      const positions = geometry.attributes.position.array as Float32Array;
      
      // Generate distant terrain heights with lower detail
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i] / size;
        const z = positions[i + 2] / size;
        
        // Realistic Mars distant terrain
        const distantHeight = (
          noise.simplex2(x * 1, z * 1) * scale * 0.4 +
          noise.ridgedNoise(x * 2, z * 2) * scale * 0.3 +
          noise.simplex2(x * 4, z * 4) * scale * 0.1
        );
        
        positions[i + 1] = Math.max(0, distantHeight) + yOffset;
      }
      
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
      
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x8b4513).lerp(new THREE.Color(0x2c1810), 1 - opacity),
        roughness: 0.95,
        metalness: 0.05,
        transparent: true,
        opacity: opacity,
        fog: true
      });
      
      const distantTerrain = new THREE.Mesh(geometry, material);
      distantTerrain.rotation.x = -Math.PI / 2;
      distantTerrain.receiveShadow = true;
      return distantTerrain;
    };

    // Add multiple distance layers for MASSIVE landscape - properly grounded
    const distantLayers = [
      { size: terrainSize * 2.5, segments: 256, scale: heightScale * 0.3, yOffset: -10, opacity: 0.9 },
      { size: terrainSize * 5, segments: 128, scale: heightScale * 0.2, yOffset: -20, opacity: 0.7 },
      { size: terrainSize * 10, segments: 64, scale: heightScale * 0.15, yOffset: -30, opacity: 0.5 },
      { size: terrainSize * 20, segments: 32, scale: heightScale * 0.1, yOffset: -40, opacity: 0.3 }
    ];

    distantLayers.forEach(layer => {
      const distantTerrain = createDistantTerrainLayer(
        layer.size, 
        layer.segments, 
        layer.scale, 
        layer.yOffset, 
        layer.opacity
      );
      scene.add(distantTerrain);
    });

    // Add proper Mars surface features instead of floating mountains
    const createMarsRidges = () => {
      // Create distant ridges that follow the terrain surface
      const ridgeDistances = [8000, 15000, 25000];
      
      ridgeDistances.forEach((distance, layerIndex) => {
        const ridgeCount = 8 - layerIndex;
        const opacity = 0.8 - layerIndex * 0.2;
        
        for (let i = 0; i < ridgeCount; i++) {
          const angle = (i / ridgeCount) * Math.PI * 2;
          const x = Math.cos(angle) * distance;
          const z = Math.sin(angle) * distance;
          
          // Create elongated ridge geometry
          const ridgeGeometry = new THREE.BoxGeometry(
            2000 + Math.random() * 1000, // width
            200 + Math.random() * 300,   // height - much lower
            800 + Math.random() * 400    // depth
          );
          
          const ridgeMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0x8b4513).lerp(new THREE.Color(0x2c1810), 1 - opacity),
            roughness: 0.95,
            metalness: 0.05,
            transparent: true,
            opacity: opacity,
            fog: true
          });
          
          const ridge = new THREE.Mesh(ridgeGeometry, ridgeMaterial);
          ridge.position.set(
            x + (Math.random() - 0.5) * 3000,
            50 + Math.random() * 100, // Much lower, sitting ON the surface
            z + (Math.random() - 0.5) * 3000
          );
          ridge.rotation.y = angle + (Math.random() - 0.5) * 0.5;
          ridge.scale.set(
            0.8 + Math.random() * 0.4,
            0.5 + Math.random() * 0.3, // Flatter
            0.9 + Math.random() * 0.3
          );
          scene.add(ridge);
        }
      });
    };

    createMarsRidges();

    // Add atmospheric perspective fog for massive landscape depth
    scene.fog = new THREE.Fog(0x2c1810, 8000, 60000);

    // Add floating Mars dust particles for atmospheric realism
    const createDustParticles = () => {
      const dustGeometry = new THREE.BufferGeometry();
      const dustCount = 1000;
      const dustPositions = new Float32Array(dustCount * 3);
      const dustSizes = new Float32Array(dustCount);
      
      for (let i = 0; i < dustCount; i++) {
        const i3 = i * 3;
        
        // Distribute dust particles in the air
        dustPositions[i3] = (Math.random() - 0.5) * terrainSize * 2;
        dustPositions[i3 + 1] = Math.random() * 500 + 50; // Floating in air
        dustPositions[i3 + 2] = (Math.random() - 0.5) * terrainSize * 2;
        
        dustSizes[i] = Math.random() * 3 + 1;
      }
      
      dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
      dustGeometry.setAttribute('size', new THREE.BufferAttribute(dustSizes, 1));
      
      const dustMaterial = new THREE.PointsMaterial({
        color: 0x8B4513,
        size: 2,
        transparent: true,
        opacity: 0.1,
        fog: true,
        sizeAttenuation: true
      });
      
      const dustParticles = new THREE.Points(dustGeometry, dustMaterial);
      scene.add(dustParticles);
      
      // Animate dust particles
      const animateDust = () => {
        const positions = dustParticles.geometry.attributes.position.array as Float32Array;
        
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += Math.sin(Date.now() * 0.0001 + i) * 0.1;
          positions[i + 2] += Math.cos(Date.now() * 0.0001 + i) * 0.1;
        }
        
        dustParticles.geometry.attributes.position.needsUpdate = true;
      };
      
      return animateDust;
    };

    const animateDust = createDustParticles();

    // Create rock field on main terrain
    createRockField(scene);

    // Controls for MASSIVE landscape exploration
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 20;
    controls.maxDistance = 25000; // Zoom out to see the entire massive landscape
    controls.maxPolarAngle = Math.PI / 1.8;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Optional grid
    if (showGrid) {
      const gridHelper = new THREE.GridHelper(terrainSize, 50, 0x444444, 0x444444);
      gridHelper.material.opacity = 0.2;
      gridHelper.material.transparent = true;
      scene.add(gridHelper);
    }

    // Module placement group
    placedModulesRef.current.name = 'placed-modules';
    scene.add(placedModulesRef.current);

    // Drag and drop handling
    const canvas = renderer.domElement;
    const raycaster = new THREE.Raycaster();
    
    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      
      const moduleType = event.dataTransfer?.getData('moduleType') || 
                        event.dataTransfer?.getData('text/plain') || 'default';
      
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      const mouse = new THREE.Vector2(x, y);
      raycaster.setFromCamera(mouse, camera);
      
      if (terrainRef.current) {
        const intersects = raycaster.intersectObject(terrainRef.current);
        if (intersects.length > 0) {
          const hitPoint = intersects[0].point;
          const moduleMesh = createModuleMesh(moduleType);
          
          // Position precisely on terrain
          const terrainHeight = getTerrainHeight(hitPoint.x, hitPoint.z);
          const bbox = new THREE.Box3().setFromObject(moduleMesh);
          const moduleHeight = bbox.max.y - bbox.min.y;
          
          moduleMesh.position.set(
            hitPoint.x,
            terrainHeight + moduleHeight / 2,
            hitPoint.z
          );
          
          placedModulesRef.current.add(moduleMesh);
          
          if (onModulePlace) {
            onModulePlace({
              id: moduleMesh.userData.id,
              type: moduleType,
              position: moduleMesh.position.clone(),
              rotation: moduleMesh.rotation.clone(),
              scale: moduleMesh.scale.clone()
            });
          }
        }
      }
    };

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      event.dataTransfer!.dropEffect = 'copy';
    };

    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('drop', handleDrop);

    // Animation loop with atmospheric effects
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      // Animate dust particles for atmospheric realism
      if (animateDust) {
        animateDust();
      }
      
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    setIsLoaded(true);

    console.log('🚀 Realistic Mars Environment Created:', {
      terrain: `${terrainSize}m x ${terrainSize}m`,
      segments: segments,
      heightRange: `${heightScale * -2}m to ${heightScale * 2}m`,
      features: 'Olympus Mons, Hellas Basin, Valles Marineris, Impact Craters, Mesas, Ice Caps',
      rocks: '500+ geological specimens',
      stars: '5000+ white stars in black space',
      lighting: 'Harsh space lighting with deep shadows'
    });

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('dragover', handleDragOver);
      canvas.removeEventListener('drop', handleDrop);
      
      if (terrainRef.current) {
        terrainRef.current.geometry.dispose();
        if (terrainRef.current.material instanceof THREE.Material) {
          terrainRef.current.material.dispose();
        }
      }
      
      placedModulesRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      
      if (rendererRef.current && mountRef.current?.contains(rendererRef.current.domElement)) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      
      globalTerrainSampler = null;
    };
  }, [terrainSize, segments, heightScale, showGrid, onModulePlace]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mountRef} 
        className="w-full h-full"
        style={{ background: '#000000' }}
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-lg">Generating Realistic Mars Surface...</p>
            <p className="text-sm text-gray-400 mt-2">
              Creating geological features, craters, and rock formations
            </p>
          </div>
        </div>
      )}
      
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg text-sm">
        <div className="font-semibold text-red-400 mb-1">🚀 REALISTIC MARS SURFACE</div>
        <div>• Black space with 5000+ white stars</div>
        <div>• Olympus Mons volcanic shield</div>
        <div>• Hellas Basin impact crater</div>
        <div>• Valles Marineris canyon system</div>
        <div>• 500+ geological rock formations</div>
        <div>• Polar ice caps & mesa formations</div>
      </div>
    </div>
  );
};

export default RealisticMarsCanvas;