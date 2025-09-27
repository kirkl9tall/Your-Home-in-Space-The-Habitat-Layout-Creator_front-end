import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, AlertTriangle, Loader2, Wrench, Users, Volume2, Zap, Layers, ArrowUp, ArrowDown } from 'lucide-react';
import { Layout } from '@/lib/schemas';
import { postCheckLayout, CheckResponse } from '@/lib/api';
import { 
  checkSeparationViolations, 
  checkNoiseLevelConflicts, 
  getAdjacencyRecommendations,
  analyzeVolumeUtilization,
  calculateCorridorRequirements,
  calculateVerticalConnectivity,
  analyzeMultiLevelEfficiency
} from '@/lib/DEFAULTS';

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
      
      // Enhanced multi-level zoning validation
      const modules = layout.modules.map(module => ({
        id: module.id,
        type: module.type,
        level: module.level,
        position: module.position,
        size: { w_m: module.size.w_m, l_m: module.size.l_m, h_m: module.size.h_m }
      }));

      const separationViolations = checkSeparationViolations(modules);
      const noiseConflicts = checkNoiseLevelConflicts(modules);
      const adjacencyRecs = getAdjacencyRecommendations(modules);

      // Enhanced volume analysis
      const volumeAnalysis = analyzeVolumeUtilization(modules, layout.scenario.crew_size);
      const corridorAnalysis = calculateCorridorRequirements(modules);

      // Multi-level habitat analysis
      const verticalAnalysis = calculateVerticalConnectivity(modules);
      const multiLevelEfficiency = analyzeMultiLevelEfficiency(modules, layout.habitat.dimensions.height_m);

      // Store enhanced analysis
      const enhancedResponse = {
        ...response,
        _zoningData: {
          separationViolations,
          noiseConflicts,
          adjacencyRecommendations: adjacencyRecs,
          volumeAnalysis,
          corridorAnalysis,
          verticalAnalysis,
          multiLevelEfficiency
        }
      };

      setResult(enhancedResponse as any);
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

            {/* Volume Analysis */}
            {(result as any)?._zoningData?.volumeAnalysis && (
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Volume Analysis
                </h4>
                
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Overall Efficiency</span>
                    <Badge className={
                      (result as any)._zoningData.volumeAnalysis.overall.efficiency === 'EXCELLENT' ? 'bg-green-100 text-green-800' :
                      (result as any)._zoningData.volumeAnalysis.overall.efficiency === 'GOOD' ? 'bg-blue-100 text-blue-800' :
                      (result as any)._zoningData.volumeAnalysis.overall.efficiency === 'ACCEPTABLE' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {(result as any)._zoningData.volumeAnalysis.overall.efficiency}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Provided</div>
                      <div className="font-medium">{(result as any)._zoningData.volumeAnalysis.overall.totalProvided.toFixed(1)}m³</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Utilization</div>
                      <div className="font-medium">{((result as any)._zoningData.volumeAnalysis.overall.utilization * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>

                {/* Volume Recommendations */}
                {(result as any)._zoningData.volumeAnalysis.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-blue-600">Volume Optimization</h5>
                    {(result as any)._zoningData.volumeAnalysis.recommendations.slice(0, 2).map((rec: any, i: number) => (
                      <div key={i} className="p-2 border border-blue-200 bg-blue-50 rounded text-sm">
                        <div className="font-medium text-blue-800">{rec.issue}</div>
                        <div className="text-blue-700 text-xs">{rec.suggestion}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Zoning Analysis */}
            {(result as any)?._zoningData && (
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Zoning Analysis
                </h4>
                
                {/* Separation Violations */}
                {(result as any)._zoningData.separationViolations.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-red-600">
                      Separation Violations ({(result as any)._zoningData.separationViolations.length})
                    </h5>
                    {(result as any)._zoningData.separationViolations.slice(0, 2).map((violation: any, i: number) => (
                      <div key={i} className="p-2 border border-red-200 bg-red-50 rounded text-sm">
                        <div className="font-medium text-red-800">{violation.reason}</div>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="secondary" className="text-xs">{violation.moduleA}</Badge>
                          <Badge variant="secondary" className="text-xs">{violation.moduleB}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Adjacency Recommendations */}
                {(result as any)._zoningData.adjacencyRecommendations.filter((rec: any) => !rec.implemented).length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-blue-600 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Adjacency Opportunities ({(result as any)._zoningData.adjacencyRecommendations.filter((rec: any) => !rec.implemented).length})
                    </h5>
                    {(result as any)._zoningData.adjacencyRecommendations
                      .filter((rec: any) => !rec.implemented)
                      .slice(0, 2)
                      .map((rec: any, i: number) => (
                      <div key={i} className="p-2 border border-blue-200 bg-blue-50 rounded text-sm">
                        <div className="font-medium text-blue-800">{rec.reason}</div>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="secondary" className="text-xs">{rec.moduleA}</Badge>
                          <Badge variant="secondary" className="text-xs">{rec.moduleB}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Multi-Level Habitat Analysis */}
            {(result as any)?._zoningData?.multiLevelEfficiency && (
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Multi-Level Analysis
                </h4>
                
                <div className="p-3 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Levels Used</div>
                      <div className="font-medium">{(result as any)._zoningData.verticalAnalysis.levelsUsed.length}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Vertical Efficiency</div>
                      <div className="font-medium">{((result as any)._zoningData.multiLevelEfficiency.verticalEfficiency * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>

                {/* Vertical Violations */}
                {(result as any)._zoningData.verticalAnalysis.verticalViolations.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-red-600 flex items-center gap-1">
                      <ArrowDown className="w-3 h-3" />
                      Vertical Stacking Issues ({(result as any)._zoningData.verticalAnalysis.verticalViolations.length})
                    </h5>
                    {(result as any)._zoningData.verticalAnalysis.verticalViolations.slice(0, 3).map((violation: any, i: number) => (
                      <div key={i} className="p-2 border border-red-200 bg-red-50 rounded text-sm">
                        <div className="font-medium text-red-800">{violation.violation}</div>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="secondary" className="text-xs">{violation.moduleA}</Badge>
                          <Badge variant="secondary" className="text-xs">{violation.moduleB}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Vertical Access */}
                {(result as any)._zoningData.verticalAnalysis.verticalAccessNeeded.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-blue-600 flex items-center gap-1">
                      <ArrowUp className="w-3 h-3" />
                      Vertical Access ({(result as any)._zoningData.verticalAnalysis.verticalAccessNeeded.length} connections)
                    </h5>
                    {(result as any)._zoningData.verticalAnalysis.verticalAccessNeeded.slice(0, 2).map((access: any, i: number) => (
                      <div key={i} className="p-2 border border-blue-200 bg-blue-50 rounded text-sm">
                        <div className="font-medium text-blue-800">
                          {access.accessType} (Level {access.fromLevel} → {access.toLevel})
                        </div>
                        <div className="text-blue-700 text-xs">Area needed: {access.area.toFixed(1)}m²</div>
                      </div>
                    ))}
                  </div>
                )}
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