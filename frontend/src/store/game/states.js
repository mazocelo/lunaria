/**
 * 🎮 GAME STATES - Estados iniciais da sessão de jogo
 * 
 * Contém todos os estados iniciais do jogo:
 * - Etapas e navegação
 * - História e dados relacionados
 * - Personagens da história e selecionado
 * - Sessão e participantes da aventura
 * - Status do jogo ativo
 * - Dados do chat RPG
 */

export const gameInitialStates = {
  // ===== HISTÓRIA =====
  historiaAtual: null,
  loading: false,
  error: null, // Erros específicos do jogo (história, personagens, etc.)
  
  // ===== PERSONAGENS =====
  personagensDaHistoria: [],
  personagemSelecionado: null,
  loadingPersonagens: false,
  errorPersonagens: null,
  buscaPersonagem: '',
  
  // ===== SESSÃO E PARTICIPANTES =====
  sessaoId: null, // ID da sessão de jogo (pode ser diferente do roomId do socket)
  participantes: [], // Jogadores confirmados na aventura (com personagens selecionados)
  isDonoSala: false,
  salaAberta: false,
  podeIniciarJogo: false,
  
  // ===== DADOS DO JOGO ATIVO =====
  mensagens: [], // Mensagens do chat RPG
  statusPersonagem: {}, // Status atual do personagem (HP, MP, etc.)
};

export default gameInitialStates; 