/**
 * 🌟 VANTAGEM STATES - Estados iniciais das vantagens
 * 
 * Estados globais para vantagens e desvantagens:
 * - Cache único de todas as vantagens/desvantagens
 * - Maps otimizados para acesso O(1)
 * - Estados de loading e erro
 * - Suporte a paginação da API
 * - Separação entre vantagens (custo > 0) e desvantagens (custo < 0)
 */

export const vantagemInitialStates = {
  // ===== DADOS PRINCIPAIS =====
  vantagens: [],                    // Array de todas as vantagens/desvantagens
  vantagensCarregadas: false,       // Flag se dados foram carregados

  // ===== MAPS OTIMIZADOS (O(1) access) =====
  vantagensPorId: new Map(),        // Map { id: vantagem }
  vantagensPorNome: new Map(),      // Map { nome: vantagem }

  // ===== ESTADOS DE CARREGAMENTO =====
  loading: false,                   // Estado de loading
  error: null,                      // Mensagem de erro

  // ===== CACHE METADATA =====
  lastLoadTime: null,               // Timestamp do último carregamento
  
  // ===== DADOS DA API (PAGINAÇÃO) =====
  total: 0,                         // Total de vantagens no backend
  offset: 0,                        // Offset atual
  limit: 50,                        // Limite por página
  hasMore: false,                   // Se há mais dados para carregar

  // ===== FILTROS E SEPARAÇÕES =====
  vantagensPositivas: [],           // Apenas vantagens (custo > 0)
  vantagensNegativas: [],           // Apenas desvantagens (custo < 0) 
  vantagensNeutras: [],             // Vantagens neutras (custo = 0)
  totalVantagens: 0,                // Total de vantagens positivas
  totalDesvantagens: 0,             // Total de desvantagens
}; 