/**
 * 🎮 GAME ACTIONS - Lógicas e ações da sessão de jogo
 * 
 * Contém todas as funções que modificam o estado do jogo:
 * - Controle de etapas
 * - Gerenciamento de história
 * - Manipulação de personagens
 * - Controle de sessão e participantes
 * - Ações do jogo ativo
 * - Funções de reset e persistência
 */

export const createGameActions = (set, get) => ({
  // ===== ACTIONS - ETAPAS =====
  mudarEtapa: (novaEtapa) => {
    const { etapaAtual, personagemSelecionado, historiaAtual, salaAberta } = get();
    
    const etapasValidas = ['selecao-personagem', 'sala-espera', 'jogo-ativo'];
    
    if (!etapasValidas.includes(novaEtapa)) {
      console.warn(`🚫 GameStore: Etapa inválida: ${novaEtapa}`);
      return false;
    }

    // Validações específicas por etapa
    switch (novaEtapa) {
      case 'selecao-personagem':
        if (!historiaAtual) {
          console.warn('🚫 GameStore: História deve estar carregada antes de selecionar personagem');
          return false;
        }
        break;
        
      case 'sala-espera':
        if (!personagemSelecionado || !historiaAtual) {
          console.warn('🚫 GameStore: Personagem e história devem estar selecionados para ir para sala de espera');
          return false;
        }
        break;
        
      case 'jogo-ativo':
        if (!salaAberta || !personagemSelecionado) {
          console.warn('🚫 GameStore: Sala deve estar aberta e personagem selecionado para iniciar o jogo');
          return false;
        }
        break;
    }

    set({ etapaAtual: novaEtapa });
    return true;
  },
  
  // ===== ACTIONS - HISTÓRIA =====
  setHistoriaAtual: (historia) => {
    set({ historiaAtual: historia });
  },
  
  setLoading: (loading) => {
    set({ loading });
  },
  
  setError: (error) => {
    console.error('❌ GameStore: Erro de jogo definido:', error);
    set({ error });
  },
  
  clearErrors: () => {
    set({ error: null, errorPersonagens: null });
  },
  
  // ===== ACTIONS - PERSONAGENS =====
  setPersonagensDaHistoria: (personagens) => {
    set({ personagensDaHistoria: personagens });
  },
  
  selecionarPersonagem: (personagem) => {
    // Validação básica
    if (!personagem) {
      set({ personagemSelecionado: null });
      return;
    }

    // Verificar se o personagem existe na lista
    const { personagensDaHistoria } = get();
    const personagemValido = personagensDaHistoria.find(p => p.id === personagem.id);
    
    if (!personagemValido) {
      console.warn('🚫 GameStore: Personagem não encontrado na lista da história');
      return;
    }

    set({ personagemSelecionado: personagem });
  },
  
  setLoadingPersonagens: (loading) => {
    set({ loadingPersonagens: loading });
  },
  
  setErrorPersonagens: (error) => {
    if (error === null || error === undefined) {
      set({ errorPersonagens: null });
      return;
    }
    
    console.error('❌ GameStore: Erro personagens:', error);
    set({ errorPersonagens: error });
  },
  
  setBuscaPersonagem: (busca) => {
    set({ buscaPersonagem: busca });
  },
  
  // ===== ACTIONS - SESSÃO =====
  setSessaoId: (sessaoId) => {
    set({ sessaoId });
  },
  
  setIsDonoSala: (isDonoSala) => {
    set({ isDonoSala });
  },
  
  abrirSala: () => {
    set({ salaAberta: true, podeIniciarJogo: true });
  },
  
  fecharSala: () => {
    set({ salaAberta: false, podeIniciarJogo: false });
  },
  
  iniciarJogo: () => {
    set({ jogoIniciado: true });
  },
  
  finalizarJogo: () => {
    set({ jogoIniciado: false });
  },
  
  // ===== ACTIONS - PARTICIPANTES (JOGADORES CONFIRMADOS) =====
  adicionarParticipante: (participante) => {
    const { participantes } = get();
    if (!participantes.find(p => p.id === participante.id)) {
      set({ participantes: [...participantes, participante] });
    }
  },
  
  removerParticipante: (participanteId) => {
    const { participantes } = get();
    set({ participantes: participantes.filter(p => p.id !== participanteId) });
  },
  
  atualizarStatusParticipante: (participanteId, status) => {
    const { participantes } = get();
    const participantesAtualizados = participantes.map(p => 
      p.id === participanteId ? { ...p, status } : p
    );
    set({ participantes: participantesAtualizados });
  },
  
  setParticipantes: (participantes) => {
    set({ participantes });
  },
  
  // ===== ACTIONS - JOGO ATIVO =====
  adicionarMensagem: (mensagem) => {
    const { mensagens } = get();
    set({ mensagens: [...mensagens, mensagem] });
  },
  
  setMensagens: (mensagens) => {
    set({ mensagens });
  },
  
  setStatusPersonagem: (status) => {
    set({ statusPersonagem: status });
  },
  
  // ===== ACTIONS - PERSISTÊNCIA E HIDRATAÇÃO =====
  
  /**
   * 💾 Hidrata o store com dados do localStorage
   * USO: Apenas na inicialização da aplicação
   */
  hidrataDoLocalStorage: () => {
    try {
      // Recuperar personagem selecionado
      const personagemSalvo = localStorage.getItem('personagemSelecionado');
      if (personagemSalvo) {
        const personagem = JSON.parse(personagemSalvo);
        set({ personagemSelecionado: personagem });
      }

      // Aqui podem ser adicionados outros dados se necessário
      // const sessaoSalva = localStorage.getItem('sessaoAtual');
      // const etapaSalva = localStorage.getItem('etapaAtual');

    } catch (error) {
      console.error('❌ GameStore: Erro na hidratação do localStorage:', error);
    }
  },

  /**
   * 💾 Persiste dados críticos no localStorage
   * USO: Chamada explícita quando necessário preservar estado
   */
  persistirEstadoCritico: () => {
    try {
      const { personagemSelecionado, historiaAtual, etapaAtual } = get();
      
      // Persistir apenas dados críticos
      if (personagemSelecionado) {
        localStorage.setItem('personagemSelecionado', JSON.stringify(personagemSelecionado));
      }

      // Outras persistências críticas podem ser adicionadas aqui
      // if (historiaAtual) localStorage.setItem('historiaAtual', JSON.stringify(historiaAtual));
      // localStorage.setItem('etapaAtual', etapaAtual);

    } catch (error) {
      console.error('❌ GameStore: Erro na persistência:', error);
    }
  },

  /**
   * 🧹 Limpa dados persistidos no localStorage
   * USO: Logout, reset, ou quando dados não são mais necessários
   */
  limparDadosPersistidos: () => {
    try {
      localStorage.removeItem('personagemSelecionado');
      // localStorage.removeItem('historiaAtual');
      // localStorage.removeItem('etapaAtual');
      
    } catch (error) {
      console.error('❌ GameStore: Erro ao limpar localStorage:', error);
    }
  },
  
  // ===== ACTIONS - RESET =====
  resetGameState: () => {
    
    // Limpar dados persistidos
    get().limparDadosPersistidos();
    
    // Resetar estado do Zustand
    set({
      etapaAtual: 'selecao-personagem',
      historiaAtual: null,
      loading: false,
      error: null,
      personagensDaHistoria: [],
      personagemSelecionado: null,
      loadingPersonagens: false,
      errorPersonagens: null,
      buscaPersonagem: '',
      participantes: [],
      sessaoId: null,
      isDonoSala: false,
      salaAberta: false,
      jogoIniciado: false,
      podeIniciarJogo: false,
      mensagens: [],
      statusPersonagem: {},
    });
  },
  
  sairDaSala: () => {
    const { resetGameState } = get();
    resetGameState();
  }
});

export default createGameActions; 