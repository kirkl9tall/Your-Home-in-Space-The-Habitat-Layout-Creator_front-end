import { memo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle, Lightbulb, TrendingUp } from "lucide-react";

export type AnalyzerResult = {
  results?: { rule: string; valid: boolean; explanation: string }[];
  rawResults?: { rule: string; valid: boolean; explanation: string }[];
  suggestions?: string[];
  issues?: { id: string; severity: string; message: string; rule?: string }[];
  valid?: boolean;
  explanation?: string;
};

export default memo(function AnalysisResults({ 
  data, 
  results, 
  onApply, 
  isLoading = false, 
  showPayload = false, 
  payloadData 
}: {
  data?: AnalyzerResult | null;
  results?: AnalyzerResult | null;
  onApply?: (s: string) => void;
  isLoading?: boolean;
  showPayload?: boolean;
  payloadData?: any;
}) {
  // Support both prop names for backwards compatibility
  const analysisData = results || data;
  
  // Debug: Log the data being passed to the component
  console.log('🔍 AnalysisResults received data:', analysisData);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Analyzing habitat with NASA...</p>
        </div>
      </div>
    );
  }
  
  if (!analysisData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">No Analysis Data</h3>
          <p className="text-gray-500">Submit a payload to see NASA habitat validation results.</p>
        </div>
      </div>
    );
  }
  
  // Extract validation results - support both formats
  let validationResults = analysisData.rawResults || analysisData.results || [];
  const suggestions = analysisData.suggestions || [];
  

  
  // Convert issues to results format if needed
  if (analysisData.issues && !validationResults.length) {
    validationResults = analysisData.issues.map(issue => ({
      rule: issue.rule || issue.id,
      valid: issue.severity !== 'error',
      explanation: issue.message
    }));
  }
  const passedRules = validationResults.filter((r: any) => r.valid).length;
  const totalRules = validationResults.length;
  const passRate = totalRules > 0 ? (passedRules / totalRules * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{passedRules}</div>
          <div className="text-sm text-green-300">Rules Passed</div>
        </div>
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{totalRules - passedRules}</div>
          <div className="text-sm text-red-300">Rules Failed</div>
        </div>
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{passRate}%</div>
          <div className="text-sm text-blue-300">Success Rate</div>
        </div>
      </div>

      {/* Validation Rules */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-blue-200">Validation Rules</h3>
          <Badge variant="outline" className="text-blue-400 border-blue-400">
            {totalRules} Total
          </Badge>
        </div>
        <div className="space-y-3">
          {validationResults.length === 0 && (
            <div className="text-center py-8 text-gray-400">No validation rules returned.</div>
          )}
          {validationResults.map((r: any, i: number) => (
            <div key={i} className={`p-4 rounded-lg border ${
              r.valid 
                ? 'bg-green-900/10 border-green-500/30' 
                : 'bg-red-900/10 border-red-500/30'
            }`}>
              <div className="flex items-start gap-3">
                {r.valid ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={r.valid ? "default" : "destructive"} className="text-xs">
                      {r.valid ? "PASS" : "FAIL"}
                    </Badge>
                    <code className="font-mono text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">
                      {r.rule}
                    </code>
                  </div>
                  <p className={`text-sm ${r.valid ? 'text-green-200' : 'text-red-200'}`}>
                    {r.explanation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-yellow-200">Improvement Suggestions</h3>
            <Badge variant="outline" className="text-yellow-400 border-yellow-400">
              {suggestions.length} Items
            </Badge>
          </div>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div key={i} className="bg-yellow-900/10 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-yellow-200 text-sm">{s}</p>
                  </div>
                  {onApply && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onApply(s)}
                      className="border-yellow-500/30 text-yellow-200 hover:bg-yellow-500/10"
                    >
                      Apply
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payload Display (if requested) */}
      {showPayload && payloadData && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-purple-200">NASA Layout Payload</h3>
            <Badge variant="outline" className="text-purple-400 border-purple-400">
              JSON Schema
            </Badge>
          </div>
          <div className="bg-gray-900/60 border border-purple-500/30 rounded-lg p-4 backdrop-blur-sm">
            <pre className="text-xs text-gray-300 overflow-x-auto max-h-64">
              {JSON.stringify(payloadData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
});