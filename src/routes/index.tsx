import { createFileRoute } from '@tanstack/react-router'
import { SkyScene } from '../features/space/SkyScene'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Star Sky Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <SkyScene 
          seed={42}
          starCount={6000}
          far={800}
          sunDirection={[1, 0.3, 0.5]}
        />
      </div>
      
      {/* Content with backdrop blur */}
      <div className="relative z-10 bg-background/20 backdrop-blur-sm min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              🚀 Habitat Designer
            </h1>
            <p className="text-xl text-muted-foreground">
              NASA Space Habitat Layout Tool
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Design Card */}
            <div className="bg-card/50 backdrop-blur-md rounded-xl p-6 border border-border hover:bg-card/70 transition-all">
              <div className="text-3xl mb-4">🏗️</div>
              <h2 className="text-xl font-semibold mb-2 text-card-foreground">Design</h2>
              <p className="text-muted-foreground mb-4">
                Create and layout habitat modules for space missions
              </p>
              <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors">
                Start Designing
              </button>
            </div>

            {/* Analyze Card */}
            <div className="bg-card/50 backdrop-blur-md rounded-xl p-6 border border-border hover:bg-card/70 transition-all">
              <div className="text-3xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold mb-2 text-card-foreground">Analyze</h2>
              <p className="text-muted-foreground mb-4">
                Validate layouts against NASA requirements and constraints
              </p>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                Run Analysis
              </button>
            </div>

            {/* Collections Card */}
            <div className="bg-card/50 backdrop-blur-md rounded-xl p-6 border border-border hover:bg-card/70 transition-all">
              <div className="text-3xl mb-4">💾</div>
              <h2 className="text-xl font-semibold mb-2 text-card-foreground">Collections</h2>
              <p className="text-muted-foreground mb-4">
                Save, load, and share your habitat designs
              </p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                Browse Collection
              </button>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="bg-card/30 backdrop-blur rounded-lg p-6 max-w-2xl mx-auto border border-border">
              <h3 className="text-lg font-semibold mb-2 text-card-foreground">🌟 Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>✅ Real-time validation</div>
                <div>✅ NASA constraint checking</div>
                <div>✅ Multiple habitat shapes</div>
                <div>✅ Drag & drop interface</div>
                <div>✅ Export/import layouts</div>
                <div>✅ Mission scenario planning</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}