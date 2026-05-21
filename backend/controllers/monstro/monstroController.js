import db from '../../Model/index.js';
import { HabilidadeMonstroSchema, ResistenciasSchema, VelocidadeSchema, validateJson } from '../../helpers/jsonSchemas.js';
import { normalizarElemento, ELEMENTOS } from '../../config/domainConstants.js';
import { LUNARIA_ATTRS } from '../../helpers/atributosHelper.js';
import logger from '../../helpers/logger.js';
const log = logger.child({ module: 'monstroController' });

/**
 * Controller para gerenciar operações de monstro
 */
class MonstroController {

  /**
   * Listar todos os monstros (com filtros opcionais)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  listar = async (req, res, next) => {
    try {
      const { tipo, raridade_id, nivel, tema, limit, offset } = req.query;

      if (limit !== undefined) {
        const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const parsedOffset = Math.max(parseInt(offset) || 0, 0);
        const result = await db.Monstro.findPaginated({
          limit: parsedLimit,
          offset: parsedOffset,
          tipo, raridade_id, nivel, tema
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

      const data = await db.Monstro.findAll();
      res.status(200).json({
        success: true,
        data,
        pagination: { total: data.length, limit: data.length, offset: 0, hasMore: false }
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao listar monstros');
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Buscar um monstro por ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  buscarPorId = async (req, res, next) => {
    try {
      const { id } = req.params;

      log.info({ id: id }, 'Buscando monstro ID');

      const monstro = await db.Monstro.findById(parseInt(id));

      if (!monstro) {
        return res.status(404).json({
          success: false,
          error: 'Monstro não encontrado'
        });
      }

      log.info({ monstro_nome: monstro.nome }, 'Monstro encontrado');

      res.status(200).json({
        success: true,
        data: monstro
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao buscar monstro');
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Buscar monstros para combate
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  buscarParaCombate = async (req, res, next) => {
    try {
      const { nivel, temas, dificuldade } = req.query;

      log.info({ nivel: nivel, temas: temas, dificuldade: dificuldade }, 'Buscando monstros para combate - nivel: , temas: , dificuldade');

      if (!nivel) {
        return res.status(400).json({
          success: false,
          error: 'Nível é obrigatório para busca de combate'
        });
      }

      const parametros = {
        nivel: parseInt(nivel),
        temas: temas ? temas.split(',') : [],
        dificuldade: dificuldade || 'media'
      };

      const monstros = await db.Monstro.selecionarParaCombate(
        parametros.nivel,
        parametros.temas,
        parametros.dificuldade
      );

      log.info({ monstros_length: monstros.length }, 'monstros selecionados para combate');

      res.status(200).json({
        success: true,
        data: monstros,
        total: monstros.length
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao buscar monstros para combate');
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Criar um novo monstro
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  criar = async (req, res, next) => {
    try {
      log.info('Criando novo monstro');

      const {
        nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max,
        hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma,
        ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, imagem
      } = req.body;

      if (!nome) {
        return res.status(400).json({
          success: false,
          error: 'Nome é obrigatório'
        });
      }

      const dados = { nome };
      if (descricao !== undefined) dados.descricao = descricao;
      if (tipo !== undefined) dados.tipo = tipo;
      if (raridade_id !== undefined) dados.raridade_id = parseInt(raridade_id);
      if (categoria_id !== undefined) dados.categoria_id = parseInt(categoria_id);
      if (nivel_min !== undefined) dados.nivel_min = parseInt(nivel_min);
      if (nivel_max !== undefined) dados.nivel_max = parseInt(nivel_max);
      if (hp_base !== undefined) dados.hp_base = parseInt(hp_base);
      if (ataque_base !== undefined) dados.ataque_base = parseInt(ataque_base);
      if (defesa_base !== undefined) dados.defesa_base = parseInt(defesa_base);
      if (dano_base !== undefined) dados.dano_base = dano_base;
      if (habilidades !== undefined) {
        const v = validateJson(HabilidadeMonstroSchema, habilidades);
        if (!v.success) return res.status(400).json({ success: false, error: `habilidades invalido: ${v.error}` });
        dados.habilidades = v.data;
      }
      if (elemento !== undefined) {
        const arr = Array.isArray(elemento) ? elemento : [elemento];
        const invalidos = arr.filter(e => e && !normalizarElemento(e));
        if (invalidos.length > 0) {
          return res.status(400).json({ success: false, error: `Elementos inválidos: ${invalidos.join(', ')}. Válidos: ${ELEMENTOS.join(', ')}` });
        }
        dados.elemento = arr.map(e => normalizarElemento(e)).filter(Boolean);
      }
      if (temas !== undefined) dados.temas = Array.isArray(temas) ? temas.map(t => parseInt(t)).filter(n => !isNaN(n)) : [];
      if (xp_base !== undefined) dados.xp_base = parseInt(xp_base);
      if (imagem !== undefined) dados.imagem = imagem;

      // Collect attribute values from request
      const attrValues = {};
      if (forca !== undefined) attrValues.forca = parseInt(forca);
      if (inteligencia !== undefined) attrValues.inteligencia = parseInt(inteligencia);
      if (destreza !== undefined) attrValues.destreza = parseInt(destreza);
      if (constituicao !== undefined) attrValues.constituicao = parseInt(constituicao);
      if (agilidade !== undefined) attrValues.agilidade = parseInt(agilidade);
      if (carisma !== undefined) attrValues.carisma = parseInt(carisma);

      const novoMonstro = await db.Monstro.create(dados);

      // Create atributos_monstro rows
      const attrRows = Object.entries(attrValues);
      if (attrRows.length > 0) {
        await db.prisma.atributos_monstro.createMany({
          data: attrRows.map(([attrNome, valor]) => ({
            monstro_id: novoMonstro.id,
            nome: attrNome,
            valor
          }))
        });
      }

      log.info({ novoMonstro_id: novoMonstro.id }, 'Monstro criado');

      res.status(201).json({
        success: true,
        message: 'Monstro criado com sucesso',
        data: novoMonstro
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao criar monstro');
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Atualizar um monstro existente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  atualizar = async (req, res, next) => {
    try {
      const { id } = req.params;

      log.info({ id: id }, 'Atualizando monstro ID');

      const monstro = await db.Monstro.findById(parseInt(id));

      if (!monstro) {
        return res.status(404).json({
          success: false,
          error: 'Monstro não encontrado'
        });
      }

      const {
        nome, descricao, tipo, raridade_id, categoria_id, nivel_min, nivel_max,
        hp_base, forca, inteligencia, destreza, constituicao, agilidade, carisma,
        ataque_base, defesa_base, dano_base, habilidades, elemento, temas, xp_base, imagem
      } = req.body;

      const dadosAtualizacao = {};
      if (nome !== undefined) dadosAtualizacao.nome = nome;
      if (descricao !== undefined) dadosAtualizacao.descricao = descricao;
      if (tipo !== undefined) dadosAtualizacao.tipo = tipo;
      if (raridade_id !== undefined) dadosAtualizacao.raridade_id = parseInt(raridade_id);
      if (categoria_id !== undefined) dadosAtualizacao.categoria_id = parseInt(categoria_id);
      if (nivel_min !== undefined) dadosAtualizacao.nivel_min = parseInt(nivel_min);
      if (nivel_max !== undefined) dadosAtualizacao.nivel_max = parseInt(nivel_max);
      if (hp_base !== undefined) dadosAtualizacao.hp_base = parseInt(hp_base);
      if (ataque_base !== undefined) dadosAtualizacao.ataque_base = parseInt(ataque_base);
      if (defesa_base !== undefined) dadosAtualizacao.defesa_base = parseInt(defesa_base);
      if (dano_base !== undefined) dadosAtualizacao.dano_base = dano_base;
      if (habilidades !== undefined) {
        const v = validateJson(HabilidadeMonstroSchema, habilidades);
        if (!v.success) return res.status(400).json({ success: false, error: `habilidades invalido: ${v.error}` });
        dadosAtualizacao.habilidades = v.data;
      }
      if (elemento !== undefined) {
        const arr = Array.isArray(elemento) ? elemento : [elemento];
        const invalidos = arr.filter(e => e && !normalizarElemento(e));
        if (invalidos.length > 0) {
          return res.status(400).json({ success: false, error: `Elementos inválidos: ${invalidos.join(', ')}. Válidos: ${ELEMENTOS.join(', ')}` });
        }
        dadosAtualizacao.elemento = arr.map(e => normalizarElemento(e)).filter(Boolean);
      }
      if (temas !== undefined) dadosAtualizacao.temas = Array.isArray(temas) ? temas.map(t => parseInt(t)).filter(n => !isNaN(n)) : [];
      if (xp_base !== undefined) dadosAtualizacao.xp_base = parseInt(xp_base);
      if (imagem !== undefined) dadosAtualizacao.imagem = imagem;

      // Collect attribute values for atributos_monstro
      const attrUpdate = {};
      if (forca !== undefined) attrUpdate.forca = parseInt(forca);
      if (inteligencia !== undefined) attrUpdate.inteligencia = parseInt(inteligencia);
      if (destreza !== undefined) attrUpdate.destreza = parseInt(destreza);
      if (constituicao !== undefined) attrUpdate.constituicao = parseInt(constituicao);
      if (agilidade !== undefined) attrUpdate.agilidade = parseInt(agilidade);
      if (carisma !== undefined) attrUpdate.carisma = parseInt(carisma);

      const monstroId = parseInt(id);
      const monstroAtualizado = await db.Monstro.update(monstroId, dadosAtualizacao);

      // Upsert atributos_monstro rows
      for (const [attrNome, valor] of Object.entries(attrUpdate)) {
        await db.prisma.atributos_monstro.upsert({
          where: { monstro_id_nome: { monstro_id: monstroId, nome: attrNome } },
          update: { valor },
          create: { monstro_id: monstroId, nome: attrNome, valor }
        });
      }

      log.info({ id: id }, 'Monstro atualizado');

      res.status(200).json({
        success: true,
        message: 'Monstro atualizado com sucesso',
        data: monstroAtualizado
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao atualizar monstro');
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Deletar um monstro
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  deletar = async (req, res, next) => {
    try {
      const { id } = req.params;

      log.info({ id: id }, 'Deletando monstro ID');

      const monstro = await db.Monstro.findById(parseInt(id));

      if (!monstro) {
        return res.status(404).json({
          success: false,
          error: 'Monstro não encontrado'
        });
      }

      await db.Monstro.delete(parseInt(id));

      res.status(204).send();

    } catch (error) {
      log.error({ err: error }, 'Erro ao deletar monstro');
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  };
}

export default new MonstroController();
