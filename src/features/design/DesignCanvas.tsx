import { useMemo } from 'react';
import ModuleShape2D from './ModuleShape2D';
import { Layout } from '../../lib/schemas';

const SCALE = 40; // px per meter (tune or make it a prop/state)

interface DesignCanvasProps {
  layout: Layout;
  selectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

export default function DesignCanvas({
  layout,
  selectedId,
  onSelect,
  className
}: DesignCanvasProps) {
  // Optional: compute the SVG viewbox based on habitat dims
  const viewBox = useMemo(() => {
    const dims = layout.habitat.dimensions as any;
    const w = (dims.width_m ?? dims.diameter_m ?? 10) * SCALE;
    const h = (dims.length_m ?? dims.height_m ?? 10) * SCALE;
    return `0 0 ${w} ${h}`;
  }, [layout]);

  return (
    <div className={`relative w-full h-full bg-bg-0 ${className || ''}`}>
      <svg 
        viewBox={viewBox} 
        width="100%" 
        height="100%" 
        className="absolute inset-0 w-full h-full"
        style={{ display: "block", background: "transparent" }}
      >
        <defs>
          <pattern id="grid" width={SCALE} height={SCALE} patternUnits="userSpaceOnUse">
            <path 
              d={`M ${SCALE} 0 L 0 0 0 ${SCALE}`} 
              fill="none" 
              stroke="hsl(var(--grid))" 
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* Grid background */}
        <rect x={0} y={0} width="100%" height="100%" fill="url(#grid)" opacity="0.3" />

        {/* Modules */}
        {layout.modules.map(m => (
          <g 
            key={m.id} 
            onClick={() => onSelect?.(m.id)} 
            style={{ cursor: "pointer" }}
            className="hover:opacity-80 transition-opacity"
          >
            <ModuleShape2D 
              mod={m} 
              scale={SCALE} 
              selected={m.id === selectedId} 
            />
          </g>
        ))}
      </svg>
      
      {/* Overlay controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <div className="px-3 py-1 bg-bg-1/80 backdrop-blur border border-line rounded text-xs text-txt-muted">
          Scale: 1m = {SCALE}px
        </div>
      </div>
    </div>
  );
}