import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface SimpleMarsTerrainViewerProps {
  onTerrainLoad?: () => void;
  onObjectDrop?: (position: THREE.Vector3, normal: THREE.Vector3) => void;
  className?: string;
}

export const SimpleMarsTerrainViewer: React.FC<SimpleMarsTerrainViewerProps> = ({
  onTerrainLoad,
  onObjectDrop,
  className = ""
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    terrain?: THREE.Mesh;
    animationId?: number;
  }>();

  useEffect(() => {
    if (!mountRef.current) return;

    try {
      // Initialize Three.js scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x2d1810); // Mars-like sky color
      scene.fog = new THREE.Fog(0x2d1810, 100, 1000);
      
      const camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        2000
      );
      
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
      });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.8;
      
      mountRef.current.appendChild(renderer.domElement);

      // Create procedural Mars terrain
      const createMarsianTerrain = () => {
        // Create heightmap-based terrain
        const width = 200;
        const height = 200;
        const widthSegments = 100;
        const heightSegments = 100;
        
        const geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
        
        // Generate Mars-like heightmap
        const vertices = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        
        for (let i = 0; i < vertices.count; i++) {
          vertex.fromBufferAttribute(vertices, i);
          
          // Create multiple layers of noise for realistic terrain
          let elevation = 0;
          const x = vertex.x * 0.05;
          const y = vertex.y * 0.05;
          
          // Base terrain
          elevation += Math.sin(x * 0.3) * Math.cos(y * 0.3) * 3;
          
          // Add some random noise for detail
          elevation += (Math.random() - 0.5) * 2;
          
          // Add larger features
          elevation += Math.sin(x * 0.1) * Math.cos(y * 0.1) * 8;
          
          // Craters (circular depressions)
          const craterX1 = x - 2;
          const craterY1 = y - 1;
          const craterDist1 = Math.sqrt(craterX1 * craterX1 + craterY1 * craterY1);
          if (craterDist1 < 3) {
            elevation -= (3 - craterDist1) * 2;
          }
          
          const craterX2 = x + 3;
          const craterY2 = y + 2;
          const craterDist2 = Math.sqrt(craterX2 * craterX2 + craterY2 * craterY2);
          if (craterDist2 < 2) {
            elevation -= (2 - craterDist2) * 1.5;
          }
          
          vertex.z = elevation;
          vertices.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        
        // Create Mars-like material with texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d')!;
        
        // Create Mars surface texture
        const gradient = context.createRadialGradient(256, 256, 0, 256, 256, 256);
        gradient.addColorStop(0, '#CD853F'); // Sandy brown
        gradient.addColorStop(0.5, '#A0522D'); // Sienna
        gradient.addColorStop(1, '#8B4513'); // Saddle brown
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 512, 512);
        
        // Add some noise for texture detail
        const imageData = context.getImageData(0, 0, 512, 512);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * 30;
          data[i] = Math.max(0, Math.min(255, data[i] + noise));     // Red
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // Green  
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // Blue
        }
        
        context.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        
        const material = new THREE.MeshLambertMaterial({ 
          map: texture,
          side: THREE.DoubleSide
        });
        
        const terrain = new THREE.Mesh(geometry, material);
        terrain.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        terrain.receiveShadow = true;
        terrain.castShadow = false;
        
        return terrain;
      };

      const terrain = createMarsianTerrain();
      scene.add(terrain);

      // Add Mars-appropriate lighting
      const ambientLight = new THREE.AmbientLight(0x4a3728, 0.6); // Warm ambient
      scene.add(ambientLight);
      
      const sunLight = new THREE.DirectionalLight(0xffa366, 1.2); // Mars sunlight
      sunLight.position.set(50, 100, 30);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 200;
      sunLight.shadow.camera.left = -100;
      sunLight.shadow.camera.right = 100;
      sunLight.shadow.camera.top = 100;
      sunLight.shadow.camera.bottom = -100;
      scene.add(sunLight);

      // Add some atmospheric particles
      const particlesGeometry = new THREE.BufferGeometry();
      const particlesCount = 1000;
      const positions = new Float32Array(particlesCount * 3);
      
      for (let i = 0; i < particlesCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 400;
      }
      
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const particlesMaterial = new THREE.PointsMaterial({
        color: 0xCD853F,
        size: 0.3,
        transparent: true,
        opacity: 0.3
      });
      
      const particles = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particles);

      // Position camera
      camera.position.set(30, 40, 30);
      camera.lookAt(0, 0, 0);

      // Setup controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 5;
      controls.maxDistance = 200;
      controls.maxPolarAngle = Math.PI / 2.1; // Prevent camera from going below ground

      // Raycaster for object placement on terrain
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const handleMouseClick = (event: MouseEvent) => {
        if (!sceneRef.current) return;
        
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        
        // Intersect with the terrain
        const intersects = raycaster.intersectObject(terrain, true);

        if (intersects.length > 0) {
          const intersection = intersects[0];
          const point = intersection.point;
          const normal = intersection.face?.normal || new THREE.Vector3(0, 1, 0);
          
          console.log('Mars terrain clicked at:', point);
          onObjectDrop?.(point, normal);
          
          // Visual feedback - add a temporary marker
          const markerGeometry = new THREE.SphereGeometry(0.5, 8, 6);
          const markerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8
          });
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          marker.position.copy(point);
          marker.position.y += 0.5; // Lift slightly above surface
          scene.add(marker);
          
          // Remove marker after 2 seconds
          setTimeout(() => {
            scene.remove(marker);
            markerGeometry.dispose();
            markerMaterial.dispose();
          }, 2000);
        }
      };

      renderer.domElement.addEventListener('click', handleMouseClick);

      // Animation loop
      let animationId: number;
      const animate = () => {
        animationId = requestAnimationFrame(animate);
        
        // Animate particles
        if (particles) {
          particles.rotation.y += 0.0005;
        }
        
        controls.update();
        renderer.render(scene, camera);
      };

      animate();

      // Handle adding objects to scene
      const handleAddObjectToScene = (event: any) => {
        const { object3D, id } = event.detail;
        scene.add(object3D);
        console.log('Added object to Mars scene:', id);
      };

      const handleRemoveObjectFromScene = (event: any) => {
        const { object3D, objectId } = event.detail;
        scene.remove(object3D);
        // Dispose of resources
        if (object3D.geometry) object3D.geometry.dispose();
        if (object3D.material) {
          if (Array.isArray(object3D.material)) {
            object3D.material.forEach(mat => mat.dispose());
          } else {
            object3D.material.dispose();
          }
        }
        console.log('Removed object from Mars scene:', objectId);
      };

      window.addEventListener('addObjectToScene', handleAddObjectToScene);
      window.addEventListener('removeObjectFromScene', handleRemoveObjectFromScene);

      // Store references
      sceneRef.current = { 
        scene, 
        camera, 
        renderer, 
        controls, 
        terrain,
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

      // Simulate loading complete
      setTimeout(() => {
        setIsLoading(false);
        onTerrainLoad?.();
        console.log('Mars terrain loaded successfully!');
      }, 1000);

      // Cleanup function
      return () => {
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
        
        // Dispose of resources
        terrain.geometry.dispose();
        if (terrain.material instanceof THREE.Material) {
          terrain.material.dispose();
        }
        renderer.dispose();
        
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
      setIsLoading(false);
    }
  }, [onTerrainLoad, onObjectDrop]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-900 to-red-900 z-10">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-300 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Generating Mars Terrain</h3>
            <p className="text-sm text-orange-200">Creating realistic Martian landscape...</p>
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
          <h4 className="font-semibold mb-1 text-orange-300">Mars Terrain Controls</h4>
          <ul className="space-y-1 text-xs">
            <li>• Left click + drag: Rotate view</li>
            <li>• Right click + drag: Pan</li>
            <li>• Scroll: Zoom in/out</li>
            <li>• Click terrain: Place object</li>
          </ul>
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 bg-red-900 bg-opacity-70 text-white p-2 rounded text-xs">
        <span className="text-red-200">🔴 Procedural Mars Surface</span>
      </div>
    </div>
  );
};