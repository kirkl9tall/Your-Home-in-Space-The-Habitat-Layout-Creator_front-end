/// <reference lib="webworker" />
import { extrudeLinear } from "@jscad/modeling/src/operations/extrusions";
import { union as csgUnion, subtract as csgSubtract, intersect as csgIntersect } from "@jscad/modeling/src/operations/booleans";
import { subtract as subtract2D } from "@jscad/modeling/src/operations/booleans";
import * as geom2 from "@jscad/modeling/src/geometries/geom2";
import * as geom3 from "@jscad/modeling/src/geometries/geom3";
import polyclip from "polygon-clipping";

type Pt = [number, number];
type SketchProfile = { outer: Pt[]; holes?: Pt[][] };

type Msg =
 | { id: string; type: "SANITIZE_PROFILE"; profile: SketchProfile }
 | { id: string; type: "PAD_PREVIEW"; profile: SketchProfile; height: number; tess?: { chord?: number; angle?: number } }
 | { id: string; type: "BOOLEAN_PREVIEW"; op: "UNION" | "SUBTRACT" | "INTERSECT"; a: any; b: any; tess?: { chord?: number; angle?: number } }
 | { id: string; type: "TESSELLATE_REFINE"; shape: any; tess: { chord: number; angle: number } };

const ok = (id:string, result:any) => postMessage({ ok:true, id, result });
const err = (id:string, error:any) => postMessage({ ok:false, id, error: String(error) });

self.onmessage = (e: MessageEvent<Msg>) => {
  const { id, type } = e.data;
  try {
    if (type === "SANITIZE_PROFILE") return ok(id, sanitize(e.data.profile));
    if (type === "PAD_PREVIEW") {
      const prof = sanitize(e.data.profile);
      const solid = pad(prof, e.data.height);
      return ok(id, toMesh(solid));
    }
    if (type === "BOOLEAN_PREVIEW") {
      const { op, a, b } = e.data;
      const out = op === "UNION" ? csgUnion(a,b) : op === "SUBTRACT" ? csgSubtract(a,b) : csgIntersect(a,b);
      return ok(id, toMesh(out));
    }
    if (type === "TESSELLATE_REFINE") return ok(id, toMesh(e.data.shape));
    throw new Error(`Unknown cmd ${type}`);
  } catch (ex) { return err(id, ex); }
};

function sanitize(p: SketchProfile): SketchProfile {
  const eps = 1e-6;
  const dedupe = (pts: Pt[]) => pts.filter((pt,i,a)=> i===0 || Math.hypot(pt[0]-a[i-1][0], pt[1]-a[i-1][1])>eps);
  const area = (pts:Pt[]) => pts.reduce((acc,[x,y],i) => { const [x2,y2]=pts[(i+1)%pts.length]; return acc+(x*y2-x2*y); }, 0)/2;
  const outer = dedupe(p.outer);
  if (outer.length < 3) throw new Error("Outer loop < 3 points");
  if (area(outer) < 0) outer.reverse();
  polyclip.union([outer]); // throws if self-intersecting
  const holes = (p.holes||[]).map(h=> {
    const hh = dedupe(h);
    if (hh.length < 3) return hh;
    return area(hh) > 0 ? hh.reverse() : hh; // holes CW
  }).filter(h=>h.length>=3);
  return { outer, holes: holes.length ? holes : undefined };
}

function pad(profile: SketchProfile, height: number) {
  let base = geom2.fromPoints(profile.outer);
  for (const h of (profile.holes || [])) base = subtract2D(base, geom2.fromPoints(h));
  return extrudeLinear({ height }, base); // geom3
}

function toMesh(solid: any) {
  const polys = geom3.toPolygons(solid);
  const positions:number[] = [], indices:number[] = [], normals:number[] = [];
  let idx = 0;
  for (const p of polys) {
    const vs = p.vertices; if (vs.length < 3) continue;
    const plane = p.plane || [0, 0, 1, 0];
    const [nx,ny,nz] = plane;
    const base = idx;
    for (const v of vs) { positions.push(v[0],v[1],v[2]); normals.push(nx,ny,nz); idx++; }
    for (let i=1;i<vs.length-1;i++) indices.push(base, base+i, base+i+1);
  }
  return { positions: new Float32Array(positions), indices: new Uint32Array(indices), normals: new Float32Array(normals) };
}