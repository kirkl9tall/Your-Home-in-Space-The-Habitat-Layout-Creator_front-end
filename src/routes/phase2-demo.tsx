import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Rocket, ArrowRight, CheckCircle, BarChart3, Layers, Palette } from 'lucide-react'

import { EnhancedDesignInterface } from '@/features/design/EnhancedDesignInterface'
import { MODULE_DETAILS } from '@/features/design/ModulePalette'

// Enhanced module interface matching the design interface
interface DemoModule {
  id: string;
  type: keyof typeof MODULE_DETAILS;
  position: [number, number, number];
  size: { w_m: number; l_m: number; h_m: number };
  rotation: number;
  level: number;
  crew_capacity?: number;
}

// Sample habitat bounds for demonstration
const DEMO_BOUNDS = {
  width: 12,
  depth: 10,
  height: 6
};

// Sample pre-configured modules for demonstration
const DEMO_MODULES: DemoModule[] = [
  {
    id: 'demo_command',
    type: 'command_center' as keyof typeof MODULE_DETAILS,
    position: [0, 0, 0] as [number, number, number],
    size: { w_m: 3, l_m: 3, h_m: 2.4 },
    rotation: 0,
    level: 0,
    crew_capacity: 2
  },
  {
    id: 'demo_life_support',
    type: 'life_support' as keyof typeof MODULE_DETAILS,
    position: [3.5, 0, 0] as [number, number, number],
    size: { w_m: 2, l_m: 2, h_m: 2.4 },
    rotation: 0,
    level: 0,
    crew_capacity: 0
  },
  {
    id: 'demo_crew_quarters',
    type: 'crew_quarters' as keyof typeof MODULE_DETAILS,
    position: [0, 2.4, 0] as [number, number, number],
    size: { w_m: 2, l_m: 4, h_m: 2.4 },
    rotation: 0,
    level: 1,
    crew_capacity: 4
  },
  {
    id: 'demo_laboratory',
    type: 'laboratory' as keyof typeof MODULE_DETAILS,
    position: [-3, 0, 0] as [number, number, number],
    size: { w_m: 2.5, l_m: 3, h_m: 2.4 },
    rotation: 0,
    level: 0,
    crew_capacity: 2
  }
];

export const Route = createFileRoute('/phase2-demo')({
  component: Phase2DemoComponent
})

function Phase2DemoComponent() {
  const [currentDemo, setCurrentDemo] = useState<'overview' | 'design'>('overview');
  const [demoModules, setDemoModules] = useState<DemoModule[]>(DEMO_MODULES);

  const handleModulesChange = (modules: DemoModule[]) => {
    setDemoModules(modules);
  };

  const handleSave = () => {
    console.log('Saving habitat design:', demoModules);
    alert('Habitat design saved successfully!');
  };

  if (currentDemo === 'design') {
    return (
      <div className="h-screen">
        <EnhancedDesignInterface
          initialModules={demoModules}
          bounds={DEMO_BOUNDS}
          onModulesChange={handleModulesChange}
          onSave={handleSave}
          isFirstVisit={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Rocket className="w-12 h-12 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Phase 2 Complete: Advanced Visualization Dashboard
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience the complete Phase 2 frontend enhancement with interactive 3D module placement, 
            professional analytics dashboard, and real-time crew traffic analysis.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-600" />
                Interactive 3D Placement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Professional drag-and-drop module placement system with real-time 3D visualization, 
                grid snapping, and multi-level habitat support.
              </p>
              <div className="space-y-2">
                <Badge variant="secondary" className="mr-2">✅ 16 NASA Module Types</Badge>
                <Badge variant="secondary" className="mr-2">✅ Multi-Level Design</Badge>
                <Badge variant="secondary" className="mr-2">✅ Real-Time Feedback</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Analytics Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Comprehensive analytics with professional charts, volume analysis, crew efficiency tracking, 
                and AI-powered optimization recommendations.
              </p>
              <div className="space-y-2">
                <Badge variant="secondary" className="mr-2">✅ 4 Chart Types</Badge>
                <Badge variant="secondary" className="mr-2">✅ Real-Time Analytics</Badge>
                <Badge variant="secondary" className="mr-2">✅ Export Capabilities</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                Traffic Heat Maps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Advanced crew traffic flow visualization with 2D heat maps, hotspot detection, 
                and circulation pattern analysis.
              </p>
              <div className="space-y-2">
                <Badge variant="secondary" className="mr-2">✅ 2D Grid Analysis</Badge>
                <Badge variant="secondary" className="mr-2">✅ Hotspot Detection</Badge>
                <Badge variant="secondary" className="mr-2">✅ Traffic Statistics</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technical Implementation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Technical Implementation Highlights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Phase 2 Step 1: Interactive 3D Placement
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Interactive3DPlacement.tsx - Real-time drag-and-drop system</li>
                  <li>• ModulePalette.tsx - Professional module library with 16 types</li>
                  <li>• EnhancedDesignInterface.tsx - Tabbed interface with view modes</li>
                  <li>• Multi-level habitat support with level targeting</li>
                  <li>• Grid snapping and collision detection</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Phase 2 Step 2: Advanced Visualization
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• AdvancedAnalyticsDashboard.tsx - Professional charts with Recharts</li>
                  <li>• CrewTrafficHeatMap.tsx - 2D heat map visualization</li>
                  <li>• VisualizationDashboard.tsx - Integrated dashboard system</li>
                  <li>• Real-time analytics with volume, power, efficiency metrics</li>
                  <li>• Export functionality for design data</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{DEMO_MODULES.length}</div>
              <div className="text-sm text-muted-foreground">Demo Modules</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {[...new Set(DEMO_MODULES.map(m => m.level))].length}
              </div>
              <div className="text-sm text-muted-foreground">Habitat Levels</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {DEMO_MODULES.reduce((sum, m) => sum + (m.crew_capacity || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Crew Capacity</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {(DEMO_MODULES.reduce((sum, m) => sum + (m.size.w_m * m.size.l_m * m.size.h_m), 0)).toFixed(1)}m³
              </div>
              <div className="text-sm text-muted-foreground">Total Volume</div>
            </CardContent>
          </Card>
        </div>

        {/* Launch Demo */}
        <Card className="text-center">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold mb-4">Ready to Experience Phase 2?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Launch the interactive demo to explore the complete Phase 2 system including 3D module placement, 
              analytics dashboard, and crew traffic visualization - all integrated into a single professional interface.
            </p>
            <Button 
              size="lg" 
              onClick={() => setCurrentDemo('design')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Launch Phase 2 Demo
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Technical Notes */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            Phase 2 Step 2 Complete: Advanced Visualization Dashboard • 
            Built with React + TypeScript + Three.js + Recharts • 
            Professional UI Components + Real-Time Analytics
          </p>
        </div>
      </div>
    </div>
  );
}