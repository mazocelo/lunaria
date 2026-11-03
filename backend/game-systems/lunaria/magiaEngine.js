/**
 * Lunaria — contrato de magias (passo 3.3, §5 da spec do modelo híbrido H&M).
 *
 * Implementa getMagiasConhecidas / getMagiasDisponiveis / getSlotsInfo conforme
 * o contrato comum de game-systems/interface.js.
 *
 * As funções recebem `db` (o acessor de Models de Model/index.js) como segundo
 * parâmetro — a engine não importa Prisma direto, o que mantém os call-sites
 * testáveis com um db fake. São async porque consultam o banco.
 */

const SISTEMA = 'lunaria';

/** escola_magia ∉ {null,'nenhuma'} ⇒ magia; senão ⇒ técnica de combate. */
function classificarTipo(habilidade) {
  const escola = habilidade?.escola_magia;
  return escola && escola !== 'nenhuma' ? 'magia' : 'tecnica';
}

function ehMagia(habilidade) {
  return classificarTipo(habilidade) === 'magia';
}

/**
 * Resolve o upgrade de escalamento ativo para o nível do personagem.
 * escalamento esperado: { por_nivel: string, a_cada: number }.
 * Retorna null se não houver escalamento ou se o personagem ainda não atingiu
 * o primeiro passo.
 */
function resolverUpgradeAtivo(habilidade, nivelPersonagem) {
  const esc = habilidade?.escalamento;
  if (!esc || typeof esc !== 'object' || !esc.a_cada || esc.a_cada <= 0) return null;

  const nivelRequerido = habilidade.nivel_requerido || 1;
  const passos = Math.floor((nivelPersonagem - nivelRequerido) / esc.a_cada);
  if (passos <= 0) return null;

  return { por_nivel: esc.por_nivel, a_cada: esc.a_cada, passos };
}

function toMagiaConhecida(habilidade, origem, nivelPersonagem) {
  return {
    id: habilidade.id,
    fonte: 'habilidades_magias',
    nome: habilidade.nome,
    tipo: classificarTipo(habilidade),
    escola: habilidade.escola_magia || null,
    custo: habilidade.custo_mana ?? 0,
    origem: origem || 'criacao',
    usa_concentracao: habilidade.usa_concentracao ?? false,
    upgradeAtivo: resolverUpgradeAtivo(habilidade, nivelPersonagem),
  };
}

/**
 * Magias e técnicas que o personagem JÁ possui.
 * Lê apenas o vínculo hm_personagem — nunca o catálogo inteiro.
 * @param {Object} personagem
 * @param {Object} db — acessor de Models
 * @returns {Promise<import('../interface.js').MagiaConhecida[]>}
 */
export async function getMagiasConhecidas(personagem, db) {
  if (!personagem?.id) return [];
  const nivel = personagem.nivel || 1;

  const vinculos = await db.HmPersonagem.findByPersonagem(personagem.id);
  return vinculos
    .filter((v) => v.habilidades_magias && v.habilidades_magias.sistema === SISTEMA)
    .map((v) => toMagiaConhecida(v.habilidades_magias, v.origem, nivel));
}

/**
 * Catálogo que o personagem PODE aprender: habilidades da classe (hm_classe) ∪
 * habilidades raciais (hm_raca), filtradas por nível, respeitando pode_magia,
 * excluindo o que já conhece.
 * @param {Object} personagem
 * @param {Object} db — acessor de Models
 * @returns {Promise<import('../interface.js').MagiaConhecida[]>}
 */
export async function getMagiasDisponiveis(personagem, db) {
  if (!personagem?.id) return [];
  const nivel = personagem.nivel || 1;

  const [vinculosClasse, vinculosRaca, conhecidas, raca] = await Promise.all([
    personagem.classe_id ? db.HmClasse.findByClasse(personagem.classe_id) : [],
    personagem.raca_id ? db.HmRaca.findByRaca(personagem.raca_id) : [],
    db.HmPersonagem.findByPersonagem(personagem.id),
    personagem.raca_id ? db.Raca.findById(personagem.raca_id) : null,
  ]);

  const podeMagia = raca?.pode_magia !== false;
  const idsConhecidos = new Set(conhecidas.map((v) => v.habilidade_id));

  const candidatos = new Map();
  const adicionar = (habilidade, origem) => {
    if (!habilidade || habilidade.sistema !== SISTEMA) return;
    if (habilidade.nivel_requerido > nivel) return;
    if (idsConhecidos.has(habilidade.id)) return;
    if (!podeMagia && ehMagia(habilidade)) return;
    if (!candidatos.has(habilidade.id)) {
      candidatos.set(habilidade.id, toMagiaConhecida(habilidade, origem, nivel));
    }
  };

  for (const v of vinculosClasse) adicionar(v.habilidades_magias, 'criacao');
  for (const v of vinculosRaca) adicionar(v.habilidades_magias, 'racial');

  return [...candidatos.values()];
}

/**
 * Capacidade de magia do personagem. Lunaria é o único sistema com slots reais.
 * total = hm_slots_classe(classe, nivel) + Σ bonus.slots_magia_bonus das vantagens.
 * @param {Object} personagem
 * @param {Object} db — acessor de Models
 * @returns {Promise<import('../interface.js').SlotsInfo>}
 */
export async function getSlotsInfo(personagem, db) {
  const nivel = personagem?.nivel || 1;

  let slotsBase = 0;
  if (personagem?.classe_id) {
    slotsBase = await db.HmSlotsClasse.getSlots(personagem.classe_id, nivel);
  }

  const bonusVantagens = (personagem?.personagem_vantagem || []).reduce((soma, pv) => {
    const bonus = pv?.vantagens?.bonus?.slots_magia_bonus;
    return soma + (Number(bonus) || 0);
  }, 0);

  const total = slotsBase + bonusVantagens;
  const usados = personagem?.id ? await db.HmPersonagem.contarMagias(personagem.id) : 0;

  return {
    usaSlots: true,
    total,
    usados,
    livres: total - usados,
    recurso: 'slots',
  };
}
