// NASA Habitat Validation API Service
export interface ValidationRule {
  rule: string;
  valid: boolean;
  explanation: string;
}

export interface ValidationResponse {
  results: ValidationRule[];
  suggestions: string[];
}

export interface HabitatValidationPayload {
  scenario: {
    crew_size: number;
    mission_duration_days: number;
    destination: string;
    fairing: {
      name: string;
      inner_diameter_m: number;
      inner_height_m: number;
      shape: string;
    };
  };
  habitat: {
    shape: string;
    levels: number;
    dimensions: {
      diameter_m: number;
      height_m: number;
    };
    pressurized_volume_m3: number;
    net_habitable_volume_m3: number;
  };
  modules: Array<{
    id: string;
    type: string;
    level: number;
    position: [number, number];
    size: {
      w_m: number;
      l_m: number;
      h_m: number;
    };
    rotation_deg: number;
    equipment: string[];
  }>;
  version: string;
}

// Use proxy in development, direct API in production
const API_BASE_URL = import.meta.env.DEV 
  ? '/api/nasa'  // Use Vite proxy in development
  : 'https://amine759--nasa-habitat-validator-api.modal.run'; // Direct API in production

// API Key configuration - Complete NASA Habitat Validator API key
const API_KEY = import.meta.env.VITE_NASA_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.';

export class HabitatValidationService {
  private static async makeRequest<T>(
    endpoint: string,
    payload: any
  ): Promise<T> {
    // Add timeout controller to match curl --max-time 10
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds

    try {
      console.log(`🌐 Making NASA API request to: ${API_BASE_URL}${endpoint}`);
      console.log('🔑 Using API Key:', API_KEY ? `${API_KEY.substring(0, 20)}...` : 'MISSING');
      console.log('📤 Request payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      console.log(`📥 Response status: ${response.status} ${response.statusText}`);
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `NASA Validation API error: ${response.status} ${response.statusText}`;
        
        try {
          const errorText = await response.text();
          console.error('❌ API Error Response:', errorText);
          
          const errorData = JSON.parse(errorText);
          if (errorData.detail) {
            errorMessage = `NASA API: ${errorData.detail}`;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          // If we can't parse error JSON, use the default message
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ NASA API Success:', result);
      console.log('🔍 NASA API result type:', typeof result);
      console.log('🔍 NASA API result keys:', result ? Object.keys(result) : 'null');
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('NASA Validation API request timed out (10 seconds)');
      }
      throw error;
    }
  }

  /**
   * Validate a complete habitat layout
   */
  static async validateHabitat(payload: HabitatValidationPayload): Promise<ValidationResponse> {
    return this.makeRequest<ValidationResponse>('/agent', payload);
  }

  /**
   * Convert your app's module format to the validation API format
   */
  static convertToValidationPayload(
    modules: any[],
    scenario: any,
    habitat: any
  ): HabitatValidationPayload {
    return {
      scenario: {
        crew_size: scenario.crew_size || 4,
        mission_duration_days: scenario.mission_duration_days || 180,
        destination: scenario.destination || 'MARS_SURFACE',
        fairing: scenario.fairing || {
          name: 'Falcon 9',
          inner_diameter_m: 5.2,
          inner_height_m: 13.1,
          shape: 'CONE'
        }
      },
      habitat: {
        shape: habitat.shape || 'CYLINDER',
        levels: habitat.levels || 1,
        dimensions: {
          diameter_m: habitat.dimensions?.diameter_m || 6.5,
          height_m: habitat.dimensions?.height_m || 12
        },
        pressurized_volume_m3: habitat.pressurized_volume_m3 || 400,
        net_habitable_volume_m3: habitat.net_habitable_volume_m3 || 300
      },
      modules: modules.map(module => ({
        id: module.id,
        type: module.type,
        level: module.level || 0,
        position: [module.position[0] || 0, module.position[1] || 0],
        size: {
          w_m: module.size?.w_m || 2,
          l_m: module.size?.l_m || 2,
          h_m: module.size?.h_m || 2.2
        },
        rotation_deg: module.rotation_deg || 0,
        equipment: module.equipment || []
      })),
      version: '1.0.0'
    };
  }

  /**
   * Get validation status counts
   */
  static getValidationSummary(results: ValidationRule[]) {
    console.log('🧮 getValidationSummary called with:', results);
    
    if (!results || !Array.isArray(results)) {
      console.warn('getValidationSummary: Invalid results provided', results);
      return {
        total: 0,
        valid: 0,
        invalid: 0,
        validationScore: 0
      };
    }
    
    const total = results.length;
    const valid = results.filter(r => r.valid).length;
    const invalid = total - valid;
    
    console.log('📊 Summary calculated:', { total, valid, invalid });
    
    return {
      total,
      valid,
      invalid,
      validationScore: total > 0 ? Math.round((valid / total) * 100) : 0
    };
  }

  /**
   * Categorize validation rules by type
   */
  static categorizeResults(results: ValidationRule[]) {
    console.log('🏷️ categorizeResults called with:', results);
    
    if (!results || !Array.isArray(results)) {
      console.warn('categorizeResults: Invalid results provided', results);
      return {
        global_rules: [],
        habitat_rules: [],
        destination_rules: [],
        functional_rules: []
      };
    }
    
    const categories = {
      global_rules: results.filter(r => r.rule.startsWith('global_rules')),
      habitat_rules: results.filter(r => r.rule.startsWith('habitat_rules')),
      destination_rules: results.filter(r => r.rule.startsWith('destination_rules')),
      functional_rules: results.filter(r => r.rule.startsWith('functional_rules'))
    };

    console.log('🏷️ Categories:', categories);
    return categories;
  }
}