import db from '../../Model/index.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { normalizarElemento, ELEMENTOS } from '../../config/domainConstants.js';
import logger from '../../helpers/logger.js';
import {
  BonusFlexivelSchema,
  RestricaoSchema,
  EfeitoFlexivelSchema,
  RequisitosFlexivelSchema,
  validateJson,
} from '../../helpers/jsonSchemas.js';
import {
  normalizarPayloadVantagemOuDesvantagem,
  serializarVantagemOuDesvantagem,
} from '../../helpers/catalogJsonHelper.js';
const log = logger.child({ module: 'desvantagensController' });

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
      log.info({ body: req.body }, 'Criando nova desvantagem');
      
      const {
        nome,
        descricao,
        custo,
        tipo,
        dano_base,
        nivel,
      } = req.body;
      const payload = normalizarPayloadVantagemOuDesvantagem(req.body);
      
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
      
      const elementos = parseElementoLista(payload.elemento);
      if (elementos.error) {
        return res.status(400).json({ error: elementos.error });
      }

      if (payload.bonus !== undefined) {
        const validacaoBonus = validateJson(BonusFlexivelSchema, payload.bonus);
        if (!validacaoBonus.success) return res.status(400).json({ error: `bonus invalido: ${validacaoBonus.error}` });
        payload.bonus = validacaoBonus.data;
      }
      if (payload.restricao !== undefined) {
        const validacaoRestricao = validateJson(RestricaoSchema, payload.restricao);
        if (!validacaoRestricao.success) return res.status(400).json({ error: `restricao invalida: ${validacaoRestricao.error}` });
        payload.restricao = validacaoRestricao.data;
      }
      if (payload.efeito !== undefined) {
        const validacaoEfeito = validateJson(EfeitoFlexivelSchema, payload.efeito);
        if (!validacaoEfeito.success) return res.status(400).json({ error: `efeito invalido: ${validacaoEfeito.error}` });
        payload.efeito = validacaoEfeito.data;
      }
      if (payload.requisitos !== undefined) {
        const validacaoRequisitos = validateJson(RequisitosFlexivelSchema, payload.requisitos);
        if (!validacaoRequisitos.success) return res.status(400).json({ error: `requisitos invalido: ${validacaoRequisitos.error}` });
        payload.requisitos = validacaoRequisitos.data;
      }

      // Criar desvantagem no banco
      const novaDesvantagem = await db.Desvantagem.create({
        nome,
        descricao,
        custo: custo || 0,
        tipo: Array.isArray(tipo) ? tipo : [tipo || 'ativa'],
        bonus: payload.bonus || {},
        restricao: payload.restricao || {},
        dano_base,
        efeito: payload.efeito || {},
        usar: payload.usar ?? null,
        elemento: elementos.value ?? [],
        nivel: nivel || 1,
        requisitos: payload.requisitos || {}
      });
      
      log.info({ id: novaDesvantagem.id }, 'Desvantagem criada com sucesso');
      
      res.status(201).json({
        success: true,
        message: 'Desvantagem criada com sucesso',
        data: serializarVantagemOuDesvantagem(novaDesvantagem)
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao criar desvantagem');
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
      const { tipo, elemento, nivel, usar, usos, search, limit, offset } = req.query;
      const elementoFiltro = parseElementoFiltro(elemento);
      if (elementoFiltro.error) {
        return res.status(400).json({ error: elementoFiltro.error });
      }

      if (limit !== undefined) {
        const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const parsedOffset = Math.max(parseInt(offset) || 0, 0);
        const result = await db.Desvantagem.findPaginated({
          limit: parsedLimit,
          offset: parsedOffset,
          tipo, elemento: elementoFiltro.value,
          nivel: nivel ? parseInt(nivel) : undefined,
          usar: (usar ?? usos) ? parseInt(usar ?? usos) : undefined,
          search
        });
        return res.status(200).json({
          success: true,
          data: result.data.map(serializarVantagemOuDesvantagem),
          pagination: {
            total: result.total,
            limit: parsedLimit,
            offset: parsedOffset,
            hasMore: parsedOffset + result.data.length < result.total
          }
        });
      }

      const nivelFiltro = nivel ? parseInt(nivel) : undefined;
      const data = nivelFiltro
        ? await db.Desvantagem.findByNivelMax(nivelFiltro)
        : await db.Desvantagem.findAll();
      res.status(200).json({
        success: true,
        data: data.map(serializarVantagemOuDesvantagem),
        pagination: { total: data.length, limit: data.length, offset: 0, hasMore: false }
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao listar desvantagens');
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
      
      log.info({ id: id }, 'Buscando desvantagem ID');
      
      const desvantagem = await db.Desvantagem.findById(parseInt(id));
      
      if (!desvantagem) {
        return res.status(404).json({
          error: 'Desvantagem não encontrada'
        });
      }
      
      log.info('Desvantagem encontrada');
      
      res.status(200).json({
        success: true,
        data: serializarVantagemOuDesvantagem(desvantagem)
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao obter desvantagem');
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
      const elementoFiltro = parseElementoFiltro(req.params.elemento);
      if (elementoFiltro.error) {
        return res.status(400).json({ error: elementoFiltro.error });
      }
      
      log.info({ elemento: elementoFiltro.value }, 'Listando desvantagens do elemento');
      
      const desvantagens = await db.Desvantagem.findByElemento(elementoFiltro.value);
      
      log.info({ desvantagens_length: desvantagens.length, elemento: elementoFiltro.value }, 'desvantagens encontradas do elemento');
      
      res.status(200).json({
        success: true,
        data: desvantagens.map(serializarVantagemOuDesvantagem)
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao listar desvantagens por elemento');
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
      
      log.info({ tipo: tipo }, 'Listando desvantagens do tipo');
      
      const desvantagens = await db.Desvantagem.findByTipo(tipo);
      
      log.info({ desvantagens_length: desvantagens.length, tipo: tipo }, 'desvantagens encontradas do tipo');
      
      res.status(200).json({
        success: true,
        data: desvantagens.map(serializarVantagemOuDesvantagem)
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao listar desvantagens por tipo');
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
      
      log.info({ nivel: nivel }, 'Listando desvantagens do nível');
      
      const desvantagens = await db.Desvantagem.findByNivel(nivel);
      
      log.info({ desvantagens_length: desvantagens.length, nivel: nivel }, 'desvantagens encontradas do nível');
      
      res.status(200).json({
        success: true,
        data: desvantagens
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao listar desvantagens por nivel');
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
      
      log.info({ termo: termo }, 'Buscando desvantagens com termo');
      
      const desvantagens = await db.Desvantagem.search(termo);
      
      log.info({ desvantagens_length: desvantagens.length, termo: termo }, 'desvantagens encontradas para ""');
      
      res.status(200).json({
        success: true,
        data: desvantagens
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao buscar desvantagens');
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
      log.info('Obtendo estatisticas das desvantagens');
      
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
      
      log.info('Estatisticas obtidas com sucesso');
      
      res.status(200).json({
        success: true,
        data: estatisticas
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao obter estatisticas');
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

      const { nome, descricao, custo, tipo, dano_base, nivel } = req.body;
      const payload = normalizarPayloadVantagemOuDesvantagem(req.body);
      const dados = {};
      if (nome !== undefined) dados.nome = nome;
      if (descricao !== undefined) dados.descricao = descricao;
      if (custo !== undefined) dados.custo = parseInt(custo);
      if (tipo !== undefined) dados.tipo = tipo;
      if (dano_base !== undefined) dados.dano_base = dano_base;
      if (req.body.bonus !== undefined) {
        const validacaoBonus = validateJson(BonusFlexivelSchema, payload.bonus);
        if (!validacaoBonus.success) return res.status(400).json({ success: false, error: `bonus invalido: ${validacaoBonus.error}` });
        dados.bonus = validacaoBonus.data;
      }
      if (req.body.restricao !== undefined) {
        const validacaoRestricao = validateJson(RestricaoSchema, payload.restricao);
        if (!validacaoRestricao.success) return res.status(400).json({ success: false, error: `restricao invalida: ${validacaoRestricao.error}` });
        dados.restricao = validacaoRestricao.data;
      }
      if (req.body.efeito !== undefined) {
        const validacaoEfeito = validateJson(EfeitoFlexivelSchema, payload.efeito);
        if (!validacaoEfeito.success) return res.status(400).json({ success: false, error: `efeito invalido: ${validacaoEfeito.error}` });
        dados.efeito = validacaoEfeito.data;
      }
      if (req.body.usar !== undefined || req.body.usos !== undefined) dados.usar = payload.usar;
      if (req.body.elemento !== undefined) {
        const elementos = parseElementoLista(payload.elemento);
        if (elementos.error) {
          return res.status(400).json({ success: false, error: elementos.error });
        }
        dados.elemento = elementos.value;
      }
      if (nivel !== undefined) dados.nivel = parseInt(nivel);
      if (req.body.requisitos !== undefined) {
        const validacaoRequisitos = validateJson(RequisitosFlexivelSchema, payload.requisitos);
        if (!validacaoRequisitos.success) return res.status(400).json({ success: false, error: `requisitos invalido: ${validacaoRequisitos.error}` });
        dados.requisitos = validacaoRequisitos.data;
      }

      const atualizada = await db.Desvantagem.update(parseInt(id), dados);
      res.json({ success: true, message: 'Desvantagem atualizada com sucesso', data: serializarVantagemOuDesvantagem(atualizada) });
    } catch (error) {
      log.error({ err: error }, 'Erro ao atualizar desvantagem');
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
      log.error({ err: error }, 'Erro ao deletar desvantagem');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
}

export default new DesvantagemController(); 
