import { Outlet, Link, useLocation } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Rocket, BarChart3, FolderOpen, Settings } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

const navigation = [
  { name: 'Design', href: '/design', icon: Rocket },
  { name: 'CAD Studio', href: '/cad', icon: Settings },
  { name: 'Analysis', href: '/analysis', icon: BarChart3 },
  { name: 'Collections', href: '/collections', icon: FolderOpen },
]

export function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background text-foreground space-gradient">
      {/* Navigation */}
      <nav className="nav-container shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/design" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
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
                          ? 'text-primary border-b-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground hover:border-border'
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
      <main className="flex-1 bg-background">
        <Outlet />
      </main>
    </div>
  )
}