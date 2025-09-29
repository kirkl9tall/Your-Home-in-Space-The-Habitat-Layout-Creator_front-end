// Fix: Use named imports for types from @react-three/fiber to correctly augment JSX.IntrinsicElements.
import { useFrame, useThree, ThreeElements, ThreeEvent } from '@react-three/fiber';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CameraControls as CameraControlsImpl } from 'three-stdlib';
import useStore from '../store/useStore';
import { SceneObject, GizmoMode } from '../types';

// --- CONSTANTS ---
const GIZMO_COLORS = { x: '#ff3653', y: '#00f26d', z: '#2196f3' };
const HOVER_COLOR = '#ffff00';
const ACTIVE_COLOR = '#ffffff';
const HANDLE_OPACITY = { base: 0.8, hover: 1.0 };
const AXES: ['x', 'y', 'z'] = ['x', 'y', 'z'];
const AXIS_VECTORS = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1)
};
const EPSILON = 1e-6;

// --- TYPES ---
type Axis = 'x' | 'y' | 'z';
type GizmoHandle = { mode: GizmoMode; axis: Axis };

interface InteractionGizmoProps {
  pivot: THREE.Object3D;
  selectedIds: string[];
}

const InteractionGizmo: React.FC<InteractionGizmoProps> = ({ pivot, selectedIds }) => {
  const { camera, raycaster, gl, controls } = useThree();
  const { objects, updateObjects, isSnappingEnabled, snapIncrement, gizmoMode } = useStore();

  const [hoveredHandle, setHoveredHandle] = useState<GizmoHandle | null>(null);
  const [activeHandle, setActiveHandle] = useState<GizmoHandle | null>(null);
  const gizmoRef = useRef<THREE.Group>(null!);
  const cameraControls = controls as CameraControlsImpl | null;

  const dragState = useRef({
    isActive: false,
    pointerId: -1,
    plane: new THREE.Plane(),
    startPoint: new THREE.Vector3(),
    startTransforms: new Map<string, {
        position: THREE.Vector3;
        rotation: THREE.Euler;
        scale: THREE.Vector3;
    }>(),
    pivotStart: {
        position: new THREE.Vector3(),
        quaternion: new THREE.Quaternion(),
    }
  });
  
  const onPointerDown = useCallback((e: ThreeEvent<PointerEvent>, mode: GizmoMode, axis: Axis) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    setActiveHandle({ mode, axis });

    const ds = dragState.current;
    ds.isActive = true;
    ds.pointerId = e.pointerId;

    ds.startTransforms.clear();
    const selectedObjects = objects.filter(o => selectedIds.includes(o.id));
    selectedObjects.forEach(obj => {
        ds.startTransforms.set(obj.id, {
            position: new THREE.Vector3().fromArray(obj.position),
            rotation: new THREE.Euler().fromArray(obj.rotation),
            scale: new THREE.Vector3().fromArray(obj.scale),
        });
    });

    ds.pivotStart.position.copy(pivot.position);
    ds.pivotStart.quaternion.copy(pivot.quaternion);

    raycaster.setFromCamera(new THREE.Vector2((e.clientX / gl.domElement.clientWidth) * 2 - 1, -(e.clientY / gl.domElement.clientHeight) * 2 + 1), camera);
    
    const worldPos = new THREE.Vector3();
    pivot.getWorldPosition(worldPos);
    
    const axisVector = AXIS_VECTORS[axis].clone().applyQuaternion(pivot.quaternion);

    if (mode === 'translate') {
      const camDir = camera.position.clone().sub(worldPos).normalize();
      const perp = new THREE.Vector3().crossVectors(camDir, axisVector).normalize();
      const normal = new THREE.Vector3().crossVectors(axisVector, perp).normalize();
      ds.plane.setFromNormalAndCoplanarPoint(normal, worldPos);
    } else {
      const normal = mode === 'rotate' ? axisVector : camera.position.clone().sub(worldPos).normalize();
      ds.plane.setFromNormalAndCoplanarPoint(normal, worldPos);
    }

    const intersection = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(ds.plane, intersection)) {
      ds.startPoint.copy(intersection);
    }

    if (cameraControls) cameraControls.enabled = false;
  }, [pivot, selectedIds, objects, cameraControls, raycaster, camera, gl.domElement]);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const ds = dragState.current;
      if (!ds.isActive || e.pointerId !== ds.pointerId || !activeHandle) return;

      const currentPoint = new THREE.Vector3();
      raycaster.setFromCamera(new THREE.Vector2((e.clientX / gl.domElement.clientWidth) * 2 - 1, -(e.clientY / gl.domElement.clientHeight) * 2 + 1), camera);

      if (raycaster.ray.intersectPlane(ds.plane, currentPoint)) {
        const { mode, axis } = activeHandle;
        const updates: { id: string; newProps: Partial<SceneObject> }[] = [];

        if (mode === 'translate') {
            const axisVector = AXIS_VECTORS[axis].clone();
            const delta = currentPoint.clone().sub(ds.startPoint);
            const projectedDelta = axisVector.multiplyScalar(delta.dot(axisVector));

            if (isSnappingEnabled && projectedDelta.length() > 0) {
              const increment = snapIncrement.translate;
              const snappedLength = Math.round(projectedDelta.length() / increment) * increment;
              projectedDelta.normalize().multiplyScalar(snappedLength);
            }
            
            ds.startTransforms.forEach((start, id) => {
              const newPosition = start.position.clone().add(projectedDelta);
              updates.push({ id, newProps: { position: newPosition.toArray() }});
            });

        } else if (mode === 'rotate') {
            const center = ds.pivotStart.position;
            const startVec = ds.startPoint.clone().sub(center).normalize();
            const currentVec = currentPoint.clone().sub(center).normalize();
            let angle = startVec.angleTo(currentVec);
            
            const rotationAxis = AXIS_VECTORS[axis].clone();
            const cross = new THREE.Vector3().crossVectors(startVec, currentVec);
            if (rotationAxis.dot(cross) < 0) angle = -angle;

            if (isSnappingEnabled) {
                const increment = THREE.MathUtils.degToRad(snapIncrement.rotate);
                angle = Math.round(angle / increment) * increment;
            }

            if (Math.abs(angle) > EPSILON) {
                const deltaRotation = new THREE.Quaternion().setFromAxisAngle(rotationAxis, angle);
                ds.startTransforms.forEach((start, id) => {
                    const relativePos = start.position.clone().sub(center);
                    relativePos.applyQuaternion(deltaRotation);
                    const newPosition = relativePos.add(center);
                    
                    const newRotation = new THREE.Quaternion().copy(new THREE.Quaternion().setFromEuler(start.rotation)).premultiply(deltaRotation);
                    
                    updates.push({ id, newProps: { position: newPosition.toArray(), rotation: new THREE.Euler().setFromQuaternion(newRotation).toArray() as [number,number,number] }});
                });
            }

        } else if (mode === 'scale') {
            const axisVector = AXIS_VECTORS[axis];
            const startOffset = ds.startPoint.clone().sub(ds.pivotStart.position);
            const currentOffset = currentPoint.clone().sub(ds.pivotStart.position);
            
            const denominator = startOffset.dot(axisVector);
            if (Math.abs(denominator) < EPSILON) return; 

            let scaleFactor = currentOffset.dot(axisVector) / denominator;
            if (isSnappingEnabled) {
                const increment = snapIncrement.scale;
                scaleFactor = Math.max(increment, Math.round(scaleFactor / increment) * increment);
            }

            const center = ds.pivotStart.position;
            ds.startTransforms.forEach((start, id) => {
                const relativePos = start.position.clone().sub(center);
                relativePos[axis] *= scaleFactor;
                const newPosition = relativePos.add(center);

                const newScale = start.scale.clone();
                newScale[axis] *= scaleFactor;
                
                updates.push({ id, newProps: { position: newPosition.toArray(), scale: newScale.toArray() } });
            });
        }
        
        if (updates.length > 0) {
            // Update in real-time without creating history entries
            updateObjects(updates, true);
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId === dragState.current.pointerId && dragState.current.isActive) {
        // Finalize the transformation and commit it to history
        const finalUpdates: { id: string; newProps: Partial<SceneObject> }[] = [];
        const currentObjects = useStore.getState().objects;
        
        dragState.current.startTransforms.forEach((_, id) => {
            const finalObj = currentObjects.find(o => o.id === id);
            if(finalObj) {
                finalUpdates.push({ id, newProps: { 
                    position: finalObj.position, 
                    rotation: finalObj.rotation, 
                    scale: finalObj.scale 
                }});
            }
        });
        
        if (finalUpdates.length > 0) {
            // This call will create a single history entry for the entire transformation
            updateObjects(finalUpdates, false);
        }

        dragState.current.isActive = false;
        setActiveHandle(null);
        if (cameraControls) cameraControls.enabled = true;
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [gl, camera, raycaster, updateObjects, cameraControls, activeHandle, isSnappingEnabled, snapIncrement]);

  useFrame(() => {
    if (pivot && gizmoRef.current) {
      const worldPosition = pivot.getWorldPosition(new THREE.Vector3());
      gizmoRef.current.position.copy(worldPosition);
      const dist = camera.position.distanceTo(worldPosition);
      gizmoRef.current.scale.setScalar(dist / 8); 
    }
  });
  
  const getMaterial = (mode: GizmoMode, axis: Axis) => {
      const isActive = activeHandle?.mode === mode && activeHandle?.axis === axis;
      const isHovered = hoveredHandle?.mode === mode && hoveredHandle?.axis === axis;
      const color = isActive ? ACTIVE_COLOR : (isHovered ? HOVER_COLOR : GIZMO_COLORS[axis]);
      const opacity = (isActive || isHovered) ? HANDLE_OPACITY.hover : HANDLE_OPACITY.base;
      return <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthTest={false} />;
  }
  
  const handleProps = (mode: GizmoMode, axis: Axis) => ({
    onPointerDown: (e: ThreeEvent<PointerEvent>) => onPointerDown(e, mode, axis),
    onPointerEnter: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHoveredHandle({ mode, axis }) },
    onPointerLeave: () => setHoveredHandle(null),
  });

  return (
    <group ref={gizmoRef} >
      {gizmoMode === 'translate' && (
        <>
          <group rotation-z={-Math.PI / 2}>
              <Arrow axis="x" getMaterial={getMaterial} handleProps={handleProps} />
          </group>
          <group>
              <Arrow axis="y" getMaterial={getMaterial} handleProps={handleProps} />
          </group>
          <group rotation-x={Math.PI / 2}>
              <Arrow axis="z" getMaterial={getMaterial} handleProps={handleProps} />
          </group>
        </>
      )}

      {gizmoMode === 'rotate' && AXES.map((axis) => (
         <group key={`rotate-${axis}`} rotation-x={axis === 'y' ? Math.PI/2 : 0} rotation-y={axis === 'x' ? -Math.PI/2 : 0}>
            <mesh renderOrder={999}>
                <torusGeometry args={[1.2, 0.02, 16, 64]} />
                {getMaterial('rotate', axis)}
            </mesh>
            <mesh {...handleProps('rotate', axis)}>
                <torusGeometry args={[1.2, 0.1, 8, 32]} />
                <meshBasicMaterial visible={false} />
            </mesh>
        </group>
      ))}

      {gizmoMode === 'scale' && AXES.map((axis) => (
        <group key={`scale-${axis}`} position={[axis === 'x' ? 1.4 : 0, axis === 'y' ? 1.4 : 0, axis === 'z' ? 1.4 : 0]}>
            <mesh renderOrder={999}>
                <boxGeometry args={[0.12, 0.12, 0.12]} />
                {getMaterial('scale', axis)}
            </mesh>
            <mesh {...handleProps('scale', axis)}>
                <boxGeometry args={[0.2, 0.2, 0.2]} />
                <meshBasicMaterial visible={false} />
            </mesh>
        </group>
      ))}
    </group>
  );
};

const Arrow = ({ axis, getMaterial, handleProps }: { axis: Axis; getMaterial: (mode: GizmoMode, axis: Axis) => React.ReactElement; handleProps: (mode: GizmoMode, axis: Axis) => object; }) => (
    <>
      <mesh position={[0, 0.5, 0]} renderOrder={999}>
        <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
        {getMaterial('translate', axis)}
      </mesh>
      <mesh position={[0, 1, 0]} renderOrder={999}>
        <coneGeometry args={[0.06, 0.2, 16]} />
        {getMaterial('translate', axis)}
      </mesh>
      <mesh position={[0, 0.5, 0]} {...handleProps('translate', axis)}>
        <cylinderGeometry args={[0.1, 0.1, 1.2, 8]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </>
);


export default InteractionGizmo;
