import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface DebugMarsViewerProps {
  onTerrainLoad?: () => void;
  onObjectDrop?: (position: THREE.Vector3, normal: THREE.Vector3) => void;
  className?: string;
}

export const DebugMarsViewer: React.FC<DebugMarsViewerProps> = ({
  onTerrainLoad,
  onObjectDrop,
  className = ""
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('Initializing...');
  const sceneRef = useRef<any>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    let isDestroyed = false;

    const init = async () => {
      try {
        setStatus('Creating scene...');
        
        // Basic Three.js setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xd8cec0);
        
        const camera = new THREE.PerspectiveCamera(
          75,
          mountRef.current!.clientWidth / mountRef.current!.clientHeight,
          0.1,
          1000
        );
        
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mountRef.current!.clientWidth, mountRef.current!.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0xd8cec0);
        
        // Ensure canvas fills container properly
        renderer.domElement.style.display = 'block';
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        
        mountRef.current!.appendChild(renderer.domElement);
        
        setStatus('Setting up lights...');
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        scene.add(directionalLight);
        
        setStatus('Creating test terrain...');
        
        // Create a simple test terrain first
        const geometry = new THREE.PlaneGeometry(50, 50, 32, 32);
        const vertices = geometry.attributes.position;
        
        // Add some height variation
        for (let i = 0; i < vertices.count; i++) {
          const x = vertices.getX(i);
          const z = vertices.getZ(i);
          const y = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2 + Math.random() * 0.5;
          vertices.setY(i, y);
        }
        
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshLambertMaterial({ 
          color: 0xcd853f,
          side: THREE.DoubleSide
        });
        
        const testTerrain = new THREE.Mesh(geometry, material);
        // Don't rotate the terrain - keep it in XY plane
        // testTerrain.rotation.x = -Math.PI / 2;
        scene.add(testTerrain);
        
        setStatus('Setting up camera...');
        
        // Position camera above the terrain looking down
        camera.position.set(0, 20, 30);
        camera.lookAt(0, 0, 0);
        
        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 1;
        controls.maxDistance = 200;
        
        // Handle window resize
        const handleResize = () => {
          if (!mountRef.current) return;
          
          const width = mountRef.current.clientWidth;
          const height = mountRef.current.clientHeight;
          
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        };
        
        window.addEventListener('resize', handleResize);
        
        // Store initial scene setup
        sceneRef.current = { scene, camera, renderer, controls, testTerrain };
        
        setStatus('Testing network connection...');
        
        // Test network connectivity to NASA data
        try {
          const testUrl = 'https://raw.githubusercontent.com/NASA-AMMOS/3DTilesSampleData/master/msl-dingo-gap/0528_0260184_to_s64o256_colorize/0528_0260184_to_s64o256_colorize/0528_0260184_to_s64o256_colorize_tileset.json';
          
          const response = await fetch(testUrl, { mode: 'cors' });
          if (response.ok) {
            const data = await response.json();
            setStatus(`NASA data accessible! Root: ${data.root?.boundingVolume ? 'OK' : 'NO BOUNDS'}`);
            
            // Try to load 3D tiles
            const { TilesRenderer } = await import('3d-tiles-renderer');
            
            setStatus('Loading NASA 3D tiles...');
            
            const tiles = new TilesRenderer(testUrl);
            tiles.fetchOptions.mode = 'cors';
            tiles.errorTarget = 12;
            
            tiles.addEventListener('load-tile-set', () => {
              if (isDestroyed) return;
              
              setStatus('NASA tiles loaded! Positioning camera...');
              
              const sphere = new THREE.Sphere();
              tiles.getBoundingSphere(sphere);
              
              if (sphere.radius > 0) {
                // Position camera at a good viewing angle
                const distance = sphere.radius * 1.5;
                camera.position.set(
                  sphere.center.x + distance * 0.3,
                  sphere.center.y + distance * 0.5,
                  sphere.center.z + distance * 0.8
                );
                camera.lookAt(sphere.center);
                controls.target.copy(sphere.center);
                controls.update();
                
                // Hide test terrain
                testTerrain.visible = false;
                
                setStatus('Ready! Real NASA Mars terrain loaded.');
                setIsLoading(false);
                onTerrainLoad?.();
              }
            });
            
            tiles.addEventListener('load-error', (event: any) => {
              setStatus(`Tile load error: ${event.error?.message || 'Unknown'}`);
            });
            
            scene.add(tiles.group);
            
            // Store tiles for update loop
            sceneRef.current = { scene, camera, renderer, controls, tiles, testTerrain };
            
          } else {
            setStatus(`Network error: ${response.status} ${response.statusText}`);
            // Continue with test terrain
            setIsLoading(false);
            sceneRef.current = { scene, camera, renderer, controls, testTerrain };
          }
        } catch (netError) {
          setStatus(`Network failed: ${netError instanceof Error ? netError.message : 'Unknown error'}`);
          // Continue with test terrain  
          setIsLoading(false);
          sceneRef.current = { scene, camera, renderer, controls, testTerrain };
        }
        
        // Animation loop
        const animate = () => {
          if (isDestroyed) return;
          
          requestAnimationFrame(animate);
          
          controls.update();
          camera.updateMatrixWorld();
          
          // Update tiles if available
          if (sceneRef.current?.tiles) {
            sceneRef.current.tiles.setCamera(camera);
            sceneRef.current.tiles.setResolutionFromRenderer(camera, renderer);
            sceneRef.current.tiles.update();
          }
          
          renderer.render(scene, camera);
        };
        
        animate();
        
        // If no tiles loaded within 10 seconds, show test terrain
        setTimeout(() => {
          if (isLoading && !isDestroyed) {
            setStatus('Timeout - showing test terrain');
            setIsLoading(false);
          }
        }, 10000);
        
        // Return cleanup function for this init scope
        return { handleResize };
        
      } catch (error) {
        if (!isDestroyed) {
          setStatus(`Initialization error: ${error instanceof Error ? error.message : 'Unknown'}`);
          setIsLoading(false);
        }
        return { handleResize: () => {} };
      }
    };
    
    let initPromise = init();
    
    return () => {
      isDestroyed = true;
      
      initPromise.then(({ handleResize }) => {
        window.removeEventListener('resize', handleResize);
      }).catch(console.error);
      
      if (sceneRef.current) {
        try {
          sceneRef.current.tiles?.dispose?.();
          sceneRef.current.renderer?.dispose?.();
          if (mountRef.current && sceneRef.current.renderer?.domElement) {
            mountRef.current.removeChild(sceneRef.current.renderer.domElement);
          }
        } catch (e) {
          console.warn('Cleanup error:', e);
        }
      }
    };
  }, [onTerrainLoad, isLoading]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <div 
        ref={mountRef} 
        className="w-full h-full"
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }} 
      />
      
      <div className="absolute top-4 left-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-sm max-w-sm">
        <h4 className="font-semibold mb-2 text-orange-300">🔍 Mars Terrain Debug</h4>
        <p className="text-xs text-gray-300 mb-2">Status: {status}</p>
        
        {isLoading && (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-300 mr-2"></div>
            <span className="text-xs">Loading...</span>
          </div>
        )}
        
        {!isLoading && (
          <div className="text-xs space-y-1">
            <div className="text-green-300">✓ Basic 3D scene working</div>
            <div className="text-blue-300">• Mouse controls active</div>
            <div className="text-yellow-300">• {sceneRef.current?.tiles ? 'NASA tiles loaded' : 'Test terrain shown'}</div>
          </div>
        )}
      </div>
    </div>
  );
};