import { useTheme } from './contexts/theme.jsx'
import { useAuth } from './contexts/AuthContext'
import { useLayout } from './contexts/LayoutContext'
import Sidebar from './components/sidebar'
import ParticlesBackground from './components/ParticlesBackground.jsx'
import LoadingSpinner from './components/LoadingSpinner'
import { AuthContainer } from './views/Auth'
import AppRoutes from './routes.jsx'

function App() {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, loading, logout } = useAuth();
  const { showSidebar } = useLayout();
  const isLight = theme === 'light';

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="w-screen min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <ParticlesBackground />
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-purple-300 font-modern">Carregando Lunaria...</p>
        </div>
      </div>
    );
  }

  // Mostrar tela de login se não autenticado
  if (!isAuthenticated) {
    return <AuthContainer />;
  }

  return (
    <div className="w-screen min-h-screen">
      {/* Fundo de partículas */}
      <ParticlesBackground />

      {/* Gradiente de fundo adicional */}
      <div className={`fixed inset-0 z-0 ${
        isLight 
          ? 'bg-gradient-to-br from-slate-100 via-purple-100/30 to-slate-100' 
          : 'bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900'
      }`} />

      {/* Sidebar fixa à esquerda - será ocultada pelos componentes quando necessário */}
      {showSidebar && (
        <div className="fixed left-0 top-0 h-screen w-[260px] z-20 flex-shrink-0">
          <Sidebar />
        </div>
      )}

      {/* Conteúdo principal com scroll independente */}
      <div className={`${showSidebar ? 'ml-[260px]' : ''} flex flex-col min-h-screen`}>
        {/* Header com toggle de tema */}
        <header className={`border-b px-6 py-6 flex-shrink-0 z-10 ${
          isLight 
            ? 'glass-strong-light border-slate-200/50' 
            : 'glass-strong border-slate-700/50'
        }`} style={{height: '8vh'}}>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-fantasy font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Role Chat Game
              </h1>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse-slow" />
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`hover-lift cursor-pointer ${
                  isLight ? 'btn-rpg-light' : 'btn-rpg'
                }`}
                aria-label="Alternar tema"
              >
                {theme === 'dark' ? '🌙' : '☀️'}
                <span className="ml-2 font-modern">
                  {theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}
                </span>
              </button>

              <button
                onClick={logout}
                className={`hover-lift cursor-pointer px-4 py-2 rounded-md transition-all ${
                  isLight 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-red-900/50 text-red-400 hover:bg-red-800/50'
                }`}
                aria-label="Fazer logout"
              >
                <span className="font-modern">Sair</span>
              </button>
            </div>
          </div>
        </header>

        {/* Conteúdo principal com scroll vertical */}
        <main className="flex-1 p-6 overflow-y-auto min-w-0 z-10">
          <div className="animate-fade-in">
            {/* ✅ ROTAS CENTRALIZADAS EM ARQUIVO SEPARADO */}
            <AppRoutes />
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
