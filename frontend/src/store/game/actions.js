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
    
    const etapasValidas = ['info', 'selecao-personagem', 'sala-espera', 'jogo-ativo'];
    
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

    console.log(`✅ GameStore: Mudando etapa ${etapaAtual} → ${novaEtapa}`);
    set({ etapaAtual: novaEtapa });
    return true;
  },
  
  // ===== ACTIONS - HISTÓRIA =====
  setHistoriaAtual: (historia) => {
    console.log('📚 GameStore: História definida:', historia);
    set({ historiaAtual: historia });
  },
  
  setLoading: (loading) => {
    console.log(`⏳ GameStore: Loading ${loading ? 'iniciado' : 'finalizado'}`);
    set({ loading });
  },
  
  setError: (error) => {
    console.error('❌ GameStore: Erro de jogo definido:', error);
    set({ error });
  },
  
  clearErrors: () => {
    console.log('🧹 GameStore: Erros de jogo limpos');
    set({ error: null, errorPersonagens: null });
  },
  
  // ===== ACTIONS - PERSONAGENS =====
  setPersonagensDaHistoria: (personagens) => {
    console.log('👥 GameStore: Personagens da história definidos:', personagens.length);
    set({ personagensDaHistoria: personagens });
  },
  
  selecionarPersonagem: (personagem) => {
    // Validação básica
    if (!personagem) {
      console.log('👤 GameStore: Personagem desmarcado');
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

    console.log('👤 GameStore: Personagem selecionado:', personagem);
    set({ personagemSelecionado: personagem });
  },
  
  setLoadingPersonagens: (loading) => {
    console.log(`⏳ GameStore: Loading personagens ${loading ? 'iniciado' : 'finalizado'}`);
    set({ loadingPersonagens: loading });
  },
  
  setErrorPersonagens: (error) => {
    console.error('❌ GameStore: Erro personagens:', error);
    set({ errorPersonagens: error });
  },
  
  setBuscaPersonagem: (busca) => {
    set({ buscaPersonagem: busca });
  },
  
  // ===== ACTIONS - SESSÃO =====
  setSessaoId: (sessaoId) => {
    console.log('🔑 GameStore: Sessão ID definida:', sessaoId);
    set({ sessaoId });
  },
  
  setIsDonoSala: (isDonoSala) => {
    console.log(`👑 GameStore: ${isDonoSala ? 'É dono' : 'Não é dono'} da sala`);
    set({ isDonoSala });
  },
  
  abrirSala: () => {
    console.log('🏠 GameStore: Sala de jogo aberta');
    set({ salaAberta: true, podeIniciarJogo: true });
  },
  
  fecharSala: () => {
    console.log('🔒 GameStore: Sala de jogo fechada');
    set({ salaAberta: false, podeIniciarJogo: false });
  },
  
  iniciarJogo: () => {
    console.log('🎮 GameStore: Jogo iniciado');
    set({ jogoIniciado: true });
  },
  
  finalizarJogo: () => {
    console.log('🏁 GameStore: Jogo finalizado');
    set({ jogoIniciado: false });
  },
  
  // ===== ACTIONS - PARTICIPANTES (JOGADORES CONFIRMADOS) =====
  adicionarParticipante: (participante) => {
    const { participantes } = get();
    if (!participantes.find(p => p.id === participante.id)) {
      console.log('➕ GameStore: Participante confirmado adicionado:', participante);
      set({ participantes: [...participantes, participante] });
    }
  },
  
  removerParticipante: (participanteId) => {
    const { participantes } = get();
    console.log('➖ GameStore: Participante confirmado removido:', participanteId);
    set({ participantes: participantes.filter(p => p.id !== participanteId) });
  },
  
  atualizarStatusParticipante: (participanteId, status) => {
    const { participantes } = get();
    const participantesAtualizados = participantes.map(p => 
      p.id === participanteId ? { ...p, status } : p
    );
    console.log('🔄 GameStore: Status do participante atualizado:', { participanteId, status });
    set({ participantes: participantesAtualizados });
  },
  
  setParticipantes: (participantes) => {
    console.log('👥 GameStore: Lista de participantes confirmados definida:', participantes.length);
    set({ participantes });
  },
  
  // ===== ACTIONS - JOGO ATIVO =====
  adicionarMensagem: (mensagem) => {
    const { mensagens } = get();
    console.log('💬 GameStore: Mensagem de jogo adicionada:', mensagem);
    set({ mensagens: [...mensagens, mensagem] });
  },
  
  setMensagens: (mensagens) => {
    console.log('💬 GameStore: Mensagens de jogo definidas:', mensagens.length);
    set({ mensagens });
  },
  
  setStatusPersonagem: (status) => {
    console.log('📊 GameStore: Status do personagem atualizado:', status);
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
        console.log('🔄 GameStore: Recuperando personagem do localStorage:', personagem);
        set({ personagemSelecionado: personagem });
      }

      // Aqui podem ser adicionados outros dados se necessário
      // const sessaoSalva = localStorage.getItem('sessaoAtual');
      // const etapaSalva = localStorage.getItem('etapaAtual');

      console.log('✅ GameStore: Hidratação do localStorage concluída');
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
        console.log('💾 GameStore: Personagem persistido no localStorage');
      }

      // Outras persistências críticas podem ser adicionadas aqui
      // if (historiaAtual) localStorage.setItem('historiaAtual', JSON.stringify(historiaAtual));
      // localStorage.setItem('etapaAtual', etapaAtual);

      console.log('✅ GameStore: Persistência de estado crítico concluída');
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
      
      console.log('🧹 GameStore: Dados persistidos limpos do localStorage');
    } catch (error) {
      console.error('❌ GameStore: Erro ao limpar localStorage:', error);
    }
  },
  
  // ===== ACTIONS - RESET =====
  resetGameState: () => {
    console.log('🔄 GameStore: Reset completo do estado de jogo');
    
    // Limpar dados persistidos
    get().limparDadosPersistidos();
    
    // Resetar estado do Zustand
    set({
      etapaAtual: 'info',
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
    console.log('🚪 GameStore: Saindo da sala de jogo');
    resetGameState();
  }
});

export default createGameActions; 