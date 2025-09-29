import { useState, useCallback } from 'react';
import { HabitatValidationService, ValidationResponse, HabitatValidationPayload } from '../lib/habitatValidation';

export interface UseHabitatValidationResult {
  validationResults: ValidationResponse | null;
  isValidating: boolean;
  validationError: string | null;
  validateHabitat: (modules: any[], scenario: any, habitat: any) => Promise<ValidationResponse | undefined>;
  clearValidation: () => void;
}

export function useHabitatValidation(): UseHabitatValidationResult {
  const [validationResults, setValidationResults] = useState<ValidationResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateHabitat = useCallback(async (modules: any[], scenario: any, habitat: any) => {
    setIsValidating(true);
    setValidationError(null);

    try {
      // Debug logging
      console.log('🚀 Starting NASA validation...');
      console.log('📊 Input data:', { modules, scenario, habitat });
      
      const payload = HabitatValidationService.convertToValidationPayload(modules, scenario, habitat);
      console.log('📡 API Payload:', JSON.stringify(payload, null, 2));
      
      const results = await HabitatValidationService.validateHabitat(payload);
      console.log('✅ Validation Results:', results);
      console.log('🔍 useHabitatValidation - results type:', typeof results);
      console.log('🔍 useHabitatValidation - results keys:', results ? Object.keys(results) : 'null');
      
      setValidationResults(results);
      return results; // Return the results so they can be used in callbacks
    } catch (error) {
      console.error('❌ Habitat validation failed:', error);
      console.error('🔍 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setValidationError(error instanceof Error ? error.message : 'Validation failed');
      return undefined; // Return undefined on error
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearValidation = useCallback(() => {
    setValidationResults(null);
    setValidationError(null);
  }, []);

  return {
    validationResults,
    isValidating,
    validationError,
    validateHabitat,
    clearValidation
  };
}