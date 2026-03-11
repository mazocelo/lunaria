/**
 * ConcentrationManager - Gerencia concentração de magias por jogador
 *
 * Regra: máximo 1 magia de concentração ativa por vez.
 * Se conjurar outra, a anterior é automaticamente quebrada.
 *
 * Armazena em sessao.estadoJogo.concentracao[userId] = { magia_id, nome, turnos_restantes } | null
 */

/**
 * Inicializa estrutura de concentração se não existir
 */
function ensureConcentracao(sessao) {
  if (!sessao.estadoJogo) sessao.estadoJogo = {};
  if (!sessao.estadoJogo.concentracao) sessao.estadoJogo.concentracao = {};
}

/**
 * Define concentração ativa para um jogador
 * Se já houver concentração ativa, retorna a magia que foi quebrada
 * @returns {{ quebrada: Object|null }} - A magia que foi quebrada, ou null
 */
export function setConcentracao(sessao, userId, magia) {
  ensureConcentracao(sessao);
  const uid = String(userId);
  const anterior = sessao.estadoJogo.concentracao[uid] || null;

  sessao.estadoJogo.concentracao[uid] = {
    magia_id: magia.id,
    nome: magia.nome,
    turnos_restantes: magia.duracao || 10
  };

  return { quebrada: anterior };
}

/**
 * Retorna concentração ativa do jogador
 * @returns {Object|null} { magia_id, nome, turnos_restantes }
 */
export function getConcentracao(sessao, userId) {
  ensureConcentracao(sessao);
  return sessao.estadoJogo.concentracao[String(userId)] || null;
}

/**
 * Quebra concentração ativa do jogador
 * @returns {Object|null} - A magia que foi quebrada, ou null se não havia
 */
export function quebrarConcentracao(sessao, userId, motivo = 'manual') {
  ensureConcentracao(sessao);
  const uid = String(userId);
  const ativa = sessao.estadoJogo.concentracao[uid] || null;
  sessao.estadoJogo.concentracao[uid] = null;

  if (ativa) {
    console.log(`🔮 Concentração quebrada: ${ativa.nome} (${motivo}) — jogador ${uid}`);
  }
  return ativa;
}

/**
 * Verifica se jogador precisa fazer teste de concentração após receber dano
 * DC = 10 ou metade do dano (o que for maior)
 * @returns {{ precisaTestar: boolean, dc: number, atributo: string }}
 */
export function checkDanoConcentracao(sessao, userId, danoRecebido) {
  const conc = getConcentracao(sessao, userId);
  if (!conc) return { precisaTestar: false, dc: 0, atributo: '' };

  const dc = Math.max(10, Math.floor(danoRecebido / 2));
  return { precisaTestar: true, dc, atributo: 'constituicao' };
}

/**
 * Decrementa turnos de concentração. Se chegar a 0, quebra automaticamente.
 * @returns {Object|null} - A magia quebrada se expirou, ou null
 */
export function decrementConcentracao(sessao, userId) {
  ensureConcentracao(sessao);
  const uid = String(userId);
  const conc = sessao.estadoJogo.concentracao[uid];
  if (!conc) return null;

  conc.turnos_restantes--;
  if (conc.turnos_restantes <= 0) {
    sessao.estadoJogo.concentracao[uid] = null;
    console.log(`🔮 Concentração expirou: ${conc.nome} — jogador ${uid}`);
    return conc;
  }
  return null;
}

export default {
  setConcentracao, getConcentracao, quebrarConcentracao,
  checkDanoConcentracao, decrementConcentracao
};
