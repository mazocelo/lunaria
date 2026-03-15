/**
 * Helper deterministico para finalizacao inicial de personagem.
 *
 * Monta a base estruturada (snapshot + catalogos elegiveis + metadados)
 * para que outro agente (IA) consuma e gere recomendacoes editaveis.
 *
 * - Somente leitura, zero persistencia
 * - Zero logica de IA / prompt
 * - Reutiliza helpers e models existentes
 */

import db from '../Model/index.js';
import logger from './logger.js';
import { buscarPersonagensCompletos } from './personagensHelper.js';
import { tierDesbloqueado, calcularPontosVantagem } from './evolucaoHelper.js';
import { validarRequisitosEquipamento } from './bonusHelper.js';

const log = logger.child({ module: 'finalizacaoInicialHelper' });

/**
 * Constroi a base deterministica para finalizacao inicial do personagem.
 *
 * @param {number} personagemId
 * @returns {Promise<{ snapshot, catalogo_editavel, meta }>}
 */
export async function buildFinalizacaoBase(personagemId) {
  const id = parseInt(personagemId);
  if (!id || isNaN(id)) throw new Error('personagemId invalido');

  // ── 1. Buscar personagem completo (snapshot) ──
  const [personagemCompleto] = await buscarPersonagensCompletos([id]);
  if (!personagemCompleto) throw new Error('Personagem nao encontrado');

  // Buscar registro cru para IDs e custos de raca/classe
  const personagemRaw = await db.Personagem.findByIdWithRelations(id);
  if (!personagemRaw) throw new Error('Personagem nao encontrado (raw)');

  const classeId = personagemRaw.classe_id;
  const racaId = personagemRaw.raca_id;
  const classeNome = personagemCompleto.classe;
  const racaNome = personagemCompleto.raca;
  const nivel = personagemCompleto.nivel;

  // ── 2. Montar snapshot ──
  // Nota: atributos sao EFETIVOS (base + bonus raca + bonus classe),
  // calculados por calcularAtributosEfetivos em personagensHelper.
  const snapshot = {
    personagem_id: personagemCompleto.id,
    nome: personagemCompleto.nome,
    classe: classeNome,
    raca: racaNome,
    nivel,
    background: personagemCompleto.background,
    atributos: personagemCompleto.atributos,
    vantagens: personagemCompleto.vantagens,
    desvantagens: personagemCompleto.desvantagens,
    equipamentos_atuais: personagemCompleto.equipamentos,
  };

  // ── 3. Calcular meta ──
  const tier = tierDesbloqueado(nivel);
  const racaCusto = personagemRaw.racas?.custo ?? 0;
  const classeCusto = personagemRaw.classes?.custo ?? 0;

  // Custo total das desvantagens atuais (somando |custo|)
  const desvantagensRaw = await db.Personagem.listarDesvantagens(id);
  const custoDesv = desvantagensRaw.reduce((acc, d) => {
    const custo = d.desvantagem?.custo ?? d.custo ?? 0;
    return acc + Math.abs(custo);
  }, 0);

  // Custo total das vantagens ja atribuidas
  const vantagensRaw = await db.Personagem.listarVantagens(id);
  const custoVantagensUsado = vantagensRaw.reduce((acc, v) => {
    return acc + (v.vantagem?.custo ?? v.custo ?? 0);
  }, 0);

  // Saldo de orcamento de vantagens (formula oficial de evolucaoHelper).
  // Este valor representa SOMENTE pontos de vantagem disponiveis apos descontar
  // raca, classe e vantagens ja atribuidas. NAO e moeda de loadout geral.
  const orcamentoTotal = calcularPontosVantagem(nivel, racaCusto, classeCusto, custoDesv);
  const saldoVantagens = orcamentoTotal - custoVantagensUsado;

  const meta = { nivel, tier, pontos_restantes: saldoVantagens };

  // ── 4. Catalogo de habilidades e magias ──
  const catalogoHabilidades = await buildCatalogoHabilidades(classeId, racaId, nivel);

  // ── 5. Catalogo de equipamentos ──
  const idsEquipados = new Set(
    (personagemRaw.personagem_equipamento || []).map(pe => pe.equipamento_id)
  );
  const catalogoEquipamentos = await buildCatalogoEquipamentos(classeNome, racaNome, idsEquipados);

  // ── 6. Retorno ──
  return {
    snapshot,
    catalogo_editavel: {
      equipamentos: catalogoEquipamentos,
      habilidades: catalogoHabilidades.habilidades,
      magias: catalogoHabilidades.magias,
    },
    meta,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Funcoes internas
// ═══════════════════════════════════════════════════════════════════

/**
 * Busca habilidades elegiveis por classe e raca, separa em habilidades e magias.
 * Reutiliza a mesma logica de personagensHelper.buscarPersonagensCompletos:
 *   - findByClasse(classeId) retorna habilidades da classe + universais (classe_id = null)
 *   - findByRaca(racaId) retorna habilidades raciais (match estrito)
 *   - Deduplicacao por id
 *   - Filtro por nivel_requerido <= nivel
 *   - Separacao: escola_magia presente e != 'nenhuma' → magia, senao → habilidade
 */
async function buildCatalogoHabilidades(classeId, racaId, nivel) {
  const promises = [];
  if (classeId) promises.push(db.Habilidade.findByClasse(classeId));
  if (racaId) promises.push(db.Habilidade.findByRaca(racaId));

  const results = await Promise.all(promises);
  const merged = results.flat();

  // Deduplicar e filtrar por nivel
  const seen = new Set();
  const elegiveis = merged.filter(h => {
    if (seen.has(h.id)) return false;
    seen.add(h.id);
    return (h.nivel_requerido || 1) <= nivel;
  });

  const shapeItem = (h) => ({
    id: h.id,
    nome: h.nome,
    descricao: h.descricao,
    tipo: h.tipo,
    custo_mana: h.custo_mana || 0,
    cooldown_turnos: h.cooldown_turnos || 0,
    dano_base: h.dano_base || null,
    elemento: h.elemento || null,
    escola_magia: h.escola_magia || null,
    nivel_requerido: h.nivel_requerido || 1,
    categoria: h.categoria || null,
    alcance: h.alcance || null,
    alvo: h.alvo || null,
  });

  const ehMagia = (h) => h.escola_magia && h.escola_magia !== 'nenhuma';

  return {
    habilidades: elegiveis.filter(h => !ehMagia(h)).map(shapeItem),
    magias: elegiveis.filter(h => ehMagia(h)).map(shapeItem),
  };
}

/**
 * Busca equipamentos elegiveis para o personagem.
 *
 * Heuristica de elegibilidade (documentada):
 *   1. Se equipamento.requisitos e null/vazio/nao-objeto → elegivel para todos
 *   2. Se equipamento.requisitos.classe existe → nomeClasse deve estar na lista (case-insensitive)
 *   3. Se equipamento.requisitos.raca existe → nomeRaca deve estar na lista (case-insensitive)
 *   4. Equipamentos ja vinculados ao personagem sao excluidos do catalogo
 *
 * Usa validarRequisitosEquipamento de bonusHelper.js — mesma logica do dominio.
 * Nao filtra por nivel/tier pois equipamentos nao possuem campo nivel_requerido no schema.
 *
 * @param {string} classeNome
 * @param {string} racaNome
 * @param {Set<number>} idsEquipados - IDs ja vinculados ao personagem
 */
async function buildCatalogoEquipamentos(classeNome, racaNome, idsEquipados) {
  const todos = await db.Equipamento.findAll();

  return todos
    .filter(e => {
      // Excluir ja equipados
      if (idsEquipados.has(e.id)) return false;
      // Validar requisitos classe/raca
      const { valido } = validarRequisitosEquipamento(e.requisitos, classeNome, racaNome);
      return valido;
    })
    .map(e => ({
      id: e.id,
      nome: e.nome,
      descricao: e.descricao,
      tipo: e.tipo,
      dano_base: e.dano_base || null,
      bonus: e.bonus || [],
      elemento: e.elemento || [],
      propriedades: e.propriedades || [],
      raridade: e.raridade_rel?.nome || null,
      categoria: e.categoria_rel?.nome || null,
      peso: e.peso || null,
      requisitos: e.requisitos || null,
    }));
}
