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
  COMMON_AREA: { area_m2: 2.10, volume_m3: 5.04, multiplyByCrew: false, notes: "Group viewing/table exemplar; scale for crew." },
  CUSTOM_CAD:  { area_m2: 4.00, volume_m3: 8.00, multiplyByCrew: false, notes: "Custom CAD-designed module with variable functionality." }
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
  ["CREW_SLEEP", "EXERCISE"],     // Sleep away from noisy areas
  ["FOOD_PREP", "HYGIENE"],       // Food prep away from hygiene for contamination
  ["MEDICAL", "TRASH_MGMT"],      // Medical away from waste management
  ["CREW_SLEEP", "MAINTENANCE"],  // Sleep away from maintenance noise
  ["FOOD_PREP", "WASTE"],         // Food away from waste systems
  ["CREW_SLEEP", "TRASH_MGMT"],   // Sleep away from waste/odors
  ["MEDICAL", "WASTE"],           // Medical away from waste systems
];

export const PREFER_ADJACENT: Array<[FunctionalType, FunctionalType]> = [
  ["FOOD_PREP", "COMMON_AREA"],   // Dining near food preparation
  ["WORKSTATION", "STOWAGE"],     // Work areas near storage
  ["AIRLOCK", "WORKSTATION"],     // EVA prep/ops nearby
  ["HYGIENE", "WASTE"],           // Plumbing/service co-location
  ["CREW_SLEEP", "CREW_SLEEP"],   // Group sleeping quarters
  ["MEDICAL", "CREW_SLEEP"],      // Medical near crew rest areas
  ["ECLSS", "MAINTENANCE"],       // Life support near maintenance
];

// Noise level categories for zoning validation
export const NOISE_LEVELS: Record<FunctionalType, 'QUIET' | 'MODERATE' | 'LOUD'> = {
  CREW_SLEEP: 'QUIET',
  MEDICAL: 'QUIET', 
  RECREATION: 'QUIET',
  FOOD_PREP: 'MODERATE',
  WORKSTATION: 'MODERATE',
  COMMON_AREA: 'MODERATE',
  HYGIENE: 'MODERATE',
  STOWAGE: 'MODERATE',
  GLOVEBOX: 'MODERATE',
  EXERCISE: 'LOUD',
  MAINTENANCE: 'LOUD',
  ECLSS: 'LOUD',
  TRASH_MGMT: 'MODERATE',
  WASTE: 'MODERATE',
  AIRLOCK: 'LOUD',
  CUSTOM_CAD: 'MODERATE'
};

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
  { type: "COMMON_AREA",label: "Common Area",     defaultSize: { w_m: 3.0, l_m: 3.0, h_m: 2.2 }, icon: "users" },
  { type: "CUSTOM_CAD", label: "Custom CAD Module", defaultSize: { w_m: 2.0, l_m: 2.0, h_m: 2.0 }, icon: "settings" }
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

/** ---- Adjacency and Zoning Validation Functions ---- */

// Calculate distance between two modules based on their positions
export function getModuleDistance(moduleA: { position: [number, number] }, moduleB: { position: [number, number] }): number {
  const [x1, y1] = moduleA.position;
  const [x2, y2] = moduleB.position;
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Check if two modules are considered adjacent (within adjacency threshold)
export function areModulesAdjacent(moduleA: { position: [number, number], size: { w_m: number, l_m: number } }, 
                                  moduleB: { position: [number, number], size: { w_m: number, l_m: number } }): boolean {
  const distance = getModuleDistance(moduleA, moduleB);
  // Consider adjacent if distance is less than the sum of their half-widths plus spacing
  const adjacencyThreshold = (moduleA.size.w_m + moduleB.size.w_m) / 2 + MIN_MODULE_SPACING_M;
  return distance <= adjacencyThreshold;
}

// Check for separation rule violations
export function checkSeparationViolations(modules: Array<{ id: string, type: FunctionalType, position: [number, number], size: { w_m: number, l_m: number } }>): Array<{ moduleA: string, moduleB: string, types: [FunctionalType, FunctionalType], reason: string }> {
  const violations = [];
  
  for (const [typeA, typeB] of MUST_SEPARATE) {
    const modulesA = modules.filter(m => m.type === typeA);
    const modulesB = modules.filter(m => m.type === typeB);
    
    for (const modA of modulesA) {
      for (const modB of modulesB) {
        if (areModulesAdjacent(modA, modB)) {
          violations.push({
            moduleA: modA.id,
            moduleB: modB.id,
            types: [typeA, typeB] as [FunctionalType, FunctionalType],
            reason: `${typeA.replace('_', ' ')} should be separated from ${typeB.replace('_', ' ')}`
          });
        }
      }
    }
  }
  
  return violations;
}

// Check for noise level conflicts
export function checkNoiseLevelConflicts(modules: Array<{ id: string, type: FunctionalType, position: [number, number], size: { w_m: number, l_m: number } }>): Array<{ moduleA: string, moduleB: string, reason: string }> {
  const conflicts = [];
  
  for (let i = 0; i < modules.length; i++) {
    for (let j = i + 1; j < modules.length; j++) {
      const moduleA = modules[i];
      const moduleB = modules[j];
      
      if (areModulesAdjacent(moduleA, moduleB)) {
        const noiseA = NOISE_LEVELS[moduleA.type];
        const noiseB = NOISE_LEVELS[moduleB.type];
        
        // Flag if quiet area is next to loud area
        if ((noiseA === 'QUIET' && noiseB === 'LOUD') || (noiseA === 'LOUD' && noiseB === 'QUIET')) {
          const quietType = noiseA === 'QUIET' ? moduleA.type : moduleB.type;
          const loudType = noiseA === 'LOUD' ? moduleA.type : moduleB.type;
          conflicts.push({
            moduleA: moduleA.id,
            moduleB: moduleB.id,
            reason: `Quiet area (${quietType.replace('_', ' ')}) should not be adjacent to loud area (${loudType.replace('_', ' ')})`
          });
        }
      }
    }
  }
  
  return conflicts;
}

// Get adjacency recommendations for better layout
export function getAdjacencyRecommendations(modules: Array<{ id: string, type: FunctionalType, position: [number, number], size: { w_m: number, l_m: number } }>): Array<{ moduleA: string, moduleB: string, types: [FunctionalType, FunctionalType], reason: string, implemented: boolean }> {
  const recommendations = [];
  
  for (const [typeA, typeB] of PREFER_ADJACENT) {
    const modulesA = modules.filter(m => m.type === typeA);
    const modulesB = modules.filter(m => m.type === typeB);
    
    for (const modA of modulesA) {
      for (const modB of modulesB) {
        const isAdjacent = areModulesAdjacent(modA, modB);
        recommendations.push({
          moduleA: modA.id,
          moduleB: modB.id,
          types: [typeA, typeB] as [FunctionalType, FunctionalType],
          reason: `${typeA.replace('_', ' ')} works well adjacent to ${typeB.replace('_', ' ')}`,
          implemented: isAdjacent
        });
      }
    }
  }
  
  return recommendations;
}

// ==================== PHASE 1 STEP 2: ENHANCED VOLUME CALCULATIONS ====================

// NASA volume requirements per crew member (m³)
export const VOLUME_REQUIREMENTS_PER_CREW = {
  SLEEP: 2.5,          // Personal crew quarters volume
  HYGIENE: 0.8,        // Personal hygiene allocation
  EXERCISE: 1.2,       // Exercise space per person
  WORKSTATION: 1.5,    // Workspace per crew member
  RECREATION: 1.0,     // Recreation space allocation
  COMMON_AREA: 2.0,    // Shared common space per person
  MEDICAL: 0.3,        // Medical space per crew member
  FOOD_PREP: 0.5       // Food preparation space per person
} as const;

// Critical utilization thresholds for mission success
export const UTILIZATION_THRESHOLDS = {
  EXCELLENT: 0.85,     // 85%+ - Excellent space efficiency
  GOOD: 0.70,          // 70-84% - Good utilization
  ACCEPTABLE: 0.50,    // 50-69% - Acceptable but could improve
  POOR: 0.30          // Below 50% - Poor utilization, needs redesign
} as const;

// Module efficiency factors (how much of module volume is actually usable)
export const MODULE_EFFICIENCY_FACTORS = {
  CREW_SLEEP: 0.90,      // High efficiency - personal space
  HYGIENE: 0.85,         // Good efficiency - compact design
  WASTE: 0.80,           // Moderate efficiency - equipment needs
  EXERCISE: 0.75,        // Lower efficiency - clearance needed
  FOOD_PREP: 0.80,       // Good efficiency - counter space
  ECLSS: 0.60,           // Lower efficiency - large equipment
  MEDICAL: 0.85,         // High efficiency - organized layout
  MAINTENANCE: 0.65,     // Lower efficiency - tool storage
  STOWAGE: 0.95,         // Excellent efficiency - storage focused
  RECREATION: 0.80,      // Good efficiency - flexible space
  WORKSTATION: 0.85,     // High efficiency - desk/computer setup
  AIRLOCK: 0.50,         // Low efficiency - safety clearances
  GLOVEBOX: 0.70,        // Moderate efficiency - equipment
  TRASH_MGMT: 0.75,      // Good efficiency - waste processing
  COMMON_AREA: 0.90,     // High efficiency - social space
  CUSTOM_CAD: 0.80       // Default efficiency for custom modules
} as const;

// Calculate total module volume
export function calculateModuleVolume(module: { size: { w_m: number, l_m: number, h_m: number } }): number {
  return module.size.w_m * module.size.l_m * module.size.h_m;
}

// Calculate usable volume accounting for efficiency
export function calculateUsableVolume(module: { type: any, size: { w_m: number, l_m: number, h_m: number } }): number {
  const totalVolume = calculateModuleVolume(module);
  const efficiency = MODULE_EFFICIENCY_FACTORS[module.type as keyof typeof MODULE_EFFICIENCY_FACTORS] || 0.80;
  return totalVolume * efficiency;
}

// Calculate volume requirements for crew size
export function calculateCrewVolumeRequirements(crewSize: number): Record<string, number> {
  return {
    SLEEP: VOLUME_REQUIREMENTS_PER_CREW.SLEEP * crewSize,
    HYGIENE: VOLUME_REQUIREMENTS_PER_CREW.HYGIENE * crewSize,
    EXERCISE: VOLUME_REQUIREMENTS_PER_CREW.EXERCISE * crewSize,
    WORKSTATION: VOLUME_REQUIREMENTS_PER_CREW.WORKSTATION * crewSize,
    RECREATION: VOLUME_REQUIREMENTS_PER_CREW.RECREATION * crewSize,
    COMMON_AREA: VOLUME_REQUIREMENTS_PER_CREW.COMMON_AREA * crewSize,
    MEDICAL: VOLUME_REQUIREMENTS_PER_CREW.MEDICAL * crewSize,
    FOOD_PREP: VOLUME_REQUIREMENTS_PER_CREW.FOOD_PREP * crewSize
  };
}

// Analyze volume utilization by functional area
export function analyzeVolumeUtilization(
  modules: Array<{ type: any, size: { w_m: number, l_m: number, h_m: number } }>, 
  crewSize: number
): {
  byType: Record<string, { provided: number, required: number, ratio: number, status: string }>,
  overall: { totalProvided: number, totalRequired: number, utilization: number, efficiency: string },
  recommendations: Array<{ type: string, issue: string, suggestion: string }>
} {
  const requirements = calculateCrewVolumeRequirements(crewSize);
  const byType: Record<string, { provided: number, required: number, ratio: number, status: string }> = {};
  const recommendations: Array<{ type: string, issue: string, suggestion: string }> = [];

  // Calculate provided volume by type
  const providedByType: Record<string, number> = {};
  modules.forEach(module => {
    const type = module.type;
    const usableVolume = calculateUsableVolume(module);
    providedByType[type] = (providedByType[type] || 0) + usableVolume;
  });

  // Analyze each functional area
  Object.entries(requirements).forEach(([type, required]) => {
    const provided = providedByType[type] || 0;
    const ratio = provided / required;
    
    let status = 'CRITICAL';
    if (ratio >= 1.2) status = 'EXCELLENT';
    else if (ratio >= 1.0) status = 'GOOD';
    else if (ratio >= 0.8) status = 'ACCEPTABLE';
    else if (ratio >= 0.6) status = 'POOR';

    byType[type] = { provided, required, ratio, status };

    // Generate recommendations
    if (ratio < 0.8) {
      recommendations.push({
        type,
        issue: `Insufficient ${type.toLowerCase().replace('_', ' ')} space`,
        suggestion: `Add ${(required - provided).toFixed(1)}m³ more ${type.toLowerCase().replace('_', ' ')} capacity`
      });
    } else if (ratio > 1.5) {
      recommendations.push({
        type,
        issue: `Over-allocated ${type.toLowerCase().replace('_', ' ')} space`,
        suggestion: `Consider reducing by ${(provided - required * 1.2).toFixed(1)}m³ to optimize efficiency`
      });
    }
  });

  // Calculate overall metrics
  const totalProvided = Object.values(providedByType).reduce((sum, vol) => sum + vol, 0);
  const totalRequired = Object.values(requirements).reduce((sum, vol) => sum + vol, 0);
  const utilization = totalProvided / totalRequired;

  let efficiency = 'CRITICAL';
  if (utilization >= UTILIZATION_THRESHOLDS.EXCELLENT) efficiency = 'EXCELLENT';
  else if (utilization >= UTILIZATION_THRESHOLDS.GOOD) efficiency = 'GOOD';
  else if (utilization >= UTILIZATION_THRESHOLDS.ACCEPTABLE) efficiency = 'ACCEPTABLE';
  else if (utilization >= UTILIZATION_THRESHOLDS.POOR) efficiency = 'POOR';

  return {
    byType,
    overall: { totalProvided, totalRequired, utilization, efficiency },
    recommendations
  };
}

// Calculate corridor and clearance requirements
export function calculateCorridorRequirements(
  modules: Array<{ position: [number, number], size: { w_m: number, l_m: number } }>
): { corridorArea: number, clearanceViolations: Array<{ moduleA: string, moduleB: string, clearance: number }> } {
  const MIN_CORRIDOR_WIDTH = 0.8; // NASA minimum corridor width in meters
  const MIN_CLEARANCE = 0.5; // Minimum clearance between modules
  
  // Simple corridor area calculation (this would be more complex in real implementation)
  const totalModuleArea = modules.reduce((sum, module) => 
    sum + (module.size.w_m * module.size.l_m), 0);
  
  // Estimate 25% additional area needed for corridors
  const corridorArea = totalModuleArea * 0.25;
  
  // Check clearance violations (simplified)
  const clearanceViolations: Array<{ moduleA: string, moduleB: string, clearance: number }> = [];
  // Implementation would check actual module positioning
  
  return { corridorArea, clearanceViolations };
}

// ==================== PHASE 1 STEP 3: MULTI-LEVEL HABITAT SUPPORT ====================

// Level configurations for different habitat types
export const LEVEL_CONFIGURATIONS = {
  SINGLE_DECK: { levels: 1, height_per_level: 3.0 },
  DUAL_DECK: { levels: 2, height_per_level: 2.4 },
  TRIPLE_DECK: { levels: 3, height_per_level: 2.2 },
  QUAD_DECK: { levels: 4, height_per_level: 2.0 },
  QUINTUPLE_DECK: { levels: 5, height_per_level: 1.8 }
} as const;

// Vertical connectivity requirements
export const VERTICAL_ACCESS_REQUIREMENTS = {
  MIN_STAIRWELL_AREA: 4.0,      // Minimum stairwell footprint m²
  MIN_LADDER_CLEARANCE: 1.2,    // Minimum ladder clearance m
  EMERGENCY_EGRESS_TIME: 120,   // Max evacuation time in seconds
  MAX_VERTICAL_TRAVEL: 12.0     // Maximum vertical distance without rest platform
} as const;

// Inter-level adjacency preferences (vertical stacking optimization)
export const VERTICAL_ADJACENCY_PREFERRED = [
  // Engineering systems should stack vertically for maintenance access
  ['ECLSS', 'MAINTENANCE'],
  ['ECLSS', 'ECLSS'],
  
  // Living areas benefit from vertical separation from noisy systems
  ['CREW_SLEEP', 'CREW_SLEEP'],
  ['CREW_SLEEP', 'HYGIENE'],
  
  // Work areas can stack effectively
  ['WORKSTATION', 'WORKSTATION'], 
  ['WORKSTATION', 'MEDICAL'],
  
  // Storage and logistics stack well
  ['STOWAGE', 'STOWAGE'],
  ['STOWAGE', 'FOOD_PREP'],
  
  // Social areas complement each other vertically
  ['COMMON_AREA', 'RECREATION'],
  ['RECREATION', 'EXERCISE']
] as const;

// Vertical separation requirements (should NOT be stacked)
export const VERTICAL_SEPARATION_REQUIRED = [
  // Heavy/vibrating equipment should not be above quiet areas
  ['EXERCISE', 'CREW_SLEEP'],
  ['EXERCISE', 'MEDICAL'],
  ['MAINTENANCE', 'CREW_SLEEP'],
  ['MAINTENANCE', 'MEDICAL'],
  
  // Life support should not be above critical areas in case of leaks
  ['WASTE', 'CREW_SLEEP'],
  ['WASTE', 'FOOD_PREP'],
  ['WASTE', 'MEDICAL'],
  
  // Noisy areas should not be above quiet zones
  ['ECLSS', 'CREW_SLEEP'],
  ['TRASH_MGMT', 'CREW_SLEEP'],
  ['TRASH_MGMT', 'MEDICAL']
] as const;

// Level-specific functional area recommendations
export const LEVEL_FUNCTION_RECOMMENDATIONS = {
  // Bottom level: Heavy systems, storage, utilities
  LEVEL_0: {
    preferred: ['ECLSS', 'MAINTENANCE', 'STOWAGE', 'WASTE', 'TRASH_MGMT'],
    discouraged: ['CREW_SLEEP', 'MEDICAL'],
    reason: 'Foundation level - heavy systems and utilities'
  },
  
  // Middle levels: Work areas, common spaces
  LEVEL_MID: {
    preferred: ['WORKSTATION', 'COMMON_AREA', 'FOOD_PREP', 'RECREATION'],
    discouraged: ['WASTE', 'TRASH_MGMT'],
    reason: 'Activity levels - work and social spaces'
  },
  
  // Top level: Quiet areas, observation, emergency systems
  LEVEL_TOP: {
    preferred: ['CREW_SLEEP', 'MEDICAL', 'HYGIENE', 'AIRLOCK'],
    discouraged: ['EXERCISE', 'MAINTENANCE', 'ECLSS'],
    reason: 'Upper level - quiet areas and emergency access'
  }
} as const;

// Calculate vertical connectivity requirements
export function calculateVerticalConnectivity(
  modules: Array<{ id: string, type: any, level: number, position: [number, number], size: { w_m: number, l_m: number, h_m: number } }>
): {
  levelsUsed: number[],
  verticalAccessNeeded: Array<{ fromLevel: number, toLevel: number, accessType: 'STAIR' | 'LADDER' | 'HATCH', area: number }>,
  verticalViolations: Array<{ moduleA: string, moduleB: string, violation: string, severity: 'HIGH' | 'MEDIUM' | 'LOW' }>,
  levelRecommendations: Array<{ level: number, recommendation: string, modules: string[] }>
} {
  const levelsUsed = [...new Set(modules.map(m => m.level))].sort((a, b) => a - b);
  const verticalAccessNeeded: Array<{ fromLevel: number, toLevel: number, accessType: 'STAIR' | 'LADDER' | 'HATCH', area: number }> = [];
  const verticalViolations: Array<{ moduleA: string, moduleB: string, violation: string, severity: 'HIGH' | 'MEDIUM' | 'LOW' }> = [];
  const levelRecommendations: Array<{ level: number, recommendation: string, modules: string[] }> = [];

  // Calculate vertical access requirements
  for (let i = 0; i < levelsUsed.length - 1; i++) {
    const currentLevel = levelsUsed[i];
    const nextLevel = levelsUsed[i + 1];
    const heightDifference = (nextLevel - currentLevel) * 2.4; // Assume 2.4m per level

    let accessType: 'STAIR' | 'LADDER' | 'HATCH' = 'LADDER';
    let area = 2.0; // Default ladder area

    if (heightDifference > 3.0) {
      accessType = 'STAIR';
      area = VERTICAL_ACCESS_REQUIREMENTS.MIN_STAIRWELL_AREA;
    }

    verticalAccessNeeded.push({
      fromLevel: currentLevel,
      toLevel: nextLevel,
      accessType,
      area
    });
  }

  // Check vertical stacking violations
  for (const moduleA of modules) {
    for (const moduleB of modules) {
      if (moduleA.id === moduleB.id) continue;
      
      // Check if modules are vertically aligned and violate separation rules
      const samePosition = 
        Math.abs(moduleA.position[0] - moduleB.position[0]) < 1.0 &&
        Math.abs(moduleA.position[1] - moduleB.position[1]) < 1.0;
        
      if (samePosition && moduleA.level !== moduleB.level) {
        // Check vertical separation requirements
        for (const [upperType, lowerType] of VERTICAL_SEPARATION_REQUIRED) {
          if (moduleA.level > moduleB.level && moduleA.type === upperType && moduleB.type === lowerType) {
            verticalViolations.push({
              moduleA: moduleA.id,
              moduleB: moduleB.id,
              violation: `${upperType} should not be above ${lowerType}`,
              severity: 'HIGH' as const
            });
          }
        }
      }
    }
  }

  // Generate level-specific recommendations
  const modulesByLevel = modules.reduce((acc, module) => {
    if (!acc[module.level]) acc[module.level] = [];
    acc[module.level].push(module);
    return acc;
  }, {} as Record<number, typeof modules>);

  Object.entries(modulesByLevel).forEach(([level, levelModules]) => {
    const levelNum = parseInt(level);
    const isBottom = levelNum === Math.min(...levelsUsed);
    const isTop = levelNum === Math.max(...levelsUsed);

    const recommendations = [];
    
    if (isBottom) {
      const nonPreferred = levelModules.filter(m => 
        !LEVEL_FUNCTION_RECOMMENDATIONS.LEVEL_0.preferred.includes(m.type as any)
      );
      if (nonPreferred.length > 0) {
        recommendations.push(`Consider moving ${nonPreferred.map(m => m.type).join(', ')} to higher levels`);
      }
    }
    
    if (isTop) {
      const nonPreferred = levelModules.filter(m => 
        LEVEL_FUNCTION_RECOMMENDATIONS.LEVEL_TOP.discouraged.includes(m.type as any)
      );
      if (nonPreferred.length > 0) {
        recommendations.push(`Consider moving ${nonPreferred.map(m => m.type).join(', ')} to lower levels`);
      }
    }

    if (recommendations.length > 0) {
      levelRecommendations.push({
        level: levelNum,
        recommendation: recommendations.join('; '),
        modules: levelModules.map(m => m.id)
      });
    }
  });

  return {
    levelsUsed,
    verticalAccessNeeded,
    verticalViolations,
    levelRecommendations
  };
}

// Analyze multi-level habitat efficiency
export function analyzeMultiLevelEfficiency(
  modules: Array<{ id: string, type: any, level: number, position: [number, number], size: { w_m: number, l_m: number, h_m: number } }>,
  habitatHeight: number
): {
  levelDistribution: Record<number, { moduleCount: number, totalArea: number, functionalTypes: string[] }>,
  verticalEfficiency: number,
  accessibilityScore: number,
  recommendations: Array<{ category: string, suggestion: string, priority: 'HIGH' | 'MEDIUM' | 'LOW' }>
} {
  const levelsUsed = [...new Set(modules.map(m => m.level))].sort((a, b) => a - b);
  const maxPossibleLevels = Math.floor(habitatHeight / 2.0); // Minimum 2m per level
  
  // Calculate level distribution
  const levelDistribution = modules.reduce((acc, module) => {
    const level = module.level;
    if (!acc[level]) {
      acc[level] = { moduleCount: 0, totalArea: 0, functionalTypes: [] };
    }
    
    acc[level].moduleCount++;
    acc[level].totalArea += module.size.w_m * module.size.l_m;
    if (!acc[level].functionalTypes.includes(module.type)) {
      acc[level].functionalTypes.push(module.type);
    }
    
    return acc;
  }, {} as Record<number, { moduleCount: number, totalArea: number, functionalTypes: string[] }>);

  // Calculate vertical efficiency (how well vertical space is used)
  const verticalEfficiency = levelsUsed.length / maxPossibleLevels;
  
  // Calculate accessibility score (how well distributed are functions)
  const totalFunctionTypes = [...new Set(modules.map(m => m.type))].length;
  const functionsPerLevel = Object.values(levelDistribution).map(d => d.functionalTypes.length);
  const avgFunctionsPerLevel = functionsPerLevel.reduce((a, b) => a + b, 0) / functionsPerLevel.length;
  const accessibilityScore = Math.min(1.0, avgFunctionsPerLevel / (totalFunctionTypes * 0.6));

  // Generate recommendations
  const recommendations: Array<{ category: string, suggestion: string, priority: 'HIGH' | 'MEDIUM' | 'LOW' }> = [];

  if (verticalEfficiency < 0.5) {
    recommendations.push({
      category: 'Vertical Space',
      suggestion: `Consider using more vertical levels. Currently using ${levelsUsed.length}/${maxPossibleLevels} possible levels`,
      priority: 'MEDIUM'
    });
  }

  if (accessibilityScore < 0.6) {
    recommendations.push({
      category: 'Function Distribution',
      suggestion: 'Distribute functional areas more evenly across levels for better accessibility',
      priority: 'HIGH'
    });
  }

  // Check for single-level overcrowding
  Object.entries(levelDistribution).forEach(([level, data]) => {
    if (data.moduleCount > 8) {
      recommendations.push({
        category: 'Level Density',
        suggestion: `Level ${level} has ${data.moduleCount} modules. Consider distributing to other levels`,
        priority: 'HIGH'
      });
    }
  });

  return {
    levelDistribution,
    verticalEfficiency,
    accessibilityScore,
    recommendations
  };
}
