// NASA Space Habitat Layout Schema Definitions
import { z } from "zod";

// Enum for functional area types based on NASA space habitat requirements
export const FunctionalTypeSchema = z.enum([
  "CREW_SLEEP",
  "HYGIENE", 
  "WASTE",
  "EXERCISE",
  "FOOD_PREP",
  "ECLSS",
  "MEDICAL",
  "MAINTENANCE",
  "STOWAGE",
  "RECREATION",
  "WORKSTATION",
  "AIRLOCK",
  "GLOVEBOX",
  "TRASH_MGMT",
  "COMMON_AREA",
  "CUSTOM_CAD"
]);

export type FunctionalType = z.infer<typeof FunctionalTypeSchema>;

// Mission destination schema
export const DestinationSchema = z.enum([
  "LEO",
  "LUNAR", 
  "MARS_TRANSIT",
  "MARS_SURFACE",
  "DEEP_SPACE"
]);

export type Destination = z.infer<typeof DestinationSchema>;

// Launch vehicle fairing schema
export const FairingSchema = z.object({
  name: z.string(),
  inner_diameter_m: z.number().positive(),
  inner_height_m: z.number().positive(), 
  shape: z.enum(["CYLINDER", "CONE", "COMPOSITE"])
});

export type Fairing = z.infer<typeof FairingSchema>;

// Mission scenario schema
export const ScenarioSchema = z.object({
  crew_size: z.number().int().min(1).max(12),
  mission_duration_days: z.number().int().positive(),
  destination: DestinationSchema,
  fairing: FairingSchema
});

export type Scenario = z.infer<typeof ScenarioSchema>;

// Habitat configuration schema
export const HabitatSchema = z.object({
  shape: z.enum(["CYLINDER", "SPHERE", "COMPOSITE"]),
  levels: z.number().int().min(1).max(5),
  dimensions: z.object({
    diameter_m: z.number().positive().optional(),
    width_m: z.number().positive().optional(),
    length_m: z.number().positive().optional(),
    height_m: z.number().positive()
  }),
  pressurized_volume_m3: z.number().positive(),
  net_habitable_volume_m3: z.number().positive()
});

export type Habitat = z.infer<typeof HabitatSchema>;

// Module size schema
export const SizeSchema = z.object({
  w_m: z.number().positive(),
  l_m: z.number().positive(), 
  h_m: z.number().positive()
});

export type Size = z.infer<typeof SizeSchema>;

// Individual habitat module schema
export const ModuleSchema = z.object({
  id: z.string(),
  type: FunctionalTypeSchema,
  level: z.number().int().min(0),
  position: z.tuple([z.number(), z.number()]), // [x, y] grid coordinates
  size: SizeSchema,
  rotation_deg: z.number().min(0).max(360).default(0),
  crew_capacity: z.number().int().min(0).optional(),
  equipment: z.array(z.string()).default([])
});

export type Module = z.infer<typeof ModuleSchema>;

// Complete layout schema for NASA habitat design
export const LayoutSchema = z.object({
  scenario: ScenarioSchema,
  habitat: HabitatSchema,
  modules: z.array(ModuleSchema),
  version: z.string().default("1.0.0")
});

export type Layout = z.infer<typeof LayoutSchema>;

// API Response schemas for validation and suggestions
export const ValidationIssueSchema = z.object({
  id: z.string(),
  severity: z.enum(["error", "warning", "info"]),
  message: z.string(),
  module_id: z.string().optional(),
  position: z.tuple([z.number(), z.number()]).optional()
});

export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;

export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  issues: z.array(ValidationIssueSchema),
  suggestions: z.array(z.object({
    id: z.string(),
    message: z.string(),
    action: z.string().optional()
  }))
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

export const SuggestionSchema = z.object({
  suggested_modules: z.array(ModuleSchema),
  rationale: z.string(),
  improvements: z.array(z.string())
});

export type Suggestion = z.infer<typeof SuggestionSchema>;
