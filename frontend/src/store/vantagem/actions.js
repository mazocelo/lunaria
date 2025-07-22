/**
 * 🌟 VANTAGEM ACTIONS - Lógicas e ações das vantagens
 * 
 * Contém todas as funções que modificam o estado das vantagens:
 * - Carregamento único das vantagens (cache)
 * - Mapeamento por ID e nome
 * - Separação entre vantagens e desvantagens
 * - Acesso otimizado aos dados
 * - Funções utilitárias para views e viewmodels
 * - Suporte a paginação da API
 * 
 * 📡 API REAL: /vantagens endpoint com paginação (limit, offset)
 */

export const createVantagemActions = (set, get) => ({

  // ===== CARREGAMENTO ÚNICO DAS VANTAGENS =====
  // Usado por: Views e ViewModels que precisam das vantagens
  carregarVantagens: async (forceReload = false) => {
    const { vantagensCarregadas, loading } = get();
    
    // Se já foram carregados ou está carregando, não faz nada (exceto se forçar)
    if ((vantagensCarregadas || loading) && !forceReload) {
      console.log('🌟 VantagemStore: Vantagens já carregadas ou carregando');
      return get().vantagens;
    }

    console.log('🌟 VantagemStore: Carregando vantagens do backend...');
    set({ loading: true, error: null });

    try {
      // Importar o service dinamicamente
      const { vantagemService } = await import('../../services/index.js');
      
      // Buscar vantagens do backend (carregar todas de uma vez)
      const response = await vantagemService.getAll();
      
      // A API retorna { success, data, total, offset, limit }
      const vantagensData = response.data || response;
      const total = response.total || vantagensData.length;
      const offset = response.offset || 0;
      const limit = response.limit || 50;
      
      // Processar e cachear os dados
      get().processarVantagens(vantagensData, total, offset, limit);
      
      console.log(`✅ VantagemStore: ${vantagensData.length} vantagens carregadas com sucesso`);
      
      return vantagensData;
    } catch (error) {
      console.error('❌ VantagemStore: Erro ao carregar vantagens:', error);
      set({ 
        loading: false, 
        error: error.message,
        vantagens: [],
        vantagensCarregadas: false
      });
      throw error;
    }
  },

  // ===== PROCESSAMENTO E CACHE DOS DADOS =====
  processarVantagens: (vantagensData, total, offset, limit) => {
    console.log('🌟 VantagemStore: Processando vantagens...');
    
    // Criar maps otimizados
    const vantagensPorId = new Map();
    const vantagensPorNome = new Map();
    
    // Separar vantagens, desvantagens e neutras
    const vantagensPositivas = [];
    const vantagensNegativas = [];
    const vantagensNeutras = [];
    
    vantagensData.forEach(vantagem => {
      // Adicionar aos maps
      vantagensPorId.set(vantagem.id, vantagem);
      vantagensPorNome.set(vantagem.nome.toLowerCase(), vantagem);
      
      // Separar por tipo baseado no custo
      if (vantagem.custo > 0) {
        vantagensPositivas.push(vantagem);
      } else if (vantagem.custo < 0) {
        vantagensNegativas.push(vantagem);
      } else {
        vantagensNeutras.push(vantagem);
      }
    });

    set({
      vantagens: vantagensData,
      vantagensPorId,
      vantagensPorNome,
      vantagensPositivas,
      vantagensNegativas,
      vantagensNeutras,
      totalVantagens: vantagensPositivas.length,
      totalDesvantagens: vantagensNegativas.length,
      vantagensCarregadas: true,
      loading: false,
      error: null,
      lastLoadTime: Date.now(),
      total,
      offset,
      limit,
      hasMore: offset + limit < total
    });

    console.log(`✅ VantagemStore: ${vantagensData.length} vantagens processadas e cacheadas`);
  },

  // ===== BUSCA POR ID =====
  getVantagemById: (id) => {
    const { vantagensPorId } = get();
    return vantagensPorId.get(parseInt(id)) || null;
  },

  // ===== BUSCA POR NOME =====
  getVantagemByNome: (nome) => {
    const { vantagensPorNome } = get();
    return vantagensPorNome.get(nome.toLowerCase()) || null;
  },

  // ===== CONVERSÕES E UTILITÁRIOS =====
  getNomesDeVantagens: (ids) => {
    if (!Array.isArray(ids)) return [];
    const { vantagensPorId } = get();
    return ids.map(id => {
      const vantagem = vantagensPorId.get(parseInt(id));
      return vantagem ? vantagem.nome : `Vantagem ${id}`;
    });
  },

  getIdsDeVantagens: (nomes) => {
    if (!Array.isArray(nomes)) return [];
    const { vantagensPorNome } = get();
    return nomes.map(nome => {
      const vantagem = vantagensPorNome.get(nome.toLowerCase());
      return vantagem ? vantagem.id : null;
    }).filter(Boolean);
  },

  // ===== VERIFICAÇÕES =====
  vantagemExists: (id) => {
    const { vantagensPorId } = get();
    return vantagensPorId.has(parseInt(id));
  },

  // ===== FUNÇÕES ESPECÍFICAS PARA PERSONAGENS =====
  mapearVantagensDePersonagem: (vantagensPersonagem) => {
    if (!Array.isArray(vantagensPersonagem)) return [];
    
    const { vantagensPorId } = get();
    return vantagensPersonagem.map(vantagemData => {
      const vantagem = vantagensPorId.get(parseInt(vantagemData.id || vantagemData.vantagem_id));
      return vantagem ? {
        ...vantagem,
        ...vantagemData
      } : vantagemData;
    });
  },

  // ===== FUNÇÕES PARA VIEWS =====
  getVantagensParaSelecao: () => {
    const { vantagensPositivas } = get();
    return vantagensPositivas.map(vantagem => ({
      id: vantagem.id,
      nome: vantagem.nome,
      custo: vantagem.custo,
      descricao: vantagem.descricao
    }));
  },

  getDesvantagensParaSelecao: () => {
    const { vantagensNegativas } = get();
    return vantagensNegativas.map(desvantagem => ({
      id: desvantagem.id,
      nome: desvantagem.nome,
      custo: desvantagem.custo,
      descricao: desvantagem.descricao
    }));
  },

  getVantagensParaFiltro: () => {
    const { vantagens } = get();
    return vantagens.map(vantagem => ({
      id: vantagem.id,
      nome: vantagem.nome,
      tipo: vantagem.custo > 0 ? 'vantagem' : vantagem.custo < 0 ? 'desvantagem' : 'neutro'
    }));
  },

  // ===== OPERAÇÕES DE CONTROLE =====
  inicializar: async () => {
    const { vantagensCarregadas } = get();
    if (!vantagensCarregadas) {
      console.log('🌟 VantagemStore: Inicializando...');
      await get().carregarVantagens();
    }
  },

  recarregarVantagens: async () => {
    console.log('🌟 VantagemStore: Forçando recarregamento...');
    await get().carregarVantagens(true);
  },

  resetVantagemState: () => {
    console.log('🌟 VantagemStore: Reset do estado...');
    set({
      vantagens: [],
      vantagensCarregadas: false,
      vantagensPorId: new Map(),
      vantagensPorNome: new Map(),
      vantagensPositivas: [],
      vantagensNegativas: [],
      vantagensNeutras: [],
      totalVantagens: 0,
      totalDesvantagens: 0,
      loading: false,
      error: null,
      lastLoadTime: null,
      total: 0,
      offset: 0,
      limit: 50,
      hasMore: false
    });
  },

  // ===== PAGINAÇÃO (se necessário) =====
  carregarMaisVantagens: async () => {
    const { hasMore, loading, offset, limit } = get();
    
    if (!hasMore || loading) {
      console.log('🌟 VantagemStore: Não há mais vantagens para carregar ou já está carregando');
      return;
    }

    console.log('🌟 VantagemStore: Carregando mais vantagens...');
    set({ loading: true });

    try {
      const { vantagemService } = await import('../../services/index.js');
      const response = await vantagemService.getAll({ 
        offset: offset + limit, 
        limit 
      });
      
      const novasVantagens = response.data || response;
      const currentVantagens = get().vantagens;
      const todasVantagens = [...currentVantagens, ...novasVantagens];
      
      get().processarVantagens(
        todasVantagens, 
        response.total || todasVantagens.length,
        response.offset || 0,
        response.limit || 50
      );
      
      console.log(`✅ VantagemStore: ${novasVantagens.length} vantagens adicionais carregadas`);
    } catch (error) {
      console.error('❌ VantagemStore: Erro ao carregar mais vantagens:', error);
      set({ loading: false, error: error.message });
    }
  }
}); 