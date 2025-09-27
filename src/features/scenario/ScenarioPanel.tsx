import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Scenario, ScenarioSchema, Destination } from '@/lib/schemas';
import { FAIRINGS } from '@/lib/DEFAULTS';

interface ScenarioPanelProps {
  scenario: Scenario;
  onChange: (scenario: Scenario) => void;
}

const DESTINATIONS: Destination[] = ["LEO", "LUNAR", "MARS_TRANSIT", "MARS_SURFACE", "DEEP_SPACE"];

export function ScenarioPanel({ scenario, onChange }: ScenarioPanelProps) {
  const [localScenario, setLocalScenario] = useState<Scenario>(scenario);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  const handleApply = () => {
    const result = ScenarioSchema.safeParse(localScenario);
    
    if (!result.success) {
      const errorMessage = result.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join('; ');
      setValidationError(errorMessage);
      setIsValid(false);
      return;
    }

    setValidationError(null);
    setIsValid(true);
    onChange(result.data);
  };

  const updateField = <K extends keyof Scenario>(field: K, value: Scenario[K]) => {
    const updated = { ...localScenario, [field]: value };
    setLocalScenario(updated);
    
    // Clear validation error when user makes changes
    if (validationError) {
      setValidationError(null);
      setIsValid(true);
    }
  };

  const selectedFairing = FAIRINGS.find(f => f.name === localScenario.fairing.name);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Mission Scenario
          {isValid && !validationError ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {validationError && (
          <Alert className="border-red-200 bg-red-50 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {validationError}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="crew-size">Crew Size</Label>
          <Input
            id="crew-size"
            type="number"
            min="1"
            max="12"
            value={localScenario.crew_size}
            onChange={(e) => updateField('crew_size', parseInt(e.target.value) || 1)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Mission Duration (days)</Label>
          <Input
            id="duration"
            type="number"
            min="1"
            value={localScenario.mission_duration_days}
            onChange={(e) => updateField('mission_duration_days', parseInt(e.target.value) || 1)}
          />
        </div>

        <div className="space-y-2">
          <Label>Destination</Label>
          <Select
            value={localScenario.destination}
            onValueChange={(value: Destination) => updateField('destination', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DESTINATIONS.map((dest) => (
                <SelectItem key={dest} value={dest}>
                  {dest.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Launch Vehicle Fairing</Label>
          <Select
            value={localScenario.fairing.name}
            onValueChange={(fairingName) => {
              const fairing = FAIRINGS.find(f => f.name === fairingName);
              if (fairing) {
                updateField('fairing', {
                  name: fairing.name,
                  inner_diameter_m: fairing.inner_diameter_m,
                  inner_height_m: fairing.inner_height_m,
                  shape: fairing.shape === 'OGIVE' ? 'CONE' : 'CYLINDER'
                });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FAIRINGS.map((fairing) => (
                <SelectItem key={fairing.name} value={fairing.name}>
                  {fairing.name} (⌀{fairing.inner_diameter_m}m × {fairing.inner_height_m}m)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedFairing && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <div><strong>Shape:</strong> {selectedFairing.shape}</div>
            <div><strong>Inner Diameter:</strong> {selectedFairing.inner_diameter_m}m</div>
            <div><strong>Inner Height:</strong> {selectedFairing.inner_height_m}m</div>
            <div><strong>Volume:</strong> ~{(Math.PI * Math.pow(selectedFairing.inner_diameter_m/2, 2) * selectedFairing.inner_height_m).toFixed(1)}m³</div>
          </div>
        )}

        <Button 
          onClick={handleApply} 
          className="w-full"
          variant={isValid ? "default" : "destructive"}
        >
          Apply Scenario
        </Button>
      </CardContent>
    </Card>
  );
}