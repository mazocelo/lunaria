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
  // 3D&T
  conceito: 'Descreva o conceito do seu personagem em uma frase. Quem ele e?',
  caracteristicas: 'Distribua seus pontos entre as caracteristicas: Forca, Habilidade, Resistencia, Armadura e Poder de Fogo.',
  magias: 'Selecione as magias do seu personagem.',
  // D&D 5e
  skills: 'Escolha suas skill proficiencies entre as opcoes disponiveis para sua classe.',
  spells: 'Selecione seus cantrips e magias conhecidas.',
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

// D&D 5e Standard Array (15, 14, 13, 12, 10, 8) distribuido por classe
const DND5E_DISTRIBUICOES = {
  barbarian:  { forca: 15, destreza: 13, constituicao: 14, inteligencia: 8, sabedoria: 10, carisma: 12 },
  bard:       { forca: 8, destreza: 14, constituicao: 12, inteligencia: 10, sabedoria: 13, carisma: 15 },
  cleric:     { forca: 14, destreza: 10, constituicao: 13, inteligencia: 8, sabedoria: 15, carisma: 12 },
  druid:      { forca: 8, destreza: 12, constituicao: 14, inteligencia: 10, sabedoria: 15, carisma: 13 },
  fighter:    { forca: 15, destreza: 13, constituicao: 14, inteligencia: 8, sabedoria: 12, carisma: 10 },
  monk:       { forca: 10, destreza: 15, constituicao: 13, inteligencia: 8, sabedoria: 14, carisma: 12 },
  paladin:    { forca: 15, destreza: 10, constituicao: 13, inteligencia: 8, sabedoria: 12, carisma: 14 },
  ranger:     { forca: 12, destreza: 15, constituicao: 13, inteligencia: 8, sabedoria: 14, carisma: 10 },
  rogue:      { forca: 8, destreza: 15, constituicao: 13, inteligencia: 14, sabedoria: 10, carisma: 12 },
  sorcerer:   { forca: 8, destreza: 13, constituicao: 14, inteligencia: 10, sabedoria: 12, carisma: 15 },
  warlock:    { forca: 8, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, carisma: 15 },
  wizard:     { forca: 8, destreza: 13, constituicao: 14, inteligencia: 15, sabedoria: 12, carisma: 10 },
};

const DND5E_DISTRIBUICAO_PADRAO = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 12, sabedoria: 10, carisma: 8 };

/**
 * Gera distribuicao de atributos fallback baseada na classe.
 * Suporta Lunaria (soma 60) e D&D 5e (Standard Array).
 */
export function gerarAtributosFallback(estado, sistema) {
  const classeNome = (estado.classe_nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (sistema === 'dnd5e') {
    const dist = Object.entries(DND5E_DISTRIBUICOES).find(([k]) => classeNome.includes(k));
    return dist ? dist[1] : { ...DND5E_DISTRIBUICAO_PADRAO };
  }

  const dist = Object.entries(DISTRIBUICOES).find(([k]) => classeNome.includes(k));
  return dist ? dist[1] : { ...DISTRIBUICAO_PADRAO };
}
