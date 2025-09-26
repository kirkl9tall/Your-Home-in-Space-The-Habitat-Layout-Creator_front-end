// src/components/ShapeBuilder.tsx
/**
 * 3D Shape Builder for creating custom NASA habitat modules
 * Allows users to design custom geometries with parameters
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Box, 
  Circle, 
  Cylinder, 
  Save, 
  Download, 
  RefreshCw,
  Layers,
  Move3D,
  RotateCcw
} from 'lucide-react';
import { saveCustomShape, CustomShape } from '../lib/database';

// Shape parameter interfaces
interface ShapeParameters {
  width: number;
  height: number;
  depth: number;
  radius?: number;
  segments?: number;
  topRadius?: number;
  bottomRadius?: number;
  wireframe?: boolean;
  materialType?: 'solid' | 'wireframe' | 'glass' | 'metal';
  transparency?: number;
  hasWalls?: boolean;
  wallThickness?: number;
  wallHeight?: number;
  frameWidth?: number;
  frameSpacing?: number;
  tubularSegments?: number;
}

// Shape preset definitions

interface ShapePreset {
  id: string;
  name: string;
  type: 'basic' | 'composite' | 'parametric';
  icon: React.ReactNode;
  defaultParams: ShapeParameters;
  description: string;
  category: 'habitat' | 'utility' | 'structural';
}

// Built-in shape presets
const SHAPE_PRESETS: ShapePreset[] = [
  {
    id: 'rectangular_module',
    name: 'Rectangular Module',
    type: 'basic',
    icon: <Box className="w-5 h-5" />,
    defaultParams: { width: 3.0, height: 2.5, depth: 2.0, wireframe: false, hasWalls: false, materialType: 'solid', transparency: 0.8 },
    description: 'Standard rectangular habitat module',
    category: 'habitat'
  },
  {
    id: 'wireframe_structure',
    name: 'Wireframe Structure',
    type: 'basic',
    icon: <Box className="w-5 h-5" />,
    defaultParams: { width: 4.0, height: 3.0, depth: 3.0, wireframe: true, frameWidth: 0.1, frameSpacing: 0.5, materialType: 'wireframe', transparency: 1.0 },
    description: 'Structural wireframe for construction',
    category: 'structural'
  },
  {
    id: 'walled_room',
    name: 'Room with Walls',
    type: 'composite',
    icon: <Box className="w-5 h-5" />,
    defaultParams: { width: 4.0, height: 2.8, depth: 4.0, hasWalls: true, wallThickness: 0.2, wallHeight: 2.5, materialType: 'solid', transparency: 0.9 },
    description: 'Enclosed room with separate walls',
    category: 'habitat'
  },
  {
    id: 'cylindrical_module',
    name: 'Cylindrical Module',
    type: 'basic',
    icon: <Cylinder className="w-5 h-5" />,
    defaultParams: { width: 2.5, height: 3.0, depth: 2.5, radius: 1.25, segments: 16, materialType: 'solid', transparency: 0.8 },
    description: 'Pressurized cylindrical module',
    category: 'habitat'
  },
  {
    id: 'glass_dome',
    name: 'Glass Dome',
    type: 'basic',
    icon: <Circle className="w-5 h-5" />,
    defaultParams: { width: 4.0, height: 2.0, depth: 4.0, radius: 2.0, segments: 16, materialType: 'glass', transparency: 0.3 },
    description: 'Transparent observation dome',
    category: 'habitat'
  },
  {
    id: 'metal_frame',
    name: 'Metal Frame',
    type: 'parametric',
    icon: <Circle className="w-5 h-5" />,
    defaultParams: { width: 3.0, height: 3.0, depth: 3.0, wireframe: true, frameWidth: 0.15, materialType: 'metal', transparency: 1.0 },
    description: 'Heavy duty metal framework',
    category: 'structural'
  },
  {
    id: 'airlock_ring',
    name: 'Airlock Ring',
    type: 'parametric',
    icon: <Circle className="w-5 h-5" />,
    defaultParams: { width: 2.0, height: 0.5, depth: 2.0, radius: 1.0, tubularSegments: 8, materialType: 'metal', transparency: 0.8 },
    description: 'Ring-shaped airlock chamber',
    category: 'structural'
  },
  {
    id: 'composite_lab',
    name: 'Multi-Level Lab',
    type: 'composite',
    icon: <Layers className="w-5 h-5" />,
    defaultParams: { width: 4.0, height: 3.5, depth: 3.0, segments: 8, hasWalls: true, wallThickness: 0.15, materialType: 'solid', transparency: 0.8 },
    description: 'Complex laboratory with multiple levels and walls',
    category: 'habitat'
  }
];

export default function ShapeBuilder() {
  const [selectedPreset, setSelectedPreset] = useState<ShapePreset>(SHAPE_PRESETS[0]);
  const [parameters, setParameters] = useState<ShapeParameters>(SHAPE_PRESETS[0].defaultParams);
  const [shapeName, setShapeName] = useState('');
  const [shapeDescription, setShapeDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize 3D preview
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 400 / 300, 0.1, 1000);
    camera.position.set(5, 3, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(400, 300);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 20, 0x333333, 0x333333);
    scene.add(gridHelper);

    // Axes helper
    const axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update 3D preview when parameters change
  const updatePreview = useCallback(() => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

    // Remove existing mesh
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      if (meshRef.current.geometry) meshRef.current.geometry.dispose();
      if (Array.isArray(meshRef.current.material)) {
        meshRef.current.material.forEach(m => m.dispose());
      } else if (meshRef.current.material) {
        meshRef.current.material.dispose();
      }
    }

    // Create composite group for complex shapes
    const group = new THREE.Group();

    // Create main geometry
    const mainGeometry = createMainGeometry();
    const mainMaterial = createMaterial('main');
    const mainMesh = new THREE.Mesh(mainGeometry, mainMaterial);
    mainMesh.position.y = parameters.height / 2;
    group.add(mainMesh);

    // Add walls if enabled
    if (parameters.hasWalls) {
      const walls = createWalls();
      walls.forEach(wall => group.add(wall));
    }

    // Add wireframe structure if enabled
    if (parameters.wireframe && selectedPreset.id.includes('frame')) {
      const frameStructure = createFrameStructure();
      frameStructure.forEach(frame => group.add(frame));
    }

    group.castShadow = true;
    group.receiveShadow = true;
    sceneRef.current.add(group);
    meshRef.current = group as any;

    // Start animation loop
    const animate = () => {
      if (meshRef.current) {
        meshRef.current.rotation.y += 0.005;
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animate();
  }, [selectedPreset, parameters]);

  // Create main geometry based on preset
  const createMainGeometry = useCallback((): THREE.BufferGeometry => {
    const { width, height, depth, radius, segments } = parameters;
    
    switch (selectedPreset.id) {
      case 'rectangular_module':
      case 'wireframe_structure':
      case 'walled_room':
        return new THREE.BoxGeometry(width, height, depth);
        
      case 'cylindrical_module':
        return new THREE.CylinderGeometry(
          radius || width / 2,
          radius || width / 2,
          height,
          segments || 16
        );
        
      case 'glass_dome':
        return new THREE.SphereGeometry(
          radius || width / 2,
          segments || 16,
          (segments || 16) / 2,
          0,
          Math.PI * 2,
          0,
          Math.PI / 2
        );
        
      case 'metal_frame':
        return new THREE.BoxGeometry(width, height, depth);
        
      case 'airlock_ring':
        return new THREE.TorusGeometry(
          radius || width / 2,
          height / 4,
          segments || 8,
          parameters.tubularSegments || 16
        );
        
      case 'composite_lab':
        return new THREE.BoxGeometry(width, height * 0.7, depth);
        
      default:
        return new THREE.BoxGeometry(width, height, depth);
    }
  }, [selectedPreset, parameters]);

  // Create appropriate material based on type
  const createMaterial = useCallback((component: 'main' | 'wall' | 'frame') => {
    const baseColor = component === 'wall' ? 0x888888 : 
                     component === 'frame' ? 0xaaaaaa : 0x4A90E2;
    
    const materialProps: any = {
      color: baseColor,
      transparent: true,
      opacity: parameters.transparency || 0.8,
    };

    switch (parameters.materialType) {
      case 'wireframe':
        return new THREE.MeshBasicMaterial({ 
          ...materialProps, 
          wireframe: true,
          color: 0x00ff00,
          opacity: 1.0
        });
        
      case 'glass':
        return new THREE.MeshPhysicalMaterial({
          ...materialProps,
          transmission: 0.9,
          roughness: 0.1,
          metalness: 0,
          clearcoat: 1,
          clearcoatRoughness: 0.1,
          color: 0x88ccff,
          opacity: parameters.transparency || 0.3
        });
        
      case 'metal':
        return new THREE.MeshStandardMaterial({
          ...materialProps,
          metalness: 0.8,
          roughness: 0.2,
          color: 0x999999
        });
        
      default:
        return new THREE.MeshLambertMaterial(materialProps);
    }
  }, [parameters]);

  // Create wall structures
  const createWalls = useCallback((): THREE.Mesh[] => {
    const walls: THREE.Mesh[] = [];
    const { width, depth, wallThickness = 0.2, wallHeight } = parameters;
    const height = wallHeight || parameters.height;
    const material = createMaterial('wall');

    // Front wall
    const frontWall = new THREE.BoxGeometry(width, height, wallThickness);
    const frontMesh = new THREE.Mesh(frontWall, material);
    frontMesh.position.set(0, height / 2, depth / 2);
    walls.push(frontMesh);

    // Back wall
    const backWall = new THREE.BoxGeometry(width, height, wallThickness);
    const backMesh = new THREE.Mesh(backWall, material);
    backMesh.position.set(0, height / 2, -depth / 2);
    walls.push(backMesh);

    // Left wall
    const leftWall = new THREE.BoxGeometry(wallThickness, height, depth);
    const leftMesh = new THREE.Mesh(leftWall, material);
    leftMesh.position.set(-width / 2, height / 2, 0);
    walls.push(leftMesh);

    // Right wall
    const rightWall = new THREE.BoxGeometry(wallThickness, height, depth);
    const rightMesh = new THREE.Mesh(rightWall, material);
    rightMesh.position.set(width / 2, height / 2, 0);
    walls.push(rightMesh);

    return walls;
  }, [parameters, createMaterial]);

  // Create wireframe structure
  const createFrameStructure = useCallback((): THREE.Mesh[] => {
    const frames: THREE.Mesh[] = [];
    const { width, height, depth, frameWidth = 0.1, frameSpacing = 0.5 } = parameters;
    const material = createMaterial('frame');

    // Vertical frames
    for (let x = -width/2; x <= width/2; x += frameSpacing) {
      for (let z = -depth/2; z <= depth/2; z += frameSpacing) {
        if (Math.abs(x) === width/2 || Math.abs(z) === depth/2) {
          const frame = new THREE.BoxGeometry(frameWidth, height, frameWidth);
          const mesh = new THREE.Mesh(frame, material);
          mesh.position.set(x, height / 2, z);
          frames.push(mesh);
        }
      }
    }

    // Horizontal frames (top)
    for (let x = -width/2; x <= width/2; x += frameSpacing) {
      const topFrame = new THREE.BoxGeometry(frameWidth, frameWidth, depth);
      const mesh = new THREE.Mesh(topFrame, material);
      mesh.position.set(x, height, 0);
      frames.push(mesh);
    }

    for (let z = -depth/2; z <= depth/2; z += frameSpacing) {
      const topFrame = new THREE.BoxGeometry(width, frameWidth, frameWidth);
      const mesh = new THREE.Mesh(topFrame, material);
      mesh.position.set(0, height, z);
      frames.push(mesh);
    }

    return frames;
  }, [parameters, createMaterial]);

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  // Handle parameter changes
  const updateParameter = (key: keyof ShapeParameters, value: number | string | boolean) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  // Handle preset selection
  const selectPreset = (preset: ShapePreset) => {
    setSelectedPreset(preset);
    setParameters(preset.defaultParams);
    setShapeName(preset.name);
    setShapeDescription(preset.description);
  };

  // Save custom shape to database
  const handleSaveShape = async () => {
    if (!shapeName.trim()) return;
    
    setIsSaving(true);
    setSaveStatus(null);
    
    try {
      const customShape: Omit<CustomShape, 'id' | 'createdAt'> = {
        name: shapeName.trim(),
        description: shapeDescription.trim() || 'Custom shape created with Shape Builder',
        geometryType: selectedPreset.id,
        parameters: parameters,
        category: 'custom'
      };

      await saveCustomShape(customShape);
      setSaveStatus('Shape saved successfully! It\'s now available in your Collections.');
      
      // Reset form after successful save
      setTimeout(() => {
        setSaveStatus(null);
        setShapeName('');
        setShapeDescription('');
      }, 3000);
      
    } catch (error) {
      console.error('Error saving custom shape:', error);
      setSaveStatus('Error saving shape. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Export shape parameters
  const exportShape = () => {
    const shapeData = {
      name: shapeName,
      preset: selectedPreset.id,
      parameters,
      description: shapeDescription,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(shapeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${shapeName || 'custom-shape'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-black/20 border-b border-purple-500/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Move3D className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                Shape Builder
              </h1>
              <p className="text-sm text-gray-300">Create custom 3D habitat modules</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportShape} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button onClick={handleSaveShape} disabled={isSaving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50">
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Shape'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Shape Presets Sidebar */}
        <div className="w-80 bg-black/20 border-r border-purple-500/20 p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4 text-purple-200">Shape Presets</h3>
          
          <div className="space-y-2 mb-6">
            {SHAPE_PRESETS.map((preset) => (
              <div
                key={preset.id}
                onClick={() => selectPreset(preset)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedPreset.id === preset.id
                    ? 'bg-blue-600/30 border border-blue-500/50'
                    : 'bg-gray-800/30 hover:bg-gray-700/30 border border-gray-700/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-blue-400">{preset.icon}</div>
                  <div>
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs text-gray-400">{preset.description}</div>
                    <div className="text-xs text-purple-400 capitalize">{preset.category}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Shape Information */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2 text-purple-200">Shape Name</label>
              <input
                type="text"
                value={shapeName}
                onChange={(e) => setShapeName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                placeholder="Enter shape name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-purple-200">Description</label>
              <textarea
                value={shapeDescription}
                onChange={(e) => setShapeDescription(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none"
                rows={3}
                placeholder="Describe your custom shape"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Parameters Panel */}
          <div className="w-80 bg-black/10 border-r border-purple-500/20 p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-purple-200">Parameters</h3>
            
            <div className="space-y-4">
              {/* Basic dimensions */}
              <div>
                <label className="block text-sm font-medium mb-2">Width (meters)</label>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.1"
                  value={parameters.width}
                  onChange={(e) => updateParameter('width', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-right text-sm text-gray-400">{parameters.width.toFixed(1)}m</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Height (meters)</label>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.1"
                  value={parameters.height}
                  onChange={(e) => updateParameter('height', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-right text-sm text-gray-400">{parameters.height.toFixed(1)}m</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Depth (meters)</label>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.1"
                  value={parameters.depth}
                  onChange={(e) => updateParameter('depth', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-right text-sm text-gray-400">{parameters.depth.toFixed(1)}m</div>
              </div>

              {/* Material Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Material Type</label>
                <select
                  value={parameters.materialType || 'solid'}
                  onChange={(e) => updateParameter('materialType', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white"
                >
                  <option value="solid">Solid</option>
                  <option value="wireframe">Wireframe</option>
                  <option value="glass">Glass</option>
                  <option value="metal">Metal</option>
                </select>
              </div>

              {/* Transparency */}
              <div>
                <label className="block text-sm font-medium mb-2">Transparency</label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={parameters.transparency || 0.8}
                  onChange={(e) => updateParameter('transparency', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-right text-sm text-gray-400">{((parameters.transparency || 0.8) * 100).toFixed(0)}%</div>
              </div>

              {/* Wall Options */}
              <div className="border-t border-gray-600 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="hasWalls"
                    checked={parameters.hasWalls || false}
                    onChange={(e) => updateParameter('hasWalls', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="hasWalls" className="text-sm font-medium">Add Walls</label>
                </div>
                
                {parameters.hasWalls && (
                  <>
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-2">Wall Thickness (meters)</label>
                      <input
                        type="range"
                        min="0.05"
                        max="0.5"
                        step="0.05"
                        value={parameters.wallThickness || 0.2}
                        onChange={(e) => updateParameter('wallThickness', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-right text-sm text-gray-400">{(parameters.wallThickness || 0.2).toFixed(2)}m</div>
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-2">Wall Height (meters)</label>
                      <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.1"
                        value={parameters.wallHeight || parameters.height}
                        onChange={(e) => updateParameter('wallHeight', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-right text-sm text-gray-400">{(parameters.wallHeight || parameters.height).toFixed(1)}m</div>
                    </div>
                  </>
                )}
              </div>

              {/* Wireframe Options */}
              {(parameters.wireframe || selectedPreset.id.includes('frame')) && (
                <div className="border-t border-gray-600 pt-4">
                  <h4 className="text-sm font-medium mb-3 text-purple-200">Wireframe Settings</h4>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-2">Frame Width (meters)</label>
                    <input
                      type="range"
                      min="0.05"
                      max="0.3"
                      step="0.01"
                      value={parameters.frameWidth || 0.1}
                      onChange={(e) => updateParameter('frameWidth', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-right text-sm text-gray-400">{(parameters.frameWidth || 0.1).toFixed(2)}m</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Frame Spacing (meters)</label>
                    <input
                      type="range"
                      min="0.2"
                      max="2.0"
                      step="0.1"
                      value={parameters.frameSpacing || 0.5}
                      onChange={(e) => updateParameter('frameSpacing', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-right text-sm text-gray-400">{(parameters.frameSpacing || 0.5).toFixed(1)}m</div>
                  </div>
                </div>
              )}

              {/* Conditional parameters for specific shapes */}
              {(selectedPreset.id.includes('cylindrical') || selectedPreset.id.includes('dome') || selectedPreset.id.includes('ring')) && (
                <div className="border-t border-gray-600 pt-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Radius (meters)</label>
                    <input
                      type="range"
                      min="0.2"
                      max="5"
                      step="0.1"
                      value={parameters.radius || parameters.width / 2}
                      onChange={(e) => updateParameter('radius', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-right text-sm text-gray-400">{(parameters.radius || parameters.width / 2).toFixed(1)}m</div>
                  </div>
                </div>
              )}

              {(selectedPreset.id.includes('cylindrical') || selectedPreset.id.includes('dome') || selectedPreset.id.includes('cone')) && (
                <div>
                  <label className="block text-sm font-medium mb-2">Segments</label>
                  <input
                    type="range"
                    min="6"
                    max="32"
                    step="1"
                    value={parameters.segments || 16}
                    onChange={(e) => updateParameter('segments', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-right text-sm text-gray-400">{parameters.segments || 16}</div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSaveShape}
                disabled={!shapeName.trim() || isSaving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 
                         text-white font-medium rounded-lg hover:from-purple-600 hover:to-blue-600 
                         transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-lg hover:shadow-purple-500/25"
              >
                {isSaving ? 'Saving...' : 'Save Custom Shape'}
              </button>
              
              <button
                onClick={() => {
                  setSelectedPreset(SHAPE_PRESETS[0]);
                  setParameters(SHAPE_PRESETS[0].defaultParams);
                  setShapeName('');
                  setShapeDescription('');
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg
                         transition-colors duration-200"
              >
                Reset
              </button>
            </div>

            {saveStatus && (
              <div className={`mt-3 p-3 rounded-lg text-sm ${
                saveStatus.includes('Error') 
                  ? 'bg-red-900/30 border border-red-700/30 text-red-200'
                  : 'bg-green-900/30 border border-green-700/30 text-green-200'
              }`}>
                {saveStatus}
              </div>
            )}

            <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
              <h4 className="text-sm font-medium mb-2 text-purple-200">Shape Statistics</h4>
              <div className="space-y-1 text-xs text-gray-400">
                <div>Volume: ~{(parameters.width * parameters.height * parameters.depth).toFixed(1)} m³</div>
                <div>Type: {selectedPreset.type}</div>
                <div>Category: {selectedPreset.category}</div>
                <div>Material: {parameters.materialType || 'solid'}</div>
                {parameters.hasWalls && <div>Walls: {parameters.wallThickness?.toFixed(2)}m thick</div>}
                {parameters.wireframe && <div>Frame: {parameters.frameWidth?.toFixed(2)}m beams</div>}
              </div>
            </div>
          </div>

          {/* 3D Preview */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-purple-500/20">
              <h3 className="text-lg font-semibold text-purple-200">3D Preview</h3>
              <p className="text-sm text-gray-400">Interactive preview of your custom shape</p>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="bg-black/30 rounded-xl p-6 border border-purple-500/20">
                <div ref={mountRef} className="rounded-lg overflow-hidden border border-gray-600" />
                
                <div className="mt-4 flex justify-center gap-2">
                  <button onClick={() => updatePreview()} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center gap-2 text-sm transition-colors">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                  <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center gap-2 text-sm transition-colors">
                    <RotateCcw className="w-4 h-4" />
                    Reset View
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}