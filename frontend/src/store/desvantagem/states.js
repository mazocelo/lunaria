/**
 * 🔻 DESVANTAGEM STATES - Estados iniciais das desvantagens
 * 
 * Estados globais para desvantagens do sistema:
 * - Cache único de todas as desvantagens
 * - Maps otimizados para acesso O(1)
 * - Estados de loading e erro
 * - Suporte a paginação da API
 * - Foco exclusivo em desvantagens (custo < 0)
 */

export const desvantagemInitialStates = {
  // ===== DADOS PRINCIPAIS =====
  desvantagens: [],                 // Array de todas as desvantagens
  desvantagensCarregadas: false,    // Flag se dados foram carregados

  // ===== MAPS OTIMIZADOS (O(1) access) =====
  desvantagensPorId: new Map(),     // Map { id: desvantagem }
  desvantagensPorNome: new Map(),   // Map { nome: desvantagem }

  // ===== ESTADOS DE CARREGAMENTO =====
  loading: false,                   // Estado de loading
  error: null,                      // Mensagem de erro

  // ===== CACHE METADATA =====
  lastLoadTime: null,               // Timestamp do último carregamento
  
  // ===== DADOS DA API (PAGINAÇÃO) =====
  total: 0,                         // Total de desvantagens no backend
  offset: 0,                        // Offset atual
  limit: 50,                        // Limite por página
  hasMore: false,                   // Se há mais dados para carregar

  // ===== ESTATÍSTICAS E FILTROS =====
  desvantagensAtivas: [],           // Apenas desvantagens ativas
  desvantagensPorNivel: new Map(),  // Map { nivel: [desvantagens] }
  desvantagensPorTipo: new Map(),   // Map { tipo: [desvantagens] }
  totalDesvantagens: 0,             // Contador total
  nivelMaisComum: null,             // Nível com mais desvantagens
  tipoMaisComum: null,              // Tipo com mais desvantagens
}; 