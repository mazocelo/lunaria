import db from '../../Model/index.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

/**
 * Controller para gerenciar operações de desvantagens
 */
class DesvantagemController {
  
  /**
   * Criar uma nova desvantagem
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async criarDesvantagem(req, res, next) {
    try {
      console.log('📝 Criando nova desvantagem:', req.body);
      
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
      
      // Verificar se já existe uma desvantagem com o mesmo nome
      const desvantagemExistente = await db.Desvantagem.findByNome ? 
        await db.Desvantagem.findByNome(nome) : 
        await db.Desvantagem.findUnique({ where: { nome } });
      
      if (desvantagemExistente) {
        return res.status(400).json({ 
          error: 'Já existe uma desvantagem com este nome' 
        });
      }
      
      // Criar desvantagem no banco
      const novaDesvantagem = await db.Desvantagem.create({
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
      
      console.log('✅ Desvantagem criada com sucesso:', novaDesvantagem.id);
      
      res.status(201).json({
        success: true,
        message: 'Desvantagem criada com sucesso',
        data: novaDesvantagem
      });
      
    } catch (error) {
      console.error('❌ Erro ao criar desvantagem:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
  
  /**
   * Listar todas as desvantagens
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async listarDesvantagens(req, res, next) {
    try {
      const { tipo, elemento, nivel, usar, search, limit = 50, offset = 0 } = req.query;
      const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
      const parsedOffset = Math.max(parseInt(offset) || 0, 0);

      const result = await db.Desvantagem.findPaginated({
        limit: parsedLimit,
        offset: parsedOffset,
        tipo, elemento,
        nivel: nivel ? parseInt(nivel) : undefined,
        usar: usar ? parseInt(usar) : undefined,
        search
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          limit: parsedLimit,
          offset: parsedOffset,
          hasMore: parsedOffset + result.data.length < result.total
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar desvantagens:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
  
  /**
   * Obter uma desvantagem específica
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async obterDesvantagem(req, res, next) {
    try {
      const { id } = req.params;
      
      console.log(`🔍 Buscando desvantagem ID: ${id}`);
      
      const desvantagem = await db.Desvantagem.findById(parseInt(id));
      
      if (!desvantagem) {
        return res.status(404).json({
          error: 'Desvantagem não encontrada'
        });
      }
      
      console.log('✅ Desvantagem encontrada');
      
      res.status(200).json({
        success: true,
        data: desvantagem
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter desvantagem:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
  

  
  /**
   * Listar desvantagens por elemento
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async listarPorElemento(req, res, next) {
    try {
      const { elemento } = req.params;
      
      console.log(`📋 Listando desvantagens do elemento: ${elemento}`);
      
      const desvantagens = await db.Desvantagem.findByElemento(elemento);
      
      console.log(`✅ ${desvantagens.length} desvantagens encontradas do elemento ${elemento}`);
      
      res.status(200).json({
        success: true,
        data: desvantagens
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar desvantagens por elemento:', error);
      next(error);
    }
  }
  
  /**
   * Listar desvantagens por tipo
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async listarPorTipo(req, res, next) {
    try {
      const { tipo } = req.params;
      
      console.log(`📋 Listando desvantagens do tipo: ${tipo}`);
      
      const desvantagens = await db.Desvantagem.findByTipo(tipo);
      
      console.log(`✅ ${desvantagens.length} desvantagens encontradas do tipo ${tipo}`);
      
      res.status(200).json({
        success: true,
        data: desvantagens
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar desvantagens por tipo:', error);
      next(error);
    }
  }
  
  /**
   * Listar desvantagens por nível
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async listarPorNivel(req, res, next) {
    try {
      const { nivel } = req.params;
      
      console.log(`📋 Listando desvantagens do nível: ${nivel}`);
      
      const desvantagens = await db.Desvantagem.findByNivel(nivel);
      
      console.log(`✅ ${desvantagens.length} desvantagens encontradas do nível ${nivel}`);
      
      res.status(200).json({
        success: true,
        data: desvantagens
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar desvantagens por nível:', error);
      next(error);
    }
  }
  
  /**
   * Buscar desvantagens
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async buscarDesvantagens(req, res, next) {
    try {
      const { termo } = req.query;
      
      if (!termo) {
        return res.status(400).json({
          error: 'Termo de busca é obrigatório'
        });
      }
      
      console.log(`🔍 Buscando desvantagens com termo: ${termo}`);
      
      const desvantagens = await db.Desvantagem.search(termo);
      
      console.log(`✅ ${desvantagens.length} desvantagens encontradas para "${termo}"`);
      
      res.status(200).json({
        success: true,
        data: desvantagens
      });
      
    } catch (error) {
      console.error('❌ Erro ao buscar desvantagens:', error);
      next(error);
    }
  }
  
  /**
   * Obter estatísticas das desvantagens
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async obterEstatisticas(req, res, next) {
    try {
      console.log('📊 Obtendo estatísticas das desvantagens');
      
      const totalDesvantagens = await db.Desvantagem.count();
      
      // Para estatísticas por nível e por usar, vamos buscar todos e agrupar manualmente
      const todasDesvantagens = await db.Desvantagem.findAll();
      
      // Agrupar por nível
      const porNivel = {};
      todasDesvantagens.forEach(d => {
        const nivel = d.nivel || 'Sem nível';
        porNivel[nivel] = (porNivel[nivel] || 0) + 1;
      });
      
      // Agrupar por usar
      const porUsar = {};
      todasDesvantagens.forEach(d => {
        if (d.usar) {
          porUsar[d.usar] = (porUsar[d.usar] || 0) + 1;
        }
      });
      
      const estatisticas = {
        total: totalDesvantagens,
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
  async atualizarDesvantagem(req, res) {
    try {
      const { id } = req.params;
      const desvantagem = await db.Desvantagem.findById(parseInt(id));
      if (!desvantagem) {
        return res.status(404).json({ success: false, error: 'Desvantagem não encontrada' });
      }

      const { nome, descricao, custo, tipo, bonus, restricao, dano_base, efeito, usar, elemento, nivel, requisitos } = req.body;
      const dados = {};
      if (nome !== undefined) dados.nome = nome;
      if (descricao !== undefined) dados.descricao = descricao;
      if (custo !== undefined) dados.custo = parseInt(custo);
      if (tipo !== undefined) dados.tipo = tipo;
      if (bonus !== undefined) dados.bonus = bonus;
      if (restricao !== undefined) dados.restricao = restricao;
      if (dano_base !== undefined) dados.dano_base = dano_base;
      if (efeito !== undefined) dados.efeito = efeito;
      if (usar !== undefined) dados.usar = parseInt(usar);
      if (elemento !== undefined) dados.elemento = elemento;
      if (nivel !== undefined) dados.nivel = parseInt(nivel);
      if (requisitos !== undefined) dados.requisitos = requisitos;

      const atualizada = await db.Desvantagem.update(parseInt(id), dados);
      res.json({ success: true, message: 'Desvantagem atualizada com sucesso', data: atualizada });
    } catch (error) {
      console.error('❌ Erro ao atualizar desvantagem:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async deletarDesvantagem(req, res) {
    try {
      const { id } = req.params;
      const desvantagem = await db.Desvantagem.findById(parseInt(id));
      if (!desvantagem) {
        return res.status(404).json({ success: false, error: 'Desvantagem não encontrada' });
      }
      await db.Desvantagem.delete(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error('❌ Erro ao deletar desvantagem:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
}

export default new DesvantagemController(); 