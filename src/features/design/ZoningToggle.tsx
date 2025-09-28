import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ZoningToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  className?: string
}

const zoneOptions = [
  { id: 'sleep', label: 'Sleep', icon: '🛏️', color: 'zone-sleep' },
  { id: 'hygiene', label: 'Hygiene', icon: '🚿', color: 'zone-hygiene' },
  { id: 'food', label: 'Food', icon: '🍳', color: 'zone-food' },
  { id: 'exercise', label: 'Exercise', icon: '🏋️', color: 'zone-exercise' },
  { id: 'medical', label: 'Medical', icon: '🏥', color: 'zone-medical' },
  { id: 'stowage', label: 'Storage', icon: '📦', color: 'zone-stowage' },
  { id: 'work', label: 'Work', icon: '💻', color: 'zone-work' },
  { id: 'common', label: 'Common', icon: '👥', color: 'zone-common' },
  { id: 'airlock', label: 'Airlock', icon: '🚪', color: 'zone-airlock' },
] as const

export const ZoningToggle: React.FC<ZoningToggleProps> = ({
  enabled,
  onToggle,
  className
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Main toggle */}
      <div className="flex items-center gap-4">
        <Button
          variant={enabled ? 'primary' : 'surface'}
          size="md"
          onClick={() => onToggle(!enabled)}
          className="flex items-center gap-2"
        >
          <div className="w-4 h-4 flex items-center justify-center">
            {enabled ? '👁️' : '👁️‍🗨️'}
          </div>
          Zoning Overlay
        </Button>
        
        {enabled && (
          <div className="text-sm text-muted-foreground">
            Showing functional area zones and adjacency rules
          </div>
        )}
      </div>
      
      {/* Zone legend when enabled */}
      {enabled && (
        <div className="glass p-4 rounded-lg animate-fade-in">
          <h4 className="text-sm font-medium text-text mb-3">Functional Zones</h4>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
            {zoneOptions.map((zone) => (
              <div
                key={zone.id}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-md text-xs",
                  zone.color
                )}
              >
                <div className="text-base">{zone.icon}</div>
                <span className="text-center leading-tight">{zone.label}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-3 border-t border-muted text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0 border-t-2 border-dashed border-success"></div>
                <span>Preferred Adjacent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0 border-t-2 border-dotted border-danger"></div>
                <span>Must Separate</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ZoningToggle