import React, { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Line, Text } from '@react-three/drei';
import useStore from '../store/useStore';
import { Measurement } from '../types';

const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.02);

const MeasurementLine: React.FC<{
  measurement: Measurement;
  isTemporary?: boolean;
}> = ({ measurement, isTemporary }) => {
  const start = useMemo(() => new THREE.Vector3(...measurement.start), [measurement.start]);
  const end = useMemo(() => new THREE.Vector3(...measurement.end), [measurement.end]);
  const midPoint = useMemo(() => new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5), [start, end]);
  const distance = useMemo(() => start.distanceTo(end), [start, end]);

  if (distance < 0.01) return null;

  return (
    <group>
      <Line
        points={[start, end]}
        color={isTemporary ? '#0090ff' : '#FFA500'}
        lineWidth={isTemporary ? 2 : 3}
        dashed={isTemporary}
        dashSize={0.2}
        gapSize={0.1}
      />
      <mesh position={start}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial color={isTemporary ? '#0090ff' : '#FFA500'} />
      </mesh>
      <mesh position={end}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial color={isTemporary ? '#0090ff' : '#FFA500'} />
      </mesh>
      <Text
        position={midPoint}
        color="white"
        fontSize={0.25}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
        billboard
      >
        {distance.toFixed(3)}
      </Text>
    </group>
  );
};

const MeasurementLayer: React.FC = () => {
  const {
    isMeasureModeActive,
    measurements,
    currentMeasurement,
    isSnappingEnabled,
    snapIncrement,
    startOrEndMeasurement,
    updateCurrentMeasurementEnd,
  } = useStore();
  
  const { scene, camera, raycaster, gl, size } = useThree();

  const getPointInScene = (e: PointerEvent): THREE.Vector3 | null => {
    const pointer = new THREE.Vector2(
      (e.clientX / size.width) * 2 - 1,
      -(e.clientY / size.height) * 2 + 1
    );
    raycaster.setFromCamera(pointer, camera);

    // Prioritize intersecting with scene objects
    const intersects = raycaster.intersectObjects(scene.children, true);
    let point: THREE.Vector3 | null = null;
    
    if (intersects.length > 0) {
      point = intersects[0].point;
    } else {
      // Fallback to ground plane
      const intersection = new THREE.Vector3();
      if(raycaster.ray.intersectPlane(groundPlane, intersection)) {
        point = intersection;
      }
    }
    
    if (point && isSnappingEnabled) {
      const snap = snapIncrement.translate;
      point.set(
        Math.round(point.x / snap) * snap,
        Math.round(point.y / snap) * snap,
        Math.round(point.z / snap) * snap
      );
    }
    
    return point;
  };

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (!isMeasureModeActive) return;
      // Prevent object selection while measuring
      e.stopPropagation();
      const point = getPointInScene(e);
      if (point) {
        startOrEndMeasurement(point.toArray());
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isMeasureModeActive || !currentMeasurement.start) return;
      const point = getPointInScene(e);
      updateCurrentMeasurementEnd(point ? point.toArray() : null);
    };

    gl.domElement.addEventListener('pointerdown', handlePointerDown, true);
    gl.domElement.addEventListener('pointermove', handlePointerMove);

    return () => {
      gl.domElement.removeEventListener('pointerdown', handlePointerDown, true);
      gl.domElement.removeEventListener('pointermove', handlePointerMove);
    };
  }, [isMeasureModeActive, currentMeasurement.start, gl.domElement, getPointInScene, startOrEndMeasurement, updateCurrentMeasurementEnd]);

  return (
    <>
      {measurements.map((m) => <MeasurementLine key={m.id} measurement={m} />)}
      {isMeasureModeActive && currentMeasurement.start && currentMeasurement.end && (
        <MeasurementLine measurement={currentMeasurement as Measurement} isTemporary />
      )}
    </>
  );
};

export default MeasurementLayer;