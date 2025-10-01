import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TilesRenderer } from '3d-tiles-renderer';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface BasicMarsTerrainViewerProps {
  onTerrainLoad?: (tilesRenderer: TilesRenderer) => void;
  onObjectDrop?: (position: THREE.Vector3, normal: THREE.Vector3) => void;
  className?: string;
}

export const BasicMarsTerrainViewer: React.FC<BasicMarsTerrainViewerProps> = ({
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

    let cleanup = false;

    const initializeTerrain = async () => {
      try {
        // Initialize Three.js scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xd8cec0); // Mars-like sky color
        
        const camera = new THREE.PerspectiveCamera(
          60,
          mountRef.current!.clientWidth / mountRef.current!.clientHeight,
          1,
          4000
        );
        
        const renderer = new THREE.WebGLRenderer({ 
          antialias: true,
          alpha: false
        });
        renderer.setSize(mountRef.current!.clientWidth, mountRef.current!.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0xd8cec0);
        
        if (mountRef.current) {
          mountRef.current.appendChild(renderer.domElement);
        }

        // Simple Mars lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 2, 3);
        scene.add(directionalLight);

        // Setup controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 2;
        controls.maxDistance = 1000;

        // Initialize tiles renderer with basic configuration
        const marsUrl = 'https://raw.githubusercontent.com/NASA-AMMOS/3DTilesSampleData/master/msl-dingo-gap/0528_0260184_to_s64o256_colorize/0528_0260184_to_s64o256_colorize/0528_0260184_to_s64o256_colorize_tileset.json';
        const tiles = new TilesRenderer(marsUrl);
        
        // Basic configuration
        tiles.fetchOptions.mode = 'cors';
        tiles.errorTarget = 6;
        tiles.lruCache.minSize = 600;
        tiles.lruCache.maxSize = 1000;

        // Handle successful loading
        tiles.addEventListener('load-tile-set', () => {
          if (cleanup) return;
          
          console.log('Basic Mars tileset loaded');
          
          try {
            const sphere = new THREE.Sphere();
            tiles.getBoundingSphere(sphere);
            
            if (sphere.radius > 0) {
              // Position camera for good view
              const distance = sphere.radius * 0.5;
              camera.position.set(
                sphere.center.x + distance,
                sphere.center.y + distance * 0.5,
                sphere.center.z + distance
              );
              camera.lookAt(sphere.center);
              controls.target.copy(sphere.center);
              controls.update();
            }
            
            setIsLoading(false);
            setError(null);
            onTerrainLoad?.(tiles);
          } catch (e) {
            console.error('Error setting up camera:', e);
            setError('Error positioning camera');
          }
        });

        // Handle errors
        tiles.addEventListener('load-error', (event: any) => {
          if (cleanup) return;
          console.error('Mars tile load error:', event);
          setError(`Network error: ${event.error?.message || 'Failed to load Mars data'}`);
          setIsLoading(false);
        });

        scene.add(tiles.group);

        // Simple raycasting for object placement
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const handleClick = (event: MouseEvent) => {
          if (cleanup || isLoading) return;
          
          const rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObject(tiles.group, true);

          if (intersects.length > 0) {
            const point = intersects[0].point;
            const normal = intersects[0].face?.normal || new THREE.Vector3(0, 1, 0);
            
            onObjectDrop?.(point, normal);
            
            // Simple visual feedback
            const marker = new THREE.Mesh(
              new THREE.SphereGeometry(0.3),
              new THREE.MeshBasicMaterial({ color: 0x00ff00 })
            );
            marker.position.copy(point);
            scene.add(marker);
            
            setTimeout(() => {
              if (!cleanup) {
                scene.remove(marker);
                marker.geometry.dispose();
                (marker.material as THREE.Material).dispose();
              }
            }, 2000);
          }
        };

        renderer.domElement.addEventListener('click', handleClick);

        // Handle external object events
        const handleAddObject = (event: any) => {
          if (cleanup) return;
          scene.add(event.detail.object3D);
        };

        const handleRemoveObject = (event: any) => {
          if (cleanup) return;
          scene.remove(event.detail.object3D);
        };

        window.addEventListener('addObjectToScene', handleAddObject);
        window.addEventListener('removeObjectFromScene', handleRemoveObject);

        // Animation loop
        let animationId: number;
        const animate = () => {
          if (cleanup) return;
          
          animationId = requestAnimationFrame(animate);
          
          controls.update();
          camera.updateMatrixWorld();
          
          tiles.setCamera(camera);
          tiles.setResolutionFromRenderer(camera, renderer);
          tiles.update();
          
          renderer.render(scene, camera);
        };

        animate();

        // Store references
        sceneRef.current = { scene, camera, renderer, controls, tiles, animationId };

        // Handle resize
        const handleResize = () => {
          if (cleanup || !mountRef.current || !sceneRef.current) return;
          
          const { camera, renderer } = sceneRef.current;
          camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        };

        window.addEventListener('resize', handleResize);

        // Return cleanup function
        return () => {
          cleanup = true;
          
          window.removeEventListener('resize', handleResize);
          window.removeEventListener('addObjectToScene', handleAddObject);
          window.removeEventListener('removeObjectFromScene', handleRemoveObject);
          renderer.domElement.removeEventListener('click', handleClick);
          
          if (animationId) {
            cancelAnimationFrame(animationId);
          }
          
          if (mountRef.current && renderer.domElement.parentNode) {
            mountRef.current.removeChild(renderer.domElement);
          }
          
          // Simple cleanup
          try {
            tiles.dispose();
            renderer.dispose();
          } catch (e) {
            console.warn('Cleanup error:', e);
          }
        };

      } catch (error) {
        if (!cleanup) {
          console.error('Mars terrain initialization error:', error);
          setError(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setIsLoading(false);
        }
      }
    };

    const cleanupFn = initializeTerrain();

    return () => {
      cleanupFn.then(fn => fn?.()).catch(console.error);
    };
  }, [onTerrainLoad, onObjectDrop, isLoading]);

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full bg-red-900 text-red-100 ${className}`}>
        <div className="text-center max-w-md p-6">
          <h3 className="text-lg font-semibold mb-2">🚨 Mars Terrain Error</h3>
          <p className="text-sm mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setIsLoading(true);
            }}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded transition-colors"
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
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-900 to-orange-900 z-10">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-300 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">🔴 Loading NASA Mars Data</h3>
            <p className="text-sm text-orange-200">Connecting to Mars Science Laboratory dataset...</p>
          </div>
        </div>
      )}
      
      <div ref={mountRef} className="w-full h-full" />
      
      {!isLoading && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg text-sm">
          <h4 className="font-semibold mb-1 text-orange-300">🚀 NASA Mars Terrain</h4>
          <ul className="space-y-1 text-xs">
            <li>• Left click + drag: Rotate</li>
            <li>• Right click + drag: Pan</li>
            <li>• Scroll: Zoom</li>
            <li>• Click terrain: Place object</li>
          </ul>
        </div>
      )}
    </div>
  );
};