import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Zap, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Target
} from 'lucide-react';

// Enhanced module with analytics data
interface AnalyticsModule {
  id: string;
  type: string;
  position: [number, number, number];
  size: { w_m: number; l_m: number; h_m: number };
  level: number;
  crew_capacity: number;
  usage_frequency: number; // 0-1 scale
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  noise_level: 'QUIET' | 'MODERATE' | 'LOUD';
  power_consumption: number; // kW
  maintenance_hours: number; // hours per week
}

interface AnalyticsData {
  modules: AnalyticsModule[];
  crewSize: number;
  missionDuration: number;
  habitatBounds: { width: number; depth: number; height: number };
}

// Color schemes for charts
const CHART_COLORS = {
  primary: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'],
  criticality: {
    LOW: '#10b981',
    MEDIUM: '#f59e0b', 
    HIGH: '#ef4444',
    CRITICAL: '#dc2626'
  },
  noise: {
    QUIET: '#10b981',
    MODERATE: '#f59e0b',
    LOUD: '#ef4444'
  },
  efficiency: {
    excellent: '#10b981',
    good: '#06b6d4',
    acceptable: '#f59e0b',
    poor: '#ef4444'
  }
};

interface VolumeUtilizationChartProps {
  data: AnalyticsData;
}

function VolumeUtilizationChart({ data }: VolumeUtilizationChartProps) {
  const chartData = useMemo(() => {
    const typeGroups = data.modules.reduce((acc, module) => {
      const type = module.type.replace('_', ' ');
      if (!acc[type]) {
        acc[type] = {
          type,
          volume: 0,
          modules: 0,
          crew_capacity: 0,
          efficiency: 0
        };
      }
      const volume = module.size.w_m * module.size.l_m * module.size.h_m;
      acc[type].volume += volume;
      acc[type].modules += 1;
      acc[type].crew_capacity += module.crew_capacity;
      acc[type].efficiency += module.usage_frequency;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(typeGroups).map((group: any) => ({
      ...group,
      efficiency: (group.efficiency / group.modules * 100).toFixed(1)
    }));
  }, [data.modules]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Volume Distribution by Function
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="type" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis 
              label={{ value: 'Volume (m³)', angle: -90, position: 'insideLeft' }}
              fontSize={12}
            />
            <Tooltip 
              formatter={(value: any, name: string) => [
                name === 'volume' ? `${value.toFixed(1)}m³` : value,
                name.charAt(0).toUpperCase() + name.slice(1)
              ]}
              labelStyle={{ color: '#374151' }}
            />
            <Bar dataKey="volume" fill={CHART_COLORS.primary[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Volume:</span>
            <span className="font-medium">
              {data.modules.reduce((sum, m) => sum + m.size.w_m * m.size.l_m * m.size.h_m, 0).toFixed(1)}m³
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Module Types:</span>
            <span className="font-medium">{chartData.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CrewEfficiencyRadarProps {
  data: AnalyticsData;
}

function CrewEfficiencyRadar({ data }: CrewEfficiencyRadarProps) {
  const radarData = useMemo(() => {
    const categories = {
      'Work Efficiency': data.modules.filter(m => ['WORKSTATION', 'MEDICAL', 'GLOVEBOX'].includes(m.type)),
      'Living Quality': data.modules.filter(m => ['CREW_SLEEP', 'HYGIENE', 'COMMON_AREA', 'RECREATION'].includes(m.type)),
      'Life Support': data.modules.filter(m => ['ECLSS', 'WASTE', 'TRASH_MGMT'].includes(m.type)),
      'Storage Access': data.modules.filter(m => ['STOWAGE', 'FOOD_PREP'].includes(m.type)),
      'Safety Systems': data.modules.filter(m => ['AIRLOCK', 'MEDICAL', 'MAINTENANCE'].includes(m.type)),
      'Fitness/Health': data.modules.filter(m => ['EXERCISE', 'MEDICAL'].includes(m.type))
    };

    return Object.entries(categories).map(([category, modules]) => {
      const avgEfficiency = modules.length > 0 
        ? modules.reduce((sum, m) => sum + m.usage_frequency, 0) / modules.length * 100
        : 0;
      
      return {
        category,
        efficiency: Math.round(avgEfficiency),
        modules: modules.length
      };
    });
  }, [data.modules]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Crew Efficiency Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="category" fontSize={12} />
            <PolarRadiusAxis 
              domain={[0, 100]} 
              fontSize={10}
              tickCount={5}
            />
            <Radar
              name="Efficiency %"
              dataKey="efficiency"
              stroke={CHART_COLORS.primary[1]}
              fill={CHART_COLORS.primary[1]}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
        
        <div className="mt-4 space-y-2">
          {radarData.map((item) => (
            <div key={item.category} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.category}</span>
              <div className="flex items-center gap-2">
                <Progress value={item.efficiency} className="w-20 h-2" />
                <span className="font-medium w-12">{item.efficiency}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface CriticalityDistributionProps {
  data: AnalyticsData;
}

function CriticalityDistribution({ data }: CriticalityDistributionProps) {
  const pieData = useMemo(() => {
    const criticality = data.modules.reduce((acc, module) => {
      acc[module.criticality] = (acc[module.criticality] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(criticality).map(([level, count]) => ({
      name: level,
      value: count,
      percentage: ((count / data.modules.length) * 100).toFixed(1)
    }));
  }, [data.modules]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="w-5 h-5" />
          System Criticality Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name} ${percentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={CHART_COLORS.criticality[entry.name as keyof typeof CHART_COLORS.criticality]} 
                />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => [value, 'Modules']} />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="mt-4 grid grid-cols-2 gap-2">
          {pieData.map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ 
                  backgroundColor: CHART_COLORS.criticality[item.name as keyof typeof CHART_COLORS.criticality] 
                }}
              />
              <span className="text-muted-foreground">{item.name}:</span>
              <span className="font-medium">{item.value} modules</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface PowerConsumptionTrendProps {
  data: AnalyticsData;
}

function PowerConsumptionTrend({ data }: PowerConsumptionTrendProps) {
  const trendData = useMemo(() => {
    // Simulate 24-hour power consumption pattern
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return hours.map(hour => {
      // Calculate power consumption based on typical crew activity patterns
      const activityMultiplier = hour >= 6 && hour <= 22 ? 1.0 : 0.6; // Lower at night
      const totalPower = data.modules.reduce((sum, module) => {
        const basePower = module.power_consumption;
        const usageMultiplier = module.usage_frequency * activityMultiplier;
        return sum + (basePower * usageMultiplier);
      }, 0);

      return {
        hour: `${hour.toString().padStart(2, '0')}:00`,
        power: Math.round(totalPower * 10) / 10,
        efficiency: Math.round((totalPower / (data.modules.length * 2)) * 100) // Assume 2kW max per module
      };
    });
  }, [data.modules]);

  const avgPower = trendData.reduce((sum, d) => sum + d.power, 0) / trendData.length;
  const peakPower = Math.max(...trendData.map(d => d.power));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Daily Power Consumption Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.primary[4]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={CHART_COLORS.primary[4]} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="hour" 
              fontSize={12}
              interval={3}
            />
            <YAxis 
              label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }}
              fontSize={12}
            />
            <Tooltip 
              formatter={(value: any, name: string) => [
                name === 'power' ? `${value}kW` : `${value}%`,
                name === 'power' ? 'Power Consumption' : 'Efficiency'
              ]}
              labelStyle={{ color: '#374151' }}
            />
            <Area
              type="monotone"
              dataKey="power"
              stroke={CHART_COLORS.primary[4]}
              fillOpacity={1}
              fill="url(#powerGradient)"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="efficiency"
              stroke={CHART_COLORS.primary[1]}
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
        
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="text-2xl font-bold text-primary">{avgPower.toFixed(1)}</div>
            <div className="text-muted-foreground">Avg kW</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="text-2xl font-bold text-orange-500">{peakPower.toFixed(1)}</div>
            <div className="text-muted-foreground">Peak kW</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="text-2xl font-bold text-green-500">{data.modules.length}</div>
            <div className="text-muted-foreground">Systems</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AdvancedAnalyticsDashboardProps {
  data: AnalyticsData;
}

export function AdvancedAnalyticsDashboard({ data }: AdvancedAnalyticsDashboardProps) {
  const overallStats = useMemo(() => {
    const totalVolume = data.modules.reduce((sum, m) => sum + m.size.w_m * m.size.l_m * m.size.h_m, 0);
    const avgEfficiency = data.modules.reduce((sum, m) => sum + m.usage_frequency, 0) / data.modules.length;
    const criticalSystems = data.modules.filter(m => m.criticality === 'CRITICAL').length;
    const totalPower = data.modules.reduce((sum, m) => sum + m.power_consumption, 0);

    return {
      totalVolume,
      avgEfficiency: avgEfficiency * 100,
      criticalSystems,
      totalPower,
      efficiency_rating: avgEfficiency >= 0.8 ? 'excellent' : avgEfficiency >= 0.6 ? 'good' : avgEfficiency >= 0.4 ? 'acceptable' : 'poor'
    };
  }, [data.modules]);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{overallStats.totalVolume.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Total Volume (m³)</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{overallStats.avgEfficiency.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Avg Efficiency</p>
              </div>
              <TrendingUp className={`w-8 h-8 ${
                overallStats.efficiency_rating === 'excellent' ? 'text-green-500' :
                overallStats.efficiency_rating === 'good' ? 'text-blue-500' :
                overallStats.efficiency_rating === 'acceptable' ? 'text-yellow-500' : 'text-red-500'
              }`} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{overallStats.criticalSystems}</p>
                <p className="text-sm text-muted-foreground">Critical Systems</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{overallStats.totalPower.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Total Power (kW)</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        <VolumeUtilizationChart data={data} />
        <CrewEfficiencyRadar data={data} />
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <CriticalityDistribution data={data} />
        <PowerConsumptionTrend data={data} />
      </div>

      {/* Recommendations Footer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            AI-Powered Optimization Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {overallStats.avgEfficiency < 60 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Efficiency Alert</h4>
                  <p className="text-sm text-yellow-700">
                    Overall system efficiency is below 60%. Consider repositioning high-usage modules closer to crew areas.
                  </p>
                </div>
              </div>
            )}
            
            {overallStats.criticalSystems > data.modules.length * 0.3 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Redundancy Warning</h4>
                  <p className="text-sm text-red-700">
                    High number of critical systems detected. Consider adding backup systems for mission safety.
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">Power Optimization</h4>
                <p className="text-sm text-green-700">
                  Current power distribution looks balanced. Peak consumption occurs during active hours as expected.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}