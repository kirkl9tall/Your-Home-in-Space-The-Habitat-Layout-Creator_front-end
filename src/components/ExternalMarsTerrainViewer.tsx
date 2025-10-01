import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TilesRenderer } from '3d-tiles-renderer';
import { GLTFExtensionsPlugin } from '3d-tiles-renderer/plugins';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

interface ExternalMarsTerrainViewerProps {
  onTerrainLoad?: (tilesRenderer: TilesRenderer) => void;
  onObjectDrop?: (position: THREE.Vector3, normal: THREE.Vector3) => void;
  className?: string;
}

// Available NASA Mars datasets
const MARS_DATASETS = {
  'msl-dingo-gap-ground': {
    name: 'MSL Dingo Gap - Ground',
    url: 'https://raw.githubusercontent.com/NASA-AMMOS/3DTilesSampleData/master/msl-dingo-gap/0528_0260184_to_s64o256_colorize/0528_0260184_to_s64o256_colorize/0528_0260184_to_s64o256_colorize_tileset.json',
    description: 'Mars Science Laboratory Dingo Gap terrain data'
  },
  'msl-dingo-gap-sky': {
    name: 'MSL Dingo Gap - Sky',
    url: 'https://raw.githubusercontent.com/NASA-AMMOS/3DTilesSampleData/master/msl-dingo-gap/0528_0260184_to_s64o256_colorize/0528_0260184_to_s64o256_sky/0528_0260184_to_s64o256_sky_tileset.json',
    description: 'Mars Science Laboratory Dingo Gap sky panorama'
  }
};

export const ExternalMarsTerrainViewer: React.FC<ExternalMarsTerrainViewerProps> = ({
  onTerrainLoad,
  onObjectDrop,
  className = ""
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<keyof typeof MARS_DATASETS>('msl-dingo-gap-ground');
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    groundTiles: TilesRenderer;
    skyTiles?: TilesRenderer;
    animationId?: number;
  }>();

  useEffect(() => {
    if (!mountRef.current) return;

    try {
      // Initialize Three.js scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xd8cec0); // Mars-like atmospheric color
      
      // Add fog for atmospheric effect
      scene.fog = new THREE.FogExp2(0xd8cec0, 0.0075);
      
      const camera = new THREE.PerspectiveCamera(
        60,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        1,
        4000
      );
      
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        logarithmicDepthBuffer: true
      });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setClearColor(0xd8cec0);
      
      mountRef.current.appendChild(renderer.domElement);

      // Mars lighting setup
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
      directionalLight.position.set(1, 2, 3);
      directionalLight.castShadow = true;
      scene.add(directionalLight);
      
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
      scene.add(ambientLight);

      // Setup controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 2;
      controls.maxDistance = 1000;

      // Parent group for tiles (rotated to match Mars coordinate system)
      const tilesParent = new THREE.Group();
      tilesParent.rotation.set(Math.PI / 2, 0, 0);
      scene.add(tilesParent);

      // Initialize DRACO loader for compressed geometries
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://unpkg.com/three@0.153.0/examples/jsm/libs/draco/gltf/');

      // Setup ground tiles renderer
      const groundTiles = new TilesRenderer(MARS_DATASETS[selectedDataset].url);
      
      // Register plugins (removed DebugTilesPlugin to avoid disposal errors)
      groundTiles.registerPlugin(new GLTFExtensionsPlugin({ dracoLoader }));
      
      // Configure for external data
      groundTiles.fetchOptions.mode = 'cors';
      groundTiles.lruCache.minSize = 900;
      groundTiles.lruCache.maxSize = 1300;
      groundTiles.errorTarget = 12;

      // Setup sky tiles (optional panoramic background)
      let skyTiles: TilesRenderer | undefined;
      if (selectedDataset === 'msl-dingo-gap-ground') {
        skyTiles = new TilesRenderer(MARS_DATASETS['msl-dingo-gap-sky'].url);
        skyTiles.fetchOptions.mode = 'cors';
        skyTiles.lruCache = groundTiles.lruCache; // Share cache
        tilesParent.add(skyTiles.group);
      }

      // Add tiles to parent group
      tilesParent.add(groundTiles.group);

      // Handle tile set loading
      let tilesLoaded = 0;
      const totalTileSets = skyTiles ? 2 : 1;

      const handleTileSetLoad = () => {
        tilesLoaded++;
        setLoadingProgress((tilesLoaded / totalTileSets) * 100);
        
        if (tilesLoaded === totalTileSets) {
          console.log('All Mars tile sets loaded successfully');
          
          // Center camera on the loaded terrain
          const sphere = new THREE.Sphere();
          groundTiles.getBoundingSphere(sphere);
          
          if (sphere.radius > 0) {
            // Position camera for good initial view
            const distance = sphere.radius * 0.8;
            camera.position.set(
              sphere.center.x + distance * 0.5,
              sphere.center.y + distance * 0.3,
              sphere.center.z + distance * 0.5
            );
            camera.lookAt(sphere.center);
            controls.target.copy(sphere.center);
            controls.update();
          }
          
          setIsLoading(false);
          onTerrainLoad?.(groundTiles);
        }
      };

      groundTiles.addEventListener('load-tile-set', handleTileSetLoad);
      if (skyTiles) {
        skyTiles.addEventListener('load-tile-set', handleTileSetLoad);
      }

      // Handle loading progress
      groundTiles.addEventListener('tiles-load-start', () => {
        console.log('Started loading Mars terrain tiles');
      });

      groundTiles.addEventListener('tiles-load-end', () => {
        console.log('Finished loading Mars terrain tiles');
      });

      // Handle errors
      const handleLoadError = (event: any) => {
        console.error('Mars terrain load error:', event);
        setError(`Failed to load Mars terrain: ${event.error?.message || 'Unknown error'}`);
        setIsLoading(false);
      };

      groundTiles.addEventListener('load-error', handleLoadError);
      if (skyTiles) {
        skyTiles.addEventListener('load-error', handleLoadError);
      }

      // Raycaster for object placement on terrain
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const handleMouseClick = (event: MouseEvent) => {
        if (!sceneRef.current || isLoading) return;
        
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        
        // Intersect with the terrain tiles
        const intersects = raycaster.intersectObject(groundTiles.group, true);

        if (intersects.length > 0) {
          const intersection = intersects[0];
          const point = intersection.point;
          const normal = intersection.face?.normal || new THREE.Vector3(0, 1, 0);
          
          // Transform normal to world space
          const worldNormal = normal.clone();
          if (intersection.object.matrixWorld) {
            worldNormal.transformDirection(intersection.object.matrixWorld);
          }
          
          console.log('Mars terrain clicked at:', point);
          onObjectDrop?.(point, worldNormal);
          
          // Visual feedback - add a temporary marker
          const markerGeometry = new THREE.SphereGeometry(0.2, 8, 6);
          const markerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8
          });
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          marker.position.copy(point);
          
          // Transform marker position to match tiles parent rotation
          tilesParent.add(marker);
          
          // Remove marker after 3 seconds
          setTimeout(() => {
            tilesParent.remove(marker);
            markerGeometry.dispose();
            markerMaterial.dispose();
          }, 3000);
        }
      };

      renderer.domElement.addEventListener('click', handleMouseClick);

      // Handle adding/removing objects from external events
      const handleAddObjectToScene = (event: any) => {
        const { object3D, id } = event.detail;
        tilesParent.add(object3D);
        console.log('Added object to Mars scene:', id);
      };

      const handleRemoveObjectFromScene = (event: any) => {
        const { object3D, objectId } = event.detail;
        tilesParent.remove(object3D);
        // Dispose of resources
        if (object3D.geometry) object3D.geometry.dispose();
        if (object3D.material) {
          if (Array.isArray(object3D.material)) {
            object3D.material.forEach((mat: THREE.Material) => mat.dispose());
          } else {
            object3D.material.dispose();
          }
        }
        console.log('Removed object from Mars scene:', objectId);
      };

      window.addEventListener('addObjectToScene', handleAddObjectToScene);
      window.addEventListener('removeObjectFromScene', handleRemoveObjectFromScene);

      // Animation loop
      let animationId: number;
      const animate = () => {
        animationId = requestAnimationFrame(animate);
        
        controls.update();
        camera.updateMatrixWorld();
        
        // Update tiles renderers
        groundTiles.setCamera(camera);
        groundTiles.setResolutionFromRenderer(camera, renderer);
        groundTiles.update();
        
        if (skyTiles) {
          skyTiles.setCamera(camera);
          skyTiles.setResolutionFromRenderer(camera, renderer);
          skyTiles.update();
        }
        
        renderer.render(scene, camera);
      };

      animate();

      // Store references
      sceneRef.current = { 
        scene, 
        camera, 
        renderer, 
        controls, 
        groundTiles,
        skyTiles,
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
        try {
          window.removeEventListener('resize', handleResize);
          window.removeEventListener('addObjectToScene', handleAddObjectToScene);
          window.removeEventListener('removeObjectFromScene', handleRemoveObjectFromScene);
          renderer.domElement.removeEventListener('click', handleMouseClick);
          
          if (animationId) {
            cancelAnimationFrame(animationId);
          }
          
          if (mountRef.current && renderer.domElement.parentNode) {
            mountRef.current.removeChild(renderer.domElement);
          }
          
          // Safely dispose of tiles renderers
          try {
            groundTiles.dispose();
          } catch (e) {
            console.warn('Error disposing ground tiles:', e);
          }
          
          try {
            skyTiles?.dispose();
          } catch (e) {
            console.warn('Error disposing sky tiles:', e);
          }
          
          try {
            dracoLoader.dispose();
          } catch (e) {
            console.warn('Error disposing DRACO loader:', e);
          }
          
          // Dispose of scene resources
          scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              try {
                object.geometry?.dispose();
                if (Array.isArray(object.material)) {
                  object.material.forEach(material => material.dispose());
                } else {
                  object.material?.dispose();
                }
              } catch (e) {
                console.warn('Error disposing mesh resources:', e);
              }
            }
          });
          
          renderer.dispose();
        } catch (error) {
          console.error('Error during Mars terrain cleanup:', error);
        }
      };

    } catch (err) {
      console.error('Error initializing external Mars terrain viewer:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsLoading(false);
    }
  }, [onTerrainLoad, onObjectDrop, selectedDataset]);

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full bg-red-900 text-red-100 ${className}`}>
        <div className="text-center max-w-md p-6">
          <h3 className="text-lg font-semibold mb-2">🚨 Mars Data Loading Error</h3>
          <p className="text-sm mb-4">{error}</p>
          <div className="text-xs text-red-200 mb-4">
            <p>This might be due to:</p>
            <ul className="text-left mt-2 space-y-1">
              <li>• Network connectivity issues</li>
              <li>• NASA servers temporarily unavailable</li>
              <li>• CORS restrictions</li>
              <li>• Browser security settings</li>
            </ul>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-900 via-orange-900 to-amber-900 z-10">
          <div className="text-center text-white max-w-md p-6">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-300 mx-auto mb-4"></div>
              <div className="w-full bg-black bg-opacity-30 rounded-full h-2 mb-4">
                <div 
                  className="bg-orange-400 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">🔴 Loading Real Mars Terrain</h3>
            <p className="text-sm text-orange-200 mb-2">
              Downloading NASA {MARS_DATASETS[selectedDataset].name}
            </p>
            <p className="text-xs text-orange-300">
              {MARS_DATASETS[selectedDataset].description}
            </p>
            <div className="mt-4 text-xs text-orange-200">
              Progress: {Math.round(loadingProgress)}%
            </div>
          </div>
        </div>
      )}
      
      <div 
        ref={mountRef} 
        className="w-full h-full"
        style={{ cursor: isLoading ? 'wait' : 'crosshair' }}
      />
      
      {!isLoading && (
        <>
          <div className="absolute top-4 left-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-sm max-w-xs">
            <h4 className="font-semibold mb-1 text-orange-300">🚀 NASA Mars Terrain</h4>
            <p className="text-xs text-gray-300 mb-2">{MARS_DATASETS[selectedDataset].name}</p>
            <ul className="space-y-1 text-xs">
              <li>• Left click + drag: Rotate view</li>
              <li>• Right click + drag: Pan</li>
              <li>• Scroll: Zoom in/out</li>
              <li>• Click terrain: Place object</li>
            </ul>
          </div>
          
          <div className="absolute bottom-4 left-4 bg-red-900 bg-opacity-80 text-white p-2 rounded text-xs">
            <span className="text-red-200">🛰️ NASA MSL Data • 3D Tiles Format</span>
          </div>
          
          <div className="absolute top-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-sm">
            <h4 className="font-semibold mb-2 text-orange-300">Data Source</h4>
            <select 
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value as keyof typeof MARS_DATASETS)}
              className="bg-gray-700 text-white text-xs px-2 py-1 rounded w-full"
              disabled={isLoading}
            >
              {Object.entries(MARS_DATASETS).map(([key, dataset]) => (
                <option key={key} value={key}>
                  {dataset.name}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
};