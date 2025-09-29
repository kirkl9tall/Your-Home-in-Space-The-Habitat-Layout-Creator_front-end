import { RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HabitatDesignProvider } from './contexts/HabitatDesignContext'
import { router } from './router'
import './globals.css'

// Create a QueryClient instance for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HabitatDesignProvider>
        <RouterProvider router={router} />
      </HabitatDesignProvider>
    </QueryClientProvider>
  )
}