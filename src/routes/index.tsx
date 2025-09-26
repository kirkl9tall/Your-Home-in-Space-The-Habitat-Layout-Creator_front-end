import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🚀 Habitat Designer
          </h1>
          <p className="text-xl text-gray-300">
            NASA Space Habitat Layout Tool
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Design Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
            <div className="text-3xl mb-4">🏗️</div>
            <h2 className="text-xl font-semibold mb-2">Design</h2>
            <p className="text-gray-300 mb-4">
              Create and layout habitat modules for space missions
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
              Start Designing
            </button>
          </div>

          {/* Analyze Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
            <div className="text-3xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold mb-2">Analyze</h2>
            <p className="text-gray-300 mb-4">
              Validate layouts against NASA requirements and constraints
            </p>
            <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors">
              Run Analysis
            </button>
          </div>

          {/* Collections Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
            <div className="text-3xl mb-4">💾</div>
            <h2 className="text-xl font-semibold mb-2">Collections</h2>
            <p className="text-gray-300 mb-4">
              Save, load, and share your habitat designs
            </p>
            <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors">
              Browse Collection
            </button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-white/5 backdrop-blur rounded-lg p-6 max-w-2xl mx-auto border border-white/10">
            <h3 className="text-lg font-semibold mb-2">🌟 Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
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
  )
}