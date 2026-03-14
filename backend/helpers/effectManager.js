/**
 * EffectManager - Gerencia efeitos temporários em personagens
 *
 * Efeitos são armazenados em personagem.status_efeitos[] e/ou
 * sessao.estadoJogo.personagemSessao[userId].status_efeitos[]
 *
 * Cada efeito: { nome, duracao, tipo?, dano_por_turno?, cura_por_turno?, aplicado_em }
 */
import logger from './logger.js';
const log = logger.child({ module: 'effectManager' });

/**
 * Aplica um efeito ao alvo (personagem na sessão)
 * Se já existir efeito com mesmo nome, renova duração
 */
export function aplicarEfeito(sessao, alvoId, efeito) {
  const personagem = findPersonagem(sessao, alvoId);
  if (!personagem) return false;

  if (!personagem.status_efeitos) personagem.status_efeitos = [];

  const existente = personagem.status_efeitos.find(e => e.nome === efeito.nome);
  if (existente) {
    existente.duracao = efeito.duracao || 3;
    existente.aplicado_em = Date.now();
    if (efeito.dano_por_turno != null) existente.dano_por_turno = efeito.dano_por_turno;
    if (efeito.cura_por_turno != null) existente.cura_por_turno = efeito.cura_por_turno;
  } else {
    personagem.status_efeitos.push({
      nome: efeito.nome,
      duracao: efeito.duracao || 3,
      tipo: efeito.tipo || null,
      dano_por_turno: efeito.dano_por_turno || null,
      cura_por_turno: efeito.cura_por_turno || null,
      aplicado_em: Date.now()
    });
  }

  log.info({ efeito: efeito.nome, alvoId, duracao: efeito.duracao || 3 }, 'Efeito aplicado');
  return true;
}

/**
 * Remove um efeito específico do alvo
 */
export function removerEfeito(sessao, alvoId, nomeEfeito) {
  const personagem = findPersonagem(sessao, alvoId);
  if (!personagem?.status_efeitos) return false;

  const idx = personagem.status_efeitos.findIndex(e => e.nome === nomeEfeito);
  if (idx === -1) return false;

  personagem.status_efeitos.splice(idx, 1);
  log.info({ efeito: nomeEfeito, alvoId }, 'Efeito removido');
  return true;
}

/**
 * Decrementa duração de todos os efeitos do alvo
 * Remove efeitos que expiraram
 * @returns {Array} efeitos que expiraram neste turno
 */
export function decrementEfeitos(sessao, alvoId) {
  const personagem = findPersonagem(sessao, alvoId);
  if (!personagem?.status_efeitos) return [];

  const expirados = [];
  personagem.status_efeitos = personagem.status_efeitos.filter(e => {
    e.duracao--;
    if (e.duracao <= 0) {
      expirados.push(e);
      return false;
    }
    return true;
  });

  if (expirados.length > 0) {
    log.info({ alvoId, efeitos: expirados.map(e => e.nome) }, 'Efeitos expirados');
  }
  return expirados;
}

/**
 * Aplica efeitos por turno (dano de queimando, cura de regenerando, etc.)
 * @returns {Array<{ nome, tipo, valor }>} lista de efeitos aplicados
 */
export function aplicarEfeitosPorTurno(sessao, alvoId) {
  const personagem = findPersonagem(sessao, alvoId);
  if (!personagem?.status_efeitos) return [];

  const resultados = [];
  for (const efeito of personagem.status_efeitos) {
    if (efeito.dano_por_turno && efeito.dano_por_turno > 0) {
      resultados.push({ nome: efeito.nome, tipo: 'dano', valor: efeito.dano_por_turno });
    }
    if (efeito.cura_por_turno && efeito.cura_por_turno > 0) {
      resultados.push({ nome: efeito.nome, tipo: 'cura', valor: efeito.cura_por_turno });
    }
  }
  return resultados;
}

/**
 * Retorna efeitos ativos do alvo
 */
export function getEfeitosAtivos(sessao, alvoId) {
  const personagem = findPersonagem(sessao, alvoId);
  return personagem?.status_efeitos || [];
}

/**
 * Busca personagem na sessão pelo ID (string ou number)
 */
function findPersonagem(sessao, alvoId) {
  const completos = sessao.personagensCompletos || {};
  return completos[String(alvoId)] || null;
}

export default {
  aplicarEfeito, removerEfeito, decrementEfeitos,
  aplicarEfeitosPorTurno, getEfeitosAtivos
};
