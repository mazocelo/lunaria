import { Route, Routes } from 'react-router-dom'
import { useTheme } from './contexts/theme.jsx'
import Sidebar from './components/sidebar'
import ParticlesBackground from './components/ParticlesBackground.jsx'
import { HistoriaView, NovaHistoriaView, PersonagemView, NovoPersonagemView, EditarPersonagemView } from './views'

function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="w-screen min-h-screen">
      {/* Fundo de partículas */}
      <ParticlesBackground />

      {/* Gradiente de fundo adicional */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 z-0" />

      {/* Sidebar fixa à esquerda */}
      <div className="fixed left-0 top-0 h-screen w-[260px] z-20 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Conteúdo principal com scroll independente */}
      <div className="ml-[260px] flex flex-col min-h-screen">
        {/* Header com toggle de tema */}
        <header className="glass-strong border-b border-slate-700/50 px-6 py-6 flex-shrink-0 z-10" style={{height: '8vh'}}>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-fantasy font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Role Chat Game
              </h1>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse-slow" />
            </div>

            <button
              onClick={toggleTheme}
              className="btn-rpg hover-lift"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? '🌙' : '☀️'}
              <span className="ml-2 font-modern">
                {theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}
              </span>
            </button>
          </div>
        </header>

        {/* Conteúdo principal com scroll vertical */}
        <main className="flex-1 p-6 overflow-y-auto min-w-0 z-10">
          <div className="animate-fade-in">
            <Routes>
              <Route path="/" element={<HistoriaView />} />
              <Route path="/historias" element={<HistoriaView />} />

              {/* Rotas MVVM - Histórias */}
              <Route path="/nova-historia" element={<NovaHistoriaView />} />

              {/* Rotas MVVM - Personagens */}
              <Route path="/personagens" element={<PersonagemView />} />
              <Route path="/novo-personagem" element={<NovoPersonagemView />} />
              <Route path="/editar-personagem/:id" element={<EditarPersonagemView />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
