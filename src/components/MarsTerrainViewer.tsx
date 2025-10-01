import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TilesRenderer } from '3d-tiles-renderer';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface MarsTerrainViewerProps {
  onTerrainLoad?: (tilesRenderer: TilesRenderer) => void;
  onObjectDrop?: (position: THREE.Vector3, normal: THREE.Vector3) => void;
  className?: string;
}

export const MarsTerrainViewer: React.FC<MarsTerrainViewerProps> = ({
  onTerrainLoad,
  onObjectDrop,
  className = ""
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    tiles: TilesRenderer;
    animationId?: number;
  }>();

  useEffect(() => {
    if (!mountRef.current) return;

    try {
      // Initialize Three.js scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a0f0b); // Mars-like sky color
      
      const camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        50000
      );
      
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        logarithmicDepthBuffer: true
      });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      
      mountRef.current.appendChild(renderer.domElement);

      // Add Mars-appropriate lighting
      const ambientLight = new THREE.AmbientLight(0x4a3728, 0.4); // Warm ambient
      scene.add(ambientLight);
      
      const sunLight = new THREE.DirectionalLight(0xffa366, 0.8); // Mars sunlight
      sunLight.position.set(100, 100, 50);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 500;
      scene.add(sunLight);

      // Setup controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 1;
      controls.maxDistance = 1000;

      // Mars terrain tileset URL - using NASA Mars sample data
      const tilesetUrl = 'https://raw.githubusercontent.com/NASA-AMMOS/3DTilesSampleData/master/msl-dingo-gap/0528_0260184_to_s64o256_colorize/0528_0260184_to_s64o256_colorize/0528_0260184_to_s64o256_colorize_tileset.json';

      // Initialize 3D Tiles renderer
      const tiles = new TilesRenderer(tilesetUrl);
      
      tiles.setCamera(camera);
      tiles.setResolutionFromRenderer(camera, renderer);
      
      // Configure for better performance
      tiles.lruCache.minSize = 900;
      tiles.lruCache.maxSize = 1300;
      tiles.errorTarget = 6;

      // Handle tileset loading
      tiles.addEventListener('load-tile-set', () => {
        console.log('Mars tileset loaded successfully');
        
        const box = new THREE.Box3();
        const sphere = new THREE.Sphere();
        tiles.getBoundingSphere(sphere);
        tiles.getBoundingBox(box);
        
        // Center the tileset
        const center = sphere.center;
        tiles.group.position.copy(center).multiplyScalar(-1);
        
        // Position camera for a good initial view of Mars terrain
        const distance = sphere.radius * 0.8;
        camera.position.set(
          center.x + distance * 0.5,
          center.y + distance * 0.3,
          center.z + distance * 0.5
        );
        camera.lookAt(center.x, center.y, center.z);
        
        // Update controls target
        controls.target.copy(center);
        controls.update();
        
        setIsLoading(false);
        onTerrainLoad?.(tiles);
      });

      tiles.addEventListener('load-model', () => {
        console.log('Mars terrain model loaded');
      });

      tiles.addEventListener('tile-load-error', (e) => {
        console.error('Tile load error:', e);
      });

      scene.add(tiles.group);

      // Raycaster for object placement on terrain
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const handleMouseClick = (event: MouseEvent) => {
        if (!sceneRef.current) return;
        
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        
        // Intersect with the terrain tiles
        const intersects = raycaster.intersectObject(tiles.group, true);

        if (intersects.length > 0) {
          const intersection = intersects[0];
          const point = intersection.point;
          const normal = intersection.face?.normal || new THREE.Vector3(0, 1, 0);
          
          // Transform normal to world space
          const worldNormal = normal.clone();
          if (intersection.object.matrixWorld) {
            worldNormal.transformDirection(intersection.object.matrixWorld);
          }
          
          console.log('Terrain clicked at:', point);
          onObjectDrop?.(point, worldNormal);
          
          // Visual feedback - add a temporary marker
          const markerGeometry = new THREE.SphereGeometry(0.5, 8, 6);
          const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          marker.position.copy(point);
          scene.add(marker);
          
          // Remove marker after 2 seconds
          setTimeout(() => {
            scene.remove(marker);
          }, 2000);
        }
      };

      renderer.domElement.addEventListener('click', handleMouseClick);

      // Animation loop
      let animationId: number;
      const animate = () => {
        animationId = requestAnimationFrame(animate);
        
        if (camera && tiles) {
          camera.updateMatrixWorld();
          tiles.update();
        }
        
        controls.update();
        renderer.render(scene, camera);
      };

      animate();

      // Store references
      sceneRef.current = { 
        scene, 
        camera, 
        renderer, 
        controls, 
        tiles,
        animationId
      };

      // Handle resize
      const handleResize = () => {
        if (!mountRef.current || !sceneRef.current) return;
        
        const { camera, renderer } = sceneRef.current;
        camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      };

      window.addEventListener('resize', handleResize);

      // Cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        renderer.domElement.removeEventListener('click', handleMouseClick);
        
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        
        if (mountRef.current && renderer.domElement.parentNode) {
          mountRef.current.removeChild(renderer.domElement);
        }
        
        tiles.dispose();
        renderer.dispose();
        
        // Dispose of geometries and materials
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry?.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material?.dispose();
            }
          }
        });
      };

    } catch (err) {
      console.error('Error initializing Mars terrain viewer:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsLoading(false);
    }
  }, [onTerrainLoad, onObjectDrop]);

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full bg-red-100 text-red-800 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Mars Terrain Loading Error</h3>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Loading Mars Terrain</h3>
            <p className="text-sm">Downloading NASA Mars surface data...</p>
          </div>
        </div>
      )}
      
      <div 
        ref={mountRef} 
        className="w-full h-full"
        style={{ cursor: isLoading ? 'wait' : 'crosshair' }}
      />
      
      {!isLoading && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg text-sm">
          <h4 className="font-semibold mb-1">Mars Terrain Controls</h4>
          <ul className="space-y-1 text-xs">
            <li>• Left click + drag: Rotate view</li>
            <li>• Right click + drag: Pan</li>
            <li>• Scroll: Zoom in/out</li>
            <li>• Click terrain: Place object</li>
          </ul>
        </div>
      )}
    </div>
  );
};