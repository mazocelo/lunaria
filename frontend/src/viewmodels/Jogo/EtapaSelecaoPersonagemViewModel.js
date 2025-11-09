import { getTemaStoreAPI } from '../../store/index.js';

/**
 * ViewModel para gerenciar a lógica da etapa de seleção de personagem
 * Responsável por:
 * - Carregar e mapear temas da história
 * - Gerenciar estado de loading dos temas
 * - Validações de personagens
 * - Lógica de exibição de informações da história
 */
export class EtapaSelecaoPersonagemViewModel {
  constructor() {
    // Estados específicos da etapa
    this.temasCarregados = false;
    this.temasError = null;
    
    // Store API para temas
    this.temaStore = getTemaStoreAPI();
    
    // Callback para controle de loading centralizado
    this.onSetLoading = null;
    
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
    temasCarregados: this.temasCarregados,
    temasError: this.temasError
  });

  /**
   * Inicializa o ViewModel e carrega temas se necessário
   * @param {Function} onSetLoading - Callback para controle de loading centralizado
   */
  async initialize(onSetLoading = null) {
    this.onSetLoading = onSetLoading;
    
    try {
      // Usar loading centralizado se disponível
      if (this.onSetLoading) {
        this.onSetLoading(true);
      }
      
      this.clearTemasError();
      
      // Verificar se temas já estão carregados
      if (!this.temaStore.temasCarregados) {
        await this.temaStore.carregarTemas();
      }
      
      this.temasCarregados = this.temaStore.temasCarregados;
      
      if (this.onSetLoading) {
        this.onSetLoading(false);
      }
      this.notify();
    } catch (error) {
      console.error('❌ EtapaSelecaoPersonagemViewModel: Erro ao carregar temas:', error);
      this.setTemasError(error.message);
      
      if (this.onSetLoading) {
        this.onSetLoading(false);
      }
      this.notify();
    }
  }

  /**
   * Obtém os nomes dos temas de uma história
   * @param {Object} historia - História com array de temas (IDs)
   * @returns {Array} Array de nomes dos temas
   */
  obterTemasNomes(historia) {
    if (!historia?.temas) return [];

    // Se são IDs, converte para nomes
    if (Array.isArray(historia.temas)) {
      return this.temaStore.getNomesDeTemas(historia.temas);
    }

    return [];
  }

  /**
   * Valida se um personagem pode ser selecionado
   * @param {Object} personagem - Personagem a ser validado
   * @returns {Object} Resultado da validação
   */
  validarPersonagem(personagem) {
    if (!personagem) {
      return {
        valido: false,
        erro: 'Personagem não encontrado'
      };
    }

    if (!personagem.nome) {
      return {
        valido: false,
        erro: 'Personagem sem nome'
      };
    }

    if (!personagem.classe_nome && !personagem.classe) {
      return {
        valido: false,
        erro: 'Personagem sem classe definida'
      };
    }

    if (!personagem.raca_nome && !personagem.raca) {
      return {
        valido: false,
        erro: 'Personagem sem raça definida'
      };
    }

    return {
      valido: true,
      erro: null
    };
  }

  /**
   * Formata informações da história para exibição
   * @param {Object} historia - História a ser formatada
   * @returns {Object} Informações formatadas
   */
  formatarInformacoesHistoria(historia) {
    if (!historia) {
      return {
        nome: 'História sem nome',
        descricao: '',
        maximoParticipantes: 0,
        temas: []
      };
    }

    return {
      nome: historia.nome || historia.titulo || 'História sem nome',
      descricao: historia.descricao || '',
      maximoParticipantes: historia.maximo_de_participantes || 0,
      temas: this.obterTemasNomes(historia)
    };
  }

  /**
   * Formata informações de um personagem para exibição
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
        hpMaximo: '???'
      };
    }

    return {
      nome: personagem.nome || 'Personagem sem nome',
      classe: personagem.classe_nome || personagem.classe || 'Desconhecida',
      raca: personagem.raca_nome || personagem.raca || 'Desconhecida',
      nivel: personagem.nivel || '1',
      hp: personagem.hp_atual || personagem.hp || '???',
      hpMaximo: personagem.hp_maximo || personagem.hp || '???'
    };
  }

  /**
   * Verifica se há personagens disponíveis
   * @param {Array} personagens - Lista de personagens
   * @returns {boolean} Se há personagens disponíveis
   */
  temPersonagensDisponiveis(personagens) {
    return Array.isArray(personagens) && personagens.length > 0;
  }

  /**
   * Verifica se um personagem está selecionado
   * @param {Object} personagem - Personagem a verificar
   * @param {Object} personagemSelecionado - Personagem selecionado
   * @returns {boolean} Se está selecionado
   */
  isPersonagemSelecionado(personagem, personagemSelecionado) {
    return personagem && personagemSelecionado && 
           personagem.id === personagemSelecionado.id;
  }

  // ===== MÉTODOS DE CONTROLE DE ESTADO =====

  /**
   * Define o estado de loading dos temas
   * @param {boolean} loading - Estado de loading
   */
  setTemasLoading(loading) {
    this.temasLoading = loading;
    this.notify();
  }

  /**
   * Define um erro dos temas
   * @param {string} error - Mensagem de erro
   */
  setTemasError(error) {
    this.temasError = error;
    this.notify();
  }

  /**
   * Limpa erro dos temas
   */
  clearTemasError() {
    this.temasError = null;
    this.notify();
  }

  /**
   * Reseta o estado do ViewModel
   */
  reset() {
    this.temasCarregados = false;
    this.temasLoading = false;
    this.temasError = null;
    this.notify();
  }
}

// Instância singleton
export const etapaSelecaoPersonagemViewModel = new EtapaSelecaoPersonagemViewModel();
