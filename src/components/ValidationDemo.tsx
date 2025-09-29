import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HabitatValidationService, ValidationResponse } from '@/lib/habitatValidation';
import { ValidationResults } from '@/components/ValidationResults';
import { Loader2, TestTube } from 'lucide-react';

// Sample test payload
const SAMPLE_PAYLOAD = {
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
      position: [-1.5, -13.5] as [number, number],
      size: { w_m: 2, l_m: 2, h_m: 2.2 },
      rotation_deg: 0,
      equipment: []
    },
    {
      id: "food-prep-2",
      type: "FOOD_PREP",
      level: 0,
      position: [-5, 13] as [number, number],
      size: { w_m: 3, l_m: 3, h_m: 2.2 },
      rotation_deg: 0,
      equipment: []
    },
    {
      id: "medical-4",
      type: "MEDICAL",
      level: 0,
      position: [12, 2] as [number, number],
      size: { w_m: 2.5, l_m: 2.5, h_m: 2.3 },
      rotation_deg: 0,
      equipment: []
    }
  ],
  version: "1.0.0"
};

export const ValidationDemo: React.FC = () => {
  const [validationResults, setValidationResults] = useState<ValidationResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTestValidation = async () => {
    setIsValidating(true);
    setError(null);

    try {
      const results = await HabitatValidationService.validateHabitat(SAMPLE_PAYLOAD);
      setValidationResults(results);
    } catch (err) {
      console.error('Validation failed:', err);
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            NASA Validation API Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Test the NASA Habitat Validation API with a sample Mars surface habitat design.
            </p>
            
            <Button 
              onClick={handleTestValidation}
              disabled={isValidating}
              className="w-full sm:w-auto"
            >
              <Loader2 className={`w-4 h-4 mr-2 ${isValidating ? 'animate-spin' : 'hidden'}`} />
              <TestTube className={`w-4 h-4 mr-2 ${isValidating ? 'hidden' : ''}`} />
              {isValidating ? 'Validating...' : 'Test NASA Validation'}
            </Button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                View Sample Payload
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                {JSON.stringify(SAMPLE_PAYLOAD, null, 2)}
              </pre>
            </details>
          </div>
        </CardContent>
      </Card>

      {validationResults && <ValidationResults results={validationResults} />}
    </div>
  );
};