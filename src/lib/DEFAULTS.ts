// src/lib/DEFAULTS.ts
import { FunctionalType } from "./schemas";

/** ---- Fairing presets (inner envelope) ---- */
export type FairingPreset = {
  name: string;
  inner_diameter_m: number;
  inner_height_m: number;
  shape: "CYLINDRICAL" | "OGIVE";
};

export const FAIRINGS: FairingPreset[] = [
  { name: "Falcon 9", inner_diameter_m: 5.2, inner_height_m: 13.1, shape: "OGIVE" },
  { name: "Falcon Heavy (5.2m)", inner_diameter_m: 5.2, inner_height_m: 13.1, shape: "OGIVE" },
  { name: "New Glenn", inner_diameter_m: 7.0, inner_height_m: 22.0, shape: "OGIVE" },
  { name: "SLS Blk-1", inner_diameter_m: 8.4, inner_height_m: 27.0, shape: "CYLINDRICAL" },
  { name: "Starship (cargo bay)", inner_diameter_m: 8.0, inner_height_m: 18.0, shape: "CYLINDRICAL" }
];

/** ---- Functional defaults ----
 * These are UI-side *hints* (not authoritative). Backend remains source of truth.
 * area_m2: per activity footprint (often per-crew); volume_m3 likewise where useful.
 * multiplyByCrew: if true, UI should multiply target by scenario.crew_size.
 */
export type FunctionalHint = {
  area_m2?: number;
  volume_m3?: number;
  multiplyByCrew?: boolean;
  notes?: string;
};

export const FUNCTIONAL_DEFAULTS: Record<FunctionalType, FunctionalHint> = {
  CREW_SLEEP:  { area_m2: 1.82, volume_m3: 3.64, multiplyByCrew: true, notes: "Per-crew bunk/quarter exemplar." },
  HYGIENE:     { area_m2: 2.00, volume_m3: 2.40, multiplyByCrew: true, notes: "Per-crew hygiene cell estimate." },
  WASTE:       { area_m2: 0.91, volume_m3: 2.18, multiplyByCrew: false, notes: "Per modality cell; scale by concurrency." },
  EXERCISE:    { area_m2: 1.50, volume_m3: 3.60, multiplyByCrew: false, notes: "ARED-like device envelope (one-at-a-time)." },
  FOOD_PREP:   { area_m2: 3.00, volume_m3: 6.00, multiplyByCrew: false, notes: "Galley working footprint (crew dine elsewhere)." },
  ECLSS:       { area_m2: 3.00, volume_m3: 8.00, multiplyByCrew: false, notes: "Packaged pallets; duration driven." },
  MEDICAL:     { area_m2: 2.50, volume_m3: 6.00, multiplyByCrew: false, notes: "Treatment cot + workspace." },
  MAINTENANCE: { area_m2: 2.50, volume_m3: 6.00, multiplyByCrew: false, notes: "Bench + access/clearances." },
  STOWAGE:     { area_m2: 4.00, volume_m3: 10.0, multiplyByCrew: true, notes: "Rough per-crew stowage envelope (mission dependent)." },
  RECREATION:  { area_m2: 1.62, volume_m3: 3.89, multiplyByCrew: false, notes: "Personal recreation cell." },
  WORKSTATION: { area_m2: 2.20, volume_m3: 4.80, multiplyByCrew: false, notes: "Multi-purpose workstation envelope." },
  AIRLOCK:     { area_m2: 3.50, volume_m3: 9.00, multiplyByCrew: false, notes: "Two-person ingress/egress shell (surface ops vary)." },
  GLOVEBOX:    { area_m2: 1.20, volume_m3: 2.50, multiplyByCrew: false, notes: "Bench + operator stance." },
  TRASH_MGMT:  { area_m2: 1.50, volume_m3: 3.00, multiplyByCrew: false, notes: "Compactor/stow + access." },
  COMMON_AREA: { area_m2: 2.10, volume_m3: 5.04, multiplyByCrew: false, notes: "Group viewing/table exemplar; scale for crew." }
};

/** Helper: compute target area for a functional block given crew size */
export function targetAreaM2(type: FunctionalType, crewSize: number): number | undefined {
  const d = FUNCTIONAL_DEFAULTS[type];
  if (!d?.area_m2) return undefined;
  return d.multiplyByCrew ? d.area_m2 * crewSize : d.area_m2;
}

/** Helper: compute target volume for a functional block given crew size */
export function targetVolumeM3(type: FunctionalType, crewSize: number): number | undefined {
  const d = FUNCTIONAL_DEFAULTS[type];
  if (!d?.volume_m3) return undefined;
  return d.multiplyByCrew ? d.volume_m3 * crewSize : d.volume_m3;
}

/** ---- Circulation & clearances (soft UI defaults) ---- */
export const MIN_CORRIDOR_CLEAR_WIDTH_M = 0.8; // UI hint; backend may override
export const MIN_MODULE_SPACING_M = 0.3;       // visual breathing room/snap grid buffer

/** ---- Adjacency heuristics (soft constraints) ---- */
export const MUST_SEPARATE: Array<[FunctionalType, FunctionalType]> = [
  ["CREW_SLEEP", "EXERCISE"],
  ["FOOD_PREP", "HYGIENE"],
  ["MEDICAL", "TRASH_MGMT"],
  ["CREW_SLEEP", "MAINTENANCE"]
];

export const PREFER_ADJACENT: Array<[FunctionalType, FunctionalType]> = [
  ["FOOD_PREP", "COMMON_AREA"],
  ["WORKSTATION", "STOWAGE"],
  ["AIRLOCK", "WORKSTATION"],   // EVA prep/ops nearby
  ["HYGIENE", "WASTE"]          // plumbing/service co-location (with isolation)
];

/** ---- Module icon & default size presets (for quick placement) ---- */
export type ModulePreset = {
  type: FunctionalType;
  label: string;
  defaultSize: { w_m: number; l_m: number; h_m: number };
  icon?: string; // optional name for your icon set
};

export const MODULE_PRESETS: ModulePreset[] = [
  { type: "CREW_SLEEP", label: "Crew Bunk",        defaultSize: { w_m: 2.0, l_m: 2.2, h_m: 2.1 }, icon: "bed" },
  { type: "HYGIENE",    label: "Hygiene Bay",      defaultSize: { w_m: 2.0, l_m: 2.0, h_m: 2.2 }, icon: "shower" },
  { type: "WASTE",      label: "Waste Compartment",defaultSize: { w_m: 1.8, l_m: 1.8, h_m: 2.2 }, icon: "trash" },
  { type: "EXERCISE",   label: "Exercise (ARED)",  defaultSize: { w_m: 3.0, l_m: 4.0, h_m: 2.5 }, icon: "dumbbell" },
  { type: "FOOD_PREP",  label: "Galley",           defaultSize: { w_m: 3.0, l_m: 3.0, h_m: 2.2 }, icon: "utensils" },
  { type: "ECLSS",      label: "ECLSS Pallets",    defaultSize: { w_m: 3.0, l_m: 2.5, h_m: 2.3 }, icon: "fan" },
  { type: "MEDICAL",    label: "Med Bay",          defaultSize: { w_m: 2.5, l_m: 2.5, h_m: 2.3 }, icon: "first-aid" },
  { type: "MAINTENANCE",label: "Maint. Bench",     defaultSize: { w_m: 2.5, l_m: 2.5, h_m: 2.3 }, icon: "wrench" },
  { type: "STOWAGE",    label: "Stowage Rack",     defaultSize: { w_m: 2.5, l_m: 3.5, h_m: 2.3 }, icon: "boxes" },
  { type: "RECREATION", label: "Recreation",       defaultSize: { w_m: 2.0, l_m: 2.0, h_m: 2.2 }, icon: "gamepad" },
  { type: "WORKSTATION",label: "Workstation",      defaultSize: { w_m: 2.2, l_m: 2.2, h_m: 2.2 }, icon: "monitor" },
  { type: "AIRLOCK",    label: "Airlock",          defaultSize: { w_m: 2.0, l_m: 2.2, h_m: 2.3 }, icon: "door" },
  { type: "GLOVEBOX",   label: "Glovebox",         defaultSize: { w_m: 1.4, l_m: 1.8, h_m: 2.0 }, icon: "flask" },
  { type: "TRASH_MGMT", label: "Trash Mgmt",       defaultSize: { w_m: 1.5, l_m: 2.0, h_m: 2.0 }, icon: "recycle" },
  { type: "COMMON_AREA",label: "Common Area",     defaultSize: { w_m: 3.0, l_m: 3.0, h_m: 2.2 }, icon: "users" }
];

/** ---- Utility: quick color status for a module vs. target area ---- */
export type StatusColor = "green" | "amber" | "red";

export function areaStatus(actualAreaM2: number, type: FunctionalType, crewSize: number): StatusColor {
  const target = targetAreaM2(type, crewSize);
  if (!target) return "green";
  const ratio = actualAreaM2 / target;
  if (ratio >= 1.0) return "green";
  if (ratio >= 0.85) return "amber";
  return "red";
}

/** ---- Utility: estimate NHV from modules (very rough UI hint; backend = truth) ---- */
export function estimateNHVFromModules(modules: Array<{ size: { w_m: number; l_m: number; h_m: number } }>): number {
  // Sum of module bounding-box volumes as a crude proxy for occupied functional space.
  return modules.reduce((acc, m) => acc + m.size.w_m * m.size.l_m * m.size.h_m, 0);
}
