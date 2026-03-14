import db from '../../Model/index.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import logger from '../../helpers/logger.js';
const log = logger.child({ module: 'classeController' });

/**
 * Controller para gerenciar operações de classe
 */
class ClasseController {

  /**
   * Criar uma nova classe
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async criarClasse(req, res, next) {
    try {
      log.info({ body: req.body }, 'Criando nova classe');

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

      // Verificar se já existe uma classe com este nome
      const classeExistente = await db.Classe.findByNome(nome);
      if (classeExistente) {
        return res.status(400).json({
          error: 'Já existe uma classe com este nome'
        });
      }

      // Criar classe no banco
      const novaClasse = await db.Classe.create({
        nome,
        custo,
        descricao,
        bonus: bonus ? JSON.stringify(bonus) : null
      });

      log.info({ id: novaClasse.id }, 'Classe criada');

      res.status(201).json({
        success: true,
        message: 'Classe criada com sucesso',
        data: novaClasse
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao criar classe');
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Listar todas as classes
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async listarClasses(req, res, next) {
    try {
      const { limit, offset } = req.query;

      if (limit !== undefined) {
        const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const parsedOffset = Math.max(parseInt(offset) || 0, 0);
        const result = await db.Classe.findPaginated({ limit: parsedLimit, offset: parsedOffset });
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

      const data = await db.Classe.findAll();
      res.status(200).json({
        success: true,
        data,
        pagination: { total: data.length, limit: data.length, offset: 0, hasMore: false }
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao listar classes');
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obter uma classe específica
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async obterClasse(req, res, next) {
    try {
      const { id } = req.params;

      log.info({ id }, 'Buscando classe');

      const classe = await db.Classe.findById(parseInt(id));

      if (!classe) {
        return res.status(404).json({
          error: 'Classe não encontrada'
        });
      }

      log.info({ nome: classe.nome }, 'Classe encontrada');

      res.status(200).json({
        success: true,
        data: classe
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao obter classe');
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Buscar classes por nome
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async buscarClasses(req, res, next) {
    try {
      const { termo } = req.query;

      if (!termo) {
        return res.status(400).json({
          error: 'Termo de busca é obrigatório'
        });
      }

      log.info({ termo }, 'Buscando classes');

      const classes = await db.Classe.search(termo);

      log.info({ count: classes.length }, 'Classes encontradas');

      res.status(200).json({
        success: true,
        data: classes,
        total: classes.length
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao buscar classes');
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
  async atualizarClasse(req, res) {
    try {
      const { id } = req.params;
      const classe = await db.Classe.findById(parseInt(id));
      if (!classe) {
        return res.status(404).json({ success: false, error: 'Classe não encontrada' });
      }

      const { nome, custo, descricao, bonus } = req.body;
      const dados = {};
      if (nome !== undefined) dados.nome = nome;
      if (custo !== undefined) dados.custo = custo;
      if (descricao !== undefined) dados.descricao = descricao;
      if (bonus !== undefined) dados.bonus = bonus ? JSON.stringify(bonus) : null;

      const atualizada = await db.Classe.update(parseInt(id), dados);
      res.json({ success: true, message: 'Classe atualizada com sucesso', data: atualizada });
    } catch (error) {
      log.error({ err: error }, 'Erro ao atualizar classe');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async deletarClasse(req, res) {
    try {
      const { id } = req.params;
      const classe = await db.Classe.findById(parseInt(id));
      if (!classe) {
        return res.status(404).json({ success: false, error: 'Classe não encontrada' });
      }
      await db.Classe.delete(parseInt(id));
      res.status(204).send();
    } catch (error) {
      log.error({ err: error }, 'Erro ao deletar classe');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
}

export default new ClasseController(); 