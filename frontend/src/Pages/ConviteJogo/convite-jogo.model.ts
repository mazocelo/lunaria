import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import type { NavigateFunction } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLayout } from '../../contexts/LayoutContext';
import { useGameLoading } from '../../contexts/GameLoadingContext';
import { historiaService } from '../../services/index';
import type { Historia } from '../../types/api';

interface UseConviteJogoModelArgs {
  navigate: NavigateFunction;
}

interface HistoriaConvite extends Partial<Historia> {
  titulo?: string;
}

export const useConviteJogoModel = ({ navigate }: UseConviteJogoModelArgs) => {
  const { user } = useAuth();
  const { hideSidebar, openSidebar } = useLayout();
  const { saveSelection, setLoading: setContextLoading, startTransition } = useGameLoading();
  const { id } = useParams<{ id: string }>();

  const [historia, setHistoria] = useState<HistoriaConvite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!user) {
      const targetUrl = `/convite-jogo/${id}`;
      localStorage.setItem('redirectAfterLogin', targetUrl);
      navigate('/login');
    }
  }, [user, navigate, id]);

  useEffect(() => {
    hideSidebar();
    return () => openSidebar();
  }, [hideSidebar, openSidebar]);

  const handleRedirectToGame = useCallback((historiaData: HistoriaConvite) => {
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

  useEffect(() => {
    if (!id || !user) return;

    setContextLoading('historia', true);
    setError(null);

    historiaService.getById(Number(id))
      .then((historiaData) => {
        const data = historiaData as unknown as HistoriaConvite;
        setHistoria(data);

        if (data.id != null) {
          saveSelection('historiaId', data.id);
        }
        saveSelection('configuracoes', {
          viaConvite: true,
          timestamp: new Date().toISOString(),
          convitedBy: 'link',
        });

        setContextLoading('historia', false);

        setTimeout(() => {
          handleRedirectToGame(data);
        }, 1500);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Erro ao carregar historia';
        setError(message);
        setContextLoading('historia', false);
      });
  }, [id, user, setContextLoading, saveSelection, handleRedirectToGame]);

  const handleRetry = useCallback(() => {
    setError(null);
    window.location.reload();
  }, []);

  const handleGoToHistorias = useCallback(() => {
    navigate('/historias');
  }, [navigate]);

  return {
    user,
    historia,
    error,
    redirecting,
    handleRetry,
    handleGoToHistorias,
  };
};

export default useConviteJogoModel;
