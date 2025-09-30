import React from 'react'
import ReactDOM from 'react-dom/client'
import './globals.css'
import '@/styles/theme.css'
import App from './App'

// Enable mock server for development
if (import.meta.env.DEV) {
  import('./lib/mockServer').then(({ enableMockServer }) => {
    enableMockServer()
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)