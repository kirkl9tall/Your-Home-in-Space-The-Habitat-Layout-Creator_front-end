import React, { useState } from "react";
import Sketch2D, { Pt } from "./Sketch2D";
import { runJob } from "../../cad/api";
import type { SketchProfile } from "../../cad/util/types";

export default function CADStudio({ onSaveModule }: { onSaveModule: (mod:any)=>void }) {
  const [profile, setProfile] = useState<SketchProfile>({ outer: [] });
  const [height, setHeight] = useState(2.2);
  const [hue, setHue] = useState(220);
  const [label, setLabel] = useState("CAD Shape");
  const [preview, setPreview] = useState<any | null>(null);
  const canSave = (profile.outer?.length ?? 0) >= 3;

  const makePreview = async () => {
    if (!canSave) return;
    const mesh = await runJob({ type: "PAD_PREVIEW", profile, height, tess: { chord: 0.02, angle: 30 } });
    setPreview(mesh);
    runJob({ type: "TESSELLATE_REFINE", shape: mesh, tess: { chord: 0.003, angle: 15 } })
      .then(setPreview).catch(()=>{});
  };

  const save = () => {
    if (!canSave) return;
    const xs = profile.outer.map(p=>p[0]), ys = profile.outer.map(p=>p[1]);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    const maxX = Math.max(...xs), maxY = Math.max(...ys);
    const w = maxX - minX, l = maxY - minY;

    const toLocal = ([x,y]:Pt):Pt => [x - minX, y - minY];
    const polyLocal = profile.outer.map(toLocal) as Pt[];
    const holesLocal = (profile.holes||[]).map(h => h.map(toLocal) as Pt[]) as Pt[][];

    onSaveModule({
      id: `cad-${crypto.randomUUID()}`,
      type: "WORKSTATION",
      level: 0,
      position: [minX, minY],
      size: { w_m: w, l_m: l, h_m: height },
      rotation_deg: 0,
      metadata: {
        visual: {
          shape2D: "POLYGON",
          polygon: polyLocal,
          holes: holesLocal,
          extrude_h_m: height,
          hue, label
        }
      }
    });
  };

  return (
    <div className="grid grid-cols-[320px_1fr_320px] gap-2 h-full">
      <div className="border rounded-md p-3 space-y-3">
        <h3 className="font-medium">Tools</h3>
        <button className="border rounded px-3 py-2 w-full" onClick={makePreview} disabled={!canSave}>Preview Extrude</button>
        <div className="text-xs opacity-60">Draw an outer loop (and holes). Grid 0.1 m.</div>
      </div>

      <div className="border rounded-md">
        <Sketch2D onChange={setProfile as any} />
      </div>

      <div className="border rounded-md p-3 space-y-3">
        <h3 className="font-medium">Inspector</h3>
        <label className="text-sm">Height (m)</label>
        <input type="number" step={0.1} value={height} onChange={(e)=>setHeight(parseFloat(e.target.value)||0)} className="w-full border rounded px-2 py-1"/>
        <label className="text-sm">Hue</label>
        <input type="range" min={0} max={360} value={hue} onChange={(e)=>setHue(parseFloat(e.target.value)||0)} className="w-full"/>
        <label className="text-sm">Label</label>
        <input value={label} onChange={(e)=>setLabel(e.target.value)} className="w-full border rounded px-2 py-1"/>
        <button className="border rounded px-3 py-2 w-full" onClick={save} disabled={!canSave}>Save to Layout</button>
        <div className="text-xs opacity-60">Worker preview → refine. Saves to metadata.visual.</div>
        {/* You can embed a tiny 3D preview later */}
      </div>
    </div>
  );
}