/**
 * 🔻 DESVANTAGEM ACTIONS - Lógicas e ações das desvantagens
 * 
 * Contém todas as funções que modificam o estado das desvantagens:
 * - Carregamento único das desvantagens (cache)
 * - Mapeamento por ID e nome
 * - Organização por nível e tipo
 * - Acesso otimizado aos dados
 * - Funções utilitárias para views e viewmodels
 * - Suporte a paginação da API
 * 
 * 📡 API REAL: /desvantagens endpoint com paginação (limit, offset)
 */

export const createDesvantagemActions = (set, get) => ({

  // ===== CARREGAMENTO ÚNICO DAS DESVANTAGENS =====
  // Usado por: Views e ViewModels que precisam das desvantagens
  carregarDesvantagens: async (forceReload = false) => {
    const { desvantagensCarregadas, loading } = get();
    
    // Se já foram carregados ou está carregando, não faz nada (exceto se forçar)
    if ((desvantagensCarregadas || loading) && !forceReload) {
      console.log('🔻 DesvantagemStore: Desvantagens já carregadas ou carregando');
      return get().desvantagens;
    }

    console.log('🔻 DesvantagemStore: Carregando desvantagens do backend...');
    set({ loading: true, error: null });

    try {
      // Importar o service dinamicamente
      const { desvantagemService } = await import('../../services/index.js');
      
      // Buscar desvantagens do backend (carregar todas de uma vez)
      const response = await desvantagemService.getAll();
      
      // A API retorna { success, data, total, offset, limit }
      const desvantagensData = response.data || response;
      const total = response.total || desvantagensData.length;
      const offset = response.offset || 0;
      const limit = response.limit || 50;
      
      // Processar e cachear os dados
      get().processarDesvantagens(desvantagensData, total, offset, limit);
      
      console.log(`✅ DesvantagemStore: ${desvantagensData.length} desvantagens carregadas com sucesso`);
      
      return desvantagensData;
    } catch (error) {
      console.error('❌ DesvantagemStore: Erro ao carregar desvantagens:', error);
      set({ 
        loading: false, 
        error: error.message,
        desvantagens: [],
        desvantagensCarregadas: false
      });
      throw error;
    }
  },

  // ===== PROCESSAMENTO E CACHE DOS DADOS =====
  processarDesvantagens: (desvantagensData, total, offset, limit) => {
    console.log('🔻 DesvantagemStore: Processando desvantagens...');
    
    // Criar maps otimizados
    const desvantagensPorId = new Map();
    const desvantagensPorNome = new Map();
    const desvantagensPorNivel = new Map();
    const desvantagensPorTipo = new Map();
    
    // Filtrar apenas desvantagens ativas
    const desvantagensAtivas = [];
    
    // Contadores para estatísticas
    const nivelCount = new Map();
    const tipoCount = new Map();
    
    desvantagensData.forEach(desvantagem => {
      // Adicionar aos maps básicos
      desvantagensPorId.set(desvantagem.id, desvantagem);
      desvantagensPorNome.set(desvantagem.nome.toLowerCase(), desvantagem);
      
      // Filtrar apenas desvantagens ativas (se aplicável)
      // Assumindo que todas são ativas por padrão
      desvantagensAtivas.push(desvantagem);
      
      // Organizar por nível
      const nivel = desvantagem.nivel || 1;
      if (!desvantagensPorNivel.has(nivel)) {
        desvantagensPorNivel.set(nivel, []);
      }
      desvantagensPorNivel.get(nivel).push(desvantagem);
      
      // Contar níveis para estatísticas
      nivelCount.set(nivel, (nivelCount.get(nivel) || 0) + 1);
      
      // Organizar por tipo
      if (Array.isArray(desvantagem.tipo) && desvantagem.tipo.length > 0) {
        desvantagem.tipo.forEach(tipo => {
          if (!desvantagensPorTipo.has(tipo)) {
            desvantagensPorTipo.set(tipo, []);
          }
          desvantagensPorTipo.get(tipo).push(desvantagem);
          
          // Contar tipos para estatísticas
          tipoCount.set(tipo, (tipoCount.get(tipo) || 0) + 1);
        });
      }
    });

    // Encontrar nível e tipo mais comuns
    let nivelMaisComum = null;
    let maxNivelCount = 0;
    nivelCount.forEach((count, nivel) => {
      if (count > maxNivelCount) {
        maxNivelCount = count;
        nivelMaisComum = nivel;
      }
    });

    let tipoMaisComum = null;
    let maxTipoCount = 0;
    tipoCount.forEach((count, tipo) => {
      if (count > maxTipoCount) {
        maxTipoCount = count;
        tipoMaisComum = tipo;
      }
    });

    set({
      desvantagens: desvantagensData,
      desvantagensPorId,
      desvantagensPorNome,
      desvantagensPorNivel,
      desvantagensPorTipo,
      desvantagensAtivas,
      totalDesvantagens: desvantagensData.length,
      nivelMaisComum,
      tipoMaisComum,
      desvantagensCarregadas: true,
      loading: false,
      error: null,
      lastLoadTime: Date.now(),
      total,
      offset,
      limit,
      hasMore: offset + limit < total
    });

    console.log(`✅ DesvantagemStore: ${desvantagensData.length} desvantagens processadas e cacheadas`);
  },

  // ===== BUSCA POR ID =====
  getDesvantagemById: (id) => {
    const { desvantagensPorId } = get();
    return desvantagensPorId.get(parseInt(id)) || null;
  },

  // ===== BUSCA POR NOME =====
  getDesvantagemByNome: (nome) => {
    const { desvantagensPorNome } = get();
    return desvantagensPorNome.get(nome.toLowerCase()) || null;
  },

  // ===== BUSCA POR NÍVEL =====
  getDesvantagensPorNivel: (nivel) => {
    const { desvantagensPorNivel } = get();
    return desvantagensPorNivel.get(parseInt(nivel)) || [];
  },

  // ===== BUSCA POR TIPO =====
  getDesvantagensPorTipo: (tipo) => {
    const { desvantagensPorTipo } = get();
    return desvantagensPorTipo.get(tipo) || [];
  },

  // ===== CONVERSÕES E UTILITÁRIOS =====
  getNomesDeDesvantagens: (ids) => {
    if (!Array.isArray(ids)) return [];
    const { desvantagensPorId } = get();
    return ids.map(id => {
      const desvantagem = desvantagensPorId.get(parseInt(id));
      return desvantagem ? desvantagem.nome : `Desvantagem ${id}`;
    });
  },

  getIdsDeDesvantagens: (nomes) => {
    if (!Array.isArray(nomes)) return [];
    const { desvantagensPorNome } = get();
    return nomes.map(nome => {
      const desvantagem = desvantagensPorNome.get(nome.toLowerCase());
      return desvantagem ? desvantagem.id : null;
    }).filter(Boolean);
  },

  // ===== VERIFICAÇÕES =====
  desvantagemExists: (id) => {
    const { desvantagensPorId } = get();
    return desvantagensPorId.has(parseInt(id));
  },

  // ===== FUNÇÕES ESPECÍFICAS PARA PERSONAGENS =====
  mapearDesvantagensDePersonagem: (desvantagensPersonagem) => {
    if (!Array.isArray(desvantagensPersonagem)) return [];
    
    const { desvantagensPorId } = get();
    return desvantagensPersonagem.map(desvantagemData => {
      const desvantagem = desvantagensPorId.get(parseInt(desvantagemData.id || desvantagemData.desvantagem_id));
      return desvantagem ? {
        ...desvantagem,
        ...desvantagemData
      } : desvantagemData;
    });
  },

  // ===== FUNÇÕES PARA VIEWS =====
  getDesvantagensParaSelecao: () => {
    const { desvantagensAtivas } = get();
    return desvantagensAtivas.map(desvantagem => ({
      id: desvantagem.id,
      nome: desvantagem.nome,
      custo: desvantagem.custo,
      descricao: desvantagem.descricao,
      nivel: desvantagem.nivel,
      tipo: desvantagem.tipo
    }));
  },

  getDesvantagensParaFiltro: () => {
    const { desvantagens } = get();
    return desvantagens.map(desvantagem => ({
      id: desvantagem.id,
      nome: desvantagem.nome,
      nivel: desvantagem.nivel,
      tipo: desvantagem.tipo,
      custo: desvantagem.custo
    }));
  },

  // ===== ESTATÍSTICAS =====
  getEstatisticasDesvantagens: () => {
    const { 
      totalDesvantagens, 
      nivelMaisComum, 
      tipoMaisComum,
      desvantagensPorNivel,
      desvantagensPorTipo 
    } = get();
    
    return {
      total: totalDesvantagens,
      nivelMaisComum,
      tipoMaisComum,
      niveis: Array.from(desvantagensPorNivel.keys()).sort((a, b) => a - b),
      tipos: Array.from(desvantagensPorTipo.keys()).sort(),
      desvantagensPorNivel: Object.fromEntries(desvantagensPorNivel),
      desvantagensPorTipo: Object.fromEntries(desvantagensPorTipo)
    };
  },

  // ===== OPERAÇÕES DE CONTROLE =====
  inicializar: async () => {
    const { desvantagensCarregadas } = get();
    if (!desvantagensCarregadas) {
      console.log('🔻 DesvantagemStore: Inicializando...');
      await get().carregarDesvantagens();
    }
  },

  recarregarDesvantagens: async () => {
    console.log('🔻 DesvantagemStore: Forçando recarregamento...');
    await get().carregarDesvantagens(true);
  },

  resetDesvantagemState: () => {
    console.log('🔻 DesvantagemStore: Reset do estado...');
    set({
      desvantagens: [],
      desvantagensCarregadas: false,
      desvantagensPorId: new Map(),
      desvantagensPorNome: new Map(),
      desvantagensPorNivel: new Map(),
      desvantagensPorTipo: new Map(),
      desvantagensAtivas: [],
      totalDesvantagens: 0,
      nivelMaisComum: null,
      tipoMaisComum: null,
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
  carregarMaisDesvantagens: async () => {
    const { hasMore, loading, offset, limit } = get();
    
    if (!hasMore || loading) {
      console.log('🔻 DesvantagemStore: Não há mais desvantagens para carregar ou já está carregando');
      return;
    }

    console.log('🔻 DesvantagemStore: Carregando mais desvantagens...');
    set({ loading: true });

    try {
      const { desvantagemService } = await import('../../services/index.js');
      const response = await desvantagemService.getAll({ 
        offset: offset + limit, 
        limit 
      });
      
      const novasDesvantagens = response.data || response;
      const currentDesvantagens = get().desvantagens;
      const todasDesvantagens = [...currentDesvantagens, ...novasDesvantagens];
      
      get().processarDesvantagens(
        todasDesvantagens, 
        response.total || todasDesvantagens.length,
        response.offset || 0,
        response.limit || 50
      );
      
      console.log(`✅ DesvantagemStore: ${novasDesvantagens.length} desvantagens adicionais carregadas`);
    } catch (error) {
      console.error('❌ DesvantagemStore: Erro ao carregar mais desvantagens:', error);
      set({ loading: false, error: error.message });
    }
  }
}); 