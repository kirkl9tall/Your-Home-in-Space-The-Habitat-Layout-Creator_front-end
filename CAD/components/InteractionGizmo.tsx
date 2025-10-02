// Fix: Use named imports for types from @react-three/fiber to correctly augment JSX.IntrinsicElements.
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CameraControls as CameraControlsImpl } from 'three-stdlib';
import useStore from '../store/useStore';
import { SceneObject, GizmoMode } from '../types';

// --- CONSTANTS ---
const GIZMO_COLORS = { x: '#ff3653', y: '#00f26d', z: '#2196f3', uniform: '#cccccc', xyz: '#cccccc', xy: '#2196f3', yz: '#ff3653', xz: '#00f26d' };
const HOVER_COLOR = '#ffff00';
const ACTIVE_COLOR = '#ffffff';
const HANDLE_OPACITY = { base: 0.8, hover: 1.0, plane: 0.4 };
const AXES: ['x', 'y', 'z'] = ['x', 'y', 'z'];
const AXIS_VECTORS = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1)
};
const EPSILON = 1e-6;
const INVISIBLE_MATERIAL = <meshBasicMaterial transparent opacity={0} depthTest={false} depthWrite={false} />;


// --- TYPES ---
type Axis = 'x' | 'y' | 'z';
type HandleAxis = Axis | 'xy' | 'yz' | 'xz' | 'xyz';
type GizmoHandle = { mode: GizmoMode; axis: HandleAxis };

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

  // Use a ref for drag state to avoid re-renders on every mouse move, which is critical for performance.
  const dragState = useRef({
    isActive: false,
    pointerId: -1,
    plane: new THREE.Plane(),
    startPoint: new THREE.Vector3(),
    // Store the initial state of all selected objects at the start of a drag.
    startTransforms: new Map<string, {
        position: THREE.Vector3;
        rotation: THREE.Euler;
        scale: THREE.Vector3;
    }>(),
    // Store the pivot's initial transform as well for rotation calculations.
    pivotStart: {
        position: new THREE.Vector3(),
        quaternion: new THREE.Quaternion(),
    }
  });
  
  const onPointerDown = useCallback((e: ThreeEvent<PointerEvent>, mode: GizmoMode, axis: HandleAxis) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    setActiveHandle({ mode, axis });

    // --- 1. INITIALIZE DRAG STATE ---
    const ds = dragState.current;
    ds.isActive = true;
    ds.pointerId = e.pointerId;

    // Capture the starting transforms of all selected objects.
    ds.startTransforms.clear();
    selectedIds.map(id => objects[id]).filter(Boolean).forEach(obj => {
        ds.startTransforms.set(obj.id, {
            position: new THREE.Vector3().fromArray(obj.position),
            rotation: new THREE.Euler().fromArray(obj.rotation),
            scale: new THREE.Vector3().fromArray(obj.scale),
        });
    });
    // Capture the pivot's starting transform.
    ds.pivotStart.position.copy(pivot.position);
    ds.pivotStart.quaternion.copy(pivot.quaternion);

    // --- 2. DEFINE THE INTERACTION PLANE ---
    // The core of the gizmo logic is defining a 3D plane on which 2D mouse movements will be projected.
    // The plane's orientation depends on the handle being dragged.
    raycaster.setFromCamera(new THREE.Vector2((e.clientX / gl.domElement.clientWidth) * 2 - 1, -(e.clientY / gl.domElement.clientHeight) * 2 + 1), camera);
    
    const worldPos = new THREE.Vector3();
    pivot.getWorldPosition(worldPos);
    let normal: THREE.Vector3;

    if ((mode === 'translate' || mode === 'scale') && (axis === 'x' || axis === 'y' || axis === 'z')) {
        // --- AXIAL TRANSLATE & SCALE ---
        // For dragging along a single axis, we need a plane that contains that axis but is "facing" the camera
        // as much as possible for intuitive control.
        const axisVec = AXIS_VECTORS[axis as Axis].clone();
        const camToGizmo = worldPos.clone().sub(camera.position);
        
        // Find a vector perpendicular to both the manipulation axis and the camera's line of sight using a cross product.
        let orthoVec = new THREE.Vector3().crossVectors(axisVec, camToGizmo);

        // Edge case: If the camera looks straight down the axis, the cross product is zero. We need a fallback.
        if (orthoVec.lengthSq() < EPSILON) {
            orthoVec.crossVectors(axisVec, camera.up); // Use camera's "up" vector as a fallback.
            if (orthoVec.lengthSq() < EPSILON) { // If that also fails, use a world axis.
                const fallback = Math.abs(axisVec.y) > (1.0 - EPSILON) ? AXIS_VECTORS.z : AXIS_VECTORS.y;
                orthoVec.crossVectors(axisVec, fallback);
            }
        }
        
        // The plane normal is the cross product of the axis and our generated orthogonal vector.
        // This creates a plane that robustly contains the axis and is oriented towards the camera.
        normal = new THREE.Vector3().crossVectors(axisVec, orthoVec).normalize();
    } else if (mode === 'translate') {
        // --- PLANAR TRANSLATE ---
        // For planar dragging, the plane is simply aligned with the world axes.
        if (axis === 'xy') normal = AXIS_VECTORS.z.clone();
        else if (axis === 'yz') normal = AXIS_VECTORS.x.clone();
        else normal = AXIS_VECTORS.y.clone(); // xz
    } else if (mode === 'rotate') {
        // --- ROTATE ---
        // For rotation, the plane is perpendicular to the axis of rotation.
        normal = AXIS_VECTORS[axis as Axis].clone();
    } else if (mode === 'scale' && axis === 'xyz') {
        // --- UNIFORM SCALE ---
        // For uniform scale, we use a plane that faces the camera directly.
        normal = camera.position.clone().sub(worldPos).normalize();
    } else {
        // Fallback, should not happen with current handles.
        normal = camera.position.clone().sub(worldPos).normalize();
    }

    // Set the plane using the calculated normal and the gizmo's world position.
    ds.plane.setFromNormalAndCoplanarPoint(normal, worldPos);

    // Find the initial intersection point of the mouse ray with our new plane.
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

      // --- 3. CALCULATE TRANSFORMATION ON DRAG ---
      const currentPoint = new THREE.Vector3();
      raycaster.setFromCamera(new THREE.Vector2((e.clientX / gl.domElement.clientWidth) * 2 - 1, -(e.clientY / gl.domElement.clientHeight) * 2 + 1), camera);

      if (raycaster.ray.intersectPlane(ds.plane, currentPoint)) {
        const { mode, axis } = activeHandle;
        const updates: { id: string; newProps: Partial<SceneObject> }[] = [];
        const delta = currentPoint.clone().sub(ds.startPoint);

        if (mode === 'translate') {
            let projectedDelta: THREE.Vector3;
            if (axis === 'x' || axis === 'y' || axis === 'z') { // Axial
                const axisVector = AXIS_VECTORS[axis as Axis].clone();
                projectedDelta = axisVector.multiplyScalar(delta.dot(axisVector));
            } else { // Planar
                projectedDelta = delta;
            }

            if (isSnappingEnabled) {
              const snap = snapIncrement.translate;
              projectedDelta.divideScalar(snap).round().multiplyScalar(snap);
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
            
            const rotationAxis = AXIS_VECTORS[axis as Axis].clone();
            if (rotationAxis.dot(new THREE.Vector3().crossVectors(startVec, currentVec)) < 0) angle = -angle;

            if (isSnappingEnabled) {
                const increment = THREE.MathUtils.degToRad(snapIncrement.rotate);
                angle = Math.round(angle / increment) * increment;
            }

            if (Math.abs(angle) > EPSILON) {
                const deltaRotation = new THREE.Quaternion().setFromAxisAngle(rotationAxis, angle);
                ds.startTransforms.forEach((start, id) => {
                    const newPosition = start.position.clone().sub(center).applyQuaternion(deltaRotation).add(center);
                    const newRotation = new THREE.Quaternion().setFromEuler(start.rotation).premultiply(deltaRotation);
                    updates.push({ id, newProps: { position: newPosition.toArray(), rotation: new THREE.Euler().setFromQuaternion(newRotation).toArray() as [number,number,number] }});
                });
            }

        } else if (mode === 'scale') {
            const center = ds.pivotStart.position;
            const startOffset = ds.startPoint.clone().sub(center);
            let scaleFactor = 1;

            if (axis === 'xyz') { // Uniform scale
                const camDir = camera.position.clone().sub(center).normalize();
                const startProj = startOffset.dot(camDir);
                const currentProj = currentPoint.clone().sub(center).dot(camDir);
                if (Math.abs(startProj) > EPSILON) scaleFactor = currentProj / startProj;
            } else { // Per-axis scale
                const axisVector = AXIS_VECTORS[axis as Axis];
                const denominator = startOffset.dot(axisVector);
                if (Math.abs(denominator) > EPSILON) {
                    scaleFactor = currentPoint.clone().sub(center).dot(axisVector) / denominator;
                }
            }

            if (isSnappingEnabled) {
                const increment = snapIncrement.scale;
                scaleFactor = Math.max(increment, Math.round(scaleFactor / increment) * increment);
            }
            
            const worldScaleVec = new THREE.Vector3( (axis === 'x' || axis === 'xyz') ? scaleFactor : 1, (axis === 'y' || axis === 'xyz') ? scaleFactor : 1, (axis === 'z' || axis === 'xyz') ? scaleFactor : 1 );

            ds.startTransforms.forEach((start, id) => {
                const newPosition = start.position.clone().sub(center).multiply(worldScaleVec).add(center);
                const newScale = start.scale.clone().multiply(worldScaleVec); // This simplified scale works for non-rotated objects
                updates.push({ id, newProps: { position: newPosition.toArray(), scale: newScale.toArray() } });
            });
        }
        
        if (updates.length > 0) {
            updateObjects(updates, true); // Update silently during drag
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      // --- 4. FINALIZE DRAG AND COMMIT TO HISTORY ---
      if (e.pointerId === dragState.current.pointerId && dragState.current.isActive) {
        const finalUpdates: { id: string; newProps: Partial<SceneObject> }[] = [];
        const currentObjects = useStore.getState().objects;
        
        dragState.current.startTransforms.forEach((_, id) => {
            const finalObj = currentObjects[id];
            if(finalObj) {
                finalUpdates.push({ id, newProps: { 
                    position: finalObj.position, 
                    rotation: finalObj.rotation, 
                    scale: finalObj.scale 
                }});
            }
        });
        
        // Final update that gets recorded in the undo/redo history.
        if (finalUpdates.length > 0) {
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
    // Keep the gizmo at a constant size in screen space by scaling it based on its distance to the camera.
    if (pivot && gizmoRef.current) {
      const worldPosition = pivot.getWorldPosition(new THREE.Vector3());
      gizmoRef.current.position.copy(worldPosition);
      const dist = camera.position.distanceTo(worldPosition);
      gizmoRef.current.scale.setScalar(dist / 8); 
    }
  });
  
  // Helper to get the correct material based on hover/active state.
  const getMaterial = (mode: GizmoMode, axis: HandleAxis) => {
      const isActive = activeHandle?.mode === mode && activeHandle?.axis === axis;
      const isHovered = hoveredHandle?.mode === mode && hoveredHandle?.axis === axis;
      const color = isActive ? ACTIVE_COLOR : (isHovered ? HOVER_COLOR : GIZMO_COLORS[axis as keyof typeof GIZMO_COLORS] || GIZMO_COLORS.x);
      const opacity = axis.length > 1 && axis !== 'xyz' ? HANDLE_OPACITY.plane : (isActive || isHovered) ? HANDLE_OPACITY.hover : HANDLE_OPACITY.base;
      return <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthTest={false} depthWrite={false} />;
  }
  
  // Helper to attach pointer event listeners to handle meshes.
  const handleProps = (mode: GizmoMode, axis: HandleAxis) => ({
    onPointerDown: (e: ThreeEvent<PointerEvent>) => onPointerDown(e, mode, axis),
    onPointerEnter: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHoveredHandle({ mode, axis }) },
    onPointerLeave: () => setHoveredHandle(null),
  });

  return (
    <group ref={gizmoRef} >
      {gizmoMode === 'translate' && (
        <>
            <Arrow axis="x" getMaterial={getMaterial} handleProps={handleProps} />
            <Arrow axis="y" getMaterial={getMaterial} handleProps={handleProps} />
            <Arrow axis="z" getMaterial={getMaterial} handleProps={handleProps} />
            <PlaneHandle axis='xy' getMaterial={getMaterial} handleProps={handleProps} />
            <PlaneHandle axis='yz' getMaterial={getMaterial} handleProps={handleProps} />
            <PlaneHandle axis='xz' getMaterial={getMaterial} handleProps={handleProps} />
        </>
      )}

      {gizmoMode === 'rotate' && AXES.map((axis) => (
         <group key={`rotate-${axis}`} rotation-x={axis === 'y' ? Math.PI/2 : 0} rotation-y={axis === 'x' ? -Math.PI/2 : 0}>
            <mesh renderOrder={999}>
                <ringGeometry args={[1.1, 1.3, 64]} />
                {getMaterial('rotate', axis)}
            </mesh>
            <mesh {...handleProps('rotate', axis)}>
                <torusGeometry args={[1.2, 0.2, 8, 32]} />
                {INVISIBLE_MATERIAL}
            </mesh>
        </group>
      ))}

      {gizmoMode === 'scale' && (
          <>
            {AXES.map((axis) => (
                <group key={`scale-${axis}`} rotation={ new THREE.Euler(axis === 'z' ? Math.PI/2 : 0, axis === 'x' ? Math.PI/2 : 0, 0) }>
                    <ScaleHandle axis={axis} getMaterial={getMaterial} handleProps={handleProps} />
                </group>
            ))}
             <mesh {...handleProps('scale', 'xyz')} renderOrder={999}>
                <boxGeometry args={[0.25, 0.25, 0.25]} />
                {getMaterial('scale', 'xyz')}
            </mesh>
          </>
      )}
    </group>
  );
};

const Arrow = ({ axis, getMaterial, handleProps }: { axis: Axis; getMaterial: (mode: GizmoMode, axis: HandleAxis) => React.ReactElement; handleProps: (mode: GizmoMode, axis: HandleAxis) => object; }) => (
    <group rotation={ new THREE.Euler(axis === 'z' ? -Math.PI/2 : 0, 0, axis === 'x' ? Math.PI/2 : 0) }>
      <mesh position={[0, 0.5, 0]} renderOrder={999}>
        <cylinderGeometry args={[0.03, 0.03, 1, 8]} />
        {getMaterial('translate', axis)}
      </mesh>
      <mesh position={[0, 1, 0]} renderOrder={999}>
        <coneGeometry args={[0.1, 0.2, 16]} />
        {getMaterial('translate', axis)}
      </mesh>
      <mesh position={[0, 0.5, 0]} {...handleProps('translate', axis)}>
        <cylinderGeometry args={[0.12, 0.12, 1.2, 8]} />
        {INVISIBLE_MATERIAL}
      </mesh>
    </group>
);

const PlaneHandle = ({ axis, getMaterial, handleProps }: { axis: 'xy' | 'yz' | 'xz'; getMaterial: (mode: GizmoMode, axis: HandleAxis) => React.ReactElement; handleProps: (mode: GizmoMode, axis: HandleAxis) => object; }) => {
    const position: [number, number, number] = [axis === 'yz' ? 0 : 0.4, axis === 'xz' ? 0 : 0.4, axis === 'xy' ? 0 : 0.4];
    const rotation: [number, number, number] = [axis === 'xy' ? 0 : Math.PI/2, axis === 'yz' ? Math.PI/2 : 0, 0];
    return (
        <mesh position={position} rotation={rotation} {...handleProps('translate', axis)} renderOrder={998}>
            <planeGeometry args={[0.4, 0.4]} />
            {getMaterial('translate', axis)}
        </mesh>
    );
};

const ScaleHandle = ({ axis, getMaterial, handleProps }: { axis: Axis; getMaterial: (mode: GizmoMode, axis: HandleAxis) => React.ReactElement; handleProps: (mode: GizmoMode, axis: HandleAxis) => object; }) => (
    <>
      <mesh position={[0, 0.6, 0]} renderOrder={999}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
        {getMaterial('scale', axis)}
      </mesh>
      <mesh position={[0, 1.2, 0]} renderOrder={999}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        {getMaterial('scale', axis)}
      </mesh>
      <mesh position={[0, 0.6, 0]} {...handleProps('scale', axis)}>
        <cylinderGeometry args={[0.12, 0.12, 1.4, 8]} />
        {INVISIBLE_MATERIAL}
      </mesh>
    </>
);


export default InteractionGizmo;