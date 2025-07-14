import db from '../../Model/index.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

/**
 * Controller para gerenciar operações de vantagens
 */
class VantagemController {
  
  /**
   * Criar uma nova vantagem
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async criarVantagem(req, res, next) {
    try {
      console.log('📝 Criando nova vantagem:', req.body);
      
      const {
        nome,
        descricao,
        custo,
        tipo,
        bonus,
        restricao,
        dano_base,
        efeito,
        usar,
        elemento,
        nivel,
        requisitos
      } = req.body;
      
      // Validações básicas
      if (!nome || !descricao) {
        return res.status(400).json({ 
          error: 'Nome e descrição são obrigatórios' 
        });
      }
      
      // Verificar se já existe uma vantagem com o mesmo nome
      const vantagemExistente = await db.Vantagem.findOne({
        where: { nome }
      });
      
      if (vantagemExistente) {
        return res.status(400).json({ 
          error: 'Já existe uma vantagem com este nome' 
        });
      }
      
      // Criar vantagem no banco
      const novaVantagem = await db.Vantagem.create({
        nome,
        descricao,
        custo: custo || 0,
        tipo: Array.isArray(tipo) ? tipo : [tipo || 'ativa'],
        bonus: bonus || {},
        restricao: restricao || {},
        dano_base,
        efeito: efeito || {},
        usar: usar || null,
        elemento: Array.isArray(elemento) ? elemento : [elemento],
        nivel: nivel || 1,
        requisitos: requisitos || {}
      });
      
      console.log('✅ Vantagem criada com sucesso:', novaVantagem.id);
      
      res.status(201).json({
        success: true,
        message: 'Vantagem criada com sucesso',
        data: novaVantagem
      });
      
    } catch (error) {
      console.error('❌ Erro ao criar vantagem:', error);
      next(error);
    }
  }
  
  /**
   * Listar todas as vantagens
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async listarVantagens(req, res, next) {
    try {
      console.log('📋 Listando vantagens...');
      
      const { 
        tipo, 
        elemento, 
        nivel,
        usar,
        search,
        limit, 
        offset
      } = req.query;
          
      // Construir filtros
      const where = {};
      if (tipo) where.tipo = tipo;
      if (elemento) where.elemento = elemento;
      if (nivel) where.nivel = nivel;
      if (usar) where.usar = usar;
      
      let vantagens;
      // Se há termo de busca, usar método de busca
      if (search) {
        vantagens = await db.Vantagem.search(search);
      } 
      else if(limit || offset){
        vantagens = await db.Vantagem.findAll({
          where,
          limit: parseInt(limit),
          offset: parseInt(offset),
          order: [['nome', 'ASC']]
        });
      }
       else if(Object.keys(where).length > 0){
        vantagens = await db.Vantagem.findAll({
          where,
          order: [['nome', 'ASC']]
        }); 
      } else {
        vantagens = await db.Vantagem.findAll({
          order: [['nome', 'ASC']]
        });
      }
      
      const total = await db.Vantagem.count({ where });
      
      console.log(`✅ ${vantagens.length} vantagens encontradas`);
      
      res.status(200).json({
        success: true,
        data: vantagens,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: offset + vantagens.length < total
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar vantagens:', error);
      next(error);
    }
  }
  
  /**
   * Obter uma vantagem específica
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async obterVantagem(req, res, next) {
    try {
      const { id } = req.params;
      
      console.log(`🔍 Buscando vantagem ID: ${id}`);
      
      const vantagem = await db.Vantagem.findByPk(id);
      
      if (!vantagem) {
        return res.status(404).json({
          error: 'Vantagem não encontrada'
        });
      }
      
      console.log('✅ Vantagem encontrada');
      
      res.status(200).json({
        success: true,
        data: vantagem
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter vantagem:', error);
      next(error);
    }
  }
  

  
  /**
   * Listar vantagens por elemento
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async listarPorElemento(req, res, next) {
    try {
      const { elemento } = req.params;
      
      console.log(`📋 Listando vantagens do elemento: ${elemento}`);
      
      const vantagens = await db.Vantagem.findByElemento(elemento);
      
      console.log(`✅ ${vantagens.length} vantagens encontradas do elemento ${elemento}`);
      
      res.status(200).json({
        success: true,
        data: vantagens
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar vantagens por elemento:', error);
      next(error);
    }
  }
  
  /**
   * Listar vantagens por tipo
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async listarPorTipo(req, res, next) {
    try {
      const { tipo } = req.params;
      
      console.log(`📋 Listando vantagens do tipo: ${tipo}`);
      
      const vantagens = await db.Vantagem.findByTipo(tipo);
      
      console.log(`✅ ${vantagens.length} vantagens encontradas do tipo ${tipo}`);
      
      res.status(200).json({
        success: true,
        data: vantagens
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar vantagens por tipo:', error);
      next(error);
    }
  }
  
  /**
   * Listar vantagens por nível
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async listarPorNivel(req, res, next) {
    try {
      const { nivel } = req.params;
      
      console.log(`📋 Listando vantagens do nível: ${nivel}`);
      
      const vantagens = await db.Vantagem.findByNivel(nivel);
      
      console.log(`✅ ${vantagens.length} vantagens encontradas do nível ${nivel}`);
      
      res.status(200).json({
        success: true,
        data: vantagens
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar vantagens por nível:', error);
      next(error);
    }
  }
  
  /**
   * Buscar vantagens
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async buscarVantagens(req, res, next) {
    try {
      const { termo } = req.query;
      
      if (!termo) {
        return res.status(400).json({
          error: 'Termo de busca é obrigatório'
        });
      }
      
      console.log(`🔍 Buscando vantagens com termo: ${termo}`);
      
      const vantagens = await db.Vantagem.search(termo);
      
      console.log(`✅ ${vantagens.length} vantagens encontradas para "${termo}"`);
      
      res.status(200).json({
        success: true,
        data: vantagens
      });
      
    } catch (error) {
      console.error('❌ Erro ao buscar vantagens:', error);
      next(error);
    }
  }
  
  /**
   * Obter estatísticas das vantagens
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async obterEstatisticas(req, res, next) {
    try {
      console.log('📊 Obtendo estatísticas das vantagens');
      
      const [
        totalVantagens,
        porNivel,
        porUsar
      ] = await Promise.all([
        db.Vantagem.count(),
        db.Vantagem.findAll({
          attributes: [
            'nivel',
            [db.sequelize.fn('COUNT', '*'), 'total']
          ],
          group: ['nivel'],
          order: [['nivel', 'ASC']]
        }),
        db.Vantagem.findAll({
          attributes: [
            'usar',
            [db.sequelize.fn('COUNT', '*'), 'total']
          ],
          where: { usar: { [db.sequelize.Op.ne]: null } },
          group: ['usar'],
          order: [['usar', 'ASC']]
        })
      ]);
      
      const estatisticas = {
        total: totalVantagens,
        porNivel,
        porUsar
      };
      
      console.log('✅ Estatísticas obtidas com sucesso');
      
      res.status(200).json({
        success: true,
        data: estatisticas
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      next(error);
    }
  }
}

export default new VantagemController(); 