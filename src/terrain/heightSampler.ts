// Simple global sampler so other components can ask: "what's the terrain height at (x,z)?"
let _sampler: ((x: number, z: number) => number) | null = null;
let _sizeM = 1000;
let _heightScale = 100;

export function setTerrainSampler(
  sampler: (x: number, z: number) => number,
  sizeM: number,
  heightScale: number
) {
  _sampler = sampler;
  _sizeM = sizeM;
  _heightScale = heightScale;
}

export function sampleTerrain(x: number, z: number): number {
  return _sampler ? _sampler(x, z) : 0;
}

export function getTerrainInfo() {
  return { sizeM: _sizeM, heightScale: _heightScale };
}
