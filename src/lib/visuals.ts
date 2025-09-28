import { FunctionalType } from "./schemas";

export type Shape2DKind =
  | "ROUND_RECT"
  | "CAPSULE"
  | "CIRCLE"
  | "CYLINDER"
  | "RING_SLICE"
  | "POLYGON";

export type VisualSpec = {
  shape2D: Shape2DKind;
  corner?: number;        // px radius for ROUND_RECT
  stroke?: number;        // px stroke width
  hue?: number;           // HSL hue (0..360)
  label?: string;
  icon?: string;
  // Optional polygon (meters) if CAD provides a custom footprint
  polygon?: [number, number][];
};

export const DEFAULT_VISUALS: Record<FunctionalType, VisualSpec> = {
  CREW_SLEEP:  { shape2D: "CAPSULE",     hue: 200, label: "Sleep" },
  HYGIENE:     { shape2D: "ROUND_RECT",  hue: 190, label: "Hygiene",   corner: 10 },
  WASTE:       { shape2D: "ROUND_RECT",  hue: 0,   label: "Waste",     corner: 8  },
  EXERCISE:    { shape2D: "ROUND_RECT",  hue: 140, label: "Exercise",  corner: 12 },
  FOOD_PREP:   { shape2D: "ROUND_RECT",  hue: 45,  label: "Galley",    corner: 12 },
  ECLSS:       { shape2D: "ROUND_RECT",  hue: 260, label: "ECLSS",     corner: 6  },
  MEDICAL:     { shape2D: "ROUND_RECT",  hue: 350, label: "Medical",   corner: 8  },
  MAINTENANCE: { shape2D: "ROUND_RECT",  hue: 280, label: "Maint.",    corner: 8  },
  STOWAGE:     { shape2D: "ROUND_RECT",  hue: 30,  label: "Stowage",   corner: 6  },
  RECREATION:  { shape2D: "ROUND_RECT",  hue: 320, label: "Recreation",corner: 12 },
  WORKSTATION: { shape2D: "ROUND_RECT",  hue: 220, label: "Work",      corner: 8  },
  AIRLOCK:     { shape2D: "CYLINDER",    hue: 210, label: "Airlock" },
  GLOVEBOX:    { shape2D: "ROUND_RECT",  hue: 260, label: "Glovebox",  corner: 6  },
  TRASH_MGMT:  { shape2D: "ROUND_RECT",  hue: 15,  label: "Trash",     corner: 6  },
  COMMON_AREA: { shape2D: "ROUND_RECT",  hue: 200, label: "Common",    corner: 14 },
  CUSTOM_CAD:  { shape2D: "POLYGON",    hue: 180, label: "Custom" }
};

export function getVisualForModule(mod: { type: FunctionalType; metadata?: any }): VisualSpec {
  const base = DEFAULT_VISUALS[mod.type];
  const override = (mod?.metadata?.visual ?? {}) as Partial<VisualSpec>;
  return { ...base, ...override };
}

export function zoneFill(hue: number) {
  return `hsl(${hue} 70% 45% / 0.18)`;
}

export function zoneBorder(hue: number) {
  return `hsl(${hue} 85% 60%)`;
}