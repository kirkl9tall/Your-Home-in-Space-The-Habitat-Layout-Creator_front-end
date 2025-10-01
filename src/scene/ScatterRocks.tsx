import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export default function ScatterRocks({ count = 400, area = 1800 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const rnd = (a:number,b:number)=> a + Math.random()*(b-a);

  useEffect(() => {
    for (let i=0;i<count;i++){
      const x = rnd(-area/2, area/2);
      const z = rnd(-area/2, area/2);
      const s = rnd(0.3, 1.5);
      dummy.position.set(x, 0.0, z);
      dummy.scale.set(s, s*0.6, s);
      dummy.rotation.set(0, rnd(0, Math.PI*2), 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, area, dummy]);

  return (
    <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, count]} castShadow receiveShadow>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#5b3a2a" roughness={0.95} metalness={0.0} />
    </instancedMesh>
  );
}