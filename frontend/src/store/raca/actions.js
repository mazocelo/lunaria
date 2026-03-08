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
import { racaService } from '../../services/index.js';

export const createRacaActions = (set, get) => ({

  // ===== CARREGAMENTO ÚNICO DAS RAÇAS =====
  // Usado por: Views e ViewModels que precisam das raças
  carregarRacas: async (forceReload = false) => {
    const { racasCarregadas, loading } = get();
    
    // Se já foram carregados ou está carregando, não faz nada (exceto se forçar)
    if ((racasCarregadas || loading) && !forceReload) {
      return get().racas;
    }

    set({ loading: true, error: null });

    try {
      // Importar o service dinamicamente
      
      // Buscar raças do backend (carregar todas de uma vez)
      const response = await racaService.getAll();
      // A API retorna { success, data, pagination: { total, limit, offset, hasMore } }
      const racasData = response.data || [];
      const total = response.pagination?.total ?? racasData.length;
      const offset = response.pagination?.offset ?? 0;
      const limit = response.pagination?.limit ?? 50;

      // Processar e cachear os dados
      get().processarRacas(racasData, total, offset, limit);

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
      await get().carregarRacas();
    }
  },

  // ===== RESET E RECARGA =====
  
  // Usado por: Em caso de erro ou necessidade de recarga
  recarregarRacas: async () => {
    return await get().carregarRacas(true);
  },

  // Reset completo do estado
  resetRacaState: () => {
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
      return;
    }
    
    set({ loading: true });
    
    try {
      
      // Carregar próxima página
      const { data } = await racaService.getAll({ 
        limit, 
        offset: offset + limit 
      });
      
      const novasRacas = data;
      const todasRacas = [...get().racas, ...novasRacas];
      
      // Processar dados combinados
      get().processarRacas(
        todasRacas, 
        data.total || todasRacas.length,
        data.offset || (offset + limit),
        data.limit || limit
      );
      
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