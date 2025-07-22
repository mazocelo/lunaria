import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLayout } from '../../contexts/LayoutContext';
import Notification from '../../components/Notification.jsx';

// 🏪 Importar stores diretamente
import { useGameStore, useSocketStore, initializeAllStores } from '../../store';

// 🎨 Importar componentes das etapas
import { EtapaSelecaoPersonagem } from './components';
import { EtapaSalaEspera } from './components';
import { EtapaJogoRPG } from './components';

// 🔧 Importar componentes compartilhados
import { AuthLoading, AuthError } from './components/shared/LoadingStates';
import HistoriaNotFound from './components/shared/HistoriaNotFound';

// 🎛️ Importar services
import { historiaService, personagemService } from '../../services/index.js';

/**
 * 🎮 VIEW PRINCIPAL DO JOGO - Conectada diretamente às Stores
 * 
 * Usa diretamente:
 * - useGameStore: Estados e ações do jogo
 * - useSocketStore: Estados e ações da conexão WebSocket
 * - Services: Acesso direto à API sem ViewModels
 */
export const JogoView = () => {
  const { user } = useAuth();
  const { hideSidebar, openSidebar } = useLayout();
  const navigate = useNavigate();
  const { id } = useParams();

  // 🏪 STORES ZUSTAND - Acesso direto aos estados e ações
  const {
    // Estados
    etapaAtual,
    historiaAtual,
    personagensDaHistoria,
    personagemSelecionado,
    participantes,
    salaAberta,
    isDonoSala,
    loading,
    error,
    loadingPersonagens,
    errorPersonagens,
    mensagens,
    statusPersonagem,

    // Ações
    setHistoriaAtual,
    mudarEtapa,
    setPersonagensDaHistoria,
    selecionarPersonagem,
    setLoading,
    setError,
    clearErrors,
    setLoadingPersonagens,
    setErrorPersonagens,
    iniciarJogo,
    abrirSala,
    adicionarMensagem,
    setStatusPersonagem,
    resetGameState
  } = useGameStore();

  const {
    // Estados Socket
    isConnected,
    error: socketError,
    latency,
    isTyping,
    roomUsers,

    // Ações Socket
    clearError: clearSocketError,
    resetSocketState
  } = useSocketStore();

  // 🎯 HANDLERS DAS ETAPAS
  const handleSelecionarPersonagem = (personagem) => {
    console.log('👤 JogoView: Personagem selecionado:', personagem);
    selecionarPersonagem(personagem);
    mudarEtapa('sala-espera');
  };

  const handleIniciarJogo = () => {
    console.log('🎮 JogoView: Iniciando jogo...');
    iniciarJogo();
    abrirSala();
    mudarEtapa('jogo-ativo');
  };

  const handleSairDaSala = () => {
    console.log('🚪 JogoView: Saindo da sala...');
    resetGameState();
    resetSocketState();
    navigate('/historias');
  };

  const handleVoltarEtapa = () => {
    console.log('⬅️ JogoView: Voltando etapa anterior');
    switch (etapaAtual) {
      case 'selecao-personagem':
        navigate('/historias'); // Volta direto para histórias
        break;
      case 'sala-espera':
        mudarEtapa('selecao-personagem');
        break;
      case 'jogo-ativo':
        mudarEtapa('sala-espera');
        break;
      default:
        navigate('/historias');
    }
  };

  // 🚀 INICIALIZAÇÃO - Carrega diretamente na seleção de personagem
  useEffect(() => {
    console.log('🚀 JogoView: Inicializando diretamente na seleção de personagem...');
    
    // Inicializar stores na primeira vez
    initializeAllStores();
    
    // Esconder sidebar para tela cheia
    hideSidebar();
    
    // Cleanup ao desmontar
    return () => {
      console.log('🧹 JogoView: Limpeza ao desmontar');
      openSidebar();
    };
  }, []);

  // 📚 CARREGAR HISTÓRIA - Usando service direto
  useEffect(() => {
    if (id && !historiaAtual && !loading) {
      console.log('📚 JogoView: Carregando história...', id);
      setLoading(true);
      clearErrors();
      
      // ✅ USAR HISTORIASERVICE DIRETO conforme nova arquitetura
      historiaService.getById(id)
        .then(historia => {
          console.log('✅ JogoView: História carregada:', historia);
          setHistoriaAtual(historia);
          setLoading(false);
        })
        .catch(error => {
          console.error('❌ JogoView: Erro ao carregar história:', error);
          setError('Erro ao carregar história: ' + error.message);
          setLoading(false);
        });
    }
  }, [id, historiaAtual]); // ✅ Removido 'loading' pois é alterado dentro

  // 👥 CARREGAR PERSONAGENS DA HISTÓRIA
  useEffect(() => {
    if (historiaAtual && personagensDaHistoria.length === 0 && !loadingPersonagens) {
      console.log('👥 JogoView: Carregando personagens da história...', historiaAtual.id);
      setLoadingPersonagens(true);
      setErrorPersonagens(null);

      // ✅ USAR SERVICE REAL conforme API documentation
      personagemService.getByHistoria(historiaAtual.id)
        .then(response => {
          console.log('✅ JogoView: Personagens carregados:', response);
          
          // ✅ Tratar nova estrutura de resposta:
          // { personagens: array, historia: object, pagination: object, message: string, total: number }
          setPersonagensDaHistoria(response.personagens || []);
          setLoadingPersonagens(false);
          
          // 📊 Log informações úteis de debug
          if (response.total > 0) {
            console.log(`📊 Total de ${response.total} personagens encontrados para a história`);
          }
          if (response.pagination?.hasMore) {
            console.log('📄 Há mais personagens disponíveis (paginação)');
          }
        })
        .catch(error => {
          console.error('❌ JogoView: Erro ao carregar personagens:', error);
          setErrorPersonagens('Erro ao carregar personagens: ' + error.message);
          setLoadingPersonagens(false);
          
          // ✅ Fallback: Se não houver personagens, permitir que continue
          setPersonagensDaHistoria([]);
        });
    }
  }, [historiaAtual, personagensDaHistoria.length]); // ✅ Removido 'loadingPersonagens' pois é alterado dentro

  // 🔒 VALIDAÇÕES DE ACESSO
  if (!user) {
    return <AuthLoading message="Verificando autenticação..." />;
  }

  if (error && !historiaAtual) {
    return <AuthError message={error} onRetry={() => clearErrors()} />;
  }

  if (!historiaAtual && loading) {
    return <AuthLoading message="Carregando história..." />;
  }

  if (!historiaAtual) {
    return <HistoriaNotFound onVoltar={() => navigate('/historias')} />;
  }

  // 🎨 RENDERIZAÇÃO POR ETAPA
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 🚨 Notificações de erro */}
      {error && (
        <Notification
          message={error}
          type="error"
          onClose={clearErrors}
        />
      )}
      
      {socketError && (
        <Notification
          message={`Erro de conexão: ${socketError}`}
          type="error"
          onClose={clearSocketError}
        />
      )}

      {errorPersonagens && (
        <Notification
          message={`Erro ao carregar personagens: ${errorPersonagens}`}
          type="error"
          onClose={() => setErrorPersonagens(null)}
        />
      )}

      {/* 🎮 STATUS DEBUG (desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-black/80 text-white p-2 rounded text-xs z-50">
          <div>Etapa: {etapaAtual}</div>
          <div>Socket: {isConnected ? '🟢' : '🔴'} {latency}ms</div>
          <div>Participantes: {participantes.length}</div>
        </div>
      )}

      {/* 🎯 RENDERIZAÇÃO CONDICIONAL POR ETAPA */}
      {etapaAtual === 'selecao-personagem' && (
        <EtapaSelecaoPersonagem
          historia={historiaAtual}
          personagens={personagensDaHistoria}
          personagemSelecionado={personagemSelecionado}
          loading={loadingPersonagens}
          error={errorPersonagens}
          onSelecionarPersonagem={handleSelecionarPersonagem}
          onVoltar={handleVoltarEtapa}
        />
      )}

      {etapaAtual === 'sala-espera' && (
        <EtapaSalaEspera
          historia={historiaAtual}
          personagemSelecionado={personagemSelecionado}
          participantes={participantes}
          isDonoSala={isDonoSala}
          salaAberta={salaAberta}
          socketConnected={isConnected}
          roomUsers={roomUsers}
          onIniciarJogo={handleIniciarJogo}
          onSair={handleSairDaSala}
          onVoltar={handleVoltarEtapa}
        />
      )}

      {etapaAtual === 'jogo-ativo' && (
        <EtapaJogoRPG
          historia={historiaAtual}
          personagemSelecionado={personagemSelecionado}
          participantes={participantes}
          mensagens={mensagens}
          statusPersonagem={statusPersonagem}
          isDonoSala={isDonoSala}
          socketConnected={isConnected}
          isTyping={isTyping}
          onAdicionarMensagem={adicionarMensagem}
          onAtualizarStatus={setStatusPersonagem}
          onSair={handleSairDaSala}
        />
      )}
    </div>
  );
};

export default JogoView; 