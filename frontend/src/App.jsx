import { Route, Routes } from 'react-router-dom'
import { useTheme } from './contexts/theme.jsx'
import Sidebar from './components/sidebar'
import ParticlesBackground from './components/ParticlesBackground.jsx'
import { HistoriaView, NovaHistoriaView, PersonagemView, NovoPersonagemView, EditarPersonagemView } from './views'


function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fundo de partículas */}
      <ParticlesBackground />

      {/* Gradiente de fundo adicional */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 z-0" />

      <div className="relative z-10 flex min-h-screen">
        <Sidebar />

        <div className="flex-1 flex flex-col">
          {/* Header com toggle de tema */}
          <header className="glass-strong border-b border-slate-700/50 px-6 py-4">
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

          {/* Conteúdo principal */}
          <main className="flex-1 p-6 overflow-auto">
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
    </div>
  )
}

export default App
