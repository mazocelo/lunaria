import db from '../../Model/index.js';
import logger from '../../helpers/logger.js';
const log = logger.child({ module: 'temasController' });

class TemasController {
  async listarTemas(req, res) {
    try {
      const { limit, offset } = req.query;

      if (limit !== undefined) {
        const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const parsedOffset = Math.max(parseInt(offset) || 0, 0);
        const result = await db.Temas.findPaginated({ limit: parsedLimit, offset: parsedOffset });
        return res.json({
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

      const data = await db.Temas.findAll();
      res.json({
        success: true,
        data,
        pagination: { total: data.length, limit: data.length, offset: 0, hasMore: false }
      });
    } catch (error) {
      log.error({ err: error }, 'Erro ao listar temas');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async obterTema(req, res) {
    try {
      const { id } = req.params;
      const tema = await db.Temas.findById(parseInt(id));
      if (!tema) {
        return res.status(404).json({ success: false, error: 'Tema não encontrado' });
      }
      res.json({ success: true, data: tema });
    } catch (error) {
      log.error({ err: error }, 'Erro ao obter tema');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async criarTema(req, res) {
    try {
      const { nome, descricao } = req.body;
      if (!nome) {
        return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
      }

      const existe = await db.Temas.exists(nome);
      if (existe) {
        return res.status(400).json({ success: false, error: 'Já existe um tema com este nome' });
      }

      const novoTema = await db.Temas.create({ nome, descricao: descricao || null });
      res.status(201).json({ success: true, message: 'Tema criado com sucesso', data: novoTema });
    } catch (error) {
      log.error({ err: error }, 'Erro ao criar tema');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async atualizarTema(req, res) {
    try {
      const { id } = req.params;
      const tema = await db.Temas.findById(parseInt(id));
      if (!tema) {
        return res.status(404).json({ success: false, error: 'Tema não encontrado' });
      }

      const { nome, descricao } = req.body;
      const dados = {};
      if (nome !== undefined) dados.nome = nome;
      if (descricao !== undefined) dados.descricao = descricao;

      const atualizado = await db.Temas.update(parseInt(id), dados);
      res.json({ success: true, message: 'Tema atualizado com sucesso', data: atualizado });
    } catch (error) {
      log.error({ err: error }, 'Erro ao atualizar tema');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async deletarTema(req, res) {
    try {
      const { id } = req.params;
      const tema = await db.Temas.findById(parseInt(id));
      if (!tema) {
        return res.status(404).json({ success: false, error: 'Tema não encontrado' });
      }
      await db.Temas.delete(parseInt(id));
      res.status(204).send();
    } catch (error) {
      log.error({ err: error }, 'Erro ao deletar tema');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
}

export default new TemasController();
