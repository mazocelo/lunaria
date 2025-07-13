import db from '../../Model/index.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

/**
 * Controller para gerenciar operações de habilidades
 */
class HabilidadeController {
  
  /**
   * Criar uma nova habilidade
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async criarHabilidade(req, res, next) {
    try {
      console.log('📝 Criando nova habilidade:', req.body);
      
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
      
      // Verificar se já existe uma habilidade com o mesmo nome
      const habilidadeExistente = await db.Habilidade.findOne({
        where: { nome }
      });
      
      if (habilidadeExistente) {
        return res.status(400).json({ 
          error: 'Já existe uma habilidade com este nome' 
        });
      }
      
      // Criar habilidade no banco
      const novaHabilidade = await db.Habilidade.create({
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
      
      console.log('✅ Habilidade criada com sucesso:', novaHabilidade.id);
      
      res.status(201).json({
        success: true,
        message: 'Habilidade criada com sucesso',
        data: novaHabilidade
      });
      
    } catch (error) {
      console.error('❌ Erro ao criar habilidade:', error);
      next(error);
    }
  }
  
  /**
   * Listar todas as habilidades
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async listarHabilidades(req, res, next) {
    try {
      console.log('📋 Listando habilidades...');
      
      const { 
        tipo, 
        elemento, 
        nivel,
        usar,
        search,
        limit, 
        offset
      } = req.query;
      
      console.log('req.query keys', req.query);

    
      // Construir filtros
      const where = {};
      if (tipo) where.tipo = tipo;
      if (elemento) where.elemento = elemento;
      if (nivel) where.nivel = nivel;
      if (usar) where.usar = usar;
      
      let habilidades;
      // Se há termo de busca, usar método de busca
      if (search) {
        habilidades = await db.Habilidade.search(search);
      } 
      else if(limit || offset){
        habilidades = await db.Habilidade.findAll({
          where,
          limit: parseInt(limit),
          offset: parseInt(offset),
          order: [['nome', 'ASC']]
        });
      }
       else if(Object.keys(where).length > 0){
        habilidades = await db.Habilidade.findAll({
          where,
          order: [['nome', 'ASC']]
        }); 
      } else {
        habilidades = await db.Habilidade.findAll({
          order: [['nome', 'ASC']]
        });
      }
      
      const total = await db.Habilidade.count({ where });
      
      console.log(`✅ ${habilidades.length} habilidades encontradas`);
      
      res.status(200).json({
        success: true,
        data: habilidades,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: offset + habilidades.length < total
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar habilidades:', error);
      next(error);
    }
  }
  
  /**
   * Obter uma habilidade específica
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async obterHabilidade(req, res, next) {
    try {
      const { id } = req.params;
      
      console.log(`🔍 Buscando habilidade ID: ${id}`);
      
      const habilidade = await db.Habilidade.findByPk(id);
      
      if (!habilidade) {
        return res.status(404).json({
          error: 'Habilidade não encontrada'
        });
      }
      
      console.log('✅ Habilidade encontrada');
      
      res.status(200).json({
        success: true,
        data: habilidade
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter habilidade:', error);
      next(error);
    }
  }
  
  /**
   * Atualizar uma habilidade
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async atualizarHabilidade(req, res, next) {
    try {
      const { id } = req.params;
      const dadosAtualizacao = req.body;
      
      console.log(`📝 Atualizando habilidade ID: ${id}`, dadosAtualizacao);
      
      const habilidade = await db.Habilidade.findByPk(id);
      
      if (!habilidade) {
        return res.status(404).json({
          error: 'Habilidade não encontrada'
        });
      }
      
      // Se o nome está sendo alterado, verificar se já existe
      if (dadosAtualizacao.nome && dadosAtualizacao.nome !== habilidade.nome) {
        const habilidadeExistente = await db.Habilidade.findOne({
          where: { nome: dadosAtualizacao.nome }
        });
        
        if (habilidadeExistente) {
          return res.status(400).json({
            error: 'Já existe uma habilidade com este nome'
          });
        }
      }
      
      // Atualizar dados
      Object.assign(habilidade, dadosAtualizacao, {
        atualizada_em: new Date()
      });
      
      await habilidade.save();
      
      console.log('✅ Habilidade atualizada com sucesso');
      
      res.status(200).json({
        success: true,
        message: 'Habilidade atualizada com sucesso',
        data: habilidade
      });
      
    } catch (error) {
      console.error('❌ Erro ao atualizar habilidade:', error);
      next(error);
    }
  }
  
  /**
   * Excluir uma habilidade
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async excluirHabilidade(req, res, next) {
    try {
      const { id } = req.params;
      
      console.log(`🗑️ Excluindo habilidade ID: ${id}`);
      
      const habilidade = await db.Habilidade.findByPk(id);
      
      if (!habilidade) {
        return res.status(404).json({
          error: 'Habilidade não encontrada'
        });
      }
      
      await habilidade.destroy();
      
      console.log('✅ Habilidade excluída com sucesso');
      
      res.status(200).json({
        success: true,
        message: 'Habilidade excluída com sucesso'
      });
      
    } catch (error) {
      console.error('❌ Erro ao excluir habilidade:', error);
      next(error);
    }
  }
  
  /**
   * Listar habilidades por elemento
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async listarPorElemento(req, res, next) {
    try {
      const { elemento } = req.params;
      
      console.log(`📋 Listando habilidades do elemento: ${elemento}`);
      
      const habilidades = await db.Habilidade.findByElemento(elemento);
      
      console.log(`✅ ${habilidades.length} habilidades encontradas do elemento ${elemento}`);
      
      res.status(200).json({
        success: true,
        data: habilidades
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar habilidades por elemento:', error);
      next(error);
    }
  }
  
  /**
   * Listar habilidades por tipo
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async listarPorTipo(req, res, next) {
    try {
      const { tipo } = req.params;
      
      console.log(`📋 Listando habilidades do tipo: ${tipo}`);
      
      const habilidades = await db.Habilidade.findByTipo(tipo);
      
      console.log(`✅ ${habilidades.length} habilidades encontradas do tipo ${tipo}`);
      
      res.status(200).json({
        success: true,
        data: habilidades
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar habilidades por tipo:', error);
      next(error);
    }
  }
  
  /**
   * Listar habilidades por nível
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async listarPorNivel(req, res, next) {
    try {
      const { nivel } = req.params;
      
      console.log(`📋 Listando habilidades do nível: ${nivel}`);
      
      const habilidades = await db.Habilidade.findByNivel(nivel);
      
      console.log(`✅ ${habilidades.length} habilidades encontradas do nível ${nivel}`);
      
      res.status(200).json({
        success: true,
        data: habilidades
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar habilidades por nível:', error);
      next(error);
    }
  }
  
  /**
   * Buscar habilidades
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async buscarHabilidades(req, res, next) {
    try {
      const { termo } = req.query;
      
      if (!termo) {
        return res.status(400).json({
          error: 'Termo de busca é obrigatório'
        });
      }
      
      console.log(`🔍 Buscando habilidades com termo: ${termo}`);
      
      const habilidades = await db.Habilidade.search(termo);
      
      console.log(`✅ ${habilidades.length} habilidades encontradas para "${termo}"`);
      
      res.status(200).json({
        success: true,
        data: habilidades
      });
      
    } catch (error) {
      console.error('❌ Erro ao buscar habilidades:', error);
      next(error);
    }
  }
  
  /**
   * Obter estatísticas das habilidades
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async obterEstatisticas(req, res, next) {
    try {
      console.log('📊 Obtendo estatísticas das habilidades');
      
      const [
        totalHabilidades,
        porNivel,
        porUsar
      ] = await Promise.all([
        db.Habilidade.count(),
        db.Habilidade.findAll({
          attributes: [
            'nivel',
            [db.sequelize.fn('COUNT', '*'), 'total']
          ],
          group: ['nivel'],
          order: [['nivel', 'ASC']]
        }),
        db.Habilidade.findAll({
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
        total: totalHabilidades,
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

export default new HabilidadeController(); 