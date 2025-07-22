/**
 * 🧬 RAÇA ACTIONS - Lógicas e ações das raças
 * 
 * Contém todas as funções que modificam o estado das raças:
 * - Carregamento único das raças (cache)
 * - Mapeamento por ID e nome
 * - Acesso otimizado aos dados
 * - Funções utilitárias para views e viewmodels
 * - Suporte a paginação da API
 * 
 * 📡 API REAL: /racas endpoint com paginação (limit, offset)
 */

export const createRacaActions = (set, get) => ({

  // ===== CARREGAMENTO ÚNICO DAS RAÇAS =====
  // Usado por: Views e ViewModels que precisam das raças
  carregarRacas: async (forceReload = false) => {
    const { racasCarregadas, loading } = get();
    
    // Se já foram carregados ou está carregando, não faz nada (exceto se forçar)
    if ((racasCarregadas || loading) && !forceReload) {
      console.log('🧬 RacaStore: Raças já carregadas ou carregando');
      return get().racas;
    }

    console.log('🧬 RacaStore: Carregando raças do backend...');
    set({ loading: true, error: null });

    try {
      // Importar o service dinamicamente
      const { racaService } = await import('../../services/index.js');
      
      // Buscar raças do backend (carregar todas de uma vez)
      const response = await racaService.getAll();
      
      // A API retorna { success, data, total, offset, limit }
      const racasData = response.data || response;
      const total = response.total || racasData.length;
      const offset = response.offset || 0;
      const limit = response.limit || 50;
      
      // Processar e cachear os dados
      get().processarRacas(racasData, total, offset, limit);
      
      console.log(`✅ RacaStore: ${racasData.length} raças carregadas com sucesso`);
      
      return racasData;
    } catch (error) {
      console.error('❌ RacaStore: Erro ao carregar raças:', error);
      set({ 
        error: error.message,
        loading: false 
      });
      throw error;
    }
  },

  // ===== PROCESSAMENTO E CACHE DOS DADOS =====
  processarRacas: (racasData, total = 0, offset = 0, limit = 50) => {
    console.log('🔄 RacaStore: Processando e criando cache das raças...');
    
    // Filtrar apenas raças válidas
    const racasValidas = (racasData || []).filter(raca => raca && raca.id);
    
    // Criar maps para acesso otimizado
    const racasPorId = {};
    const racasPorNome = {};
    
    racasValidas.forEach(raca => {
      // Cache por ID
      racasPorId[raca.id] = raca;
      
      // Cache por nome (normalizado)
      if (raca.nome) {
        const nomeNormalizado = raca.nome.toLowerCase().trim();
        racasPorNome[nomeNormalizado] = raca;
      }
    });
    
    const hasMore = (offset + racasValidas.length) < total;
    
    set({
      racas: racasValidas,
      racasPorId,
      racasPorNome,
      totalRacas: racasValidas.length,
      total,
      offset,
      limit,
      hasMore,
      racasCarregadas: true,
      loading: false,
      lastLoadTime: new Date().toISOString()
    });
    
    console.log(`🗂️ RacaStore: Cache criado - ${racasValidas.length} raças de ${total} total`);
  },

  // ===== ACESSO OTIMIZADO AOS DADOS =====
  
  // Usado por: Views que precisam buscar raça por ID
  getRacaById: (id) => {
    const { racasPorId } = get();
    return racasPorId[id] || null;
  },

  // Usado por: Views que precisam buscar raça por nome
  getRacaByNome: (nome) => {
    const { racasPorNome } = get();
    if (!nome) return null;
    
    const nomeNormalizado = nome.toLowerCase().trim();
    return racasPorNome[nomeNormalizado] || null;
  },

  // Usado por: Views que precisam dos nomes das raças (ao invés dos IDs)
  getNomesDeRacas: (ids) => {
    if (!Array.isArray(ids)) return [];
    
    const { racasPorId } = get();
    return ids
      .map(id => racasPorId[id]?.nome)
      .filter(Boolean); // Remove nulls/undefined
  },

  // Usado por: Views que precisam converter nomes para IDs
  getIdsDeRacas: (nomes) => {
    if (!Array.isArray(nomes)) return [];
    
    const { racasPorNome } = get();
    return nomes
      .map(nome => {
        const nomeNormalizado = nome.toLowerCase().trim();
        return racasPorNome[nomeNormalizado]?.id;
      })
      .filter(id => id !== undefined); // Remove undefined
  },

  // ===== FUNÇÕES UTILITÁRIAS =====
  
  // Usado por: Views que precisam verificar se uma raça existe
  racaExists: (idOrNome) => {
    const { racasPorId, racasPorNome } = get();
    
    // Se é número, busca por ID
    if (typeof idOrNome === 'number' || !isNaN(idOrNome)) {
      return !!racasPorId[idOrNome];
    }
    
    // Se é string, busca por nome
    const nomeNormalizado = idOrNome.toLowerCase().trim();
    return !!racasPorNome[nomeNormalizado];
  },

  // Usado por: PersonagemViewModel - para mapear raças do personagem
  mapearRacaDePersonagem: (personagem) => {
    if (!personagem || !personagem.raca_id) return null;
    
    const { racasPorId } = get();
    return racasPorId[personagem.raca_id] || null;
  },

  // ===== INICIALIZAÇÃO AUTOMÁTICA =====
  // Usado por: App.jsx ou onde for necessário
  inicializar: async () => {
    const { racasCarregadas } = get();
    
    if (!racasCarregadas) {
      console.log('🚀 RacaStore: Inicializando store de raças...');
      await get().carregarRacas();
    }
  },

  // ===== RESET E RECARGA =====
  
  // Usado por: Em caso de erro ou necessidade de recarga
  recarregarRacas: async () => {
    console.log('🔄 RacaStore: Forçando recarga das raças...');
    return await get().carregarRacas(true);
  },

  // Reset completo do estado
  resetRacaState: () => {
    console.log('🧹 RacaStore: Reset completo do estado');
    const { racaInitialStates } = require('./states.js');
    set(racaInitialStates);
  },

  // ===== GETTERS ESPECÍFICOS PARA VIEWMODELS =====
  
  // Usado por: NovoPersonagemViewModel - lista de raças para seleção
  getRacasParaSelecao: () => {
    const { racas } = get();
    return racas.map(raca => ({
      id: raca.id,
      nome: raca.nome,
      descricao: raca.descricao || '',
      atributos: raca.atributos || {}
    }));
  },

  // Usado por: PersonagemViewModel - para filtros
  getRacasParaFiltro: () => {
    const { racas } = get();
    return [
      { id: null, nome: 'Todas as raças' },
      ...racas.map(raca => ({
        id: raca.id,
        nome: raca.nome
      }))
    ];
  },

  // ===== PAGINAÇÃO (FUTURO) =====
  
  // Usado por: Se precisar carregar mais raças
  carregarMaisRacas: async () => {
    const { hasMore, offset, limit, loading } = get();
    
    if (!hasMore || loading) {
      console.log('🧬 RacaStore: Não há mais raças para carregar');
      return;
    }
    
    console.log('🧬 RacaStore: Carregando mais raças...');
    set({ loading: true });
    
    try {
      const { racaService } = await import('../../services/index.js');
      
      // Carregar próxima página
      const response = await racaService.getAll({ 
        limit, 
        offset: offset + limit 
      });
      
      const novasRacas = response.data || response;
      const todasRacas = [...get().racas, ...novasRacas];
      
      // Processar dados combinados
      get().processarRacas(
        todasRacas, 
        response.total || todasRacas.length,
        response.offset || (offset + limit),
        response.limit || limit
      );
      
      console.log(`✅ RacaStore: ${novasRacas.length} raças adicionais carregadas`);
      
    } catch (error) {
      console.error('❌ RacaStore: Erro ao carregar mais raças:', error);
      set({ 
        error: error.message,
        loading: false 
      });
      throw error;
    }
  }
}); 