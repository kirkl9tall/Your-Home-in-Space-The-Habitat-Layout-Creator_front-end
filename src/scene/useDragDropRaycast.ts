import * as THREE from "three";
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { sampleTerrain } from "../terrain/heightSampler";
import { createModuleMesh } from "./ModuleFactory";

export type DropCallbacks = {
  onGhost?: (type: string | null, pos: THREE.Vector3 | null) => void;
  onPlace?: (payload: {
    id: string;
    type: string;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
  }) => void;
};

export function useDragDropRaycast({ onGhost, onPlace }: DropCallbacks) {
  const { camera, scene, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);
  const getTerrain = () => scene.getObjectByName("marsTerrain");

  useEffect(() => {
    const canvas = gl.domElement;

    const over = (e: DragEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const terrain = getTerrain();
      if (!terrain) return;

      raycaster.setFromCamera(mouse, camera);
      const hit = raycaster.intersectObject(terrain, false)[0];
      if (!hit) { canvas.style.cursor = "no-drop"; onGhost?.(null, null); return; }

      canvas.style.cursor = "copy";
      const type = e.dataTransfer?.getData("moduleType") || e.dataTransfer?.getData("text/plain") || "";
      const pos = hit.point.clone();
      pos.y = sampleTerrain(pos.x, pos.z);
      onGhost?.(type || null, pos);
    };

    const leave = () => { canvas.style.cursor = "default"; onGhost?.(null, null); };

    const drop = (e: DragEvent) => {
      e.preventDefault();
      canvas.style.cursor = "default";
      const terrain = getTerrain();
      if (!terrain) return;

      const type = e.dataTransfer?.getData("moduleType") || e.dataTransfer?.getData("text/plain");
      if (!type) return;

      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hit = raycaster.intersectObject(terrain, false)[0];
      if (!hit) return;

      const mesh = createModuleMesh(type);
      mesh.position.copy(hit.point);
      const bbox = new THREE.Box3().setFromObject(mesh);
      const size = new THREE.Vector3(); bbox.getSize(size);
      mesh.position.y = sampleTerrain(mesh.position.x, mesh.position.z) + size.y * 0.5 + 0.02;
      mesh.name = `module:${type}`;
      scene.add(mesh);

      onPlace?.({
        id: Math.random().toString(36).slice(2, 10),
        type,
        position: mesh.position.clone(),
        rotation: mesh.rotation.clone(),
        scale: mesh.scale.clone(),
      });
    };

    canvas.addEventListener("dragover", over);
    canvas.addEventListener("dragleave", leave);
    canvas.addEventListener("drop", drop);
    return () => {
      canvas.removeEventListener("dragover", over);
      canvas.removeEventListener("dragleave", leave);
      canvas.removeEventListener("drop", drop);
    };
  }, [camera, scene, gl, onGhost, onPlace, raycaster, mouse]);
}