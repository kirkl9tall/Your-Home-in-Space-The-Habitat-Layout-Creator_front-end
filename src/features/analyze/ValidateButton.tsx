import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, AlertTriangle, Loader2, Wrench } from 'lucide-react';
import { Layout } from '@/lib/schemas';
import { postCheckLayout, CheckResponse } from '@/lib/api';

interface ValidateButtonProps {
  layout: Layout;
  onPatch?: (patch: any) => void;
}

type ValidationStatus = 'idle' | 'loading' | 'success' | 'error';

export function ValidateButton({ layout, onPatch }: ValidateButtonProps) {
  const [status, setStatus] = useState<ValidationStatus>('idle');
  const [result, setResult] = useState<CheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async () => {
    setStatus('loading');
    setError(null);
    setResult(null);
    
    try {
      const response = await postCheckLayout(layout);
      setResult(response);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
      setStatus('error');
    }
  };

  const handleApplyPatch = (patch: any) => {
    if (onPatch) {
      onPatch(patch);
    }
  };

  const getSeverityIcon = (severity: 'info' | 'warn' | 'error') => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: 'info' | 'warn' | 'error') => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warn':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Layout Validation
          {status === 'success' && result?.valid && (
            <CheckCircle className="w-4 h-4 text-green-500" />
          )}
          {status === 'success' && !result?.valid && (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleValidate}
          disabled={status === 'loading'}
          className="w-full"
          variant={status === 'success' && result?.valid ? "secondary" : "default"}
        >
          {status === 'loading' && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          {status === 'loading' ? 'Validating...' : 'Validate Layout'}
        </Button>

        {error && (
          <Alert className="border-red-200 bg-red-50 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4">
            {/* Validation Status */}
            <div className={`p-3 rounded-lg ${result.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2">
                {result.valid ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-medium ${result.valid ? 'text-green-800' : 'text-red-800'}`}>
                  {result.valid ? 'Layout is valid!' : 'Layout has issues'}
                </span>
              </div>
            </div>

            {/* Metrics */}
            {result.metrics && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted rounded-lg">
                <div className="text-sm">
                  <div className="font-medium">NHV</div>
                  <div className="text-muted-foreground">
                    {result.metrics.nhv_m3?.toFixed(1) || 'N/A'}m³
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Pressurized</div>
                  <div className="text-muted-foreground">
                    {result.metrics.pressurized_m3?.toFixed(1) || 'N/A'}m³
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Utilization</div>
                  <div className="text-muted-foreground">
                    {result.metrics.utilization_ratio ? `${(result.metrics.utilization_ratio * 100).toFixed(1)}%` : 'N/A'}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Clearance</div>
                  <div className={result.metrics.corridor_clearance_ok ? 'text-green-600' : 'text-red-600'}>
                    {result.metrics.corridor_clearance_ok ? 'OK' : 'Issues'}
                  </div>
                </div>
              </div>
            )}

            {/* Issues */}
            {result.issues && result.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Issues Found:</h4>
                {result.issues.map((issue) => (
                  <div key={issue.id} className="flex items-start gap-2 p-2 rounded border">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1 text-sm">
                      <div>{issue.message}</div>
                      {issue.rule && (
                        <div className="text-muted-foreground text-xs mt-1">
                          Rule: {issue.rule}
                        </div>
                      )}
                      {issue.moduleIds && issue.moduleIds.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {issue.moduleIds.map((moduleId) => (
                            <Badge key={moduleId} className="text-xs">
                              {moduleId}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge className={getSeverityColor(issue.severity)}>
                      {issue.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions && result.suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Suggestions:</h4>
                {result.suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="p-3 border rounded-lg bg-blue-50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{suggestion.label}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {suggestion.description}
                        </div>
                      </div>
                      {suggestion.patch && onPatch ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApplyPatch(suggestion.patch)}
                          className="flex items-center gap-1"
                        >
                          <Wrench className="w-3 h-3" />
                          Apply
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}