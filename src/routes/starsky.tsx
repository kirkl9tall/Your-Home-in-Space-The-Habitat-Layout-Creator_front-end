import { createFileRoute } from '@tanstack/react-router'
import { SkyScene } from '../features/space/SkyScene'

export const Route = createFileRoute('/starsky')({
  component: StarSkyTest,
})

function StarSkyTest() {
  return (
    <div className="w-full h-screen relative bg-black">
      <SkyScene 
        seed={42}
        starCount={3000}
        far={500}
        sunDirection={[1, 0.5, 0.2]}
        className="w-full h-full"
      />
      
      {/* Simple overlay to test if the scene is working */}
      <div className="absolute top-4 left-4 z-10 bg-white/20 backdrop-blur-sm p-4 rounded-lg text-white">
        <h1 className="text-xl font-bold">🌟 Star Sky Test</h1>
        <p className="text-sm">You should see twinkling stars behind this panel</p>
        <div className="mt-2 text-xs">
          <div>Stars: 3000</div>
          <div>Seed: 42</div>
          <div>Far plane: 500</div>
        </div>
      </div>
    </div>
  )
}