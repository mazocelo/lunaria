import db from '../../Model/index.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import logger from '../../helpers/logger.js';
const log = logger.child({ module: 'racaController' });

/**
 * Controller para gerenciar operações de raça
 */
class RacaController {

  /**
   * Criar uma nova raça
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async criarRaca(req, res, next) {
    try {
      log.info({ req_body: req.body }, 'Criando nova raça');

      const { nome, custo = 0, descricao = null, bonus = null } = req.body;

      // Validações básicas
      if (!nome) {
        return res.status(400).json({
          error: 'Nome é obrigatório'
        });
      }

      if (custo < 0) {
        return res.status(400).json({
          error: 'Custo deve ser maior ou igual a 0'
        });
      }

      // Verificar se já existe uma raça com este nome
      const racaExistente = await db.Raca.findByNome(nome);
      if (racaExistente) {
        return res.status(400).json({
          error: 'Já existe uma raça com este nome'
        });
      }

      // Criar raça no banco
      const novaRaca = await db.Raca.create({
        nome,
        custo,
        descricao,
        bonus: bonus ? JSON.stringify(bonus) : null
      });

      log.info({ novaRaca_id: novaRaca.id }, 'Raça criada');

      res.status(201).json({
        success: true,
        message: 'Raça criada com sucesso',
        data: novaRaca
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao criar raça');
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Listar todas as raças
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async listarRacas(req, res, next) {
    try {
      const { limit, offset } = req.query;

      if (limit !== undefined) {
        const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const parsedOffset = Math.max(parseInt(offset) || 0, 0);
        const result = await db.Raca.findPaginated({ limit: parsedLimit, offset: parsedOffset });
        return res.status(200).json({
          success: true,
          data: result.data,
          pagination: {
            total: result.total,
            limit: parsedLimit,
            offset: parsedOffset,
            hasMore: parsedOffset + result.data.length < result.total
          }
        });
      }

      const data = await db.Raca.findAll();
      res.status(200).json({
        success: true,
        data,
        pagination: { total: data.length, limit: data.length, offset: 0, hasMore: false }
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao listar raças');
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obter uma raça específica
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async obterRaca(req, res, next) {
    try {
      const { id } = req.params;

      log.info({ id: id }, 'Buscando raça ID');

      const raca = await db.Raca.findById(parseInt(id));

      if (!raca) {
        return res.status(404).json({
          error: 'Raça não encontrada'
        });
      }

      log.info({ raca_nome: raca.nome }, 'Raça encontrada');

      res.status(200).json({
        success: true,
        data: raca
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao obter raça');
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }



  /**
   * Buscar raças por nome
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async buscarRacas(req, res, next) {
    try {
      const { termo } = req.query;

      if (!termo) {
        return res.status(400).json({
          error: 'Termo de busca é obrigatório'
        });
      }

      log.info({ termo: termo }, 'Buscando raças por');

      const racas = await db.Raca.search(termo);

      log.info({ racas_length: racas.length }, 'raças encontradas');

      res.status(200).json({
        success: true,
        data: racas,
        total: racas.length
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao buscar raças');
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
  async atualizarRaca(req, res) {
    try {
      const { id } = req.params;
      const raca = await db.Raca.findById(parseInt(id));
      if (!raca) {
        return res.status(404).json({ success: false, error: 'Raça não encontrada' });
      }

      const { nome, custo, descricao, bonus } = req.body;
      const dados = {};
      if (nome !== undefined) dados.nome = nome;
      if (custo !== undefined) dados.custo = custo;
      if (descricao !== undefined) dados.descricao = descricao;
      if (bonus !== undefined) dados.bonus = bonus ? JSON.stringify(bonus) : null;

      const atualizada = await db.Raca.update(parseInt(id), dados);
      res.json({ success: true, message: 'Raça atualizada com sucesso', data: atualizada });
    } catch (error) {
      log.error({ err: error }, 'Erro ao atualizar raça');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async deletarRaca(req, res) {
    try {
      const { id } = req.params;
      const raca = await db.Raca.findById(parseInt(id));
      if (!raca) {
        return res.status(404).json({ success: false, error: 'Raça não encontrada' });
      }
      await db.Raca.delete(parseInt(id));
      res.status(204).send();
    } catch (error) {
      log.error({ err: error }, 'Erro ao deletar raça');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
}

export default new RacaController(); 