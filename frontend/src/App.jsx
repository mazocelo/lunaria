import { Route, Routes } from 'react-router-dom'
import Historias from './pages/Historia'
import NovaHistoria from './pages/Historia/Criar'

import Personagens from './pages/Personagem'
import NovoPersonagem from './pages/Personagem/Criar'

import './App.css'
import { useTheme } from './contexts/theme.jsx'
import Sidebar from './components/sidebar' // Adicione o import do Sidebar

function App() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button
            onClick={toggleTheme}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 8,
              border: 'none',
              background: theme === 'dark' ? '#333' : '#eee',
              color: theme === 'dark' ? '#fff' : '#222',
              cursor: 'pointer'
            }}
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
        <Routes>
          <Route path="/" element={<Historias />} />
          <Route path="/nova-historia" element={<NovaHistoria />} />
          <Route path="/historias" element={<Historias />} />
          <Route path="/personagens" element={<Personagens />} />
          <Route path="/novo-personagem" element={<NovoPersonagem />} />
          {/* Adicione outras rotas conforme necessário */}
        </Routes>
      </div>
    </div>
  )
}

export default App
