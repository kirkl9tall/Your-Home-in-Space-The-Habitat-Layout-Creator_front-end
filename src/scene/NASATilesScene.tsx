"use client";
import React, { useRef, useCallback, useEffect, useState } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { acceleratedRaycast } from "three-mesh-bvh";

// Import TilesRenderer from the published package
import { TilesRenderer } from "3d-tiles-renderer";

// Import configuration
import { provider, tilesetURL, googleKey, cesiumToken } from "@/tiles/tilesConfig";
import { setTerrainSampler } from "../terrain/heightSampler";
import SceneFrame from "./SceneFrame";

// Enable BVH raycasting for performance
THREE.Mesh.prototype.raycast = acceleratedRaycast;

interface NASATilesSceneProps {
  onPlace?: (module: {
    id: string;
    type: string;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
  }) => void;
}

export default function NASATilesScene({ onPlace }: NASATilesSceneProps) {
  const { camera, gl, scene } = useThree();
  const [tilesRenderer, setTilesRenderer] = useState<any>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Get current provider configuration
  const currentProvider = provider();
  const tilesetUrl = tilesetURL();
  const gKey = googleKey();
  const cToken = cesiumToken();

  // Initialize tiles renderer
  useEffect(() => {
    if (!tilesetUrl) return;

    console.log("Initializing NASA TilesRenderer with URL:", tilesetUrl);

    const tiles = new TilesRenderer(tilesetUrl);
    
    // Performance configuration
    tiles.errorTarget = 6;
    tiles.errorThreshold = 40;
    tiles.maxDepth = 15;
    tiles.displayActiveTiles = false;
    
    // LRU Cache configuration
    tiles.lruCache.maxSize = 800;
    tiles.lruCache.minSize = 600;
    tiles.lruCache.unloadPercent = 0.05;

    // Setup authentication headers if needed
    if (currentProvider === "google" && gKey) {
      tiles.fetchOptions = {
        ...tiles.fetchOptions,
        headers: {
          'Authorization': `Bearer ${gKey}`,
        },
      };
    } else if (currentProvider === "cesium" && cToken) {
      tiles.fetchOptions = {
        ...tiles.fetchOptions,
        headers: {
          'Authorization': `Bearer ${cToken}`,
        },
      };
    }

    // Add tiles to scene
    scene.add(tiles.group);
    setTilesRenderer(tiles);

    // Setup terrain sampler on load
    const handleLoad = () => {
      console.log("NASA 3D Tiles loaded successfully");
      setTerrainSampler(
        (x: number, z: number): number => {
          if (!tiles) return 0;
          
          const raycaster = raycasterRef.current;
          const origin = new THREE.Vector3(x, 1000, z);
          const direction = new THREE.Vector3(0, -1, 0);
          
          raycaster.set(origin, direction);
          const intersects = raycaster.intersectObject(tiles.group, true);
          
          return intersects.length > 0 ? intersects[0].point.y : 0;
        },
        10000, // Terrain size in meters (10km)
        1000   // Height scale in meters (1km max height)
      );
    };

    tiles.addEventListener('load-tile-set', handleLoad);

    return () => {
      tiles.removeEventListener('load-tile-set', handleLoad);
      scene.remove(tiles.group);
      tiles.dispose();
      setTilesRenderer(null);
    };
  }, [tilesetUrl, currentProvider, gKey, cToken, scene]);

  // Update tiles every frame
  useFrame(() => {
    if (tilesRenderer && camera) {
      tilesRenderer.setCamera(camera);
      tilesRenderer.setResolutionFromRenderer(camera, gl);
      tilesRenderer.update();
    }
  });

  // Handle drag and drop module placement
  const setupDragAndDrop = useCallback(() => {
    const canvas = gl.domElement;
    
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      canvas.style.cursor = "copy";
    };

    const handleDragLeave = () => {
      canvas.style.cursor = "default";
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      canvas.style.cursor = "default";

      const moduleType = e.dataTransfer?.getData("moduleType") || e.dataTransfer?.getData("text/plain");
      if (!moduleType || !tilesRenderer) return;

      // Calculate mouse position in normalized device coordinates
      const rect = canvas.getBoundingClientRect();
      const mouse = mouseRef.current;
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Raycast for terrain intersection
      const raycaster = raycasterRef.current;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(tilesRenderer.group, true);

      if (intersects.length > 0) {
        const intersection = intersects[0];
        const position = intersection.point.clone();
        
        // Slightly elevate above terrain
        position.y += 1.05; // 1 meter above surface + small offset

        // Call placement callback
        onPlace?.({
          id: Math.random().toString(36).slice(2, 10),
          type: moduleType,
          position,
          rotation: new THREE.Euler(0, 0, 0),
          scale: new THREE.Vector3(1, 1, 1),
        });

        console.log(`Placed ${moduleType} module at:`, position);
      }
    };

    canvas.addEventListener("dragover", handleDragOver);
    canvas.addEventListener("dragleave", handleDragLeave);
    canvas.addEventListener("drop", handleDrop);

    return () => {
      canvas.removeEventListener("dragover", handleDragOver);
      canvas.removeEventListener("dragleave", handleDragLeave);
      canvas.removeEventListener("drop", handleDrop);
    };
  }, [camera, gl, onPlace, tilesRenderer]);

  // Setup drag and drop when component mounts
  React.useEffect(() => {
    return setupDragAndDrop();
  }, [setupDragAndDrop]);

  return (
    <SceneFrame>
      <group name="nasa-tiles-root">
        {/* Fallback ground plane when no tiles are loaded */}
        {!tilesRenderer && (
          <group name="fallback-terrain">
            <mesh 
              rotation={[-Math.PI / 2, 0, 0]} 
              receiveShadow
              position={[0, -0.1, 0]}
            >
              <planeGeometry args={[10000, 10000]} />
              <meshLambertMaterial 
                color={0x8B4513} // Mars brown
                transparent 
                opacity={0.8}
              />
            </mesh>
            
            <gridHelper 
              args={[1000, 50, 0x8B4513, 0x654321]} 
              position={[0, 0.1, 0]}
            />
          </group>
        )}
        
        {/* Mars atmosphere and lighting */}
        <ambientLight intensity={0.4} color={0xffffff} />
        <directionalLight
          position={[100, 100, 50]}
          intensity={1.0}
          color={0xffeaa7}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={1000}
          shadow-camera-left={-500}
          shadow-camera-right={500}
          shadow-camera-top={500}
          shadow-camera-bottom={-500}
        />
        
        {/* Mars atmospheric fog */}
        <fog attach="fog" color={0xD2691E} near={100} far={2000} />
        
        {/* Loading indicator when tiles are loading */}
        {tilesetUrl && !tilesRenderer && (
          <group name="loading-indicator">
            <mesh position={[0, 5, 0]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color={0xff6b6b} />
            </mesh>
          </group>
        )}
      </group>
    </SceneFrame>
  );
}