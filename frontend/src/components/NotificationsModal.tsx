import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/theme';
import { notificationService, amizadeService } from '../services';
import ConviteItem, { type ConvitePayload } from './ConviteItem';
import { UserPlus, Check, X } from 'lucide-react';

interface FriendRequest {
  id: number | string;
  requester?: { nome?: string | null } | null;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationUpdate?: () => void;
}

interface NotificationsResponseData {
  convites?: ConvitePayload[];
  solicitacoes_amizade?: FriendRequest[];
}

/**
 * Modal de notificacoes — convites de historia + solicitacoes de amizade.
 */
const NotificationsModal = ({ isOpen, onClose, onNotificationUpdate }: NotificationsModalProps) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<ConvitePayload[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLight = theme === 'light';

  // BUSCAR NOTIFICACOES QUANDO O MODAL ABRIR
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // FECHAR MODAL COM TECLA ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
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

  // BUSCAR NOTIFICACOES
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await notificationService.fetchNotifications();

      if (response.success) {
        const data = (response.data ?? {}) as NotificationsResponseData;
        setNotifications(data.convites || []);
        setFriendRequests(data.solicitacoes_amizade || []);
      } else {
        setError('Erro ao carregar notificacoes');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar notificacoes';
      console.error('Erro ao buscar notificacoes:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // CONVITE: callbacks recebem o convite e (opcionalmente) o personagem
  const handleAcceptInvite = async (convite: ConvitePayload, personagemId: number | string) => {
    try {
      await notificationService.acceptInvite(convite.id, Number(personagemId));
      setNotifications((prev) =>
        prev.map((n) => (n.id === convite.id ? { ...n, status: 'aceito' } : n))
      );
      if (onNotificationUpdate) {
        onNotificationUpdate();
      }
    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
    }
  };

  const handleRejectInvite = async (convite: ConvitePayload) => {
    try {
      await notificationService.rejectInvite(convite.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === convite.id ? { ...n, status: 'rejeitado' } : n))
      );
      if (onNotificationUpdate) {
        onNotificationUpdate();
      }
    } catch (error) {
      console.error('Erro ao rejeitar convite:', error);
    }
  };

  const handleGoToGame = (convite: ConvitePayload) => {
    onClose();
    const historiaId = (convite.historia as { id?: number | string }).id;
    navigate(`/jogo/sala-espera/${historiaId}`);
  };

  const handleAcceptFriend = async (solicitacao: FriendRequest) => {
    try {
      await amizadeService.acceptRequest(solicitacao.id);
      setFriendRequests((prev) => prev.filter((s) => s.id !== solicitacao.id));
      if (onNotificationUpdate) onNotificationUpdate();
    } catch (error) {
      console.error('Erro ao aceitar solicitacao:', error);
    }
  };

  const handleRejectFriend = async (solicitacao: FriendRequest) => {
    try {
      await amizadeService.rejectRequest(solicitacao.id);
      setFriendRequests((prev) => prev.filter((s) => s.id !== solicitacao.id));
      if (onNotificationUpdate) onNotificationUpdate();
    } catch (error) {
      console.error('Erro ao rejeitar solicitacao:', error);
    }
  };

  // 🎯 NAVEGAR PARA CRIAR NOVO PERSONAGEM
  const handleCreatePersonagem = () => {
    onClose(); // Fechar modal de notificações
    navigate('/novo-personagem');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end pt-20 pr-6"
      onClick={onClose}
    >
      {/* Modal */}
      <div 
        className={`relative w-96 max-h-[70vh] rounded-lg shadow-2xl border animate-slide-in-right ${
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
                Notificações
              </h3>
              <p className={`text-xs ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}>
                {notifications.length + friendRequests.length} notificaç{(notifications.length + friendRequests.length) !== 1 ? 'ões' : 'ão'}
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
          ) : (notifications.length === 0 && friendRequests.length === 0) ? (
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
            <div className="p-2 space-y-1">
              {/* Solicitações de amizade */}
              {friendRequests.map(solicitacao => (
                <div
                  key={`friend-${solicitacao.id}`}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isLight ? 'bg-blue-50/80 border border-blue-100' : 'bg-blue-900/20 border border-blue-800/30'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-800/50 text-blue-300'
                    }`}>
                      <UserPlus size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>
                        {solicitacao.requester?.nome || 'Usuário'}
                      </p>
                      <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        Quer ser seu amigo
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <button
                      onClick={() => handleAcceptFriend(solicitacao)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors cursor-pointer"
                      title="Aceitar"
                    >
                      <Check size={15} />
                    </button>
                    <button
                      onClick={() => handleRejectFriend(solicitacao)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors cursor-pointer"
                      title="Rejeitar"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Convites de histórias */}
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