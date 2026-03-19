/**
 * Flash Lite intent classifier — Camada 2 do intent pipeline.
 * Classifica ação de combate via LLM quando regex falha.
 * Valida retorno contra lista real de habilidades/magias do personagem.
 */
import logger from './logger.js';

const log = logger.child({ module: 'intentClassifier' });

const TIPOS_VALIDOS = ['atacar', 'defender', 'fugir', 'usar_habilidade', 'conjurar_magia'];

/**
 * Validate raw JSON string from LLM against character's actual abilities.
 * @param {string|null} raw - Raw JSON string from LLM
 * @param {Object} personagem - Character with habilidades/magias arrays
 * @param {Object} combate - Combat state with monstros array
 * @returns {{ tipo, habilidadeId?, magiaId?, alvoId?, source } | null}
 */
export function validarIntentLLM(raw, personagem, combate) {
  if (!raw) return null;

  let parsed;
  try {
    parsed = JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw));
  } catch {
    log.debug({ raw }, 'intentClassifier: JSON parse failed');
    return null;
  }

  const tipo = parsed.tipo;
  if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
    log.debug({ tipo }, 'intentClassifier: tipo inválido');
    return null;
  }

  const result = { tipo, source: 'flash_lite' };

  const id = parsed.id || null;
  if (tipo === 'usar_habilidade' || tipo === 'conjurar_magia') {
    if (!id) return null;
    const habilidades = personagem?.habilidades || [];
    const magias = personagem?.magias || [];

    if (tipo === 'conjurar_magia') {
      const magia = magias.find(m => m.id === id) || magias.find(m => m.nome?.toLowerCase() === id?.toLowerCase());
      if (!magia) return null;
      result.magiaId = magia.id;
      result.magiaNome = magia.nome;
    } else {
      const hab = habilidades.find(h => h.id === id) || habilidades.find(h => h.nome?.toLowerCase() === id?.toLowerCase());
      if (!hab) return null;
      result.habilidadeId = hab.id;
      result.habilidadeNome = hab.nome;
    }
  }

  const monstrosVivos = (combate?.monstros || []).filter(m => m.status === 'vivo');
  const alvo = parsed.alvo || null;
  if (alvo && monstrosVivos.find(m => m.id === alvo)) {
    result.alvoId = alvo;
  } else if (monstrosVivos.length > 0 && tipo !== 'defender' && tipo !== 'fugir') {
    result.alvoId = monstrosVivos[0].id;
  }

  return result;
}

/**
 * Build the classifier prompt from player message + character abilities + combat state.
 * @param {string} mensagem - Player's message text
 * @param {Object} personagem - Character with habilidades/magias
 * @param {Object} combate - Combat state with monstros
 * @param {string[]} [candidates=[]] - Ambiguous candidates from Camada 1
 * @returns {string}
 */
export function buildClassifierPrompt(mensagem, personagem, combate, candidates = []) {
  const habilidades = personagem?.habilidades || [];
  const magias = personagem?.magias || [];
  const monstrosVivos = (combate?.monstros || []).filter(m => m.status === 'vivo');

  const acoes = [
    ...habilidades.map(h => `- ${h.nome} (id: ${h.id}, habilidade)`),
    ...magias.map(m => `- ${m.nome} (id: ${m.id}, magia)`),
  ].join('\n');

  const monstros = monstrosVivos.map(m => `- ${m.nome} (id: ${m.id})`).join('\n');

  const candidateHint = candidates.length > 0
    ? `\nCandidatos ambíguos (escolha o mais provável):\n${candidates.map(c => `- ${c}`).join('\n')}\n`
    : '';

  return `Classifique a ação de combate do jogador.

Habilidades disponíveis:
${acoes || '(nenhuma)'}

Monstros vivos:
${monstros || '(nenhum)'}
${candidateHint}Tipos válidos: atacar, defender, fugir, usar_habilidade, conjurar_magia

Ação do jogador: "${mensagem}"

Responda APENAS JSON, sem markdown:
{"tipo":"...","id":"...","alvo":"..."}`;
}
