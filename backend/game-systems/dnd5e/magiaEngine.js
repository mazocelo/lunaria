/**
 * D&D 5e — contrato de magias (passo 3.3, §5 da spec do modelo híbrido H&M).
 *
 * MVP: o D&D 5e entrega apenas magias "conhecidas" (hm_personagem). Sem preparação
 * diária e sem slots vancianos — getSlotsInfo retorna usaSlots: false.
 *
 * Recebe `db` (acessor de Models) como segundo parâmetro; funções async pois
 * consultam o banco.
 */

const SISTEMA = 'dnd5e';

/** escola_magia ∉ {null,'nenhuma'} ⇒ magia; senão ⇒ técnica. */
function classificarTipo(habilidade) {
  const escola = habilidade?.escola_magia;
  return escola && escola !== 'nenhuma' ? 'magia' : 'tecnica';
}

function toMagiaConhecida(habilidade, origem) {
  return {
    id: habilidade.id,
    fonte: 'habilidades_magias',
    nome: habilidade.nome,
    tipo: classificarTipo(habilidade),
    escola: habilidade.escola_magia || null,
    custo: habilidade.custo_mana ?? 0,
    origem: origem || 'criacao',
    upgradeAtivo: null,
  };
}

/**
 * Magias/técnicas que o personagem D&D já possui. Lê hm_personagem (sistema=dnd5e).
 * @param {Object} personagem
 * @param {Object} db — acessor de Models
 * @returns {Promise<import('../interface.js').MagiaConhecida[]>}
 */
export async function getMagiasConhecidas(personagem, db) {
  if (!personagem?.id) return [];

  const vinculos = await db.HmPersonagem.findByPersonagem(personagem.id);
  return vinculos
    .filter((v) => v.habilidades_magias && v.habilidades_magias.sistema === SISTEMA)
    .map((v) => toMagiaConhecida(v.habilidades_magias, v.origem));
}

/**
 * Catálogo D&D que o personagem PODE aprender: hm_classe ∪ hm_raca, filtrado por
 * nível, excluindo o já conhecido. Sem escolas_extra (fora do MVP).
 * @param {Object} personagem
 * @param {Object} db — acessor de Models
 * @returns {Promise<import('../interface.js').MagiaConhecida[]>}
 */
export async function getMagiasDisponiveis(personagem, db) {
  if (!personagem?.id) return [];
  const nivel = personagem.nivel || 1;

  const [vinculosClasse, vinculosRaca, conhecidas] = await Promise.all([
    personagem.classe_id ? db.HmClasse.findByClasse(personagem.classe_id) : [],
    personagem.raca_id ? db.HmRaca.findByRaca(personagem.raca_id) : [],
    db.HmPersonagem.findByPersonagem(personagem.id),
  ]);

  const idsConhecidos = new Set(conhecidas.map((v) => v.habilidade_id));

  const candidatos = new Map();
  const adicionar = (habilidade, origem) => {
    if (!habilidade || habilidade.sistema !== SISTEMA) return;
    if (habilidade.nivel_requerido > nivel) return;
    if (idsConhecidos.has(habilidade.id)) return;
    if (!candidatos.has(habilidade.id)) {
      candidatos.set(habilidade.id, toMagiaConhecida(habilidade, origem));
    }
  };

  for (const v of vinculosClasse) adicionar(v.habilidades_magias, 'criacao');
  for (const v of vinculosRaca) adicionar(v.habilidades_magias, 'racial');

  return [...candidatos.values()];
}

/**
 * Capacidade de magia. D&D 5e MVP entrega só "conhecidas" — sem slots vancianos.
 * getSpellSlots de characterEngine continua disponível para regras vancianas
 * futuras, mas NÃO participa do contrato: o contrato retorna usaSlots: false.
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
    recurso: 'mana',
  };
}
