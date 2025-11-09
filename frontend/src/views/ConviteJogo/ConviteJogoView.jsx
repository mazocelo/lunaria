import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGameLoading } from '../../contexts/GameLoadingContext';
import { useLayout } from '../../contexts/LayoutContext';
import { historiaService } from '../../services/index.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Notification from '../../components/Notification.jsx';

/**
 * 🎮 VIEW DE CONVITE - Redireciona usuário que entrou via convite para a sala
 * 
 * Fluxo:
 * 1. Recebe ID da história via URL (/convite-jogo/:id)
 * 2. Valida se usuário está autenticado
 * 3. Carrega dados da história
 * 4. Salva seleções no GameLoadingContext
 * 5. Redireciona para /jogo/:id com estado otimizado
 */
const ConviteJogoView = () => {
  const { user } = useAuth();
  const { hideSidebar, openSidebar } = useLayout();
  const { saveSelection, setLoading, startTransition } = useGameLoading();
  const navigate = useNavigate();
  const { id } = useParams();

  // Estados locais
  const [historia, setHistoria] = useState(null);
  const [error, setError] = useState(null);
  const [redirecting, setRedirecting] = useState(false);

  // 🔒 Verificar autenticação
  useEffect(() => {
    if (!user) {
      // Usuário não autenticado, redirecionando para login
      
      // Salvar URL de destino para depois do login
      const targetUrl = `/convite-jogo/${id}`;
      localStorage.setItem('redirectAfterLogin', targetUrl);
      
      navigate('/login');
      return;
    }
  }, [user, navigate, id]);

  // 🎨 Configurar layout
  useEffect(() => {
    hideSidebar();
    return () => openSidebar();
  }, [hideSidebar, openSidebar]);

  // 📚 Carregar dados da história
  useEffect(() => {
    if (!id || !user) return;

    setLoading('historia', true);
    setError(null);

    historiaService.getById(id)
      .then(historiaData => {
        setHistoria(historiaData);
        
        // Salvar seleção no context
        saveSelection('historiaId', historiaData.id);
        saveSelection('configuracoes', {
          viaConvite: true,
          timestamp: new Date().toISOString(),
          convitedBy: 'link' // Pode ser expandido futuramente
        });

        setLoading('historia', false);
        
        // Iniciar redirecionamento após breve delay para UX
        setTimeout(() => {
          handleRedirectToGame(historiaData);
        }, 1500);
      })
      .catch(err => {
        console.error('❌ ConviteJogo: Erro ao carregar história:', err);
        setError(err.message || 'Erro ao carregar história');
        setLoading('historia', false);
      });
  }, [id, user, setLoading, saveSelection]);

  // 🚀 Redirecionar para o jogo
  const handleRedirectToGame = (historiaData) => {
    setRedirecting(true);
    
    startTransition('convite', 'selecao-personagem');
    
    // Redirecionar para a view principal do jogo
    navigate(`/jogo/${historiaData.id}`, {
      state: {
        fromInvite: true,
        historia: historiaData,
        timestamp: new Date().toISOString()
      }
    });
  };

  // 🔄 Tentar novamente
  const handleRetry = () => {
    setError(null);
    window.location.reload();
  };

  // 🚪 Voltar para histórias
  const handleGoToHistorias = () => {
    navigate('/historias');
  };

  // 🔒 Loading de autenticação
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="glass p-8 rounded-2xl border border-purple-500/20 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <h2 className="text-xl font-fantasy font-bold text-white mb-2">
            🔒 Verificando Autenticação
          </h2>
          <p className="text-purple-300">
            Redirecionando para login...
          </p>
        </div>
      </div>
    );
  }

  // ❌ Estado de erro
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="glass p-8 rounded-2xl border border-red-500/20 text-center max-w-md w-full">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-fantasy font-bold text-white mb-4">
            Convite Inválido
          </h2>
          <p className="text-red-300 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full btn-rpg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500"
            >
              🔄 Tentar Novamente
            </button>
            <button
              onClick={handleGoToHistorias}
              className="w-full btn-rpg-secondary"
            >
              📚 Ver Outras Histórias
            </button>
          </div>
        </div>

        <Notification
          message={`Erro no convite: ${error}`}
          type="error"
          onClose={() => setError(null)}
        />
      </div>
    );
  }

  // 🎮 Estado principal - Processando convite
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 glass p-8 rounded-2xl border border-purple-500/20 text-center max-w-md w-full">
        {!redirecting ? (
          <>
            {/* Estado de carregamento */}
            <div className="mb-6">
              <LoadingSpinner size="lg" />
            </div>
            <h2 className="text-2xl font-fantasy font-bold text-white mb-4">
              🎮 Processando Convite
            </h2>
            <p className="text-purple-300 mb-4">
              Carregando informações da aventura...
            </p>
            
            {historia && (
              <div className="glass p-4 rounded-lg border border-cyan-500/20 mb-4">
                <h3 className="text-lg font-bold text-white mb-2">
                  {historia.nome || historia.titulo}
                </h3>
                <p className="text-cyan-300 text-sm">
                  {historia.descricao?.substring(0, 100)}
                  {historia.descricao?.length > 100 ? '...' : ''}
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Estado de redirecionamento */}
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
            </div>
            <h2 className="text-2xl font-fantasy font-bold text-white mb-4">
              🚀 Redirecionando
            </h2>
            <p className="text-green-300 mb-4">
              Convite aceito! Entrando na aventura...
            </p>
            
            {historia && (
              <div className="glass p-4 rounded-lg border border-green-500/20">
                <h3 className="text-lg font-bold text-white mb-2">
                  📖 {historia.nome || historia.titulo}
                </h3>
                <p className="text-green-300 text-sm">
                  Preparando seleção de personagem...
                </p>
              </div>
            )}
          </>
        )}

        {/* Informações do usuário */}
        <div className="mt-6 pt-4 border-t border-purple-500/20">
          <p className="text-purple-400 text-sm">
            👤 Conectado como: <span className="text-white font-semibold">{user?.nome || user?.name}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConviteJogoView;
