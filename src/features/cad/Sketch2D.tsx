import React, { useMemo, useState } from "react";
export type Pt = [number, number];

export default function Sketch2D({ scale=60, onChange }: { scale?: number; onChange?: (p:{outer:Pt[]; holes?:Pt[][]})=>void }) {
  const [outer, setOuter] = useState<Pt[]>([]);
  const [holes, setHoles] = useState<Pt[][]>([]);
  const [active, setActive] = useState<number | null>(null);

  const snap = (x:number, y:number):Pt => {
    const g=0.1; return [Math.round(x/g)*g, Math.round(y/g)*g];
  };
  const add = (x:number,y:number) => {
    const p = snap(x,y);
    if (active!==null) {
      const hh = [...holes]; hh[active] = [...(hh[active]||[]), p]; setHoles(hh); onChange?.({ outer, holes: hh });
    } else {
      const o = [...outer, p]; setOuter(o); onChange?.({ outer: o, holes });
    }
  };

  const startHole = () => { setHoles([...holes, []]); setActive(holes.length); };
  const endLoop = () => setActive(null);

  const vb = useMemo(()=>`0 0 ${5*scale} ${5*scale}`, [scale]);

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="flex items-center gap-2 p-2 text-xs">
        <button className="px-2 py-1 border rounded" onClick={startHole}>New hole</button>
        <button className="px-2 py-1 border rounded" onClick={endLoop}>End loop</button>
        <span className="opacity-60">Click to add points. Grid 0.1 m.</span>
      </div>
      <svg viewBox={vb} width="100%" height={400}
        onClick={(e)=> {
          const svg = (e.target as SVGElement).closest("svg")!;
          const r = svg.getBoundingClientRect();
          const x = (e.clientX - r.left)/scale, y = (e.clientY - r.top)/scale;
          add(x,y);
        }}>
        <defs>
          <pattern id="g" width={scale*0.5} height={scale*0.5} patternUnits="userSpaceOnUse">
            <path d={`M ${scale*0.5} 0 L 0 0 0 ${scale*0.5}`} stroke="hsl(220 10% 20%)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect x={0} y={0} width={5*scale} height={5*scale} fill="url(#g)"/>
        {/* outer polyline */}
        {outer.length>=2 && <polyline points={outer.map(([x,y])=>`${x*scale},${y*scale}`).join(" ")} fill="none" stroke="hsl(200 80% 60%)" strokeWidth={2} vectorEffect="non-scaling-stroke" />}
        {/* holes */}
        {holes.map((h,i)=> h.length>=2 && (
          <polyline key={i} points={h.map(([x,y])=>`${x*scale},${y*scale}`).join(" ")} fill="none" stroke="hsl(350 80% 60%)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        ))}
        {[...outer, ...holes.flat()].map((p,i)=> <circle key={i} cx={p[0]*scale} cy={p[1]*scale} r={3} fill="white" stroke="black"/>)}
      </svg>
    </div>
  );
}