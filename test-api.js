// Quick test script to verify NASA API
import { HabitatValidationService } from './src/lib/habitatValidation.js';

const testPayload = {
  scenario: {
    crew_size: 16,
    mission_duration_days: 365,
    destination: "MARS_SURFACE",
    fairing: {
      name: "Falcon 9",
      inner_diameter_m: 5.2,
      inner_height_m: 13.1,
      shape: "CONE"
    }
  },
  habitat: {
    shape: "CYLINDER",
    levels: 2,
    dimensions: {
      diameter_m: 6.5,
      height_m: 12
    },
    pressurized_volume_m3: 400,
    net_habitable_volume_m3: 300
  },
  modules: [
    {
      id: "hygiene-1",
      type: "HYGIENE",
      level: 0,
      position: [-1.5, -13.5],
      size: { w_m: 2, l_m: 2, h_m: 2.2 },
      rotation_deg: 0,
      equipment: []
    }
  ],
  version: "1.0.0"
};

console.log('Testing NASA API...');
HabitatValidationService.validateHabitat(testPayload)
  .then(results => {
    console.log('✅ API Test Success:', results);
  })
  .catch(error => {
    console.error('❌ API Test Failed:', error);
  });