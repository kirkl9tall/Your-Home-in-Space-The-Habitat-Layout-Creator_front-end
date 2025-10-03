// NASA Equipment Library for Habitat Builder
// File: src/utils/nasaEquipmentLibrary.ts

export const NASA_EQUIPMENT_SPECS = {
  // Real ISS Equipment Dimensions
  SPACESUITS: {
    EMU: { 
      dimensions: { w: 0.68, h: 1.83, d: 0.40 }, 
      mass_kg: 127,
      description: "Extravehicular Mobility Unit - ISS spacewalk suit"
    },
    xEMU: { 
      dimensions: { w: 0.65, h: 1.75, d: 0.35 }, 
      mass_kg: 120,
      description: "Next-gen Artemis spacesuit for lunar EVA"
    }
  },
  
  EXERCISE_EQUIPMENT: {
    ARED: {
      dimensions: { w: 1.83, h: 2.13, d: 1.22 },
      mass_kg: 667,
      description: "Advanced Resistive Exercise Device - ISS primary gym equipment"
    },
    TREADMILL: {
      dimensions: { w: 1.57, h: 1.9, d: 0.84 },
      mass_kg: 145,
      description: "Combined Operational Load Bearing External Resistance (COLBER)"
    }
  },
  
  MEDICAL_EQUIPMENT: {
    MEDICAL_KIT: {
      dimensions: { w: 0.41, h: 0.28, d: 0.20 },
      mass_kg: 8.2,
      description: "Crew Medical Restraint System medical kit"
    },
    AED: {
      dimensions: { w: 0.30, h: 0.25, d: 0.15 },
      mass_kg: 2.3,
      description: "Automated External Defibrillator for cardiac emergencies"
    }
  },
  
  STOWAGE: {
    CTB: {
      dimensions: { w: 0.483, h: 0.330, d: 0.330 },
      mass_kg: 27.2,
      description: "Cargo Transfer Bag - standard ISS storage container"
    },
    COLPA: {
      dimensions: { w: 0.40, h: 0.60, d: 0.40 },
      mass_kg: 15.0,
      description: "Crew Logistics Storage bag for personal items"
    }
  },
  
  LIFE_SUPPORT: {
    ECLSS_RACK: {
      dimensions: { w: 0.483, h: 1.397, d: 0.864 },
      mass_kg: 297,
      description: "Environmental Control and Life Support System rack"
    },
    WATER_PROCESSOR: {
      dimensions: { w: 0.48, h: 0.61, d: 0.71 },
      mass_kg: 165,
      description: "Water Recovery System for water recycling"
    }
  },
  
  SCIENCE: {
    GLOVEBOX: {
      dimensions: { w: 1.27, h: 1.04, d: 0.89 },
      mass_kg: 230,
      description: "Microgravity Science Glovebox for experiments"
    },
    PLANT_HABITAT: {
      dimensions: { w: 0.60, h: 0.40, d: 0.40 },
      mass_kg: 25,
      description: "Vegetable Production System (Veggie) for growing plants"
    }
  }
};

// Calculate equipment requirements based on crew size and mission duration
export function calculateEquipmentNeeds(crewSize: number, missionDays: number) {
  return {
    spacesuits: Math.max(2, crewSize), // At least 2 suits, ideally 1 per crew + 1 spare
    medicalKits: Math.ceil(crewSize / 4), // 1 kit per 4 crew members
    ctbStorage: Math.ceil(crewSize * missionDays / 30), // ~1 CTB per crew per month
    exerciseEquipment: crewSize > 4 ? 2 : 1, // 2 devices for large crews
    waterProcessor: Math.ceil(crewSize / 6), // 1 processor per 6 crew
    plantHabitats: Math.floor(crewSize / 2) // Fresh food production capability
  };
}