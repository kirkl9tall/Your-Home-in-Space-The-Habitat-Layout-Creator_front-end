import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router'
import { Layout } from './components/Layout'
import NASAHabitatBuilder3D from './components/NASAHabitatBuilder3D'
import DesignSystemDemo from './components/DesignSystemDemo'
import CADStudio from './features/cad/CADStudio'

// Root route
const rootRoute = createRootRoute({
  component: Layout,
})

// Home/3D Builder route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: NASAHabitatBuilder3D,
})

// Design route (3D Builder)
const designRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/design',
  component: NASAHabitatBuilder3D,
})

// Analysis route (placeholder for future analysis tools)
const analysisRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analysis',
  component: () => (
    <div className="flex items-center justify-center h-full bg-background text-foreground">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">NASA Mission Analysis</h2>
        <p className="text-muted-foreground mb-6">Advanced habitat layout analysis and optimization tools</p>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-card-foreground">Coming Soon: Mission analysis features including:</p>
          <ul className="text-left text-muted-foreground mt-4 space-y-1">
            <li>• Volume utilization efficiency</li>
            <li>• Crew workflow optimization</li>
            <li>• Emergency egress path analysis</li>
            <li>• Resource allocation modeling</li>
            <li>• Life support system integration</li>
          </ul>
        </div>
      </div>
    </div>
  ),
})

// Collections route (saved layouts)
const collectionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/collections',
  component: () => (
    <div className="flex items-center justify-center h-full bg-background text-foreground">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">Habitat Collections</h2>
        <p className="text-muted-foreground mb-6">Manage saved habitat layouts and NASA mission templates</p>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-card-foreground">Coming Soon: Collection features including:</p>
          <ul className="text-left text-muted-foreground mt-4 space-y-1">
            <li>• Save and load habitat designs</li>
            <li>• NASA mission template library</li>
            <li>• Version history and comparison</li>
            <li>• Export to CAD formats</li>
            <li>• Team collaboration tools</li>
          </ul>
        </div>
      </div>
    </div>
  ),
})

// Design System Demo route
const demoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/demo',
  component: DesignSystemDemo,
})

// CAD Studio route
const cadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cad',
  component: () => (
    <div className="h-screen bg-background">
      <CADStudio onSaveModule={(module: any) => {
        console.log('CAD module saved:', module);
      }} />
    </div>
  ),
})

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  designRoute,
  analysisRoute,
  collectionsRoute,
  demoRoute,
  cadRoute,
])

// Create router
export const router = createRouter({ routeTree })