// Fix: Use named imports for types from @react-three/fiber to correctly augment JSX.IntrinsicElements.
import { useLoader, useThree, ThreeElements, ThreeEvent } from '@react-three/fiber';
import React, { useMemo, useRef, forwardRef, useEffect } from 'react';
import * as THREE from 'three';
import { CameraControls, Grid } from '@react-three/drei';
import { GLTFLoader } from 'three-stdlib';
import useStore from '../store/useStore';
import { SceneObject } from '../types';
import InteractionGizmo from './InteractionGizmo';
import { CameraControls as CameraControlsImpl } from 'three-stdlib';


/**
 * A component to load and display a GLTF model, with support for textures from zip files.
 */
const ModelRenderer: React.FC<{ url: string; color: string; fileMap?: Record<string, string> }> = ({ url, color, fileMap }) => {
    const gltf = useLoader(GLTFLoader, url, (loader) => {
      if (fileMap) {
        const manager = new THREE.LoadingManager();
        manager.setURLModifier((path) => {
          return fileMap[path] || path;
        });
        loader.manager = manager;
      }
    });

    const clonedScene = useMemo(() => gltf.scene.clone(), [gltf.scene]);

    useEffect(() => {
        clonedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if ((child as THREE.Mesh).material) {
                   const material = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
                   if (!material.map) {
                     material.color.set(color);
                   }
                }
            }
        });
    }, [clonedScene, color]);

    return <primitive object={clonedScene} />;
};


/**
 * Renders a single 3D object, which can be a primitive shape or an imported model.
 */
const Shape = React.memo(forwardRef<THREE.Group, { object: SceneObject }>(({ object }, ref) => {
  const { setSelectedObjectIds, addToSelection, startDrag } = useStore();
  const { controls } = useThree();

  // Fix: Use the correctly imported ThreeEvent type.
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();

    if (e.ctrlKey) {
      // Initiate drag-to-move
      const cameraControls = controls as CameraControlsImpl | null;
      if (cameraControls) cameraControls.enabled = false;
      startDrag(object.id, e.point);

    } else if (e.shiftKey) {
      addToSelection(object.id);
    } else {
      setSelectedObjectIds([object.id]);
    }
  };

  const geometry = useMemo(() => {
    switch (object.type) {
      case 'cube':
        return <boxGeometry />;
      case 'sphere':
        return <sphereGeometry args={[0.8, 32, 32]} />;
      case 'cylinder':
        return <cylinderGeometry args={[0.7, 0.7, 1.5, 32]} />;
      case 'torus':
        return <torusGeometry args={[0.6, 0.2, 16, 100]} />;
      case 'cone':
        return <coneGeometry args={[0.8, 1.5, 32]} />;
      case 'plane':
        return <planeGeometry />;
      default:
        return null;
    }
  }, [object.type]);

  return (
    <group
      ref={ref}
      userData={{ id: object.id }}
      position={object.position}
      rotation={object.rotation}
      scale={object.scale}
      onPointerDown={handlePointerDown}
    >
      {object.type === 'model' && object.modelUrl ? (
        <ModelRenderer url={object.modelUrl} color={object.color} fileMap={object.fileMap} />
      ) : (
        <mesh castShadow receiveShadow>
            {geometry}
            <meshStandardMaterial color={object.color} roughness={0.4} metalness={0.2} />
        </mesh>
      )}
    </group>
  );
}));

/**
 * The main 3D Scene component, re-architected for multi-select and group gizmos.
 */
const Scene: React.FC = () => {
    const { objects, selectedObjectIds, setSelectedObjectIds, isFocusModeActive, setFocusMode, dragState, endDrag, updateObject, isSnappingEnabled, snapIncrement } = useStore();
    const { camera, raycaster, gl } = useThree();
    
    const objectRefs = useRef(new Map<string, THREE.Object3D>());
    const pivotRef = useRef<THREE.Group>(new THREE.Group());
    const cameraControlsRef = useRef<CameraControls>(null!);

    const selectionPivot = useMemo(() => {
        if (selectedObjectIds.length === 0) return null;

        if (selectedObjectIds.length === 1) {
            return objectRefs.current.get(selectedObjectIds[0]) || null;
        }

        const box = new THREE.Box3();
        let objectFound = false;
        selectedObjectIds.forEach(id => {
            const obj = objectRefs.current.get(id);
            if (obj) {
                obj.updateWorldMatrix(true, false);
                const objBox = new THREE.Box3().setFromObject(obj);
                box.union(objBox);
                objectFound = true;
            }
        });
        
        if (!objectFound) return null;

        const center = new THREE.Vector3();
        box.getCenter(center);
        pivotRef.current.position.copy(center);
        pivotRef.current.rotation.set(0, 0, 0);
        pivotRef.current.scale.set(1, 1, 1);
        pivotRef.current.updateMatrixWorld(true);

        return pivotRef.current;
    }, [selectedObjectIds, objects]);

    // Effect for the "Focus on Selection" feature
    useEffect(() => {
        if (isFocusModeActive && selectedObjectIds.length === 0) {
            setFocusMode(false);
            return;
        }
        
        if (isFocusModeActive && selectedObjectIds.length > 0 && cameraControlsRef.current) {
            const box = new THREE.Box3();
            let objectFound = false;

            selectedObjectIds.forEach(id => {
                const obj = objectRefs.current.get(id);
                if (obj) {
                    obj.updateWorldMatrix(true, false);
                    const objBox = new THREE.Box3().setFromObject(obj);
                    box.union(objBox);
                    objectFound = true;
                }
            });

            if (objectFound) {
                const size = new THREE.Vector3();
                box.getSize(size);
                if (size.x < 1e-6 && size.y < 1e-6 && size.z < 1e-6) {
                     const center = new THREE.Vector3();
                     box.getCenter(center);
                     cameraControlsRef.current.setTarget(center.x, center.y, center.z, true);
                     cameraControlsRef.current.dollyTo(8, true);
                } else {
                     cameraControlsRef.current.fitToBox(box, true);
                }
            }
        }
    }, [isFocusModeActive, selectedObjectIds, objects, setFocusMode]);

    // Effect for the "Drag to Move" feature
    useEffect(() => {
        const handlePointerMove = (e: PointerEvent) => {
            if (!dragState.isDragging || !dragState.plane || !dragState.startPoint || !dragState.startObjectPosition || !dragState.objectId) return;

            raycaster.setFromCamera(new THREE.Vector2((e.clientX / gl.domElement.clientWidth) * 2 - 1, -(e.clientY / gl.domElement.clientHeight) * 2 + 1), camera);
            
            const intersection = new THREE.Vector3();
            if (raycaster.ray.intersectPlane(dragState.plane, intersection)) {
                const delta = intersection.clone().sub(dragState.startPoint);
                let newPosition = dragState.startObjectPosition.clone().add(delta);

                if (isSnappingEnabled) {
                    const snap = snapIncrement.translate;
                    newPosition.x = Math.round(newPosition.x / snap) * snap;
                    newPosition.z = Math.round(newPosition.z / snap) * snap;
                }
                
                // Update in real-time without creating history
                updateObject(dragState.objectId, { position: newPosition.toArray() }, true);
            }
        };

        const handlePointerUp = () => {
            if (dragState.isDragging) {
                endDrag(); // This will commit the final state to history
                if (cameraControlsRef.current) {
                    cameraControlsRef.current.enabled = true;
                }
            }
        };

        if (dragState.isDragging) {
            document.body.style.cursor = 'grabbing';
            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp, { once: true });
        }

        return () => {
            document.body.style.cursor = 'default';
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [dragState, camera, raycaster, gl.domElement, updateObject, endDrag, isSnappingEnabled, snapIncrement.translate]);


    return (
        <>
            <color attach="background" args={['#252526']} />
            <hemisphereLight intensity={0.5} groundColor="black" />
            <directionalLight 
                position={[10, 15, 8]} 
                intensity={2.5} 
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-far={50}
                shadow-camera-left={-15}
                shadow-camera-right={15}
                shadow-camera-top={15}
                shadow-camera-bottom={-15}
            />
            
            <Grid
                position={[0, -1.0, 0]}
                args={[100, 100]}
                sectionColor={"#404040"}
                cellColor={"#2c2c2c"}
                cellThickness={1}
                sectionThickness={1.5}
                fadeDistance={50}
                infiniteGrid
            />
            
            {objects.map(obj => 
              <Shape 
                key={obj.id} 
                object={obj}
                ref={(el: THREE.Group | null) => {
                  if (el) {
                    objectRefs.current.set(obj.id, el);
                  } else {
                    objectRefs.current.delete(obj.id);
                  }
                }}
              />
            )}
            
            {selectionPivot && (
                <InteractionGizmo pivot={selectionPivot} selectedIds={selectedObjectIds} />
            )}
            
            <CameraControls ref={cameraControlsRef} makeDefault name="camera-controls" />
            
            <mesh rotation-x={-Math.PI / 2} position={[0, -1.01, 0]} onPointerDown={() => setSelectedObjectIds([])} receiveShadow>
                <planeGeometry args={[1000, 1000]} />
                <shadowMaterial opacity={0.3} />
            </mesh>
        </>
    );
};

export default Scene;
