/**
 * Helper deterministico para finalizacao de personagem.
 *
 * Responsavel por montar a base estruturada consumida pelo agente:
 * - snapshot
 * - catalogos elegiveis
 * - metadados de build
 *
 * Mantem zero persistencia e nenhuma logica de prompt/IA.
 */

import db from '../Model/index.js';
import { buscarPersonagensCompletos } from './personagensHelper.js';
import { tierDesbloqueado, calcularPontosVantagem } from './evolucaoHelper.js';
import { validarRequisitosEquipamento } from './bonusHelper.js';

export function resolverPerfilCombo(pontosRestantes) {
  const saldo = Number(pontosRestantes) || 0;
  if (saldo <= 2) return 'contido';
  if (saldo <= 6) return 'equilibrado';
  return 'amplo';
}

export function getCapsPerfilCombo(perfil) {
  switch (perfil) {
    case 'contido':
      return { maxEquipamentos: 2, maxTaticos: 1, maxTotal: 3 };
    case 'amplo':
      return { maxEquipamentos: 3, maxTaticos: 3, maxTotal: 6 };
    case 'equilibrado':
    default:
      return { maxEquipamentos: 2, maxTaticos: 2, maxTotal: 4 };
  }
}

export function buildMetaFinalizacao({
  nivel,
  racaCusto = 0,
  classeCusto = 0,
  custoDesvantagens = 0,
  custoVantagensUsado = 0,
}) {
  const tier = tierDesbloqueado(nivel);
  const orcamentoTotal = calcularPontosVantagem(nivel, racaCusto, classeCusto, custoDesvantagens);
  const saldoVantagens = orcamentoTotal - custoVantagensUsado;
  const perfilCombo = resolverPerfilCombo(saldoVantagens);

  return {
    nivel,
    tier,
    pontos_restantes: saldoVantagens,
    perfil_combo: perfilCombo,
  };
}

export async function buildFinalizacaoBase(personagemId) {
  const id = parseInt(personagemId, 10);
  if (!id || Number.isNaN(id)) throw new Error('personagemId invalido');

  const [personagemCompleto] = await buscarPersonagensCompletos([id]);
  if (!personagemCompleto) throw new Error('Personagem nao encontrado');

  const personagemRaw = await db.Personagem.findByIdWithRelations(id);
  if (!personagemRaw) throw new Error('Personagem nao encontrado (raw)');

  const classeId = personagemRaw.classe_id;
  const racaId = personagemRaw.raca_id;
  const classeNome = personagemCompleto.classe;
  const racaNome = personagemCompleto.raca;
  const nivel = personagemCompleto.nivel;

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

  const racaCusto = personagemRaw.racas?.custo ?? 0;
  const classeCusto = personagemRaw.classes?.custo ?? 0;

  const desvantagensRaw = await db.Personagem.listarDesvantagens(id);
  const custoDesv = desvantagensRaw.reduce((acc, item) => {
    const custo = item.desvantagem?.custo ?? item.custo ?? 0;
    return acc + Math.abs(custo);
  }, 0);

  const vantagensRaw = await db.Personagem.listarVantagens(id);
  const custoVantagensUsado = vantagensRaw.reduce((acc, item) => {
    return acc + (item.vantagem?.custo ?? item.custo ?? 0);
  }, 0);

  const meta = buildMetaFinalizacao({
    nivel,
    racaCusto,
    classeCusto,
    custoDesvantagens: custoDesv,
    custoVantagensUsado,
  });

  const catalogoHabilidades = await buildCatalogoHabilidades(classeId, racaId, nivel);
  const idsEquipados = new Set(
    (personagemRaw.personagem_equipamento || []).map((item) => item.equipamento_id)
  );
  const catalogoEquipamentos = await buildCatalogoEquipamentos(classeNome, racaNome, idsEquipados);

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

export async function buildCatalogoHabilidades(classeId, racaId, nivel) {
  const promises = [];
  if (classeId) promises.push(db.Habilidade.findByClasse(classeId));
  if (racaId) promises.push(db.Habilidade.findByRaca(racaId));

  const results = await Promise.all(promises);
  const merged = results.flat();

  const seen = new Set();
  const elegiveis = merged.filter((habilidade) => {
    if (seen.has(habilidade.id)) return false;
    seen.add(habilidade.id);
    return (habilidade.nivel_requerido || 1) <= nivel;
  });

  const shapeItem = (habilidade) => ({
    id: habilidade.id,
    nome: habilidade.nome,
    descricao: habilidade.descricao,
    tipo: habilidade.tipo,
    custo_mana: habilidade.custo_mana || 0,
    cooldown_turnos: habilidade.cooldown_turnos || 0,
    dano_base: habilidade.dano_base || null,
    elemento: habilidade.elemento || null,
    escola_magia: habilidade.escola_magia || null,
    nivel_requerido: habilidade.nivel_requerido || 1,
    categoria: habilidade.categoria || null,
    alcance: habilidade.alcance || null,
    alvo: habilidade.alvo || null,
  });

  const ehMagia = (habilidade) => habilidade.escola_magia && habilidade.escola_magia !== 'nenhuma';

  return {
    habilidades: elegiveis.filter((habilidade) => !ehMagia(habilidade)).map(shapeItem),
    magias: elegiveis.filter((habilidade) => ehMagia(habilidade)).map(shapeItem),
  };
}

export async function buildCatalogoEquipamentos(classeNome, racaNome, idsEquipados = new Set()) {
  const todos = await db.Equipamento.findAll();

  return todos
    .filter((equipamento) => {
      if (idsEquipados.has(equipamento.id)) return false;
      const { valido } = validarRequisitosEquipamento(equipamento.requisitos, classeNome, racaNome);
      return valido;
    })
    .map((equipamento) => ({
      id: equipamento.id,
      nome: equipamento.nome,
      descricao: equipamento.descricao,
      tipo: equipamento.tipo,
      dano_base: equipamento.dano_base || null,
      bonus: equipamento.bonus || [],
      elemento: equipamento.elemento || [],
      propriedades: equipamento.propriedades || [],
      raridade: equipamento.raridade_rel?.nome || null,
      categoria: equipamento.categoria_rel?.nome || null,
      peso: equipamento.peso || null,
      preco_sugerido: equipamento.preco_sugerido || null,
      requisitos: equipamento.requisitos || null,
    }));
}
