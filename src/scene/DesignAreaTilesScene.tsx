"use client";
import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import SceneFrame from "./SceneFrame";
import { setTerrainSampler } from "../terrain/heightSampler";
import { useTilesDnD } from "./useTilesDnD";
import { provider, tilesetURL, googleKey, cesiumToken } from "@/tiles/tilesConfig";

// Import NASA-AMMOS 3DTilesRendererJS core library
import { TilesRenderer } from "3d-tiles-renderer";
import { acceleratedRaycast } from "three-mesh-bvh";

// Enable BVH raycasting for performance
THREE.Mesh.prototype.raycast = acceleratedRaycast;

// NASA 3D Tiles Renderer Integration Component
function TilesRendererComponent({ 
  tilesRenderer, 
  onTilesLoad 
}: { 
  tilesRenderer: TilesRenderer | null;
  onTilesLoad: (tiles: TilesRenderer) => void;
}) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!tilesRenderer || !groupRef.current) return;

    // Add tiles to scene
    groupRef.current.add(tilesRenderer.group);
    
    // Setup tiles event handlers
    tilesRenderer.addEventListener('load-model', (e: any) => {
      const { scene: modelScene } = e;
      
      // Setup BVH acceleration for loaded models
      modelScene.traverse((node: THREE.Object3D) => {
        if ((node as THREE.Mesh).isMesh) {
          const mesh = node as THREE.Mesh;
          if (mesh.geometry && !(mesh.geometry as any).boundsTree) {
            (mesh.geometry as any).computeBoundsTree?.();
          }
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
    });

    tilesRenderer.addEventListener('tile-load-end', () => {
      onTilesLoad(tilesRenderer);
    });

    return () => {
      if (groupRef.current) {
        groupRef.current.remove(tilesRenderer.group);
      }
    };
  }, [tilesRenderer, onTilesLoad]);

  // Update tiles renderer every frame
  useFrame(({ gl }) => {
    if (tilesRenderer && camera) {
      // Update tiles based on camera position
      tilesRenderer.setCamera(camera);
      tilesRenderer.setResolutionFromRenderer(camera, gl);
      tilesRenderer.update();
    }
  });

  return <group ref={groupRef} name="tiles-group" />;
}

// Inner component that uses R3F hooks - must be inside Canvas
function TilesSceneContent({ onPlace }: { onPlace?: (m: any) => void }) {
  const tilesRendererRef = useRef<TilesRenderer | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const groupName = "tiles-root";
  
  // Initialize drag and drop (now inside Canvas context)
  useTilesDnD(groupName, {
    onPlace,
  });

  // NASA 3D Tiles setup
  const setupTilesRenderer = useCallback(async () => {
    const p = provider();
    const url = tilesetURL();
    
    if (!url || p === "demo") {
      console.log("Running in demo mode - using fallback terrain");
      return null;
    }

    console.log(`Initializing NASA 3D Tiles Renderer with provider: ${p}, URL: ${url}`);
    
    // Create tiles renderer with NASA configuration
    const tilesRenderer = new TilesRenderer(url);
    
    // Configure performance settings
    tilesRenderer.errorTarget = 6;        // Lower for better quality
    tilesRenderer.errorThreshold = 40;    // Adjust based on performance needs
    tilesRenderer.maxDepth = 15;          // Maximum tile subdivision depth
    tilesRenderer.displayActiveTiles = false; // Set to true for debugging
    
    // Configure LRU cache
    tilesRenderer.lruCache.maxSize = 800;
    tilesRenderer.lruCache.minSize = 600;
    tilesRenderer.lruCache.unloadPercent = 0.05;

    // Setup authentication headers for tile requests
    if (p === "google") {
      const gKey = googleKey();
      if (gKey) {
        tilesRenderer.fetchOptions = {
          ...tilesRenderer.fetchOptions,
          headers: {
            'Authorization': `Bearer ${gKey}`,
          },
        };
        console.log("Google Cloud authentication headers configured");
      } else {
        console.warn("Google API key not configured");
      }
    } else if (p === "cesium") {
      const cToken = cesiumToken();
      if (cToken) {
        tilesRenderer.fetchOptions = {
          ...tilesRenderer.fetchOptions,
          headers: {
            'Authorization': `Bearer ${cToken}`,
          },
        };
        console.log("Cesium Ion authentication headers configured");
      } else {
        console.warn("Cesium Ion token not configured");
      }
    }

    return tilesRenderer;
  }, []);

  // Initialize tiles renderer
  useEffect(() => {
    setupTilesRenderer().then(renderer => {
      tilesRendererRef.current = renderer;
    }).catch(error => {
      console.error("Failed to setup tiles renderer:", error);
    });

    return () => {
      if (tilesRendererRef.current) {
        tilesRendererRef.current.dispose();
        tilesRendererRef.current = null;
      }
    };
  }, [setupTilesRenderer]);

  // Setup terrain height sampler for module placement
  const handleTilesLoad = useCallback((tilesRenderer: TilesRenderer) => {
    console.log("3D Tiles loaded successfully");
    
    const sampler = (x: number, z: number): number => {
      if (!tilesRenderer.group) return 0;
      
      // Cast ray downward to find terrain height
      const origin = new THREE.Vector3(x, 1000, z);
      const direction = new THREE.Vector3(0, -1, 0);
      
      raycasterRef.current.set(origin, direction);
      raycasterRef.current.firstHitOnly = true;
      
      const intersections = raycasterRef.current.intersectObject(tilesRenderer.group, true);
      
      return intersections.length > 0 ? intersections[0].point.y : 0;
    };
    
    setTerrainSampler(sampler, 10000, 1000); // 10km x 10km area, 1km height range
    console.log("Terrain height sampler configured");
  }, []);

  // Fallback terrain sampler when no tiles are loaded
  useEffect(() => {
    const fallbackSampler = (_x: number, _z: number) => 0; // Ground level
    setTerrainSampler(fallbackSampler, 1000, 100);
  }, []);

  return (
    <SceneFrame>
      <group name={groupName}>
        {/* NASA 3D Tiles Renderer Integration */}
        <TilesRendererComponent 
          tilesRenderer={tilesRendererRef.current}
          onTilesLoad={handleTilesLoad}
        />
        
        {/* Fallback ground plane when tiles are loading/unavailable */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          receiveShadow
          position={[0, -0.1, 0]} // Slightly below to avoid z-fighting
          visible={!tilesRendererRef.current || provider() === "demo"}
        >
          <planeGeometry args={[10000, 10000]} />
          <meshLambertMaterial 
            color={0x8B4513} 
            transparent 
            opacity={0.8}
          />
        </mesh>
        
        {/* Grid helper for spatial reference */}
        <gridHelper 
          args={[1000, 50, 0x8B4513, 0x654321]} 
          position={[0, 0.1, 0]}
        />
        
        {/* Status indicator */}
        {provider() === "demo" && (
          <group position={[0, 10, 0]}>
            {/* Demo mode indicator - could add text mesh here */}
          </group>
        )}
      </group>
    </SceneFrame>
  );
}

// Main exported component that can be used outside Canvas
export default function DesignAreaTilesScene({ onPlace }: { onPlace?: (m: any) => void }) {
  return <TilesSceneContent onPlace={onPlace} />;
}