import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/theme';
import { notificationService } from '../services';
import ConviteItem from './ConviteItem';

/**
 * 🔔 Modal de Notificações Simples
 * 
 * Modal simples que busca e exibe notificações usando estado local
 */
const NotificationsModal = ({ isOpen, onClose, onNotificationUpdate }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isLight = theme === 'light';

  // 🎯 BUSCAR NOTIFICAÇÕES QUANDO O MODAL ABRIR
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // 🎯 FECHAR MODAL COM TECLA ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // 🎯 BUSCAR NOTIFICAÇÕES
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await notificationService.fetchNotifications();
      
      if (response.success) {
        setNotifications(response.data.convites || []);
      } else {
        setError('Erro ao carregar notificações');
      }
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
      setError(err.message || 'Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  // 🎯 LIDAR COM CONVITE
  const handleAcceptInvite = async (convite, personagemId) => {
    try {
      await notificationService.acceptInvite(convite.id, personagemId);
      // Atualizar lista local
      setNotifications(prev => 
        prev.map(n => n.id === convite.id ? { ...n, status: 'aceito' } : n)
      );
      // Notificar App para atualizar contador
      if (onNotificationUpdate) {
        onNotificationUpdate();
      }
    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
    }
  };

  const handleRejectInvite = async (convite) => {
    try {
      await notificationService.rejectInvite(convite.id);
      // Atualizar lista local
      setNotifications(prev => 
        prev.map(n => n.id === convite.id ? { ...n, status: 'rejeitado' } : n)
      );
      // Notificar App para atualizar contador
      if (onNotificationUpdate) {
        onNotificationUpdate();
      }
    } catch (error) {
      console.error('Erro ao rejeitar convite:', error);
    }
  };

  const handleGoToGame = (convite) => {
    // TODO: Implementar navegação para o jogo
  };

  // 🎯 NAVEGAR PARA CRIAR NOVO PERSONAGEM
  const handleCreatePersonagem = () => {
    onClose(); // Fechar modal de notificações
    navigate('/novo-personagem');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-end pt-20 pr-6 pointer-events-none"
    >
      {/* Modal */}
      <div 
        className={`relative w-96 max-h-[70vh] rounded-lg shadow-2xl border animate-slide-in-right pointer-events-auto ${
          isLight 
            ? 'bg-white border-slate-200' 
            : 'bg-slate-800 border-slate-600'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isLight ? 'border-slate-200/50' : 'border-slate-600/50'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🔔</div>
            <div>
              <h3 className={`font-bold text-lg ${
                isLight ? 'text-slate-800' : 'text-white'
              }`}>
                Convites de Histórias
              </h3>
              <p className={`text-xs ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}>
                {notifications.length} convite{notifications.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchNotifications}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                isLight 
                  ? 'text-blue-600 hover:bg-blue-50' 
                  : 'text-blue-400 hover:bg-blue-900/30'
              }`}
              title="Atualizar notificações"
            >
              🔄
            </button>
            
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors font-bold text-lg ${
                isLight 
                  ? 'hover:bg-slate-100 text-slate-600 hover:text-slate-800' 
                  : 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Fechar notificações"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
              <span className={`ml-3 ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}>
                Carregando...
              </span>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <div className="text-4xl mb-2">⚠️</div>
              <p className={`text-sm ${
                isLight ? 'text-red-600' : 'text-red-400'
              }`}>
                {error}
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className={`${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}>
                Nenhuma notificação
              </p>
              <p className={`text-sm mt-1 ${
                isLight ? 'text-slate-500' : 'text-slate-500'
              }`}>
                Você está em dia!
              </p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map(convite => (
                <ConviteItem
                  key={convite.id}
                  convite={convite}
                  onAccept={handleAcceptInvite}
                  onReject={handleRejectInvite}
                  onGoToGame={handleGoToGame}
                  onCreatePersonagem={handleCreatePersonagem}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;