import * as THREE from "three";

export type ModuleKind = "crew" | "hygiene" | "lab" | "eclss" | "default";

export function guessKind(type: string): ModuleKind {
  if (/crew|bunk|sleep|med/i.test(type)) return "crew";
  if (/hygiene|waste/i.test(type)) return "hygiene";
  if (/lab|science/i.test(type)) return "lab";
  if (/eclss|life/i.test(type)) return "eclss";
  return "default";
}

export function createModuleMesh(type: string): THREE.Mesh {
  const kind = guessKind(type);
  const colors: Record<ModuleKind, number> = {
    crew: 0xf3c623,
    hygiene: 0x2db37d,
    lab: 0x5a8dee,
    eclss: 0xc061cb,
    default: 0xd46a3a,
  };
  const mat = new THREE.MeshStandardMaterial({ color: colors[kind], roughness: 0.7, metalness: 0.0 });
  let mesh: THREE.Mesh;
  if (kind === "hygiene") mesh = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 8, 32), mat);
  else if (kind === "lab" || kind === "eclss") mesh = new THREE.Mesh(new THREE.BoxGeometry(20, 12, 14), mat);
  else mesh = new THREE.Mesh(new THREE.BoxGeometry(16, 10, 16), mat);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}