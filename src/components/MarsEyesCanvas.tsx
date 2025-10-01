'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type MarsEyesCanvasProps = {
  terrainSize?: number;   // default 1200
  segments?: number;      // default 256
  heightScale?: number;   // default 40
  showGroundGrid?: boolean;
  onPlace?: (m: { 
    id: string; 
    type: string; 
    position: THREE.Vector3; 
    rotation: THREE.Euler; 
    scale: THREE.Vector3; 
  }) => void;
};

// Module type to color mapping
const MODULE_COLORS = {
  'crew': 0xf3c623,
  'sleep': 0xf3c623,
  'hygiene': 0x2db37d,
  'waste': 0x2db37d,
  'lab': 0x5a8dee,
  'eclss': 0xc061cb,
  'default': 0xd46a3a
} as const;

// Generate unique ID for modules
let moduleCounter = 0;
const generateModuleId = () => `module_${Date.now()}_${++moduleCounter}`;

// Create simple module mesh based on type
const createModuleMesh = (type: string): THREE.Mesh => {
  let geometry: THREE.BufferGeometry;
  
  // Simple geometry based on type
  if (type.toLowerCase().includes('crew') || type.toLowerCase().includes('sleep')) {
    geometry = new THREE.BoxGeometry(4, 2.5, 6); // Sleeping quarters
  } else if (type.toLowerCase().includes('lab')) {
    geometry = new THREE.CylinderGeometry(3, 3, 3, 8); // Laboratory
  } else if (type.toLowerCase().includes('hygiene') || type.toLowerCase().includes('waste')) {
    geometry = new THREE.BoxGeometry(2.5, 2.5, 2.5); // Compact utilities
  } else {
    geometry = new THREE.BoxGeometry(3, 2, 3); // Default module
  }

  // Get color based on type
  const getModuleColor = (moduleType: string): number => {
    const lowerType = moduleType.toLowerCase();
    for (const [key, color] of Object.entries(MODULE_COLORS)) {
      if (lowerType.includes(key)) return color;
    }
    return MODULE_COLORS.default;
  };

  const material = new THREE.MeshStandardMaterial({
    color: getModuleColor(type),
    roughness: 0.7,
    metalness: 0.1
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { type, id: generateModuleId() };
  
  return mesh;
};

const MarsEyesCanvas: React.FC<MarsEyesCanvasProps> = ({
  terrainSize = 1200,
  segments = 256,
  heightScale = 40,
  showGroundGrid = false,
  onPlace
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const controlsRef = useRef<OrbitControls>();
  const terrainRef = useRef<THREE.Mesh>();
  const raycasterRef = useRef<THREE.Raycaster>();
  const placedModulesRef = useRef<THREE.Group>(new THREE.Group());
  const animationIdRef = useRef<number>();
  
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const raycaster = new THREE.Raycaster();
    raycasterRef.current = raycaster;

    // Camera setup - NASA Eyes position and FOV
    const camera = new THREE.PerspectiveCamera(
      55, // 55° FOV as specified
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      6000
    );
    camera.position.set(-420, 320, 520); // NASA Eyes position
    cameraRef.current = camera;

    // Renderer setup with NASA Eyes characteristics
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: false,
      powerPreference: "high-performance"
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Configure for physically correct lighting and NASA Eyes tone
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15; // NASA Eyes exposure
    
    // Handle both old and new Three.js APIs for output encoding
    if (renderer.hasOwnProperty('outputColorSpace')) {
      (renderer as any).outputColorSpace = THREE.SRGBColorSpace;
    } else {
      // Legacy Three.js versions use outputEncoding
      (renderer as any).outputEncoding = 3001; // THREE.sRGBEncoding value
    }
    
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // REALISTIC Mars Space Environment - Black space with thin atmosphere
    scene.background = new THREE.Color(0x000000); // Deep black space
    
    // Create realistic Mars atmosphere - thin, mostly black with slight horizon glow
    const skyGeometry = new THREE.SphereGeometry(3000, 32, 16);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x000000) }, // Black space
        bottomColor: { value: new THREE.Color(0x2a1810) }, // Very dark reddish horizon
        offset: { value: 20 },
        exponent: { value: 2.0 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          // Very subtle gradient - mostly black with tiny horizon glow
          float mixFactor = max(pow(max(h, 0.0), exponent), 0.0) * 0.3;
          gl_FragColor = vec4(mix(topColor, bottomColor, mixFactor), 1.0);
        }
      `,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.8
    });
    
    const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skyDome);

    // Add realistic white stars in black space
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 3000;
    const starPositions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
      // Distribute stars in sphere around scene
      const radius = 2500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = radius * Math.cos(phi);
      starPositions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff, // Pure white stars
      size: 3,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.9
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // OrbitControls with NASA Eyes constraints
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 80;
    controls.maxDistance = 2400;
    controls.maxPolarAngle = Math.PI / 1.95; // Prevent going under terrain
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    // Harsh space lighting - Bright sun with deep shadows
    const sunLight = new THREE.DirectionalLight(0xffffff, 4.5); // Harsh white sunlight
    sunLight.position.set(-500, 600, 200); // High angle for dramatic shadows
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 3000;
    sunLight.shadow.camera.left = -1000;
    sunLight.shadow.camera.right = 1000;
    sunLight.shadow.camera.top = 1000;
    sunLight.shadow.camera.bottom = -1000;
    sunLight.shadow.bias = -0.0001;
    scene.add(sunLight);

    // Very minimal ambient - space is dark
    const ambientLight = new THREE.AmbientLight(0x404040, 0.15); // Very dim blue-gray ambient
    scene.add(ambientLight);
    
    // Add starlight reflection (very subtle)
    const starlightFill = new THREE.DirectionalLight(0x9999ff, 0.1);
    starlightFill.position.set(200, -100, -300); // Opposite to sun
    scene.add(starlightFill);

    // Minimal atmosphere - Mars has very thin air
    scene.fog = new THREE.Fog(0x000000, 1500, 2500); // Very distant black fog for depth only

    // REALISTIC Mars terrain with procedural height generation
    const terrainGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
    terrainGeometry.rotateX(-Math.PI / 2); // Make it horizontal

    // Generate DRAMATIC realistic Mars terrain with extreme height variation
    const positions = terrainGeometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      
      // Create dramatic Mars terrain with extreme height variation
      const x = vertex.x / terrainSize;
      const z = vertex.z / terrainSize;
      
      // MASSIVE mountain ranges (like Olympus Mons - 21km high!)
      let height = Math.sin(x * Math.PI * 1.2) * Math.cos(z * Math.PI * 0.8) * heightScale * 1.5;
      
      // Large canyon systems (like Valles Marineris)
      const canyonX = (x + 0.2) * 3;
      const canyonZ = z * 8;
      if (Math.abs(canyonZ - Math.sin(canyonX * 0.5) * 0.3) < 0.4) {
        height -= heightScale * 1.2; // Deep canyon cut
      }
      
      // Medium scale ridges and valleys
      height += Math.sin(x * Math.PI * 5) * Math.cos(z * Math.PI * 4) * heightScale * 0.6;
      
      // Fine rocky detail and erosion patterns
      height += Math.sin(x * Math.PI * 20) * Math.cos(z * Math.PI * 25) * heightScale * 0.15;
      height += Math.sin(x * Math.PI * 40) * Math.cos(z * Math.PI * 35) * heightScale * 0.08;
      
      // GIANT impact crater (like Hellas Basin)
      const mainCraterX = (x - 0.1) * 4;
      const mainCraterZ = (z - 0.2) * 4;
      const mainCraterDist = Math.sqrt(mainCraterX * mainCraterX + mainCraterZ * mainCraterZ);
      if (mainCraterDist < 2.5) {
        const craterDepth = (2.5 - mainCraterDist) / 2.5;
        height -= craterDepth * craterDepth * heightScale * 1.8; // Massive crater
        // Add crater rim
        if (mainCraterDist > 2.0) {
          height += (mainCraterDist - 2.0) * heightScale * 0.4;
        }
      }
      
      // Multiple smaller craters
      const crater2X = (x + 0.4) * 6;
      const crater2Z = (z + 0.3) * 6;
      const crater2Dist = Math.sqrt(crater2X * crater2X + crater2Z * crater2Z);
      if (crater2Dist < 1.5) {
        height -= (1.5 - crater2Dist) * heightScale * 0.7;
      }
      
      const crater3X = (x - 0.35) * 7;
      const crater3Z = (z + 0.45) * 7;
      const crater3Dist = Math.sqrt(crater3X * crater3X + crater3Z * crater3Z);
      if (crater3Dist < 1.0) {
        height -= (1.0 - crater3Dist) * heightScale * 0.5;
      }
      
      // Dramatic mesa formations (like those in Chryse Planitia)
      const mesa1X = (x + 0.25) * 5;
      const mesa1Z = (z - 0.15) * 5;
      const mesa1Dist = Math.sqrt(mesa1X * mesa1X + mesa1Z * mesa1Z);
      if (mesa1Dist < 1.8) {
        const mesaHeight = (1.8 - mesa1Dist) * heightScale * 0.8;
        if (mesa1Dist < 1.0) {
          height = Math.max(height, mesaHeight); // Flat mesa top
        } else {
          height += mesaHeight * (1.8 - mesa1Dist) * 0.5; // Mesa slopes
        }
      }
      
      // Polar ice cap area (if in certain regions)
      if (z > 0.7) {
        height += Math.abs(Math.sin(x * Math.PI * 3)) * heightScale * 0.2; // Ice formations
      }
      
      positions.setY(i, height);
    }
    
    positions.needsUpdate = true;
    terrainGeometry.computeVertexNormals(); // Recalculate normals for proper lighting

    // Create realistic Mars terrain material with color variation
    const colors = [];
    const terrainMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.95,
      metalness: 0.02,
      vertexColors: true // Enable vertex colors
    });

    // Add REALISTIC Mars geological color variation
    for (let i = 0; i < positions.count; i++) {
      const height = positions.getY(i);
      const x = positions.getX(i);
      const z = positions.getZ(i);
      
      // Normalize height for color mapping with extreme range
      const normalizedHeight = Math.max(0, Math.min(1, (height + heightScale * 2) / (heightScale * 4)));
      
      // Realistic Mars geological colors
      let baseColor = new THREE.Color(0xcd853f); // Base Mars rust
      const deepCraterColor = new THREE.Color(0x4a2c1a);   // Very dark crater floors
      const canyonColor = new THREE.Color(0x6b3e2a);       // Canyon walls
      const peakColor = new THREE.Color(0xf4e4bc);         // High peaks/exposed rock
      const dustColor = new THREE.Color(0xdaa574);         // Wind-blown dust
      const ironColor = new THREE.Color(0xa0522d);         // Iron oxide areas
      const iceColor = new THREE.Color(0xe8f2ff);          // Polar ice deposits
      
      // Geological color mapping based on height
      if (normalizedHeight < 0.15) {
        // Deep crater floors and canyons - very dark
        baseColor = deepCraterColor.clone();
      } else if (normalizedHeight < 0.35) {
        // Canyon walls and low valleys
        baseColor.lerp(canyonColor, (0.35 - normalizedHeight) * 2);
      } else if (normalizedHeight > 0.8) {
        // High peaks and exposed bedrock
        baseColor.lerp(peakColor, (normalizedHeight - 0.8) * 4);
      } else if (normalizedHeight > 0.65) {
        // Mid-level rocky areas with iron oxide
        baseColor.lerp(ironColor, (normalizedHeight - 0.65) * 2);
      }
      
      // Add geological features based on position
      const geological = (Math.sin(x * 0.005) + Math.cos(z * 0.007)) * 0.5 + 0.5;
      
      // Dust deposits in flat areas
      if (geological > 0.6 && normalizedHeight > 0.3 && normalizedHeight < 0.7) {
        baseColor.lerp(dustColor, (geological - 0.6) * 0.6);
      }
      
      // Iron oxide streaks
      const ironStreak = Math.sin(x * 0.003 + z * 0.002) * 0.5 + 0.5;
      if (ironStreak > 0.7) {
        baseColor.lerp(ironColor, (ironStreak - 0.7) * 0.4);
      }
      
      // Polar ice deposits (northern regions)
      if (z > terrainSize * 0.3 && normalizedHeight > 0.6) {
        const iceFactor = (z / terrainSize - 0.3) / 0.7;
        baseColor.lerp(iceColor, iceFactor * 0.3);
      }
      
      // Add subtle color noise for realism
      const colorNoise = (Math.random() - 0.5) * 0.1;
      baseColor.r = Math.max(0, Math.min(1, baseColor.r + colorNoise));
      baseColor.g = Math.max(0, Math.min(1, baseColor.g + colorNoise * 0.5));
      baseColor.b = Math.max(0, Math.min(1, baseColor.b + colorNoise * 0.3));
      
      colors.push(baseColor.r, baseColor.g, baseColor.b);
    }
    
    terrainGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Create terrain mesh
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.receiveShadow = true;
    terrain.name = 'terrain';
    terrainRef.current = terrain;
    scene.add(terrain);

    // Create terrain height sampler function for module snapping
    const terrainHeightSampler = (x: number, z: number): number => {
      // Find the closest vertices to the query point
      const halfSize = terrainSize / 2;
      const segmentSize = terrainSize / segments;
      
      const col = Math.floor((x + halfSize) / segmentSize);
      const row = Math.floor((z + halfSize) / segmentSize);
      
      // Clamp to terrain bounds
      const clampedCol = Math.max(0, Math.min(segments, col));
      const clampedRow = Math.max(0, Math.min(segments, row));
      
      const index = clampedRow * (segments + 1) + clampedCol;
      
      if (index < positions.count) {
        return positions.getY(index);
      }
      return 0;
    };

    // Store sampler globally for use by drag & drop system
    (window as any).marsTerrainSampler = terrainHeightSampler;

    console.log('Generated REALISTIC Mars terrain with:', {
      vertices: positions.count,
      heightRange: `${-heightScale}m to ${heightScale}m`,
      features: 'Mountains, craters, mesas, valleys with realistic Mars coloring',
      heightSampler: 'Available globally for module snapping'
    });

    // Optional grid helper
    if (showGroundGrid) {
      const gridHelper = new THREE.GridHelper(terrainSize, 40);
      gridHelper.material.opacity = 0.15;
      gridHelper.material.transparent = true;
      gridHelper.material.color.setHex(0x8b4513);
      scene.add(gridHelper);
    }

    // Add realistic Mars boulder fields and rock formations
    const rockCount = 400;
    
    // Create different rock types
    const rockGeometries = [
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.DodecahedronGeometry(1, 0),
      new THREE.BoxGeometry(1, 0.8, 1.2),
      new THREE.ConeGeometry(0.8, 1.5, 6)
    ];
    
    const rockMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x4a2c1a, roughness: 0.9, metalness: 0.1 }), // Dark basalt
      new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.95, metalness: 0.05 }), // Iron oxide
      new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.85, metalness: 0.15 }), // Weathered rock
      new THREE.MeshStandardMaterial({ color: 0x2f1b14, roughness: 1.0, metalness: 0.0 }) // Volcanic rock
    ];

    for (let i = 0; i < rockCount; i++) {
      const rockType = Math.floor(Math.random() * rockGeometries.length);
      const rock = new THREE.Mesh(rockGeometries[rockType], rockMaterials[rockType]);
      
      // Cluster rocks in realistic formations
      let x, z;
      if (Math.random() < 0.3) {
        // Create rock clusters
        const clusterX = (Math.random() - 0.5) * terrainSize * 0.8;
        const clusterZ = (Math.random() - 0.5) * terrainSize * 0.8;
        x = clusterX + (Math.random() - 0.5) * 50;
        z = clusterZ + (Math.random() - 0.5) * 50;
      } else {
        // Scattered individual rocks
        x = (Math.random() - 0.5) * terrainSize * 0.95;
        z = (Math.random() - 0.5) * terrainSize * 0.95;
      }
      
      const y = terrainHeightSampler(x, z);
      
      // Realistic size variation - from pebbles to boulders
      const scale = Math.pow(Math.random(), 2) * 3 + 0.2; // Power distribution for realistic sizes
      rock.scale.set(
        scale * (0.8 + Math.random() * 0.4),
        scale * (0.6 + Math.random() * 0.3), 
        scale * (0.9 + Math.random() * 0.2)
      );
      
      rock.position.set(x, y, z);
      rock.rotation.set(
        Math.random() * Math.PI * 0.3,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 0.3
      );
      
      rock.castShadow = true;
      rock.receiveShadow = true;
      
      scene.add(rock);
    }

    // Add placed modules group
    placedModulesRef.current.name = 'placedModules';
    scene.add(placedModulesRef.current);

    // Drag and drop event listeners
    const canvas = renderer.domElement;
    
    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      event.dataTransfer!.dropEffect = 'copy';
      
      // Raycast to check if we're over terrain
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      const mouse = new THREE.Vector2(x, y);
      raycaster.setFromCamera(mouse, camera);
      
      const intersects = raycaster.intersectObject(terrain);
      canvas.style.cursor = intersects.length > 0 ? 'copy' : 'no-drop';
    };

    const handleDragLeave = () => {
      canvas.style.cursor = 'default';
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      canvas.style.cursor = 'default';
      
      // Get module type from drag data
      const moduleType = event.dataTransfer?.getData('moduleType') || 
                        event.dataTransfer?.getData('text/plain') || 'default';
      
      // Raycast to find drop position
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      const mouse = new THREE.Vector2(x, y);
      raycaster.setFromCamera(mouse, camera);
      
      const intersects = raycaster.intersectObject(terrain);
      if (intersects.length > 0) {
        const hitPoint = intersects[0].point;
        
        // Create module mesh
        const moduleMesh = createModuleMesh(moduleType);
        
        // Position module on terrain surface with accurate height snapping
        const bbox = new THREE.Box3().setFromObject(moduleMesh);
        const moduleHeight = bbox.max.y - bbox.min.y;
        
        // Use terrain height sampler for precise positioning
        const terrainHeight = terrainHeightSampler(hitPoint.x, hitPoint.z);
        
        moduleMesh.position.set(
          hitPoint.x,
          terrainHeight + moduleHeight / 2, // Accurate terrain height + half module height
          hitPoint.z
        );
        
        // Add to scene
        placedModulesRef.current.add(moduleMesh);
        
        // Notify parent component
        if (onPlace) {
          onPlace({
            id: moduleMesh.userData.id,
            type: moduleType,
            position: moduleMesh.position.clone(),
            rotation: moduleMesh.rotation.clone(),
            scale: moduleMesh.scale.clone()
          });
        }
        
        console.log(`Placed ${moduleType} module on Mars terrain at:`, hitPoint);
      }
    };

    // Attach event listeners
    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('dragleave', handleDragLeave);
    canvas.addEventListener('drop', handleDrop);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
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

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      window.removeEventListener('resize', handleResize);
      
      // Remove event listeners
      canvas.removeEventListener('dragover', handleDragOver);
      canvas.removeEventListener('dragleave', handleDragLeave);
      canvas.removeEventListener('drop', handleDrop);
      
      // Dispose of Three.js resources
      if (terrainRef.current) {
        terrainRef.current.geometry.dispose();
        if (terrainRef.current.material instanceof THREE.Material) {
          terrainRef.current.material.dispose();
        }
      }
      
      // Dispose placed modules
      placedModulesRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
      
      // Dispose sky
      skyDome.geometry.dispose();
      if (skyDome.material instanceof THREE.Material) {
        skyDome.material.dispose();
      }
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      
      if (rendererRef.current && mountRef.current?.contains(rendererRef.current.domElement)) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [terrainSize, segments, heightScale, showGroundGrid, onPlace]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mountRef} 
        className="w-full h-full"
        style={{ background: '#e5a066' }} // Mars sky color fallback
      />
      
      {/* NASA Eyes style vignette overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(139,42,26,0.15) 100%)',
          mixBlendMode: 'multiply'
        }}
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
            <p>Generating Mars Surface Terrain...</p>
          </div>
        </div>
      )}
      
      {/* Mars terrain info overlay */}
      <div className="absolute top-4 left-4 bg-black/20 backdrop-blur-sm text-white p-2 rounded text-xs">
        Mars Surface: Procedural terrain with craters, mesas & valleys
      </div>
    </div>
  );
};

export default MarsEyesCanvas;