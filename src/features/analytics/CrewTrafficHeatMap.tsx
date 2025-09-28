import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Navigation, Users } from 'lucide-react';

interface HeatMapModule {
  id: string;
  type: string;
  position: [number, number, number];
  size: { w_m: number; l_m: number; h_m: number };
  level: number;
  usage_frequency: number; // 0-1 scale
  crew_visits_per_day: number;
}

interface CrewTrafficHeatMapProps {
  modules: HeatMapModule[];
  bounds: { width: number; depth: number; height: number };
  selectedLevel: number;
}

export function CrewTrafficHeatMap({ modules, bounds, selectedLevel }: CrewTrafficHeatMapProps) {
  const heatMapData = useMemo(() => {
    // Filter modules for selected level
    const levelModules = modules.filter(m => m.level === selectedLevel);
    
    // Create grid cells (1m x 1m resolution)
    const gridWidth = Math.ceil(bounds.width);
    const gridDepth = Math.ceil(bounds.depth);
    const grid: number[][] = Array(gridDepth).fill(null).map(() => Array(gridWidth).fill(0));
    
    // Calculate traffic intensity for each grid cell
    levelModules.forEach(module => {
      const centerX = Math.floor(module.position[0] + bounds.width / 2);
      const centerZ = Math.floor(module.position[2] + bounds.depth / 2);
      const intensity = module.usage_frequency * module.crew_visits_per_day;
      
      // Apply traffic intensity in a radius around the module
      const radius = Math.max(module.size.w_m, module.size.l_m) / 2 + 1;
      
      for (let z = 0; z < gridDepth; z++) {
        for (let x = 0; x < gridWidth; x++) {
          const distance = Math.sqrt((x - centerX) ** 2 + (z - centerZ) ** 2);
          if (distance <= radius) {
            const falloff = Math.max(0, 1 - distance / radius);
            grid[z][x] += intensity * falloff;
          }
        }
      }
    });
    
    // Normalize values to 0-1 range
    const maxIntensity = Math.max(...grid.flat());
    if (maxIntensity > 0) {
      grid.forEach(row => {
        row.forEach((cell, idx) => {
          row[idx] = cell / maxIntensity;
        });
      });
    }
    
    return { grid, levelModules, maxIntensity };
  }, [modules, bounds, selectedLevel]);
  
  const getHeatColor = (intensity: number) => {
    if (intensity === 0) return 'rgba(243, 244, 246, 0.5)'; // Light gray for no traffic
    
    // Blue to red heat map
    const colors = [
      { stop: 0, color: [59, 130, 246] },   // Blue
      { stop: 0.3, color: [34, 197, 94] },  // Green  
      { stop: 0.6, color: [251, 191, 36] }, // Yellow
      { stop: 1.0, color: [239, 68, 68] }   // Red
    ];
    
    let color1, color2, ratio;
    
    if (intensity <= 0.3) {
      color1 = colors[0].color;
      color2 = colors[1].color;
      ratio = intensity / 0.3;
    } else if (intensity <= 0.6) {
      color1 = colors[1].color;
      color2 = colors[2].color;
      ratio = (intensity - 0.3) / 0.3;
    } else {
      color1 = colors[2].color;
      color2 = colors[3].color;
      ratio = (intensity - 0.6) / 0.4;
    }
    
    const r = Math.round(color1[0] + (color2[0] - color1[0]) * ratio);
    const g = Math.round(color1[1] + (color2[1] - color1[1]) * ratio);
    const b = Math.round(color1[2] + (color2[2] - color1[2]) * ratio);
    
    return `rgba(${r}, ${g}, ${b}, ${0.3 + intensity * 0.7})`;
  };
  
  const trafficStats = useMemo(() => {
    const totalVisits = heatMapData.levelModules.reduce((sum, m) => sum + m.crew_visits_per_day, 0);
    const avgUsage = heatMapData.levelModules.length > 0 
      ? heatMapData.levelModules.reduce((sum, m) => sum + m.usage_frequency, 0) / heatMapData.levelModules.length 
      : 0;
    const hotspots = heatMapData.grid.flat().filter(cell => cell > 0.7).length;
    
    return { totalVisits, avgUsage: avgUsage * 100, hotspots };
  }, [heatMapData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Crew Traffic Heat Map - Level {selectedLevel}
          </div>
          <Badge variant="secondary">
            {heatMapData.levelModules.length} modules
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Heat map grid */}
        <div className="relative bg-gray-100 border rounded-lg p-4 mb-4">
          <div 
            className="grid gap-0.5 mx-auto"
            style={{
              gridTemplateColumns: `repeat(${heatMapData.grid[0]?.length || 1}, 1fr)`,
              width: 'min(100%, 400px)',
              aspectRatio: `${bounds.width} / ${bounds.depth}`
            }}
          >
            {heatMapData.grid.flat().map((intensity, idx) => (
              <div
                key={idx}
                className="aspect-square border border-gray-200 relative"
                style={{
                  backgroundColor: getHeatColor(intensity),
                  minWidth: '8px',
                  minHeight: '8px'
                }}
                title={`Traffic Intensity: ${(intensity * 100).toFixed(1)}%`}
              />
            ))}
          </div>
          
          {/* Module overlays */}
          {heatMapData.levelModules.map((module) => {
            const x = ((module.position[0] + bounds.width / 2) / bounds.width) * 100;
            const z = ((module.position[2] + bounds.depth / 2) / bounds.depth) * 100;
            
            return (
              <div
                key={module.id}
                className="absolute bg-black/20 border-2 border-white rounded flex items-center justify-center text-white text-xs font-bold"
                style={{
                  left: `${x}%`,
                  top: `${z}%`,
                  width: `${(module.size.w_m / bounds.width) * 100}%`,
                  height: `${(module.size.l_m / bounds.depth) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  minWidth: '20px',
                  minHeight: '20px'
                }}
                title={`${module.type}: ${module.crew_visits_per_day} visits/day`}
              >
                {module.type.slice(0, 2)}
              </div>
            );
          })}
        </div>
        
        {/* Heat map legend */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="text-xs text-muted-foreground">Low Traffic</span>
          <div className="flex h-4 w-32 rounded overflow-hidden">
            <div className="flex-1" style={{ backgroundColor: getHeatColor(0.1) }}></div>
            <div className="flex-1" style={{ backgroundColor: getHeatColor(0.3) }}></div>
            <div className="flex-1" style={{ backgroundColor: getHeatColor(0.5) }}></div>
            <div className="flex-1" style={{ backgroundColor: getHeatColor(0.7) }}></div>
            <div className="flex-1" style={{ backgroundColor: getHeatColor(0.9) }}></div>
          </div>
          <span className="text-xs text-muted-foreground">High Traffic</span>
        </div>
        
        {/* Traffic statistics */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-muted/50 rounded">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-2xl font-bold">{trafficStats.totalVisits}</span>
            </div>
            <p className="text-xs text-muted-foreground">Total Daily Visits</p>
          </div>
          
          <div className="p-3 bg-muted/50 rounded">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="text-2xl font-bold">{trafficStats.avgUsage.toFixed(0)}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Avg Usage Rate</p>
          </div>
          
          <div className="p-3 bg-muted/50 rounded">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Navigation className="w-4 h-4 text-red-500" />
              <span className="text-2xl font-bold">{trafficStats.hotspots}</span>
            </div>
            <p className="text-xs text-muted-foreground">Traffic Hotspots</p>
          </div>
        </div>
        
        {/* Insights */}
        {trafficStats.hotspots > 5 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-1">Traffic Congestion Alert</h4>
            <p className="text-sm text-yellow-700">
              High number of traffic hotspots detected. Consider redistributing modules or adding corridors to improve crew flow.
            </p>
          </div>
        )}
        
        {trafficStats.avgUsage < 30 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-1">Low Utilization</h4>
            <p className="text-sm text-blue-700">
              Average module usage is low. Consider consolidating functions or relocating underused modules.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}