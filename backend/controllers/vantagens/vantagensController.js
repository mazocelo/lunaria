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
      const vantagemExistente = await db.Vantagem.findByNome ? 
        await db.Vantagem.findByNome(nome) : 
        await db.Vantagem.findUnique({ where: { nome } });
      
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
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
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
      
      let vantagens = [];
      
      // Se há termo de busca, usar método de busca
      if (search) {
        vantagens = await db.Vantagem.search(search);
      } 
      else if (tipo) {
        vantagens = await db.Vantagem.findByTipo(tipo);
      }
      else if (elemento) {
        vantagens = await db.Vantagem.findByElemento(elemento);
      }
      else if (nivel) {
        vantagens = await db.Vantagem.findByNivel(parseInt(nivel));
      }
      else if (usar) {
        vantagens = await db.Vantagem.findByUsar(parseInt(usar));
      }
      else {
        vantagens = await db.Vantagem.findAll();
      }
      
      // Aplicar paginação manualmente se necessário
      if (limit || offset) {
        const startIndex = parseInt(offset) || 0;
        const endIndex = startIndex + parseInt(limit || 50);
        vantagens = vantagens.slice(startIndex, endIndex);
      }
      
      const total = vantagens.length;
      
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
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
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
      
      const vantagem = await db.Vantagem.findById(parseInt(id));
      
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
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
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
      
      const totalVantagens = await db.Vantagem.count();
      
      // Para estatísticas por nível e por usar, vamos buscar todos e agrupar manualmente
      const todasVantagens = await db.Vantagem.findAll();
      
      // Agrupar por nível
      const porNivel = {};
      todasVantagens.forEach(v => {
        const nivel = v.nivel || 'Sem nível';
        porNivel[nivel] = (porNivel[nivel] || 0) + 1;
      });
      
      // Agrupar por usar
      const porUsar = {};
      todasVantagens.forEach(v => {
        if (v.usar) {
          porUsar[v.usar] = (porUsar[v.usar] || 0) + 1;
        }
      });
      
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
  async atualizarVantagem(req, res) {
    try {
      const { id } = req.params;
      const vantagem = await db.Vantagem.findById(parseInt(id));
      if (!vantagem) {
        return res.status(404).json({ success: false, error: 'Vantagem não encontrada' });
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

      const atualizada = await db.Vantagem.update(parseInt(id), dados);
      res.json({ success: true, message: 'Vantagem atualizada com sucesso', data: atualizada });
    } catch (error) {
      console.error('❌ Erro ao atualizar vantagem:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async deletarVantagem(req, res) {
    try {
      const { id } = req.params;
      const vantagem = await db.Vantagem.findById(parseInt(id));
      if (!vantagem) {
        return res.status(404).json({ success: false, error: 'Vantagem não encontrada' });
      }
      await db.Vantagem.delete(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error('❌ Erro ao deletar vantagem:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
}

export default new VantagemController(); 