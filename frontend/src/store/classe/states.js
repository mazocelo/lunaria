/**
 * 🏛️ CLASSE STATES - Estados iniciais das classes
 * 
 * Contém todos os estados iniciais das classes (dados estáticos):
 * - Lista de classes carregadas do backend
 * - Status de carregamento
 * - Cache de classes por ID e nome
 * - Controle de inicialização e paginação
 */

export const classeInitialStates = {
  // ===== DADOS DAS CLASSES =====
  classes: [], // Array de classes do backend
  classesCarregadas: false, // Se já foram carregados uma vez
  
  // ===== CACHE OTIMIZADO =====
  classesPorId: {}, // Map para acesso rápido por ID { 1: classe, 2: classe }
  classesPorNome: {}, // Map para acesso rápido por nome { "guerreiro": classe }
  
  // ===== STATUS DE CARREGAMENTO =====
  loading: false,
  error: null,
  lastLoadTime: null, // Quando foi carregado pela última vez
  sistemaCarregado: null, // Sistema das classes em cache (null = default/lunaria)
  
  // ===== PAGINAÇÃO E METADADOS =====
  total: 0, // Total de classes no backend
  offset: 0, // Offset atual
  limit: 50, // Limite padrão da API
  hasMore: false, // Se há mais dados para carregar
  
  // ===== FILTROS E ESTADOS DERIVADOS =====
  totalClasses: 0, // Contador local
};

export default classeInitialStates; 