import db from '../../Model/index.js';
import logger from '../../helpers/logger.js';
import { serializarBonusEntidade, serializarClasseOuRaca } from '../../helpers/catalogJsonHelper.js';
import { getAvailableSystems } from '../../game-systems/index.js';

const log = logger.child({ module: 'racaController' });

/** Valida o query param `sistema`: ausente/vazio cai no default do Model. */
function resolveSistemaQuery(raw) {
  if (raw === undefined || raw === '') return { value: undefined };
  if (!getAvailableSystems().includes(raw)) {
    return { error: `sistema invalido. Use um de: ${getAvailableSystems().join(', ')}` };
  }
  return { value: raw };
}

function validateBonusPayload(body = {}) {
  const raw = body.bonus !== undefined ? body.bonus : body.atributos_bonus;
  if (raw === undefined || raw === null || raw === '') return { value: null };
  const serialized = serializarBonusEntidade(raw);
  if (!serialized) return { error: 'bonus/atributos_bonus deve ser um objeto JSON valido' };
  return { value: serialized };
}

class RacaController {
  async criarRaca(req, res) {
    try {
      log.info({ req_body: req.body }, 'Criando nova raca');

      const { nome, custo = 0, descricao = null } = req.body;

      if (!nome) {
        return res.status(400).json({ error: 'Nome e obrigatorio' });
      }
      if (custo < 0) {
        return res.status(400).json({ error: 'Custo deve ser maior ou igual a 0' });
      }

      const sistemaBody = resolveSistemaQuery(req.body.sistema);
      if (sistemaBody.error) return res.status(400).json({ error: sistemaBody.error });
      const sistema = sistemaBody.value ?? 'lunaria';

      const racaExistente = await db.Raca.findByNome(nome, sistema);
      if (racaExistente) {
        return res.status(400).json({ error: 'Ja existe uma raca com este nome' });
      }

      const bonus = validateBonusPayload(req.body);
      if (bonus.error) return res.status(400).json({ error: bonus.error });

      const novaRaca = await db.Raca.create({
        nome,
        custo,
        descricao,
        bonus: bonus.value,
        sistema
      });

      res.status(201).json({
        success: true,
        message: 'Raca criada com sucesso',
        data: serializarClasseOuRaca(novaRaca)
      });
    } catch (error) {
      log.error({ err: error }, 'Erro ao criar raca');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async listarRacas(req, res) {
    try {
      const { limit, offset } = req.query;
      const sistemaQuery = resolveSistemaQuery(req.query.sistema);
      if (sistemaQuery.error) return res.status(400).json({ error: sistemaQuery.error });
      const sistema = sistemaQuery.value;

      if (limit !== undefined) {
        const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
        const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);
        const result = await db.Raca.findPaginated({ limit: parsedLimit, offset: parsedOffset, sistema });
        return res.status(200).json({
          success: true,
          data: result.data.map(serializarClasseOuRaca),
          pagination: {
            total: result.total,
            limit: parsedLimit,
            offset: parsedOffset,
            hasMore: parsedOffset + result.data.length < result.total
          }
        });
      }

      const data = await db.Raca.findAll(sistema);
      res.status(200).json({
        success: true,
        data: data.map(serializarClasseOuRaca),
        pagination: { total: data.length, limit: data.length, offset: 0, hasMore: false }
      });
    } catch (error) {
      log.error({ err: error }, 'Erro ao listar racas');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async obterRaca(req, res) {
    try {
      const raca = await db.Raca.findById(parseInt(req.params.id, 10));
      if (!raca) {
        return res.status(404).json({ error: 'Raca nao encontrada' });
      }

      res.status(200).json({
        success: true,
        data: serializarClasseOuRaca(raca)
      });
    } catch (error) {
      log.error({ err: error }, 'Erro ao obter raca');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async buscarRacas(req, res) {
    try {
      const { termo } = req.query;

      if (!termo) {
        return res.status(400).json({ error: 'Termo de busca e obrigatorio' });
      }

      const racas = await db.Raca.search(termo);
      res.status(200).json({
        success: true,
        data: racas.map(serializarClasseOuRaca),
        total: racas.length
      });
    } catch (error) {
      log.error({ err: error }, 'Erro ao buscar racas');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async atualizarRaca(req, res) {
    try {
      const { id } = req.params;
      const raca = await db.Raca.findById(parseInt(id, 10));
      if (!raca) {
        return res.status(404).json({ success: false, error: 'Raca nao encontrada' });
      }

      const { nome, custo, descricao } = req.body;
      const dados = {};
      if (nome !== undefined) dados.nome = nome;
      if (custo !== undefined) dados.custo = custo;
      if (descricao !== undefined) dados.descricao = descricao;
      if (req.body.bonus !== undefined || req.body.atributos_bonus !== undefined) {
        const bonus = validateBonusPayload(req.body);
        if (bonus.error) return res.status(400).json({ success: false, error: bonus.error });
        dados.bonus = bonus.value;
      }

      const atualizada = await db.Raca.update(parseInt(id, 10), dados);
      res.json({
        success: true,
        message: 'Raca atualizada com sucesso',
        data: serializarClasseOuRaca(atualizada)
      });
    } catch (error) {
      log.error({ err: error }, 'Erro ao atualizar raca');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async deletarRaca(req, res) {
    try {
      const { id } = req.params;
      const raca = await db.Raca.findById(parseInt(id, 10));
      if (!raca) {
        return res.status(404).json({ success: false, error: 'Raca nao encontrada' });
      }
      await db.Raca.delete(parseInt(id, 10));
      res.status(204).send();
    } catch (error) {
      log.error({ err: error }, 'Erro ao deletar raca');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
}

export default new RacaController();
