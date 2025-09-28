export type Pt = [number, number];
export type SketchProfile = { outer: Pt[]; holes?: Pt[][] };

export type KernelCmd =
  | { type: "SANITIZE_PROFILE"; profile: SketchProfile }
  | { type: "PAD_PREVIEW"; profile: SketchProfile; height: number; tess?: { chord?: number; angle?: number } }
  | { type: "BOOLEAN_PREVIEW"; op: "UNION" | "SUBTRACT" | "INTERSECT"; a: any; b: any; tess?: { chord?: number; angle?: number } }
  | { type: "TESSELLATE_REFINE"; shape: any; tess: { chord: number; angle: number } };

export type KernelOk = { ok: true; id: string; result: any };
export type KernelErr = { ok: false; id: string; error: string };
export type MeshResult = { positions: Float32Array; indices: Uint32Array; normals: Float32Array };