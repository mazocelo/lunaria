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

      console.log('✅ Classe criada:', novaClasse.id);

      res.status(201).json({
        success: true,
        message: 'Classe criada com sucesso',
        data: novaClasse
      });

    } catch (error) {
      console.error('❌ Erro ao criar classe:', error);
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
      console.log('📋 Listando classes');

      const { limit = 50, offset = 0 } = req.query;

      const classes = await db.Classe.findAll();

      // Aplicar paginação manualmente se necessário
      const startIndex = parseInt(offset);
      const endIndex = startIndex + parseInt(limit);
      const classesPaginadas = classes.slice(startIndex, endIndex);

      console.log(`✅ ${classesPaginadas.length} classes encontradas`);

      res.status(200).json({
        success: true,
        data: classesPaginadas,
        total: classes.length,
        offset: parseInt(offset),
        limit: parseInt(limit)
      });

    } catch (error) {
      console.error('❌ Erro ao listar classes:', error);
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

      console.log(`🔍 Buscando classe ID: ${id}`);

      const classe = await db.Classe.findById(parseInt(id));

      if (!classe) {
        return res.status(404).json({
          error: 'Classe não encontrada'
        });
      }

      console.log('✅ Classe encontrada:', classe.nome);

      res.status(200).json({
        success: true,
        data: classe
      });

    } catch (error) {
      console.error('❌ Erro ao obter classe:', error);
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

      console.log(`🔍 Buscando classes por: ${termo}`);

      const classes = await db.Classe.search(termo);

      console.log(`✅ ${classes.length} classes encontradas`);

      res.status(200).json({
        success: true,
        data: classes,
        total: classes.length
      });

    } catch (error) {
      console.error('❌ Erro ao buscar classes:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
}

export default new ClasseController(); 