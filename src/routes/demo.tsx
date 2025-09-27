import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { SkyScene } from '../features/space/SkyScene'
import { ScenarioPanel } from '../features/scenario/ScenarioPanel'
import { ModuleBuilder } from '../features/design/ModuleBuilder'
import { ValidateButton } from '../features/analyze/ValidateButton'
import { Layout, Scenario } from '../lib/schemas'
import { FAIRINGS } from '../lib/DEFAULTS'

export const Route = createFileRoute('/demo')({
  component: DemoPage,
})

// Create default layout
const createDefaultLayout = (): Layout => ({
  scenario: {
    crew_size: 4,
    mission_duration_days: 180,
    destination: "LUNAR",
    fairing: {
      name: FAIRINGS[0].name,
      inner_diameter_m: FAIRINGS[0].inner_diameter_m,
      inner_height_m: FAIRINGS[0].inner_height_m,
      shape: FAIRINGS[0].shape === 'OGIVE' ? 'CONE' : 'CYLINDER'
    }
  },
  habitat: {
    shape: "CYLINDER",
    levels: 1,
    dimensions: {
      diameter_m: 8.0,
      height_m: 10.0
    },
    pressurized_volume_m3: 500,
    net_habitable_volume_m3: 400
  },
  modules: [],
  version: "1.0.0"
});

function DemoPage() {
  const [layout, setLayout] = useState<Layout>(createDefaultLayout());

  const handleScenarioChange = (scenario: Scenario) => {
    setLayout(prev => ({
      ...prev,
      scenario
    }));
  };

  const handleLayoutChange = (updatedLayout: Layout) => {
    setLayout(updatedLayout);
  };

  const handlePatch = (patch: any) => {
    console.log('Applying patch:', patch);
    // Mock patch application
  };

  return (
    <div className="w-full h-screen bg-black text-white relative">
      {/* Star Sky Background */}
      <div className="absolute inset-0 z-0">
        <SkyScene 
          seed={42}
          starCount={8000}
          far={1000}
          sunDirection={[1, 0.3, 0.5]}
          className="w-full h-full"
        />
      </div>
      
      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 bg-black/20 backdrop-blur-sm">
        <div className="grid grid-cols-12 h-full">
          {/* Left Panel - Scenario */}
          <div className="col-span-3 border-r border-white/20 bg-black/30 backdrop-blur-md p-4 overflow-y-auto">
            <ScenarioPanel
              scenario={layout.scenario}
              onChange={handleScenarioChange}
            />
          </div>
          
          {/* Right Panel - Design + Validation */}
          <div className="col-span-9 grid grid-rows-3 gap-4 p-4">
            {/* Top: Module Builder */}
            <div className="row-span-2 bg-black/30 backdrop-blur-md rounded-lg p-4 overflow-y-auto">
              <ModuleBuilder
                layout={layout}
                onChange={handleLayoutChange}
                className="h-full"
              />
            </div>
            
            {/* Bottom: Validation */}
            <div className="bg-black/30 backdrop-blur-md rounded-lg p-4 overflow-y-auto">
              <ValidateButton
                layout={layout}
                onPatch={handlePatch}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-md p-3 rounded-lg text-white border border-white/20">
        <h2 className="text-sm font-bold mb-2">🚀 NASA Habitat Designer Demo</h2>
        <div className="text-xs space-y-1">
          <div>✨ Three.js Star Field Background</div>
          <div>🏗️ Module Builder with Status Indicators</div>
          <div>📋 Scenario Configuration Panel</div>
          <div>🔍 Layout Validation System</div>
          <div>🌌 {layout.modules.length} modules in current design</div>
        </div>
      </div>
    </div>
  )
}