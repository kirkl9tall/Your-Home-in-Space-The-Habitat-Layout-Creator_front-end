import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Clock,
  Users,
  Zap,
  Home,
  Target,
  TrendingUp
} from 'lucide-react';

interface StatusIndicatorProps {
  type: 'success' | 'warning' | 'info' | 'error';
  message: string;
  details?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface DesignMetrics {
  totalModules: number;
  crewCapacity: number;
  totalVolume: number;
  powerConsumption: number;
  efficiency: number;
  safetyScore: number;
  completeness: number;
}

interface SmartStatusSystemProps {
  metrics: DesignMetrics;
  warnings: string[];
  suggestions: string[];
  className?: string;
}

function StatusIndicator({ type, message, details, action }: StatusIndicatorProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={`border rounded-lg p-3 ${getBgColor()}`}>
      <div className="flex items-start gap-2">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900">{message}</div>
          {details && (
            <div className="text-xs text-gray-600 mt-1">{details}</div>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SmartStatusSystem({ metrics, warnings, suggestions, className }: SmartStatusSystemProps) {
  const getEfficiencyStatus = (efficiency: number) => {
    if (efficiency >= 85) return { label: 'Excellent', color: 'bg-green-500', textColor: 'text-green-700' };
    if (efficiency >= 70) return { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-700' };
    if (efficiency >= 50) return { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { label: 'Poor', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  const getSafetyStatus = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-600' };
    if (score >= 75) return { label: 'Good', color: 'text-blue-600' };
    if (score >= 60) return { label: 'Adequate', color: 'text-yellow-600' };
    return { label: 'Needs Improvement', color: 'text-red-600' };
  };

  const efficiencyStatus = getEfficiencyStatus(metrics.efficiency);
  const safetyStatus = getSafetyStatus(metrics.safetyScore);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-lg font-semibold">{metrics.totalModules}</div>
                <div className="text-xs text-muted-foreground">Modules</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" />
              <div>
                <div className="text-lg font-semibold">{metrics.crewCapacity}</div>
                <div className="text-xs text-muted-foreground">Crew</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <div>
                <div className="text-lg font-semibold">{metrics.powerConsumption.toFixed(1)}kW</div>
                <div className="text-xs text-muted-foreground">Power</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-500" />
              <div>
                <div className="text-lg font-semibold">{metrics.totalVolume.toFixed(0)}m³</div>
                <div className="text-xs text-muted-foreground">Volume</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Indicators */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Design Progress</h3>
              <Badge variant="secondary">{metrics.completeness}% Complete</Badge>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Overall Completeness</span>
                  <span>{metrics.completeness}%</span>
                </div>
                <Progress value={metrics.completeness} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Efficiency Score</span>
                  <span className={efficiencyStatus.textColor}>
                    {metrics.efficiency}% ({efficiencyStatus.label})
                  </span>
                </div>
                <Progress value={metrics.efficiency} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Safety Score</span>
                  <span className={safetyStatus.color}>
                    {metrics.safetyScore}% ({safetyStatus.label})
                  </span>
                </div>
                <Progress value={metrics.safetyScore} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <h3 className="font-medium">Design Warnings</h3>
              <Badge variant="destructive">{warnings.length}</Badge>
            </div>
            <div className="space-y-2">
              {warnings.map((warning, index) => (
                <StatusIndicator
                  key={index}
                  type="warning"
                  message={warning}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <h3 className="font-medium">Smart Suggestions</h3>
              <Badge variant="secondary">{suggestions.length}</Badge>
            </div>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <StatusIndicator
                  key={index}
                  type="info"
                  message={suggestion}
                  action={{
                    label: "Apply suggestion →",
                    onClick: () => console.log('Apply suggestion:', suggestion)
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Last Update</span>
              </div>
              <div className="font-medium">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-muted-foreground">Validated</span>
              </div>
              <div className="font-medium text-green-600">Real-time</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-blue-500" />
                <span className="text-muted-foreground">Performance</span>
              </div>
              <div className="font-medium text-blue-600">Optimized</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}