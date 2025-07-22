/**
 * 🎨 TEMA STATES - Estados iniciais dos temas
 * 
 * Contém todos os estados iniciais dos temas (dados estáticos):
 * - Lista de temas carregados do backend
 * - Status de carregamento
 * - Cache de temas por ID e nome
 * - Controle de inicialização
 */

export const temaInitialStates = {
  // ===== DADOS DOS TEMAS =====
  temas: [], // Array de temas do backend
  temasCarregados: false, // Se já foram carregados uma vez
  
  // ===== CACHE OTIMIZADO =====
  temasPorId: {}, // Map para acesso rápido por ID { 1: tema, 2: tema }
  temasPorNome: {}, // Map para acesso rápido por nome { "Fantasia": tema }
  
  // ===== STATUS DE CARREGAMENTO =====
  loading: false,
  error: null,
  lastLoadTime: null, // Quando foi carregado pela última vez
  
  // ===== FILTROS E ESTADOS DERIVADOS =====
  temasAtivos: [], // Todos os temas (API não tem propriedade 'ativo')
  totalTemas: 0, // Contador total
};

export default temaInitialStates; 