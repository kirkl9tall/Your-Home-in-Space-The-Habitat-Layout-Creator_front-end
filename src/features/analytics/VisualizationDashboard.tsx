import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Activity, 
  Download, 
  Settings, 
  RefreshCw,
  TrendingUp,
  Zap,
  Users,
  Eye,
  Layers
} from 'lucide-react';

import { AdvancedAnalyticsDashboard } from './AdvancedAnalyticsDashboard';
import { CrewTrafficHeatMap } from './CrewTrafficHeatMap';

// Sample data generator for demonstration
function generateSampleAnalyticsData(modules: any[], crewSize: number = 4) {
  return {
    modules: modules.map((module, index) => ({
      ...module,
      usage_frequency: 0.3 + Math.random() * 0.7, // Random usage 30-100%
      criticality: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)] as any,
      noise_level: ['QUIET', 'MODERATE', 'LOUD'][Math.floor(Math.random() * 3)] as any,
      power_consumption: 0.5 + Math.random() * 2.5, // Random power 0.5-3.0 kW
      maintenance_hours: Math.random() * 8, // Random maintenance 0-8 hours/week
      crew_visits_per_day: Math.floor(Math.random() * 20) + 1 // 1-20 visits per day
    })),
    crewSize,
    missionDuration: 365, // 1 year mission
    habitatBounds: { width: 10, depth: 8, height: 6 }
  };
}

interface VisualizationDashboardProps {
  modules: any[];
  crewSize?: number;
  onExport?: () => void;
  onRefresh?: () => void;
}

export function VisualizationDashboard({ 
  modules = [], 
  crewSize = 4, 
  onExport, 
  onRefresh 
}: VisualizationDashboardProps) {
  const [activeTab, setActiveTab] = useState('analytics');
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  const analyticsData = useMemo(() => {
    return generateSampleAnalyticsData(modules, crewSize);
  }, [modules, crewSize]);
  
  const maxLevels = Math.max(1, Math.floor(analyticsData.habitatBounds.height / 2.4));
  
  // Calculate overview metrics
  const overviewMetrics = useMemo(() => {
    const totalVolume = analyticsData.modules.reduce((sum, m) => sum + m.size.w_m * m.size.l_m * m.size.h_m, 0);
    const avgEfficiency = analyticsData.modules.reduce((sum, m) => sum + m.usage_frequency, 0) / analyticsData.modules.length;
    const totalPower = analyticsData.modules.reduce((sum, m) => sum + m.power_consumption, 0);
    const criticalSystems = analyticsData.modules.filter(m => m.criticality === 'CRITICAL').length;
    
    return {
      totalVolume: totalVolume.toFixed(1),
      avgEfficiency: (avgEfficiency * 100).toFixed(1),
      totalPower: totalPower.toFixed(1),
      criticalSystems,
      efficiency_status: avgEfficiency >= 0.8 ? 'Excellent' : avgEfficiency >= 0.6 ? 'Good' : avgEfficiency >= 0.4 ? 'Fair' : 'Poor'
    };
  }, [analyticsData]);

  return (
    <div className="h-full flex flex-col">
      {/* Dashboard Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Advanced Visualization Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time habitat analytics and crew optimization insights
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Quick Stats */}
            <div className="flex items-center gap-4 text-sm bg-white/50 px-4 py-2 rounded-lg">
              <div className="text-center">
                <div className="font-bold text-blue-600">{overviewMetrics.totalVolume}m³</div>
                <div className="text-xs text-muted-foreground">Volume</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-green-600">{overviewMetrics.avgEfficiency}%</div>
                <div className="text-xs text-muted-foreground">Efficiency</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-yellow-600">{overviewMetrics.totalPower}kW</div>
                <div className="text-xs text-muted-foreground">Power</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-red-600">{overviewMetrics.criticalSystems}</div>
                <div className="text-xs text-muted-foreground">Critical</div>
              </div>
            </div>
            
            {/* Control Buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={autoRefresh ? "default" : "outline"}
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto
              </Button>
              
              {onRefresh && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRefresh}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </Button>
              )}
              
              {onExport && (
                <Button
                  size="sm"
                  onClick={onExport}
                  className="flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Export
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                Settings
              </Button>
            </div>
          </div>
        </div>
        
        {/* Status Indicators */}
        <div className="flex items-center gap-2 mt-3">
          <Badge variant="secondary">
            {analyticsData.modules.length} modules analyzed
          </Badge>
          <Badge variant="secondary">
            {crewSize} crew members
          </Badge>
          <Badge variant="secondary">
            {maxLevels} levels
          </Badge>
          <Badge 
            className={
              overviewMetrics.efficiency_status === 'Excellent' ? 'bg-green-100 text-green-800' :
              overviewMetrics.efficiency_status === 'Good' ? 'bg-blue-100 text-blue-800' :
              overviewMetrics.efficiency_status === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }
          >
            {overviewMetrics.efficiency_status} efficiency
          </Badge>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex-1 p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="traffic" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Traffic Flow
            </TabsTrigger>
            <TabsTrigger value="power" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Power Systems
            </TabsTrigger>
            <TabsTrigger value="crew" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Crew Insights
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6 h-full">
            <AdvancedAnalyticsDashboard data={analyticsData} />
          </TabsContent>

          {/* Traffic Flow Tab */}
          <TabsContent value="traffic" className="mt-6 h-full">
            <div className="space-y-6">
              {/* Level Selector */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5" />
                      Level Selection
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: maxLevels }, (_, i) => (
                        <Button
                          key={i}
                          size="sm"
                          variant={selectedLevel === i ? "default" : "outline"}
                          onClick={() => setSelectedLevel(i)}
                          className="w-10 h-10 p-0"
                        >
                          {i}
                        </Button>
                      ))}
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card>
              
              {/* Heat Map */}
              <CrewTrafficHeatMap 
                modules={analyticsData.modules}
                bounds={analyticsData.habitatBounds}
                selectedLevel={selectedLevel}
              />
            </div>
          </TabsContent>

          {/* Power Systems Tab */}
          <TabsContent value="power" className="mt-6 h-full">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Power Distribution Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Zap className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Power Analytics</h3>
                    <p>Detailed power consumption patterns, load balancing, and optimization recommendations.</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>System Reliability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Reliability Metrics</h3>
                    <p>Mission-critical system uptime, redundancy analysis, and failure prediction.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Crew Insights Tab */}
          <TabsContent value="crew" className="mt-6 h-full">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Crew Productivity Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Productivity Insights</h3>
                    <p>Crew workflow optimization, task efficiency metrics, and workspace utilization patterns.</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Wellness & Comfort</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Comfort Analysis</h3>
                    <p>Environmental quality metrics, noise analysis, and crew satisfaction indicators.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Footer Status */}
      <div className="p-3 border-t bg-muted/20 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>
            Last updated: {new Date().toLocaleTimeString()} • 
            Data refresh: {autoRefresh ? 'Auto (30s)' : 'Manual'}
          </span>
          <span>
            Phase 2 Step 2: Advanced Visualization Dashboard • Real-time Analytics
          </span>
        </div>
      </div>
    </div>
  );
}