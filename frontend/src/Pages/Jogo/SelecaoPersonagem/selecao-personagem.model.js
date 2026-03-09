import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useLayout } from '../../../contexts/LayoutContext';
import { useGameLoading } from '../../../contexts/GameLoadingContext';
import { useJogo } from '../hooks';

/**
 * Model hook para a pagina de Selecao de Personagem.
 * Primeira etapa do jogo - selecao de personagem.
 * Ao selecionar, navega para /jogo/:id/sala-espera.
 */
export const useSelecaoPersonagemModel = () => {
  const { user } = useAuth();
  const { hideSidebar, openSidebar } = useLayout();
  const { getSelection } = useGameLoading();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  // Shared game hook
  const jogo = useJogo();

  const {
    historiaAtual,
    personagensDaHistoria,
    personagemSelecionado,
    error,
    loading,
    loadingPersonagens,
    errorPersonagens,
    initializeGame,
    carregarPersonagens,
    selecionarPersonagem,
    retomarJogo,
    clearErrors,
    clearErrorPersonagens,
  } = jogo;

  // Flags para evitar multiplos carregamentos
  const personagensCarregadosRef = useRef(false);
  const jogoInicializadoRef = useRef(false);

  // Inicializacao
  useEffect(() => {
    if (jogoInicializadoRef.current) return;

    const inicializar = async () => {
      try {
        jogoInicializadoRef.current = true;

        const fromInvite = location.state?.fromInvite || getSelection('configuracoes')?.fromInvite;

        // Verificar se ha sessao ativa
        const { historiaService } = await import('../../../services/index.js');
        const sessaoData = await historiaService.verificarSessaoAtiva(id);

        if (sessaoData && sessaoData.hasActiveSession && sessaoData.isPlaying) {
          // Sessao ativa - RETOMAR JOGO
          await retomarJogo(id, user);
          await new Promise(resolve => setTimeout(resolve, 150));
          navigate(`/jogo/${id}/jogo-ativo`);
          return;
        }

        // Inicializar jogo
        await initializeGame(id, { fromInvite });
        hideSidebar();
      } catch {
        await initializeGame(id, { fromInvite: location.state?.fromInvite });
        hideSidebar();
      }
    };

    inicializar();

    return () => {
      openSidebar();
      jogoInicializadoRef.current = false;
    };
  }, [id]);

  // Carregar personagens (somente uma vez apos historia carregada)
  useEffect(() => {
    if (historiaAtual && user?.id && !personagensCarregadosRef.current && !loadingPersonagens) {
      personagensCarregadosRef.current = true;
      carregarPersonagens(user.id);
    }
  }, [historiaAtual, user?.id, loadingPersonagens, carregarPersonagens]);

  // Handler - Selecionar personagem e navegar para sala de espera
  const handleSelecionarPersonagem = useCallback(async (personagem) => {
    try {
      await selecionarPersonagem(personagem, user);
      navigate(`/jogo/${id}/sala-espera`);
    } catch {
      // silenced
    }
  }, [selecionarPersonagem, user, id, navigate]);

  // Handler - Voltar para historias
  const handleVoltar = useCallback(() => {
    navigate('/historias');
  }, [navigate]);

  // Handler - Limpar erros
  const handleClearErrors = useCallback(() => {
    clearErrors();
  }, [clearErrors]);

  const handleClearErrorPersonagens = useCallback(() => {
    clearErrorPersonagens();
  }, [clearErrorPersonagens]);

  return {
    // State
    user,
    historiaAtual,
    personagensDaHistoria,
    personagemSelecionado,
    error,
    loading,
    loadingPersonagens,
    errorPersonagens,

    // Handlers
    handleSelecionarPersonagem,
    handleVoltar,
    handleClearErrors,
    handleClearErrorPersonagens,
  };
};

export default useSelecaoPersonagemModel;
