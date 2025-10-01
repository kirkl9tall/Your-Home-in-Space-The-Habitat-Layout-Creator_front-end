"use client";
import React from "react";
import SceneFrame from "./SceneFrame";
import RealMarsTerrain from "../terrain/RealMarsTerrain";
import GhostModule from "./GhostModule";
import { useDragDropRaycast } from "./useDragDropRaycast";
import { createModuleMesh } from "./ModuleFactory";
import * as THREE from "three";

// Placed module component that can be selected and moved
function PlacedModule({ 
  module, 
  isSelected, 
  onSelect 
}: { 
  module: any; 
  isSelected: boolean; 
  onSelect: () => void;
}) {
  const meshRef = React.useRef<THREE.Group>(null);

  const moduleMesh = React.useMemo(() => {
    return createModuleMesh(module.type);
  }, [module.type]);

  React.useEffect(() => {
    if (moduleMesh) {
      // Update position
      moduleMesh.position.set(module.position[0], module.position[1], module.position[2]);
      
      // Highlight if selected
      if (isSelected) {
        moduleMesh.material = (moduleMesh.material as any).clone();
        (moduleMesh.material as any).emissive = new THREE.Color(0x333333);
        (moduleMesh.material as any).emissiveIntensity = 0.2;
      } else {
        // Reset material for unselected
        moduleMesh.material = createModuleMesh(module.type).material;
      }
    }
  }, [module, isSelected, moduleMesh]);

  return (
    <primitive
      ref={meshRef}
      object={moduleMesh}
      onClick={(e: any) => {
        e.stopPropagation();
        onSelect();
      }}
    />
  );
}

// Component that uses R3F hooks - must be inside Canvas
function MarsScene({ 
  onPlace, 
  modules = [], 
  onModuleSelect, 
  selectedModuleId
}: { 
  onPlace?: (m: any) => void;
  modules?: any[];
  onModuleSelect?: (id: string | null) => void;
  selectedModuleId?: string | null;
}) {
  const [ghost, setGhost] = React.useState<{ type: string | null; pos: [number, number, number] | null; }>({ type: null, pos: null });

  useDragDropRaycast({
    onGhost: (type, pos) => setGhost({ type, pos: pos ? [pos.x, pos.y, pos.z] : null }),
    onPlace,
  });

  return (
    <group name="mars-root">
      <group name="terrain-root">
        <RealMarsTerrain
          sizeM={2000}
          segments={512}
          heightScale={120}
          showGrid={true}
        />
      </group>
      
      {/* Invisible plane for deselecting modules */}
      <mesh
        position={[0, -1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={() => onModuleSelect?.(null)}
      >
        <planeGeometry args={[4000, 4000]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      
      {/* Render placed modules */}
      {modules.map((module) => (
        <PlacedModule
          key={module.id}
          module={module}
          isSelected={selectedModuleId === module.id}
          onSelect={() => onModuleSelect?.(module.id)}
        />
      ))}
      
      {/* Ghost preview during drag */}
      {ghost.type && ghost.pos && (
        <GhostModule type={ghost.type} position={{ x: ghost.pos[0], y: ghost.pos[1], z: ghost.pos[2] } as any} />
      )}
    </group>
  );
}

export default function DesignAreaScene({ 
  onPlace, 
  modules = [], 
  onModuleSelect, 
  selectedModuleId
}: { 
  onPlace?: (m: any) => void;
  modules?: any[];
  onModuleSelect?: (id: string | null) => void;
  selectedModuleId?: string | null;
}) {
  return (
    <SceneFrame>
      <MarsScene 
        onPlace={onPlace}
        modules={modules}
        onModuleSelect={onModuleSelect}
        selectedModuleId={selectedModuleId}
      />
    </SceneFrame>
  );
}