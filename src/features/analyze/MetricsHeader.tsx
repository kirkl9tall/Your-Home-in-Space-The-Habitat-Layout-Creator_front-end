import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  status?: 'success' | 'warning' | 'danger'
  icon?: React.ReactNode
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  label, 
  value, 
  unit, 
  status, 
  icon 
}) => {
  return (
    <Card className="glass">
      <CardContent className="flex items-center gap-3 p-4">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-text">
              {value}
            </p>
            {unit && (
              <p className="text-sm text-muted-foreground">
                {unit}
              </p>
            )}
            {status && (
              <Badge variant={status} className="ml-auto">
                {status === 'success' && '✓'}
                {status === 'warning' && '!'}
                {status === 'danger' && '×'}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface MetricsHeaderProps {
  nhv?: number
  pressurizedVolume?: number
  utilization?: number
  corridorStatus?: 'success' | 'warning' | 'danger'
}

export const MetricsHeader: React.FC<MetricsHeaderProps> = ({
  nhv = 0,
  pressurizedVolume = 0,
  utilization = 0,
  corridorStatus = 'success'
}) => {
  // Calculate status based on values
  const getUtilizationStatus = (util: number) => {
    if (util > 85) return 'danger'
    if (util > 70) return 'warning' 
    return 'success'
  }
  
  const getNHVStatus = (nhv: number) => {
    if (nhv < 50) return 'danger'
    if (nhv < 100) return 'warning'
    return 'success'
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard
        label="Net Habitable Volume"
        value={nhv.toFixed(1)}
        unit="m³"
        status={getNHVStatus(nhv)}
        icon={<div className="text-primary">🏠</div>}
      />
      
      <MetricCard
        label="Pressurized Volume" 
        value={pressurizedVolume.toFixed(1)}
        unit="m³"
        icon={<div className="text-primary">🫧</div>}
      />
      
      <MetricCard
        label="Utilization"
        value={utilization.toFixed(1)}
        unit="%"
        status={getUtilizationStatus(utilization)}
        icon={<div className="text-primary">📊</div>}
      />
      
      <MetricCard
        label="Corridor Status"
        value={corridorStatus === 'success' ? 'OK' : corridorStatus === 'warning' ? 'CHECK' : 'BLOCKED'}
        status={corridorStatus}
        icon={<div className="text-primary">🚶</div>}
      />
    </div>
  )
}

export default MetricsHeader