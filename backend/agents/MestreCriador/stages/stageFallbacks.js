/**
 * stageFallbacks.js — Mensagens e sugestoes fallback por etapa
 *
 * Extraido de MestreCriadorAgent.js para centralizar.
 */

export const FALLBACK_MENSAGENS = {
  boas_vindas: 'Bem-vindo, aventureiro! Como deseja ser chamado neste mundo?',
  raca: 'Agora, qual sera sua raca? Escolha entre as opcoes disponiveis.',
  classe: 'E qual sera sua vocacao? Escolha uma classe que combine com seu espirito.',
  background: 'Descreva a origem do personagem. Essa direcao sera lapidada em um background final.',
  desvantagens: 'Todo heroi tem suas fraquezas. Quais sao as suas? Desvantagens devolvem pontos de criacao.',
  vantagens: 'Quais talentos especiais marcam sua jornada? Escolha suas vantagens.',
  atributos: 'Distribua seus 60 pontos entre os atributos (min 5, max 16 cada).',
  equipamentos: 'O arsenal esta sendo preparado com base na sua build.',
  resumo: 'Seu personagem esta quase pronto. Revise os detalhes.',
  refinamento: 'Deseja ajustar algo antes de finalizar?',
};

export function getFallbackMessage(etapa) {
  return FALLBACK_MENSAGENS[etapa] || 'Ocorreu um erro. Tente novamente.';
}

// Distribuicoes tematicas por classe (soma = 60, min 5, max 16)
const DISTRIBUICOES = {
  guerreiro:   { forca: 14, destreza: 10, constituicao: 13, inteligencia: 7, agilidade: 9, carisma: 7 },
  mago:        { forca: 6, destreza: 8, constituicao: 8, inteligencia: 16, agilidade: 10, carisma: 12 },
  ladino:      { forca: 8, destreza: 14, constituicao: 8, inteligencia: 10, agilidade: 14, carisma: 6 },
  clerigo:     { forca: 10, destreza: 8, constituicao: 12, inteligencia: 12, agilidade: 8, carisma: 10 },
  ranger:      { forca: 10, destreza: 13, constituicao: 10, inteligencia: 8, agilidade: 13, carisma: 6 },
  bardo:       { forca: 6, destreza: 10, constituicao: 8, inteligencia: 12, agilidade: 10, carisma: 14 },
  paladino:    { forca: 13, destreza: 8, constituicao: 12, inteligencia: 8, agilidade: 8, carisma: 11 },
  druida:      { forca: 8, destreza: 10, constituicao: 10, inteligencia: 14, agilidade: 10, carisma: 8 },
  barbaro:     { forca: 16, destreza: 8, constituicao: 14, inteligencia: 5, agilidade: 10, carisma: 7 },
  monge:       { forca: 10, destreza: 12, constituicao: 10, inteligencia: 8, agilidade: 14, carisma: 6 },
  feiticeiro:  { forca: 6, destreza: 10, constituicao: 8, inteligencia: 14, agilidade: 8, carisma: 14 },
  bruxo:       { forca: 7, destreza: 8, constituicao: 10, inteligencia: 13, agilidade: 8, carisma: 14 },
};

const DISTRIBUICAO_PADRAO = { forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, agilidade: 10, carisma: 10 };

/**
 * Gera distribuicao de atributos fallback baseada na classe.
 */
export function gerarAtributosFallback(estado) {
  const classeNome = (estado.classe_nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const dist = Object.entries(DISTRIBUICOES).find(([k]) => classeNome.includes(k));
  return dist ? dist[1] : { ...DISTRIBUICAO_PADRAO };
}
