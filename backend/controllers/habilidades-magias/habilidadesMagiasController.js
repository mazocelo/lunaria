import db from '../../Model/index.js';
import { normalizarElemento, ELEMENTOS } from '../../config/domainConstants.js';
import logger from '../../helpers/logger.js';
import {
  normalizarEfeitoCatalogo,
  normalizarElementoPrimario,
  normalizarRequisitos,
  serializarHabilidade,
} from '../../helpers/catalogJsonHelper.js';

const log = logger.child({ module: 'habilidadesMagiasController' });

function parseElementoScalar(raw) {
  if (raw === undefined) return { value: undefined };
  if (raw === null || raw === '') return { value: null };
  const normalizado = normalizarElemento(raw);
  if (!normalizado) {
    return { error: `Elemento invalido: ${raw}. Validos: ${ELEMENTOS.join(', ')}` };
  }
  return { value: normalizado };
}

function resolvePreRequisitos(body) {
  const raw = body.pre_requisitos !== undefined ? body.pre_requisitos : body.pre_requisito;
  return raw !== undefined ? normalizarRequisitos(raw) : undefined;
}

function buildData(body) {
  return {
    nome: body.nome,
    descricao: body.descricao,
    custo_mana: body.custo_mana ?? 0,
    dano_base: body.dano_base || null,
    tipo: body.tipo || 'dano',
    elemento: normalizarElementoPrimario(body.elemento) || null,
    nivel_requerido: body.nivel_requerido ?? 1,
    cooldown_turnos: body.cooldown_turnos ?? 0,
    classe_id: body.classe_id ? parseInt(body.classe_id, 10) : null,
    efeito: normalizarEfeitoCatalogo(body.efeito) || null,
    alvo: body.alvo || 'inimigo',
    alcance: body.alcance || 'medio',
    area_efeito: body.area_efeito || null,
    tempo_conjuracao: body.tempo_conjuracao || 'acao',
    usa_concentracao: body.usa_concentracao ?? false,
    categoria: body.categoria || 'combate_fisico',
    escola_magia: body.escola_magia || null,
    escalamento: body.escalamento || null,
    pre_requisito: resolvePreRequisitos(body) || null,
    raca_id: body.raca_id ? parseInt(body.raca_id, 10) : null,
    usos_por_descanso: body.usos_por_descanso ?? null,
    componente_material: body.componente_material || null,
    saving_throw: body.saving_throw || null,
  };
}

function buildUpdateData(body) {
  const data = {};
  const strFields = ['nome', 'descricao', 'tipo', 'alvo', 'alcance', 'tempo_conjuracao', 'categoria'];
  const nullStrFields = ['dano_base', 'escola_magia', 'saving_throw'];
  const intFields = ['custo_mana', 'nivel_requerido', 'cooldown_turnos'];
  const jsonFields = ['area_efeito', 'escalamento', 'componente_material'];
  const fkFields = ['classe_id', 'raca_id'];

  for (const field of strFields) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  for (const field of nullStrFields) {
    if (body[field] !== undefined) data[field] = body[field] || null;
  }
  for (const field of intFields) {
    if (body[field] !== undefined) data[field] = parseInt(body[field], 10);
  }
  for (const field of jsonFields) {
    if (body[field] !== undefined) data[field] = body[field] || null;
  }
  for (const field of fkFields) {
    if (body[field] !== undefined) data[field] = body[field] ? parseInt(body[field], 10) : null;
  }

  if (body.elemento !== undefined) {
    data.elemento = normalizarElementoPrimario(body.elemento) || null;
  }
  if (body.efeito !== undefined) {
    data.efeito = normalizarEfeitoCatalogo(body.efeito) || null;
  }
  if (body.pre_requisito !== undefined || body.pre_requisitos !== undefined) {
    data.pre_requisito = resolvePreRequisitos(body) || null;
  }
  if (body.usa_concentracao !== undefined) {
    data.usa_concentracao = Boolean(body.usa_concentracao);
  }
  if (body.usos_por_descanso !== undefined) {
    data.usos_por_descanso = body.usos_por_descanso != null ? parseInt(body.usos_por_descanso, 10) : null;
  }

  return data;
}

class HabilidadesController {
  async criarHabilidade(req, res) {
    try {
      if (!req.body.nome || !req.body.descricao) {
        return res.status(400).json({ error: 'Nome e descricao sao obrigatorios' });
      }

      const elementoInput = req.body.elemento !== undefined ? req.body.elemento : req.body.elementos;
      const elemento = parseElementoScalar(Array.isArray(elementoInput) ? elementoInput[0] : elementoInput);
      if (elemento.error) return res.status(400).json({ error: elemento.error });

      const habilidade = await db.HabilidadeMagia.create({
        data: buildData({ ...req.body, elemento: elementoInput ?? elemento.value })
      });
      return res.status(201).json(serializarHabilidade(habilidade));
    } catch (error) {
      log.error({ err: error }, 'Erro ao criar habilidade');
      if (error.code === 'P2002') return res.status(409).json({ error: 'Ja existe uma habilidade com esse nome' });
      return res.status(500).json({ error: 'Erro ao criar habilidade' });
    }
  }

  async listarHabilidades(req, res) {
    try {
      const { limit = 50, offset = 0, tipo, elemento, classe_id, nivel, busca, categoria, escola_magia, raca_id, alcance } = req.query;
      const elementoFiltro = parseElementoScalar(elemento);
      if (elementoFiltro.error) return res.status(400).json({ error: elementoFiltro.error });

      const result = await db.HabilidadeMagia.findPaginated({
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        tipo,
        elemento: elementoFiltro.value,
        classe_id,
        nivel,
        busca,
        categoria,
        escola_magia,
        raca_id,
        alcance
      });

      return res.json({
        data: result.data.map(serializarHabilidade),
        total: result.total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        hasMore: parseInt(offset, 10) + result.data.length < result.total
      });
    } catch (error) {
      log.error({ err: error }, 'Erro ao listar habilidades');
      return res.status(500).json({ error: 'Erro ao listar habilidades' });
    }
  }

  async obterHabilidade(req, res) {
    try {
      const habilidade = await db.HabilidadeMagia.findById(parseInt(req.params.id, 10));
      if (!habilidade) return res.status(404).json({ error: 'Habilidade nao encontrada' });
      return res.json({ success: true, data: serializarHabilidade(habilidade) });
    } catch (error) {
      log.error({ err: error }, 'Erro ao obter habilidade');
      return res.status(500).json({ error: 'Erro ao obter habilidade' });
    }
  }

  async atualizarHabilidade(req, res) {
    try {
      const elementoInput = req.body.elemento !== undefined ? req.body.elemento : req.body.elementos;
      const elemento = parseElementoScalar(Array.isArray(elementoInput) ? elementoInput[0] : elementoInput);
      if (elemento.error) return res.status(400).json({ error: elemento.error });

      const habilidade = await db.HabilidadeMagia.update(
        parseInt(req.params.id, 10),
        buildUpdateData({ ...req.body, elemento: elementoInput ?? elemento.value })
      );
      return res.json(serializarHabilidade(habilidade));
    } catch (error) {
      log.error({ err: error }, 'Erro ao atualizar habilidade');
      if (error.code === 'P2025') return res.status(404).json({ error: 'Habilidade nao encontrada' });
      if (error.code === 'P2002') return res.status(409).json({ error: 'Ja existe uma habilidade com esse nome' });
      return res.status(500).json({ error: 'Erro ao atualizar habilidade' });
    }
  }

  async deletarHabilidade(req, res) {
    try {
      await db.HabilidadeMagia.delete(parseInt(req.params.id, 10));
      return res.json({ message: 'Habilidade deletada com sucesso' });
    } catch (error) {
      log.error({ err: error }, 'Erro ao deletar habilidade');
      if (error.code === 'P2025') return res.status(404).json({ error: 'Habilidade nao encontrada' });
      return res.status(500).json({ error: 'Erro ao deletar habilidade' });
    }
  }

  async obterEstatisticas(req, res) {
    try {
      const stats = await db.HabilidadeMagia.getEstatisticas();
      return res.json(stats);
    } catch (error) {
      log.error({ err: error }, 'Erro ao obter estatisticas');
      return res.status(500).json({ error: 'Erro ao obter estatisticas' });
    }
  }

  async obterSlots(req, res) {
    try {
      const { classe_id, nivel } = req.query;
      if (!classe_id) return res.status(400).json({ error: 'classe_id e obrigatorio' });

      const nivelInt = parseInt(nivel, 10) || 1;
      const classeInt = parseInt(classe_id, 10);
      const slots = await db.HmSlotsClasse.getSlots(classeInt, nivelInt);
      return res.json({ slots });
    } catch (error) {
      log.error({ err: error }, 'Erro ao obter slots de magia');
      return res.status(500).json({ error: 'Erro ao obter slots de magia' });
    }
  }

  async obterDisponiveis(req, res) {
    try {
      const { classe_id, nivel } = req.query;
      if (!classe_id) return res.status(400).json({ error: 'classe_id e obrigatorio' });

      const classeInt = parseInt(classe_id, 10);
      const nivelInt = parseInt(nivel, 10) || 1;

      const vinculos = await db.HmClasse.findByClasse(classeInt);
      const magias = vinculos
        .map(v => v.habilidades_magias)
        .filter(h => h && h.nivel_requerido <= nivelInt && h.escola_magia && h.escola_magia !== 'nenhuma')
        .map(serializarHabilidade);

      return res.json(magias);
    } catch (error) {
      log.error({ err: error }, 'Erro ao obter magias disponiveis');
      return res.status(500).json({ error: 'Erro ao obter magias disponiveis' });
    }
  }
}

export default new HabilidadesController();
