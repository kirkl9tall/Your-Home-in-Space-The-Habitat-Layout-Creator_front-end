import { Vector3, Euler } from 'three';

export type ShapeType = 'cube' | 'sphere' | 'cylinder' | 'torus' | 'cone' | 'plane' | 'model';
export type GizmoMode = 'translate' | 'rotate' | 'scale';

export interface SceneObject {
  id: string;
  type: ShapeType;
  position: [number, number, number];
  rotation: [number, number, number]; // Stored as Euler angles in radians
  scale: [number, number, number];
  color: string;
  modelUrl?: string;
  fileMap?: Record<string, string>;
}