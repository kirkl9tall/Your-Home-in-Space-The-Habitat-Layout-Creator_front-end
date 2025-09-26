// src/components/CADShapeBuilder.tsx
/**
 * CAD-like Shape Builder Laboratory
 * Advanced shape creation and assembly tool for NASA habitat modules
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Box, 
  Circle, 
  Cylinder, 
  Layers,
  Move3D,
  RotateCw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Grid,
  Zap,
  Settings,
  Palette,
  MousePointer,
  Scale,
  Minus,
  ArrowLeft
} from 'lucide-react';
import { saveCustomShape, CustomShape } from '../lib/database';

// Enhanced interfaces for CAD functionality
interface ShapeParameters {
  width: number;
  height: number;
  depth: number;
  radius?: number;
  segments?: number;
  materialType?: 'solid' | 'wireframe' | 'glass' | 'metal';
  transparency?: number;
  hasWalls?: boolean;
  wallThickness?: number;
  wallHeight?: number;
  frameWidth?: number;
  frameSpacing?: number;
}

interface CADShape {
  id: string;
  name: string;
  type: string;
  geometry: THREE.BufferGeometry | null;
  material: THREE.Material | null;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  visible: boolean;
  locked: boolean;
  parameters: ShapeParameters;
  layer: string;
  mesh?: THREE.Group;
}

interface CADLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
  shapes: string[];
}

// Tool modes
type CADTool = 'select' | 'move' | 'rotate' | 'scale' | 'create' | 'pan';
type BooleanOperation = 'union' | 'subtract' | 'intersect';

// Shape preset definitions
interface ShapePreset {
  id: string;
  name: string;
  type: string;
  icon: React.ReactNode;
  category: 'basic' | 'structural' | 'connector' | 'custom';
  description: string;
  defaultParams: ShapeParameters;
}

const SHAPE_PRESETS: ShapePreset[] = [
  // Basic Shapes
  {
    id: 'box',
    name: 'Cube',
    type: 'box',
    icon: <Box className="w-5 h-5" />,
    category: 'basic',
    description: 'Basic cubic shape',
    defaultParams: { width: 2.0, height: 2.0, depth: 2.0, materialType: 'solid', transparency: 1.0 }
  },
  {
    id: 'cylinder',
    name: 'Cylinder',
    type: 'cylinder',
    icon: <Cylinder className="w-5 h-5" />,
    category: 'basic',
    description: 'Cylindrical shape',
    defaultParams: { width: 2.0, height: 3.0, depth: 2.0, radius: 1.0, segments: 16, materialType: 'solid', transparency: 1.0 }
  },
  {
    id: 'sphere',
    name: 'Sphere',
    type: 'sphere',
    icon: <Circle className="w-5 h-5" />,
    category: 'basic',
    description: 'Spherical shape',
    defaultParams: { width: 2.0, height: 2.0, depth: 2.0, radius: 1.0, segments: 16, materialType: 'solid', transparency: 1.0 }
  },
  {
    id: 'cone',
    name: 'Cone',
    type: 'cone',
    icon: <div className="w-5 h-5 triangle-up"></div>,
    category: 'basic',
    description: 'Conical shape',
    defaultParams: { width: 2.0, height: 3.0, depth: 2.0, radius: 1.0, segments: 16, materialType: 'solid', transparency: 1.0 }
  },
  {
    id: 'torus',
    name: 'Torus',
    type: 'torus',
    icon: <Circle className="w-5 h-5" />,
    category: 'basic',
    description: 'Ring/donut shape',
    defaultParams: { width: 2.0, height: 0.5, depth: 2.0, radius: 1.0, segments: 16, materialType: 'solid', transparency: 1.0 }
  },
  {
    id: 'plane',
    name: 'Plane',
    type: 'plane',
    icon: <Minus className="w-5 h-5" />,
    category: 'basic',
    description: 'Flat plane surface',
    defaultParams: { width: 3.0, height: 0.1, depth: 3.0, materialType: 'solid', transparency: 1.0 }
  },
  // Structural Elements
  {
    id: 'structural-beam',
    name: 'Support Beam',
    type: 'box',
    icon: <Minus className="w-5 h-5 rotate-45" />,
    category: 'structural',
    description: 'Structural support beam',
    defaultParams: { width: 0.2, height: 3.0, depth: 0.2, materialType: 'metal', transparency: 1.0 }
  },
  {
    id: 'connector-node',
    name: 'Connector Node',
    type: 'sphere',
    icon: <Circle className="w-5 h-5" />,
    category: 'connector',
    description: 'Connection point between modules',
    defaultParams: { width: 0.5, height: 0.5, depth: 0.5, radius: 0.25, segments: 8, materialType: 'metal', transparency: 1.0 }
  },
  // Frame Structures
  {
    id: 'frame-structure',
    name: 'Frame Structure',
    type: 'wireframe',
    icon: <Grid className="w-5 h-5" />,
    category: 'structural',
    description: 'Wireframe structural element',
    defaultParams: { width: 2.0, height: 2.0, depth: 2.0, frameWidth: 0.1, frameSpacing: 0.5, materialType: 'wireframe', transparency: 1.0 }
  }
];

const DEFAULT_LAYERS: CADLayer[] = [
  { id: 'layer-1', name: 'Main Structure', visible: true, locked: false, color: '#8B5CF6', shapes: [] },
  { id: 'layer-2', name: 'Support Elements', visible: true, locked: false, color: '#06B6D4', shapes: [] },
  { id: 'layer-3', name: 'Connectors', visible: true, locked: false, color: '#EF4444', shapes: [] }
];

const CADShapeBuilder: React.FC<{ 
  onBackToDesign?: () => void;
  onSaveDesign?: (design: {
    name: string;
    shapes: CADShape[];
    bounds: { width: number; height: number; depth: number };
  }) => void;
}> = ({ onBackToDesign, onSaveDesign }) => {
  // Core state
  const [shapes, setShapes] = useState<Map<string, CADShape>>(new Map());
  const [layers, setLayers] = useState<CADLayer[]>(DEFAULT_LAYERS);
  const [selectedShapes, setSelectedShapes] = useState<Set<string>>(new Set());
  const [activeLayer, setActiveLayer] = useState('layer-1');
  const [currentTool, setCurrentTool] = useState<CADTool>('create');
  
  // Shape creation state
  const [selectedPreset, setSelectedPreset] = useState<ShapePreset>(SHAPE_PRESETS[0]);
  const [parameters, setParameters] = useState<ShapeParameters>(SHAPE_PRESETS[0].defaultParams);
  
  // UI state
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [panelMode, setPanelMode] = useState<'shapes' | 'layers' | 'properties' | 'materials'>('shapes');
  
  // Project state
  const [projectName, setProjectName] = useState('Untitled Project');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  
  // 3D Scene refs
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const controlsRef = useRef<any>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // Generate unique ID for shapes
  const generateId = () => `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    // Camera setup - Orthographic for isometric CAD view
    const frustumSize = 30; // Increased for better view
    const aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
    const camera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      1000
    );
    // Set isometric view angle (45 degrees from top-down, better positioned)
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting - Enhanced for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Increased intensity
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Increased intensity
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Add additional light from another angle
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-10, 10, -5);
    scene.add(directionalLight2);

    // Grid
    if (showGrid) {
      const gridHelper = new THREE.GridHelper(20, 20, 0x8B5CF6, 0x333333);
      scene.add(gridHelper);
    }

    // Add a test cube to verify Three.js is working
    const testGeometry = new THREE.BoxGeometry(1, 1, 1);
    const testMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const testCube = new THREE.Mesh(testGeometry, testMaterial);
    testCube.position.set(0, 0.5, 0);
    testCube.castShadow = true;
    testCube.receiveShadow = true;
    scene.add(testCube);
    console.log('Added test cube at origin');

    // Simple CAD controls - no orbit, fixed isometric view
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let currentFrustumSize = frustumSize;

    // Set up raycaster and mouse vector
    const raycaster = new THREE.Raycaster();
    raycasterRef.current = raycaster;
    mouseRef.current = new THREE.Vector2();
    
    // Set up controls reference for external access
    controlsRef.current = {
      camera,
      scene,
      renderer,
      raycaster: raycasterRef.current,
      mouse: mouseRef.current
    };

    let isDragging = false;
    let dragStartPoint = new THREE.Vector3();
    let dragStartPos = new THREE.Vector3();
    let isCreatingShape = false;
    let previewShape: THREE.Group | null = null;

    const handleMouseDown = (event: MouseEvent) => {
      if (currentTool === 'pan') {
        isMouseDown = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
      } else if (currentTool === 'create') {
        // Create mode - click on canvas to place shape
        const rect = renderer.domElement.getBoundingClientRect();
        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Set up raycaster to find ground intersection
        raycaster.setFromCamera(mouseRef.current, camera);
        
        // Cast ray to ground plane (y = 0)
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(groundPlane, intersectPoint);
        
        if (intersectPoint) {
          // Start creating shape at click position
          isCreatingShape = true;
          dragStartPoint.copy(intersectPoint);
          
          // Create preview shape
          previewShape = createShapeFromPreset(selectedPreset, { ...parameters, width: 0.5, height: 0.5, depth: 0.5 });
          previewShape.position.copy(intersectPoint);
          
          // Position shape properly based on type
          if (selectedPreset.type === 'plane') {
            previewShape.position.y = 0.01; // Just slightly above ground
          } else {
            previewShape.position.y = (parameters.height || 1.0) / 2; // Half height to sit on ground
          }
          
          // Make preview shape semi-transparent
          previewShape.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
              const material = child.material as THREE.MeshStandardMaterial;
              material.transparent = true;
              material.opacity = 0.5;
            }
          });
          
          scene.add(previewShape);
          console.log('Started creating shape at:', intersectPoint);
        }
      } else if (currentTool === 'select' || currentTool === 'move') {
        // Handle shape selection with raycaster
        const rect = renderer.domElement.getBoundingClientRect();
        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Set up raycaster
        raycaster.setFromCamera(mouseRef.current, camera);
        
        // Find intersections
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        if (intersects.length > 0) {
          const clickedObject = intersects[0].object;
          let parent = clickedObject.parent;
          
          // Find the top-level group that contains our shape data
          while (parent && !parent.userData.cadShapeId) {
            parent = parent.parent;
          }
          
          if (parent && parent.userData.cadShapeId) {
            const shapeId = parent.userData.cadShapeId;
            const shape = shapes.get(shapeId);
            
            if (shape && !shape.locked) {
              if (event.ctrlKey || event.metaKey) {
                // Multi-select
                const newSelection = new Set(selectedShapes);
                if (newSelection.has(shapeId)) {
                  newSelection.delete(shapeId);
                } else {
                  newSelection.add(shapeId);
                }
                setSelectedShapes(newSelection);
              } else {
                // Single select
                setSelectedShapes(new Set([shapeId]));
                
                // Initialize dragging for move tool
                if (currentTool === 'move') {
                  isDragging = true;
                  dragStartPoint.copy(intersects[0].point);
                  dragStartPos.copy(parent.position);
                }
              }
            }
          }
        } else if (!event.ctrlKey && !event.metaKey) {
          // Clicked on empty space - clear selection
          setSelectedShapes(new Set());
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (isMouseDown && currentTool === 'pan') {
        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;
        
        // Pan the camera by moving its position (for isometric view)
        const panSpeed = 0.05;
        camera.position.x -= deltaX * panSpeed;
        camera.position.z -= deltaY * panSpeed;
        camera.lookAt(camera.position.x - 10, 0, camera.position.z - 10);
        
        mouseX = event.clientX;
        mouseY = event.clientY;
      } else if (isCreatingShape && previewShape && currentTool === 'create') {
        // Handle shape creation dragging
        const rect = renderer.domElement.getBoundingClientRect();
        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouseRef.current, camera);
        
        // Cast ray to ground plane
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(groundPlane, intersectPoint);
        
        if (intersectPoint) {
          // Calculate size based on drag distance
          const distance = dragStartPoint.distanceTo(intersectPoint);
          const newSize = Math.max(0.5, distance * 2); // Minimum size of 0.5
          
          // Update preview shape size
          previewShape.scale.set(newSize / parameters.width, newSize / parameters.height, newSize / parameters.depth);
          
          console.log('Updating shape size:', newSize);
        }
      } else if (isDragging && currentTool === 'move' && selectedShapes.size > 0) {
        // Handle shape dragging
        const rect = renderer.domElement.getBoundingClientRect();
        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouseRef.current, camera);
        
        // Create an invisible ground plane for dragging
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectionPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersectionPoint);
        
        if (intersectionPoint) {
          const deltaMove = intersectionPoint.sub(dragStartPoint);
          
          // Move all selected shapes
          selectedShapes.forEach(shapeId => {
            const shape = shapes.get(shapeId);
            if (shape && shape.mesh && !shape.locked) {
              shape.mesh.position.copy(dragStartPos.clone().add(deltaMove));
            }
          });
        }
      }
    };

    const handleMouseUp = () => {
      if (isCreatingShape && previewShape) {
        // Finalize shape creation
        const finalSize = Math.max(previewShape.scale.x, 0.5);
        const finalParams = {
          ...parameters,
          width: parameters.width * finalSize,
          height: parameters.height * finalSize,
          depth: parameters.depth * finalSize
        };
        
        // Remove preview shape
        scene.remove(previewShape);
        
        // Create final shape
        const id = generateId();
        const finalGroup = createShapeFromPreset(selectedPreset, finalParams);
        finalGroup.position.copy(previewShape.position);
        
        const cadShape: CADShape = {
          id,
          name: `${selectedPreset.name} ${shapes.size + 1}`,
          type: selectedPreset.type,
          geometry: finalGroup.children[0] ? (finalGroup.children[0] as THREE.Mesh).geometry : null,
          material: finalGroup.children[0] ? (finalGroup.children[0] as THREE.Mesh).material as THREE.Material : null,
          position: finalGroup.position.clone(),
          rotation: finalGroup.rotation.clone(),
          scale: finalGroup.scale.clone(),
          visible: true,
          locked: false,
          parameters: finalParams,
          layer: activeLayer,
          mesh: finalGroup
        };

        // Add to scene
        scene.add(finalGroup);
        finalGroup.userData = { cadShapeId: id };
        
        // Update state
        setShapes(prev => new Map(prev.set(id, cadShape)));
        
        // Add to active layer
        setLayers(prev => prev.map(layer => 
          layer.id === activeLayer 
            ? { ...layer, shapes: [...layer.shapes, id] }
            : layer
        ));
        
        console.log('Shape created with final size:', finalSize, 'at position:', finalGroup.position);
        
        // Reset creation state
        isCreatingShape = false;
        previewShape = null;
      }
      
      isMouseDown = false;
      isDragging = false;
    };

    const handleWheel = (event: WheelEvent) => {
      // Zoom by adjusting the camera's frustum size
      const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9;
      currentFrustumSize = Math.max(5, Math.min(50, currentFrustumSize * zoomFactor));
      
      const aspect = mountRef.current?.clientWidth! / mountRef.current?.clientHeight!;
      camera.left = -currentFrustumSize * aspect / 2;
      camera.right = currentFrustumSize * aspect / 2;
      camera.top = currentFrustumSize / 2;
      camera.bottom = -currentFrustumSize / 2;
      camera.updateProjectionMatrix();
    };

    // Mouse event listeners for canvas interaction
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleWheel);

    // Animation loop - fixed isometric view
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      // Camera stays in fixed isometric position - no orbit
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize for orthographic camera
    const handleResize = () => {
      if (mountRef.current) {
        const aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
        camera.left = -currentFrustumSize * aspect / 2;
        camera.right = currentFrustumSize * aspect / 2;
        camera.top = currentFrustumSize / 2;
        camera.bottom = -currentFrustumSize / 2;
        camera.updateProjectionMatrix();
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [showGrid, currentTool]);

  // Create shape from preset
  const createShapeFromPreset = useCallback((preset: ShapePreset, params: ShapeParameters): THREE.Group => {
    console.log('Creating shape with preset:', preset.type, preset.name, params);
    
    const group = new THREE.Group();
    
    // Create main geometry
    let geometry: THREE.BufferGeometry;
    
    switch (preset.type) {
      case 'box':
        console.log('Creating box geometry');
        geometry = new THREE.BoxGeometry(params.width, params.height, params.depth);
        break;
      case 'cylinder':
        console.log('Creating cylinder geometry');
        geometry = new THREE.CylinderGeometry(
          params.radius || params.width / 2,
          params.radius || params.width / 2,
          params.height,
          params.segments || 32
        );
        break;
      case 'sphere':
        console.log('Creating sphere geometry');
        geometry = new THREE.SphereGeometry(
          params.radius || params.width / 2,
          params.segments || 32,
          params.segments || 16
        );
        break;
      case 'cone':
        console.log('Creating cone geometry');
        geometry = new THREE.ConeGeometry(
          params.radius || params.width / 2,
          params.height,
          params.segments || 32
        );
        break;
      case 'torus':
        console.log('Creating torus geometry');
        geometry = new THREE.TorusGeometry(
          params.radius || params.width / 2,
          (params.radius || params.width / 2) * 0.3,
          params.segments || 16,
          (params.segments || 16) * 2
        );
        break;
      case 'plane':
        console.log('Creating plane geometry');
        geometry = new THREE.PlaneGeometry(params.width, params.depth);
        // Rotate plane to lay flat
        geometry.rotateX(-Math.PI / 2);
        break;
      case 'wireframe':
        console.log('Creating wireframe geometry');
        geometry = new THREE.BoxGeometry(params.width, params.height, params.depth);
        break;
      default:
        console.log('Creating default box geometry for type:', preset.type);
        geometry = new THREE.BoxGeometry(params.width, params.height, params.depth);
    }

    // Create material
    const createMaterial = () => {
      const materialProps = {
        transparent: (params.transparency || 1.0) < 1.0,
        opacity: params.transparency || 1.0,
        wireframe: params.materialType === 'wireframe'
      };

      switch (params.materialType) {
        case 'glass':
          return new THREE.MeshPhysicalMaterial({
            ...materialProps,
            color: 0x88ccff,
            transmission: 0.9,
            roughness: 0.1,
            metalness: 0.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
          });
        case 'metal':
          return new THREE.MeshStandardMaterial({
            ...materialProps,
            color: 0x999999,
            metalness: 0.8,
            roughness: 0.2
          });
        case 'wireframe':
          return new THREE.MeshBasicMaterial({
            color: 0x8B5CF6,
            wireframe: true
          });
        default:
          return new THREE.MeshStandardMaterial({
            ...materialProps,
            color: preset.type === 'cylinder' ? 0x4ade80 : 
                   preset.type === 'sphere' ? 0xf59e0b :
                   preset.type === 'cone' ? 0xef4444 :
                   preset.type === 'torus' ? 0x06b6d4 :
                   preset.type === 'plane' ? 0x10b981 : 0x8B5CF6,
            metalness: 0.1,
            roughness: 0.4
          });
      }
    };

    const material = createMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Add some debugging to ensure we're creating the right geometry
    console.log(`Creating shape: ${preset.type}`, {
      geometry: geometry.type,
      bounds: geometry.boundingBox,
      material: material.type,
      params
    });
    
    // Ensure geometry is computed
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    
    group.add(mesh);

    // Add walls if enabled
    if (params.hasWalls && params.wallThickness) {
      const wallGeometry = new THREE.BoxGeometry(
        params.width + params.wallThickness * 2,
        params.wallHeight || params.height,
        params.depth + params.wallThickness * 2
      );
      const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666,
        transparent: true,
        opacity: 0.7
      });
      const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      group.add(wallMesh);
    }

    // Add wireframe structure if enabled
    if (preset.type === 'wireframe') {
      const frameGeometry = new THREE.EdgesGeometry(geometry);
      const frameMaterial = new THREE.LineBasicMaterial({
        color: 0x8B5CF6,
        linewidth: params.frameWidth || 2
      });
      const frameLines = new THREE.LineSegments(frameGeometry, frameMaterial);
      group.add(frameLines);
    }

    return group;
  }, []);

  // Delete selected shapes
  const deleteSelectedShapes = () => {
    if (sceneRef.current) {
      selectedShapes.forEach(shapeId => {
        const shape = shapes.get(shapeId);
        if (shape && !shape.locked && shape.mesh) {
          sceneRef.current!.remove(shape.mesh);
        }
      });
    }

    // Update state
    const newShapes = new Map(shapes);
    const shapesToDelete = Array.from(selectedShapes).filter(id => {
      const shape = shapes.get(id);
      return shape && !shape.locked;
    });
    
    shapesToDelete.forEach(id => newShapes.delete(id));
    setShapes(newShapes);

    // Remove from layers
    setLayers(prev => prev.map(layer => ({
      ...layer,
      shapes: layer.shapes.filter(id => !shapesToDelete.includes(id))
    })));

    setSelectedShapes(new Set());
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedShapes.size > 0) {
          deleteSelectedShapes();
        }
      } else if (event.key === 'Escape') {
        setSelectedShapes(new Set());
        updateShapeSelection();
      } else if (event.key === 'a' && (event.ctrlKey || event.metaKey)) {
        // Select all
        event.preventDefault();
        setSelectedShapes(new Set(shapes.keys()));
        updateShapeSelection();
      } else if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
        // Save project
        event.preventDefault();
        saveProject();
      }
      
      // Tool switching shortcuts
      switch (event.key) {
        case 'c':
          setCurrentTool('create');
          break;
        case 'v':
          setCurrentTool('select');
          break;
        case 'm':
          setCurrentTool('move');
          break;
        case 'r':
          setCurrentTool('rotate');
          break;
        case 's':
          if (!event.ctrlKey && !event.metaKey) {
            setCurrentTool('scale');
          }
          break;
        case 'h':
          setCurrentTool('pan');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapes, shapes]);

  // Update selection visual feedback when selection changes
  useEffect(() => {
    updateShapeSelection();
  }, [selectedShapes]);

  // Save project as custom shape
  const saveProject = async () => {
    if (!projectName.trim()) return;
    
    setIsSaving(true);
    setSaveStatus(null);
    
    try {
      // Calculate bounding box
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      
      shapes.forEach(shape => {
        const pos = shape.position;
        const params = shape.parameters;
        minX = Math.min(minX, pos.x - params.width / 2);
        maxX = Math.max(maxX, pos.x + params.width / 2);
        minY = Math.min(minY, pos.y - params.height / 2);
        maxY = Math.max(maxY, pos.y + params.height / 2);
        minZ = Math.min(minZ, pos.z - params.depth / 2);
        maxZ = Math.max(maxZ, pos.z + params.depth / 2);
      });

      const customShape: Omit<CustomShape, 'id' | 'createdAt'> = {
        name: projectName.trim(),
        description: `CAD Assembly with ${shapes.size} components`,
        geometryType: 'assembly',
        parameters: {
          width: maxX - minX || 5,
          height: maxY - minY || 5,
          depth: maxZ - minZ || 5,
          components: shapes.size
        } as any,
        category: 'custom'
      };

      await saveCustomShape(customShape);
      setSaveStatus('Project saved successfully! Available in Collections for drag-and-drop.');
      
      // Also call the callback to make it available in NASA design area
      if (onSaveDesign) {
        const shapesArray = Array.from(shapes.values());
        onSaveDesign({
          name: projectName.trim(),
          shapes: shapesArray,
          bounds: {
            width: maxX - minX || 5,
            height: maxY - minY || 5,
            depth: maxZ - minZ || 5
          }
        });
      }
      
      setTimeout(() => setSaveStatus(null), 3000);
      
    } catch (error) {
      console.error('Error saving project:', error);
      setSaveStatus('Error saving project. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle mouse clicks for shape selection
  const handleCanvasClick = (event: React.MouseEvent) => {
    if (currentTool !== 'select' || !sceneRef.current || !cameraRef.current || !mountRef.current) return;
    
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    // Set up raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    
    // Find intersections
    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
    
    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      let parent = clickedObject.parent;
      
      // Find the top-level group that contains our shape data
      while (parent && !parent.userData.cadShapeId) {
        parent = parent.parent;
      }
      
      if (parent && parent.userData.cadShapeId) {
        const shapeId = parent.userData.cadShapeId;
        const shape = shapes.get(shapeId);
        
        if (shape && !shape.locked) {
          if (event.ctrlKey || event.metaKey) {
            // Multi-select
            const newSelection = new Set(selectedShapes);
            if (newSelection.has(shapeId)) {
              newSelection.delete(shapeId);
            } else {
              newSelection.add(shapeId);
            }
            setSelectedShapes(newSelection);
          } else {
            // Single select
            setSelectedShapes(new Set([shapeId]));
          }
          
          // Visual feedback - highlight selected shapes
          updateShapeSelection();
        }
      }
    } else if (!event.ctrlKey && !event.metaKey) {
      // Clicked on empty space - clear selection
      setSelectedShapes(new Set());
      updateShapeSelection();
    }
  };

  // Update visual selection indicators
  const updateShapeSelection = () => {
    if (!sceneRef.current) return;
    
    shapes.forEach((shape, shapeId) => {
      if (shape.mesh) {
        const isSelected = selectedShapes.has(shapeId);
        
        // Add selection outline (simplified - just change material properties)
        shape.mesh.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            if (isSelected) {
              child.material = child.material.clone();
              (child.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x444444);
            } else {
              // Reset to original material - you'd want to store original materials
              (child.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x000000);
            }
          }
        });
      }
    });
  };

  // Boolean operations placeholder
  const performBooleanOperation = (operation: BooleanOperation) => {
    if (selectedShapes.size < 2) {
      setSaveStatus('Select at least 2 shapes for boolean operations');
      setTimeout(() => setSaveStatus(null), 2000);
      return;
    }
    
    setSaveStatus(`${operation} operation would be performed on ${selectedShapes.size} shapes`);
    setTimeout(() => setSaveStatus(null), 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-black text-white">
      {/* Header Toolbar */}
      <div className="h-14 bg-black/20 border-b border-purple-500/30 flex items-center px-4 gap-4">
        {/* Back Navigation */}
        <div className="flex items-center gap-2 border-r border-gray-600 pr-4">
          <button
            onClick={onBackToDesign}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors flex items-center gap-2"
            title="Back to Main Design"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Design</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-gray-800/50 border border-gray-600 rounded px-3 py-1 text-sm w-48"
            placeholder="Project name..."
          />
        </div>

        {/* Tool Selection */}
        <div className="flex items-center gap-2 border-l border-gray-600 pl-4">
          {[
            { tool: 'create' as CADTool, icon: Plus, label: 'Create - Click & Drag on Canvas' },
            { tool: 'select' as CADTool, icon: MousePointer, label: 'Select' },
            { tool: 'move' as CADTool, icon: Move3D, label: 'Move' },
            { tool: 'rotate' as CADTool, icon: RotateCw, label: 'Rotate' },
            { tool: 'scale' as CADTool, icon: Scale, label: 'Scale' }
          ].map(({ tool, icon: Icon, label }) => (
            <button
              key={tool}
              onClick={() => setCurrentTool(tool)}
              className={`p-2 rounded transition-colors ${
                currentTool === tool 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Boolean Operations */}
        <div className="flex items-center gap-2 border-l border-gray-600 pl-4">
          <button
            onClick={() => performBooleanOperation('union')}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            title="Union"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => performBooleanOperation('subtract')}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            title="Subtract"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => performBooleanOperation('intersect')}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            title="Intersect"
          >
            <Circle className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={deleteSelectedShapes}
            disabled={selectedShapes.size === 0}
            className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50"
            title="Delete Selected"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={saveProject}
            disabled={isSaving || shapes.size === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Project'}
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Left Panel - Reduced width for maximum canvas space */}
        <div className="w-48 bg-black/10 border-r border-purple-500/20 flex flex-col">
          {/* Panel Navigation */}
          <div className="flex border-b border-gray-600">
            {[
              { mode: 'shapes' as const, icon: Box, label: 'Shapes' },
              { mode: 'layers' as const, icon: Layers, label: 'Layers' },
              { mode: 'properties' as const, icon: Settings, label: 'Properties' },
              { mode: 'materials' as const, icon: Palette, label: 'Materials' }
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setPanelMode(mode)}
                className={`flex-1 p-3 text-sm transition-colors ${
                  panelMode === mode 
                    ? 'bg-purple-500/20 text-purple-200 border-b-2 border-purple-500' 
                    : 'hover:bg-gray-800/50'
                }`}
              >
                <Icon className="w-4 h-4 mx-auto mb-1" />
                <div>{label}</div>
              </button>
            ))}
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {panelMode === 'shapes' && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-purple-200">Shape Library</h3>
                
                {/* Shape Categories */}
                {Object.entries(
                  SHAPE_PRESETS.reduce((acc, preset) => {
                    if (!acc[preset.category]) acc[preset.category] = [];
                    acc[preset.category].push(preset);
                    return acc;
                  }, {} as Record<string, ShapePreset[]>)
                ).map(([category, presets]) => (
                  <div key={category} className="mb-6">
                    <h4 className="text-sm font-medium mb-3 text-gray-300 capitalize">{category} Shapes</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {presets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => {
                            console.log('Selected preset:', preset.type, preset.name);
                            setSelectedPreset(preset);
                            setParameters(preset.defaultParams);
                          }}
                          className={`p-3 rounded-lg border transition-all ${
                            selectedPreset.id === preset.id
                              ? 'border-purple-500 bg-purple-500/20 text-purple-200'
                              : 'border-gray-600 bg-gray-800/30 hover:border-purple-400 hover:bg-gray-700/50'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            {preset.icon}
                            <span className="text-xs text-center">{preset.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Parameters for Selected Shape */}
                {selectedPreset && (
                  <div className="border-t border-gray-600 pt-4 mt-4">
                    <h4 className="text-sm font-medium mb-3 text-purple-200">Shape Parameters</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Width</label>
                        <input
                          type="range"
                          min="0.1"
                          max="10"
                          step="0.1"
                          value={parameters.width}
                          onChange={(e) => setParameters(prev => ({ ...prev, width: parseFloat(e.target.value) }))}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-400">{parameters.width.toFixed(1)}m</div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">Height</label>
                        <input
                          type="range"
                          min="0.1"
                          max="10"
                          step="0.1"
                          value={parameters.height}
                          onChange={(e) => setParameters(prev => ({ ...prev, height: parseFloat(e.target.value) }))}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-400">{parameters.height.toFixed(1)}m</div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">Depth</label>
                        <input
                          type="range"
                          min="0.1"
                          max="10"
                          step="0.1"
                          value={parameters.depth}
                          onChange={(e) => setParameters(prev => ({ ...prev, depth: parseFloat(e.target.value) }))}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-400">{parameters.depth.toFixed(1)}m</div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">Material</label>
                        <select
                          value={parameters.materialType || 'solid'}
                          onChange={(e) => setParameters(prev => ({ ...prev, materialType: e.target.value as any }))}
                          className="w-full px-2 py-1 bg-gray-800/50 border border-gray-600 rounded text-xs"
                        >
                          <option value="solid">Solid</option>
                          <option value="wireframe">Wireframe</option>
                          <option value="glass">Glass</option>
                          <option value="metal">Metal</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Interactive Creation Instructions */}
                <div className="w-full mt-4 p-3 bg-gradient-to-r from-green-600/20 to-blue-600/20 
                             border border-green-500/30 text-green-200 font-medium rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Plus className="w-4 h-4" />
                    <span>Interactive Creation Mode</span>
                  </div>
                  <div className="text-xs text-center text-gray-300">
                    Switch to CREATE tool above, then click & drag on the canvas to place and size shapes
                  </div>
                </div>
              </div>
            )}

            {panelMode === 'layers' && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-purple-200">Layers</h3>
                
                {layers.map((layer) => (
                  <div
                    key={layer.id}
                    className={`mb-2 p-3 rounded-lg border transition-colors cursor-pointer ${
                      activeLayer === layer.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-600 bg-gray-800/30 hover:bg-gray-700/50'
                    }`}
                    onClick={() => setActiveLayer(layer.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: layer.color }}
                        />
                        <span className="text-sm font-medium">{layer.name}</span>
                        <span className="text-xs text-gray-400">({layer.shapes.length})</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLayers(prev => prev.map(l => 
                              l.id === layer.id ? { ...l, visible: !l.visible } : l
                            ));
                          }}
                          className="p-1 hover:bg-gray-600 rounded"
                        >
                          {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLayers(prev => prev.map(l => 
                              l.id === layer.id ? { ...l, locked: !l.locked } : l
                            ));
                          }}
                          className="p-1 hover:bg-gray-600 rounded"
                        >
                          {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {panelMode === 'properties' && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-purple-200">Properties</h3>
                {selectedShapes.size > 0 ? (
                  <div>
                    <p className="text-sm text-gray-400 mb-4">
                      {selectedShapes.size} shape(s) selected
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Position X</label>
                        <input
                          type="number"
                          step="0.1"
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white"
                          placeholder="0.0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Position Y</label>
                        <input
                          type="number"
                          step="0.1"
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white"
                          placeholder="0.0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Position Z</label>
                        <input
                          type="number"
                          step="0.1"
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white"
                          placeholder="0.0"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Select shapes to edit properties</p>
                )}
              </div>
            )}

            {panelMode === 'materials' && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-purple-200">Material Editor</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Material Type</label>
                    <select
                      value={parameters.materialType || 'solid'}
                      onChange={(e) => setParameters(prev => ({ 
                        ...prev, 
                        materialType: e.target.value as any 
                      }))}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white"
                    >
                      <option value="solid">Solid</option>
                      <option value="wireframe">Wireframe</option>
                      <option value="glass">Glass</option>
                      <option value="metal">Metal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Transparency</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={parameters.transparency || 1.0}
                      onChange={(e) => setParameters(prev => ({ 
                        ...prev, 
                        transparency: parseFloat(e.target.value) 
                      }))}
                      className="w-full"
                    />
                    <div className="text-right text-sm text-gray-400">
                      {((parameters.transparency || 1.0) * 100).toFixed(0)}%
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hasWalls"
                      checked={parameters.hasWalls || false}
                      onChange={(e) => setParameters(prev => ({ 
                        ...prev, 
                        hasWalls: e.target.checked 
                      }))}
                      className="rounded"
                    />
                    <label htmlFor="hasWalls" className="text-sm font-medium">Add Walls</label>
                  </div>

                  {parameters.hasWalls && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Wall Thickness</label>
                      <input
                        type="range"
                        min="0.05"
                        max="0.5"
                        step="0.05"
                        value={parameters.wallThickness || 0.2}
                        onChange={(e) => setParameters(prev => ({ 
                          ...prev, 
                          wallThickness: parseFloat(e.target.value) 
                        }))}
                        className="w-full"
                      />
                      <div className="text-right text-sm text-gray-400">
                        {(parameters.wallThickness || 0.2).toFixed(2)}m
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main 3D Viewport */}
        <div className="flex-1 relative">
          <div 
            ref={mountRef} 
            className="w-full h-full cursor-crosshair" 
            onClick={handleCanvasClick}
          />
          
          {/* Viewport Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded transition-colors ${
                showGrid ? 'bg-purple-500' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title="Toggle Grid"
            >
              <Grid className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`p-2 rounded transition-colors ${
                snapToGrid ? 'bg-purple-500' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title="Snap to Grid"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>

          {/* Status Bar */}
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
            <div className="text-sm space-y-1">
              <div>Shapes: {shapes.size}</div>
              <div>Selected: {selectedShapes.size}</div>
              <div className="text-purple-300">Tool: {currentTool}</div>
              <div>Layer: {layers.find(l => l.id === activeLayer)?.name}</div>
              <div className="text-xs text-yellow-300 mt-2">
                {currentTool === 'create' && 'Click & drag on canvas to create shapes'}
                {currentTool === 'select' && 'Click shapes to select them'}
                {currentTool === 'move' && 'Drag selected shapes to move them'}
                {currentTool === 'pan' && 'Drag to orbit around the scene'}
              </div>
              <div className="text-xs text-gray-400">
                Isometric View • Wheel: Zoom • Pan: Drag to move view
              </div>
              <div className="text-xs text-gray-400">
                Keys: C=Create, V=Select, M=Move, R=Rotate, S=Scale, H=Pan
              </div>
            </div>
          </div>

          {/* Save Status */}
          {saveStatus && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                          bg-black/80 backdrop-blur-sm rounded-lg p-4 max-w-md text-center">
              <div className={`text-sm ${
                saveStatus.includes('Error') ? 'text-red-200' : 'text-green-200'
              }`}>
                {saveStatus}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CADShapeBuilder;