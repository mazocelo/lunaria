/**
 * 3D&T Alpha — contrato de magias (passo 3.3, §5 da spec do modelo híbrido H&M).
 *
 * 3D&T conjura por Focus elemental + custo em PM. NÃO tem slots e NÃO tem níveis
 * de magia vancianos: getSlotsInfo retorna usaSlots: false / recurso: 'pm'.
 * A limitação real de uso é o PM disponível, validada na combatEngine (parseCustoPM).
 *
 * Catálogo próprio (magias_tresdet); vínculo do personagem em personagem_magia_tresdet.
 * Recebe `db` (acessor de Models); funções async pois consultam o banco.
 */

/** Focus atuais do personagem 3D&T — vivem em stats_sistema.focus. */
function getFocus(personagem) {
  const focus = personagem?.stats_sistema?.focus;
  return focus && typeof focus === 'object' ? focus : {};
}

/**
 * Verifica se o personagem satisfaz o focus_requisito de uma magia.
 * focus_requisito é um array de objetos { elemento: minimo } com AND entre itens.
 */
function focusSatisfeito(magia, focus) {
  const requisito = magia?.focus_requisito;
  if (!Array.isArray(requisito) || requisito.length === 0) return true;
  return requisito.every((req) => {
    const elemento = Object.keys(req)[0];
    if (!elemento) return true;
    return (focus[elemento] || 0) >= req[elemento];
  });
}

function toMagiaConhecida(magia, origem) {
  return {
    id: magia.id,
    fonte: 'magias_tresdet',
    nome: magia.nome,
    tipo: 'magia',
    escola: magia.escola || null,
    custo: magia.custo_pm,
    origem: origem || 'criacao',
    // 3D&T não tem mecânica de concentração — magias_tresdet não possui a coluna.
    usa_concentracao: false,
    upgradeAtivo: null,
  };
}

/**
 * Magias que o personagem 3D&T já possui. Lê personagem_magia_tresdet.
 * @param {Object} personagem
 * @param {Object} db — acessor de Models
 * @returns {Promise<import('../interface.js').MagiaConhecida[]>}
 */
export async function getMagiasConhecidas(personagem, db) {
  if (!personagem?.id) return [];

  const vinculos = await db.Personagem.listarMagiasTresDet(personagem.id);
  return vinculos
    .filter((v) => v.magias_tresdet)
    .map((v) => toMagiaConhecida(v.magias_tresdet, v.origem));
}

/**
 * Catálogo de 3D&T que o personagem PODE aprender: magias_tresdet cujo
 * focus_requisito é satisfeito pelos Focus atuais, filtrado por nivel_minimo,
 * excluindo o já conhecido. Sem classe/raça.
 * @param {Object} personagem
 * @param {Object} db — acessor de Models
 * @returns {Promise<import('../interface.js').MagiaConhecida[]>}
 */
export async function getMagiasDisponiveis(personagem, db) {
  if (!personagem?.id) return [];
  const nivel = personagem.nivel || 1;
  const focus = getFocus(personagem);

  const [catalogo, conhecidas] = await Promise.all([
    db.MagiasTresDet.buscarTodos(),
    db.Personagem.listarMagiasTresDet(personagem.id),
  ]);

  const idsConhecidos = new Set(conhecidas.map((v) => v.magia_tresdet_id));

  return catalogo
    .filter((m) => !idsConhecidos.has(m.id))
    .filter((m) => (m.nivel_minimo || 1) <= nivel)
    .filter((m) => focusSatisfeito(m, focus))
    .map((m) => toMagiaConhecida(m, 'criacao'));
}

/**
 * Capacidade de magia. 3D&T NÃO usa slots — conjura só por PM.
 * @param {Object} _personagem
 * @param {Object} _db
 * @returns {Promise<import('../interface.js').SlotsInfo>}
 */
export async function getSlotsInfo(_personagem, _db) {
  return {
    usaSlots: false,
    total: 0,
    usados: 0,
    livres: 0,
    recurso: 'pm',
  };
}
