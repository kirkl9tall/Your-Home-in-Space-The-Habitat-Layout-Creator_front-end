import * as THREE from "three";
import React from "react";
import { createModuleMesh } from "./ModuleFactory";

export default function GhostModule({ type, position }: { type: string | null; position: THREE.Vector3 | null; }) {
  const ref = React.useRef<THREE.Mesh>(null!);

  React.useEffect(() => {
    if (!type || !position) return;
    const mesh = createModuleMesh(type);
    mesh.material = (mesh.material as any).clone();
    (mesh.material as any).transparent = true;
    (mesh.material as any).opacity = 0.5;
    ref.current = mesh;
  }, [type, position]);

  if (!type || !position) return null;
  return (
    <primitive object={ref.current} position={position} />
  );
}