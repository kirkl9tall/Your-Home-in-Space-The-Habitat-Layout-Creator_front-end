import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { QueryClient } from '@tanstack/react-query'

// Create query client context
export const queryClient = new QueryClient()

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="min-h-screen bg-background text-foreground">
        <Outlet />
      </div>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
})