import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { Layout, Module } from '@/lib/schemas';
import { MODULE_PRESETS, targetAreaM2, areaStatus, type StatusColor } from '@/lib/DEFAULTS';

interface ModuleBuilderProps {
  layout: Layout;
  onChange: (updatedLayout: Layout) => void;
  className?: string;
}

const StatusBadge = ({ status, children }: { status: StatusColor; children: React.ReactNode }) => {
  const variants: Record<StatusColor, string> = {
    green: 'bg-green-100 text-green-800 border-green-200',
    amber: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200'
  };
  
  return (
    <Badge className={variants[status]}>
      {children}
    </Badge>
  );
};

export function ModuleBuilder({ layout, onChange, className = "" }: ModuleBuilderProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  
  const addModule = (presetIndex: number) => {
    const preset = MODULE_PRESETS[presetIndex];
    if (!preset) return;
    
    const newModule: Module = {
      id: `module-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: preset.type,
      level: 0,
      position: [0, 0],
      size: preset.defaultSize,
      rotation_deg: 0,
      equipment: []
    };
    
    const updatedLayout: Layout = {
      ...layout,
      modules: [...layout.modules, newModule]
    };
    
    onChange(updatedLayout);
  };
  
  const removeModule = (moduleId: string) => {
    const updatedLayout: Layout = {
      ...layout,
      modules: layout.modules.filter(m => m.id !== moduleId)
    };
    
    onChange(updatedLayout);
    
    if (selectedModuleId === moduleId) {
      setSelectedModuleId(null);
    }
  };
  
  const getModuleArea = (module: Module): number => {
    return module.size.w_m * module.size.l_m;
  };
  
  const getModuleStatus = (module: Module): StatusColor => {
    const actualArea = getModuleArea(module);
    return areaStatus(actualArea, module.type, layout.scenario.crew_size);
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-1 gap-4 h-full">
        {/* Module Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Module Library</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {MODULE_PRESETS.map((preset, index) => {
                const targetArea = targetAreaM2(preset.type, layout.scenario.crew_size);
                const actualArea = preset.defaultSize.w_m * preset.defaultSize.l_m;
                const status = targetArea ? areaStatus(actualArea, preset.type, layout.scenario.crew_size) : 'green';
                
                return (
                  <Button
                    key={preset.type}
                    variant="outline"
                    className="h-auto p-3 flex flex-col items-center gap-2"
                    onClick={() => addModule(index)}
                  >
                    <Plus className="w-4 h-4" />
                    <div className="text-xs text-center">
                      <div className="font-medium">{preset.label}</div>
                      <div className="text-muted-foreground">
                        {preset.defaultSize.w_m}×{preset.defaultSize.l_m}m
                      </div>
                      <StatusBadge status={status}>
                        {actualArea.toFixed(1)}m²
                      </StatusBadge>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Current Modules */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>
              Current Design ({layout.modules.length} modules)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {layout.modules.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No modules added yet. Select modules from the library above to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {layout.modules.map((module) => {
                  const preset = MODULE_PRESETS.find(p => p.type === module.type);
                  const actualArea = getModuleArea(module);
                  const status = getModuleStatus(module);
                  const targetArea = targetAreaM2(module.type, layout.scenario.crew_size);
                  const isSelected = selectedModuleId === module.id;
                  
                  return (
                    <div
                      key={module.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
                      }`}
                      onClick={() => setSelectedModuleId(isSelected ? null : module.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium">
                            {preset?.label || module.type}
                          </div>
                          <StatusBadge status={status}>
                            {actualArea.toFixed(1)}m²
                            {targetArea && ` / ${targetArea.toFixed(1)}m² target`}
                          </StatusBadge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-muted-foreground">
                            {module.size.w_m}×{module.size.l_m}×{module.size.h_m}m
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeModule(module.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t text-xs space-y-1">
                          <div><strong>ID:</strong> {module.id}</div>
                          <div><strong>Type:</strong> {module.type}</div>
                          <div><strong>Level:</strong> {module.level}</div>
                          <div><strong>Position:</strong> [{module.position.join(', ')}]</div>
                          <div><strong>Volume:</strong> {(module.size.w_m * module.size.l_m * module.size.h_m).toFixed(2)}m³</div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Summary */}
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Total Area</div>
                      <div className="text-muted-foreground">
                        {layout.modules.reduce((sum, m) => sum + getModuleArea(m), 0).toFixed(1)}m²
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Total Volume</div>
                      <div className="text-muted-foreground">
                        {layout.modules.reduce((sum, m) => sum + (m.size.w_m * m.size.l_m * m.size.h_m), 0).toFixed(1)}m³
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Green Status</div>
                      <div className="text-green-600">
                        {layout.modules.filter(m => getModuleStatus(m) === 'green').length}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Issues</div>
                      <div className="text-red-600">
                        {layout.modules.filter(m => getModuleStatus(m) === 'red').length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}