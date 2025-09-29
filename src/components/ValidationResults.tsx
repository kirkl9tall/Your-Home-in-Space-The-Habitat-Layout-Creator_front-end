import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { ValidationResponse, ValidationRule } from '@/lib/habitatValidation';

interface ValidationResultsProps {
  results: ValidationResponse | null;
}

const ValidationRuleItem: React.FC<{ rule: ValidationRule }> = ({ rule }) => {
  const category = rule.rule.split('.')[0].replace('_', ' ').toUpperCase();
  const name = rule.rule.split('.').slice(-1)[0].replace(/_/g, ' ').toUpperCase();
  
  return (
    <div className="flex items-start gap-3 p-4 border rounded-lg bg-card">
      <div className="flex-shrink-0 mt-0.5">
        {rule.valid ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="font-medium text-foreground">{name}</h4>
            <p className="text-sm text-muted-foreground mt-1">{rule.explanation}</p>
          </div>
          <Badge variant={rule.valid ? 'default' : 'destructive'}>
            {category}
          </Badge>
        </div>
        <div className="mt-2 text-sm">
          <span className="text-muted-foreground">Status: </span>
          <span className={rule.valid ? 'text-green-600' : 'text-red-600'}>
            {rule.valid ? 'PASS' : 'FAIL'}
          </span>
        </div>
      </div>
    </div>
  );
};

export const ValidationResults: React.FC<ValidationResultsProps> = ({ results }) => {
  // Simple debug logging
  console.log('🔍 ValidationResults received:', results);
  
  if (!results) {
    console.log('❌ ValidationResults: No results provided');
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            No Validation Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Run validation to see results here.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Handle both string and object formats
  let nasaResults: ValidationRule[] = [];
  let suggestions: string[] = [];
  
  if ((results as any).results && Array.isArray((results as any).results)) {
    nasaResults = (results as any).results;
    suggestions = (results as any).suggestions || [];
  } else if (Array.isArray(results)) {
    nasaResults = results;
  }
  
  const passingRules = nasaResults.filter((rule: ValidationRule) => rule.valid);
  const failingRules = nasaResults.filter((rule: ValidationRule) => rule.valid === false);
  
  // Calculate score as percentage of passing rules
  const score = nasaResults.length > 0 ? Math.round((passingRules.length / nasaResults.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>NASA Validation Results</span>
            <div className="flex items-center gap-2">
              <Badge 
                variant={score >= 70 ? 'default' : score >= 50 ? 'secondary' : 'destructive'}
                className="text-lg px-3 py-1"
              >
                {Math.round(score)}%
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">{nasaResults.length}</div>
              <div className="text-sm text-muted-foreground">Total Rules</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{passingRules.length}</div>
              <div className="text-sm text-muted-foreground">Passing</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{failingRules.length}</div>
              <div className="text-sm text-muted-foreground">Failing</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Rules */}
      {nasaResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nasaResults.map((rule: ValidationRule, index: number) => (
                <ValidationRuleItem key={index} rule={rule} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Improvement Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800">{suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ValidationResults;