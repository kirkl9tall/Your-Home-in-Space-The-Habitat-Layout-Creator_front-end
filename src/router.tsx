import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router'
import { Layout } from './components/Layout'
import NASAHabitatBuilder3D from './components/NASAHabitatBuilder3D'
import DesignSystemDemo from './components/DesignSystemDemo'

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
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-200 mb-4">NASA Mission Analysis</h2>
        <p className="text-gray-300 mb-6">Advanced habitat layout analysis and optimization tools</p>
        <div className="bg-purple-800/20 border border-purple-500/30 rounded-lg p-6">
          <p className="text-purple-200">Coming Soon: Mission analysis features including:</p>
          <ul className="text-left text-gray-300 mt-4 space-y-1">
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
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-200 mb-4">Habitat Collections</h2>
        <p className="text-gray-300 mb-6">Manage saved habitat layouts and NASA mission templates</p>
        <div className="bg-purple-800/20 border border-purple-500/30 rounded-lg p-6">
          <p className="text-purple-200">Coming Soon: Collection features including:</p>
          <ul className="text-left text-gray-300 mt-4 space-y-1">
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

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  designRoute,
  analysisRoute,
  collectionsRoute,
  demoRoute,
])

// Create router
export const router = createRouter({ routeTree })