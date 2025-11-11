/**
 * ViewModel para gerenciar a lógica da etapa de sala de espera
 * Responsável por:
 * - Gerenciar estado de inicialização do jogo
 * - Lógica de compartilhamento de sala
 * - Validações de participantes
 * - Status de conexão WebSocket
 * - Formatação de dados para exibição
 */

//URL PARA SER USADA EM PRODUÇÃO https://lunaria-backend-3754d2d676ff.herokuapp.com/
const API_URL = 'https://lunaria-backend-3754d2d676ff.herokuapp.com/';
// const API_URL = 'http://localhost:3001';

import { getTemaStoreAPI } from '../../store/index.js';
export class EtapaSalaEsperaViewModel {
  constructor() {
    // Estados específicos da etapa
    this.linkCopiado = false;
    this.copiarTimeout = null;
    
    // Callback para controle de loading centralizado
    this.onSetLoading = null;

    // Store API para temas
    this.temaStore = getTemaStoreAPI();
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
    linkCopiado: this.linkCopiado
  });

  /**
   * Inicializa o ViewModel
   * @param {Function} onRecarregarPersonagens - Callback para recarregar personagens
   * @param {Function} onSetLoading - Callback para controle de loading centralizado
   */
  initialize(onRecarregarPersonagens = null, onSetLoading = null) {
    this.reset();
    this.onRecarregarPersonagens = onRecarregarPersonagens;
    this.onSetLoading = onSetLoading;
  }

  /**
   * Inicializa a sala de espera e recarrega personagens
   * @param {string} userId - ID do usuário
   */
  async inicializarSala(userId) {
    if (this.onRecarregarPersonagens && userId) {
      try {
        await this.recarregarPersonagens(userId);
      } catch (error) {
        console.error('❌ EtapaSalaEsperaViewModel: Erro ao inicializar sala:', error);
        throw error;
      }
    }
  }

  /**
   * Recarrega os personagens da história atual
   * @param {string} userId - ID do usuário
   */
  async recarregarPersonagens(userId) {
    if (this.onRecarregarPersonagens && userId) {
      try {
        await this.onRecarregarPersonagens(userId);
      } catch (error) {
        console.error('❌ EtapaSalaEsperaViewModel: Erro ao recarregar personagens:', error);
        throw error;
      }
    }
  }

  /**
   * Inicia o processo de inicialização do jogo
   * @param {Function} onIniciarJogo - Callback para iniciar jogo
   * @param {boolean} isDonoSala - Se é dono da sala
   * @returns {Promise} Promise da inicialização
   */
  async iniciarJogo(onIniciarJogo, isDonoSala) {
    if (!isDonoSala) {
      return;
    }
    
    // Usar loading centralizado se disponível
    if (this.onSetLoading) {
      this.onSetLoading(true);
    }
    
    try {
      await onIniciarJogo();
    } catch (error) {
      console.error('❌ EtapaSalaEsperaViewModel: Erro ao iniciar jogo:', error);
      throw error;
    } finally {
      if (this.onSetLoading) {
        this.onSetLoading(false);
      }
    }
  }

  /**
   * Inicia a partida via API (dispara evento WebSocket para todos jogadores)
   * @param {number} historiaId - ID da história
   * @param {string} mensagemInicial - Mensagem inicial opcional do mestre
   * @returns {Promise<Object>} Dados da partida iniciada
   */
  async iniciarPartidaViaAPI(historiaId, mensagemInicial = null) {
    try {
      console.log('🚀 EtapaSalaEsperaViewModel: Iniciando partida via API...', { historiaId });

      const token = localStorage.getItem('accessToken') || 
                    localStorage.getItem('authToken') ||
                    sessionStorage.getItem('accessToken') ||
                    sessionStorage.getItem('authToken');

      if (!token) {
        console.error('❌ EtapaSalaEsperaViewModel: Token não encontrado em localStorage nem sessionStorage');
        console.log('  - localStorage.accessToken:', !!localStorage.getItem('accessToken'));
        console.log('  - localStorage.authToken:', !!localStorage.getItem('authToken'));
        console.log('  - sessionStorage.accessToken:', !!sessionStorage.getItem('accessToken'));
        console.log('  - sessionStorage.authToken:', !!sessionStorage.getItem('authToken'));
        throw new Error('Token de autenticação não encontrado');
      }

      console.log('✅ EtapaSalaEsperaViewModel: Token encontrado para iniciar partida');

      const response = await fetch(`${API_URL}/jogo/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          historiaId: parseInt(historiaId), 
          mensagemInicial: mensagemInicial || 'A aventura começa agora!' 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao iniciar partida');
      }

      const data = await response.json();
      
      console.log('✅ EtapaSalaEsperaViewModel: Partida iniciada com sucesso', data);
      
      return data;
    } catch (error) {
      console.error('❌ EtapaSalaEsperaViewModel: Erro ao iniciar partida via API:', error);
      throw error;
    }
  }

  /**
   * Compartilha o link da sala
   * @returns {Promise<boolean>} Se conseguiu copiar o link
   */
  async compartilharSala() {
    try {
      let url = window.location.href;
      url = url.replace('/jogo/', '/convite-jogo/');
      
      await navigator.clipboard.writeText(url);
      this.setLinkCopiado(true);
      
      // Limpar timeout anterior se existir
      if (this.copiarTimeout) {
        clearTimeout(this.copiarTimeout);
      }
      
      // Resetar após 2 segundos
      this.copiarTimeout = setTimeout(() => {
        this.setLinkCopiado(false);
      }, 2000);
      
      return true;
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      
      // Fallback para navegadores que não suportam clipboard API
      try {
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        this.setLinkCopiado(true);
        
        // Limpar timeout anterior se existir
        if (this.copiarTimeout) {
          clearTimeout(this.copiarTimeout);
        }
        
        // Resetar após 2 segundos
        this.copiarTimeout = setTimeout(() => {
          this.setLinkCopiado(false);
        }, 2000);
        
        return true;
      } catch (fallbackError) {
        console.error('Erro no fallback de cópia:', fallbackError);
        return false;
      }
    }
  }

  /**
   * Obtém o status de conexão para exibição
   * @param {boolean} socketConnected - Se está conectado
   * @returns {Object} Status formatado
   */
  getConnectionStatus(socketConnected) {
    if (!socketConnected) {
      return {
        text: 'Desconectado',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        icon: '🔴'
      };
    }
    return {
      text: 'Conectado à Sala',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      icon: '🟢'
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
        titulo: 'História sem nome',
        descricao: 'Uma aventura épica está prestes a começar...',
        tema: null
      };
    }
    const titulo = historia.nome || historia.titulo || 'História sem nome';
    const descricao = historia.prologo || 'Uma aventura épica está prestes a começar...';
    const temas = this.temaStore.getNomesDeTemas(historia.temas);

    return {
      titulo,
      descricao,
      temas
    };
  }

  /**
   * Formata informações do personagem para exibição
   * @param {Object} personagem - Personagem a ser formatado
   * @returns {Object} Informações formatadas
   */
  formatarInformacoesPersonagem(personagem) {
    if (!personagem) {
      return {
        nome: 'Carregando personagem...',
        classe: 'Aguarde um momento',
        raca: '',
        nivel: '',
        hp: '???',
        mp: '???'
      };
    }

    return {
      nome: personagem.nome || 'Personagem sem nome',
      classe: personagem.classe_nome || personagem.classe || 'Desconhecida',
      raca: personagem.raca_nome || personagem.raca || 'Desconhecida',
      nivel: personagem.nivel || '1',
      hp: personagem.hp_atual || personagem.hp || '???',
      mp: personagem.mp_atual || personagem.mp || '???'
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

    console.log('🔧 EtapaSalaEsperaViewModel: Formatando', participantes.length, 'participantes');

    return participantes.map(participante => {
      const personagemExibicao = participante.personagem || participante.personagemNome || 'Selecionando personagem...';
      
      console.log('  - Participante:', participante.username, {
        personagem: participante.personagem,
        personagemNome: participante.personagemNome,
        exibindo: personagemExibicao,
        isOwner: participante.isOwner
      });
      
      return {
        ...participante,
        username: participante.username || 'Jogador Anônimo',
        personagem: personagemExibicao,
        isCurrentUser: participante.userId === user?.id,
        isOwner: participante.isOwner || false
      };
    });
  }

  /**
   * Valida se pode iniciar o jogo
   * @param {boolean} isDonoSala - Se é dono da sala
   * @param {boolean} salaAberta - Se a sala está aberta
   * @param {boolean} iniciandoJogo - Se está iniciando
   * @returns {Object} Resultado da validação
   */
  validarIniciarJogo(isDonoSala, salaAberta, iniciandoJogo) {
    if (!isDonoSala) {
      return {
        podeIniciar: false,
        motivo: 'Apenas o Mestre pode iniciar o jogo'
      };
    }

    if (iniciandoJogo) {
      return {
        podeIniciar: false,
        motivo: 'Jogo já está sendo iniciado...'
      };
    }

    if (!salaAberta) {
      return {
        podeIniciar: false,
        motivo: 'Sala não está aberta'
      };
    }

    return {
      podeIniciar: true,
      motivo: null
    };
  }

  /**
   * Valida se pode trocar personagem
   * @param {Object} personagemSelecionado - Personagem selecionado
   * @returns {Object} Resultado da validação
   */
  validarTrocarPersonagem(personagemSelecionado) {
    if (!personagemSelecionado) {
      return {
        podeTrocar: true,
        acao: 'Selecionar personagem'
      };
    }

    return {
      podeTrocar: true,
      acao: 'Trocar personagem'
    };
  }

  // ===== MÉTODOS DE CONTROLE DE ESTADO =====


  /**
   * Define o estado de link copiado
   * @param {boolean} copiado - Estado de cópia
   */
  setLinkCopiado(copiado) {
    this.linkCopiado = copiado;
    this.notify();
  }

  /**
   * Reseta o estado do ViewModel
   */
  reset() {
    this.linkCopiado = false;
    
    // Limpar timeout se existir
    if (this.copiarTimeout) {
      clearTimeout(this.copiarTimeout);
      this.copiarTimeout = null;
    }
    
    this.notify();
  }

  /**
   * Cleanup ao desmontar
   */
  destroy() {
    if (this.copiarTimeout) {
      clearTimeout(this.copiarTimeout);
      this.copiarTimeout = null;
    }
    this.reset();
  }
}

// Instância singleton
export const etapaSalaEsperaViewModel = new EtapaSalaEsperaViewModel();
