import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Grip, Grid3x3 } from 'lucide-react';

// Module categories for better organization
const MODULE_CATEGORIES = {
  LIVING: {
    name: 'Living & Personal',
    color: 'bg-blue-100 text-blue-800',
    modules: ['CREW_SLEEP', 'HYGIENE', 'COMMON_AREA', 'RECREATION']
  },
  OPERATIONAL: {
    name: 'Operations & Work',
    color: 'bg-purple-100 text-purple-800', 
    modules: ['WORKSTATION', 'MEDICAL', 'GLOVEBOX', 'AIRLOCK']
  },
  LIFE_SUPPORT: {
    name: 'Life Support',
    color: 'bg-gray-100 text-gray-800',
    modules: ['ECLSS', 'WASTE', 'TRASH_MGMT', 'MAINTENANCE']
  },
  LOGISTICS: {
    name: 'Storage & Logistics',
    color: 'bg-green-100 text-green-800',
    modules: ['STOWAGE', 'FOOD_PREP']
  },
  FITNESS: {
    name: 'Health & Fitness', 
    color: 'bg-orange-100 text-orange-800',
    modules: ['EXERCISE']
  },
  CUSTOM: {
    name: 'Custom',
    color: 'bg-indigo-100 text-indigo-800',
    modules: ['CUSTOM_CAD']
  }
} as const;

const MODULE_DETAILS = {
  CREW_SLEEP: { 
    icon: '🛏️', 
    name: 'Sleep Quarters', 
    description: 'Individual crew sleeping areas with privacy',
    defaultSize: { w_m: 2.0, l_m: 2.2, h_m: 2.1 },
    crew_capacity: 1
  },
  HYGIENE: { 
    icon: '🚿', 
    name: 'Hygiene Station',
    description: 'Personal hygiene and sanitation facilities', 
    defaultSize: { w_m: 1.8, l_m: 1.5, h_m: 2.1 },
    crew_capacity: 1
  },
  WASTE: { 
    icon: '🚽', 
    name: 'Waste Management',
    description: 'Waste collection and processing systems',
    defaultSize: { w_m: 1.5, l_m: 1.8, h_m: 2.1 },
    crew_capacity: 0
  },
  EXERCISE: { 
    icon: '💪', 
    name: 'Exercise Equipment',
    description: 'Physical fitness and health maintenance',
    defaultSize: { w_m: 3.0, l_m: 2.5, h_m: 2.2 },
    crew_capacity: 2
  },
  FOOD_PREP: { 
    icon: '🍳', 
    name: 'Food Preparation',
    description: 'Kitchen facilities for meal preparation',
    defaultSize: { w_m: 2.5, l_m: 2.0, h_m: 2.1 },
    crew_capacity: 3
  },
  ECLSS: { 
    icon: '🔧', 
    name: 'Life Support',
    description: 'Environmental Control & Life Support Systems',
    defaultSize: { w_m: 2.8, l_m: 2.2, h_m: 2.4 },
    crew_capacity: 0
  },
  MEDICAL: { 
    icon: '⚕️', 
    name: 'Medical Bay',
    description: 'Healthcare and medical treatment facilities',
    defaultSize: { w_m: 3.0, l_m: 2.5, h_m: 2.2 },
    crew_capacity: 2
  },
  MAINTENANCE: { 
    icon: '🔨', 
    name: 'Maintenance Shop',
    description: 'Equipment repair and maintenance workspace',
    defaultSize: { w_m: 2.5, l_m: 3.0, h_m: 2.3 },
    crew_capacity: 2
  },
  STOWAGE: { 
    icon: '📦', 
    name: 'Storage',
    description: 'General storage and supply management',
    defaultSize: { w_m: 2.0, l_m: 2.0, h_m: 2.1 },
    crew_capacity: 0
  },
  RECREATION: { 
    icon: '🎮', 
    name: 'Recreation Area',
    description: 'Entertainment and leisure activities',
    defaultSize: { w_m: 3.5, l_m: 3.0, h_m: 2.2 },
    crew_capacity: 4
  },
  WORKSTATION: { 
    icon: '💻', 
    name: 'Workstation',
    description: 'Computer workstations and data analysis',
    defaultSize: { w_m: 2.0, l_m: 1.5, h_m: 2.1 },
    crew_capacity: 1
  },
  AIRLOCK: { 
    icon: '🚪', 
    name: 'Airlock',
    description: 'Entry/exit access with pressure management',
    defaultSize: { w_m: 2.5, l_m: 2.5, h_m: 2.4 },
    crew_capacity: 2
  },
  GLOVEBOX: { 
    icon: '🧤', 
    name: 'Science Glovebox',
    description: 'Controlled environment for experiments',
    defaultSize: { w_m: 1.8, l_m: 1.2, h_m: 1.8 },
    crew_capacity: 1
  },
  TRASH_MGMT: { 
    icon: '🗑️', 
    name: 'Trash Management',
    description: 'Waste compaction and disposal systems',
    defaultSize: { w_m: 1.5, l_m: 1.5, h_m: 2.0 },
    crew_capacity: 0
  },
  COMMON_AREA: { 
    icon: '👥', 
    name: 'Common Area',
    description: 'Shared social and meeting space',
    defaultSize: { w_m: 4.0, l_m: 3.5, h_m: 2.3 },
    crew_capacity: 6
  },
  CUSTOM_CAD: { 
    icon: '🎨', 
    name: 'Custom Module',
    description: 'User-defined custom module design',
    defaultSize: { w_m: 2.0, l_m: 2.0, h_m: 2.1 },
    crew_capacity: 0
  }
} as const;

export { MODULE_DETAILS };

interface ModulePaletteProps {
  onModuleSelect: (moduleType: keyof typeof MODULE_DETAILS, level: number) => void;
  selectedLevel: number;
  onLevelChange: (level: number) => void;
  maxLevels: number;
}

export function ModulePalette({ 
  onModuleSelect, 
  selectedLevel, 
  onLevelChange, 
  maxLevels 
}: ModulePaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof MODULE_CATEGORIES | 'ALL'>('ALL');

  // Filter modules based on search and category
  const getFilteredModules = () => {
    let modules = Object.entries(MODULE_DETAILS);
    
    if (selectedCategory !== 'ALL') {
      const categoryModules = MODULE_CATEGORIES[selectedCategory].modules;
      modules = modules.filter(([type]) => (categoryModules as readonly string[]).includes(type));
    }
    
    if (searchQuery) {
      modules = modules.filter(([, details]) =>
        details.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        details.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return modules;
  };

  const handleModuleClick = (moduleType: keyof typeof MODULE_DETAILS) => {
    onModuleSelect(moduleType, selectedLevel);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Grid3x3 className="w-5 h-5" />
          Module Palette
        </CardTitle>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Level Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Target Level:</span>
          <div className="flex gap-1">
            {Array.from({ length: maxLevels }, (_, i) => (
              <Button
                key={i}
                size="sm"
                variant={selectedLevel === i ? "default" : "outline"}
                onClick={() => onLevelChange(i)}
                className="w-8 h-8 p-0"
              >
                {i}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Category Filters */}
        <div className="px-4 pb-3">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              <Button
                size="sm"
                variant={selectedCategory === 'ALL' ? "default" : "outline"}
                onClick={() => setSelectedCategory('ALL')}
                className="text-xs"
              >
                All
              </Button>
              {Object.entries(MODULE_CATEGORIES).map(([key, category]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={selectedCategory === key ? "default" : "outline"}
                  onClick={() => setSelectedCategory(key as keyof typeof MODULE_CATEGORIES)}
                  className="text-xs whitespace-nowrap"
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
        
        {/* Module Grid */}
        <ScrollArea className="h-[600px]">
          <div className="px-4 pb-4 space-y-3">
            {getFilteredModules().map(([moduleType, details]) => {
              // Find category for coloring
              const categoryEntry = Object.entries(MODULE_CATEGORIES).find(([, cat]) =>
                (cat.modules as readonly string[]).includes(moduleType)
              );
              const categoryColor = categoryEntry ? categoryEntry[1].color : 'bg-gray-100 text-gray-800';
              
              return (
                <div
                  key={moduleType}
                  className="border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => handleModuleClick(moduleType as keyof typeof MODULE_DETAILS)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{details.icon}</span>
                      <div>
                        <h4 className="font-medium text-sm">{details.name}</h4>
                        <Badge className={`text-xs ${categoryColor}`}>
                          {categoryEntry?.[1].name || 'Other'}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleModuleClick(moduleType as keyof typeof MODULE_DETAILS);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {details.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {details.defaultSize.w_m}×{details.defaultSize.l_m}×{details.defaultSize.h_m}m
                    </span>
                    <span className="flex items-center gap-1">
                      <Grip className="w-3 h-3" />
                      {details.crew_capacity} crew
                    </span>
                  </div>
                </div>
              );
            })}
            
            {getFilteredModules().length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No modules found</p>
                <p className="text-xs">Try adjusting your search or category filter</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}