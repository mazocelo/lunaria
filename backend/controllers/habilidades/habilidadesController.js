import db from '../../Model/index.js';
import { normalizarElemento, ELEMENTOS } from '../../config/domainConstants.js';
import logger from '../../helpers/logger.js';
const log = logger.child({ module: 'habilidadesController' });

function parseElementoScalar(raw) {
  if (raw === undefined) return { value: undefined };
  if (raw === null || raw === '') return { value: null };
  const normalizado = normalizarElemento(raw);
  if (!normalizado) {
    return { error: `Elemento invalido: ${raw}. Validos: ${ELEMENTOS.join(', ')}` };
  }
  return { value: normalizado };
}

function buildData(body) {
  return {
    nome: body.nome,
    descricao: body.descricao,
    custo_mana: body.custo_mana ?? 0,
    dano_base: body.dano_base || null,
    tipo: body.tipo || 'dano',
    elemento: body.elemento || null,
    nivel_requerido: body.nivel_requerido ?? 1,
    cooldown_turnos: body.cooldown_turnos ?? 0,
    classe_id: body.classe_id ? parseInt(body.classe_id) : null,
    efeito: body.efeito || null,
    alvo: body.alvo || 'inimigo',
    alcance: body.alcance || 'medio',
    area_efeito: body.area_efeito || null,
    tempo_conjuracao: body.tempo_conjuracao || 'acao',
    usa_concentracao: body.usa_concentracao ?? false,
    categoria: body.categoria || 'combate_fisico',
    escola_magia: body.escola_magia || null,
    escalamento: body.escalamento || null,
    pre_requisito: body.pre_requisito || null,
    raca_id: body.raca_id ? parseInt(body.raca_id) : null,
    usos_por_descanso: body.usos_por_descanso ?? null,
    componente_material: body.componente_material || null,
    saving_throw: body.saving_throw || null,
  };
}

function buildUpdateData(body) {
  const data = {};
  const strFields = ['nome', 'descricao', 'tipo', 'alvo', 'alcance', 'tempo_conjuracao', 'categoria'];
  const nullStrFields = ['dano_base', 'elemento', 'escola_magia', 'saving_throw'];
  const intFields = ['custo_mana', 'nivel_requerido', 'cooldown_turnos'];
  const jsonFields = ['efeito', 'area_efeito', 'escalamento', 'pre_requisito', 'componente_material'];
  const fkFields = ['classe_id', 'raca_id'];

  for (const f of strFields) if (body[f] !== undefined) data[f] = body[f];
  for (const f of nullStrFields) if (body[f] !== undefined) data[f] = body[f] || null;
  for (const f of intFields) if (body[f] !== undefined) data[f] = parseInt(body[f]);
  for (const f of jsonFields) if (body[f] !== undefined) data[f] = body[f] || null;
  for (const f of fkFields) if (body[f] !== undefined) data[f] = body[f] ? parseInt(body[f]) : null;
  if (body.usa_concentracao !== undefined) data.usa_concentracao = Boolean(body.usa_concentracao);
  if (body.usos_por_descanso !== undefined) data.usos_por_descanso = body.usos_por_descanso != null ? parseInt(body.usos_por_descanso) : null;

  return data;
}

class HabilidadesController {

  async criarHabilidade(req, res) {
    try {
      if (!req.body.nome || !req.body.descricao) {
        return res.status(400).json({ error: 'Nome e descricao sao obrigatorios' });
      }
      const elemento = parseElementoScalar(req.body.elemento);
      if (elemento.error) return res.status(400).json({ error: elemento.error });

      const habilidade = await db.Habilidade.create({
        data: buildData({ ...req.body, elemento: elemento.value })
      });
      return res.status(201).json(habilidade);
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

      const result = await db.Habilidade.findPaginated({
        limit: parseInt(limit), offset: parseInt(offset),
        tipo, elemento: elementoFiltro.value, classe_id, nivel, busca, categoria, escola_magia, raca_id, alcance
      });

      return res.json({
        data: result.data,
        total: result.total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + result.data.length < result.total
      });
    } catch (error) {
      log.error({ err: error }, 'Erro ao listar habilidades');
      return res.status(500).json({ error: 'Erro ao listar habilidades' });
    }
  }

  async obterHabilidade(req, res) {
    try {
      const habilidade = await db.Habilidade.findById(parseInt(req.params.id));
      if (!habilidade) return res.status(404).json({ error: 'Habilidade nao encontrada' });
      return res.json(habilidade);
    } catch (error) {
      log.error({ err: error }, 'Erro ao obter habilidade');
      return res.status(500).json({ error: 'Erro ao obter habilidade' });
    }
  }

  async atualizarHabilidade(req, res) {
    try {
      const elemento = parseElementoScalar(req.body.elemento);
      if (elemento.error) return res.status(400).json({ error: elemento.error });

      const habilidade = await db.Habilidade.update(
        parseInt(req.params.id),
        buildUpdateData({ ...req.body, elemento: elemento.value })
      );
      return res.json(habilidade);
    } catch (error) {
      log.error({ err: error }, 'Erro ao atualizar habilidade');
      if (error.code === 'P2025') return res.status(404).json({ error: 'Habilidade nao encontrada' });
      if (error.code === 'P2002') return res.status(409).json({ error: 'Ja existe uma habilidade com esse nome' });
      return res.status(500).json({ error: 'Erro ao atualizar habilidade' });
    }
  }

  async deletarHabilidade(req, res) {
    try {
      await db.Habilidade.delete(parseInt(req.params.id));
      return res.json({ message: 'Habilidade deletada com sucesso' });
    } catch (error) {
      log.error({ err: error }, 'Erro ao deletar habilidade');
      if (error.code === 'P2025') return res.status(404).json({ error: 'Habilidade nao encontrada' });
      return res.status(500).json({ error: 'Erro ao deletar habilidade' });
    }
  }

  async obterEstatisticas(req, res) {
    try {
      const stats = await db.Habilidade.getEstatisticas();
      return res.json(stats);
    } catch (error) {
      log.error({ err: error }, 'Erro ao obter estatisticas');
      return res.status(500).json({ error: 'Erro ao obter estatisticas' });
    }
  }
}

export default new HabilidadesController();
