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
    this.etapaAtual = 'selecao-personagem';
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
    etapaAtual: this.etapaAtual,
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
    try {
      this.setLoading(true);
      this.clearErrors();
      
      // Carregar história
      await this.carregarHistoria(historiaId);
      
      // Inicializar ViewModels específicos
      await this.initializeEtapaViewModels();
      
      // Definir etapa inicial
      this.mudarEtapa('selecao-personagem');
      
      this.setLoading(false);
      this.notify();
    } catch (error) {
      console.error('❌ JogoViewModel: Erro ao inicializar jogo:', error);
      this.setError('Erro ao inicializar jogo: ' + error.message);
      this.setLoading(false);
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
      console.error('❌ JogoViewModel: Erro ao inicializar ViewModels específicos:', error);
      throw error;
    }
  }

  /**
   * Carrega uma história pelo ID
   * @param {string} historiaId - ID da história
   */
  async carregarHistoria(historiaId) {
    try {
      this.setLoading(true);
      this.clearErrors();
      
      const historia = await historiaService.getById(historiaId);
      this.historiaAtual = historia;
      
      // LOG COMPLETO para verificar campos
      console.log('📖 JogoViewModel: História carregada COMPLETA:');
      console.log('  - Object.keys:', Object.keys(historia));
      console.log('  - id:', historia.id);
      console.log('  - nome:', historia.nome);
      console.log('  - id_usuario:', historia.id_usuario, '| tipo:', typeof historia.id_usuario);
      console.log('  - Historia completa:', historia);
      
      this.setLoading(false);
      this.notify();
    } catch (error) {
      console.error('❌ JogoViewModel: Erro ao carregar história:', error);
      this.setError('Erro ao carregar história: ' + error.message);
      this.setLoading(false);
      this.notify();
    }
  }

  /**
   * Carrega personagens do usuário para a história atual
   * @param {string} userId - ID do usuário
   */
  async carregarPersonagens(userId) {
    // if (!this.historiaAtual || !userId || this.personagensDaHistoria.length > 0 || this.loadingPersonagens) {
    //   return;
    // }

    try {
      this.setLoadingPersonagens(true);
      this.clearErrorPersonagens();
      
      const response = await personagemService.getByUsuarioEHistoria(userId, this.historiaAtual.id);
      console.log('🔄 JogoViewModel: Personagens carregados:', response.personagens);
      // Atualizar estado local
      const personagens = response.personagens || [];
      this.personagensDaHistoria = personagens;
      // Sincronizar com GameStore
      const gameStore = getGameStoreAPI();
      gameStore.setPersonagensDaHistoria(personagens);
      this.setLoadingPersonagens(false);
      this.notify();
    } catch (error) {
      console.error('❌ JogoViewModel: Erro ao carregar personagens:', error);
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
      
      console.log('🔄 JogoViewModel: Recarregando personagens...', { userId, historiaId: this.historiaAtual.id });
      
      const response = await personagemService.getByUsuarioEHistoria(userId, this.historiaAtual.id);
      
      console.log('✅ JogoViewModel: Personagens recarregados:', response.personagens);
      
      // Atualizar estado local (força atualização)
      const personagens = response.personagens || [];
      this.personagensDaHistoria = personagens;
      // Sincronizar com GameStore
      const gameStore = getGameStoreAPI();
      gameStore.setPersonagensDaHistoria(personagens);
      this.setLoadingPersonagens(false);
      this.notify();
    } catch (error) {
      console.error('❌ JogoViewModel: Erro ao recarregar personagens:', error);
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
    
    console.log('👑 JogoViewModel: Verificando dono da sala (USUÁRIO, não personagem)');
    console.log('  - historiaUsuarioId:', this.historiaAtual?.id_usuario, '| tipo:', typeof this.historiaAtual?.id_usuario);
    console.log('  - userId:', user?.id, '| tipo:', typeof user?.id);
    console.log('  - isDonoSala:', this.isDonoSala);
    
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
    
    console.log('👤 JogoViewModel: Adicionando participante inicial (você mesmo):', novoParticipante);
    
    this.participantes = [novoParticipante];
    
    // Recarregar personagens ao abrir a sala de espera
    if (user?.id) {
      await this.recarregarPersonagens(user.id);
    }
    
    this.mudarEtapa('sala-espera');
    
    // Inicializar sala de espera (recarregar personagens novamente se necessário)
    if (user?.id) {
      await etapaSalaEsperaViewModel.inicializarSala(user.id);
    }
    
    this.notify();
  }

  /**
   * Inicia o jogo ativo
   */
  iniciarJogo() {
    this.salaAberta = true;
    this.mudarEtapa('jogo-ativo');
    this.notify();
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
   * Volta para a etapa anterior
   */
  voltarEtapa() {
    switch (this.etapaAtual) {
      case 'selecao-personagem':
        // Volta para histórias (será tratado na View)
        return 'historias';
      case 'sala-espera':
        this.mudarEtapa('selecao-personagem');
        break;
      case 'jogo-ativo':
        this.mudarEtapa('sala-espera');
        break;
      default:
        return 'historias';
    }
    this.notify();
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

      console.log('✅ JogoViewModel: Usuário autenticado (cookies HttpOnly gerenciados automaticamente)');
      return true;
    } catch (error) {
      console.error('❌ JogoViewModel: Erro ao validar autenticação:', error);
      throw error;
    }
  }

  /**
   * Conecta ao WebSocket (para anfitrião da sala)
   * @param {Object} connectionData - Dados de conexão
   */
  async conectarSocket(connectionData) {
    try {
      console.log('🔗 JogoViewModel: Conectando anfitrião ao WebSocket...');
      console.log('  - userId:', connectionData.userId, '| tipo:', typeof connectionData.userId);
      console.log('  - username:', connectionData.username);
      
      this.isConnecting = true;
      this.clearErrors();
      this.notify();

      // Validar autenticação
      await this.validarAutenticacao();

      console.log('🔌 JogoViewModel: Conectando ao WebSocket...');
      
      // Obter store dinamicamente
      const socketStore = getSocketStoreAPI();
      
      // Conectar ao WebSocket (socketToken já está no store Zustand)
      await socketStore.connect();

      console.log('✅ JogoViewModel: Conectado! Socket ID:', socketStore.getState().socket?.id);

      // Autenticar
      console.log('🔐 JogoViewModel: Autenticando...');
      
      // Obter socketToken do Zustand store
      const socketToken = socketStore.getState().socketToken;
      
      await socketStore.authenticate({
        token: socketToken,
        userId: String(connectionData.userId),
        username: connectionData.username,
        email: connectionData.email
      });

      console.log('✅ JogoViewModel: Autenticado! User:', socketStore.getState().currentUser);

      // Aguardar um pouco para garantir que autenticação foi processada no backend
      await new Promise(resolve => setTimeout(resolve, 500));

      // Se tiver história, entrar na sala
      if (this.historiaAtual?.id && this.personagemSelecionado?.id) {
        console.log('🚪 JogoViewModel: Entrando na sala...', { 
          historiaId: this.historiaAtual.id,
          personagemId: this.personagemSelecionado.id
        });

        const roomId = `historia_${this.historiaAtual.id}`;
        
        // Dados para join_room (backend espera: roomId, userId, username, historiaId)
        const joinData = {
          roomId: roomId,
          userId: String(connectionData.userId),
          username: connectionData.username,
          historiaId: String(this.historiaAtual.id),
          personagemId: String(this.personagemSelecionado.id),
          personagemNome: this.personagemSelecionado.nome
        };
        
        console.log('📤 JogoViewModel: Enviando dados para join_room:', joinData);
        console.log('  - personagemSelecionado:', this.personagemSelecionado);
        
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
        
        console.log('✅ JogoViewModel: Entrou na sala com sucesso!');
        
        // CARREGAR PARTICIPANTES IMEDIATAMENTE da sessão
        const roomState = socketStore.getState();
        console.log('📊 JogoViewModel: Estado do socket após joinRoom:', {
          inRoom: roomState.inRoom,
          roomId: roomState.roomId,
          hasSession: !!roomState.session,
          sessionKeys: roomState.session ? Object.keys(roomState.session) : []
        });
        
        if (roomState.session?.jogadoresConectados) {
          console.log('📋 JogoViewModel: Carregando participantes da sessão:', roomState.session.jogadoresConectados);
          console.log('📋 JogoViewModel: Participantes locais existentes:', this.participantes);
          
          const participantesFormatados = roomState.session.jogadoresConectados.map(j => {
            // Verificar se já existe este participante localmente
            const participanteExistente = this.participantes.find(p => String(p.userId) === String(j.userId));
            
            const isOwner = String(j.userId) === String(this.historiaAtual?.id_usuario);
            
            console.log('  - Jogador:', j.username, '| userId:', j.userId);
            console.log('    - Da sessão:', { personagemNome: j.personagemNome, personagemId: j.personagemId });
            console.log('    - Local existente:', participanteExistente ? { personagem: participanteExistente.personagem, personagemNome: participanteExistente.personagemNome } : 'não existe');
            console.log('    - isOwner:', isOwner);
            
            // Se existe localmente, MESCLAR dados (preservar dados locais completos)
            if (participanteExistente) {
              console.log('    → Mesclando com dados locais (preservando personagemNome local)');
              return {
                ...j,                      // Dados da sessão
                ...participanteExistente,  // Sobrescrever com dados locais (preserva personagemNome)
                isOwner: isOwner           // Sempre atualizar isOwner com valor correto
              };
            }
            
            // Se não existe, criar novo a partir da sessão
            console.log('    → Criando novo participante da sessão');
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
          
          console.log('✅ JogoViewModel: Atualizando participantes com', participantesFormatados.length, 'jogadores (mesclados)');
          this.atualizarParticipantes(participantesFormatados);
        } else {
          console.log('⚠️ JogoViewModel: Sessão não contém jogadoresConectados ou está vazia');
        }
        
        // ✅ VERIFICAR SE SESSÃO FOI INICIADA - Redirecionar para jogo ativo
        if (roomState.session?.status === 'iniciada') {
          console.log('🎮 JogoViewModel: Sessão já foi iniciada! Redirecionando para jogo ativo...');
          
          // Carregar mensagens
          await this.carregarMensagensSalvas(this.historiaAtual.id);
          
          // Ir para jogo ativo
          this.mudarEtapa('jogo-ativo');
          
          this.isConnected = true;
          this.isConnecting = false;
          this.socketError = null;
          this.notify();
          
          console.log('✅ JogoViewModel: Redirecionado para jogo ativo com sucesso!');
          return;
        }
      }

      // Atualizar estado local
      this.isConnected = true;
      this.isConnecting = false;
      this.socketError = null;
      
      console.log('✅ JogoViewModel: Anfitrião conectado com sucesso!');
      
      this.notify();

    } catch (error) {
      console.error('❌ JogoViewModel: Erro ao conectar WebSocket:', error);
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
      console.log('🔗 JogoViewModel: Conectando convidado...', { historiaId, personagemId, userId: user?.id });
      
      this.isConnecting = true;
      this.clearErrors();
      this.notify();

      // 1. Buscar dados da sessão/sala existente (usando historiaService com token)
      const statusData = await historiaService.getStatusJogo(historiaId);
      const { sessao } = statusData || {};
      
      if (!sessao) {
        throw new Error('Sala não encontrada ou ainda não foi criada');
      }

      console.log('✅ JogoViewModel: Dados da sessão obtidos', { 
        salaId: sessao.salaId,
        status: sessao.status,
        totalJogadores: sessao.totalJogadores 
      });

      // 2. Validar autenticação
      await this.validarAutenticacao();

      // 3. Obter store
      const { getSocketStoreAPI } = await import('../../store/index.js');
      const socketStore = getSocketStoreAPI();

      // 4. Conectar ao WebSocket (socketToken já está no store Zustand)
      console.log('🔌 JogoViewModel: Conectando convidado ao WebSocket...');
      
      await socketStore.connect();

      console.log('✅ JogoViewModel: Convidado conectado! Socket ID:', socketStore.getState().socket?.id);

      // 5. Autenticar
      console.log('🔐 JogoViewModel: Autenticando convidado...');
      
      // Obter socketToken do Zustand store
      const socketToken = socketStore.getState().socketToken;
      
      await socketStore.authenticate({
        token: socketToken,
        userId: String(user.id),
        username: user.nome || user.name,
        email: user.email
      });

      console.log('✅ JogoViewModel: Convidado autenticado! User:', socketStore.getState().currentUser);

      // Aguardar processamento no backend
      await new Promise(resolve => setTimeout(resolve, 500));

      // 6. Entrar na sala
      console.log('🚪 JogoViewModel: Convidado entrando na sala...', { 
        roomId: sessao.salaId,
        historiaId,
        personagemId
      });

      const personagem = this.personagemSelecionado;
      const roomId = `historia_${historiaId}`;
      
      // Dados para join_room (backend espera: roomId, userId, username, historiaId)
      const joinData = {
        roomId: roomId,
        userId: String(user.id),
        username: user.nome || user.name,
        historiaId: String(historiaId)
      };
      
      console.log('📤 JogoViewModel: Convidado enviando dados para join_room:', joinData);
      
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

      console.log('✅ JogoViewModel: Convidado entrou na sala com sucesso!');

      // 7. Atualizar estado local
      this.isConnected = true;
      this.isConnecting = false;
      this.socketError = null;
      
      console.log('✅ JogoViewModel: Convidado conectado com sucesso!');
      
      this.notify();

    } catch (error) {
      console.error('❌ JogoViewModel: Erro ao conectar como convidado:', error);
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
    console.log(`🧹 JogoViewModel: Mensagens limpas. Total: ${this.mensagens.length}`);
    this.notify();
  }

  /**
   * Carrega mensagens salvas do Redis
   * @param {number} historiaId - ID da história
   */
  async carregarMensagensSalvas(historiaId) {
    try {
      console.log('💬 JogoViewModel: Carregando mensagens salvas da história:', historiaId);
      
      // Usar historiaService com token
      const statusData = await historiaService.getStatusJogo(historiaId);
      const { sessao } = statusData || {};
      
      if (sessao?.mensagens && Array.isArray(sessao.mensagens)) {
        console.log(`✅ JogoViewModel: ${sessao.mensagens.length} mensagens carregadas do Redis`);
        
        this.mensagens = sessao.mensagens.map(m => ({
          id: m.timestamp || Date.now(),
          userId: m.userId,
          username: m.username,
          message: m.mensagem,
          tipo: m.tipo,
          timestamp: m.timestamp
        }));
        
        this.notify();
        return sessao.mensagens.length;
      } else {
        console.log('ℹ️ JogoViewModel: Nenhuma mensagem salva encontrada');
        return 0;
      }
    } catch (error) {
      console.error('❌ JogoViewModel: Erro ao carregar mensagens salvas:', error);
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
      console.log('🔄 JogoViewModel: Retomando jogo da história:', historiaId, 'User:', user);
      
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
      
      console.log('📊 JogoViewModel: Sessão encontrada:', {
        status: sessao.status,
        totalJogadores: sessao.totalJogadores,
        totalMensagens: sessao.mensagens?.length || 0,
        jogadoresConectados: sessao.jogadoresConectados
      });
      
      console.log('🔍 JogoViewModel: Buscando jogador na sessão...', {
        userId: user?.id,
        userIdTipo: typeof user?.id,
        totalJogadores: sessao.jogadores ? Object.keys(sessao.jogadores).length : 0,
        mapaJogadores: sessao.jogadores
      });
      
      // 3. Buscar personagem do usuário no mapa de jogadores (IMUTÁVEL)
      const dadosJogador = sessao.jogadores?.[String(user?.id)];

      console.log('🔍 JogoViewModel: Resultado da busca no mapa:', {
        encontrado: !!dadosJogador,
        jogador: dadosJogador,
        temPersonagemId: !!dadosJogador?.personagemId
      });

      if (dadosJogador?.personagemId) {
        console.log('🎭 JogoViewModel: Personagem encontrado no mapa de jogadores:', {
          personagemId: dadosJogador.personagemId,
          personagemNome: dadosJogador.personagemNome
        });
        
        try {
          // Buscar dados completos do personagem
          const personagem = await personagemService.getById(dadosJogador.personagemId);
          
          // Pré-selecionar personagem
          this.personagemSelecionado = personagem;
          
          // Definir se é dono da sala
          this.isDonoSala = String(this.historiaAtual?.id_usuario) === String(user?.id);
          
          console.log('✅ JogoViewModel: Personagem pré-selecionado:', {
            nome: personagem.nome,
            id: personagem.id,
            isDonoSala: this.isDonoSala
          });
          
          // Sincronizar com GameStore (se métodos existirem)
          try {
            const gameStore = getGameStoreAPI();
            
            // Verificar se métodos existem antes de chamar
            if (typeof gameStore.setHistoriaAtual === 'function') {
              gameStore.setHistoriaAtual(this.historiaAtual);
            }
            
            if (typeof gameStore.setPersonagemSelecionado === 'function') {
              gameStore.setPersonagemSelecionado(this.personagemSelecionado);
            }
            
            console.log('✅ JogoViewModel: GameStore sincronizado');
          } catch (gsError) {
            console.log('⚠️ JogoViewModel: GameStore sync opcional não disponível');
          }
          
        } catch (error) {
          console.error('❌ JogoViewModel: Erro ao carregar personagem:', error);
          // Continuar sem personagem - vai para sala de espera para escolher
          console.log('⚠️ JogoViewModel: Redirecionando para sala de espera para escolher personagem');
          this.mudarEtapa('sala-espera');
          this.setLoading(false);
          this.notify();
          return;
        }
      } else {
        console.log('⚠️ JogoViewModel: Usuário não tem personagem selecionado na sessão');
        // Sem personagem - ir para sala de espera
        this.mudarEtapa('sala-espera');
        
        // Carregar personagens do usuário
        if (user?.id) {
          await this.carregarPersonagens(user.id);
        }
        
        this.setLoading(false);
        this.notify();
        return;
      }
      
      // 4. Conectar ao WebSocket automaticamente com personagem já selecionado
      console.log('🔌 JogoViewModel: Conectando ao WebSocket automaticamente...');
      
      try {
        await this.conectarSocket({
          userId: user?.id,
          username: user?.nome || user?.name,
          email: user?.email
        });
        
        console.log('✅ JogoViewModel: Conectado e pronto para jogar!');
      } catch (error) {
        console.error('❌ JogoViewModel: Erro ao conectar WebSocket:', error);
        // Continuar mesmo sem conexão - usuário pode tentar conectar manualmente
      }
      
      // 5. Ir direto para jogo ativo (só se personagem foi encontrado e selecionado)
      console.log('🎮 JogoViewModel: Retomando jogo ativo diretamente com personagem...');
      this.mudarEtapa('jogo-ativo');
      
      // Carregar mensagens salvas
      await this.carregarMensagensSalvas(historiaId);
      
      // 5. Carregar personagens do usuário (para lista completa)
      if (user?.id) {
        await this.carregarPersonagens(user.id);
      }
      
      this.setLoading(false);
      console.log('✅ JogoViewModel: Jogo retomado com sucesso!');
      
      this.notify();
    } catch (error) {
      console.error('❌ JogoViewModel: Erro ao retomar jogo:', error);
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
      console.log('👤 JogoViewModel: Adicionando participante:', participante);
      this.participantes = [...this.participantes, participante];
      this.notify();
    } else {
      console.log('⚠️ JogoViewModel: Participante já existe na lista:', participante.userId);
    }
  }

  /**
   * Remove um participante da lista
   * @param {string} userId - ID do usuário a ser removido
   */
  removerParticipante(userId) {
    console.log('👋 JogoViewModel: Removendo participante:', userId);
    this.participantes = this.participantes.filter(p => p.userId !== userId);
    this.notify();
  }

  /**
   * Atualiza a lista completa de participantes
   * @param {Array} listaCompleta - Nova lista de participantes
   */
  atualizarParticipantes(listaCompleta) {
    console.log('📋 JogoViewModel: Atualizando lista completa de participantes:', listaCompleta);
    this.participantes = listaCompleta;
    this.notify();
  }

  // ===== MÉTODOS DE CONTROLE DE ESTADO =====

  /**
   * Muda a etapa atual do jogo
   * @param {string} etapa - Nova etapa
   */
  mudarEtapa(etapa) {
    this.etapaAtual = etapa;
    this.notify();
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
    this.etapaAtual = 'selecao-personagem';
    this.participantes = [];
    this.salaAberta = false;
    this.isDonoSala = false;
    this.mensagens = [];
    this.statusPersonagem = null;
    this.loading = false;
    this.error = null;
    this.loadingPersonagens = false;
    this.errorPersonagens = null;
    
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
      console.error('❌ JogoViewModel: Erro ao resetar ViewModels específicos:', error);
    }
  }

  /**
   * Reseta o estado do socket
   */
  resetSocketState() {
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
