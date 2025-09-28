import React from 'react'
import { MetricsHeader } from '@/features/analyze/MetricsHeader'
import { ZoningToggle } from '@/features/design/ZoningToggle'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DesignSystemDemo() {
  const [zoningEnabled, setZoningEnabled] = React.useState(false)

  return (
    <div className="min-h-screen bg-bg text-text p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Theme Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text mb-2">🚀 NASA-Tech Design System</h1>
            <p className="text-muted-foreground">Professional space habitat design components</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Metrics Header Demo */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-text">Mission Metrics</h2>
          <MetricsHeader 
            nhv={245.8}
            pressurizedVolume={320.5}
            utilization={78.2}
            corridorStatus="success"
          />
        </section>

        {/* Zoning Toggle Demo */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-text">Functional Zoning</h2>
          <ZoningToggle 
            enabled={zoningEnabled}
            onToggle={setZoningEnabled}
          />
        </section>

        {/* Button Variants Demo */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-text">Button Variants</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary Action</Button>
            <Button variant="surface">Surface Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="danger">Danger Action</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="link">Link Button</Button>
          </div>
        </section>

        {/* Badge Variants Demo */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-text">Status Badges</h2>
          <div className="flex flex-wrap gap-4">
            <Badge variant="neutral">Neutral Status</Badge>
            <Badge variant="success">✓ Success</Badge>
            <Badge variant="warning">! Warning</Badge>
            <Badge variant="danger">× Danger</Badge>
          </div>
        </section>

        {/* Glass Cards Demo */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-text">Glass Surfaces</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🌙 Lunar Module
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Habitat module designed for lunar surface operations with enhanced radiation shielding.
                </p>
                <div className="flex gap-2">
                  <Badge variant="success">Active</Badge>
                  <Badge variant="neutral">4 Crew</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🔴 Mars Module
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Long-duration habitat for Mars surface missions with advanced life support systems.
                </p>
                <div className="flex gap-2">
                  <Badge variant="warning">Standby</Badge>
                  <Badge variant="neutral">6 Crew</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🌌 Deep Space
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Multi-year transit habitat with rotating sections for artificial gravity generation.
                </p>
                <div className="flex gap-2">
                  <Badge variant="danger">Offline</Badge>
                  <Badge variant="neutral">8 Crew</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Zone Classes Demo */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-text">Functional Zone Classes</h2>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
            <div className="zone-sleep p-4 rounded-lg text-center">
              <div className="text-2xl mb-2">🛏️</div>
              <div className="text-xs">Sleep</div>
            </div>
            <div className="zone-hygiene p-4 rounded-lg text-center">
              <div className="text-2xl mb-2">🚿</div>
              <div className="text-xs">Hygiene</div>
            </div>
            <div className="zone-food p-4 rounded-lg text-center">
              <div className="text-2xl mb-2">🍳</div>
              <div className="text-xs">Food</div>
            </div>
            <div className="zone-exercise p-4 rounded-lg text-center">
              <div className="text-2xl mb-2">🏋️</div>
              <div className="text-xs">Exercise</div>
            </div>
            <div className="zone-medical p-4 rounded-lg text-center">
              <div className="text-2xl mb-2">🏥</div>
              <div className="text-xs">Medical</div>
            </div>
            <div className="zone-stowage p-4 rounded-lg text-center">
              <div className="text-2xl mb-2">📦</div>
              <div className="text-xs">Storage</div>
            </div>
            <div className="zone-work p-4 rounded-lg text-center">
              <div className="text-2xl mb-2">💻</div>
              <div className="text-xs">Work</div>
            </div>
            <div className="zone-common p-4 rounded-lg text-center">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-xs">Common</div>
            </div>
            <div className="zone-airlock p-4 rounded-lg text-center">
              <div className="text-2xl mb-2">🚪</div>
              <div className="text-xs">Airlock</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}