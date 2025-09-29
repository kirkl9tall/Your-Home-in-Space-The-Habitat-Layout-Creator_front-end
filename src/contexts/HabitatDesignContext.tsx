import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types for habitat design data
export interface HabitatObject {
  id: string;
  type: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  size: {
    w_m: number;
    l_m: number;
    h_m: number;
  };
  level?: number;
  equipment?: string[];
}

export interface ScenarioData {
  crew_size: number;
  mission_duration_days: number;
  destination: string;
  fairing: {
    name: string;
    inner_diameter_m: number;
    inner_height_m: number;
    shape: string;
  };
}

export interface HabitatData {
  shape: string;
  levels: number;
  dimensions: {
    diameter_m: number;
    height_m: number;
  };
  pressurized_volume_m3: number;
  net_habitable_volume_m3: number;
}

export interface HabitatDesignState {
  objects: HabitatObject[];
  scenario: ScenarioData;
  habitat: HabitatData;
  lastModified: Date;
}

interface HabitatDesignContextType {
  design: HabitatDesignState;
  updateObjects: (objects: HabitatObject[]) => void;
  updateScenario: (scenario: Partial<ScenarioData>) => void;
  updateHabitat: (habitat: Partial<HabitatData>) => void;
  getValidationPayload: () => any;
}

// Default values
const defaultScenario: ScenarioData = {
  crew_size: 4,
  mission_duration_days: 365,
  destination: 'MARS_SURFACE',
  fairing: {
    name: 'Falcon 9',
    inner_diameter_m: 5.2,
    inner_height_m: 13.1,
    shape: 'CONE'
  }
};

const defaultHabitat: HabitatData = {
  shape: 'CYLINDER',
  levels: 1,
  dimensions: {
    diameter_m: 6.5,
    height_m: 12
  },
  pressurized_volume_m3: 400,
  net_habitable_volume_m3: 300
};

const defaultDesign: HabitatDesignState = {
  objects: [],
  scenario: defaultScenario,
  habitat: defaultHabitat,
  lastModified: new Date()
};

const HabitatDesignContext = createContext<HabitatDesignContextType | undefined>(undefined);

export const HabitatDesignProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [design, setDesign] = useState<HabitatDesignState>(() => {
    // Try to load from localStorage
    try {
      const saved = localStorage.getItem('habitat-design-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultDesign,
          ...parsed,
          lastModified: new Date(parsed.lastModified)
        };
      }
    } catch (error) {
      console.warn('Failed to load saved design state:', error);
    }
    return defaultDesign;
  });

  const saveToStorage = (newDesign: HabitatDesignState) => {
    try {
      localStorage.setItem('habitat-design-state', JSON.stringify(newDesign));
    } catch (error) {
      console.warn('Failed to save design state:', error);
    }
  };

  const updateObjects = (objects: HabitatObject[]) => {
    const newDesign = {
      ...design,
      objects,
      lastModified: new Date()
    };
    setDesign(newDesign);
    saveToStorage(newDesign);
  };

  const updateScenario = (scenarioUpdate: Partial<ScenarioData>) => {
    const newDesign = {
      ...design,
      scenario: { ...design.scenario, ...scenarioUpdate },
      lastModified: new Date()
    };
    setDesign(newDesign);
    saveToStorage(newDesign);
  };

  const updateHabitat = (habitatUpdate: Partial<HabitatData>) => {
    const newDesign = {
      ...design,
      habitat: { ...design.habitat, ...habitatUpdate },
      lastModified: new Date()
    };
    setDesign(newDesign);
    saveToStorage(newDesign);
  };

  const getValidationPayload = () => {
    return {
      scenario: design.scenario,
      habitat: design.habitat,
      modules: design.objects.map(obj => ({
        id: obj.id,
        type: obj.type,
        level: obj.level || 0,
        position: [obj.position[0], obj.position[1]] as [number, number],
        size: {
          w_m: obj.size.w_m,
          l_m: obj.size.l_m,
          h_m: obj.size.h_m
        },
        rotation_deg: obj.rotation ? obj.rotation[1] * (180 / Math.PI) : 0,
        equipment: obj.equipment || []
      })),
      version: '1.0.0'
    };
  };

  return (
    <HabitatDesignContext.Provider value={{
      design,
      updateObjects,
      updateScenario,
      updateHabitat,
      getValidationPayload
    }}>
      {children}
    </HabitatDesignContext.Provider>
  );
};

export const useHabitatDesign = (): HabitatDesignContextType => {
  const context = useContext(HabitatDesignContext);
  if (!context) {
    throw new Error('useHabitatDesign must be used within a HabitatDesignProvider');
  }
  return context;
};