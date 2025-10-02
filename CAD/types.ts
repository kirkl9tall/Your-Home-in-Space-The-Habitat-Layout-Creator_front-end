// types.ts
import { Vector3, Euler } from 'three';

export type PrimitiveShapeType = 'cube' | 'sphere' | 'cylinder' | 'torus' | 'cone' | 'plane' | 'pyramid' | 'capsule';
export type AdvancedShapeType = 'gear' | 'text' | 'star' | 'heart' | 'svg';
export type ShapeType = PrimitiveShapeType | AdvancedShapeType | 'model';
export type ObjectType = ShapeType | 'group';

export type GizmoMode = 'translate' | 'rotate' | 'scale';

export interface StarConfig {
  points: number;
  innerRadius: number;
  outerRadius: number;
}

export interface SceneObject {
  id: string;
  type: ObjectType;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number]; // Stored as Euler angles in radians
  scale: [number, number, number];
  color: string;
  metalness: number;
  roughness: number;
  opacity: number;
  transparent: boolean;
  emissiveColor: string;
  emissiveIntensity: number;
  wireframe: boolean;
  isVisible: boolean;
  isLocked: boolean;
  parentId?: string;
  // Model specific
  modelUrl?: string;
  fileMap?: Record<string, string>;
  // Text specific
  text?: string;
  // SVG specific
  svgData?: string;
  // All extruded shapes
  extrusionDepth?: number;
  // Star specific
  starConfig?: StarConfig;
}

export interface MaterialPreset {
  name: string;
  icon?: string;
  color: string;
  metalness: number;
  roughness: number;
  opacity: number;
  transparent: boolean;
  emissiveColor: string;
  emissiveIntensity: number;
}

export interface Measurement {
  id: string;
  start: [number, number, number];
  end: [number, number, number];
}