import { useTheme } from './contexts/theme.jsx'
import { useAuth } from './contexts/AuthContext'
import { useLayout } from './contexts/LayoutContext'
import { GameLoadingProvider } from './contexts/GameLoadingContext'
import { GameProvider } from './contexts/GameContext'
import Sidebar from './components/sidebar'
import TopHeader from './components/TopHeader'
import ParticlesBackground from './components/ParticlesBackground.jsx'
import LoadingSpinner from './components/LoadingSpinner'
import NotificationsModal from './components/NotificationsModal'
import { AuthContainer } from './components/Auth'
import ResetPasswordPage from './Pages/ResetPassword'
import AppRoutes from './routes.jsx'
import ScrollToTop from './components/shared/ScrollToTop'

// 🚀 STORE INITIALIZATION - Cache de dados estáticos em background
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { initializeAllStores } from './store/index.js'
import { notificationService } from './services'

// ErrorBoundary para capturar crashes em componentes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="text-center space-y-4 p-8">
            <h1 className="text-2xl font-bold text-red-400">Algo deu errado</h1>
            <p className="text-purple-300">Um erro inesperado ocorreu. Tente recarregar a pagina.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Componente interno que usa os hooks
function AppContent() {
  const { theme } = useTheme();
  const { isAuthenticated, loading } = useAuth();
  const { showSidebar, isFullscreen, sidebarCollapsed } = useLayout();
  const location = useLocation();

  // Estado local para notificações
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const isLight = theme === 'light';

  // 🚀 INICIALIZAR STORES EM BACKGROUND - Uma vez por sessão
  useEffect(() => {
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

    fetchNotificationCount();
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

  // Rota pública: redefinição de senha
  if (location.pathname === '/reset-password') {
    return <ResetPasswordPage />;
  }

  // Mostrar tela de login se não autenticado
  if (!isAuthenticated) {
    return <AuthContainer />;
  }

  // Sidebar width for margin calculation
  const sidebarWidth = sidebarCollapsed ? 72 : 260;

  return (
    <GameLoadingProvider>
      <GameProvider>
        <div className="w-screen h-screen overflow-hidden">
          {/* Fundo de partículas */}
          <ParticlesBackground />

          {/* Gradiente de fundo */}
          <div className={`fixed inset-0 z-0 pointer-events-none ${
            isLight
              ? 'bg-gradient-to-br from-slate-100 via-purple-100/30 to-slate-100'
              : 'bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900'
          }`} />

          {/* === APP SHELL: Sidebar + TopHeader + Content === */}

          {/* Sidebar */}
          {showSidebar && (
            <div
              className="fixed left-0 top-0 h-screen z-20 flex-shrink-0"
              style={{ width: sidebarWidth, transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}
            >
              <Sidebar />
            </div>
          )}

          {/* Main area (header + content) */}
          <div
            className="flex flex-col h-screen transition-[margin-left] duration-300 ease-in-out relative z-10"
            style={{ marginLeft: showSidebar ? sidebarWidth : 0 }}
          >
            {/* TopHeader - hidden in fullscreen (game) mode */}
            {!isFullscreen && (
              <TopHeader
                notificationCount={notificationCount}
                onOpenNotifications={() => setIsNotificationsOpen(true)}
              />
            )}

            {/* Main content with scroll */}
            <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden min-w-0">
              <ScrollToTop />
              <ErrorBoundary>
                <div className="animate-fade-in">
                  <AppRoutes />
                </div>
              </ErrorBoundary>
            </main>
          </div>

          {/* Modal de notificações */}
          <NotificationsModal
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            onNotificationUpdate={() => {
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

// Componente principal
function App() {
  return <AppContent />;
}

export default App
