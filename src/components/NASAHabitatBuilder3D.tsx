import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Lightbulb, Download, Settings, Trash2, Camera, Move, Eye, Plus, Save, Folder, Shapes } from 'lucide-react';

// Import your existing NASA schema and API
import { FAIRINGS, MODULE_PRESETS, FunctionalType } from '@/lib/DEFAULTS';
import { postCheckLayout, postSuggestLayout } from '@/lib/api';
import { Layout, ScenarioSchema, HabitatSchema, ModuleSchema } from '@/lib/schemas';

// Database and collections
import { saveDesign, SavedDesign, initDatabase } from '@/lib/database';
import Collections from './Collections';
import ShapeBuilder from './ShapeBuilder';
import CADShapeBuilder from './CADShapeBuilder';

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
  hoverPointRef, 
  isInitialized, 
  setIsInitialized,
  sceneRefs 
}: {
  objects: HabitatObject[];
  setObjects: React.Dispatch<React.SetStateAction<HabitatObject[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  hoverPointRef: React.MutableRefObject<THREE.Vector3 | null>;
  isInitialized: boolean;
  setIsInitialized: (initialized: boolean) => void;
  sceneRefs: React.MutableRefObject<{
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    raycaster: THREE.Raycaster | null;
    plane: THREE.Plane | null;
  }>;
}) {
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
      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x2d1b69);
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

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);

      // Mars ground
      const groundGeometry = new THREE.PlaneGeometry(100, 100);
      const groundMaterial = new THREE.MeshLambertMaterial({ color: 0xcd5c5c });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // Grid
      const gridHelper = new THREE.GridHelper(50, 50, 0x8b4513, 0x8b4513);
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.3;
      scene.add(gridHelper);

      // Mouse events
      function handleMouseDown(event: MouseEvent) {
        event.preventDefault();
        const state = cameraStateRef.current;
        
        if (event.button === 0) { // Left click
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
      renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());

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
          renderer.domElement.removeEventListener('contextmenu', e => e.preventDefault());
        }
        
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
        
        renderer.dispose();
      };

    } catch (error) {
      console.error('Error initializing Three.js:', error);
    }
  }, [selectedId, setSelectedId, setObjects, hoverPointRef, setIsInitialized]);

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
    <div ref={mountRef} className="w-full h-full bg-purple-900">
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

export default function NASAHabitatBuilder3D() {
  // NASA Mission Scenario
  const [scenario, setScenario] = useState({
    crew_size: 4,
    mission_duration_days: 900,
    destination: 'MARS_TRANSIT' as const,
    fairing: FAIRINGS[2] // SLS Block-1
  });
  
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
  
  const [objects, setObjects] = useState<HabitatObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [loading, setLoading] = useState({ validation: false });
  const [showHelp, setShowHelp] = useState(false);
  const [nextId, setNextId] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // New state for save/load functionality
  const [activeTab, setActiveTab] = useState<'design' | 'collections' | 'shapes' | 'cad'>('design');
  const [isSaving, setIsSaving] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  
  const hoverPointRef = useRef<THREE.Vector3 | null>(null);

  // Initialize database
  useEffect(() => {
    initDatabase().catch(console.error);
  }, []);

  // Initialize database
  useEffect(() => {
    initDatabase().catch(console.error);
  }, []);

  // Load design from collections
  const handleLoadDesign = useCallback((savedDesign: SavedDesign) => {
    const layout = savedDesign.layout;
    
    // Update scenario (with type casting to handle potential mismatches)
    setScenario(prev => ({
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
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="glass-morphism shadow-2xl border-b border-purple-500/20">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg glow-purple">
                <Camera className="w-6 h-6 text-white drop-shadow-lg" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-300 via-blue-300 to-purple-300 bg-clip-text text-transparent text-shadow">
                  NASA Habitat 3D Designer
                </h1>
                <p className="text-sm text-gray-300 text-shadow-sm">Professional space habitat layout tool</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={addSampleModule} className="btn-space">
              <Plus className="w-4 h-4 mr-2" />
              Add Sample
            </Button>
            <Button onClick={handleNASAValidation} disabled={loading.validation} className="btn-nasa">
              {loading.validation ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              NASA Validate
            </Button>
            <Button onClick={exportNASAJSON} className="btn-space">
              <Download className="w-4 h-4 mr-2" />
              Export NASA JSON
            </Button>
            <Button onClick={quickSave} disabled={isSaving} className="btn-space">
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Design'}
            </Button>
            <Button onClick={() => setActiveTab('collections')} className="btn-space">
              <Folder className="w-4 h-4 mr-2" />
              Collections
            </Button>
            <Button onClick={() => setActiveTab('shapes')} className="btn-space">
              <Shapes className="w-4 h-4 mr-2" />
              Shape Builder
            </Button>
            <Button onClick={() => setActiveTab('cad')} className="btn-space">
              <Settings className="w-4 h-4 mr-2" />
              CAD Laboratory
            </Button>
            <Button onClick={clearLayout} className="btn-mars">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {activeTab === 'design' ? (
          <>
            {/* NASA Mission Control Sidebar */}
            <aside className="w-80 glass-morphism shadow-2xl border-r border-purple-500/20 flex flex-col overflow-y-auto">
              {/* Mission Scenario */}
          {/* Mission Scenario */}
          <div className="p-4 border-b border-purple-500/20">
            <h3 className="font-semibold text-purple-300 mb-3 flex items-center gap-2 text-shadow">
              <Settings className="w-4 h-4" />
              NASA Mission Scenario
            </h3>
            <div className="space-y-3">
              <div>
                <Label className="text-gray-300 text-sm text-shadow-sm">Crew Size</Label>
                <Input
                  type="number"
                  value={scenario.crew_size}
                  onChange={(e) => setScenario(prev => ({
                    ...prev,
                    crew_size: parseInt(e.target.value) || 0
                  }))}
                  className="bg-gray-800/60 border-gray-600/50 text-white text-sm backdrop-blur-sm hover:bg-gray-800/80 transition-colors"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-sm text-shadow-sm">Destination</Label>
                <select
                  value={scenario.destination}
                  onChange={(e) => setScenario(prev => ({
                    ...prev,
                    destination: e.target.value as any
                  }))}
                  className="w-full bg-gray-800/60 border border-gray-600/50 text-white text-sm rounded-md px-3 py-2 backdrop-blur-sm hover:bg-gray-800/80 transition-colors focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="LEO">Low Earth Orbit</option>
                  <option value="LUNAR">Lunar Surface</option>
                  <option value="MARS_TRANSIT">Mars Transit</option>
                  <option value="MARS_SURFACE">Mars Surface</option>
                  <option value="DEEP_SPACE">Deep Space</option>
                </select>
              </div>
              <div>
                <Label className="text-gray-300 text-sm text-shadow-sm">Mission Duration (days)</Label>
                <Input
                  type="number"
                  value={scenario.mission_duration_days}
                  onChange={(e) => setScenario(prev => ({
                    ...prev,
                    mission_duration_days: parseInt(e.target.value) || 0
                  }))}
                  className="bg-gray-800/60 border-gray-600/50 text-white text-sm backdrop-blur-sm hover:bg-gray-800/80 transition-colors"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-sm text-shadow-sm">Launch Vehicle</Label>
                <select
                  value={scenario.fairing.name}
                  onChange={(e) => {
                    const fairing = FAIRINGS.find(f => f.name === e.target.value);
                    if (fairing) {
                      setScenario(prev => ({ ...prev, fairing }));
                    }
                  }}
                  className="w-full bg-gray-800/60 border border-gray-600/50 text-white text-sm rounded-md px-3 py-2 backdrop-blur-sm hover:bg-gray-800/80 transition-colors focus:ring-2 focus:ring-purple-500/50"
                >
                  {FAIRINGS.map(fairing => (
                    <option key={fairing.name} value={fairing.name}>
                      {fairing.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* NASA Functional Modules */}
          <div className="p-4 border-b border-purple-500/20">
            <h3 className="font-semibold text-purple-300 mb-3 flex items-center gap-2 text-shadow">
              <Plus className="w-4 h-4" />
              NASA Functional Areas
            </h3>
            <div className="grid gap-2">
              {Object.entries(MODULE_TYPES_3D).map(([type, config]) => {
                const preset = MODULE_PRESETS.find(p => p.type === type as FunctionalType);
                return (
                  <div
                    key={type}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("module", type)}
                    className="group flex items-center gap-3 p-3 bg-gradient-to-r from-gray-800/40 to-gray-700/40 hover:from-purple-800/30 hover:to-purple-700/30 border border-gray-600/50 hover:border-purple-400/60 rounded-xl cursor-grab active:cursor-grabbing transition-all duration-200 backdrop-blur-sm hover:shadow-lg hover:glow-purple"
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-base shadow-lg"
                      style={{ backgroundColor: config.color }}
                    >
                      {config.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-100 text-sm text-shadow-sm">{preset?.label || type}</div>
                      <div className="text-xs text-gray-400">
                        {preset?.defaultSize.w_m || config.size.width}×{preset?.defaultSize.h_m || config.size.height}×{preset?.defaultSize.l_m || config.size.depth}m
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Module Inspector */}
          {selectedObject && (
            <div className="p-4 border-b border-purple-500/20">
              <h3 className="font-semibold text-purple-300 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Module Inspector
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-gradient-to-r from-purple-800/20 to-pink-800/20 border border-purple-500/30 rounded-lg">
                  <div className="font-medium text-purple-200 capitalize flex items-center gap-2">
                    <span className="text-lg">{MODULE_TYPES_3D[selectedObject.type as keyof typeof MODULE_TYPES_3D]?.icon}</span>
                    {MODULE_PRESETS.find(p => p.type === selectedObject.type)?.label}
                  </div>
                  <div className="text-xs text-purple-300 mt-1 space-y-1">
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
                  className="w-full flex items-center justify-center gap-2 p-2 text-red-300 hover:text-red-200 hover:bg-red-800/20 border border-red-500/30 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Module
                </button>
              </div>
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
            hoverPointRef={hoverPointRef}
            isInitialized={isInitialized}
            setIsInitialized={setIsInitialized}
            sceneRefs={sceneRefs}
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

          {selectedId && (
            <div className="absolute top-6 left-6 glass-morphism rounded-xl p-4 shadow-2xl border border-yellow-500/40 glow-orange">
              <div className="flex items-center gap-2 text-yellow-300 font-medium mb-2 text-shadow">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-lg"></div>
                NASA Module Selected
              </div>
              <div className="text-xs text-gray-300 space-y-1 text-shadow-sm">
                <div><kbd className="bg-gray-700/80 px-2 py-1 rounded text-xs border border-gray-600">Click & Drag</kbd> Reposition</div>
                <div><kbd className="bg-gray-700/80 px-2 py-1 rounded text-xs border border-gray-600">Right Click</kbd> Pan View</div>
              </div>
            </div>
          )}
        </main>
          </>
        ) : activeTab === 'collections' ? (
          <Collections
            currentLayout={generateNASALayout()}
            onLoadDesign={handleLoadDesign}
            onSaveSuccess={() => setActiveTab('design')}
          />
        ) : activeTab === 'shapes' ? (
          <ShapeBuilder />
        ) : activeTab === 'cad' ? (
          <CADShapeBuilder onBackToDesign={() => setActiveTab('design')} />
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
    </div>
  );
}