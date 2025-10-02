import React, { useRef, useEffect } from 'react';
import { PerspectiveCamera, OrthographicCamera } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../store/useStore';
import { CameraControls as CameraControlsImpl } from 'three-stdlib';

const SceneCamera: React.FC = () => {
    const { cameraProjection } = useStore();
    const { size, camera, controls } = useThree();
    const perspectiveRef = useRef<THREE.PerspectiveCamera>(null!);
    const orthoRef = useRef<THREE.OrthographicCamera>(null!);
    const cameraControls = controls as CameraControlsImpl | null;

    const aspect = size.width / size.height;

    useFrame(() => {
        if (!perspectiveRef.current || !orthoRef.current || !cameraControls) return;

        // Sync the non-active camera to the active one
        if (camera === perspectiveRef.current) { // Perspective is active, sync ortho to it
            orthoRef.current.position.copy(perspectiveRef.current.position);
            orthoRef.current.quaternion.copy(perspectiveRef.current.quaternion);

            const dist = cameraControls.distance;
            const fovRad = THREE.MathUtils.degToRad(perspectiveRef.current.fov);
            const height = 2 * Math.tan(fovRad / 2) * dist;
            const width = height * aspect;
            
            orthoRef.current.left = width / -2;
            orthoRef.current.right = width / 2;
            orthoRef.current.top = height / 2;
            orthoRef.current.bottom = height / -2;
            orthoRef.current.updateProjectionMatrix();

        } else if (camera === orthoRef.current) { // Ortho is active, sync perspective to it
            perspectiveRef.current.position.copy(orthoRef.current.position);
            perspectiveRef.current.quaternion.copy(orthoRef.current.quaternion);
        }
    });

    // Update aspect ratio on resize
    useEffect(() => {
        if (perspectiveRef.current) {
            perspectiveRef.current.aspect = aspect;
            perspectiveRef.current.updateProjectionMatrix();
        }
        // Ortho's aspect is handled in useFrame by recalculating frustum
    }, [aspect]);

    return (
        <>
            <PerspectiveCamera
                ref={perspectiveRef}
                makeDefault={cameraProjection === 'perspective'}
                fov={50}
                near={0.1}
                far={1000}
                position={[8, 8, 12]}
            />
            <OrthographicCamera
                ref={orthoRef}
                makeDefault={cameraProjection === 'orthographic'}
                near={0.1}
                far={1000}
                position={[8, 8, 12]}
            />
        </>
    );
};

export default SceneCamera;
