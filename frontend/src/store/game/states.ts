/**
 * GAME STATES - Estados iniciais da sessao de jogo
 *
 * Contem todos os estados iniciais do jogo:
 * - Etapas e navegacao
 * - Historia e dados relacionados
 * - Personagens da historia e selecionado
 * - Sessao e participantes da aventura
 * - Status do jogo ativo
 * - Dados do chat RPG
 */

export type GameHistoria = {
  id?: number | string;
  [key: string]: unknown;
};

export type GamePersonagem = {
  id?: number | string;
  [key: string]: unknown;
};

export type GameParticipante = {
  id?: number | string;
  userId?: number | string;
  status?: string;
  [key: string]: unknown;
};

export type GameMensagem = {
  id?: number | string;
  [key: string]: unknown;
};

export type GameState = {
  historiaAtual: GameHistoria | null;
  loading: boolean;
  error: string | null;
  personagensDaHistoria: GamePersonagem[];
  personagemSelecionado: GamePersonagem | null;
  loadingPersonagens: boolean;
  errorPersonagens: string | null;
  buscaPersonagem: string;
  sessaoId: number | string | null;
  participantes: GameParticipante[];
  isDonoSala: boolean;
  salaAberta: boolean;
  podeIniciarJogo: boolean;
  mensagens: GameMensagem[];
  statusPersonagem: Record<string, unknown>;
};

export const gameInitialStates: GameState = {
  historiaAtual: null,
  loading: false,
  error: null,
  personagensDaHistoria: [],
  personagemSelecionado: null,
  loadingPersonagens: false,
  errorPersonagens: null,
  buscaPersonagem: '',
  sessaoId: null,
  participantes: [],
  isDonoSala: false,
  salaAberta: false,
  podeIniciarJogo: false,
  mensagens: [],
  statusPersonagem: {},
};

export default gameInitialStates;
