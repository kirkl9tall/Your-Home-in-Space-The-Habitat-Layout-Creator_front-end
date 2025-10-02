import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../store/useStore';
import { CameraControls as CameraControlsImpl } from 'three-stdlib';

const CameraManager = () => {
  const { cameraProjection } = useStore();
  const { set, camera, size, controls } = useThree();

  // Update camera on projection mode change
  useEffect(() => {
    const isSwitchingToOrtho = cameraProjection === 'orthographic' && !(camera instanceof THREE.OrthographicCamera);
    const isSwitchingToPersp = cameraProjection === 'perspective' && !(camera instanceof THREE.PerspectiveCamera);

    if (!isSwitchingToOrtho && !isSwitchingToPersp) return;

    let newCamera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    const aspect = size.width / size.height;

    if (isSwitchingToOrtho) {
      const perspectiveCam = camera as THREE.PerspectiveCamera;
      const distance = (controls as CameraControlsImpl)?.distance ?? camera.position.length();
      const fovRad = THREE.MathUtils.degToRad(perspectiveCam.fov);
      const height = 2 * Math.tan(fovRad / 2) * distance;
      const width = height * aspect;
      newCamera = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 0.1, 1000);
    } else { // Switching to perspective
      newCamera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    }

    newCamera.position.copy(camera.position);
    newCamera.quaternion.copy(camera.quaternion);
    
    set({ camera: newCamera });

  }, [cameraProjection, camera, set, size.width, size.height, controls]);

  // Update camera on resize
  useEffect(() => {
    if (!camera) return;
    const aspect = size.width / size.height;
    if (camera instanceof THREE.PerspectiveCamera) {
      if (camera.aspect !== aspect) {
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
      }
    } else if (camera instanceof THREE.OrthographicCamera) {
      const height = camera.top - camera.bottom;
      const newWidth = height * aspect;
      if (camera.left !== newWidth / -2 || camera.right !== newWidth / 2) {
        camera.left = newWidth / -2;
        camera.right = newWidth / 2;
        camera.updateProjectionMatrix();
      }
    }
  }, [size, camera]);

  return null;
};

export default CameraManager;
