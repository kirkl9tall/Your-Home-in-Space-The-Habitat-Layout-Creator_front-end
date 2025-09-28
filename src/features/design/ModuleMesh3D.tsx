import React, { useRef, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { getVisualForModule, zoneFill } from '@/lib/visuals';

interface ModuleMesh3DProps {
  module: any;
  onClick?: () => void;
  selected?: boolean;
}

export function ModuleMesh3D({ module, onClick, selected = false }: ModuleMesh3DProps) {
  const meshRef = useRef<THREE.Group>(null);
  const visual = getVisualForModule(module);
  const { w_m, l_m, h_m } = module.size;
  const height = visual.extrude_h_m || h_m;

  // Load GLTF if specified
  const gltf = visual.gltfUrl ? useLoader(GLTFLoader, visual.gltfUrl) : null;

  const geometry = useMemo(() => {
    if (visual.polygon) {
      // Create extruded polygon
      const shape = new THREE.Shape();
      const points = visual.polygon;
      if (points && points.length > 0) {
        shape.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
          shape.lineTo(points[i][0], points[i][1]);
        }
        shape.closePath();

        // Add holes if present
        if (visual.holes) {
          visual.holes.forEach(hole => {
            const holePath = new THREE.Path();
            if (hole.length > 0) {
              holePath.moveTo(hole[0][0], hole[0][1]);
              for (let i = 1; i < hole.length; i++) {
                holePath.lineTo(hole[i][0], hole[i][1]);
              }
              holePath.closePath();
              shape.holes.push(holePath);
            }
          });
        }

        const extrudeSettings = {
          depth: height,
          bevelEnabled: visual.fillet_r_m ? true : false,
          bevelThickness: visual.fillet_r_m || 0,
          bevelSize: visual.fillet_r_m || 0,
          bevelSegments: 8
        };

        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
      }
    }

    // Parametric fallback shapes
    switch (visual.shape2D) {
      case "CAPSULE": {
        // Create capsule geometry
        const radius = Math.min(w_m, l_m) / 2;
        const cylinderHeight = Math.max(0, Math.max(w_m, l_m) - 2 * radius);
        
        const geometry = new THREE.CapsuleGeometry(radius, cylinderHeight, 4, 8);
        if (w_m > l_m) {
          geometry.rotateZ(Math.PI / 2);
        }
        return geometry;
      }
      case "CIRCLE":
      case "CYLINDER": {
        const radius = Math.min(w_m, l_m) / 2;
        return new THREE.CylinderGeometry(radius, radius, height, 16);
      }
      case "RING_SLICE": {
        const outerRadius = Math.min(w_m, l_m) / 2;
        const innerRadius = outerRadius * 0.6;
        return new THREE.RingGeometry(innerRadius, outerRadius, 16);
      }
      default: {
        // Rounded box
        const radius = visual.fillet_r_m || 0;
        if (radius > 0) {
          // Create rounded box geometry (simplified as regular box for now)
          return new THREE.BoxGeometry(w_m, height, l_m);
        }
        return new THREE.BoxGeometry(w_m, height, l_m);
      }
    }
  }, [visual, w_m, l_m, height]);

  const material = useMemo(() => {
    const hue = visual.hue || 0;
    const color = new THREE.Color().setHSL(hue / 360, 0.6, 0.7);
    return new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      roughness: 0.4,
      metalness: 0.1
    });
  }, [visual.hue]);

  if (gltf && visual.gltfUrl) {
    // Use GLTF model
    const model = gltf.scene.clone();
    
    // Fit to bounding box
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    let scaleX = 1, scaleY = 1, scaleZ = 1;
    
    if (visual.fit === "fit-xyz") {
      scaleX = w_m / size.x;
      scaleY = height / size.y;
      scaleZ = l_m / size.z;
    } else if (visual.fit === "fit-xz") {
      const scale = Math.min(w_m / size.x, l_m / size.z);
      scaleX = scaleZ = scale;
      scaleY = height / size.y;
    }
    
    model.scale.set(scaleX, scaleY, scaleZ);
    
    // Adjust pivot
    if (visual.pivot === "bottom") {
      model.position.y = -center.y * scaleY + (box.min.y * scaleY);
    } else {
      model.position.copy(center.clone().multiply(new THREE.Vector3(-scaleX, -scaleY, -scaleZ)));
    }

    return (
      <group
        ref={meshRef}
        position={[module.position[0], height / 2, module.position[1]]}
        rotation={[0, THREE.MathUtils.degToRad(module.rotation_deg || 0), 0]}
        onClick={onClick}
      >
        <primitive object={model} />
        {selected && (
          <mesh>
            <boxGeometry args={[w_m + 0.1, height + 0.1, l_m + 0.1]} />
            <meshBasicMaterial color="#3b82f6" wireframe />
          </mesh>
        )}
      </group>
    );
  }

  return (
    <group
      ref={meshRef}
      position={[module.position[0], height / 2, module.position[1]]}
      rotation={[0, THREE.MathUtils.degToRad(module.rotation_deg || 0), 0]}
      onClick={onClick}
    >
      <mesh geometry={geometry} material={material} />
      
      {/* Selection indicator */}
      {selected && (
        <mesh>
          <boxGeometry args={[w_m + 0.1, height + 0.1, l_m + 0.1]} />
          <meshBasicMaterial color="#3b82f6" wireframe />
        </mesh>
      )}
      
      {/* Label */}
      {visual.label && (
        <group position={[0, height / 2 + 0.5, 0]}>
          <mesh>
            <planeGeometry args={[2, 0.5]} />
            <meshBasicMaterial color="white" transparent opacity={0.8} />
          </mesh>
          {/* Note: Text rendering would require additional setup */}
        </group>
      )}
    </group>
  );
}