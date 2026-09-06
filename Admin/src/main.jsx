import '@/assets/scss/app.scss'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App'
import AppProvidersWrapper from './components/wrappers/AppProvidersWrapper'
import { AuthProvider } from './context/useAuthContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ErrorBoundary from './components/ErrorBoundary'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.VITE_BASE_URL}>
      <AuthProvider>
        <AppProvidersWrapper>
          <QueryClientProvider client={queryClient}>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </QueryClientProvider>
        </AppProvidersWrapper>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
