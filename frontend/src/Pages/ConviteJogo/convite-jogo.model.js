import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLayout } from '../../contexts/LayoutContext';
import { useGameLoading } from '../../contexts/GameLoadingContext';
import { historiaService } from '../../services/index.js';

/**
 * Model hook para a pagina de Convite de Jogo.
 * Redireciona usuario que entrou via convite para a sala.
 *
 * Fluxo:
 * 1. Recebe ID da historia via URL (/convite-jogo/:id)
 * 2. Valida se usuario esta autenticado
 * 3. Carrega dados da historia
 * 4. Salva selecoes no GameLoadingContext
 * 5. Redireciona para /jogo/:id com estado otimizado
 */
export const useConviteJogoModel = ({ navigate } = {}) => {
  const { user } = useAuth();
  const { hideSidebar, openSidebar } = useLayout();
  const { saveSelection, setLoading: setContextLoading, startTransition } = useGameLoading();
  const { id } = useParams();

  // Estados locais
  const [historia, setHistoria] = useState(null);
  const [error, setError] = useState(null);
  const [redirecting, setRedirecting] = useState(false);

  // Verificar autenticacao
  useEffect(() => {
    if (!user) {
      const targetUrl = `/convite-jogo/${id}`;
      localStorage.setItem('redirectAfterLogin', targetUrl);
      navigate('/login');
    }
  }, [user, navigate, id]);

  // Configurar layout
  useEffect(() => {
    hideSidebar();
    return () => openSidebar();
  }, [hideSidebar, openSidebar]);

  // Redirecionar para o jogo
  const handleRedirectToGame = useCallback((historiaData) => {
    setRedirecting(true);
    startTransition('convite', 'selecao-personagem');
    navigate(`/jogo/${historiaData.id}/selecao-personagem`, {
      state: {
        fromInvite: true,
        historia: historiaData,
        timestamp: new Date().toISOString(),
      },
    });
  }, [navigate, startTransition]);

  // Carregar dados da historia
  useEffect(() => {
    if (!id || !user) return;

    setContextLoading('historia', true);
    setError(null);

    historiaService.getById(id)
      .then(historiaData => {
        setHistoria(historiaData);

        saveSelection('historiaId', historiaData.id);
        saveSelection('configuracoes', {
          viaConvite: true,
          timestamp: new Date().toISOString(),
          convitedBy: 'link',
        });

        setContextLoading('historia', false);

        // Iniciar redirecionamento apos breve delay para UX
        setTimeout(() => {
          handleRedirectToGame(historiaData);
        }, 1500);
      })
      .catch(err => {
        setError(err.message || 'Erro ao carregar historia');
        setContextLoading('historia', false);
      });
  }, [id, user, setContextLoading, saveSelection, handleRedirectToGame]);

  // Tentar novamente
  const handleRetry = useCallback(() => {
    setError(null);
    window.location.reload();
  }, []);

  // Voltar para historias
  const handleGoToHistorias = useCallback(() => {
    navigate('/historias');
  }, [navigate]);

  return {
    // State
    user,
    historia,
    error,
    redirecting,

    // Handlers
    handleRetry,
    handleGoToHistorias,
  };
};

export default useConviteJogoModel;
