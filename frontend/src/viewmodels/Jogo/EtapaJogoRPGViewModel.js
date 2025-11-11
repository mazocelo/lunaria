/**
 * ViewModel para gerenciar a lógica da etapa de jogo RPG ativo
 * Responsável por:
 * - Gerenciar estado da interface (painel de ações, mensagem atual)
 * - Lógica de envio de mensagens
 * - Sistema de rolagem de dados
 * - Execução de ações RPG
 * - Formatação de mensagens
 */
export class EtapaJogoRPGViewModel {
  constructor() {
    // Estados da interface
    this.showActions = false;
    this.mensagemAtual = '';
    this.messageType = 'chat';
    
    // Estados de validação
    this.isTyping = false;
    this.lastTypingTime = null;
    this.typingTimeout = null;
    
    // Observers
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
    showActions: this.showActions,
    mensagemAtual: this.mensagemAtual,
    messageType: this.messageType,
    isTyping: this.isTyping
  });

  /**
   * Inicializa o ViewModel
   */
  initialize() {
    this.reset();
  }

  /**
   * Alterna a visibilidade do painel de ações
   */
  toggleActions() {
    this.showActions = !this.showActions;
    this.notify();
  }

  /**
   * Define a visibilidade do painel de ações
   * @param {boolean} show - Se deve mostrar
   */
  setShowActions(show) {
    this.showActions = show;
    this.notify();
  }

  /**
   * Atualiza a mensagem atual
   * @param {string} mensagem - Nova mensagem
   */
  updateMensagemAtual(mensagem) {
    this.mensagemAtual = mensagem;
    this.handleTyping();
    this.notify();
  }

  /**
   * Define o tipo de mensagem
   * @param {string} type - Tipo da mensagem ('chat', 'action', 'ooc')
   */
  setMessageType(type) {
    this.messageType = type;
    this.notify();
  }

  /**
   * Limpa a mensagem atual
   */
  clearMensagemAtual() {
    this.mensagemAtual = '';
    this.stopTyping();
    this.notify();
  }

  /**
   * Cria uma mensagem de chat
   * @param {string} conteudo - Conteúdo da mensagem
   * @param {string} autor - Autor da mensagem
   * @param {string} tipo - Tipo da mensagem
   * @returns {Object} Mensagem formatada
   */
  criarMensagem(conteudo, autor = 'Você', tipo = 'chat') {
    return {
      id: Date.now() + Math.random(),
      autor,
      conteudo,
      tipo,
      timestamp: new Date()
    };
  }

  /**
   * Cria uma mensagem de dados (rolagem)
   * @param {number} resultado - Resultado da rolagem
   * @param {string} tipoDado - Tipo do dado (ex: 'd20')
   * @param {string} descricao - Descrição da rolagem
   * @returns {Object} Mensagem de dados formatada
   */
  criarMensagemDados(resultado, tipoDado = 'd20', descricao = '') {
    const conteudo = descricao 
      ? `🎲 ${descricao}: ${resultado} (${tipoDado})`
      : `🎲 Você rolou: ${resultado} (${tipoDado})`;
    
    return this.criarMensagem(conteudo, 'Sistema', 'dado');  // Corrigido: 'dado' singular
  }

  /**
   * Cria uma mensagem de ação RPG
   * @param {string} acao - Ação executada
   * @param {string} autor - Autor da ação
   * @returns {Object} Mensagem de ação formatada
   */
  criarMensagemAcao(acao, autor = 'Você') {
    return this.criarMensagem(`⚔️ ${acao}`, autor, 'acao');
  }

  /**
   * Rola dados
   * @param {string} tipoDado - Tipo do dado (ex: 'd20', 'd6')
   * @param {string} descricao - Descrição da rolagem
   * @returns {Object} Resultado da rolagem
   */
  rolarDados(tipoDado = 'd20', descricao = '') {
    const faces = this.extrairFacesDoDado(tipoDado);
    const resultado = Math.floor(Math.random() * faces) + 1;
    
    return {
      resultado,
      tipoDado,
      descricao,
      mensagem: this.criarMensagemDados(resultado, tipoDado, descricao)
    };
  }

  /**
   * Extrai o número de faces de um dado
   * @param {string} tipoDado - Tipo do dado (ex: 'd20', '2d6')
   * @returns {number} Número de faces
   */
  extrairFacesDoDado(tipoDado) {
    // Garantir que tipoDado seja string
    if (!tipoDado || typeof tipoDado !== 'string') {
      console.warn('⚠️ EtapaJogoRPGViewModel: tipoDado inválido, usando d20 como padrão', tipoDado);
      return 20;
    }
    
    const match = tipoDado.match(/d(\d+)/);
    return match ? parseInt(match[1]) : 20;
  }

  /**
   * Valida se pode enviar mensagem
   * @param {string} mensagem - Mensagem a validar
   * @param {boolean} isConnected - Se está conectado
   * @param {boolean} isAuthenticated - Se está autenticado
   * @returns {Object} Resultado da validação
   */
  validarEnvioMensagem(mensagem, isConnected, isAuthenticated) {
    if (!isAuthenticated) {
      return {
        podeEnviar: false,
        motivo: 'Não autenticado'
      };
    }

    if (!isConnected) {
      return {
        podeEnviar: false,
        motivo: 'Desconectado'
      };
    }

    if (!mensagem || !mensagem.trim()) {
      return {
        podeEnviar: false,
        motivo: 'Mensagem vazia'
      };
    }

    if (mensagem.length > 500) {
      return {
        podeEnviar: false,
        motivo: 'Mensagem muito longa (máx. 500 caracteres)'
      };
    }

    return {
      podeEnviar: true,
      motivo: null
    };
  }

  /**
   * Valida se pode rolar dados
   * @param {boolean} isConnected - Se está conectado
   * @param {boolean} isAuthenticated - Se está autenticado
   * @returns {Object} Resultado da validação
   */
  validarRolagemDados(isConnected, isAuthenticated) {
    if (!isAuthenticated) {
      return {
        podeRolar: false,
        motivo: 'Não autenticado'
      };
    }

    if (!isConnected) {
      return {
        podeRolar: false,
        motivo: 'Desconectado'
      };
    }

    return {
      podeRolar: true,
      motivo: null
    };
  }

  /**
   * Processa tecla pressionada
   * @param {KeyboardEvent} event - Evento de teclado
   * @param {Function} onEnviar - Callback para enviar mensagem
   * @returns {boolean} Se deve prevenir comportamento padrão
   */
  handleKeyPress(event, onEnviar) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onEnviar();
      return true;
    }
    return false;
  }

  /**
   * Inicia o estado de digitação
   */
  handleTyping() {
    this.isTyping = true;
    this.lastTypingTime = Date.now();
    
    // Limpar timeout anterior
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    // Parar de digitar após 1 segundo de inatividade
    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 1000);
    
    this.notify();
  }

  /**
   * Para o estado de digitação
   */
  stopTyping() {
    this.isTyping = false;
    this.lastTypingTime = null;
    
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
    
    this.notify();
  }

  /**
   * Formata informações do personagem para exibição
   * @param {Object} personagem - Personagem a ser formatado
   * @returns {Object} Informações formatadas
   */
  formatarInformacoesPersonagem(personagem) {
    if (!personagem) {
      return {
        nome: 'Personagem não encontrado',
        classe: 'Desconhecida',
        raca: 'Desconhecida',
        nivel: '1',
        hp: '???',
        mp: '???',
        xp: '0'
      };
    }

    return {
      nome: personagem.nome || 'Personagem sem nome',
      classe: personagem.classe_nome || personagem.classe || 'Desconhecida',
      raca: personagem.raca_nome || personagem.raca || 'Desconhecida',
      nivel: personagem.nivel || '1',
      hp: personagem.hp_atual || personagem.hp || '???',
      mp: personagem.mp_atual || personagem.mp || '???',
      xp: personagem.xp || '0'
    };
  }

  /**
   * Formata lista de participantes para exibição
   * @param {Array} participantes - Lista de participantes
   * @param {Object} user - Usuário atual
   * @returns {Array} Lista formatada
   */
  formatarParticipantes(participantes, user) {
    if (!Array.isArray(participantes)) {
      return [];
    }

    return participantes
      .filter(p => p.userId !== user?.id)
      .map(participante => ({
        ...participante,
        username: participante.username || 'Jogador',
        personagem: participante.personagem || 'Personagem',
        isOwner: participante.isOwner || false,
        status: participante.status || 'online'
      }));
  }

  // ===== MÉTODOS DE CONTROLE DE ESTADO =====

  /**
   * Reseta o estado do ViewModel
   */
  reset() {
    this.showActions = false;
    this.mensagemAtual = '';
    this.messageType = 'chat';
    this.isTyping = false;
    this.lastTypingTime = null;
    
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
    
    this.notify();
  }

  /**
   * Cleanup ao desmontar
   */
  destroy() {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
    this.reset();
  }
}

// Instância singleton
export const etapaJogoRPGViewModel = new EtapaJogoRPGViewModel();
