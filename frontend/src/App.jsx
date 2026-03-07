import { useTheme } from './contexts/theme.jsx'
import { useAuth } from './contexts/AuthContext'
import { useLayout } from './contexts/LayoutContext'
import { GameLoadingProvider } from './contexts/GameLoadingContext'
import { GameProvider } from './contexts/GameContext'
import Sidebar from './components/sidebar'
import ParticlesBackground from './components/ParticlesBackground.jsx'
import LoadingSpinner from './components/LoadingSpinner'
import NotificationsModal from './components/NotificationsModal'
import { AuthContainer } from './components/Auth'
import ResetPasswordPage from './Pages/ResetPassword'
import AppRoutes from './routes.jsx'

// 🚀 STORE INITIALIZATION - Cache de dados estáticos em background
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { initializeAllStores } from './store/index.js'
import { notificationService } from './services'

// Componente interno que usa os hooks
function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, loading, logout } = useAuth();
  const { showSidebar, isFullscreen } = useLayout();
  const location = useLocation();
  
  // Estado local para notificações
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  
  const isLight = theme === 'light';

  // 🚀 INICIALIZAR STORES EM BACKGROUND - Uma vez por sessão
  useEffect(() => {
    // Só inicializa se autenticado para evitar requests desnecessárias
    if (isAuthenticated && !loading) {
      initializeAllStores().catch(error => {
        console.error('❌ App: Erro ao inicializar stores:', error);
      });
    }
  }, [isAuthenticated, loading]);

  // 🔔 BUSCAR CONTADOR DE NOTIFICAÇÕES
  useEffect(() => {
    if (!isAuthenticated || loading) {
      setNotificationCount(0);
      return;
    }

    // Função para buscar contador
    const fetchNotificationCount = async () => {
      try {
        const response = await notificationService.getUnreadCount();
        if (response.success) {
          setNotificationCount(response.count || 0);
        }
      } catch (error) {
        console.error('❌ App: Erro ao buscar contador de notificações:', error);
        setNotificationCount(0);
      }
    };

    // Buscar imediatamente
    fetchNotificationCount();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchNotificationCount, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, loading]);

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

  // Rota pública: redefinição de senha (acessível sem autenticação)
  if (location.pathname === '/reset-password') {
    return <ResetPasswordPage />;
  }

  // Mostrar tela de login se não autenticado
  if (!isAuthenticated) {
    return <AuthContainer />;
  }

  return (
    <GameLoadingProvider>
      <GameProvider>
        <div className="w-screen h-screen overflow-hidden">
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

          {/* Conteúdo principal com altura fixa */}
          <div className={`${showSidebar ? 'ml-[260px]' : ''} flex flex-col h-screen`}>
            {/* Header com toggle de tema - OCULTO quando em tela de jogo (fullscreen) */}
            {!isFullscreen && (
              <header className={`border-b px-6 py-6 flex-shrink-0 z-10 ${
                isLight
                  ? 'glass-strong-light border-slate-200/50'
                  : 'glass-strong border-slate-700/50'
              }`} style={{height: '8vh'}}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-fantasy font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      The Fable Forge
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
                      onClick={() => setIsNotificationsOpen(true)}
                      className={`hover-lift cursor-pointer px-4 py-2 rounded-md transition-all relative ${
                        isLight
                          ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                          : 'bg-purple-900/50 text-purple-400 hover:bg-purple-800/50'
                      }`}
                      aria-label="Notificações"
                    >
                      <span className={`inline-block ${notificationCount > 0 ? 'animate-bounce' : ''}`}>
                        🔔
                      </span>
                      <span className="ml-2 font-modern">Notificações</span>
                      {/* Badge de notificações não lidas */}
                      {notificationCount > 0 && (
                        <div className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
                          <span className="text-white text-xs font-bold px-1">
                            {notificationCount > 99 ? '99+' : notificationCount}
                          </span>
                        </div>
                      )}
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
            )}

            {/* Conteúdo principal com scroll vertical - APENAS AQUI TEM SCROLL */}
            <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden min-w-0 z-10">
              <div className="animate-fade-in">
                {/* ✅ ROTAS CENTRALIZADAS EM ARQUIVO SEPARADO */}
                <AppRoutes />
              </div>
            </main>
          </div>

          {/* Modal de notificações */}
          <NotificationsModal 
            isOpen={isNotificationsOpen} 
            onClose={() => setIsNotificationsOpen(false)}
            onNotificationUpdate={() => {
              // Atualizar contador quando notificações mudarem
              notificationService.getUnreadCount()
                .then(response => {
                  if (response.success) {
                    setNotificationCount(response.count || 0);
                  }
                })
                .catch(error => {
                  console.error('❌ App: Erro ao atualizar contador:', error);
                });
            }}
          />
        </div>
      </GameProvider>
    </GameLoadingProvider>
  )
}

// Componente principal que engloba os providers
function App() {
  return <AppContent />;
}

export default App
