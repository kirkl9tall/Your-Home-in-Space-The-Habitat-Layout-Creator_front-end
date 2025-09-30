import { memo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle, Lightbulb, TrendingUp } from "lucide-react";
import { Panel } from "@/ui/Panel";
import { RuleChip } from "@/ui/RuleChip";

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
      {/* Summary Stats - NASA Theme */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[var(--surface-1)] border border-[var(--border-weak)] rounded-xl p-4 text-center backdrop-blur shadow-[var(--glow)]">
          <div className="text-2xl font-bold text-green-400">{passedRules}</div>
          <div className="text-sm text-green-300/80">Rules Passed</div>
        </div>
        <div className="bg-[var(--surface-1)] border border-[var(--border-weak)] rounded-xl p-4 text-center backdrop-blur shadow-[var(--glow)]">
          <div className="text-2xl font-bold text-[var(--accent)]">{totalRules - passedRules}</div>
          <div className="text-sm text-red-300/80">Rules Failed</div>
        </div>
        <div className="bg-[var(--surface-1)] border border-[var(--border-weak)] rounded-xl p-4 text-center backdrop-blur shadow-[var(--glow)]">
          <div className="text-2xl font-bold text-[var(--brand-2)]">{passRate}%</div>
          <div className="text-sm text-blue-300/80">Success Rate</div>
        </div>
      </div>

      {/* Validation Rules - NASA Theme */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[var(--brand-2)]" />
          <h3 className="text-lg font-semibold text-[var(--brand-2)]">Validation Rules</h3>
          <Badge variant="outline" className="text-[var(--brand)] border-[var(--brand)]/30 bg-[var(--brand)]/10">
            {totalRules} Total
          </Badge>
        </div>
        <div className="space-y-3">
          {validationResults.length === 0 && (
            <div className="text-center py-8 text-gray-400">No validation rules returned.</div>
          )}
          {validationResults.map((r: any, i: number) => (
            <div key={i} className="p-4 rounded-xl border bg-[var(--surface-1)] border-[var(--border-weak)] backdrop-blur shadow-[var(--glow)]">
              <div className="flex items-start gap-3">
                <RuleChip valid={r.valid} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="font-mono text-xs bg-black/20 px-2 py-1 rounded text-gray-300 border border-white/10">
                      {r.rule}
                    </code>
                  </div>
                  <p className={`text-sm ${r.valid ? 'text-green-200/90' : 'text-red-200/90'}`}>
                    {r.explanation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions - NASA Theme */}
      {suggestions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-amber-200">Improvement Suggestions</h3>
            <Badge variant="outline" className="text-amber-400 border-amber-400/30 bg-amber-400/10">
              {suggestions.length} Items
            </Badge>
          </div>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div key={i} className="bg-[var(--surface-1)] border border-[var(--border-weak)] rounded-xl p-3 backdrop-blur shadow-[var(--glow)]">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-amber-100/90 text-sm">{s}</p>
                  </div>
                  {onApply && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onApply(s)}
                      className="border-[var(--brand)]/30 text-[var(--brand)] hover:bg-[var(--brand)]/10"
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