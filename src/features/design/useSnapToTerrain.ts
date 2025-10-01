import { sampleTerrain } from "../../terrain/heightSampler";

/** Convert a module's (x,z) ground position into y snapped to terrain */
export function snapYForModule(x: number, z: number, baseOffset = 0) {
  return sampleTerrain(x, z) + baseOffset; // add pad thickness if you have one
}