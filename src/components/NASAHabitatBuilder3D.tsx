import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Lightbulb, Download, Settings, Trash2, Camera, Move, Eye, Plus, Minus, Save, Folder, Shapes, PanelLeft, PanelLeftClose } from 'lucide-react';

// Import your existing NASA schema and API
import { FAIRINGS, MODULE_PRESETS, FunctionalType } from '@/lib/DEFAULTS';
import { postCheckLayout, postSuggestLayout } from '@/lib/api';
import { Layout, Scenario, ScenarioSchema, HabitatSchema, ModuleSchema } from '@/lib/schemas';

// Database and collections
import { saveDesign, SavedDesign, initDatabase } from '@/lib/database';
import Collections from './Collections';
import ShapeBuilder from './ShapeBuilder';
import CADShapeBuilder from './CADShapeBuilder';
import { MetricsHeader } from '@/features/analyze/MetricsHeader';

// Enhanced module types mapping from NASA functional areas to realistic 3D properties
const MODULE_TYPES_3D = {
  CREW_SLEEP: { 
    color: '#3b82f6', 
    icon: '🛏️', 
    size: { width: 2.0, height: 2.1, depth: 2.2 },
    geometry: 'sleep_pod' // Custom sleep pod shape
  },
  HYGIENE: { 
    color: '#10b981', 
    icon: '🚿', 
    size: { width: 2.0, height: 2.2, depth: 2.0 },
    geometry: 'cylinder' // Cylindrical shower module
  },
  WASTE: { 
    color: '#f59e0b', 
    icon: '🚽', 
    size: { width: 1.8, height: 2.2, depth: 1.8 },
    geometry: 'rounded_box' // Rounded waste management unit
  },
  EXERCISE: { 
    color: '#ef4444', 
    icon: '🏋️', 
    size: { width: 3.0, height: 2.5, depth: 4.0 },
    geometry: 'gym_module' // Multi-level exercise area
  },
  FOOD_PREP: { 
    color: '#8b5cf6', 
    icon: '🍳', 
    size: { width: 3.0, height: 2.2, depth: 3.0 },
    geometry: 'kitchen_module' // L-shaped kitchen module
  },
  ECLSS: { 
    color: '#22c55e', 
    icon: '💨', 
    size: { width: 3.0, height: 2.3, depth: 2.5 },
    geometry: 'technical_rack' // Equipment rack with panels
  },
  MEDICAL: { 
    color: '#ec4899', 
    icon: '🏥', 
    size: { width: 2.5, height: 2.3, depth: 2.5 },
    geometry: 'medical_bay' // Medical examination area
  },
  MAINTENANCE: { 
    color: '#06b6d4', 
    icon: '🔧', 
    size: { width: 2.5, height: 2.3, depth: 2.5 },
    geometry: 'workshop' // Workshop with tool storage
  },
  CUSTOM_CAD: { 
    color: '#8b5cf6', 
    icon: '🏗️', 
    size: { width: 2.0, height: 2.0, depth: 2.0 },
    geometry: 'custom' // Custom CAD-designed module
  },
  STOWAGE: {
    color: '#f97316',
    icon: '📦',
    size: { width: 2.5, height: 2.3, depth: 3.5 },
    geometry: 'storage_rack' // Multi-compartment storage
  },
  RECREATION: {
    color: '#84cc16',
    icon: '🎮',
    size: { width: 2.0, height: 2.2, depth: 2.0 },
    geometry: 'lounge_pod' // Comfortable lounge area
  },
  WORKSTATION: {
    color: '#64748b',
    icon: '💻',
    size: { width: 2.2, height: 2.2, depth: 2.2 },
    geometry: 'workstation' // Desk with equipment
  },
  AIRLOCK: {
    color: '#0ea5e9',
    icon: '🚪',
    size: { width: 2.0, height: 2.3, depth: 2.2 },
    geometry: 'airlock_chamber' // Pressurized airlock
  },
  GLOVEBOX: {
    color: '#8b5cf6',
    icon: '🧪',
    size: { width: 1.4, height: 2.0, depth: 1.8 },
    geometry: 'science_station' // Laboratory workstation
  },
  TRASH_MGMT: {
    color: '#6b7280',
    icon: '🗑️',
    size: { width: 1.5, height: 2.0, depth: 2.0 },
    geometry: 'compactor' // Waste compaction unit
  },
  COMMON_AREA: {
    color: '#f59e0b',
    icon: '👥',
    size: { width: 3.0, height: 2.2, depth: 3.0 },
    geometry: 'community_space' // Open social area
  }
};

function snap(n: number, step = 0.5) {
  return Math.round(n / step) * step;
}

// Create realistic 3D geometries for different NASA modules
function createModuleGeometry(geometryType: string, size: { w_m: number; l_m: number; h_m: number }): THREE.BufferGeometry {
  const { w_m, h_m, l_m } = size;
  
  switch (geometryType) {
    case 'sleep_pod':
      // Rounded sleep pod with curved top
      const sleepGeometry = new THREE.CapsuleGeometry(Math.min(w_m, l_m) / 2.2, h_m - Math.min(w_m, l_m) / 1.1, 4, 8);
      sleepGeometry.rotateZ(Math.PI / 2);
      return sleepGeometry;
      
    case 'cylinder':
      // Standard cylinder for hygiene modules
      return new THREE.CylinderGeometry(w_m / 2, w_m / 2, h_m, 16);
      
    case 'rounded_box':
      // Rounded rectangular module
      const roundedGeometry = new THREE.BoxGeometry(w_m, h_m, l_m);
      return roundedGeometry;
      
    case 'gym_module':
      // Multi-level exercise area with platforms
      const gymGroup = new THREE.Group();
      const mainBox = new THREE.BoxGeometry(w_m, h_m * 0.8, l_m);
      const platform = new THREE.BoxGeometry(w_m * 0.8, h_m * 0.2, l_m * 0.6);
      // Combine geometries (simplified for now)
      return mainBox;
      
    case 'kitchen_module':
      // L-shaped kitchen module
      const kitchenGeometry = new THREE.BoxGeometry(w_m, h_m, l_m);
      // Add a smaller extension for L-shape
      return kitchenGeometry;
      
    case 'technical_rack':
      // Equipment rack with panels - use taller, thinner box
      return new THREE.BoxGeometry(w_m, h_m * 1.2, l_m * 0.8);
      
    case 'medical_bay':
      // Medical examination area with curved elements
      const medicalGeometry = new THREE.BoxGeometry(w_m, h_m, l_m);
      // Round the corners slightly
      return medicalGeometry;
      
    case 'workshop':
      // Workshop with angled roof
      const workshopGeometry = new THREE.BoxGeometry(w_m, h_m, l_m);
      return workshopGeometry;
      
    case 'storage_rack':
      // Multi-compartment storage - taller and segmented
      return new THREE.BoxGeometry(w_m, h_m * 1.1, l_m);
      
    case 'lounge_pod':
      // Comfortable lounge area - rounded
      return new THREE.SphereGeometry(w_m / 2, 16, 12);
      
    case 'workstation':
      // Desk with equipment - angled top
      const workstationGeometry = new THREE.BoxGeometry(w_m, h_m, l_m);
      return workstationGeometry;
      
    case 'airlock_chamber':
      // Pressurized airlock - cylindrical with flat ends
      const airlockGeometry = new THREE.CylinderGeometry(w_m / 2, w_m / 2, h_m, 8);
      airlockGeometry.rotateZ(Math.PI / 2);
      return airlockGeometry;
      
    case 'science_station':
      // Laboratory workstation - compact cube with details
      return new THREE.BoxGeometry(w_m, h_m * 1.1, l_m);
      
    case 'compactor':
      // Waste compaction unit - cylindrical
      return new THREE.CylinderGeometry(w_m / 2.2, w_m / 2, h_m, 12);
      
    case 'community_space':
      // Open social area - octagonal base
      return new THREE.CylinderGeometry(w_m / 2, w_m / 2, h_m, 8);
      
    default:
      // Fallback to basic box
      return new THREE.BoxGeometry(w_m, h_m, l_m);
  }
}

// Create composite materials for more realistic modules
function createModuleMaterial(moduleConfig: any, isSelected: boolean): THREE.Material[] | THREE.Material {
  const baseColor = isSelected ? 0xffff00 : moduleConfig.color;
  
  // Create different materials for different faces
  const materials = [
    new THREE.MeshLambertMaterial({ color: baseColor, transparent: true, opacity: 0.8 }), // Right
    new THREE.MeshLambertMaterial({ color: baseColor, transparent: true, opacity: 0.8 }), // Left
    new THREE.MeshLambertMaterial({ color: baseColor, transparent: true, opacity: 0.9 }), // Top (brighter)
    new THREE.MeshLambertMaterial({ color: baseColor, transparent: true, opacity: 0.7 }), // Bottom (darker)
    new THREE.MeshLambertMaterial({ color: baseColor, transparent: true, opacity: 0.8 }), // Front
    new THREE.MeshLambertMaterial({ color: baseColor, transparent: true, opacity: 0.8 })  // Back
  ];
  
  return materials;
}

// NASA-compatible object structure
interface HabitatObject {
  id: string;
  type: FunctionalType;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  size: {
    w_m: number;
    l_m: number;
    h_m: number;
  };
}

// 3D Scene Component
function ThreeScene({ 
  objects, 
  setObjects, 
  selectedId, 
  setSelectedId, 
  scenario,
  hoverPointRef, 
  isInitialized, 
  setIsInitialized,
  sceneRefs,
  onContextMenu
}: {
  objects: HabitatObject[];
  setObjects: React.Dispatch<React.SetStateAction<HabitatObject[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  scenario: Scenario;
  hoverPointRef: React.MutableRefObject<THREE.Vector3 | null>;
  isInitialized: boolean;
  setIsInitialized: (initialized: boolean) => void;
  sceneRefs: React.MutableRefObject<{
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    raycaster: THREE.Raycaster | null;
    plane: THREE.Plane | null;
  }>;
  onContextMenu: (x: number, y: number, objectId: string | null) => void;
}) {
  // Get environment colors and textures based on destination
  const getEnvironmentConfig = (destination: string) => {
    switch (destination) {
      case 'MARS_SURFACE':
        return {
          background: 0x8B4513,      // Mars brown sky
          ground: 0xCD853F,          // Sandy/rusty ground (fallback)
          grid: 0x8B4513,            // Brown grid
          ambientLight: 0xFFB366,    // Warm ambient light
          directionalLight: 0xFFDAB9, // Warm directional light
          groundTexture: '/textures/ground/mars_surface.webp',
          skyTexture: '/textures/skybox/sky.webp'
        };
      case 'LUNAR':
      case 'LUNAR_SURFACE':
        return {
          background: 0x111111,      // Dark lunar sky
          ground: 0x696969,          // Grey lunar surface (fallback)
          grid: 0x555555,            // Dark grey grid
          ambientLight: 0xCCCCCC,    // Cool ambient light
          directionalLight: 0xFFFFFF, // White directional light
          groundTexture: '/textures/ground/moon-surface-seamless-texture-background-closeup-moon-surface-texture-188679621.webp',
          skyTexture: '/textures/skybox/sky.webp'
        };
      case 'LEO':
      case 'SPACE_STATION':
        return {
          background: 0x000011,      // Deep space blue-black
          ground: 0x2F4F4F,          // Dark slate station floor (fallback)
          grid: 0x4682B4,            // Steel blue grid
          ambientLight: 0xE6F3FF,    // Cool white ambient
          directionalLight: 0xFFFFFF, // Bright white directional
          groundTexture: '/textures/ground/space-station-floor.jpg',
          skyTexture: '/textures/skybox/sky.webp'
        };
      case 'MARS_TRANSIT':
        return {
          background: 0x191970,      // Midnight blue space
          ground: 0x2F2F2F,          // Dark ship floor (fallback)
          grid: 0x4169E1,            // Royal blue grid
          ambientLight: 0xE0E6FF,    // Cool ambient
          directionalLight: 0xF0F8FF, // Alice blue directional
          groundTexture: '/textures/ground/ship-deck.jpg',
          skyTexture: '/textures/skybox/sky.webp'
        };
      case 'DEEP_SPACE':
        return {
          background: 0x000000,      // Pure black space
          ground: 0x1C1C1C,          // Very dark ship floor (fallback)
          grid: 0x663399,            // Purple grid
          ambientLight: 0xE6E6FA,    // Lavender ambient
          directionalLight: 0xFFFFFF, // Pure white directional
          groundTexture: '/textures/ground/deep-space-deck.jpg',
          skyTexture: '/textures/skybox/sky.webp'
        };
      default:
        return {
          background: 0x2d1b69,      // Default purple
          ground: 0xCD5C5C,          // Default red ground (fallback)
          grid: 0x8b4513,            // Default brown grid
          ambientLight: 0xFFFFFF,    // Default white ambient
          directionalLight: 0xFFFFFF, // Default white directional
          groundTexture: '/textures/ground/default-surface.jpg',
          skyTexture: '/textures/skybox/sky.webp'
        };
    }
  };

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const meshesRef = useRef(new Map<string, THREE.Mesh>());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const isDraggingObjectRef = useRef(false);
  const dragOffsetRef = useRef(new THREE.Vector3());
  const animationIdRef = useRef<number>();

  // Camera control state
  const cameraStateRef = useRef({
    isRotating: false,
    isPanning: false,
    isSpacePressed: false,
    previousMouse: { x: 0, y: 0 },
    spherical: new THREE.Spherical(25, Math.PI / 4, 0),
    target: new THREE.Vector3(0, 0, 0),
    panSpeed: 0.02,
    rotateSpeed: 0.005
  });

  // Initialize Three.js scene
  useEffect(() => {
    console.log('Initializing Three.js scene...');
    if (!mountRef.current) {
      console.log('Mount ref not ready');
      return;
    }

    try {
      // Get environment configuration based on destination
      const envConfig = getEnvironmentConfig(scenario.destination);
      
      // Scene setup with dynamic background
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(envConfig.background);
      sceneRef.current = scene;

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75, 
        mountRef.current.clientWidth / mountRef.current.clientHeight, 
        0.1, 
        1000
      );
      cameraRef.current = camera;
      
      // Store camera ref for drag/drop calculations
      sceneRefs.current.camera = camera;

      // Position camera
      const state = cameraStateRef.current;
      camera.position.setFromSpherical(state.spherical).add(state.target);
      camera.lookAt(state.target);

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setClearColor(0x2d1b69);
      rendererRef.current = renderer;
      
      // Store renderer ref for drag/drop calculations
      sceneRefs.current.renderer = renderer;
      
      // Store raycaster and plane refs for drag/drop calculations
      sceneRefs.current.raycaster = raycasterRef.current;
      sceneRefs.current.plane = planeRef.current;

      // Add canvas to DOM
      mountRef.current.appendChild(renderer.domElement);

      // Lighting with dynamic colors
      const ambientLight = new THREE.AmbientLight(envConfig.ambientLight, 0.4);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(envConfig.directionalLight, 0.8);
      directionalLight.position.set(10, 10, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);

      // Dynamic ground with texture loading based on destination
      const groundGeometry = new THREE.PlaneGeometry(100, 100);
      
      // Create texture loader
      const textureLoader = new THREE.TextureLoader();
      
      // Try to load ground texture, fall back to color if texture fails
      let groundMaterial: THREE.MeshLambertMaterial;
      
      try {
        console.log(`Loading ground texture: ${envConfig.groundTexture}`);
        const texture = textureLoader.load(
          envConfig.groundTexture,
          // onLoad callback
          (texture) => {
            console.log('Ground texture loaded successfully');
            // Configure texture properties for single image (no tiling)
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.repeat.set(1, 1); // Single image, no repetition
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = true;
            
            // Update the material to use the texture
            groundMaterial.map = texture;
            groundMaterial.needsUpdate = true;
          },
          // onProgress callback
          (progress) => {
            console.log('Loading ground texture progress:', progress);
          },
          // onError callback
          (error) => {
            console.warn('Failed to load ground texture, using fallback color:', error);
            // Material already created with fallback color, so no additional action needed
          }
        );
        
        // Create material with texture (will show fallback color until texture loads)
        groundMaterial = new THREE.MeshLambertMaterial({ 
          color: envConfig.ground,
          map: texture 
        });
      } catch (error) {
        console.warn('Error creating texture loader, using fallback color:', error);
        // Fallback to solid color if texture loading fails
        groundMaterial = new THREE.MeshLambertMaterial({ color: envConfig.ground });
      }
      
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // Skybox disabled for now - using solid black background
      // TODO: Implement better skybox solution later
      scene.background = new THREE.Color(0x000000); // Simple black sky

      // Dynamic grid
      const gridHelper = new THREE.GridHelper(50, 50, envConfig.grid, envConfig.grid);
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.3;
      scene.add(gridHelper);

      // Mouse events
      function handleMouseDown(event: MouseEvent) {
        event.preventDefault();
        const state = cameraStateRef.current;
        
        // Space + left click for camera panning
        if (state.isSpacePressed && event.button === 0) {
          state.isPanning = true;
          state.previousMouse = { x: event.clientX, y: event.clientY };
          renderer.domElement.style.cursor = 'grabbing';
          return;
        }
        
        if (event.button === 0) { // Left click (normal object interaction)
          const rect = renderer.domElement.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          
          mouseRef.current.set(x, y);
          raycasterRef.current.setFromCamera(mouseRef.current, camera);
          
          const meshes = Array.from(meshesRef.current.values());
          const intersects = raycasterRef.current.intersectObjects(meshes);
          
          if (intersects.length > 0) {
            const clickedId = intersects[0].object.userData.id;
            setSelectedId(clickedId);
            isDraggingObjectRef.current = true;
            const selectedMesh = intersects[0].object;
            const intersectionPoint = intersects[0].point;
            dragOffsetRef.current.copy(selectedMesh.position).sub(intersectionPoint);
          } else {
            setSelectedId(null);
            state.isRotating = true;
            state.previousMouse = { x: event.clientX, y: event.clientY };
          }
        } else if (event.button === 2) { // Right click
          state.isPanning = true;
          state.previousMouse = { x: event.clientX, y: event.clientY };
        }
      }

      function handleMouseMove(event: MouseEvent) {
        const rect = renderer.domElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        mouseRef.current.set(x, y);
        
        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        const hit = new THREE.Vector3();
        raycasterRef.current.ray.intersectPlane(planeRef.current, hit);
        if (hoverPointRef) {
          hoverPointRef.current = hit.clone();
        }

        if (isDraggingObjectRef.current && selectedId) {
          const selectedMesh = meshesRef.current.get(selectedId);
          if (selectedMesh) {
            const groundHit = new THREE.Vector3();
            raycasterRef.current.ray.intersectPlane(planeRef.current, groundHit);
            const newPos = groundHit.add(dragOffsetRef.current);
            newPos.x = snap(newPos.x);
            newPos.z = snap(newPos.z);
            newPos.y = Math.max(1, newPos.y);
            selectedMesh.position.copy(newPos);
          }
          return;
        }

        const state = cameraStateRef.current;
        const deltaX = event.clientX - state.previousMouse.x;
        const deltaY = event.clientY - state.previousMouse.y;

        if (state.isRotating) {
          state.spherical.theta -= deltaX * state.rotateSpeed;
          state.spherical.phi += deltaY * state.rotateSpeed;
          state.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, state.spherical.phi));
          camera.position.setFromSpherical(state.spherical).add(state.target);
          camera.lookAt(state.target);
          state.previousMouse = { x: event.clientX, y: event.clientY };
        } else if (state.isPanning) {
          const panVector = new THREE.Vector3();
          const right = new THREE.Vector3().crossVectors(camera.up, new THREE.Vector3().subVectors(state.target, camera.position).normalize());
          const up = new THREE.Vector3().crossVectors(right, new THREE.Vector3().subVectors(state.target, camera.position).normalize());
          
          panVector.addScaledVector(right, -deltaX * state.panSpeed);
          panVector.addScaledVector(up, deltaY * state.panSpeed);
          
          state.target.add(panVector);
          camera.position.add(panVector);
          state.previousMouse = { x: event.clientX, y: event.clientY };
        }
      }

      function handleMouseUp() {
        if (isDraggingObjectRef.current && selectedId) {
          const selectedMesh = meshesRef.current.get(selectedId);
          if (selectedMesh) {
            const pos = selectedMesh.position;
            setObjects(prev => prev.map(obj => 
              obj.id === selectedId 
                ? { ...obj, position: [pos.x, pos.y, pos.z] as [number, number, number] }
                : obj
            ));
          }
          isDraggingObjectRef.current = false;
        }
        
        const state = cameraStateRef.current;
        state.isRotating = false;
        state.isPanning = false;
        
        // Reset cursor based on space key state
        if (state.isSpacePressed) {
          renderer.domElement.style.cursor = 'move';
        } else {
          renderer.domElement.style.cursor = 'default';
        }
      }

      function handleWheel(event: WheelEvent) {
        event.preventDefault();
        const state = cameraStateRef.current;
        const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9;
        state.spherical.radius = Math.max(5, Math.min(100, state.spherical.radius * zoomFactor));
        camera.position.setFromSpherical(state.spherical).add(state.target);
        camera.lookAt(state.target);
      }

      // Add event listeners
      renderer.domElement.addEventListener('mousedown', handleMouseDown);
      renderer.domElement.addEventListener('mousemove', handleMouseMove);
      renderer.domElement.addEventListener('mouseup', handleMouseUp);
      renderer.domElement.addEventListener('wheel', handleWheel);
      renderer.domElement.addEventListener('contextmenu', handleContextMenu);
      
      // Add keyboard event listeners for space key camera controls
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      // Keyboard event handlers
      function handleKeyDown(event: KeyboardEvent) {
        if (event.code === 'Space') {
          event.preventDefault();
          cameraStateRef.current.isSpacePressed = true;
          renderer.domElement.style.cursor = 'move';
        }
      }

      function handleKeyUp(event: KeyboardEvent) {
        if (event.code === 'Space') {
          event.preventDefault();
          cameraStateRef.current.isSpacePressed = false;
          cameraStateRef.current.isPanning = false;
          cameraStateRef.current.isRotating = false;
          renderer.domElement.style.cursor = 'default';
        }
      }

      // Handle right-click for context menu
      function handleContextMenu(event: MouseEvent) {
        event.preventDefault();
        
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1
        );
        
        raycasterRef.current.setFromCamera(mouse, camera);
        const intersects = raycasterRef.current.intersectObjects(scene.children, true);
        
        let objectId = null;
        for (const intersect of intersects) {
          if (intersect.object.userData.id) {
            objectId = intersect.object.userData.id;
            break;
          }
        }
        
        onContextMenu(event.clientX, event.clientY, objectId);
      }

      // Animation loop
      function animate() {
        animationIdRef.current = requestAnimationFrame(animate);
        renderer.render(scene, camera);
      }
      animate();

      // Resize handler
      function handleResize() {
        if (!mountRef.current) return;
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
      window.addEventListener('resize', handleResize);

      setIsInitialized(true);
      console.log('Three.js scene initialized successfully');

      // Cleanup function
      return () => {
        console.log('Cleaning up Three.js scene');
        window.removeEventListener('resize', handleResize);
        
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
        }
        
        if (renderer.domElement) {
          renderer.domElement.removeEventListener('mousedown', handleMouseDown);
          renderer.domElement.removeEventListener('mousemove', handleMouseMove);
          renderer.domElement.removeEventListener('mouseup', handleMouseUp);
          renderer.domElement.removeEventListener('wheel', handleWheel);
          renderer.domElement.removeEventListener('contextmenu', handleContextMenu);
        }
        
        // Remove keyboard event listeners
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
        
        renderer.dispose();
      };

    } catch (error) {
      console.error('Error initializing Three.js:', error);
    }
  }, [selectedId, setSelectedId, setObjects, hoverPointRef, setIsInitialized, scenario.destination]);

  // Update objects in scene
  useEffect(() => {
    if (!sceneRef.current || !isInitialized) return;

    console.log('Updating objects in scene, count:', objects.length);

    // Remove existing meshes
    meshesRef.current.forEach((mesh) => {
      sceneRef.current!.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(material => material.dispose());
      } else {
        mesh.material.dispose();
      }
    });
    meshesRef.current.clear();

    // Add new meshes
    objects.forEach((obj) => {
      const moduleConfig = MODULE_TYPES_3D[obj.type as keyof typeof MODULE_TYPES_3D];
      if (!moduleConfig) return;

      const isSelected = selectedId === obj.id;
      
      // Create realistic geometry using our new system
      const geometry = createModuleGeometry(moduleConfig.geometry, obj.size);
      const material = createModuleMaterial(moduleConfig, isSelected);

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...obj.position);
      mesh.rotation.set(...(obj.rotation || [0, 0, 0]));
      mesh.scale.set(...(obj.scale || [1, 1, 1]));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { id: obj.id, type: obj.type };

      sceneRef.current!.add(mesh);
      meshesRef.current.set(obj.id, mesh);
    });
  }, [objects, selectedId, isInitialized]);

  return (
    <div ref={mountRef} className="w-full h-full bg-background">
      {!isInitialized && (
        <div className="flex items-center justify-center h-full">
          <div className="text-white text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Loading 3D Scene...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility functions for localStorage persistence
const loadFromStorage = (key: string, defaultValue: any): any => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.warn(`Failed to load ${key} from storage:`, error);
    return defaultValue;
  }
};

const saveToStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save ${key} to storage:`, error);
  }
};

export default function NASAHabitatBuilder3D() {
  // Storage keys for persistence
  const STORAGE_KEYS = {
    SCENARIO: 'nasa-habitat-scenario',
    OBJECTS: 'nasa-habitat-objects', 
    SELECTED_ID: 'nasa-habitat-selected-id',
    CAD_DESIGNS: 'nasa-habitat-cad-designs',
    VALIDATION_RESULTS: 'nasa-habitat-validation-results',
    ACTIVE_TAB: 'nasa-habitat-active-tab'
  };

  // NASA Mission Scenario
  const [scenario, setScenario] = useState(() => 
    loadFromStorage(STORAGE_KEYS.SCENARIO, {
      crew_size: 4,
      mission_duration_days: 900,
      destination: 'MARS_TRANSIT' as const,
      fairing: FAIRINGS[2] // SLS Block-1
    })
  );
  
  // Habitat Configuration
  const [habitat, setHabitat] = useState({
    shape: 'CYLINDER' as const,
    levels: 2,
    dimensions: { 
      diameter_m: 6.5, 
      height_m: 12.0 
    },
    pressurized_volume_m3: 400,
    net_habitable_volume_m3: 300
  });
  
  const [objects, setObjects] = useState<HabitatObject[]>(() => 
    loadFromStorage(STORAGE_KEYS.OBJECTS, [])
  );
  const [selectedId, setSelectedId] = useState<string | null>(() => 
    loadFromStorage(STORAGE_KEYS.SELECTED_ID, null)
  );
  const [validationResults, setValidationResults] = useState<any>(() => 
    loadFromStorage(STORAGE_KEYS.VALIDATION_RESULTS, null)
  );
  const [loading, setLoading] = useState({ validation: false });
  const [showHelp, setShowHelp] = useState(false);
  const [nextId, setNextId] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // State for collapsible sections
  const [showNasaFunctional, setShowNasaFunctional] = useState(true);
  const [showCustomCad, setShowCustomCad] = useState(true);
  const [showNasaMission, setShowNasaMission] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showModuleInspector, setShowModuleInspector] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  
  // New state for save/load functionality
  const [activeTab, setActiveTab] = useState<'design' | 'collections' | 'shapes' | 'cad' | 'analyses'>(() => 
    loadFromStorage(STORAGE_KEYS.ACTIVE_TAB, 'design')
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    objectId: string | null;
  }>({ visible: false, x: 0, y: 0, objectId: null });
  
  // Clipboard for copy/paste
  const [clipboard, setClipboard] = useState<HabitatObject | null>(null);
  
  // UI control states
  const [showCameraHelp, setShowCameraHelp] = useState(true);
  const [keyboardAction, setKeyboardAction] = useState<string | null>(null);
  
  // CAD Integration - Store imported CAD designs with persistence
  const [cadDesigns, setCadDesigns] = useState<Array<{
    id: string;
    name: string;
    shapes: any[];
    bounds: { width: number; height: number; depth: number };
    thumbnail?: string;
  }>>(() => loadFromStorage(STORAGE_KEYS.CAD_DESIGNS, []));
  
  const hoverPointRef = useRef<THREE.Vector3 | null>(null);

  // Initialize database
  useEffect(() => {
    initDatabase().catch(console.error);
  }, []);

  // Trigger canvas resize when sidebar toggles
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100); // Small delay to ensure DOM has updated
    
    return () => clearTimeout(timer);
  }, [showSidebar]);

  // Persistence effects - save state to localStorage when it changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.OBJECTS, objects);
  }, [objects]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SCENARIO, scenario);
  }, [scenario]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SELECTED_ID, selectedId);
  }, [selectedId]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ACTIVE_TAB, activeTab);
  }, [activeTab]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CAD_DESIGNS, cadDesigns);
  }, [cadDesigns]);

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Handle any other click outside logic if needed
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Keyboard controls for selected objects
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!selectedId) return;
      
      // Skip if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Prevent default behavior for arrow keys to avoid page scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        event.preventDefault();
      }

      const moveStep = event.shiftKey ? 1.0 : 0.5; // Larger steps with Shift
      const rotateStep = event.shiftKey ? Math.PI / 4 : Math.PI / 8; // 45° or 22.5°

      let actionDescription = '';

      setObjects(prevObjects => 
        prevObjects.map(obj => {
          if (obj.id !== selectedId) return obj;

          const newObj = { ...obj };

          switch (event.code) {
            // Movement controls
            case 'ArrowLeft':
              newObj.position = [obj.position[0] - moveStep, obj.position[1], obj.position[2]];
              actionDescription = `Moving Left (${moveStep}m)`;
              break;
            case 'ArrowRight':
              newObj.position = [obj.position[0] + moveStep, obj.position[1], obj.position[2]];
              actionDescription = `Moving Right (${moveStep}m)`;
              break;
            case 'ArrowUp':
              if (event.ctrlKey) {
                // Ctrl + Up: Move up (Y axis)
                newObj.position = [obj.position[0], obj.position[1] + moveStep, obj.position[2]];
                actionDescription = `Moving Up (${moveStep}m)`;
              } else {
                // Up: Move forward (Z axis)
                newObj.position = [obj.position[0], obj.position[1], obj.position[2] - moveStep];
                actionDescription = `Moving Forward (${moveStep}m)`;
              }
              break;
            case 'ArrowDown':
              if (event.ctrlKey) {
                // Ctrl + Down: Move down (Y axis)
                newObj.position = [obj.position[0], obj.position[1] - moveStep, obj.position[2]];
                actionDescription = `Moving Down (${moveStep}m)`;
              } else {
                // Down: Move backward (Z axis)
                newObj.position = [obj.position[0], obj.position[1], obj.position[2] + moveStep];
                actionDescription = `Moving Backward (${moveStep}m)`;
              }
              break;

            // Rotation controls
            case 'KeyQ':
              // Q: Rotate left around Y axis
              const currentRotationY = obj.rotation?.[1] || 0;
              newObj.rotation = [obj.rotation?.[0] || 0, currentRotationY - rotateStep, obj.rotation?.[2] || 0];
              actionDescription = `Rotating Left (${Math.round(rotateStep * 180 / Math.PI)}°)`;
              break;
            case 'KeyE':
              // E: Rotate right around Y axis
              const currentRotationY2 = obj.rotation?.[1] || 0;
              newObj.rotation = [obj.rotation?.[0] || 0, currentRotationY2 + rotateStep, obj.rotation?.[2] || 0];
              actionDescription = `Rotating Right (${Math.round(rotateStep * 180 / Math.PI)}°)`;
              break;
            case 'KeyR':
              // R: Rotate around X axis (pitch up)
              const currentRotationX = obj.rotation?.[0] || 0;
              newObj.rotation = [currentRotationX + rotateStep, obj.rotation?.[1] || 0, obj.rotation?.[2] || 0];
              actionDescription = `Pitch Up (${Math.round(rotateStep * 180 / Math.PI)}°)`;
              break;
            case 'KeyF':
              // F: Rotate around X axis (pitch down)
              const currentRotationX2 = obj.rotation?.[0] || 0;
              newObj.rotation = [currentRotationX2 - rotateStep, obj.rotation?.[1] || 0, obj.rotation?.[2] || 0];
              actionDescription = `Pitch Down (${Math.round(rotateStep * 180 / Math.PI)}°)`;
              break;

            // Height controls (Y-axis movement)
            case 'KeyW':
              // W: Move up (height)
              newObj.position = [obj.position[0], obj.position[1] + moveStep, obj.position[2]];
              actionDescription = `Moving Up (${moveStep}m)`;
              break;
            case 'KeyS':
              // S: Move down (height)
              newObj.position = [obj.position[0], obj.position[1] - moveStep, obj.position[2]];
              actionDescription = `Moving Down (${moveStep}m)`;
              break;

            case 'KeyT':
              // T: Rotate around Z axis (roll left)
              const currentRotationZ = obj.rotation?.[2] || 0;
              newObj.rotation = [obj.rotation?.[0] || 0, obj.rotation?.[1] || 0, currentRotationZ - rotateStep];
              actionDescription = `Roll Left (${Math.round(rotateStep * 180 / Math.PI)}°)`;
              break;
            case 'KeyG':
              // G: Rotate around Z axis (roll right)
              const currentRotationZ2 = obj.rotation?.[2] || 0;
              newObj.rotation = [obj.rotation?.[0] || 0, obj.rotation?.[1] || 0, currentRotationZ2 + rotateStep];
              actionDescription = `Roll Right (${Math.round(rotateStep * 180 / Math.PI)}°)`;
              break;

            // Scale controls
            case 'Equal':
            case 'NumpadAdd':
              // + or =: Scale up
              if (event.ctrlKey) {
                const currentScale = obj.scale || [1, 1, 1];
                const scaleStep = 0.1;
                newObj.scale = [
                  Math.min(currentScale[0] + scaleStep, 3.0),
                  Math.min(currentScale[1] + scaleStep, 3.0),
                  Math.min(currentScale[2] + scaleStep, 3.0)
                ];
                actionDescription = `Scaling Up (${Math.round((newObj.scale[0]) * 100)}%)`;
              }
              break;
            case 'Minus':
            case 'NumpadSubtract':
              // - : Scale down
              if (event.ctrlKey) {
                const currentScale = obj.scale || [1, 1, 1];
                const scaleStep = 0.1;
                newObj.scale = [
                  Math.max(currentScale[0] - scaleStep, 0.2),
                  Math.max(currentScale[1] - scaleStep, 0.2),
                  Math.max(currentScale[2] - scaleStep, 0.2)
                ];
                actionDescription = `Scaling Down (${Math.round((newObj.scale[0]) * 100)}%)`;
              }
              break;

            // Reset controls
            case 'KeyX':
              // X: Reset rotation
              if (event.ctrlKey) {
                newObj.rotation = [0, 0, 0];
                actionDescription = 'Reset Rotation';
              }
              break;
            case 'KeyC':
              // C: Reset scale
              if (event.ctrlKey) {
                newObj.scale = [1, 1, 1];
                actionDescription = 'Reset Scale';
              }
              break;
          }

          return newObj;
        })
      );

      // Show visual feedback
      if (actionDescription) {
        setKeyboardAction(actionDescription);
        setTimeout(() => setKeyboardAction(null), 1500);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [selectedId]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CAD_DESIGNS, cadDesigns);
  }, [cadDesigns]);

  // Load design from collections
  const handleLoadDesign = useCallback((savedDesign: SavedDesign) => {
    const layout = savedDesign.layout;
    
    // Update scenario (with type casting to handle potential mismatches)
    setScenario((prev: Scenario) => ({
      ...prev,
      crew_size: layout.scenario.crew_size,
      mission_duration_days: layout.scenario.mission_duration_days,
      destination: layout.scenario.destination as any,
    }));
    
    // Convert layout modules to habitat objects
    const newObjects: HabitatObject[] = layout.modules.map((module) => ({
      id: module.id,
      type: module.type as FunctionalType,
      position: [...module.position, 0] as [number, number, number], // Add z coordinate
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      size: module.size
    }));
    
    setObjects(newObjects);
    setActiveTab('design');
    setValidationResults(null);
    
    alert(`Loaded design: ${savedDesign.name}`);
  }, []);

  // Generate unique ID for modules
  const generateId = useCallback((type: FunctionalType) => {
    const id = `${type.toLowerCase().replace('_', '-')}-${nextId}`;
    setNextId(prev => prev + 1);
    return id;
  }, [nextId]);

  // Convert to NASA Layout format
  const generateNASALayout = useCallback((): Layout => {
    return {
      scenario: {
        crew_size: scenario.crew_size,
        mission_duration_days: scenario.mission_duration_days,
        destination: scenario.destination,
        fairing: {
          name: scenario.fairing.name,
          inner_diameter_m: scenario.fairing.inner_diameter_m,
          inner_height_m: scenario.fairing.inner_height_m,
          shape: scenario.fairing.shape === "CYLINDRICAL" ? "CYLINDER" : "CONE"
        }
      },
      habitat: {
        shape: habitat.shape,
        levels: habitat.levels,
        dimensions: habitat.dimensions,
        pressurized_volume_m3: habitat.pressurized_volume_m3,
        net_habitable_volume_m3: habitat.net_habitable_volume_m3
      },
      modules: objects.map(obj => ({
        id: obj.id,
        type: obj.type,
        level: 0, // Default level for now
        position: [obj.position[0], obj.position[2]], // Convert 3D to 2D grid
        size: obj.size,
        rotation_deg: 0, // Convert from radians if needed
        crew_capacity: obj.type === 'CREW_SLEEP' ? 1 : undefined,
        equipment: []
      })),
      version: "1.0.0"
    };
  }, [scenario, habitat, objects]);

  // Save current design
  const handleSaveDesign = useCallback(async () => {
    const layoutData = generateNASALayout();
    const timestamp = new Date().toLocaleString();
    
    setIsSaving(true);
    try {
      const designId = await saveDesign({
        name: `Habitat Design ${timestamp}`,
        description: `Design with ${objects.length} modules for ${scenario.destination} mission`,
        layout: layoutData,
        tags: ['nasa', scenario.destination.toLowerCase(), `crew-${scenario.crew_size}`]
      });
      
      alert(`Design saved successfully! ID: ${designId}`);
    } catch (error) {
      console.error('Failed to save design:', error);
      alert('Failed to save design. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [objects, scenario, generateNASALayout]);

  // Quick save function for the UI button
  const quickSave = useCallback(async () => {
    if (objects.length === 0) {
      alert('No modules to save. Add some modules first.');
      return;
    }
    await handleSaveDesign();
  }, [objects, handleSaveDesign]);

  // Update the quickSave function to use handleSaveDesign

  // Store refs to 3D scene elements for drag/drop
  const sceneRefs = useRef<{
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    raycaster: THREE.Raycaster | null;
    plane: THREE.Plane | null;
  }>({
    camera: null,
    renderer: null,
    raycaster: null,
    plane: null
  });

  // Helper function to calculate 3D position from mouse coordinates
  const calculateDropPosition = useCallback((clientX: number, clientY: number): THREE.Vector3 | null => {
    const { camera, renderer, raycaster, plane } = sceneRefs.current;
    
    if (!camera || !renderer || !raycaster || !plane) {
      console.log('Scene not ready for drop calculation');
      return null;
    }

    // Calculate mouse position relative to the canvas
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    // Cast ray from camera to mouse position
    const mouse = new THREE.Vector2(x, y);
    raycaster.setFromCamera(mouse, camera);
    
    // Find intersection with ground plane
    const intersectionPoint = new THREE.Vector3();
    const intersected = raycaster.ray.intersectPlane(plane, intersectionPoint);
    
    return intersected ? intersectionPoint : null;
  }, []);

  // Handle drop on 3D canvas
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const type = e.dataTransfer.getData("module") as FunctionalType;
    if (!type) return;

    const intersectionPoint = calculateDropPosition(e.clientX, e.clientY);
    if (!intersectionPoint) {
      console.log('Could not calculate drop position');
      return;
    }

    const id = generateId(type);
    const moduleConfig = MODULE_TYPES_3D[type as keyof typeof MODULE_TYPES_3D];
    const modulePreset = MODULE_PRESETS.find(p => p.type === type);
    
    if (!moduleConfig || !modulePreset) return;

    // Position the module at the intersection point, snapped to grid
    const position: [number, number, number] = [
      snap(intersectionPoint.x), 
      moduleConfig.size.height/2, // Place on ground surface
      snap(intersectionPoint.z)
    ];
    
    const newObject: HabitatObject = { 
      id, 
      type, 
      position, 
      rotation: [0, 0, 0], 
      scale: [1, 1, 1],
      size: modulePreset.defaultSize
    };
    
    console.log('Adding NASA module at:', position, 'from drop at:', { x: e.clientX, y: e.clientY });
    setObjects((prev) => [...prev, newObject]);
    setSelectedId(id);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    
    // Update hover point during drag over for visual feedback
    const intersectionPoint = calculateDropPosition(e.clientX, e.clientY);
    if (intersectionPoint && hoverPointRef.current) {
      hoverPointRef.current.copy(intersectionPoint);
    }
  }

  // NASA Validation using real API
  const handleNASAValidation = async () => {
    setLoading(prev => ({ ...prev, validation: true }));
    try {
      const layoutData = generateNASALayout();
      console.log('Sending to NASA API:', layoutData);
      const results = await postCheckLayout(layoutData);
      setValidationResults(results);
    } catch (error) {
      console.error('NASA validation failed:', error);
      // Fallback to mock for demo
      setValidationResults({
        valid: objects.length > 0,
        issues: objects.length === 0 ? [{ id: 'NO_MODULES', severity: 'error', message: 'No modules placed' }] : [],
        suggestions: []
      });
    }
    setLoading(prev => ({ ...prev, validation: false }));
  };

  // Export NASA JSON
  const exportNASAJSON = () => {
    const data = generateNASALayout();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nasa-habitat-layout.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear layout
  const clearLayout = () => {
    setObjects([]);
    setValidationResults(null);
    setSelectedId(null);
  };

  // Context menu functions
  const deleteObject = useCallback((objectId: string) => {
    setObjects(prev => prev.filter(obj => obj.id !== objectId));
    if (selectedId === objectId) {
      setSelectedId(null);
    }
    setContextMenu({ visible: false, x: 0, y: 0, objectId: null });
  }, [selectedId]);

  const duplicateObject = useCallback((objectId: string) => {
    const objectToDuplicate = objects.find(obj => obj.id === objectId);
    if (!objectToDuplicate) return;

    const id = generateId(objectToDuplicate.type);
    const newObject: HabitatObject = {
      ...objectToDuplicate,
      id,
      position: [
        objectToDuplicate.position[0] + 2, // Offset by 2 meters
        objectToDuplicate.position[1],
        objectToDuplicate.position[2] + 2
      ]
    };

    setObjects(prev => [...prev, newObject]);
    setSelectedId(id);
    setContextMenu({ visible: false, x: 0, y: 0, objectId: null });
  }, [objects, generateId]);

  const copyObject = useCallback((objectId: string) => {
    const objectToCopy = objects.find(obj => obj.id === objectId);
    if (objectToCopy) {
      setClipboard(objectToCopy);
    }
    setContextMenu({ visible: false, x: 0, y: 0, objectId: null });
  }, [objects]);

  const pasteObject = useCallback(() => {
    if (!clipboard) return;

    const id = generateId(clipboard.type);
    const newObject: HabitatObject = {
      ...clipboard,
      id,
      position: [
        clipboard.position[0] + 2, // Offset by 2 meters
        clipboard.position[1],
        clipboard.position[2] + 2
      ]
    };

    setObjects(prev => [...prev, newObject]);
    setSelectedId(id);
    setContextMenu({ visible: false, x: 0, y: 0, objectId: null });
  }, [clipboard, generateId]);

  const resizeObject = useCallback((objectId: string, scale: number) => {
    setObjects(prev => prev.map(obj => {
      if (obj.id === objectId) {
        const currentScale = obj.scale || [1, 1, 1];
        return {
          ...obj,
          scale: [currentScale[0] * scale, currentScale[1] * scale, currentScale[2] * scale]
        };
      }
      return obj;
    }));
    setContextMenu({ visible: false, x: 0, y: 0, objectId: null });
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedId) {
        deleteObject(selectedId);
      } else if (e.ctrlKey && e.key === 'c' && selectedId) {
        copyObject(selectedId);
      } else if (e.ctrlKey && e.key === 'v' && clipboard) {
        pasteObject();
      } else if (e.ctrlKey && e.key === 'd' && selectedId) {
        e.preventDefault();
        duplicateObject(selectedId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, clipboard, deleteObject, copyObject, pasteObject, duplicateObject]);

  // Handle global click to hide context menu
  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, objectId: null });
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [contextMenu.visible]);

  // CAD Integration Functions
  const importFromCAD = useCallback(() => {
    // This would typically load saved CAD designs from database/localStorage
    // For now, let's simulate some sample CAD designs
    const sampleCADDesigns = [
      {
        id: 'cad-1',
        name: 'Custom Storage Module',
        shapes: [
          { type: 'box', width: 2, height: 2, depth: 1, position: [0, 0, 0] },
          { type: 'cylinder', radius: 0.5, height: 2, position: [1, 0, 0] }
        ],
        bounds: { width: 3, height: 2, depth: 1 }
      },
      {
        id: 'cad-2', 
        name: 'Curved Living Space',
        shapes: [
          { type: 'torus', radius: 1.5, height: 0.3, position: [0, 0, 0] },
          { type: 'sphere', radius: 1, position: [0, 1, 0] }
        ],
        bounds: { width: 3, height: 2, depth: 3 }
      }
    ];
    
    setCadDesigns(sampleCADDesigns);
    alert('CAD designs imported! Check the module library for custom modules.');
  }, []);

  const exportToCAD = useCallback(() => {
    if (objects.length === 0) {
      alert('No modules to export to CAD. Add some modules first.');
      return;
    }
    
    // Convert current habitat objects to CAD format
    const cadExport = {
      name: `Habitat Export ${new Date().toISOString().split('T')[0]}`,
      objects: objects.map(obj => ({
        id: obj.id,
        type: obj.type,
        position: obj.position,
        rotation: obj.rotation || [0, 0, 0],
        scale: obj.scale || [1, 1, 1],
        size: obj.size
      })),
      bounds: {
        width: Math.max(...objects.map(o => o.position[0] + o.size.w_m)) - Math.min(...objects.map(o => o.position[0])),
        height: Math.max(...objects.map(o => o.size.h_m)),
        depth: Math.max(...objects.map(o => o.position[2] + o.size.l_m)) - Math.min(...objects.map(o => o.position[2]))
      }
    };
    
    // Export to JSON (could be sent to CAD system)
    const blob = new Blob([JSON.stringify(cadExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'habitat-for-cad.json';
    a.click();
    URL.revokeObjectURL(url);
    
    alert('Habitat exported to CAD format!');
  }, [objects]);

  const createModuleFromCAD = useCallback((cadDesign: any) => {
    const id = generateId('CUSTOM_CAD');
    const newObject: HabitatObject = {
      id,
      type: 'CUSTOM_CAD' as any,
      position: [0, cadDesign.bounds.height / 2, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      size: {
        w_m: cadDesign.bounds.width,
        h_m: cadDesign.bounds.height,
        l_m: cadDesign.bounds.depth
      }
    };
    
    setObjects(prev => [...prev, newObject]);
    setSelectedId(id);
    alert(`Added custom CAD module: ${cadDesign.name}`);
  }, [generateId]);

  // Create a new empty design
  const createNewDesign = () => {
    // Clear existing objects
    setObjects([]);
    setSelectedId(null);
    
    // Reset scenario to defaults
    setScenario({
      crew_size: 4,
      mission_duration_days: 365,
      destination: 'mars',
      fairing: 'falcon_heavy'
    });
    
    // Add a sample module to get started
    const id = generateId('CREW_SLEEP');
    const modulePreset = MODULE_PRESETS.find(p => p.type === 'CREW_SLEEP');
    if (modulePreset) {
      const newObject: HabitatObject = {
        id,
        type: 'CREW_SLEEP',
        position: [0, 1.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        size: modulePreset.defaultSize
      };
      setObjects([newObject]);
      setSelectedId(id);
    }
    
    // Redirect to design tab
    setActiveTab('design');
    
    alert('New design created! Added a crew sleep module to get you started.');
  };

  // Add sample NASA modules
  const addSampleModule = () => {
    const sampleTypes: FunctionalType[] = ['CREW_SLEEP', 'HYGIENE', 'FOOD_PREP', 'EXERCISE'];
    sampleTypes.forEach((type, index) => {
      const id = generateId(type);
      const modulePreset = MODULE_PRESETS.find(p => p.type === type);
      if (!modulePreset) return;
      
      const newObject: HabitatObject = {
        id,
        type,
        position: [index * 3 - 4.5, 1.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        size: modulePreset.defaultSize
      };
      setObjects(prev => [...prev, newObject]);
    });
  };

  const selectedObject = objects.find(obj => obj.id === selectedId);

  return (
    <div className="w-full h-screen bg-background text-foreground space-gradient flex flex-col">
      {/* Header */}
      <header className="nav-container shadow-2xl">
        <div className="flex items-center justify-between p-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Camera className="w-6 h-6 text-white drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                NASA Habitat Designer
              </h1>
              <p className="text-xs text-muted-foreground">Professional space habitat layout tool</p>
            </div>
          </div>
          
          {/* Main Navigation Menu */}
          <nav className="flex items-center gap-1">
            <Button 
              onClick={() => setActiveTab('design')} 
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'design' 
                  ? 'bg-primary text-primary-foreground border-primary/50 shadow-lg' 
                  : 'bg-card text-card-foreground border-border hover:bg-accent hover:text-accent-foreground'
              } border`}
            >
              <Eye className="w-4 h-4" />
              <span className="font-medium">Design Area</span>
            </Button>
            
            <Button 
              onClick={() => setActiveTab('cad')} 
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'cad' 
                  ? 'bg-primary text-primary-foreground border-primary/50 shadow-lg' 
                  : 'bg-card text-card-foreground border-border hover:bg-accent hover:text-accent-foreground'
              } border`}
            >
              <Settings className="w-4 h-4" />
              <span className="font-medium">Laboratory CAD</span>
            </Button>
            
            <Button 
              onClick={() => setActiveTab('collections')} 
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'collections' 
                  ? 'bg-primary text-primary-foreground border-primary/50 shadow-lg' 
                  : 'bg-card text-card-foreground border-border hover:bg-accent hover:text-accent-foreground'
              } border`}
            >
              <Folder className="w-4 h-4" />
              <span className="font-medium">Collections</span>
            </Button>
            
            <Button 
              onClick={() => setActiveTab('analyses')} 
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'analyses' 
                  ? 'bg-primary text-primary-foreground border-primary/50 shadow-lg' 
                  : 'bg-card text-card-foreground border-border hover:bg-accent hover:text-accent-foreground'
              } border`}
            >
              <Lightbulb className="w-4 h-4" />
              <span className="font-medium">Analyses</span>
            </Button>
            
            <div className="w-px h-8 bg-border mx-2"></div>
            
            <Button 
              onClick={quickSave}
              className="px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 bg-green-600/80 hover:bg-green-600 text-white border border-green-500/50 shadow-lg"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="font-medium">Save Project</span>
            </Button>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button onClick={createNewDesign} className="btn-space px-3 py-2">
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
            <Button onClick={clearLayout} className="btn-mars px-3 py-2">
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {activeTab === 'design' ? (
          <div className="flex flex-1 relative">
            {/* NASA Mission Control Sidebar */}
            {showSidebar && (
            <aside className="w-80 nav-container shadow-2xl border-r border-border flex flex-col overflow-y-auto">
              {/* Sidebar Header with Toggle Button */}
              <div className="p-3 border-b border-border bg-card/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-primary to-blue-600 rounded-md flex items-center justify-center">
                      <Settings className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-semibold text-foreground">Mission Control</span>
                  </div>
                  <Button
                    onClick={() => setShowSidebar(false)}
                    className="w-8 h-8 p-0 rounded-lg hover:bg-accent"
                    title="Hide Sidebar"
                    variant="ghost"
                    size="sm"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Mission Scenario */}
          {/* Mission Scenario - Compact but Editable */}
          <div className="p-3 border-b border-border">
            <h3 
              className="font-semibold text-foreground mb-2 flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
              onClick={() => setShowNasaMission(!showNasaMission)}
            >
              {showNasaMission ? (
                <Minus className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              NASA Mission Scenario
            </h3>
            {showNasaMission && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-muted-foreground text-xs">Crew</Label>
                  <Input
                    type="number"
                    value={scenario.crew_size}
                    onChange={(e) => setScenario((prev: Scenario) => ({
                      ...prev,
                      crew_size: parseInt(e.target.value) || 0
                    }))}
                    className="bg-background border-border text-foreground text-xs h-7 hover:bg-accent/50 transition-colors"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Days</Label>
                  <Input
                    type="number"
                    value={scenario.mission_duration_days}
                    onChange={(e) => setScenario((prev: Scenario) => ({
                      ...prev,
                      mission_duration_days: parseInt(e.target.value) || 0
                    }))}
                    className="bg-background border-border text-foreground text-xs h-7 hover:bg-accent/50 transition-colors"
                  />
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Destination</Label>
                <select
                  value={scenario.destination}
                  onChange={(e) => setScenario((prev: Scenario) => ({
                    ...prev,
                    destination: e.target.value as any
                  }))}
                  className="w-full bg-background border border-border text-foreground text-xs h-7 rounded-md px-2 hover:bg-accent/50 transition-colors focus:ring-1 focus:ring-primary/50"
                >
                  <option value="LEO">Low Earth Orbit</option>
                  <option value="LUNAR">Lunar Surface</option>
                  <option value="MARS_TRANSIT">Mars Transit</option>
                  <option value="MARS_SURFACE">Mars Surface</option>
                  <option value="DEEP_SPACE">Deep Space</option>
                </select>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Launch Vehicle</Label>
                <select
                  value={scenario.fairing.name}
                  onChange={(e) => {
                    const fairing = FAIRINGS.find(f => f.name === e.target.value);
                    if (fairing) {
                      setScenario((prev: Scenario) => ({ ...prev, fairing }));
                    }
                  }}
                  className="w-full bg-background border border-border text-foreground text-xs h-7 rounded-md px-2 hover:bg-accent/50 transition-colors focus:ring-1 focus:ring-primary/50"
                >
                  {FAIRINGS.map(fairing => (
                    <option key={fairing.name} value={fairing.name}>
                      {fairing.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            )}
          </div>

          {/* NASA Functional Areas - Limited with Scroll */}
          <div className="p-3 border-b border-border">
            <h3 
              className="font-semibold text-foreground mb-2 flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
              onClick={() => setShowNasaFunctional(!showNasaFunctional)}
            >
              {showNasaFunctional ? (
                <Minus className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              NASA Functional Areas
            </h3>
            {showNasaFunctional && (
              <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(MODULE_TYPES_3D).map(([type, config]) => {
                    const preset = MODULE_PRESETS.find(p => p.type === type as FunctionalType);
                    return (
                      <div
                        key={type}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("module", type)}
                      className="group flex flex-col items-center gap-2 p-2 bg-card/40 hover:bg-primary/20 border border-border hover:border-primary/60 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200 backdrop-blur-sm hover:shadow-lg"
                    >
                      <div 
                        className="w-8 h-8 rounded flex items-center justify-center text-white text-sm shadow-lg flex-shrink-0"
                        style={{ backgroundColor: config.color }}
                      >
                        {config.icon}
                      </div>
                      <div className="text-center min-w-0 w-full">
                        <div className="font-medium text-foreground text-xs truncate">{preset?.label || type}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {preset?.defaultSize.w_m || config.size.width}×{preset?.defaultSize.h_m || config.size.height}×{preset?.defaultSize.l_m || config.size.depth}m
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-muted-foreground text-center mt-2">
                Scroll to see all {Object.keys(MODULE_TYPES_3D).length} functional areas
              </div>
            </div>
            )}
          </div>

          {/* Custom CAD Modules - Scrollable */}
          {cadDesigns.length > 0 && (
            <div className="p-3 border-b border-border">
              <h3 
                className="font-semibold text-foreground mb-2 flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                onClick={() => setShowCustomCad(!showCustomCad)}
              >
                {showCustomCad ? (
                  <Minus className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Custom CAD Modules
              </h3>
              {showCustomCad && (
              <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                <div className="grid grid-cols-3 gap-2">
                  {cadDesigns.map((cadDesign) => (
                    <div
                      key={cadDesign.id}
                      className="group flex flex-col items-center gap-2 p-2 bg-card/40 hover:bg-orange-500/20 border border-border hover:border-orange-500/60 rounded-lg cursor-pointer transition-all duration-200 backdrop-blur-sm hover:shadow-lg"
                      onClick={() => createModuleFromCAD(cadDesign)}
                    >
                      <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center text-white text-sm shadow-lg flex-shrink-0">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div className="text-center min-w-0 w-full">
                        <div className="font-medium text-foreground text-xs truncate">{cadDesign.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {cadDesign.bounds.width.toFixed(1)}×{cadDesign.bounds.height.toFixed(1)}×{cadDesign.bounds.depth.toFixed(1)}m
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}
            </div>
          )}

          {/* Quick Actions & Custom Shapes */}
          <div className="p-3 border-b border-border">
            <h3 
              className="font-semibold text-foreground mb-2 flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
              onClick={() => setShowQuickActions(!showQuickActions)}
            >
              {showQuickActions ? (
                <Minus className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Quick Actions
            </h3>
            {showQuickActions && (
            <div className="space-y-2">
              <Button 
                onClick={addSampleModule} 
                className="w-full btn-space text-xs py-2 h-8"
                size="sm"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Sample Module
              </Button>
              <Button 
                onClick={() => setActiveTab('shapes')} 
                className="w-full btn-space text-xs py-2 h-8"
                size="sm"
              >
                <Shapes className="w-3 h-3 mr-1" />
                Custom Shape Builder
              </Button>
              <Button 
                onClick={() => setActiveTab('cad')} 
                className="w-full btn-space text-xs py-2 h-8"
                size="sm"
              >
                <Settings className="w-3 h-3 mr-1" />
                CAD Laboratory
              </Button>
            </div>
            )}
          </div>

          {/* Selected Module Inspector */}
          {selectedObject && (
            <div className="p-4 border-b border-border">
              <h3 
                className="font-semibold text-foreground mb-3 flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                onClick={() => setShowModuleInspector(!showModuleInspector)}
              >
                {showModuleInspector ? (
                  <Minus className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Module Inspector
              </h3>
              {showModuleInspector && (
              <div className="space-y-3">
                <div className="p-3 bg-card/40 border border-border rounded-lg">
                  <div className="font-medium text-foreground capitalize flex items-center gap-2">
                    <span className="text-lg">{MODULE_TYPES_3D[selectedObject.type as keyof typeof MODULE_TYPES_3D]?.icon}</span>
                    {MODULE_PRESETS.find(p => p.type === selectedObject.type)?.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 space-y-1">
                    <div>Position: ({selectedObject.position[0].toFixed(1)}m, {selectedObject.position[1].toFixed(1)}m, {selectedObject.position[2].toFixed(1)}m)</div>
                    <div>Volume: {(selectedObject.size.w_m * selectedObject.size.l_m * selectedObject.size.h_m).toFixed(1)}m³</div>
                    <div>Area: {(selectedObject.size.w_m * selectedObject.size.l_m).toFixed(1)}m²</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setObjects((prev) => prev.filter((o) => o.id !== selectedId));
                    setSelectedId(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 border border-destructive/30 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Module
                </button>
              </div>
              )}
            </div>
          )}

          {/* Mission Status */}
          <div className="p-4 border-b border-purple-500/20">
            <h3 className="font-semibold text-purple-300 mb-3">Mission Status</h3>
            <div className="space-y-2">
              <div className="text-sm text-gray-300">
                Modules: <span className="font-medium text-purple-300">{objects.length}</span>
              </div>
              <div className="text-sm text-gray-300">
                Total Volume: <span className="font-medium text-purple-300">
                  {objects.reduce((acc, obj) => acc + (obj.size.w_m * obj.size.l_m * obj.size.h_m), 0).toFixed(1)}m³
                </span>
              </div>
              <div className="text-sm text-gray-300">
                3D Engine: <span className="font-medium text-green-300">
                  {isInitialized ? 'Active' : 'Loading...'}
                </span>
              </div>
            </div>
          </div>
        </aside>
        )}

        {/* Show Sidebar Button - when hidden */}
        {!showSidebar && (
          <Button
            onClick={() => setShowSidebar(true)}
            className="absolute top-4 left-4 z-50 w-8 h-8 p-0 rounded-lg bg-card border border-border hover:bg-accent shadow-lg"
            title="Show Sidebar"
            variant="ghost"
          >
            <PanelLeft className="w-4 h-4" />
          </Button>
        )}

        {/* 3D Canvas */}
        <main
          className="flex-1 relative"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <ThreeScene
            objects={objects}
            setObjects={setObjects}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            scenario={scenario}
            hoverPointRef={hoverPointRef}
            isInitialized={isInitialized}
            setIsInitialized={setIsInitialized}
            sceneRefs={sceneRefs}
            onContextMenu={(x, y, objectId) => {
              setContextMenu({ visible: true, x, y, objectId });
            }}
          />

          {/* NASA Mission Info Overlay */}
          <div className="absolute top-6 right-6 glass-morphism rounded-xl p-4 shadow-2xl border border-blue-500/30 glow-blue">
            <div className="text-sm space-y-2">
              <div className="font-medium text-blue-300 flex items-center gap-2 text-shadow">
                <Settings className="w-4 h-4" />
                {scenario.destination.replace('_', ' ')}
              </div>
              <div className="text-xs text-gray-300 space-y-1 text-shadow-sm">
                <div>Crew: {scenario.crew_size} members</div>
                <div>Duration: {scenario.mission_duration_days} days</div>
                <div>Vehicle: {scenario.fairing.name}</div>
                <div>Modules: {objects.length}</div>
              </div>
            </div>
          </div>

          {/* Camera Controls Help */}
          {showCameraHelp && (
            <div className="absolute bottom-6 right-6 glass-morphism rounded-xl p-3 shadow-2xl border border-purple-500/30 glow-purple max-w-[220px]">
              <div className="text-xs space-y-2">
                <div className="font-medium text-purple-300 flex items-center justify-between text-shadow">
                  <div className="flex items-center gap-2">
                    <Camera className="w-3 h-3" />
                    Controls
                  </div>
                  <button 
                    onClick={() => setShowCameraHelp(false)}
                    className="text-gray-400 hover:text-white transition-colors text-xs"
                  >
                    ×
                  </button>
                </div>
                
                <div className="text-gray-300 text-shadow-sm space-y-1">
                  <div className="text-[10px] font-medium text-purple-200">Camera:</div>
                  <div className="text-[10px]">• <kbd className="bg-gray-800/50 px-1 rounded text-[9px]">Space</kbd> + Drag: Pan</div>
                  <div className="text-[10px]">• Mouse wheel: Zoom</div>
                </div>
                
                <div className="text-gray-300 text-shadow-sm space-y-1">
                  <div className="text-[10px] font-medium text-yellow-200">Objects (when selected):</div>
                  <div className="text-[10px]">• Arrow keys: Move X/Z • W/S: Height</div>
                  <div className="text-[10px]">• Q/E: Rotate • R/F/T/G: Pitch/Roll</div>
                  <div className="text-[10px]">• Hold Shift: Faster movement</div>
                </div>
              </div>
            </div>
          )}

          {selectedId && (
            <div className="absolute top-6 left-6 glass-morphism rounded-xl p-3 shadow-2xl border border-yellow-500/40 glow-orange max-w-[280px]">
              <div className="flex items-center gap-2 text-yellow-300 font-medium mb-2 text-shadow text-xs">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-lg"></div>
                Module Selected - Keyboard Controls
              </div>
              <div className="text-[10px] text-gray-300 space-y-1 text-shadow-sm">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">←→</kbd> Move X</div>
                  <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">↑↓</kbd> Move Z</div>
                  <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">W/S</kbd> Height</div>
                  <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">Q/E</kbd> Rotate Y</div>
                  <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">R/F</kbd> Pitch</div>
                  <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">T/G</kbd> Roll</div>
                  <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">Ctrl+±</kbd> Scale</div>
                  <div><kbd className="bg-gray-700/80 px-1 py-0.5 rounded text-[8px]">Shift</kbd> Fast</div>
                </div>
                <div className="text-[9px] text-gray-400 mt-2 border-t border-gray-600/50 pt-1">
                  Ctrl+X: Reset rotation • Ctrl+C: Reset scale
                </div>
              </div>
            </div>
          )}

          {/* Keyboard Action Feedback */}
          {keyboardAction && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-black/80 backdrop-blur-sm border border-green-500/50 rounded-lg px-4 py-2 shadow-2xl animate-pulse">
              <div className="flex items-center gap-2 text-green-300 font-medium text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                {keyboardAction}
              </div>
            </div>
          )}
        </main>
          </div>
        ) : activeTab === 'collections' ? (
          <Collections
            currentLayout={generateNASALayout()}
            onLoadDesign={handleLoadDesign}
            onSaveSuccess={() => setActiveTab('design')}
          />
        ) : activeTab === 'shapes' ? (
          <ShapeBuilder />
        ) : activeTab === 'cad' ? (
          <CADShapeBuilder 
            onBackToDesign={() => setActiveTab('design')} 
            onSaveDesign={(design) => {
              setCadDesigns(prev => [...prev, {
                id: Date.now().toString(),
                name: design.name,
                shapes: design.shapes,
                bounds: design.bounds
              }]);
              alert(`CAD design "${design.name}" is now available as a custom module!`);
            }}
          />
        ) : activeTab === 'analyses' ? (
          <div className="flex-1 bg-gradient-to-br from-purple-950/20 via-transparent to-pink-950/20 p-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-purple-200 mb-2 flex items-center gap-3">
                  <Lightbulb className="w-8 h-8 text-purple-400" />
                  Habitat Analysis Center
                </h2>
                <p className="text-gray-400">Comprehensive analysis and validation tools for your habitat design</p>
              </div>
              
              {/* Real-time Metrics */}
              <MetricsHeader 
                nhv={habitat.net_habitable_volume_m3}
                pressurizedVolume={habitat.pressurized_volume_m3}
                utilization={Math.min(100, (objects.reduce((sum, obj) => sum + (obj.size.w_m * obj.size.l_m * obj.size.h_m), 0) / habitat.net_habitable_volume_m3) * 100)}
                corridorStatus={objects.length > 0 ? 'success' : 'danger'}
              />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* NASA Validation Panel */}
                <Card className="glass-morphism border-purple-500/30 shadow-xl glow-purple">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-200">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      NASA Standards Validation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-300 text-sm">Validate your habitat design against NASA standards and requirements.</p>
                    <Button 
                      onClick={handleNASAValidation} 
                      disabled={loading.validation}
                      className="w-full btn-nasa"
                    >
                      {loading.validation ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Validating Design...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Run NASA Validation
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick Analysis Panel */}
                <Card className="glass-morphism border-orange-500/30 shadow-xl glow-orange">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-200">
                      <Lightbulb className="w-5 h-5 text-orange-400" />
                      Quick Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-800/40 p-3 rounded-lg">
                        <div className="text-gray-400">Total Modules</div>
                        <div className="text-2xl font-bold text-orange-300">{objects.length}</div>
                      </div>
                      <div className="bg-gray-800/40 p-3 rounded-lg">
                        <div className="text-gray-400">Total Volume</div>
                        <div className="text-2xl font-bold text-orange-300">
                          {objects.reduce((sum, obj) => sum + (obj.size.w_m * obj.size.l_m * obj.size.h_m), 0).toFixed(1)}m³
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Validation Results Display */}
              {validationResults && (
                <div className="mt-6">
                  <Card className="glass-morphism border-green-500/30 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-200">
                        {validationResults.valid ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            Validation Passed
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-400" />
                            Validation Issues Found
                          </>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {validationResults.issues?.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-red-300 font-medium mb-2">Issues to Address:</h4>
                          <ul className="space-y-1">
                            {validationResults.issues.map((issue: any, index: number) => (
                              <li key={index} className="text-red-200 text-sm flex items-center gap-2">
                                <XCircle className="w-4 h-4" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {validationResults.suggestions?.length > 0 && (
                        <div>
                          <h4 className="text-blue-300 font-medium mb-2">Suggestions:</h4>
                          <ul className="space-y-1">
                            {validationResults.suggestions.map((suggestion: any, index: number) => (
                              <li key={index} className="text-blue-200 text-sm flex items-center gap-2">
                                <Lightbulb className="w-4 h-4" />
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        ) : (
          <ShapeBuilder />
        )}
      </div>

      {/* NASA Validation Results */}
      {validationResults && (
        <div className="glass-morphism border-t border-purple-500/20 p-4 shadow-2xl">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Validation Results */}
              <Card className="glass-morphism border-purple-500/30 shadow-xl glow-purple">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-200 text-shadow">
                    {validationResults.valid ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    NASA Validation Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {validationResults.valid ? (
                    <Alert className="border-green-500/40 bg-green-900/30 backdrop-blur-sm">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <AlertDescription className="text-green-200 text-shadow-sm">
                        Habitat layout meets NASA requirements and safety standards.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2">
                      {validationResults.issues?.map((issue: any, index: number) => (
                        <Alert key={index} className="border-red-500/40 bg-red-900/30 backdrop-blur-sm">
                          <XCircle className="h-4 w-4 text-red-400" />
                          <AlertDescription className="text-red-200 text-shadow-sm">{issue.message}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                  {validationResults.suggestions?.map((suggestion: any, index: number) => (
                    <Alert key={index} className="border-orange-500/40 bg-orange-900/30 backdrop-blur-sm">
                      <Lightbulb className="h-4 w-4 text-orange-400" />
                      <AlertDescription className="text-orange-200 text-shadow-sm">{suggestion.message}</AlertDescription>
                    </Alert>
                  ))}
                </CardContent>
              </Card>

              {/* NASA Layout JSON */}
              <Card className="glass-morphism border-purple-500/30 shadow-xl glow-blue">
                <CardHeader>
                  <CardTitle className="text-purple-300 text-shadow">NASA Layout Schema</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-900/60 backdrop-blur-sm p-4 rounded-lg overflow-x-auto text-gray-300 max-h-64 border border-gray-700/50">
                    {JSON.stringify(generateNASALayout(), null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
      
      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed bg-gray-900 border border-gray-600 rounded-lg shadow-xl z-50 py-2 min-w-[160px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            transform: 'translate(-50%, 0)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.objectId ? (
            <>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-800 text-sm text-gray-200 flex items-center gap-2"
                onClick={() => resizeObject(contextMenu.objectId!, 1.2)}
              >
                🔍 Zoom In (120%)
              </button>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-800 text-sm text-gray-200 flex items-center gap-2"
                onClick={() => resizeObject(contextMenu.objectId!, 0.8)}
              >
                🔎 Zoom Out (80%)
              </button>
              <hr className="border-gray-700 my-1" />
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-800 text-sm text-gray-200 flex items-center gap-2"
                onClick={() => duplicateObject(contextMenu.objectId!)}
              >
                📋 Duplicate
              </button>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-800 text-sm text-gray-200 flex items-center gap-2"
                onClick={() => copyObject(contextMenu.objectId!)}
              >
                📄 Copy
              </button>
              {clipboard && (
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-800 text-sm text-gray-200 flex items-center gap-2"
                  onClick={() => pasteObject()}
                >
                  📁 Paste
                </button>
              )}
              <hr className="border-gray-700 my-1" />
              <button
                className="w-full px-4 py-2 text-left hover:bg-red-800 text-sm text-red-300 flex items-center gap-2"
                onClick={() => deleteObject(contextMenu.objectId!)}
              >
                🗑️ Delete
              </button>
            </>
          ) : (
            clipboard && (
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-800 text-sm text-gray-200 flex items-center gap-2"
                onClick={() => pasteObject()}
              >
                📁 Paste
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}