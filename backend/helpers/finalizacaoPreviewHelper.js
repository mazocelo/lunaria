import db from '../Model/index.js';
import { calcularAtributosEfetivos } from './bonusHelper.js';
import {
  buildCatalogoEquipamentos,
  buildCatalogoHabilidades,
  buildMetaFinalizacao,
} from './finalizacaoInicialHelper.js';

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeRelationIds(rawIds, fieldName) {
  if (rawIds === undefined || rawIds === null) {
    return [];
  }

  if (!Array.isArray(rawIds)) {
    throw createHttpError(400, `${fieldName} deve ser um array de IDs`);
  }

  const parsedIds = rawIds.map((value) => Number(value));
  const invalidIds = rawIds.filter((_, index) => !Number.isInteger(parsedIds[index]) || parsedIds[index] <= 0);

  if (invalidIds.length > 0) {
    throw createHttpError(400, `${fieldName} contem IDs invalidos: ${invalidIds.join(', ')}`);
  }

  return [...new Set(parsedIds)];
}

function shapeVantagem(vantagem) {
  return {
    id: vantagem.id,
    nome: vantagem.nome,
    descricao: vantagem.descricao,
    tipo: vantagem.tipo,
    elemento: vantagem.elemento,
    usar: vantagem.usar ?? 0,
    dano_base: vantagem.dano_base || null,
    efeito: vantagem.efeito || null,
    bonus: vantagem.bonus || null,
    custo: vantagem.custo || 0,
  };
}

function shapeDesvantagem(desvantagem) {
  return {
    id: desvantagem.id,
    nome: desvantagem.nome,
    descricao: desvantagem.descricao,
    tipo: desvantagem.tipo,
    elemento: desvantagem.elemento,
    efeito: desvantagem.efeito || null,
    bonus: desvantagem.bonus || null,
    custo: desvantagem.custo || 0,
  };
}

function normalizeDraft(draft) {
  if (!draft || typeof draft !== 'object') {
    throw createHttpError(400, 'Draft de finalizacao invalido');
  }

  const atributos = draft.atributos || {};

  return {
    nome: String(draft.nome || '').trim(),
    raca_id: draft.raca_id ? parseInt(draft.raca_id, 10) : null,
    classe_id: draft.classe_id ? parseInt(draft.classe_id, 10) : null,
    background: String(draft.background || '').trim(),
    nivel: draft.nivel ? parseInt(draft.nivel, 10) : 1,
    atributos: {
      forca: Number(atributos.forca) || 10,
      destreza: Number(atributos.destreza) || 10,
      constituicao: Number(atributos.constituicao) || 10,
      inteligencia: Number(atributos.inteligencia) || 10,
      agilidade: Number(atributos.agilidade) || 10,
      carisma: Number(atributos.carisma) || 10,
    },
    vantagens_ids: normalizeRelationIds(draft.vantagens_ids ?? draft.vantagens, 'vantagens'),
    desvantagens_ids: normalizeRelationIds(draft.desvantagens_ids ?? draft.desvantagens, 'desvantagens'),
  };
}

export async function buildFinalizacaoPreviewBase(rawDraft) {
  const draft = normalizeDraft(rawDraft);

  if (!draft.nome) {
    throw createHttpError(400, 'Nome e obrigatorio para gerar a resolutiva');
  }
  if (!draft.raca_id) {
    throw createHttpError(400, 'Raca e obrigatoria para gerar a resolutiva');
  }
  if (!draft.classe_id) {
    throw createHttpError(400, 'Classe e obrigatoria para gerar a resolutiva');
  }
  if (!draft.background) {
    throw createHttpError(400, 'Background e obrigatorio para gerar a resolutiva');
  }

  const [raca, classe, vantagens, desvantagens] = await Promise.all([
    db.Raca.findById(draft.raca_id),
    db.Classe.findById(draft.classe_id),
    Promise.all(draft.vantagens_ids.map((id) => db.Vantagem.findById(id))),
    Promise.all(draft.desvantagens_ids.map((id) => db.Desvantagem.findById(id))),
  ]);

  if (!raca) {
    throw createHttpError(400, `Raca com ID ${draft.raca_id} nao encontrada`);
  }
  if (!classe) {
    throw createHttpError(400, `Classe com ID ${draft.classe_id} nao encontrada`);
  }

  const idsVantagemNaoEncontrados = draft.vantagens_ids.filter((id, index) => !vantagens[index]);
  if (idsVantagemNaoEncontrados.length > 0) {
    throw createHttpError(400, `Vantagens nao encontradas: ${idsVantagemNaoEncontrados.join(', ')}`);
  }

  const idsDesvantagemNaoEncontrados = draft.desvantagens_ids.filter((id, index) => !desvantagens[index]);
  if (idsDesvantagemNaoEncontrados.length > 0) {
    throw createHttpError(400, `Desvantagens nao encontradas: ${idsDesvantagemNaoEncontrados.join(', ')}`);
  }

  const atributosEfetivos = calcularAtributosEfetivos(
    {
      forca: draft.atributos.forca,
      destreza: draft.atributos.destreza,
      constituicao: draft.atributos.constituicao,
      inteligencia: draft.atributos.inteligencia,
      agilidade: draft.atributos.agilidade,
      carisma: draft.atributos.carisma,
    },
    raca?.bonus,
    classe?.bonus
  );

  const vantagensValidas = vantagens.filter(Boolean);
  const desvantagensValidas = desvantagens.filter(Boolean);

  const custoDesvantagens = desvantagensValidas.reduce((acc, item) => acc + Math.abs(item.custo || 0), 0);
  const custoVantagensUsado = vantagensValidas.reduce((acc, item) => acc + (item.custo || 0), 0);

  const meta = buildMetaFinalizacao({
    nivel: draft.nivel,
    racaCusto: raca.custo || 0,
    classeCusto: classe.custo || 0,
    custoDesvantagens,
    custoVantagensUsado,
  });

  const catalogoHabilidades = await buildCatalogoHabilidades(classe.id, raca.id, draft.nivel);
  const catalogoEquipamentos = await buildCatalogoEquipamentos(classe.nome, raca.nome, new Set());

  return {
    snapshot: {
      personagem_id: null,
      nome: draft.nome,
      classe: classe.nome,
      raca: raca.nome,
      nivel: draft.nivel,
      background: draft.background,
      atributos: atributosEfetivos,
      vantagens: vantagensValidas.map(shapeVantagem),
      desvantagens: desvantagensValidas.map(shapeDesvantagem),
      equipamentos_atuais: [],
    },
    catalogo_editavel: {
      equipamentos: catalogoEquipamentos,
      habilidades: catalogoHabilidades.habilidades,
      magias: catalogoHabilidades.magias,
    },
    meta,
  };
}
