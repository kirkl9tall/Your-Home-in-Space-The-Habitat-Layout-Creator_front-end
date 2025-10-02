import { useLoader, useThree, ThreeEvent } from '@react-three/fiber';
import React, { useMemo, useRef, forwardRef, useEffect, Suspense } from 'react';
import * as THREE from 'three';
import { CameraControls, Grid, GizmoHelper, GizmoViewport, Line } from '@react-three/drei';
import { GLTFLoader, GLTFExporter, SVGLoader, FontLoader, TextGeometry } from 'three-stdlib';
import useStore from '../store/useStore';
import { SceneObject, ShapeType } from '../types';
import InteractionGizmo from './InteractionGizmo';
import SceneCamera from './SceneCamera';
import MeasurementLayer from './MeasurementLayer';
import { createGearGeometry, createStarGeometry, createHeartGeometry } from '../utils/geometry';
import { toast } from './Toast';
import CameraInfoOverlay from './CameraInfoOverlay';

const ModelRenderer: React.FC<{ object: SceneObject }> = ({ object }) => {
    const gltf = useLoader(GLTFLoader, object.modelUrl!, (loader) => {
      if (object.fileMap) {
        const manager = new THREE.LoadingManager();
        manager.setURLModifier((path) => object.fileMap![path] || path);
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
                   // Add a safeguard to ensure we only modify standard materials
                   if (material.isMeshStandardMaterial) {
                       if (!material.map) material.color.set(object.color);
                       if (!material.metalnessMap) material.metalness = object.metalness;
                       if (!material.roughnessMap) material.roughness = object.roughness;
                       if (!material.emissiveMap) {
                           material.emissive.set(object.emissiveColor);
                           material.emissiveIntensity = object.emissiveIntensity;
                       }
                       if (!material.alphaMap) {
                           material.opacity = object.opacity;
                           material.transparent = object.transparent;
                       }
                       material.wireframe = object.wireframe;
                   }
                }
            }
        });
    }, [clonedScene, object]);
    return <primitive object={clonedScene} />;
};

const TextRenderer: React.FC<{ object: SceneObject }> = ({ object }) => {
    const font = useLoader(FontLoader, 'https://aistudiocdn.com/three@^0.159.0/examples/fonts/helvetiker_regular.typeface.json');
    const textGeo = useMemo(() => {
        const geometry = new TextGeometry(object.text || ' ', {
            font: font,
            size: 0.8,
            height: object.extrusionDepth ?? 0.2,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelOffset: 0,
            bevelSegments: 5,
        });
        geometry.center();
        return geometry;
    }, [font, object.text, object.extrusionDepth]);

    return <primitive object={textGeo} />;
}

const SvgRenderer: React.FC<{ object: SceneObject }> = ({ object }) => {
    const svgGeo = useMemo(() => {
        if (!object.svgData) return null;
        const loader = new SVGLoader();
        const data = loader.parse(object.svgData);
        const paths = data.paths;
        const geometries: THREE.BufferGeometry[] = [];
        
        for (const path of paths) {
            const shapes = SVGLoader.createShapes(path);
            for (const shape of shapes) {
                const geometry = new THREE.ExtrudeGeometry(shape, {
                    steps: 1,
                    depth: object.extrusionDepth ?? 0.2,
                    bevelEnabled: false,
                });
                geometries.push(geometry);
            }
        }
        
        if (geometries.length === 0) return null;

        const group = new THREE.Group();
        geometries.forEach(geometry => {
            const mesh = new THREE.Mesh(geometry);
            group.add(mesh);
        });

        const box = new THREE.Box3().setFromObject(group);
        const center = new THREE.Vector3();
        box.getCenter(center);
        group.children.forEach(child => {
            child.position.sub(center);
        });

        const finalGeometry = geometries.length > 1 ? new THREE.BufferGeometry() : geometries[0];
        if (geometries.length > 1) {
            // This is a placeholder; merging is complex. For now, we render the first shape.
            // A full implementation would merge geometries.
            return geometries[0];
        }
        
        return finalGeometry;
    }, [object.svgData, object.extrusionDepth]);

    return svgGeo ? <primitive object={svgGeo} /> : null;
};


const Geometries: React.FC<{ object: SceneObject }> = React.memo(({ object }) => {
    const { type } = object;
    const shapeGeo = useMemo(() => {
        if (type === 'star') return new THREE.ExtrudeGeometry(createStarGeometry(object.starConfig!), { depth: object.extrusionDepth ?? 0.2, bevelEnabled: false });
        if (type === 'heart') return new THREE.ExtrudeGeometry(createHeartGeometry(), { depth: object.extrusionDepth ?? 0.2, bevelEnabled: false });
        return null;
    }, [type, object.starConfig, object.extrusionDepth]);

    switch (type) {
        case 'cube': return <boxGeometry />;
        case 'sphere': return <sphereGeometry args={[0.5, 32, 32]} />;
        case 'cylinder': return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
        case 'torus': return <torusGeometry args={[0.4, 0.1, 16, 100]} />;
        case 'cone': return <coneGeometry args={[0.5, 1, 32]} />;
        case 'plane': return <circleGeometry args={[1, 32]} />;
        case 'capsule': return <capsuleGeometry args={[0.3, 0.4, 32, 32]} />;
        case 'pyramid': return <coneGeometry args={[0.7, 1, 4]} />;
        case 'gear': return <primitive object={createGearGeometry()} />;
        case 'text': return <Suspense fallback={null}><TextRenderer object={object} /></Suspense>;
        case 'svg': return <Suspense fallback={null}><SvgRenderer object={object} /></Suspense>;
        case 'star':
        case 'heart':
            return shapeGeo ? <primitive object={shapeGeo} /> : null;
        default: return null;
    }
});

interface ShapeProps {
  object: SceneObject;
  children?: React.ReactNode;
}

const Shape = React.memo(forwardRef<THREE.Group, ShapeProps>(({ object, children }, ref) => {
  const { setSelectedObjectIds, addToSelection, objects } = useStore();

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    
    let topParent = object;
    while(topParent.parentId) {
      const parent = objects[topParent.parentId];
      if (parent) topParent = parent;
      else break;
    }
    
    if (topParent.isLocked) return;
    
    if (e.shiftKey) {
      addToSelection(topParent.id);
    } else {
      setSelectedObjectIds([topParent.id]);
    }
  };

  return (
    <group
      ref={ref}
      userData={{ id: object.id }}
      position={object.position}
      rotation={object.rotation}
      scale={object.scale}
      onPointerDown={handlePointerDown}
      visible={object.isVisible}
    >
      {object.type === 'model' && object.modelUrl ? (
        <ModelRenderer object={object} />
      ) : (
        object.type !== 'group' && (
            <mesh castShadow receiveShadow>
                <Geometries object={object} />
                <meshStandardMaterial 
                  color={object.color} 
                  roughness={object.roughness} 
                  metalness={object.metalness}
                  opacity={object.opacity}
                  transparent={object.transparent}
                  emissive={object.emissiveColor}
                  emissiveIntensity={object.emissiveIntensity}
                  wireframe={object.wireframe}
                  side={object.type === 'plane' || object.type === 'svg' ? THREE.DoubleSide : THREE.FrontSide}
                />
            </mesh>
        )
      )}
      {children}
    </group>
  );
}));


const SceneNode: React.FC<{ object: SceneObject; allObjects: SceneObject[]; objectRefs: React.MutableRefObject<Map<string, THREE.Object3D>> }> = ({ object, allObjects, objectRefs }) => {
    const children = allObjects.filter(child => child.parentId === object.id);
    return (
        <Shape 
            object={object}
            ref={(el: THREE.Group | null) => {
                if (el) objectRefs.current.set(object.id, el);
                else objectRefs.current.delete(object.id);
            }}
        >
          {children.map(child => <SceneNode key={child.id} object={child} allObjects={allObjects} objectRefs={objectRefs} />)}
        </Shape>
    );
};

const Exporter: React.FC<{ objectRefs: React.MutableRefObject<Map<string, THREE.Object3D>> }> = ({ objectRefs }) => {
    const { exportRequest, setExportRequest, selectedObjectIds } = useStore();
    const { scene } = useThree();

    useEffect(() => {
        if (exportRequest !== 'glb') return;

        try {
            const exporter = new GLTFExporter();
            const objectsToExport: THREE.Object3D[] = [];
            
            const idsToExport = selectedObjectIds.length > 0 ? selectedObjectIds : Object.keys(useStore.getState().objects);
            
            idsToExport.forEach(id => {
                const obj = objectRefs.current.get(id);
                if(obj) {
                    // To prevent exporting the gizmo if it's a child of the pivot
                    const cloned = obj.clone();
                    cloned.children = cloned.children.filter(c => c.type !== 'TransformControls');
                    objectsToExport.push(cloned);
                }
            });

            if (objectsToExport.length === 0) {
                toast.error("Nothing to export.");
                setExportRequest(null);
                return;
            }

            exporter.parse(
                objectsToExport.length === 1 ? objectsToExport[0] : objectsToExport,
                (result) => {
                    const blob = new Blob([result as ArrayBuffer], { type: 'application/octet-stream' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `scene-${Date.now()}.glb`;
                    link.click();
                    URL.revokeObjectURL(link.href);
                    toast.success("Export successful!");
                },
                (error) => {
                    console.error('An error happened during GLTF export:', error);
                    toast.error("Export failed.");
                },
                { binary: true }
            );
        } catch(error) {
            console.error('An unhandled error occurred during GLTF export:', error);
            toast.error("An unexpected error occurred during export.");
        }


        setExportRequest(null);
    }, [exportRequest, setExportRequest, objectRefs, selectedObjectIds, scene]);

    return null;
}

interface SceneProps {
  isCameraInfoOpen: boolean;
  setCameraInfoOpen: (isOpen: boolean) => void;
  inspectorWidth: string;
  toolbarWidth: string;
}

const Scene: React.FC<SceneProps> = ({ isCameraInfoOpen, setCameraInfoOpen, inspectorWidth, toolbarWidth }) => {
    const { 
        objects, selectedObjectIds, setSelectedObjectIds, isFocusModeActive, 
        setFocusMode, dragState, endDrag, updateObject, isSnappingEnabled, 
        snapIncrement, creationState, setCreationMode, addObject, startDrag,
        isGridVisible, gridConfig
    } = useStore();
    const shadowMapSize = useStore(state => state.renderQuality.shadowMapSize);
    const { camera, raycaster, gl } = useThree();
    
    const objectRefs = useRef(new Map<string, THREE.Object3D>());
    const pivotRef = useRef<THREE.Group>(new THREE.Group());
    const cameraControlsRef = useRef<CameraControls>(null!);

    const allObjects = useMemo(() => Object.values(objects), [objects]);
    const rootObjects = useMemo(() => allObjects.filter(obj => !obj.parentId), [allObjects]);
    const activeSelectionIds = useMemo(() => selectedObjectIds.filter(id => objects[id] && !objects[id].isLocked), [selectedObjectIds, objects]);

    const selectionPivot = useMemo(() => {
        if (activeSelectionIds.length === 0) return null;

        const box = new THREE.Box3();
        let objectFound = false;
        activeSelectionIds.forEach(id => {
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
    }, [activeSelectionIds, objects]);

    useEffect(() => {
        if (isFocusModeActive && activeSelectionIds.length === 0) {
            setFocusMode(false);
            return;
        }
        if (isFocusModeActive && activeSelectionIds.length > 0 && cameraControlsRef.current) {
            const box = new THREE.Box3();
            let objectFound = false;
            activeSelectionIds.forEach(id => {
                const obj = objectRefs.current.get(id);
                if (obj) {
                    obj.updateWorldMatrix(true, false);
                    box.expandByObject(obj);
                    objectFound = true;
                }
            });
            if (objectFound && !box.isEmpty()) {
                 cameraControlsRef.current.fitToBox(box, true, { paddingTop: 1, paddingLeft: 1, paddingBottom: 1, paddingRight: 1 });
            }
        }
    }, [isFocusModeActive, activeSelectionIds, objects, setFocusMode]);

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
                updateObject(dragState.objectId, { position: newPosition.toArray() }, true);
            }
        };

        const handlePointerUp = () => {
            if (dragState.isDragging) {
                endDrag();
                if (cameraControlsRef.current) cameraControlsRef.current.enabled = true;
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

    const handleGroundPlanePointerDown = (e: ThreeEvent<PointerEvent>) => {
      if (creationState.shapeType) {
        e.stopPropagation();
        const newObjectId = addObject(creationState.shapeType, e.point.toArray() as [number, number, number]);
        if (newObjectId) {
            startDrag(newObjectId, e.point);
        }
        setCreationMode(null);
      } else {
        setSelectedObjectIds([]);
      }
    };

    return (
        <>
            <color attach="background" args={['#181a1f']} />
            <hemisphereLight intensity={0.5} groundColor="black" />
            <directionalLight 
                position={[10, 15, 8]} intensity={2.5} castShadow
                shadow-mapSize-width={shadowMapSize} shadow-mapSize-height={shadowMapSize}
                shadow-camera-far={50} shadow-camera-left={-15} shadow-camera-right={-15}
                shadow-camera-top={15} shadow-camera-bottom={-15}
            />
            
            <SceneCamera />

            {isGridVisible && (
                <>
                    <Grid 
                        position={[0, -0.01, 0]} 
                        args={[100, 100]} 
                        sectionColor={"#303640"} 
                        cellColor={"#2A2F36"} 
                        cellThickness={1} 
                        sectionThickness={1.2} 
                        fadeDistance={gridConfig.fadeDistance}
                        cellSize={gridConfig.cellSize}
                        sectionSize={gridConfig.sectionSize}
                        infiniteGrid 
                    />
                    <group>
                        <Line points={[[0, 0.01, 0], [1, 0.01, 0]]} color={'#ff3653'} lineWidth={2} />
                        <Line points={[[0, 0.01, 0], [0, 1.01, 0]]} color={'#00f26d'} lineWidth={2} />
                        <Line points={[[0, 0.01, 0], [0, 0.01, 1]]} color={'#2196f3'} lineWidth={2} />
                    </group>
                </>
            )}
            
            {rootObjects.map(obj => <SceneNode key={obj.id} object={obj} allObjects={allObjects} objectRefs={objectRefs} />)}
            
            {selectionPivot && (
                <InteractionGizmo pivot={selectionPivot} selectedIds={activeSelectionIds} />
            )}
            
            <CameraControls ref={cameraControlsRef} makeDefault name="camera-controls" />
            
            <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} onPointerDown={handleGroundPlanePointerDown} receiveShadow>
                <planeGeometry args={[1000, 1000]} />
                <shadowMaterial opacity={0.3} />
            </mesh>
            <Exporter objectRefs={objectRefs} />
            <MeasurementLayer />
            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                <GizmoViewport axisColors={['#ff3653', '#00f26d', '#2196f3']} labelColor="white" />
            </GizmoHelper>
            {isCameraInfoOpen && <CameraInfoOverlay onClose={() => setCameraInfoOpen(false)} toolbarWidth={toolbarWidth} />}
        </>
    );
};

export default Scene;