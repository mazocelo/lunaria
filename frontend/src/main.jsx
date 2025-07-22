
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Contextos (agora usando default imports)
import ThemeProvider from './contexts/theme.jsx'
import LayoutProvider from './contexts/LayoutContext.jsx'
import AuthProvider from './contexts/AuthContext.jsx'

// Importar utilitários
import './utils/EventEmitter.js'
import './services/index.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LayoutProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </LayoutProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
