import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useLayout } from '../../../contexts/LayoutContext';
import { useGameLoading } from '../../../contexts/GameLoadingContext';
import Notification from '../../../components/Notification.jsx';
import { EtapaSelecaoPersonagem } from '../../../components/Jogo';
import { AuthLoading, AuthError } from '../../../components/Jogo/Shared/LoadingStates';
import HistoriaNotFound from '../../../components/Jogo/Shared/HistoriaNotFound';
import { jogoViewModel } from '../../../viewmodels/Jogo';
import useGameStore from '../../../store/game';

/**
 * 🎮 PÁGINA DE SELEÇÃO DE PERSONAGEM
 * 
 * Primeira etapa do jogo - seleção de personagem
 * Ao selecionar, navega para /jogo/:id/sala-espera
 */
export const SelecaoPersonagemView = () => {
  const { user } = useAuth();
  const { hideSidebar, openSidebar } = useLayout();
  const { getSelection } = useGameLoading();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  // 🎯 ESTADO DO VIEWMODEL
  const [viewModelState, setViewModelState] = useState(jogoViewModel.getState());
  
  // 🔒 FLAG PARA EVITAR MÚLTIPLOS CARREGAMENTOS
  const personagensCarregadosRef = useRef(false);
  const jogoInicializadoRef = useRef(false);

  // 🔄 SUBSCRIBE AO VIEWMODEL
  useEffect(() => {
    const unsubscribe = jogoViewModel.subscribe(setViewModelState);
    return unsubscribe;
  }, []);

  // 📊 DESTRUCTURING DO ESTADO
  const {
    historiaAtual,
    personagensDaHistoria,
    personagemSelecionado,
    error,
    loadingPersonagens,
    errorPersonagens,
  } = viewModelState;

  // 🚀 INICIALIZAÇÃO
  useEffect(() => {
    // Evitar inicialização duplicada
    if (jogoInicializadoRef.current) return;
    
    const inicializar = async () => {
      try {
        jogoInicializadoRef.current = true;
        
        // Verificar se veio de convite
        const fromInvite = location.state?.fromInvite || getSelection('configuracoes')?.fromInvite;

        // Verificar se há sessão ativa
        const { historiaService } = await import('../../../services/index.js');
        const sessaoData = await historiaService.verificarSessaoAtiva(id);
        
        if (sessaoData && sessaoData.hasActiveSession && sessaoData.isPlaying) {
          // Sessão ativa - RETOMAR JOGO (carrega história + personagem da sessão)
          console.log('🔄 SelecaoPersonagem: Sessão ativa detectada, retomando jogo...');
          
          // Retomar jogo completo (história + personagem)
          await jogoViewModel.retomarJogo(id, user);
          
          // Aguardar sincronização com GameStore
          await new Promise(resolve => setTimeout(resolve, 150));
          
          console.log('✅ SelecaoPersonagem: Jogo retomado, redirecionando para jogo ativo...');
          navigate(`/jogo/${id}/jogo-ativo`);
          return;
        }

        // Inicializar jogo
        console.log('🎮 SelecaoPersonagem: Inicializando jogo...', id);
        await jogoViewModel.initializeGame(id, { fromInvite });
        console.log('✅ SelecaoPersonagem: Jogo inicializado!');
        
        // Esconder sidebar
        hideSidebar();
      } catch (error) {
        console.error('❌ SelecaoPersonagem: Erro ao verificar sessão:', error);
        await jogoViewModel.initializeGame(id, { fromInvite: location.state?.fromInvite });
        hideSidebar();
      }
    };

    inicializar();

    // Cleanup
    return () => {
      openSidebar();
      jogoInicializadoRef.current = false;
    };
  }, [id]);

  // 👥 CARREGAR PERSONAGENS (somente uma vez após história carregada)
  useEffect(() => {
    if (historiaAtual && user?.id && !personagensCarregadosRef.current && !loadingPersonagens) {
      personagensCarregadosRef.current = true;
      jogoViewModel.carregarPersonagens(user.id);
    }
  }, [historiaAtual, user?.id, loadingPersonagens]);

  // 🎯 HANDLER - Selecionar personagem e navegar para sala de espera
  const handleSelecionarPersonagem = async (personagem) => {
    try {
      // Selecionar personagem
      await jogoViewModel.selecionarPersonagem(personagem, user);
      
      // Aguardar sincronização com GameStore (evita race condition com useJogoGuard)
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Verificar se foi sincronizado
      const gameStore = useGameStore.getState();
      console.log('🔍 SelecaoPersonagem: Verificando sincronização antes de navegar:', {
        personagemSelecionado: !!gameStore.personagemSelecionado,
        historiaAtual: !!gameStore.historiaAtual,
        salaAberta: gameStore.salaAberta
      });
      
      // Navegar para sala de espera
      navigate(`/jogo/${id}/sala-espera`);
    } catch (error) {
      console.error('❌ Erro ao selecionar personagem:', error);
    }
  };

  // 🎯 HANDLER - Voltar para histórias
  const handleVoltar = () => {
    navigate('/historias');
  };

  // 🔒 VALIDAÇÕES DE ACESSO (ordem importa!)
  
  // 1. Verificar autenticação
  if (!user) {
    console.log('🔒 SelecaoPersonagem: Usuário não autenticado');
    return <AuthLoading message="Verificando autenticação..." />;
  }

  // 2. Mostrar loading se estiver carregando (antes de verificar se carregou)
  if (viewModelState.loading || !historiaAtual) {
    console.log('⏳ SelecaoPersonagem: Carregando história...', { loading: viewModelState.loading, historiaAtual: !!historiaAtual });
    return <AuthLoading message="Carregando história..." />;
  }

  // 3. Mostrar erro se houver
  if (error) {
    console.log('❌ SelecaoPersonagem: Erro ao carregar:', error);
    return <AuthError message={error} onRetry={() => jogoViewModel.clearErrors()} />;
  }

  // 4. Se chegou aqui sem história, então não encontrou
  if (!historiaAtual) {
    console.log('❌ SelecaoPersonagem: História não encontrada');
    return <HistoriaNotFound onVoltar={handleVoltar} />;
  }
  
  console.log('✅ SelecaoPersonagem: Renderizando componente com história:', historiaAtual?.nome);

  // 🎨 RENDERIZAÇÃO
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Notificações de erro */}
      {error && (
        <Notification
          message={error}
          type="error"
          onClose={() => jogoViewModel.clearErrors()}
        />
      )}

      {errorPersonagens && (
        <Notification
          message={`Erro ao carregar personagens: ${errorPersonagens}`}
          type="error"
          onClose={() => jogoViewModel.clearErrorPersonagens()}
        />
      )}

      {/* Componente de Seleção de Personagem */}
      <EtapaSelecaoPersonagem
        historia={historiaAtual}
        personagens={personagensDaHistoria}
        personagemSelecionado={personagemSelecionado}
        loading={loadingPersonagens}
        error={errorPersonagens}
        onSelecionarPersonagem={handleSelecionarPersonagem}
        onVoltar={handleVoltar}
      />
    </div>
  );
};

export default SelecaoPersonagemView;

