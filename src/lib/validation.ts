// src/lib/schemas.ts
import { z } from "zod";

/** === Enums === */
export const Destination = z.enum(["LEO","LUNAR","MARS_TRANSIT","MARS_SURFACE","DEEP_SPACE"]);
export const FairingShape = z.enum(["CYLINDRICAL","OGIVE"]);
export const HabitatShape = z.enum(["CYLINDER","RECT_PRISM","RING"]);
export const FunctionalType = z.enum([
  "CREW_SLEEP","HYGIENE","WASTE","EXERCISE","FOOD_PREP","ECLSS",
  "MEDICAL","MAINTENANCE","STOWAGE","RECREATION","WORKSTATION",
  "AIRLOCK","GLOVEBOX","TRASH_MGMT","COMMON_AREA"
]);

/** === Scenario === */
export const FairingSchema = z.object({
  name: z.string(),
  inner_diameter_m: z.number().positive(),
  inner_height_m: z.number().positive(),
  shape: FairingShape
});

export const ScenarioSchema = z.object({
  crew_size: z.number().int().min(1),
  mission_duration_days: z.number().int().min(1),
  destination: Destination,
  fairing: FairingSchema
});

/** === Habitat === */
export const HabitatDimensionsSchema = z.object({
  diameter_m: z.number().positive().optional(),
  height_m: z.number().positive().optional(),
  width_m: z.number().positive().optional(),
  length_m: z.number().positive().optional(),
  outer_diameter_m: z.number().positive().optional(),
  inner_diameter_m: z.number().positive().optional()
}).strict();

export const HabitatSchema = z.object({
  shape: HabitatShape,
  levels: z.number().int().min(1).max(5),
  dimensions: HabitatDimensionsSchema,
  pressurized_volume_m3: z.number().nonnegative().optional(),
  net_habitable_volume_m3: z.number().nonnegative().optional()
});

/** === Modules === */
export const ModuleSizeSchema = z.object({
  w_m: z.number().positive(),
  l_m: z.number().positive(),
  h_m: z.number().positive()
});

export const ModuleSchema = z.object({
  id: z.string(),
  type: FunctionalType,
  level: z.number().int().min(0),
  position: z.tuple([z.number(), z.number()]), // meters on level grid
  size: ModuleSizeSchema,
  rotation_deg: z.number().default(0),
  crew_capacity: z.number().int().min(0).optional(),
  equipment: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional()
}).strict();

/** === Paths (optional) === */
export const PathSchema = z.object({
  id: z.string(),
  points: z.array(z.tuple([z.number(), z.number()])).min(2),
  min_clear_width_m: z.number().min(0.6).default(0.8)
});

/** === Rules hints (optional) === */
export const RulesHintsSchema = z.object({
  min_area_per_crew_m2: z.record(z.number()).optional(),
  adjacency_soft_constraints: z.array(z.object({
    must_separate: z.array(FunctionalType).optional(),
    prefer_adjacent: z.array(FunctionalType).optional()
  })).optional(),
  corridor_clearance_m: z.number().min(0.6).optional()
});

/** === Root payload === */
export const LayoutSchema = z.object({
  scenario: ScenarioSchema,
  habitat: HabitatSchema,
  modules: z.array(ModuleSchema).min(1),
  paths: z.array(PathSchema).optional(),
  rules_hints: RulesHintsSchema.optional(),
  version: z.string().default("1.0.0")
}).strict();

/** === Types === */
export type Destination = z.infer<typeof Destination>;
export type FunctionalType = z.infer<typeof FunctionalType>;
export type Layout = z.infer<typeof LayoutSchema>;
