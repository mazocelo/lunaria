/**
 * 🧬 RAÇA STATES - Estados iniciais das raças
 * 
 * Contém todos os estados iniciais das raças (dados estáticos):
 * - Lista de raças carregadas do backend
 * - Status de carregamento
 * - Cache de raças por ID e nome
 * - Controle de inicialização e paginação
 */

export const racaInitialStates = {
  // ===== DADOS DAS RAÇAS =====
  racas: [], // Array de raças do backend
  racasCarregadas: false, // Se já foram carregados uma vez
  
  // ===== CACHE OTIMIZADO =====
  racasPorId: {}, // Map para acesso rápido por ID { 1: raca, 2: raca }
  racasPorNome: {}, // Map para acesso rápido por nome { "humano": raca }
  
  // ===== STATUS DE CARREGAMENTO =====
  loading: false,
  error: null,
  lastLoadTime: null, // Quando foi carregado pela última vez
  sistemaCarregado: null, // Sistema das raças em cache (null = default/lunaria)
  
  // ===== PAGINAÇÃO E METADADOS =====
  total: 0, // Total de raças no backend
  offset: 0, // Offset atual
  limit: 50, // Limite padrão da API
  hasMore: false, // Se há mais dados para carregar
  
  // ===== FILTROS E ESTADOS DERIVADOS =====
  totalRacas: 0, // Contador local
};

export default racaInitialStates; 