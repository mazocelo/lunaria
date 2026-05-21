/**
 * Service de criacao de personagem Lunaria.
 * Validacao de atributos/vantagens/desvantagens, aplicacao de bonus de
 * raca/classe e persistencia transacional dos vinculos.
 */
import db from '../Model/index.js';
import {
  validarVantagens,
  validarDesvantagens,
  calcularPontosVantagem,
  xpParaNivel,
  EVOLUCAO,
} from '../helpers/evolucaoHelper.js';
import { validarAtributosCriacao } from '../helpers/criacaoPersonagemHelper.js';
import { parsearBonusEntidade } from '../helpers/bonusHelper.js';
import { getAttrNamesForSystem } from '../helpers/atributosHelper.js';
import { sanitizeCharacterName, sanitizePromptInput } from '../helpers/sanitize.js';
import logger from '../helpers/logger.js';

const log = logger.child({ module: 'PersonagemLunariaService' });

function httpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

function normalizeRelationIds(rawIds, fieldName) {
  if (rawIds === undefined || rawIds === null) return [];
  if (!Array.isArray(rawIds)) {
    throw httpError(400, `${fieldName} deve ser um array de IDs`);
  }
  const parsedIds = rawIds.map(value => Number(value));
  const invalidIds = rawIds.filter((_, index) => !Number.isInteger(parsedIds[index]) || parsedIds[index] <= 0);
  if (invalidIds.length > 0) {
    throw httpError(400, `${fieldName} contem IDs invalidos: ${invalidIds.join(', ')}`);
  }
  return [...new Set(parsedIds)];
}

function toInteger(value) {
  if (value === undefined || value === null) return value;
  return parseInt(value, 10);
}

/**
 * Cria um personagem do sistema Lunaria.
 * @param {Object} body - Corpo da requisicao.
 * @param {number|null} userId - ID do usuario autenticado.
 * @returns {Promise<{ personagem: Object, background: string }>}
 */
export async function criarPersonagemLunaria(body, userId) {
  const {
    nome, nivel, background, raca_id, classe_id,
    forca, inteligencia, carisma, destreza, constituicao, agilidade,
    vantagens, desvantagens, equipamentos, historias, imagem, sistema,
  } = body;

  const vantagemIds = normalizeRelationIds(vantagens, 'vantagens');
  const desvantagemIds = normalizeRelationIds(desvantagens, 'desvantagens');
  const equipamentoIds = normalizeRelationIds(equipamentos, 'equipamentos');
  const historiaIds = normalizeRelationIds(historias, 'historias');

  // Sanitizar campos de texto controlados pelo usuario
  const nomeSanitizado = sanitizeCharacterName(nome);
  const backgroundSanitizado = sanitizePromptInput(background, 2000);

  if (!nomeSanitizado) throw httpError(400, 'Nome e obrigatorio');

  const nivelEfetivo = nivel || 1;
  if (nivelEfetivo < 1 || nivelEfetivo > EVOLUCAO.NIVEL_MAX) {
    throw httpError(400, `Nivel deve estar entre 1 e ${EVOLUCAO.NIVEL_MAX}`);
  }

  // Validar atributos de criacao com a regra oficial do wizard/simple create
  const atributos = {
    forca: forca || 10, inteligencia: inteligencia || 10, carisma: carisma || 10,
    destreza: destreza || 10, constituicao: constituicao || 10, agilidade: agilidade || 10,
  };
  const validacaoAtributos = validarAtributosCriacao(atributos);
  if (!validacaoAtributos.valido) {
    throw httpError(400, validacaoAtributos.erros.join('; '));
  }

  // Buscar raca e classe para validar orcamento de vantagens e aplicar bonus
  let racaCusto = 0;
  let classeCusto = 0;
  let racaBonusRaw = null;
  let classeBonusRaw = null;
  let bonusVantagemIds = [];
  let bonusDesvantagemIds = [];

  if (raca_id) {
    const raca = await db.Raca.findById(parseInt(raca_id));
    if (!raca) throw httpError(400, `Raca com ID ${raca_id} nao encontrada`);
    racaCusto = raca.custo || 0;
    racaBonusRaw = raca.bonus || null;
    const racaBonus = JSON.parse(racaBonusRaw || 'null') || {};
    bonusVantagemIds.push(...(racaBonus.vantagens || []).map(v => v?.id).filter(id => Number.isInteger(id) && id > 0));
    bonusDesvantagemIds.push(...(racaBonus.desvantagens || []).map(d => d?.id).filter(id => Number.isInteger(id) && id > 0));
  }
  if (classe_id) {
    const classe = await db.Classe.findById(parseInt(classe_id));
    if (!classe) throw httpError(400, `Classe com ID ${classe_id} nao encontrada`);
    classeCusto = classe.custo || 0;
    classeBonusRaw = classe.bonus || null;
    const classeBonus = JSON.parse(classeBonusRaw || 'null') || {};
    bonusVantagemIds.push(...(classeBonus.vantagens || []).map(v => v?.id).filter(id => Number.isInteger(id) && id > 0));
    bonusDesvantagemIds.push(...(classeBonus.desvantagens || []).map(d => d?.id).filter(id => Number.isInteger(id) && id > 0));
  }

  // Validar que IDs bonus existem no banco (filtrar silenciosamente os invalidos)
  if (bonusVantagemIds.length > 0) {
    const existentes = await db.prisma.vantagens.findMany({ where: { id: { in: bonusVantagemIds }, sistema: 'lunaria' }, select: { id: true } });
    const idsValidos = new Set(existentes.map(v => v.id));
    bonusVantagemIds = bonusVantagemIds.filter(id => idsValidos.has(id));
  }
  if (bonusDesvantagemIds.length > 0) {
    const existentes = await db.prisma.desvantagens.findMany({ where: { id: { in: bonusDesvantagemIds }, sistema: 'lunaria' }, select: { id: true } });
    const idsValidos = new Set(existentes.map(d => d.id));
    bonusDesvantagemIds = bonusDesvantagemIds.filter(id => idsValidos.has(id));
  }

  // Validar desvantagens (tier + limite de custo)
  let custoDesvantagensAceitas = 0;
  if (desvantagemIds.length > 0) {
    const desvantagensObjetos = await Promise.all(
      desvantagemIds.map(id => db.Desvantagem.findById(id))
    );
    const desvantagensValidas = desvantagensObjetos.filter(d => d !== null);
    const idsNaoEncontrados = desvantagemIds.filter((id, i) => !desvantagensObjetos[i]);
    if (idsNaoEncontrados.length > 0) {
      throw httpError(400, `Desvantagens nao encontradas: ${idsNaoEncontrados.join(', ')}`);
    }
    const validacaoDesv = validarDesvantagens(desvantagensValidas, nivelEfetivo);
    if (!validacaoDesv.valido) {
      throw httpError(400, validacaoDesv.erros.join('; '));
    }
    custoDesvantagensAceitas = validacaoDesv.custoTotal;
  }

  // Validar vantagens (tier + orcamento)
  if (vantagemIds.length > 0) {
    const vantagensObjetos = await Promise.all(
      vantagemIds.map(id => db.Vantagem.findById(id))
    );
    const idsNaoEncontrados = vantagemIds.filter((id, i) => !vantagensObjetos[i]);
    if (idsNaoEncontrados.length > 0) {
      throw httpError(400, `Vantagens nao encontradas: ${idsNaoEncontrados.join(', ')}`);
    }
    const vantagensValidas = vantagensObjetos.filter(v => v !== null);
    const pontosDisponiveis = calcularPontosVantagem(nivelEfetivo, racaCusto, classeCusto, custoDesvantagensAceitas);
    const validacaoVant = validarVantagens(vantagensValidas, pontosDisponiveis, nivelEfetivo);
    if (!validacaoVant.valido) {
      throw httpError(400, validacaoVant.erros.join('; '));
    }
  }

  // Background e enviado pelo frontend (pode ser vazio, gerado sob demanda via POST /:id/background)
  const backgroundFinal = backgroundSanitizado || '';

  // Aplicar bonus de atributos da raca/classe sobre os valores base
  const bonusAttrRaca = parsearBonusEntidade(racaBonusRaw);
  const bonusAttrClasse = parsearBonusEntidade(classeBonusRaw);

  // Calcular atributos efetivos (base + bonus raca/classe)
  const atributosEfetivos = {
    forca: (forca || 10) + bonusAttrRaca.forca + bonusAttrClasse.forca,
    inteligencia: (inteligencia || 10) + bonusAttrRaca.inteligencia + bonusAttrClasse.inteligencia,
    carisma: (carisma || 10) + bonusAttrRaca.carisma + bonusAttrClasse.carisma,
    destreza: (destreza || 10) + bonusAttrRaca.destreza + bonusAttrClasse.destreza,
    constituicao: (constituicao || 10) + bonusAttrRaca.constituicao + bonusAttrClasse.constituicao,
    agilidade: (agilidade || 10) + bonusAttrRaca.agilidade + bonusAttrClasse.agilidade,
  };

  // Preparar dados do personagem
  const sistemaEfetivo = ['lunaria', 'tresdet', 'dnd5e'].includes(sistema) ? sistema : 'lunaria';
  const pontosIniciais = calcularPontosVantagem(nivelEfetivo, racaCusto, classeCusto, 0);
  const dadosPersonagem = {
    nome: nomeSanitizado,
    nivel: toInteger(nivelEfetivo),
    pontos_totais: 0,
    pontos_iniciais: toInteger(pontosIniciais),
    background: backgroundFinal,
    raca_id: raca_id ? toInteger(raca_id) : null,
    classe_id: classe_id ? toInteger(classe_id) : null,
    xp_atual: 0,
    xp_proximo_nivel: toInteger(xpParaNivel(nivelEfetivo)),
    pontos_atributo_pendentes: 0,
    id_usuario: userId || null,
    criado_em: new Date(),
    sistema: sistemaEfetivo,
    ...(imagem ? { imagem } : {}),
  };

  // Criar personagem + vinculos em transacao unica (atomico)
  const novoPersonagem = await db.prisma.$transaction(async (tx) => {
    if (equipamentoIds.length > 0) {
      const equipamentosExistentes = await tx.equipamentos.findMany({
        where: { id: { in: equipamentoIds } },
        select: { id: true },
      });
      const idsEncontrados = new Set(equipamentosExistentes.map(equipamento => equipamento.id));
      const idsInvalidos = equipamentoIds.filter(id => !idsEncontrados.has(id));
      if (idsInvalidos.length > 0) {
        throw httpError(400, `Equipamentos nao encontrados: ${idsInvalidos.join(', ')}`);
      }
    }

    if (historiaIds.length > 0) {
      const historiasExistentes = await tx.historias.findMany({
        where: { id: { in: historiaIds }, deleted_at: null },
        select: { id: true },
      });
      const idsEncontrados = new Set(historiasExistentes.map(historia => historia.id));
      const idsInvalidos = historiaIds.filter(id => !idsEncontrados.has(id));
      if (idsInvalidos.length > 0) {
        throw httpError(400, `Historias nao encontradas: ${idsInvalidos.join(', ')}`);
      }
    }

    const personagem = await tx.personagens.create({ data: dadosPersonagem });

    // Atributos (sistema-aware)
    const attrNames = getAttrNamesForSystem(sistemaEfetivo);
    const defaultAttrVal = sistemaEfetivo === 'tresdet' ? 0 : 10;
    await tx.atributos_personagem.createMany({
      data: attrNames.map(nome => ({
        personagem_id: personagem.id,
        nome,
        valor: atributosEfetivos[nome] ?? defaultAttrVal,
      })),
    });

    // Historias
    if (historiaIds.length > 0) {
      await tx.historias_personagens.createMany({
        data: historiaIds.map(hid => ({ personagem_id: personagem.id, historia_id: hid, papel: 'jogador' })),
      });
    }

    // Vantagens (usuario + bonus raca/classe, deduplicado)
    const allVantagemIds = [...new Set([...vantagemIds, ...bonusVantagemIds])];
    if (allVantagemIds.length > 0) {
      await tx.personagem_vantagem.createMany({
        data: allVantagemIds.map(vantagemId => ({ personagem_id: personagem.id, vantagem_id: vantagemId })),
      });
    }

    // Desvantagens (usuario + bonus raca/classe, deduplicado)
    const allDesvantagemIds = [...new Set([...desvantagemIds, ...bonusDesvantagemIds])];
    if (allDesvantagemIds.length > 0) {
      await tx.personagem_desvantagem.createMany({
        data: allDesvantagemIds.map(desvantagemId => ({ personagem_id: personagem.id, desvantagem_id: desvantagemId })),
      });
    }

    // Equipamentos
    if (equipamentoIds.length > 0) {
      await tx.personagem_equipamento.createMany({
        data: equipamentoIds.map(eid => ({ personagem_id: personagem.id, equipamento_id: eid })),
      });
    }

    return personagem;
  });

  log.info({ id: novoPersonagem.id, nome: nomeSanitizado }, 'Personagem Lunaria criado');
  return { personagem: novoPersonagem, background: backgroundFinal };
}
