import db from '../../Model/index.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

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
      console.log('🏃 Criando nova raça:', req.body);

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
      const racaExistente = await db.Raca.findOne({ where: { nome } });
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

      console.log('✅ Raça criada:', novaRaca.id);

      res.status(201).json({
        success: true,
        message: 'Raça criada com sucesso',
        data: novaRaca
      });

    } catch (error) {
      console.error('❌ Erro ao criar raça:', error);
      next(error);
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
      console.log('📋 Listando raças...');

      const { limit = 50, offset = 0 } = req.query;

      const racas = await db.Raca.findAll({
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['nome', 'ASC']]
      });

      const total = await db.Raca.count();

      console.log(`✅ ${racas.length} raças encontradas`);

      res.status(200).json({
        success: true,
        data: racas,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: offset + racas.length < total
        }
      });

    } catch (error) {
      console.error('❌ Erro ao listar raças:', error);
      next(error);
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

      console.log(`🔍 Buscando raça ID: ${id}`);

      const raca = await db.Raca.findByPk(id);

      if (!raca) {
        return res.status(404).json({
          error: 'Raça não encontrada'
        });
      }

      console.log('✅ Raça encontrada');

      res.status(200).json({
        success: true,
        data: raca
      });

    } catch (error) {
      console.error('❌ Erro ao obter raça:', error);
      next(error);
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

      console.log(`🔍 Buscando raças com termo: ${termo}`);

      if (!termo) {
        return res.status(400).json({
          error: 'Termo de busca é obrigatório'
        });
      }

      const racas = await db.Raca.findAll({
        where: {
          nome: {
            [db.Sequelize.Op.iLike]: `%${termo}%`
          }
        },
        order: [['nome', 'ASC']]
      });

      console.log(`✅ ${racas.length} raças encontradas`);

      res.status(200).json({
        success: true,
        data: racas
      });

    } catch (error) {
      console.error('❌ Erro ao buscar raças:', error);
      next(error);
    }
  }
}

export default new RacaController(); 