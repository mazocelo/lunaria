import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { TemasProvider } from './contexts/temas.jsx'
import { HistoriaProvider } from './contexts/historias.jsx'
import { PersonagensProvider } from './contexts/personagens.jsx'
import { ThemeProvider } from './contexts/theme.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(

  <BrowserRouter>
    <ThemeProvider>
      <TemasProvider>
        <HistoriaProvider>
          <PersonagensProvider>
            <App />
          </PersonagensProvider>
        </HistoriaProvider>
      </TemasProvider>
    </ThemeProvider>
  </BrowserRouter>
)
