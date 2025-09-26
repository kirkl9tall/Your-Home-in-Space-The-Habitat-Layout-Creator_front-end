import { Outlet, Link, useLocation } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Rocket, BarChart3, FolderOpen } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

const navigation = [
  { name: 'Design', href: '/design', icon: Rocket },
  { name: 'Analysis', href: '/analysis', icon: BarChart3 },
  { name: 'Collections', href: '/collections', icon: FolderOpen },
]

export function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      {/* Navigation */}
      <nav className="bg-black/40 backdrop-blur-md border-b border-purple-500/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/design" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                    NASA Habitat Designer
                  </h1>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.href || 
                    (item.href === '/design' && location.pathname === '/')
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'inline-flex items-center gap-2 px-1 pt-1 text-sm font-medium transition-colors',
                        isActive
                          ? 'text-purple-300 border-b-2 border-purple-400'
                          : 'text-gray-300 hover:text-purple-200 hover:border-gray-300'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}