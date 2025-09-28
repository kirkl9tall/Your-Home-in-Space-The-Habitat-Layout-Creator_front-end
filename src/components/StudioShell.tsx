import React from 'react'
import { cn } from '@/lib/utils'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { 
  FolderTree, 
  Activity, 
  Grid3x3, 
  ZoomIn, 
  ZoomOut,
  Command,
  Play,
  Square,
  RotateCcw
} from 'lucide-react'
import { Button } from './ui/button'
import { ThemeToggle } from './ThemeToggle'
import DesignCanvas from '../features/design/DesignCanvas'
import { Layout } from '../lib/schemas'

// Sample layout for demonstration
const SAMPLE_LAYOUT: Layout = {
  scenario: {
    crew_size: 4,
    mission_duration_days: 180,
    destination: "MARS_SURFACE",
    fairing: {
      name: "Starship",
      inner_diameter_m: 8.0,
      inner_height_m: 18.0,
      shape: "CYLINDER"
    }
  },
  habitat: {
    shape: "CYLINDER",
    levels: 1,
    dimensions: {
      diameter_m: 8.0,
      height_m: 3.0
    },
    pressurized_volume_m3: 150.8,
    net_habitable_volume_m3: 120.6
  },
  modules: [
    {
      id: "sleep-1",
      type: "CREW_SLEEP",
      level: 0,
      position: [1, 1],
      size: { w_m: 2.0, l_m: 2.2, h_m: 2.1 },
      rotation_deg: 0,
      equipment: ["bunk", "storage"]
    },
    {
      id: "sleep-2",
      type: "CREW_SLEEP",
      level: 0,
      position: [4, 1],
      size: { w_m: 2.0, l_m: 2.2, h_m: 2.1 },
      rotation_deg: 0,
      equipment: ["bunk", "storage"]
    },
    {
      id: "airlock-1",
      type: "AIRLOCK",
      level: 0,
      position: [7, 4],
      size: { w_m: 2.0, l_m: 2.2, h_m: 2.3 },
      rotation_deg: 0,
      equipment: ["suit_storage"]
    },
    {
      id: "galley-1",
      type: "FOOD_PREP",
      level: 0,
      position: [1, 4],
      size: { w_m: 3.0, l_m: 3.0, h_m: 2.2 },
      rotation_deg: 0,
      equipment: ["microwave", "water_dispenser"]
    },
    {
      id: "common-1",
      type: "COMMON_AREA",
      level: 0,
      position: [4, 7],
      size: { w_m: 3.0, l_m: 3.0, h_m: 2.2 },
      rotation_deg: 0,
      equipment: ["table", "viewing_port"]
    }
  ],
  version: "1.0.0"
}

interface StudioShellProps {
  children?: React.ReactNode
}

export function StudioShell({ }: StudioShellProps) {
  const [showZoning, setShowZoning] = React.useState(false)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState<string>()

  return (
    <div className="flex flex-col h-screen bg-bg-0 text-txt noise-texture">
      {/* Toolbar */}
      <div className="flex items-center h-12 px-4 bg-bg-1 border-b border-line shadow-panel">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-9 h-9">
            <FolderTree className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-line mx-2" />
          
          <Button 
            variant={isPlaying ? "primary" : "ghost"} 
            size="icon" 
            className="w-9 h-9"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          
          <Button variant="ghost" size="icon" className="w-9 h-9">
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-line mx-2" />
          
          <Button 
            variant={showZoning ? "primary" : "ghost"} 
            size="icon" 
            className="w-9 h-9"
            onClick={() => setShowZoning(!showZoning)}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2">
            <Command className="w-4 h-4" />
            <span className="text-xs">⌘K</span>
          </Button>
          <ThemeToggle />
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Left Sidebar - Hierarchy */}
          <Panel defaultSize={20} minSize={15} maxSize={35}>
            <div className="h-full panel-surface">
              <div className="p-3 border-b border-line">
                <h2 className="text-sm font-medium text-txt">Hierarchy</h2>
              </div>
              <div className="p-2 space-y-1">
                {SAMPLE_LAYOUT.modules.map(m => (
                  <div 
                    key={m.id}
                    className={cn(
                      "px-2 py-1.5 text-sm rounded cursor-pointer transition-colors",
                      selectedId === m.id 
                        ? "bg-accent text-bg-0" 
                        : "hover:bg-bg-2"
                    )}
                    onClick={() => setSelectedId(m.id)}
                  >
                    📦 {m.type.replace(/_/g, ' ')}
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-line hover:bg-accent transition-colors" />

          {/* Center - Scene Viewport */}
          <Panel defaultSize={60}>
            <div className="h-full bg-bg-0 relative">
              {/* Viewport Controls */}
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button variant="ghost" size="icon" className="w-8 h-8 bg-bg-1/80 backdrop-blur">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8 bg-bg-1/80 backdrop-blur">
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </div>

              {/* Design Canvas */}
              <DesignCanvas 
                layout={SAMPLE_LAYOUT}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-line hover:bg-accent transition-colors" />

          {/* Right Sidebar - Inspector */}
          <Panel defaultSize={20} minSize={15} maxSize={35}>
            <div className="h-full panel-surface">
              <div className="p-3 border-b border-line">
                <h2 className="text-sm font-medium text-txt">Inspector</h2>
              </div>
              {selectedId && (
                <div className="p-3 space-y-4">
                  {(() => {
                    const module = SAMPLE_LAYOUT.modules.find(m => m.id === selectedId)
                    if (!module) return null
                    
                    return (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-txt-muted uppercase tracking-wide">
                            Module Type
                          </label>
                          <div className="text-sm text-txt">{module.type.replace(/_/g, ' ')}</div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-txt-muted uppercase tracking-wide">
                            Position
                          </label>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              value={module.position[0]}
                              className="flex-1 px-2 py-1 text-xs bg-bg-0 border border-line rounded focus-ring"
                            />
                            <input 
                              type="number" 
                              value={module.position[1]}
                              className="flex-1 px-2 py-1 text-xs bg-bg-0 border border-line rounded focus-ring"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-txt-muted uppercase tracking-wide">
                            Size (m)
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            <input 
                              type="number" 
                              value={module.size.w_m}
                              placeholder="W"
                              className="px-2 py-1 text-xs bg-bg-0 border border-line rounded focus-ring"
                            />
                            <input 
                              type="number" 
                              value={module.size.l_m}
                              placeholder="L"
                              className="px-2 py-1 text-xs bg-bg-0 border border-line rounded focus-ring"
                            />
                            <input 
                              type="number" 
                              value={module.size.h_m}
                              placeholder="H"
                              className="px-2 py-1 text-xs bg-bg-0 border border-line rounded focus-ring"
                            />
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Bottom Panel - Metrics */}
      <div className="h-16 bg-bg-1 border-t border-line px-4 flex items-center gap-4 shadow-panel">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" />
          <span className="text-xs font-mono text-txt-muted">NHV:</span>
          <span className="text-sm font-mono text-txt">120.6m³</span>
        </div>
        
        <div className="w-px h-6 bg-line" />
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-txt-muted">Modules:</span>
          <span className="text-sm font-mono text-success">{SAMPLE_LAYOUT.modules.length}</span>
        </div>
        
        <div className="w-px h-6 bg-line" />
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-txt-muted">Selected:</span>
          <span className="text-sm font-mono text-txt">{selectedId || 'None'}</span>
        </div>
      </div>
    </div>
  )
}