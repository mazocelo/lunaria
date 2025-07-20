import React from 'react';
import { useTheme } from '../contexts/theme.jsx';

/**
 * Componente para mostrar o status da conexão WebSocket
 */
export const WebSocketStatus = ({ 
  isConnected, 
  isAuthenticated, 
  isConnecting, 
  error, 
  currentUser,
  currentRoom,
  currentSession,
  onReconnect,
  className = '' 
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Determinar status e cor
  const getStatus = () => {
    if (error) {
      return {
        status: 'Erro',
        color: 'red',
        icon: '❌',
        message: error
      };
    }
    
    if (isConnecting) {
      return {
        status: 'Conectando...',
        color: 'yellow',
        icon: '🔄',
        message: 'Estabelecendo conexão'
      };
    }
    
    if (!isConnected) {
      return {
        status: 'Desconectado',
        color: 'red',
        icon: '🔌',
        message: 'Sem conexão com servidor'
      };
    }
    
    if (!isAuthenticated) {
      return {
        status: 'Não autenticado',
        color: 'yellow',
        icon: '🔐',
        message: 'Conectado mas não autenticado'
      };
    }
    
    if (currentSession) {
      return {
        status: 'Em jogo',
        color: 'green',
        icon: '🎮',
        message: `Sessão: ${currentSession}`
      };
    }
    
    if (currentRoom) {
      return {
        status: 'Na sala',
        color: 'blue',
        icon: '🏠',
        message: `Sala: ${currentRoom}`
      };
    }
    
    return {
      status: 'Conectado',
      color: 'green',
      icon: '✅',
      message: 'Pronto para jogar'
    };
  };

  const statusInfo = getStatus();

  const colorClasses = {
    red: {
      bg: isLight ? 'bg-red-100 border-red-200' : 'bg-red-500/20 border-red-500/30',
      text: isLight ? 'text-red-800' : 'text-red-300',
      dot: 'bg-red-500'
    },
    yellow: {
      bg: isLight ? 'bg-yellow-100 border-yellow-200' : 'bg-yellow-500/20 border-yellow-500/30',
      text: isLight ? 'text-yellow-800' : 'text-yellow-300',
      dot: 'bg-yellow-500'
    },
    green: {
      bg: isLight ? 'bg-green-100 border-green-200' : 'bg-green-500/20 border-green-500/30',
      text: isLight ? 'text-green-800' : 'text-green-300',
      dot: 'bg-green-500'
    },
    blue: {
      bg: isLight ? 'bg-blue-100 border-blue-200' : 'bg-blue-500/20 border-blue-500/30',
      text: isLight ? 'text-blue-800' : 'text-blue-300',
      dot: 'bg-blue-500'
    }
  };

  const colors = colorClasses[statusInfo.color];

  return (
    <div className={`inline-flex items-center px-3 py-2 rounded-lg border ${colors.bg} ${className}`}>
      <div className="flex items-center space-x-2">
        {/* Indicador visual */}
        <div className="relative flex items-center">
          <div className={`w-2 h-2 rounded-full ${colors.dot} ${isConnecting ? 'animate-pulse' : ''}`}></div>
          {statusInfo.icon && (
            <span className="ml-1 text-sm">{statusInfo.icon}</span>
          )}
        </div>

        {/* Status text */}
        <div className="flex flex-col">
          <span className={`text-sm font-semibold font-modern ${colors.text}`}>
            {statusInfo.status}
          </span>
          {statusInfo.message && (
            <span className={`text-xs ${colors.text} opacity-75`}>
              {statusInfo.message}
            </span>
          )}
        </div>

        {/* User info */}
        {currentUser && (
          <div className={`text-xs ${colors.text} opacity-75 border-l pl-2 ml-2`}>
            {currentUser.username || currentUser.name || 'Usuário'}
          </div>
        )}

        {/* Reconnect button */}
        {error && onReconnect && (
          <button
            onClick={onReconnect}
            className={`ml-2 px-2 py-1 text-xs rounded ${
              isLight 
                ? 'bg-red-200 hover:bg-red-300 text-red-800' 
                : 'bg-red-500/30 hover:bg-red-500/50 text-red-300'
            } transition-colors cursor-pointer`}
          >
            Reconectar
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Versão compacta do indicador de status
 */
export const WebSocketStatusCompact = ({ 
  isConnected, 
  isAuthenticated, 
  isConnecting, 
  error,
  className = '' 
}) => {
  const getStatusColor = () => {
    if (error || !isConnected) return 'bg-red-500';
    if (isConnecting || !isAuthenticated) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTooltip = () => {
    if (error) return `Erro: ${error}`;
    if (isConnecting) return 'Conectando...';
    if (!isConnected) return 'Desconectado';
    if (!isAuthenticated) return 'Não autenticado';
    return 'Conectado';
  };

  return (
    <div 
      className={`w-3 h-3 rounded-full ${getStatusColor()} ${isConnecting ? 'animate-pulse' : ''} ${className}`}
      title={getTooltip()}
    />
  );
}; 