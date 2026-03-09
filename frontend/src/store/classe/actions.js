/**
 * 🏛️ CLASSE ACTIONS - Lógicas e ações das classes
 * 
 * Contém todas as funções que modificam o estado das classes:
 * - Carregamento único das classes (cache)
 * - Mapeamento por ID e nome
 * - Acesso otimizado aos dados
 * - Funções utilitárias para views e viewmodels
 * - Suporte a paginação da API
 * 
 * 📡 API REAL: /classes endpoint com paginação (limit, offset)
 */
import { classeService } from '../../services/index.js';

export const createClasseActions = (set, get) => ({

  // ===== CARREGAMENTO ÚNICO DAS CLASSES =====
  // Usado por: Views e ViewModels que precisam das classes
  carregarClasses: async (forceReload = false) => {
    const { classesCarregadas, loading } = get();
    
    // Se já foram carregados ou está carregando, não faz nada (exceto se forçar)
    if ((classesCarregadas || loading) && !forceReload) {
      return get().classes;
    }

    set({ loading: true, error: null });

    try {
      // Importar o service dinamicamente
      
      // Buscar classes do backend (carregar todas de uma vez)
      const response = await classeService.getAll();

      // A API retorna { success, data, pagination: { total, limit, offset, hasMore } }
      const classesData = response.data || [];
      const total = response.pagination?.total ?? classesData.length;
      const offset = response.pagination?.offset ?? 0;
      const limit = response.pagination?.limit ?? 50;

      // Processar e cachear os dados
      get().processarClasses(classesData, total, offset, limit);

      return classesData;
    } catch (error) {
      console.error('❌ ClasseStore: Erro ao carregar classes:', error);
      set({ 
        error: error.message,
        loading: false 
      });
      throw error;
    }
  },

  // ===== PROCESSAMENTO E CACHE DOS DADOS =====
  processarClasses: (classesData, total = 0, offset = 0, limit = 50) => {
    // Filtrar apenas classes válidas
    const classesValidas = (classesData || []).filter(classe => classe && classe.id);
    
    // Criar maps para acesso otimizado
    const classesPorId = {};
    const classesPorNome = {};
    
    classesValidas.forEach(classe => {
      // Cache por ID
      classesPorId[classe.id] = classe;
      
      // Cache por nome (normalizado)
      if (classe.nome) {
        const nomeNormalizado = classe.nome.toLowerCase().trim();
        classesPorNome[nomeNormalizado] = classe;
      }
    });
    
    const hasMore = (offset + classesValidas.length) < total;
    
    set({
      classes: classesValidas,
      classesPorId,
      classesPorNome,
      totalClasses: classesValidas.length,
      total,
      offset,
      limit,
      hasMore,
      classesCarregadas: true,
      loading: false,
      lastLoadTime: new Date().toISOString()
    });
  },

  // ===== ACESSO OTIMIZADO AOS DADOS =====
  
  // Usado por: Views que precisam buscar classe por ID
  getClasseById: (id) => {
    const { classesPorId } = get();
    return classesPorId[id] || null;
  },

  // Usado por: Views que precisam buscar classe por nome
  getClasseByNome: (nome) => {
    const { classesPorNome } = get();
    if (!nome) return null;
    
    const nomeNormalizado = nome.toLowerCase().trim();
    return classesPorNome[nomeNormalizado] || null;
  },

  // Usado por: Views que precisam dos nomes das classes (ao invés dos IDs)
  getNomesDeClasses: (ids) => {
    if (!Array.isArray(ids)) return [];
    
    const { classesPorId } = get();
    return ids
      .map(id => classesPorId[id]?.nome)
      .filter(Boolean); // Remove nulls/undefined
  },

  // Usado por: Views que precisam converter nomes para IDs
  getIdsDeClasses: (nomes) => {
    if (!Array.isArray(nomes)) return [];
    
    const { classesPorNome } = get();
    return nomes
      .map(nome => {
        const nomeNormalizado = nome.toLowerCase().trim();
        return classesPorNome[nomeNormalizado]?.id;
      })
      .filter(id => id !== undefined); // Remove undefined
  },

  // ===== FUNÇÕES UTILITÁRIAS =====
  
  // Usado por: Views que precisam verificar se uma classe existe
  classeExists: (idOrNome) => {
    const { classesPorId, classesPorNome } = get();
    
    // Se é número, busca por ID
    if (typeof idOrNome === 'number' || !isNaN(idOrNome)) {
      return !!classesPorId[idOrNome];
    }
    
    // Se é string, busca por nome
    const nomeNormalizado = idOrNome.toLowerCase().trim();
    return !!classesPorNome[nomeNormalizado];
  },

  // Usado por: PersonagemViewModel - para mapear classes do personagem
  mapearClasseDePersonagem: (personagem) => {
    if (!personagem || !personagem.classe_id) return null;
    
    const { classesPorId } = get();
    return classesPorId[personagem.classe_id] || null;
  },

  // ===== INICIALIZAÇÃO AUTOMÁTICA =====
  // Usado por: App.jsx ou onde for necessário
  inicializar: async () => {
    const { classesCarregadas } = get();
    
    if (!classesCarregadas) {
      await get().carregarClasses();
    }
  },

  // ===== RESET E RECARGA =====
  
  // Usado por: Em caso de erro ou necessidade de recarga
  recarregarClasses: async () => {
    return await get().carregarClasses(true);
  },

  // Reset completo do estado
  resetClasseState: async () => {
    const { default: states } = await import('./states.js');
    set(states);
  },

  // ===== GETTERS ESPECÍFICOS PARA VIEWMODELS =====
  
  // Usado por: NovoPersonagemViewModel - lista de classes para seleção
  getClassesParaSelecao: () => {
    const { classes } = get();
    return classes.map(classe => ({
      id: classe.id,
      nome: classe.nome,
      descricao: classe.descricao || '',
      nivel_inicial: classe.nivel_inicial || 1
    }));
  },

  // Usado por: PersonagemViewModel - para filtros
  getClassesParaFiltro: () => {
    const { classes } = get();
    return [
      { id: null, nome: 'Todas as classes' },
      ...classes.map(classe => ({
        id: classe.id,
        nome: classe.nome
      }))
    ];
  },

  // ===== PAGINAÇÃO (FUTURO) =====
  
  // Usado por: Se precisar carregar mais classes
  carregarMaisClasses: async () => {
    const { hasMore, offset, limit, loading } = get();
    
    if (!hasMore || loading) {
      return;
    }
    
    set({ loading: true });
    
    try {
      const { classeService } = await import('../../services/index.js');
      
      // Carregar próxima página
      const response = await classeService.getAll({ 
        limit, 
        offset: offset + limit 
      });
      
      const novasClasses = response.data || response;
      const todasClasses = [...get().classes, ...novasClasses];
      
      // Processar dados combinados
      get().processarClasses(
        todasClasses, 
        response.total || todasClasses.length,
        response.offset || (offset + limit),
        response.limit || limit
      );
      
    } catch (error) {
      console.error('❌ ClasseStore: Erro ao carregar mais classes:', error);
      set({ 
        error: error.message,
        loading: false 
      });
      throw error;
    }
  }
}); 