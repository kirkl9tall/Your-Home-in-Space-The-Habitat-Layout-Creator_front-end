import { ModuleSchema } from "../../lib/schemas";
import { getVisualForModule, zoneFill, zoneBorder, VisualSpec } from "../../lib/visuals";

type Props = {
  mod: any;               // Module (untrusted)
  scale: number;          // px per meter
  selected?: boolean;
  showLabel?: boolean;
};

export default function ModuleShape2D({ mod, scale, selected, showLabel = true }: Props) {
  const parsed = ModuleSchema.safeParse(mod);
  if (!parsed.success) return null;
  const m = parsed.data;

  const vis: VisualSpec = getVisualForModule(m);
  const [x, y] = m.position;
  const { w_m, l_m } = m.size;

  const px = (v: number) => v * scale;
  const cx = px(x);
  const cy = px(y);
  const w  = px(w_m);
  const h  = px(l_m);

  const hue = vis.hue ?? 200;
  const fill = zoneFill(hue);
  const border = zoneBorder(hue);
  const corner = Math.min(vis.corner ?? 10, Math.min(w, h) / 4);
  const stroke = vis.stroke ?? 1.5;

  const strokeProps = { stroke: border, strokeWidth: stroke, vectorEffect: "non-scaling-stroke" as const };

  // Label font size proportional to footprint
  const label = vis.label ?? m.type;
  const fontSize = Math.max(10, Math.min(w, h) * 0.18);

  const groupTransform = `translate(${cx}, ${cy}) rotate(${m.rotation_deg || 0})`;

  return (
    <g transform={groupTransform}>
      {renderShape(m, vis, { w, h, corner, fill, strokeProps, scale })}
      {selected && (
        <rect x={0} y={0} width={w} height={h} rx={corner} ry={corner}
              fill="none" stroke="white" strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke" />
      )}
      {showLabel && (
        <text x={w/2} y={h/2} textAnchor="middle" dominantBaseline="central"
              fontSize={fontSize} fill="white" style={{ mixBlendMode: "screen" }}>
          {label}
        </text>
      )}
    </g>
  );
}

function renderShape(
  _m: any,
  vis: VisualSpec,
  opts: {
    w: number; h: number; corner: number; fill: string;
    strokeProps: { stroke: string; strokeWidth: number; vectorEffect: "non-scaling-stroke" };
    scale: number;
  }
) {
  const { w, h, corner, fill, strokeProps } = opts;

  // If CAD polygon provided, render it
  if (vis.shape2D === "POLYGON" && Array.isArray(vis.polygon) && vis.polygon.length >= 3) {
    const pts = vis.polygon.map(([mx, my]) => `${mx * opts.scale},${my * opts.scale}`).join(" ");
    return (
      <g>
        <polygon points={pts} fill={fill} {...strokeProps} />
      </g>
    );
  }

  switch (vis.shape2D) {
    case "ROUND_RECT":
      return <rect x={0} y={0} width={w} height={h} rx={corner} ry={corner} fill={fill} {...strokeProps} />;

    case "CAPSULE": {
      const r = Math.min(w, h) / 2;
      const long = Math.max(w, h), short = Math.min(w, h);
      const isWide = w >= h;
      const dWide =
        `M ${r} 0 H ${long - r} A ${r} ${r} 0 0 1 ${long - r} ${short} H ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
      const dTall =
        `M 0 ${r} V ${long - r} A ${r} ${r} 0 0 1 ${short} ${long - r} V ${r} A ${r} ${r} 0 0 1 0 ${r} Z`;
      return <path d={isWide ? dWide : dTall} fill={fill} {...strokeProps} />;
    }

    case "CYLINDER":
    case "CIRCLE": {
      const r = Math.min(w, h) / 2;
      return <circle cx={r} cy={r} r={r} fill={fill} {...strokeProps} />;
    }

    case "RING_SLICE": {
      const r = Math.min(w, h) / 2 - 4;
      return (
        <>
          <circle cx={w/2} cy={h/2} r={r} fill="none" {...strokeProps} />
          <circle cx={w/2} cy={h/2} r={r/2} fill="none" {...strokeProps} />
        </>
      );
    }

    default:
      return <rect x={0} y={0} width={w} height={h} rx={corner} ry={corner} fill={fill} {...strokeProps} />;
  }
}