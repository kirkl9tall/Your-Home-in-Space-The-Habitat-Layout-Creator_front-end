import React, { useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { OrbitControls, Grid, Html, Box, Plane } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MousePointer, RotateCw, Check, X, Move } from 'lucide-react';

// Enhanced module visual properties for interactive placement
const MODULE_VISUALS = {
  CREW_SLEEP: { color: '#3b82f6', name: 'Sleep', icon: '🛏️' },
  HYGIENE: { color: '#10b981', name: 'Hygiene', icon: '🚿' },
  WASTE: { color: '#8b5cf6', name: 'Waste', icon: '🚽' },
  EXERCISE: { color: '#f59e0b', name: 'Exercise', icon: '💪' },
  FOOD_PREP: { color: '#ef4444', name: 'Kitchen', icon: '🍳' },
  ECLSS: { color: '#6b7280', name: 'Life Support', icon: '🔧' },
  MEDICAL: { color: '#ec4899', name: 'Medical', icon: '⚕️' },
  MAINTENANCE: { color: '#f97316', name: 'Maintenance', icon: '🔨' },
  STOWAGE: { color: '#84cc16', name: 'Storage', icon: '📦' },
  RECREATION: { color: '#06b6d4', name: 'Recreation', icon: '🎮' },
  WORKSTATION: { color: '#8b5cf6', name: 'Workstation', icon: '💻' },
  AIRLOCK: { color: '#64748b', name: 'Airlock', icon: '🚪' },
  GLOVEBOX: { color: '#d97706', name: 'Glovebox', icon: '🧤' },
  TRASH_MGMT: { color: '#65a30d', name: 'Trash', icon: '🗑️' },
  COMMON_AREA: { color: '#0ea5e9', name: 'Common', icon: '👥' },
  CUSTOM_CAD: { color: '#6366f1', name: 'Custom', icon: '🎨' }
} as const;

interface InteractiveModule {
  id: string;
  type: keyof typeof MODULE_VISUALS;
  position: [number, number, number];
  size: { w_m: number; l_m: number; h_m: number };
  rotation: number;
  level: number;
}

interface DraggableModuleProps {
  module: InteractiveModule;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: (id: string) => void;
  onDragStart: (id: string, position: [number, number, number]) => void;
  onDragEnd: (id: string, position: [number, number, number]) => void;
  onPositionUpdate: (id: string, position: [number, number, number]) => void;
}

function DraggableModule({ 
  module, 
  isSelected, 
  isDragging,
  onSelect, 
  onDragStart, 
  onDragEnd, 
  onPositionUpdate 
}: DraggableModuleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { camera, raycaster, mouse, scene } = useThree();
  const [dragOffset, setDragOffset] = useState<THREE.Vector3>(new THREE.Vector3());
  
  const visual = MODULE_VISUALS[module.type];
  const color = isSelected ? '#fbbf24' : hovered ? '#fcd34d' : visual.color;
  
  // Handle drag logic
  const handlePointerDown = useCallback((event: THREE.Event) => {
    event.stopPropagation();
    onSelect(module.id);
    
    if (meshRef.current) {
      const worldPosition = new THREE.Vector3();
      meshRef.current.getWorldPosition(worldPosition);
      
      // Calculate offset between mouse and object center
      raycaster.setFromCamera(mouse, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersectPoint);
      
      if (intersectPoint) {
        setDragOffset(worldPosition.clone().sub(intersectPoint));
        onDragStart(module.id, [worldPosition.x, worldPosition.y, worldPosition.z]);
      }
    }
  }, [module.id, onSelect, onDragStart, camera, raycaster, mouse]);
  
  useFrame(() => {
    if (isDragging && meshRef.current) {
      raycaster.setFromCamera(mouse, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), module.level * 2.4);
      const intersectPoint = new THREE.Vector3();
      
      if (raycaster.ray.intersectPlane(plane, intersectPoint)) {
        const newPosition = intersectPoint.add(dragOffset);
        
        // Snap to grid (0.5m spacing)
        newPosition.x = Math.round(newPosition.x / 0.5) * 0.5;
        newPosition.z = Math.round(newPosition.z / 0.5) * 0.5;
        
        meshRef.current.position.copy(newPosition);
        onPositionUpdate(module.id, [newPosition.x, newPosition.y, newPosition.z]);
      }
    }
  });
  
  return (
    <group>
      {/* Main module body */}
      <Box
        ref={meshRef}
        position={module.position}
        args={[module.size.w_m, module.size.h_m, module.size.l_m]}
        onPointerDown={handlePointerDown}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={color}
          opacity={isDragging ? 0.7 : 1}
          transparent
          roughness={0.3}
          metalness={0.1}
        />
      </Box>
      
      {/* Selection indicator */}
      {isSelected && (
        <Box
          position={module.position}
          args={[module.size.w_m + 0.1, module.size.h_m + 0.1, module.size.l_m + 0.1]}
        >
          <meshBasicMaterial 
            color="#fbbf24" 
            wireframe 
            transparent 
            opacity={0.8}
          />
        </Box>
      )}
      
      {/* Module label */}
      <Html position={[module.position[0], module.position[1] + module.size.h_m/2 + 0.3, module.position[2]]}>
        <div className="bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-medium shadow-lg">
          <span className="mr-1">{visual.icon}</span>
          {visual.name}
        </div>
      </Html>
    </group>
  );
}

interface PlacementZoneProps {
  bounds: { width: number; depth: number; height: number };
  level: number;
}

function PlacementZone({ bounds, level }: PlacementZoneProps) {
  const yPosition = level * 2.4;
  
  return (
    <group>
      {/* Level platform */}
      <Plane 
        position={[0, yPosition, 0]} 
        args={[bounds.width, bounds.depth]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial 
          color="#f3f4f6" 
          opacity={0.3} 
          transparent
          side={THREE.DoubleSide}
        />
      </Plane>
      
      {/* Grid overlay */}
      <Grid 
        position={[0, yPosition + 0.01, 0]}
        args={[bounds.width, bounds.depth]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#9ca3af"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#6b7280"
        fadeDistance={30}
        fadeStrength={1}
        infiniteGrid={false}
      />
      
      {/* Level label */}
      <Html position={[-bounds.width/2 + 1, yPosition + 0.5, -bounds.depth/2 + 1]}>
        <Badge variant="secondary" className="text-xs">
          Level {level} ({yPosition.toFixed(1)}m)
        </Badge>
      </Html>
    </group>
  );
}

// Module interface for the placement system
interface Module {
  id: string;
  type: string;
  position: [number, number, number];
  size: { w_m: number; l_m: number; h_m: number };
  rotation: number;
  level: number;
  crew_capacity?: number;
}

interface Interactive3DPlacementProps {
  modules: Module[];
  bounds: { width: number; depth: number; height: number };
  onModuleUpdate: (moduleId: string, updates: Partial<Module>) => void;
  onModuleAdd: (moduleType: string, level: number) => void;
  onModuleDelete: (moduleId: string) => void;
  showGrid?: boolean;
  measureMode?: boolean;
}

export function Interactive3DPlacement({
  modules,
  bounds,
  onModuleUpdate,
  onModuleAdd,
  onModuleDelete
}: Interactive3DPlacementProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [draggingModuleId, setDraggingModuleId] = useState<string | null>(null);
  const [placementMode, setPlacementMode] = useState<keyof typeof MODULE_VISUALS | null>(null);
  
  const levels = Math.max(1, Math.floor(bounds.height / 2.4));
  
  const handleModuleSelect = useCallback((moduleId: string) => {
    setSelectedModuleId(moduleId);
  }, []);
  
  const handleDragStart = useCallback((moduleId: string, position: [number, number, number]) => {
    setDraggingModuleId(moduleId);
  }, []);
  
  const handleDragEnd = useCallback((moduleId: string, position: [number, number, number]) => {
    setDraggingModuleId(null);
    onModuleUpdate(moduleId, { position });
  }, [onModuleUpdate]);
  
  const handlePositionUpdate = useCallback((moduleId: string, position: [number, number, number]) => {
    // Real-time position updates during drag
  }, []);
  
  const handleRotateModule = useCallback(() => {
    if (selectedModuleId) {
      const module = modules.find(m => m.id === selectedModuleId);
      if (module) {
        onModuleUpdate(selectedModuleId, { 
          rotation: (module.rotation + 90) % 360 
        });
      }
    }
  }, [selectedModuleId, modules, onModuleUpdate]);
  
  const selectedModule = modules.find(m => m.id === selectedModuleId);
  
  return (
    <div className="h-full flex flex-col">
      {/* Controls Header */}
      <div className="p-4 bg-muted/50 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center gap-2">
            <Move className="w-4 h-4" />
            Interactive 3D Placement
          </h3>
          
          <div className="flex items-center gap-2">
            {selectedModule && (
              <>
                <Badge variant="secondary">
                  {MODULE_VISUALS[selectedModule.type].icon} {MODULE_VISUALS[selectedModule.type].name}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRotateModule}
                  className="flex items-center gap-1"
                >
                  <RotateCw className="w-3 h-3" />
                  Rotate
                </Button>
              </>
            )}
            
            <Button
              size="sm"
              variant={placementMode ? "secondary" : "outline"}
              onClick={() => setPlacementMode(placementMode ? null : 'CREW_SLEEP')}
              className="flex items-center gap-1"
            >
              <MousePointer className="w-3 h-3" />
              {placementMode ? 'Exit' : 'Place'}
            </Button>
          </div>
        </div>
        
        {selectedModule && (
          <div className="mt-2 text-sm text-muted-foreground">
            Position: ({selectedModule.position[0].toFixed(1)}, {selectedModule.position[1].toFixed(1)}, {selectedModule.position[2].toFixed(1)})m
            • Size: {selectedModule.size.w_m}×{selectedModule.size.l_m}×{selectedModule.size.h_m}m
            • Level: {selectedModule.level}
          </div>
        )}
      </div>
      
      {/* 3D Canvas */}
      <div className="flex-1">
        <Canvas
          camera={{ position: [10, 8, 10], fov: 60 }}
          onCreated={({ gl }) => {
            gl.setClearColor('#f8fafc');
          }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />
          <directionalLight position={[-5, 5, -5]} intensity={0.4} />
          
          {/* Placement zones for each level */}
          {Array.from({ length: levels }, (_, i) => (
            <PlacementZone
              key={i}
              level={i}
              bounds={bounds}
            />
          ))}
          
          {/* Interactive modules */}
          {modules.map((module) => (
            <DraggableModule
              key={module.id}
              module={module}
              isSelected={selectedModuleId === module.id}
              isDragging={draggingModuleId === module.id}
              onSelect={handleModuleSelect}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onPositionUpdate={handlePositionUpdate}
            />
          ))}
          
          <OrbitControls 
            enablePan={true} 
            enableZoom={true} 
            enableRotate={true}
            minDistance={5}
            maxDistance={50}
          />
        </Canvas>
      </div>
      
      {/* Status bar */}
      <div className="p-2 bg-muted/30 border-t text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>
            {modules.length} modules • {levels} levels • Drag modules to reposition
          </span>
          <span>
            Grid: 0.5m spacing • Shift+Click: Multi-select
          </span>
        </div>
      </div>
    </div>
  );
}