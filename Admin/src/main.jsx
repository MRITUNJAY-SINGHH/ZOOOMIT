import '@/assets/scss/app.scss'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App'
import AppProvidersWrapper from './components/wrappers/AppProvidersWrapper'
import { AuthProvider } from './context/useAuthContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.VITE_BASE_URL}>
      <AuthProvider>
        <AppProvidersWrapper>
          <App />
        </AppProvidersWrapper>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
