/**
 * 🎨 TEMA ACTIONS - Lógicas e ações dos temas
 * 
 * Contém todas as funções que modificam o estado dos temas:
 * - Carregamento único dos temas (cache)
 * - Mapeamento por ID e nome
 * - Acesso otimizado aos dados
 * - Funções utilitárias para views e viewmodels
 * 
 * 🔧 API REAL: Temas só têm { id, nome } - sem propriedade 'ativo'
 */

export const createTemaActions = (set, get) => ({

  // ===== CARREGAMENTO ÚNICO DOS TEMAS =====
  // Usado por: Views e ViewModels que precisam dos temas
  carregarTemas: async () => {
    const { temasCarregados, loading } = get();
    
    // Se já foram carregados ou está carregando, não faz nada
    if (temasCarregados || loading) {
      console.log('🎨 TemaStore: Temas já carregados ou carregando');
      return get().temas;
    }

    console.log('🎨 TemaStore: Carregando temas do backend...');
    set({ loading: true, error: null });

    try {
      // Importar o service dinamicamente
      const { temaService } = await import('../../services/index.js');
      
      // Buscar temas do backend
      const temasData = await temaService.getAll();
      
      // Processar e cachear os dados
      get().processarTemas(temasData);
      
      console.log(`✅ TemaStore: ${temasData.length} temas carregados com sucesso`);
      
      return temasData;
    } catch (error) {
      console.error('❌ TemaStore: Erro ao carregar temas:', error);
      set({ 
        error: error.message,
        loading: false 
      });
      throw error;
    }
  },

  // ===== PROCESSAMENTO E CACHE DOS DADOS =====
  processarTemas: (temasData) => {
    console.log('🔄 TemaStore: Processando e criando cache dos temas...');
    
    // Filtrar apenas temas válidos
    const temasValidos = (temasData || []).filter(tema => tema && tema.id);
    
    // Criar maps para acesso otimizado
    const temasPorId = {};
    const temasPorNome = {};
    const temasAtivos = [];
    
    temasValidos.forEach(tema => {
      // Cache por ID
      temasPorId[tema.id] = tema;
      
      // Cache por nome (normalizado)
      if (tema.nome) {
        const nomeNormalizado = tema.nome.toLowerCase().trim();
        temasPorNome[nomeNormalizado] = tema;
      }
      
      // 🔧 CORREÇÃO: API não tem propriedade 'ativo', todos os temas são considerados ativos
      temasAtivos.push(tema);
    });
    
    set({
      temas: temasValidos,
      temasPorId,
      temasPorNome,
      temasAtivos,
      totalTemas: temasValidos.length,
      temasCarregados: true,
      loading: false,
      lastLoadTime: new Date().toISOString()
    });
    
    console.log(`🗂️ TemaStore: Cache criado - ${temasValidos.length} temas, ${temasAtivos.length} ativos`);
  },

  // ===== ACESSO OTIMIZADO AOS DADOS =====
  
  // Usado por: Views que precisam buscar tema por ID
  getTemaById: (id) => {
    const { temasPorId } = get();
    return temasPorId[id] || null;
  },

  // Usado por: Views que precisam buscar tema por nome
  getTemaByNome: (nome) => {
    const { temasPorNome } = get();
    if (!nome) return null;
    
    const nomeNormalizado = nome.toLowerCase().trim();
    return temasPorNome[nomeNormalizado] || null;
  },

  // Usado por: Views que precisam dos nomes dos temas (ao invés dos IDs)
  getNomesDeTemas: (ids) => {
    if (!Array.isArray(ids)) return [];
    
    const { temasPorId } = get();
    return ids
      .map(id => temasPorId[id]?.nome)
      .filter(Boolean); // Remove nulls/undefined
  },

  // Usado por: Views que precisam converter nomes para IDs
  getIdsDeTemas: (nomes) => {
    if (!Array.isArray(nomes)) return [];
    
    const { temasPorNome } = get();
    return nomes
      .map(nome => {
        const nomeNormalizado = nome.toLowerCase().trim();
        return temasPorNome[nomeNormalizado]?.id;
      })
      .filter(id => id !== undefined); // Remove undefined
  },

  // ===== FUNÇÕES UTILITÁRIAS =====
  
  // Usado por: Views que precisam verificar se um tema existe
  temaExists: (idOrNome) => {
    const { temasPorId, temasPorNome } = get();
    
    // Se é número, busca por ID
    if (typeof idOrNome === 'number' || !isNaN(idOrNome)) {
      return !!temasPorId[idOrNome];
    }
    
    // Se é string, busca por nome
    const nomeNormalizado = idOrNome.toLowerCase().trim();
    return !!temasPorNome[nomeNormalizado];
  },

  // Usado por: HistoriaViewModel - para mapear temas da história
  mapearTemasDeHistoria: (historia) => {
    if (!historia || !historia.temas) return [];
    
    // Se já são objetos com nome, retorna como está
    if (Array.isArray(historia.temas) && historia.temas[0]?.nome) {
      return historia.temas;
    }
    
    // Se são IDs, converte para objetos
    if (Array.isArray(historia.temas)) {
      return get().getNomesDeTemas(historia.temas);
    }
    
    return [];
  },

  // ===== INICIALIZAÇÃO AUTOMÁTICA =====
  // Usado por: App.jsx ou onde for necessário
  inicializar: async () => {
    const { temasCarregados } = get();
    
    if (!temasCarregados) {
      console.log('🚀 TemaStore: Inicializando store de temas...');
      await get().carregarTemas();
    }
  },

  // ===== RESET E RECARGA =====
  
  // Usado por: Em caso de erro ou necessidade de recarga
  recarregarTemas: async () => {
    console.log('🔄 TemaStore: Forçando recarga dos temas...');
    set({ 
      temasCarregados: false,
      temas: [],
      temasPorId: {},
      temasPorNome: {},
      temasAtivos: [],
      totalTemas: 0
    });
    
    return await get().carregarTemas();
  },

  // Reset completo do estado
  resetTemaState: () => {
    console.log('🧹 TemaStore: Reset completo do estado');
    const { temaInitialStates } = require('./states.js');
    set(temaInitialStates);
  },

  // ===== GETTERS ESPECÍFICOS PARA VIEWMODELS =====
  
  // Usado por: NovaHistoriaViewModel - lista de temas para seleção
  getTemasParaSelecao: () => {
    const { temasAtivos } = get();
    return temasAtivos.map(tema => ({
      id: tema.id,
      nome: tema.nome,
      cor: tema.cor || '#8b5cf6'
    }));
  },

  // Usado por: HistoriaViewModel - para filtros
  getTemasParaFiltro: () => {
    const { temasAtivos } = get();
    return [
      { id: null, nome: 'Todos os temas' },
      ...temasAtivos.map(tema => ({
        id: tema.id,
        nome: tema.nome
      }))
    ];
  }
}); 