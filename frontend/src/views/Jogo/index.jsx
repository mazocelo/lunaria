import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useViewModel } from '../../shared/hooks/useViewModel.js';
import { historiaViewModel } from '../../viewmodels/index.js';
import { LoadingSpinner, Notification } from '../../components/index.js';
import { useTheme } from '../../contexts/theme.jsx';
import { PersonagemService } from '../../services/PersonagemService.js';
import { apiClient } from '../../services/ApiClient.js';
import { useWebSocket } from '../../hooks/useWebSocket.js';
import { 
  HeaderJogo,
  EtapaInformacoes, 
  EtapaSelecaoPersonagem, 
  EtapaJogoAtivo 
} from './components/index.js';

/**
 * View para o início do jogo
 * Interface para iniciar uma sessão de RPG
 */
export const JogoView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  
  const {
    historiaAtual,
    loading,
    error,
    loadHistoria,
    clearError
  } = useViewModel(historiaViewModel);

  const [etapaAtual, setEtapaAtual] = useState('info'); // 'info', 'selecao-personagem', 'jogo'
  const [personagensDaHistoria, setPersonagensDaHistoria] = useState([]);
  const [personagemSelecionado, setPersonagemSelecionado] = useState(null);
  const [loadingPersonagens, setLoadingPersonagens] = useState(false);
  const [errorPersonagens, setErrorPersonagens] = useState(null);
  const [buscaPersonagem, setBuscaPersonagem] = useState('');
  const [participantes, setParticipantes] = useState([]);
  const [mensagens, setMensagens] = useState([]);
  const [mensagemAtual, setMensagemAtual] = useState('');
  const [usuariosDigitando, setUsuariosDigitando] = useState([]);

  // Estado para controlar se houve tentativa de conexão
  const [tentativaConexaoIniciada, setTentativaConexaoIniciada] = useState(false);

  const personagemService = new PersonagemService(apiClient);

  // WebSocket hook
  const webSocket = useWebSocket({
    onConnect: () => {
      console.log('🎮 WebSocket conectado no jogo');
    },
    onDisconnect: (data) => {
      console.log('🎮 WebSocket desconectado:', data.reason);
    },
    onMessage: (messageData) => {
      setMensagens(prev => [...prev, messageData]);
    },
    onError: (error) => {
      console.error('🎮 Erro WebSocket:', error);
    }
  });

  // Carrega a história ao montar o componente
  useEffect(() => {
    if (id) {
      loadHistoria(parseInt(id));
    }
  }, [id]);

  // Limpa erro quando componente desmonta
  useEffect(() => {
    return () => {
      clearError();
    };
  }, []);

  // Listeners para eventos WebSocket específicos
  useEffect(() => {
    if (!webSocket) return;

    // Listener para novos usuários na sala
    const handleUserJoined = (data) => {
      setParticipantes(prev => [...prev, data.user]);
      setMensagens(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        message: `${data.user.username} entrou na sala`,
        timestamp: new Date()
      }]);
    };

    // Listener para usuários saindo da sala
    const handleUserLeft = (data) => {
      setParticipantes(prev => prev.filter(p => p.id !== data.user.id));
      setMensagens(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        message: `${data.user.username} saiu da sala`,
        timestamp: new Date()
      }]);
    };

    // Listener para usuários digitando
    const handleUserTyping = (data) => {
      if (data.isTyping) {
        setUsuariosDigitando(prev => [...prev.filter(u => u !== data.username), data.username]);
      } else {
        setUsuariosDigitando(prev => prev.filter(u => u !== data.username));
      }
    };

    // Listener para resultados de ações
    const handleActionResult = (data) => {
      setMensagens(prev => [...prev, {
        id: Date.now(),
        type: 'action_result',
        message: data.result,
        user: data.user,
        timestamp: new Date()
      }]);
    };

    // Adicionar listeners
    webSocket.on('user_joined', handleUserJoined);
    webSocket.on('user_left', handleUserLeft);
    webSocket.on('user_typing', handleUserTyping);
    webSocket.on('action_result', handleActionResult);

    // Cleanup
    return () => {
      webSocket.off('user_joined', handleUserJoined);
      webSocket.off('user_left', handleUserLeft);
      webSocket.off('user_typing', handleUserTyping);
      webSocket.off('action_result', handleActionResult);
    };
  }, [webSocket]);

  // Carrega personagens quando entra na etapa de seleção
  useEffect(() => {
    if (etapaAtual === 'selecao-personagem' && historiaAtual) {
      carregarPersonagensDaHistoria();
    }
  }, [etapaAtual, historiaAtual]);

  const carregarPersonagensDaHistoria = async (opcoesBusca = {}) => {
    setLoadingPersonagens(true);
    setErrorPersonagens(null);
    
    try {
      const personagens = await personagemService.getByHistoria(historiaAtual.id, {
        search: buscaPersonagem,
        limit: 20,
        ...opcoesBusca
      });
      setPersonagensDaHistoria(personagens);
    } catch (error) {
      setErrorPersonagens(error.message);
    } finally {
      setLoadingPersonagens(false);
    }
  };

  const handleBuscaPersonagem = (e) => {
    const valor = e.target.value;
    setBuscaPersonagem(valor);
    
    // Debounce da busca
    const timeoutId = setTimeout(() => {
      carregarPersonagensDaHistoria({ search: valor });
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };

  const selecionarPersonagem = (personagem) => {
    setPersonagemSelecionado(personagem);
  };

  const iniciarSessaoComPersonagem = async () => {
    if (!personagemSelecionado) {
      setErrorPersonagens('Selecione um personagem para continuar');
      return;
    }

    try {
      // Marcar que iniciou tentativa de conexão
      setTentativaConexaoIniciada(true);

      // Conectar WebSocket se não estiver conectado
      if (!webSocket.isConnected) {
        await webSocket.connect();
      }

      // Autenticar se não estiver autenticado
      if (!webSocket.isAuthenticated) {
        await webSocket.authenticate({
          userId: 'temp_user_id', // TODO: Pegar do contexto de autenticação
          username: 'Jogador', // TODO: Pegar do usuário logado
          personagemId: personagemSelecionado.id
        });
      }

      // Gerar ID da sala baseado na história
      const roomId = `historia_${historiaAtual.id}`;
      
      // Entrar na sala
      await webSocket.joinRoom(roomId);

      // Iniciar sessão de jogo
      const sessionData = await webSocket.startSession({
        historiaId: historiaAtual.id,
        personagemId: personagemSelecionado.id,
        roomId: roomId
      });

      console.log('🎮 Sessão iniciada:', sessionData);
      setEtapaAtual('jogo');

    } catch (error) {
      console.error('❌ Erro ao iniciar sessão:', error);
      setErrorPersonagens(`Erro ao conectar: ${error.message}`);
    }
  };

  const voltarParaSelecaoPersonagem = async () => {
    // Sair da sala atual se estiver conectado
    if (webSocket.currentRoom) {
      await webSocket.leaveRoom();
    }
    
    setEtapaAtual('selecao-personagem');
    setPersonagemSelecionado(null);
    setMensagens([]);
  };

  const voltarParaInfo = () => {
    setEtapaAtual('info');
    setPersonagemSelecionado(null);
  };

  const voltarParaHistorias = async () => {
    // Desconectar WebSocket ao sair
    if (webSocket.isConnected) {
      webSocket.disconnect();
    }
    navigate('/historias');
  };

  // Funções do chat
  const enviarMensagem = () => {
    if (!mensagemAtual.trim() || !webSocket.isAuthenticated) return;

    try {
      webSocket.sendMessage({
        message: mensagemAtual,
        messageType: 'chat'
      });
      setMensagemAtual('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  const rolarDados = () => {
    if (!webSocket.isAuthenticated) return;

    try {
      webSocket.playerAction({
        action: 'roll_dice',
        actionData: {
          dice: '1d20',
          reason: 'Rolagem manual'
        }
      });
    } catch (error) {
      console.error('Erro ao rolar dados:', error);
    }
  };

  if (loading && !historiaAtual) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-fade-in">
        <div className="card-rpg max-w-md w-full">
          <LoadingSpinner 
            size="xl" 
            text="Carregando história..." 
            variant="primary"
          />
        </div>
      </div>
    );
  }

  if (!historiaAtual) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-fade-in">
        <div className="card-rpg max-w-md w-full text-center py-16">
          <div className="w-24 h-24 gradient-primary rounded-full mx-auto mb-6 flex items-center justify-center">
            <span className="text-4xl">❌</span>
          </div>
          <h3 className={`text-xl font-semibold mb-3 font-modern ${isLight ? 'text-slate-700' : 'text-white'}`}>
            História não encontrada
          </h3>
          <p className="text-slate-400 font-modern mb-8 leading-relaxed">
            A história que você está procurando não existe ou foi removida.
          </p>
          <button onClick={voltarParaHistorias} className="btn-rpg cursor-pointer px-8 py-3">
            ← Voltar para Histórias
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Notificação de erro */}
      {error && (
        <Notification
          message={error}
          type="error"
          onClose={clearError}
        />
      )}

      {/* Header */}
      <HeaderJogo
        etapaAtual={etapaAtual}
        webSocket={webSocket}
        tentativaConexaoIniciada={tentativaConexaoIniciada}
        onVoltarHistorias={voltarParaHistorias}
      />

      {/* Etapa 1: Informações da História */}
      {etapaAtual === 'info' && (
        <EtapaInformacoes
          historiaAtual={historiaAtual}
          onProximaEtapa={() => setEtapaAtual('selecao-personagem')}
        />
      )}

      {/* Etapa 2: Seleção de Personagem */}
      {etapaAtual === 'selecao-personagem' && (
        <EtapaSelecaoPersonagem
          personagensDaHistoria={personagensDaHistoria}
          personagemSelecionado={personagemSelecionado}
          loadingPersonagens={loadingPersonagens}
          errorPersonagens={errorPersonagens}
          buscaPersonagem={buscaPersonagem}
          onBuscaChange={handleBuscaPersonagem}
          onSelecionarPersonagem={selecionarPersonagem}
          onIniciarSessao={iniciarSessaoComPersonagem}
          onVoltarEtapa={voltarParaInfo}
        />
      )}

      {/* Etapa 3: Jogo Ativo */}
      {etapaAtual === 'jogo' && personagemSelecionado && (
        <EtapaJogoAtivo
          personagemSelecionado={personagemSelecionado}
          webSocket={webSocket}
          mensagens={mensagens}
          mensagemAtual={mensagemAtual}
          setMensagemAtual={setMensagemAtual}
          usuariosDigitando={usuariosDigitando}
          participantes={participantes}
          onEnviarMensagem={enviarMensagem}
          onHandleKeyPress={handleKeyPress}
          onRolarDados={rolarDados}
          onVoltarSelecaoPersonagem={voltarParaSelecaoPersonagem}
        />
      )}
    </div>
  );
}; 