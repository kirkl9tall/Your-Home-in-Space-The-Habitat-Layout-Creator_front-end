import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router'
import { Layout } from './components/Layout'
import NASAHabitatBuilder3D from './components/NASAHabitatBuilder3D'
import DesignSystemDemo from './components/DesignSystemDemo'
import { ValidationDemo } from './components/ValidationDemo'
import { AnalysisPage } from './components/AnalysisPage'

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

// Analysis route (comprehensive analysis tools with NASA validation)
const analysisRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analysis',
  component: AnalysisPage,
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

// Validation Demo route
const validationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/validation',
  component: ValidationDemo,
})

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  designRoute,
  analysisRoute,
  collectionsRoute,
  demoRoute,
  validationRoute,
])

// Create router
export const router = createRouter({ routeTree })