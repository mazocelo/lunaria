import { historiaService, personagemService, authService } from '../../services/index.js';
import { getGameStoreAPI, getSocketStoreAPI } from '../../store/index.js';
import { etapaSelecaoPersonagemViewModel } from './EtapaSelecaoPersonagemViewModel';
import { etapaSalaEsperaViewModel } from './EtapaSalaEsperaViewModel';
import { etapaJogoRPGViewModel } from './EtapaJogoRPGViewModel';
import { inputAreaViewModel } from './InputAreaViewModel';

/**
 * ViewModel principal para gerenciar o estado e lógica de negócio do Jogo
 * Responsável pela comunicação entre View e services/stores
 * 
 * Funcionalidades:
 * - Gerenciamento das etapas do jogo (seleção, sala de espera, jogo ativo)
 * - Carregamento de história e personagens
 * - Conexão WebSocket
 * - Navegação entre etapas
 * - Coordenação com ViewModels específicos de cada etapa
 */
export class JogoViewModel {
  constructor() {
    // Estados principais
    this.historiaAtual = null;
    this.personagensDaHistoria = [];
    this.personagemSelecionado = null;
    this.participantes = [];
    this.salaAberta = false;
    this.isDonoSala = false;
    
    // Estados de loading e erro
    this.loading = false;
    this.error = null;
    this.loadingPersonagens = false;
    this.errorPersonagens = null;
    
    // Estados do jogo ativo
    this.mensagens = [];
    this.statusPersonagem = null;
    
    // Estados do socket
    this.isConnected = false;
    this.socketError = null;
    this.latency = 0;
    this.isTyping = false;
    this.roomUsers = [];
    this.isConnecting = false;
    
    // Flags de controle interno (não afetam loading global)
    this.isInitializing = false;
    this.isLoadingHistoria = false;
    
    // ✅ Cleanup de subscriptions
    this.socketStoreUnsubscribe = null;
    
    // Observers para mudanças de estado
    this.observers = [];
  }


  /**
   * Adiciona um observer para mudanças de estado
   * @param {Function} observer - Função callback
   */
  subscribe = (observer) => {
    this.observers.push(observer);
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  /**
   * Notifica todos os observers sobre mudanças
   */
  notify = () => {
    this.observers.forEach(observer => observer(this.getState()));
  }

  /**
   * Retorna o estado atual do ViewModel
   */
  getState = () => ({
    // Estados principais
    historiaAtual: this.historiaAtual,
    personagensDaHistoria: this.personagensDaHistoria,
    personagemSelecionado: this.personagemSelecionado,
    participantes: this.participantes,
    salaAberta: this.salaAberta,
    isDonoSala: this.isDonoSala,
    
    // Estados de loading e erro
    loading: this.loading,
    error: this.error,
    loadingPersonagens: this.loadingPersonagens,
    errorPersonagens: this.errorPersonagens,
    
    // Estados do jogo ativo
    mensagens: this.mensagens,
    statusPersonagem: this.statusPersonagem,
    
    // Estados do socket
    isConnected: this.isConnected,
    socketError: this.socketError,
    latency: this.latency,
    isTyping: this.isTyping,
    roomUsers: this.roomUsers,
    isConnecting: this.isConnecting
  });

  /**
   * Inicializa o jogo com uma história específica
   * @param {string} historiaId - ID da história
   * @param {Object} options - Opções de inicialização
   */
  async initializeGame(historiaId, options = {}) {
    // Proteção contra inicializações duplicadas APENAS se já estiver inicializando
    if (this.isInitializing) {
      return;
    }

    try {
      this.isInitializing = true;
      this.clearErrors();

      // Carregar história (usa sua própria flag de loading)
      await this.carregarHistoria(historiaId);

      // Inicializar ViewModels específicos
      await this.initializeEtapaViewModels();

      this.isInitializing = false;
      this.notify();
    } catch (error) {
      this.setError('Erro ao inicializar jogo: ' + error.message);
      this.isInitializing = false;
      this.notify();
    }
  }

  /**
   * Inicializa os ViewModels específicos de cada etapa
   */
  async initializeEtapaViewModels() {
    try {
      // Inicializar ViewModel de seleção de personagem
      await etapaSelecaoPersonagemViewModel.initialize(this.setLoading.bind(this));
      
      // Inicializar ViewModel de sala de espera
      etapaSalaEsperaViewModel.initialize(this.recarregarPersonagens.bind(this), this.setLoading.bind(this));
      
      // Inicializar ViewModel de jogo RPG
      etapaJogoRPGViewModel.initialize();
      
      // Inicializar ViewModel de input
      inputAreaViewModel.initialize(this.setLoading.bind(this));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Carrega uma história pelo ID
   * @param {string} historiaId - ID da história
   */
  async carregarHistoria(historiaId) {
    // Proteção APENAS contra carregamento simultâneo da história
    if (this.isLoadingHistoria) {
      return;
    }

    try {
      this.isLoadingHistoria = true;
      this.setLoading(true);
      this.clearErrors();

      const historia = await historiaService.getById(historiaId);
      this.historiaAtual = historia;

      // ✅ SINCRONIZAR COM GAMESTORE
      const gameStore = getGameStoreAPI();
      gameStore.setHistoriaAtual(historia);

      this.setLoading(false);
      this.isLoadingHistoria = false;
      this.notify();
    } catch (error) {
      this.setError('Erro ao carregar história: ' + error.message);
      this.setLoading(false);
      this.isLoadingHistoria = false;
      this.notify();
    }
  }

  /**
   * Carrega personagens do usuário para a história atual
   * @param {string} userId - ID do usuário
   */
  async carregarPersonagens(userId) {
    // Proteção contra carregamentos duplicados
    if (!this.historiaAtual || !userId || this.loadingPersonagens) {
      return;
    }

    try {
      this.setLoadingPersonagens(true);
      this.clearErrorPersonagens();

      const response = await personagemService.getByUsuarioEHistoria(userId, this.historiaAtual.id);
      // Atualizar estado local
      const personagens = response.personagens || [];
      this.personagensDaHistoria = personagens;
      // Sincronizar com GameStore
      const gameStore = getGameStoreAPI();
      gameStore.setPersonagensDaHistoria(personagens);
      this.setLoadingPersonagens(false);
      this.notify();
    } catch (error) {
      this.setErrorPersonagens(error.message);
      this.setLoadingPersonagens(false);
      this.notify();
    }
  }

  /**
   * Recarrega personagens do usuário para a história atual (força recarga)
   * @param {string} userId - ID do usuário
   */
  async recarregarPersonagens(userId) {
    if (!this.historiaAtual || !userId || this.loadingPersonagens) {
      return;
    }

    try {
      this.setLoadingPersonagens(true);
      this.clearErrorPersonagens();

      const response = await personagemService.getByUsuarioEHistoria(userId, this.historiaAtual.id);

      // Atualizar estado local (força atualização)
      const personagens = response.personagens || [];
      this.personagensDaHistoria = personagens;
      // Sincronizar com GameStore
      const gameStore = getGameStoreAPI();
      gameStore.setPersonagensDaHistoria(personagens);
      this.setLoadingPersonagens(false);
      this.notify();
    } catch (error) {
      this.setErrorPersonagens(error.message);
      this.setLoadingPersonagens(false);
      this.notify();
    }
  }

  /**
   * Seleciona um personagem e avança para a sala de espera
   * @param {Object} personagem - Personagem selecionado
   * @param {Object} user - Usuário atual
   */
  async selecionarPersonagem(personagem, user) {
    this.personagemSelecionado = personagem;
    
    // Verificar se é dono pela história (comparar id_usuario da história com user.id)
    // Converter ambos para string para garantir comparação correta
    this.isDonoSala = String(this.historiaAtual?.id_usuario) === String(user?.id);
    this.salaAberta = true;

    // ✅ SINCRONIZAR COM GAMESTORE
    const gameStore = getGameStoreAPI();
    gameStore.selecionarPersonagem(personagem);
    gameStore.setIsDonoSala(this.isDonoSala);
    gameStore.abrirSala();
    
    // Adicionar o usuário atual como participante
    const novoParticipante = {
      userId: user?.id,
      username: user?.nome || user?.name,
      personagem: personagem.nome,
      personagemNome: personagem.nome,  // Garantir que ambos campos existem
      personagemId: personagem.id,
      isOwner: this.isDonoSala,  // Usar valor calculado
      status: 'pronto'  // Já selecionou personagem
    };
    
    this.participantes = [novoParticipante];
    
    // Recarregar personagens ao abrir a sala de espera
    if (user?.id) {
      await this.recarregarPersonagens(user.id);
    }
    
    // Inicializar sala de espera (recarregar personagens novamente se necessário)
    if (user?.id) {
      await etapaSalaEsperaViewModel.inicializarSala(user.id);
    }
    
    this.notify();
  }

  /**
   * Inicia o jogo ativo (chama API para iniciar aventura)
   */
  async iniciarJogo() {
    try {
      // ✅ Chamar API para iniciar partida (isso emitirá aventura_iniciada via WebSocket)
      await etapaSalaEsperaViewModel.iniciarPartidaViaAPI(
        this.historiaAtual?.id,
        `Bem-vindos à aventura "${this.historiaAtual?.nome}"! Que a jornada comece!`
      );

      // Atualizar estado local
      this.salaAberta = true;
      this.notify();

    } catch (error) {
      this.setError(error.message || 'Erro ao iniciar jogo');
      throw error;
    }
  }

  /**
   * Sai do jogo e reseta o estado
   */
  sairDoJogo() {
    this.resetGameState();
    this.resetSocketState();
    this.notify();
  }

  /**
   * Retorna para onde voltar (usado pelas views para navegação)
   * @deprecated Use navegação direta nas views
   */
  voltarEtapa() {
    // Sempre volta para histórias
    return 'historias';
  }

  /**
   * Valida autenticação (verifica dados do usuário)
   * O token real está no cookie HttpOnly e é validado automaticamente pelo backend
   * @returns {Promise<boolean>} Se o usuário está autenticado
   * @throws {Error} Se não houver dados do usuário
   */
  async validarAutenticacao() {
    try {
      // Verificar se há dados do usuário (autenticação básica)
      const userData = localStorage.getItem('user');
      
      if (!userData) {
        throw new Error('Usuário não autenticado. Por favor, faça login novamente.');
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Conecta ao WebSocket (para anfitrião da sala)
   * @param {Object} connectionData - Dados de conexão
   */
  async conectarSocket(connectionData) {
    try {
      this.isConnecting = true;
      this.clearErrors();
      this.notify();

      // Validar autenticação
      await this.validarAutenticacao();

      // Obter store dinamicamente
      const socketStore = getSocketStoreAPI();

      // Conectar ao WebSocket (socketToken já está no store Zustand)
      await socketStore.connect();

      // Obter socketToken do Zustand store
      const socketToken = socketStore.getState().socketToken;

      await socketStore.authenticate({
        token: socketToken,
        userId: String(connectionData.userId),
        username: connectionData.username,
        email: connectionData.email
      });

      // Aguardar um pouco para garantir que autenticação foi processada no backend
      await new Promise(resolve => setTimeout(resolve, 500));

      // Se tiver história, entrar na sala
      if (this.historiaAtual?.id && this.personagemSelecionado?.id) {
        await socketStore.joinRoom({
          // Dados completos para prepareRoomData normalizar
          id: this.historiaAtual.id,
          historiaId: String(this.historiaAtual.id),
          nome: this.historiaAtual.nome,
          titulo: this.historiaAtual.nome,
          userId: String(connectionData.userId),
          username: connectionData.username,
          personagemId: String(this.personagemSelecionado.id),
          personagemNome: this.personagemSelecionado.nome || 'Personagem'
        });
        
        // CARREGAR PARTICIPANTES IMEDIATAMENTE da sessão
        const roomState = socketStore.getState();

        if (roomState.session?.jogadoresConectados) {
          const participantesFormatados = roomState.session.jogadoresConectados.map(j => {
            // Verificar se já existe este participante localmente
            const participanteExistente = this.participantes.find(p => String(p.userId) === String(j.userId));

            const isOwner = String(j.userId) === String(this.historiaAtual?.id_usuario);

            // Se existe localmente, MESCLAR dados (preservar dados locais completos)
            if (participanteExistente) {
              return {
                ...j,                      // Dados da sessão
                ...participanteExistente,  // Sobrescrever com dados locais (preserva personagemNome)
                isOwner: isOwner           // Sempre atualizar isOwner com valor correto
              };
            }

            // Se não existe, criar novo a partir da sessão
            return {
              userId: j.userId,
              username: j.username,
              personagem: j.personagemNome || 'Selecionando...',
              personagemNome: j.personagemNome,
              personagemId: j.personagemId,
              status: j.status || 'selecionando',
              isOwner: isOwner
            };
          });
          
          this.atualizarParticipantes(participantesFormatados);
        }

        // ✅ SINCRONIZAR COM SOCKET STORE (atualização em tempo real)
        
        // Se já existir um unsubscribe anterior, chamar primeiro
        if (this.socketStoreUnsubscribe) {
          this.socketStoreUnsubscribe();
        }
        
        // Adicionar listener para mudanças de participantes no socket store
        const unsubscribe = socketStore.subscribe((state, prevState) => {
          // Verificar se participantes mudaram
          if (state.participantes && state.participantes.length !== prevState?.participantes?.length) {
            this.atualizarParticipantes(state.participantes);
          }
        });

        // Guardar para cleanup posterior
        this.socketStoreUnsubscribe = unsubscribe;

        // ✅ VERIFICAR SE SESSÃO FOI INICIADA - Redirecionar para jogo ativo
        if (roomState.session?.status === 'iniciada') {
          
          // Carregar mensagens
          await this.carregarMensagensSalvas(this.historiaAtual.id);
          
          // Ir para jogo ativo
          this.mudarEtapa('jogo-ativo');
          
          this.isConnected = true;
          this.isConnecting = false;
          this.socketError = null;
          this.notify();
          return;
        }
      }

      // Atualizar estado local
      this.isConnected = true;
      this.isConnecting = false;
      this.socketError = null;

      this.notify();

    } catch (error) {
      this.socketError = error.message || 'Erro ao conectar';
      this.isConnecting = false;
      this.isConnected = false;
      this.notify();
      throw error;
    }
  }

  /**
   * Conecta um jogador convidado ao WebSocket e à sala
   * @param {number} historiaId - ID da história
   * @param {number} personagemId - ID do personagem selecionado
   * @param {Object} user - Dados do usuário
   */
  async conectarComoConvidado(historiaId, personagemId, user) {
    try {
      this.isConnecting = true;
      this.clearErrors();
      this.notify();

      // 1. Buscar dados da sessão/sala existente (usando historiaService com token)
      const statusData = await historiaService.getStatusJogo(historiaId);
      const { sessao } = statusData || {};
      
      if (!sessao) {
        throw new Error('Sala não encontrada ou ainda não foi criada');
      }

      // 2. Validar autenticação
      await this.validarAutenticacao();

      // 3. Obter store
      const { getSocketStoreAPI } = await import('../../store/index.js');
      const socketStore = getSocketStoreAPI();

      // 4. Conectar ao WebSocket (socketToken já está no store Zustand)
      await socketStore.connect();

      // Obter socketToken do Zustand store
      const socketToken = socketStore.getState().socketToken;

      await socketStore.authenticate({
        token: socketToken,
        userId: String(user.id),
        username: user.nome || user.name,
        email: user.email
      });

      // Aguardar processamento no backend
      await new Promise(resolve => setTimeout(resolve, 500));

      // 6. Entrar na sala
      const personagem = this.personagemSelecionado;

      await socketStore.joinRoom({
        // Dados completos para prepareRoomData normalizar
        id: parseInt(historiaId),
        historiaId: String(historiaId),
        nome: this.historiaAtual?.nome || sessao.historiaNome || 'História',
        titulo: this.historiaAtual?.nome || sessao.historiaNome || 'História',
        userId: String(user.id),
        username: user.nome || user.name,
        personagemId: String(personagemId),
        personagemNome: personagem?.nome || 'Personagem'
      });

      // 7. Atualizar estado local
      this.isConnected = true;
      this.isConnecting = false;
      this.socketError = null;

      this.notify();

    } catch (error) {
      this.socketError = error.message || 'Erro ao conectar à sala';
      this.isConnecting = false;
      this.isConnected = false;
      this.notify();
      throw error;
    }
  }

  /**
   * Adiciona uma mensagem ao chat
   * @param {Object} mensagem - Mensagem a ser adicionada
   */
  adicionarMensagem(mensagem) {
    this.mensagens = [...this.mensagens, mensagem];
    
    // ✅ SINCRONIZAR COM GAMESTORE
    const gameStore = getGameStoreAPI();
    gameStore.adicionarMensagem(mensagem);
    
    this.notify();
  }

  /**
   * Limpa mensagens de dados do chat (mantém apenas mensagens do Mestre)
   * Usado quando a ordem de jogadores é definida
   * @param {Array} mensagensFiltradas - Mensagens a manter (opcional)
   */
  limparMensagensDados(mensagensFiltradas = null) {
    if (mensagensFiltradas) {
      this.mensagens = mensagensFiltradas;
    } else {
      // Filtrar automaticamente para manter apenas mensagens do Mestre
      this.mensagens = this.mensagens.filter(m => 
        m.tipo === 'mestre' || m.tipo === 'entre_rodadas'
      );
    }
    
    // ✅ SINCRONIZAR COM GAMESTORE
    const gameStore = getGameStoreAPI();
    gameStore.setMensagens(this.mensagens);
    
    this.notify();
  }

  /**
   * Carrega mensagens salvas do Redis
   * @param {number} historiaId - ID da história
   */
  async carregarMensagensSalvas(historiaId) {
    try {
      // Usar historiaService com token
      const statusData = await historiaService.getStatusJogo(historiaId);
      const { sessao } = statusData || {};

      // ✅ Carregar participantes da sessão
      if (sessao?.jogadores) {
        const jogadoresArray = Object.values(sessao.jogadores);
        if (jogadoresArray.length > 0) {
          const participantesFormatados = jogadoresArray.map(j => ({
            userId: j.id,
            username: j.nome,
            personagem: j.personagemNome,
            personagemId: j.personagemId,
            personagemNome: j.personagemNome
          }));
          this.atualizarParticipantes(participantesFormatados);
        }
      }
      
      if (sessao?.mensagens && Array.isArray(sessao.mensagens)) {
        const mensagensFormatadas = sessao.mensagens.map(m => ({
          id: m.timestamp || Date.now(),
          userId: m.userId,
          username: m.username,
          message: m.mensagem,
          tipo: m.tipo,
          timestamp: m.timestamp
        }));
        
        this.mensagens = mensagensFormatadas;
        
        // ✅ SINCRONIZAR COM GAMESTORE
        const gameStore = getGameStoreAPI();
        gameStore.setMensagens(mensagensFormatadas);

        this.notify();
        return sessao.mensagens.length;
      } else {
        return 0;
      }
    } catch (error) {
      return 0;
    }
  }

  /**
   * Retoma um jogo ativo (carrega estado do Redis)
   * @param {number} historiaId - ID da história
   * @param {Object} user - Dados do usuário
   */
  async retomarJogo(historiaId, user) {
    try {
      this.setLoading(true);
      this.clearErrors();
      
      // 1. Carregar história
      await this.carregarHistoria(historiaId);
      
      // 2. Buscar dados da sessão (usando historiaService com token)
      const statusData = await historiaService.getStatusJogo(historiaId);
      const { sessao } = statusData || {};
      
      if (!sessao) {
        throw new Error('Sessão não encontrada');
      }
      
      // 3. Buscar personagem do usuário no mapa de jogadores (IMUTÁVEL)
      const dadosJogador = sessao.jogadores?.[String(user?.id)];

      if (dadosJogador?.personagemId) {
        try {
          // Buscar dados completos do personagem
          const personagem = await personagemService.getById(dadosJogador.personagemId);
          
          // Pré-selecionar personagem
          this.personagemSelecionado = personagem;
          
          // Definir se é dono da sala
          this.isDonoSala = String(this.historiaAtual?.id_usuario) === String(user?.id);

          // ✅ SINCRONIZAR COM GAMESTORE
          const gameStore = getGameStoreAPI();
          gameStore.setHistoriaAtual(this.historiaAtual);
          gameStore.selecionarPersonagem(this.personagemSelecionado);
          gameStore.setIsDonoSala(this.isDonoSala);
          gameStore.abrirSala(); // Sala está aberta se está retomando
          
        } catch (error) {
          // Continuar sem personagem - carregar lista para escolher
          if (user?.id) {
            await this.carregarPersonagens(user.id);
          }
          this.setLoading(false);
          this.notify();
          return;
        }
      } else {
        // Sem personagem - carregar lista para escolher
        if (user?.id) {
          await this.carregarPersonagens(user.id);
        }
        
        this.setLoading(false);
        this.notify();
        return;
      }
      
      // 4. Conectar ao WebSocket automaticamente com personagem já selecionado
      try {
        await this.conectarSocket({
          userId: user?.id,
          username: user?.nome || user?.name,
          email: user?.email
        });
      } catch (error) {
        // Continuar mesmo sem conexão - usuário pode tentar conectar manualmente
      }
      
      // Carregar mensagens salvas
      await this.carregarMensagensSalvas(historiaId);
      
      // 5. Carregar personagens do usuário (para lista completa)
      if (user?.id) {
        await this.carregarPersonagens(user.id);
      }
      
      this.setLoading(false);

      this.notify();
    } catch (error) {
      this.setError('Erro ao retomar jogo: ' + error.message);
      this.setLoading(false);
      this.notify();
      throw error;
    }
  }

  /**
   * Atualiza o status do personagem
   * @param {Object} status - Novo status
   */
  atualizarStatusPersonagem(status) {
    this.statusPersonagem = status;
    this.notify();
  }

  /**
   * Adiciona um participante à lista
   * @param {Object} participante - Dados do participante
   */
  adicionarParticipante(participante) {
    // Evitar duplicatas
    const jaExiste = this.participantes.find(p => p.userId === participante.userId);
    if (!jaExiste) {
      this.participantes = [...this.participantes, participante];
      this.notify();
    }
  }

  /**
   * Remove um participante da lista
   * @param {string} userId - ID do usuário a ser removido
   */
  removerParticipante(userId) {
    this.participantes = this.participantes.filter(p => p.userId !== userId);
    this.notify();
  }

  /**
   * Atualiza a lista completa de participantes
   * @param {Array} listaCompleta - Nova lista de participantes
   */
  atualizarParticipantes(listaCompleta) {
    this.participantes = listaCompleta;
    
    // ✅ SINCRONIZAR COM GAMESTORE
    const gameStore = getGameStoreAPI();
    gameStore.setParticipantes(listaCompleta);
    
    this.notify();
  }

  // ===== MÉTODOS DE CONTROLE DE ESTADO =====

  /**
   * @deprecated Etapas agora são gerenciadas por rotas React Router
   * Mantido para compatibilidade temporária, mas não faz nada
   */
  mudarEtapa(etapa) {
    // Deprecated - rotas gerenciam navegação
  }

  /**
   * Define o estado de loading
   * @param {boolean} loading - Estado de loading
   */
  setLoading(loading) {
    this.loading = loading;
    this.notify();
  }

  /**
   * Define o estado de loading dos personagens
   * @param {boolean} loading - Estado de loading
   */
  setLoadingPersonagens(loading) {
    this.loadingPersonagens = loading;
    this.notify();
  }

  /**
   * Define um erro
   * @param {string} error - Mensagem de erro
   */
  setError(error) {
    this.error = error;
    this.notify();
  }

  /**
   * Define um erro dos personagens
   * @param {string} error - Mensagem de erro
   */
  setErrorPersonagens(error) {
    this.errorPersonagens = error;
    this.notify();
  }

  /**
   * Limpa todos os erros
   */
  clearErrors() {
    this.error = null;
    this.socketError = null;
    this.notify();
  }

  /**
   * Limpa erro dos personagens
   */
  clearErrorPersonagens() {
    this.errorPersonagens = null;
    this.notify();
  }

  /**
   * Reseta o estado do jogo
   */
  resetGameState() {
    this.historiaAtual = null;
    this.personagensDaHistoria = [];
    this.personagemSelecionado = null;
    this.participantes = [];
    this.salaAberta = false;
    this.isDonoSala = false;
    this.mensagens = [];
    this.statusPersonagem = null;
    this.loading = false;
    this.error = null;
    this.loadingPersonagens = false;
    this.errorPersonagens = null;
    this.isInitializing = false;
    this.isLoadingHistoria = false;
    
    // Resetar ViewModels específicos
    this.resetEtapaViewModels();
    
    this.notify();
  }

  /**
   * Reseta os ViewModels específicos de cada etapa
   */
  resetEtapaViewModels() {
    try {
      etapaSelecaoPersonagemViewModel.reset();
      etapaSalaEsperaViewModel.reset();
      etapaJogoRPGViewModel.reset();
      inputAreaViewModel.reset();
    } catch (error) {
      // silenced
    }
  }

  /**
   * Reseta o estado do socket
   */
  resetSocketState() {
    // Limpar subscription do socket store para evitar listeners órfãos
    if (this.socketStoreUnsubscribe) {
      this.socketStoreUnsubscribe();
      this.socketStoreUnsubscribe = null;
    }

    this.isConnected = false;
    this.socketError = null;
    this.latency = 0;
    this.isTyping = false;
    this.roomUsers = [];
    this.isConnecting = false;
    this.notify();
  }

  // ===== MÉTODOS DE VALIDAÇÃO =====

  /**
   * Verifica se o usuário está autenticado
   * @param {Object} user - Usuário atual
   * @returns {boolean} - Se está autenticado
   */
  isUserAuthenticated(user) {
    return !!user;
  }

  /**
   * Verifica se a história foi carregada
   * @returns {boolean} - Se a história foi carregada
   */
  isHistoriaLoaded() {
    return !!this.historiaAtual;
  }

  /**
   * Verifica se há erros
   * @returns {boolean} - Se há erros
   */
  hasErrors() {
    return !!(this.error || this.socketError || this.errorPersonagens);
  }

  /**
   * Verifica se está carregando
   * @returns {boolean} - Se está carregando
   */
  isLoading() {
    return this.loading || this.loadingPersonagens;
  }

  // ===== MÉTODOS DE ACESSO AOS VIEWMODELS ESPECÍFICOS =====

  /**
   * Obtém o ViewModel de seleção de personagem
   * @returns {EtapaSelecaoPersonagemViewModel} ViewModel da etapa
   */
  getEtapaSelecaoPersonagemViewModel() {
    return etapaSelecaoPersonagemViewModel;
  }

  /**
   * Obtém o ViewModel de sala de espera
   * @returns {EtapaSalaEsperaViewModel} ViewModel da etapa
   */
  getEtapaSalaEsperaViewModel() {
    return etapaSalaEsperaViewModel;
  }

  /**
   * Obtém o ViewModel de jogo RPG
   * @returns {EtapaJogoRPGViewModel} ViewModel da etapa
   */
  getEtapaJogoRPGViewModel() {
    return etapaJogoRPGViewModel;
  }

  /**
   * Obtém o ViewModel de input
   * @returns {InputAreaViewModel} ViewModel do input
   */
  getInputAreaViewModel() {
    return inputAreaViewModel;
  }

  /**
   * Obtém todos os ViewModels específicos
   * @returns {Object} Objeto com todos os ViewModels
   */
  getAllEtapaViewModels() {
    return {
      selecaoPersonagem: etapaSelecaoPersonagemViewModel,
      salaEspera: etapaSalaEsperaViewModel,
      jogoRPG: etapaJogoRPGViewModel,
      inputArea: inputAreaViewModel
    };
  }
}

// Instância singleton
export const jogoViewModel = new JogoViewModel();
