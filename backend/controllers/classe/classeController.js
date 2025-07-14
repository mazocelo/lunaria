import db from '../../Model/index.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

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
      console.log('⚔️ Criando nova classe:', req.body);

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
      const classeExistente = await db.Classe.findOne({ where: { nome } });
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

      console.log('✅ Classe criada:', novaClasse.id);

      res.status(201).json({
        success: true,
        message: 'Classe criada com sucesso',
        data: novaClasse
      });

    } catch (error) {
      console.error('❌ Erro ao criar classe:', error);
      next(error);
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
      console.log('📋 Listando classes...');

      const { limit = 50, offset = 0 } = req.query;

      const classes = await db.Classe.findAll({
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['nome', 'ASC']]
      });

      const total = await db.Classe.count();

      console.log(`✅ ${classes.length} classes encontradas`);

      res.status(200).json({
        success: true,
        data: classes,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: offset + classes.length < total
        }
      });

    } catch (error) {
      console.error('❌ Erro ao listar classes:', error);
      next(error);
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

      console.log(`🔍 Buscando classe ID: ${id}`);

      const classe = await db.Classe.findByPk(id);

      if (!classe) {
        return res.status(404).json({
          error: 'Classe não encontrada'
        });
      }

      console.log('✅ Classe encontrada');

      res.status(200).json({
        success: true,
        data: classe
      });

    } catch (error) {
      console.error('❌ Erro ao obter classe:', error);
      next(error);
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

      console.log(`🔍 Buscando classes com termo: ${termo}`);

      if (!termo) {
        return res.status(400).json({
          error: 'Termo de busca é obrigatório'
        });
      }

      const classes = await db.Classe.findAll({
        where: {
          nome: {
            [db.Sequelize.Op.iLike]: `%${termo}%`
          }
        },
        order: [['nome', 'ASC']]
      });

      console.log(`✅ ${classes.length} classes encontradas`);

      res.status(200).json({
        success: true,
        data: classes
      });

    } catch (error) {
      console.error('❌ Erro ao buscar classes:', error);
      next(error);
    }
  }
}

export default new ClasseController(); 