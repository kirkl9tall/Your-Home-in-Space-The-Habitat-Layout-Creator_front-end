import React, { useMemo } from 'react';
import * as THREE from 'three';
import { SceneObject } from '@/features/blender/types';

interface BlenderModuleRendererProps {
  blenderData: {
    objects: SceneObject[];
    name: string;
    description?: string;
  };
  moduleSize: { w_m: number; h_m: number; l_m: number };
}

/**
 * Renders a Blender Lab module as a group of Three.js objects
 * Converts Blender Lab objects to actual 3D geometry for the main habitat scene
 */
export const BlenderModuleRenderer: React.FC<BlenderModuleRendererProps> = ({ 
  blenderData, 
  moduleSize 
}) => {
  const moduleGroup = useMemo(() => {
    const group = new THREE.Group();
    
    if (!blenderData?.objects || blenderData.objects.length === 0) {
      // Fallback: create a basic box if no objects
      const geometry = new THREE.BoxGeometry(moduleSize.w_m, moduleSize.h_m, moduleSize.l_m);
      const material = new THREE.MeshLambertMaterial({ 
        color: 0x666666, 
        transparent: true, 
        opacity: 0.8 
      });
      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);
      return group;
    }
    
    // Convert each Blender Lab object to Three.js geometry
    blenderData.objects.forEach((obj) => {
      let geometry: THREE.BufferGeometry;
      
      // Create geometry based on object type
      switch (obj.type) {
        case 'cube':
          geometry = new THREE.BoxGeometry(
            obj.scale[0], 
            obj.scale[1], 
            obj.scale[2]
          );
          break;
          
        case 'sphere':
          geometry = new THREE.SphereGeometry(
            Math.max(...obj.scale) / 2, 
            16, 
            12
          );
          break;
          
        case 'cylinder':
          geometry = new THREE.CylinderGeometry(
            obj.scale[0] / 2, 
            obj.scale[0] / 2, 
            obj.scale[1], 
            16
          );
          break;
          
        case 'cone':
          geometry = new THREE.ConeGeometry(
            obj.scale[0] / 2, 
            obj.scale[1], 
            16
          );
          break;
          
        case 'torus':
          geometry = new THREE.TorusGeometry(
            obj.scale[0] / 3, 
            obj.scale[0] / 6, 
            8, 
            16
          );
          break;
          
        case 'plane':
          geometry = new THREE.PlaneGeometry(
            obj.scale[0], 
            obj.scale[2]
          );
          break;
          
        default:
          // Fallback to box
          geometry = new THREE.BoxGeometry(
            obj.scale[0], 
            obj.scale[1], 
            obj.scale[2]
          );
      }
      
      // Create material with object's color
      const material = new THREE.MeshLambertMaterial({ 
        color: new THREE.Color(obj.color),
        transparent: true,
        opacity: 0.8
      });
      
      // Create mesh
      const mesh = new THREE.Mesh(geometry, material);
      
      // Apply transformations from Blender Lab
      mesh.position.set(obj.position[0], obj.position[1], obj.position[2]);
      mesh.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
      mesh.scale.set(obj.scale[0], obj.scale[1], obj.scale[2]);
      
      // Enable shadows
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      // Add to group
      group.add(mesh);
    });
    
    return group;
  }, [blenderData, moduleSize]);
  
  return <primitive object={moduleGroup} />;
};

/**
 * Creates geometry for Blender Lab modules in the main habitat designer
 * This replaces the basic geometry creation for custom Blender modules
 */
export const createBlenderModuleGeometry = (
  blenderData: any, 
  size: { w_m: number; l_m: number; h_m: number }
): THREE.Group => {
  const group = new THREE.Group();
  
  if (!blenderData?.objects || blenderData.objects.length === 0) {
    // Fallback: create a basic box
    const geometry = new THREE.BoxGeometry(size.w_m, size.h_m, size.l_m);
    const material = new THREE.MeshLambertMaterial({ 
      color: 0x00bcd4, // Cyan color for Blender modules
      transparent: true, 
      opacity: 0.7 
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return group;
  }
  
  // Create actual Blender Lab objects
  blenderData.objects.forEach((obj: SceneObject) => {
    let geometry: THREE.BufferGeometry;
    
    switch (obj.type) {
      case 'cube':
        geometry = new THREE.BoxGeometry(
          obj.scale[0] * 0.5, 
          obj.scale[1] * 0.5, 
          obj.scale[2] * 0.5
        );
        break;
        
      case 'sphere':
        geometry = new THREE.SphereGeometry(
          Math.max(...obj.scale) * 0.25, 
          12, 
          8
        );
        break;
        
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(
          obj.scale[0] * 0.25, 
          obj.scale[0] * 0.25, 
          obj.scale[1] * 0.5, 
          12
        );
        break;
        
      case 'cone':
        geometry = new THREE.ConeGeometry(
          obj.scale[0] * 0.25, 
          obj.scale[1] * 0.5, 
          12
        );
        break;
        
      case 'torus':
        geometry = new THREE.TorusGeometry(
          obj.scale[0] * 0.2, 
          obj.scale[0] * 0.1, 
          6, 
          12
        );
        break;
        
      case 'plane':
        geometry = new THREE.PlaneGeometry(
          obj.scale[0] * 0.5, 
          obj.scale[2] * 0.5
        );
        break;
        
      default:
        geometry = new THREE.BoxGeometry(
          obj.scale[0] * 0.5, 
          obj.scale[1] * 0.5, 
          obj.scale[2] * 0.5
        );
    }
    
    const material = new THREE.MeshLambertMaterial({ 
      color: new THREE.Color(obj.color),
      transparent: true,
      opacity: 0.8
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Scale down positions to fit in habitat module bounds
    mesh.position.set(
      obj.position[0] * 0.3, 
      obj.position[1] * 0.3, 
      obj.position[2] * 0.3
    );
    mesh.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
    
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    group.add(mesh);
  });
  
  return group;
};