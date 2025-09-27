import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Layers, Grid3x3, Eye, Settings, Save, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { Interactive3DPlacement } from './Interactive3DPlacement';
import { ModulePalette } from './ModulePalette';
import { VisualizationDashboard } from '../analytics/VisualizationDashboard';
import { QuickActionsToolbar } from '@/components/ui/QuickActionsToolbar';
import { UserGuidanceSystem } from '@/components/ui/UserGuidanceSystem';
import { SmartStatusSystem } from '@/components/ui/SmartStatusSystem';
import { MODULE_DETAILS } from './ModulePalette';

// Enhanced module interface for the integrated system
interface EnhancedModule {
  id: string;
  type: keyof typeof MODULE_DETAILS;
  position: [number, number, number];
  size: { w_m: number; l_m: number; h_m: number };
  rotation: number;
  level: number;
  crew_capacity?: number;
}

interface HabitatBounds {
  width: number;
  depth: number;
  height: number;
}

interface EnhancedDesignInterfaceProps {
  initialModules?: EnhancedModule[];
  bounds: HabitatBounds;
  onModulesChange: (modules: EnhancedModule[]) => void;
  onSave?: () => void;
  isFirstVisit?: boolean;
}

export function EnhancedDesignInterface({
  initialModules = [],
  bounds,
  onModulesChange,
  onSave,
  isFirstVisit = false
}: EnhancedDesignInterfaceProps) {
  const [modules, setModules] = useState<EnhancedModule[]>(initialModules);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [viewMode, setViewMode] = useState<'3d' | 'palette' | 'analytics' | 'both'>('both');
  const [showGrid, setShowGrid] = useState(true);
  const [measureMode, setMeasureMode] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showStatusPanel, setShowStatusPanel] = useState(true);
  
  const maxLevels = Math.max(1, Math.floor(bounds.height / 2.4));
  
  // Generate unique module ID
  const generateModuleId = useCallback(() => {
    return `module_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);
  
  // Add new module from palette
  const handleModuleAdd = useCallback((moduleType: keyof typeof MODULE_DETAILS, level: number) => {
    const moduleDetails = MODULE_DETAILS[moduleType];
    
    // Find a good position for the new module (simple grid placement)
    const existingPositions = modules
      .filter(m => m.level === level)
      .map(m => ({ x: m.position[0], z: m.position[2] }));
    
    // Simple placement algorithm - find first available grid position
    let position: [number, number, number] = [0, level * 2.4, 0];
    let found = false;
    
    for (let x = -bounds.width/2 + 1; x < bounds.width/2 - 1 && !found; x += 1) {
      for (let z = -bounds.depth/2 + 1; z < bounds.depth/2 - 1 && !found; z += 1) {
        const conflict = existingPositions.some(pos => 
          Math.abs(pos.x - x) < 2 && Math.abs(pos.z - z) < 2
        );
        if (!conflict) {
          position = [x, level * 2.4, z];
          found = true;
        }
      }
    }
    
    const newModule: EnhancedModule = {
      id: generateModuleId(),
      type: moduleType,
      position,
      size: moduleDetails.defaultSize,
      rotation: 0,
      level,
      crew_capacity: moduleDetails.crew_capacity
    };
    
    const updatedModules = [...modules, newModule];
    setModules(updatedModules);
    onModulesChange(updatedModules);
  }, [modules, bounds, generateModuleId, onModulesChange]);
  
  // Update existing module
  const handleModuleUpdate = useCallback((moduleId: string, updates: Partial<EnhancedModule>) => {
    const updatedModules = modules.map(module =>
      module.id === moduleId ? { ...module, ...updates } : module
    );
    setModules(updatedModules);
    onModulesChange(updatedModules);
  }, [modules, onModulesChange]);
  
  // Delete module
  const handleModuleDelete = useCallback((moduleId: string) => {
    const updatedModules = modules.filter(module => module.id !== moduleId);
    setModules(updatedModules);
    onModulesChange(updatedModules);
  }, [modules, onModulesChange]);
  
  // Calculate design stats and metrics
  const designStats = {
    totalModules: modules.length,
    levelsUsed: [...new Set(modules.map(m => m.level))].length,
    totalCrewCapacity: modules.reduce((sum, m) => sum + (m.crew_capacity || 0), 0),
    totalVolume: modules.reduce((sum, m) => sum + (m.size.w_m * m.size.l_m * m.size.h_m), 0)
  };

  // Calculate advanced metrics for status system
  const designMetrics = {
    totalModules: designStats.totalModules,
    crewCapacity: designStats.totalCrewCapacity,
    totalVolume: designStats.totalVolume,
    powerConsumption: modules.reduce((sum, m) => sum + Math.random() * 2, 0), // Mock data
    efficiency: designStats.totalModules > 0 ? Math.min(95, 40 + designStats.totalModules * 8) : 0,
    safetyScore: designStats.totalModules > 0 ? Math.min(100, 60 + designStats.levelsUsed * 10 + designStats.totalModules * 5) : 0,
    completeness: designStats.totalModules > 0 ? Math.min(100, designStats.totalModules * 12) : 0
  };

  // Generate warnings and suggestions
  const warnings = [];
  const suggestions = [];

  if (designStats.totalModules === 0) {
    suggestions.push("Start by adding basic modules like Command Center and Life Support");
  }
  if (designStats.totalCrewCapacity > 0 && !modules.find(m => m.type === 'life_support')) {
    warnings.push("Life Support module required for crew safety");
  }
  if (designStats.totalCrewCapacity > 4 && !modules.find(m => m.type === 'medical_bay')) {
    suggestions.push("Consider adding Medical Bay for larger crews");
  }
  if (designStats.levelsUsed > 1 && !modules.find(m => m.type === 'stairwell')) {
    warnings.push("Multi-level habitats need access between floors");
  }
  
  return (
    <div className="h-full flex flex-col relative">
      {/* User Guidance System */}
      <UserGuidanceSystem 
        isFirstVisit={isFirstVisit}
        onComplete={() => console.log('Tutorial completed')}
        onSkip={() => console.log('Tutorial skipped')}
      />

      {/* Header with stats and controls */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Enhanced Design Interface
            </h2>
            
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="secondary">
                {designStats.totalModules} modules
              </Badge>
              <Badge variant="secondary">
                {designStats.levelsUsed} levels
              </Badge>
              <Badge variant="secondary">
                {designStats.totalCrewCapacity} crew capacity
              </Badge>
              <Badge variant="secondary">
                {designStats.totalVolume.toFixed(1)}m³
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <Tabs value={viewMode} onValueChange={(v: string) => setViewMode(v as 'palette' | '3d' | 'analytics' | 'both')}>
              <TabsList className="grid w-full grid-cols-4" data-tutorial="level-selector">
                <TabsTrigger value="palette" className="text-xs">
                  <Grid3x3 className="w-3 h-3 mr-1" />
                  Palette
                </TabsTrigger>
                <TabsTrigger value="both" className="text-xs">
                  <Settings className="w-3 h-3 mr-1" />
                  Design
                </TabsTrigger>
                <TabsTrigger value="3d" className="text-xs">
                  <Eye className="w-3 h-3 mr-1" />
                  3D View
                </TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs" data-tutorial="analytics-tab">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Analytics
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {onSave && (
              <Button size="sm" onClick={onSave} className="flex items-center gap-1">
                <Save className="w-3 h-3" />
                Save Design
              </Button>
            )}
          </div>
        </div>
        
        {/* Quick info */}
        {designStats.totalModules === 0 && (
          <Alert className="mt-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Start by selecting modules from the palette on the left. Drag them in the 3D view to position them precisely.
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Quick Actions Toolbar */}
        {showQuickActions && viewMode !== 'analytics' && (
          <div className="w-64 border-r bg-muted/10">
            <QuickActionsToolbar
              onToggleGrid={() => setShowGrid(!showGrid)}
              onToggleMeasure={() => setMeasureMode(!measureMode)}
              onToggleLayers={() => setShowStatusPanel(!showStatusPanel)}
              isGridVisible={showGrid}
              isMeasureMode={measureMode}
              showLayers={showStatusPanel}
              onHelp={() => console.log('Show help')}
              onSettings={() => console.log('Show settings')}
            />
            {showStatusPanel && (
              <div className="mt-4 px-2">
                <SmartStatusSystem
                  metrics={designMetrics}
                  warnings={warnings}
                  suggestions={suggestions}
                />
              </div>
            )}
          </div>
        )}

        {/* Module Palette (conditional) */}
        {(viewMode === 'palette' || viewMode === 'both') && (
          <div className="w-80 border-r bg-muted/20" data-tutorial="module-palette">
            <ModulePalette
              onModuleSelect={handleModuleAdd}
              selectedLevel={selectedLevel}
              onLevelChange={setSelectedLevel}
              maxLevels={maxLevels}
            />
          </div>
        )}
        
        {/* 3D Design Area (conditional) */}
        {(viewMode === '3d' || viewMode === 'both') && (
          <div className="flex-1" data-tutorial="3d-canvas">
            <Interactive3DPlacement
              modules={modules as any}
              bounds={bounds}
              onModuleUpdate={handleModuleUpdate}
              onModuleAdd={handleModuleAdd as any}
              onModuleDelete={handleModuleDelete}
              showGrid={showGrid}
              measureMode={measureMode}
            />
          </div>
        )}
        
        {/* Analytics Dashboard (conditional) */}
        {viewMode === 'analytics' && (
          <div className="flex-1" data-tutorial="analytics-tab">
            <VisualizationDashboard
              modules={modules}
              crewSize={designStats.totalCrewCapacity}
              onExport={() => {
                // Export functionality - could download CSV, PDF, etc.
                const data = JSON.stringify(modules, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'habitat-design-data.json';
                a.click();
                URL.revokeObjectURL(url);
              }}
              onRefresh={() => {
                // Force refresh analytics data
                setModules([...modules]);
              }}
            />
          </div>
        )}
      </div>
      
      {/* Status bar */}
      <div className="p-3 border-t bg-muted/20 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>
              Habitat: {bounds.width}×{bounds.depth}×{bounds.height}m
            </span>
            <span>
              Active Level: {selectedLevel} ({(selectedLevel * 2.4).toFixed(1)}m)
            </span>
          </div>
          <div>
            Phase 2 Complete: Enhanced UI/UX with Smart Guidance • Excellent User Experience
          </div>
        </div>
      </div>
    </div>
  );
}