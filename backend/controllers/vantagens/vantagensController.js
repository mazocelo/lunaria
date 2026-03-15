import db from '../../Model/index.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { normalizarElemento, ELEMENTOS } from '../../config/domainConstants.js';
import logger from '../../helpers/logger.js';
const log = logger.child({ module: 'vantagensController' });

function parseElementoLista(raw) {
  if (raw === undefined) return { value: undefined };
  if (raw === null || raw === '') return { value: [] };
  const arr = Array.isArray(raw) ? raw : [raw];
  const invalidos = arr.filter(e => e && !normalizarElemento(e));
  if (invalidos.length > 0) {
    return { error: `Elementos invalidos: ${invalidos.join(', ')}. Validos: ${ELEMENTOS.join(', ')}` };
  }
  return { value: arr.map(e => normalizarElemento(e)).filter(Boolean) };
}

function parseElementoFiltro(raw) {
  if (raw === undefined) return { value: undefined };
  if (raw === null || raw === '') return { value: null };
  const normalizado = normalizarElemento(raw);
  if (!normalizado) {
    return { error: `Elemento invalido: ${raw}. Validos: ${ELEMENTOS.join(', ')}` };
  }
  return { value: normalizado };
}

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
      log.info({ req_body: req.body }, 'Criando nova vantagem');
      
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
      
      const elementos = parseElementoLista(elemento);
      if (elementos.error) {
        return res.status(400).json({ error: elementos.error });
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
        elemento: elementos.value ?? [],
        nivel: nivel || 1,
        requisitos: requisitos || {}
      });
      
      log.info({ novaVantagem_id: novaVantagem.id }, 'Vantagem criada com sucesso');
      
      res.status(201).json({
        success: true,
        message: 'Vantagem criada com sucesso',
        data: novaVantagem
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao criar vantagem');
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
      const { tipo, elemento, nivel, usar, search, limit, offset } = req.query;
      const elementoFiltro = parseElementoFiltro(elemento);
      if (elementoFiltro.error) {
        return res.status(400).json({ error: elementoFiltro.error });
      }

      if (limit !== undefined) {
        const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const parsedOffset = Math.max(parseInt(offset) || 0, 0);
        const result = await db.Vantagem.findPaginated({
          limit: parsedLimit,
          offset: parsedOffset,
          tipo, elemento: elementoFiltro.value,
          nivel: nivel ? parseInt(nivel) : undefined,
          usar: usar ? parseInt(usar) : undefined,
          search
        });
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

      const data = await db.Vantagem.findAll();
      res.status(200).json({
        success: true,
        data,
        pagination: { total: data.length, limit: data.length, offset: 0, hasMore: false }
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao listar vantagens');
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
      
      log.info({ id: id }, 'Buscando vantagem ID');
      
      const vantagem = await db.Vantagem.findById(parseInt(id));
      
      if (!vantagem) {
        return res.status(404).json({
          error: 'Vantagem não encontrada'
        });
      }
      
      log.info('Vantagem encontrada');
      
      res.status(200).json({
        success: true,
        data: vantagem
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao obter vantagem');
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
      const elementoFiltro = parseElementoFiltro(req.params.elemento);
      if (elementoFiltro.error) {
        return res.status(400).json({ error: elementoFiltro.error });
      }
      
      log.info({ elemento: elementoFiltro.value }, 'Listando vantagens do elemento');
      
      const vantagens = await db.Vantagem.findByElemento(elementoFiltro.value);
      
      log.info({ vantagens_length: vantagens.length, elemento: elementoFiltro.value }, 'vantagens encontradas do elemento');
      
      res.status(200).json({
        success: true,
        data: vantagens
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao listar vantagens por elemento');
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
      
      log.info({ tipo: tipo }, 'Listando vantagens do tipo');
      
      const vantagens = await db.Vantagem.findByTipo(tipo);
      
      log.info({ vantagens_length: vantagens.length, tipo: tipo }, 'vantagens encontradas do tipo');
      
      res.status(200).json({
        success: true,
        data: vantagens
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao listar vantagens por tipo');
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
      
      log.info({ nivel: nivel }, 'Listando vantagens do nível');
      
      const vantagens = await db.Vantagem.findByNivel(nivel);
      
      log.info({ vantagens_length: vantagens.length, nivel: nivel }, 'vantagens encontradas do nível');
      
      res.status(200).json({
        success: true,
        data: vantagens
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao listar vantagens por nível');
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
      
      log.info({ termo: termo }, 'Buscando vantagens com termo');
      
      const vantagens = await db.Vantagem.search(termo);
      
      log.info({ vantagens_length: vantagens.length, termo: termo }, 'vantagens encontradas para ""');
      
      res.status(200).json({
        success: true,
        data: vantagens
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao buscar vantagens');
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
      log.info('Obtendo estatísticas das vantagens');
      
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
      
      log.info('Estatísticas obtidas com sucesso');
      
      res.status(200).json({
        success: true,
        data: estatisticas
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao obter estatísticas');
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
      if (elemento !== undefined) {
        const elementos = parseElementoLista(elemento);
        if (elementos.error) {
          return res.status(400).json({ success: false, error: elementos.error });
        }
        dados.elemento = elementos.value;
      }
      if (nivel !== undefined) dados.nivel = parseInt(nivel);
      if (requisitos !== undefined) dados.requisitos = requisitos;

      const atualizada = await db.Vantagem.update(parseInt(id), dados);
      res.json({ success: true, message: 'Vantagem atualizada com sucesso', data: atualizada });
    } catch (error) {
      log.error({ err: error }, 'Erro ao atualizar vantagem');
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
      log.error({ err: error }, 'Erro ao deletar vantagem');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
}

export default new VantagemController(); 
