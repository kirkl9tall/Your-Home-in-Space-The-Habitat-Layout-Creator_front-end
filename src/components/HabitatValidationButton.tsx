import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { useHabitatValidation } from '@/hooks/useHabitatValidation';

interface HabitatValidationButtonProps {
  modules: any[];
  scenario: any;
  habitat: any;
  onValidationComplete?: (results: any) => void;
  className?: string;
}

export const HabitatValidationButton: React.FC<HabitatValidationButtonProps> = ({
  modules,
  scenario,
  habitat,
  onValidationComplete,
  className = ''
}) => {
  const { validationResults, isValidating, validationError, validateHabitat } = useHabitatValidation();

  const handleValidate = async () => {
    const results = await validateHabitat(modules, scenario, habitat);
    if (onValidationComplete && results) {
      onValidationComplete(results);
    }
  };

  const getButtonState = () => {
    if (isValidating) {
      return {
        icon: Loader2,
        text: 'Validating...',
        variant: 'secondary' as const,
        disabled: true
      };
    }

    if (validationError) {
      return {
        icon: AlertTriangle,
        text: 'Validation Failed',
        variant: 'destructive' as const,
        disabled: false
      };
    }

    if (validationResults) {
      // Handle both string and object formats
      let results = validationResults;
      if (typeof validationResults === 'string') {
        try {
          results = JSON.parse(validationResults);
        } catch (e) {
          // If parsing fails, fall back to default state
          return {
            icon: AlertTriangle,
            text: 'Validate with NASA Rules',
            variant: 'outline' as const,
            disabled: false
          };
        }
      }
      
      if (results && results.results && Array.isArray(results.results)) {
        const summary = results.results.filter((r: any) => r.valid).length;
        const total = results.results.length;
        
        return {
          icon: CheckCircle,
          text: `Validated (${summary}/${total} passed)`,
          variant: summary === total ? 'default' as const : 'secondary' as const,
          disabled: false
        };
      }
    }

    return {
      icon: AlertTriangle,
      text: 'Validate with NASA Rules',
      variant: 'outline' as const,
      disabled: false
    };
  };

  const { icon: Icon, text, variant, disabled } = getButtonState();

  return (
    <Button
      onClick={handleValidate}
      disabled={disabled || modules.length === 0}
      variant={variant}
      className={className}
    >
      <Icon className={`w-4 h-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
      {text}
    </Button>
  );
};