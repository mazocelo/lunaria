import { getSocketStoreAPI } from '../../store/index.js';

/**
 * ViewModel para gerenciar a lógica da área de input de mensagens
 * Responsável por:
 * - Gerenciar tipos de mensagem
 * - Validação de envio
 * - Integração com WebSocket
 * - Lógica de teclado
 */
export class InputAreaViewModel {
  constructor() {
    // Estados específicos
    this.messageType = 'chat';
    this.lastSentTime = null;
    this.sendCooldown = 1000; // 1 segundo entre envios
    
    // Callback para controle de loading centralizado
    this.onSetLoading = null;
    
    // Observers
    this.observers = [];
  }

  /**
   * Obtém a instância do socket store
   * @returns {Object} Socket store API
   */
  getSocketStore() {
    return getSocketStoreAPI();
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
    messageType: this.messageType
  });

  /**
   * Inicializa o ViewModel
   * @param {Function} onSetLoading - Callback para controle de loading centralizado
   */
  initialize(onSetLoading = null) {
    this.onSetLoading = onSetLoading;
    this.reset();
  }

  /**
   * Define o tipo de mensagem
   * @param {string} type - Tipo da mensagem ('chat', 'ic', 'ooc', 'action', 'gm')
   */
  setMessageType(type) {
    const validTypes = ['chat', 'ic', 'ooc', 'action', 'gm'];
    if (validTypes.includes(type)) {
      console.log('🔄 [ViewModel] Alterando tipo de mensagem:', this.messageType, '→', type);
      this.messageType = type;
      this.notify();
      console.log('✅ [ViewModel] Tipo atualizado e observers notificados');
    } else {
      console.warn('⚠️ [ViewModel] Tipo de mensagem inválido:', type);
    }
  }

  /**
   * Obtém o placeholder baseado no tipo de mensagem
   * @returns {string} Placeholder formatado
   */
  getPlaceholder() {
    const placeholders = {
      chat: 'Digite sua mensagem...',
      ic: 'Digite como seu personagem (IC)...',
      action: 'Digite sua ação/emote...',
      ooc: 'Digite sua mensagem (fora do personagem)...',
      gm: 'Digite como Mestre...'
    };
    
    return placeholders[this.messageType] || placeholders.chat;
  }

  /**
   * Valida se pode enviar mensagem
   * @param {string} mensagem - Mensagem a validar
   * @returns {Object} Resultado da validação
   */
  validarEnvio(mensagem) {
    const socketStore = this.getSocketStore();
    
    // Verificar se está enviando (usando loading centralizado)
    // Removido: verificação será feita pelo loading centralizado

    // Verificar cooldown
    if (this.lastSentTime && Date.now() - this.lastSentTime < this.sendCooldown) {
      return {
        podeEnviar: false,
        motivo: 'Aguarde um momento antes de enviar novamente...'
      };
    }

    // Verificar conexão
    if (!socketStore.isConnected) {
      return {
        podeEnviar: false,
        motivo: 'Desconectado'
      };
    }

    // Verificar autenticação
    if (!socketStore.isAuthenticated) {
      return {
        podeEnviar: false,
        motivo: 'Não autenticado'
      };
    }

    // Verificar mensagem
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
   * Envia mensagem via WebSocket
   * @param {string} mensagem - Mensagem a enviar
   * @param {Function} onEnviarCallback - Callback adicional
   * @returns {Promise<boolean>} Se conseguiu enviar
   */
  async enviarMensagem(mensagem, onEnviarCallback) {
    const validacao = this.validarEnvio(mensagem);
    
    if (!validacao.podeEnviar) {
      console.warn('⚠️ InputAreaViewModel: Não é possível enviar mensagem:', validacao.motivo);
      return false;
    }

    try {
      // Usar loading centralizado se disponível
      if (this.onSetLoading) {
        this.onSetLoading(true);
      }
      
      const payload = {
        message: mensagem.trim(),
        type: this.messageType
      };
      
      console.log('📡 [ViewModel] Enviando via WebSocket:');
      console.log('   ├─ Tipo:', payload.type);
      console.log('   ├─ Mensagem:', payload.message);
      console.log('   └─ Payload completo:', payload);
      
      // Enviar via WebSocket
      const socketStore = this.getSocketStore();
      if (socketStore.sendMessage) {
        await socketStore.sendMessage(payload);
        console.log('✅ [ViewModel] Mensagem enviada ao WebSocket com sucesso');
      } else {
        console.warn('⚠️ [ViewModel] sendMessage não está disponível no socketStore');
      }
      
      // Chamar callback adicional se existir
      if (onEnviarCallback) {
        onEnviarCallback();
      }
      
      this.lastSentTime = Date.now();
      return true;
    } catch (error) {
      console.error('❌ InputAreaViewModel: Erro ao enviar mensagem:', error);
      return false;
    } finally {
      if (this.onSetLoading) {
        this.onSetLoading(false);
      }
    }
  }

  /**
   * Processa tecla pressionada
   * @param {KeyboardEvent} event - Evento de teclado
   * @param {Function} onEnviar - Callback para enviar
   * @returns {boolean} Se deve prevenir comportamento padrão
   */
  handleKeyPress(event, onEnviar) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onEnviar();
      return true;
    }
    
    // Ctrl+Enter para enviar independente do tipo
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      onEnviar();
      return true;
    }
    
    return false;
  }

  /**
   * Obtém o status de conexão para exibição
   * @returns {Object} Status formatado
   */
  getConnectionStatus() {
    const socketStore = this.getSocketStore();
    
    if (!socketStore.isAuthenticated) {
      return {
        status: 'error',
        text: 'Não autenticado',
        color: 'text-red-400'
      };
    }

    if (!socketStore.isConnected) {
      return {
        status: 'error',
        text: 'Desconectado',
        color: 'text-red-400'
      };
    }

    return {
      status: 'success',
      text: 'Conectado',
      color: 'text-green-400'
    };
  }

  /**
   * Obtém as opções de tipo de mensagem
   * @returns {Array} Lista de opções
   */
  getMessageTypeOptions() {
    return [
      { value: 'chat', label: '💬 Chat', description: 'Mensagem normal' },
      { value: 'ic', label: '🗣️ IC', description: 'In Character' },
      { value: 'ooc', label: '📢 OOC', description: 'Out of Character' },
      { value: 'action', label: '⚡ Ação', description: 'Ação/emote do personagem' },
      { value: 'gm', label: '👑 Mestre', description: 'Mensagem do Mestre' }
    ];
  }

  /**
   * Obtém informações do tipo de mensagem atual
   * @returns {Object} Informações do tipo
   */
  getCurrentMessageTypeInfo() {
    const options = this.getMessageTypeOptions();
    return options.find(option => option.value === this.messageType) || options[0];
  }

  // ===== MÉTODOS DE CONTROLE DE ESTADO =====

  /**
   * Define o estado de envio
   * @param {boolean} sending - Estado de envio
   */
  setSending(sending) {
    this.isSending = sending;
    this.notify();
  }

  /**
   * Reseta o estado do ViewModel
   */
  reset() {
    this.messageType = 'chat';
    this.isSending = false;
    this.lastSentTime = null;
    this.notify();
  }

  /**
   * Cleanup ao desmontar
   */
  destroy() {
    this.reset();
  }
}

// Instância singleton
export const inputAreaViewModel = new InputAreaViewModel();
