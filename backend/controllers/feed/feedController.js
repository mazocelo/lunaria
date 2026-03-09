import db from '../../Model/index.js';

/**
 * Controller para gerenciamento do feed social
 */
class FeedController {

  /**
   * Listar feed (tab amigos ou comunidade)
   */
  async listarFeed(req, res) {
    const userId = req.user.id;
    const { tab = 'amigos', limit = 20, offset = 0 } = req.query;

    if (!['amigos', 'comunidade'].includes(tab)) {
      return res.status(400).json({
        success: false,
        error: 'Tab deve ser "amigos" ou "comunidade"'
      });
    }

    // Buscar IDs dos amigos para tab amigos
    let friendIds = [];
    if (tab === 'amigos') {
      friendIds = await db.Amizade.findFriendIds(userId);
    }

    const result = await db.FeedPost.findFeed(userId, friendIds, tab, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.json({
      success: true,
      data: result.posts,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: result.hasMore
      }
    });
  }

  /**
   * Criar post manual
   */
  async criarPost(req, res) {
    const userId = req.user.id;
    const { texto, visibilidade, entidade_tipo, entidade_id } = req.body;

    if (!texto || texto.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Texto e obrigatorio'
      });
    }

    if (texto.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Texto deve ter no maximo 2000 caracteres'
      });
    }

    const post = await db.FeedPost.create({
      userId,
      texto: texto.trim(),
      visibilidade: visibilidade || 'amigos',
      entidade_tipo,
      entidade_id: entidade_id ? parseInt(entidade_id) : null
    });

    return res.status(201).json({
      success: true,
      data: {
        id: post.id,
        usuario: post.usuario,
        tipo: post.tipo,
        conteudo: post.conteudo,
        visibilidade: post.visibilidade,
        criado_em: post.criado_em,
        curtidas: 0,
        comentarios: 0,
        curtidoPorMim: false
      }
    });
  }

  /**
   * Deletar post (apenas dono)
   */
  async deletarPost(req, res) {
    const userId = req.user.id;
    const { id } = req.params;

    try {
      await db.FeedPost.softDelete(parseInt(id), userId);
      return res.json({
        success: true,
        message: 'Post deletado'
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'Post nao encontrado ou sem permissao'
        });
      }
      throw error;
    }
  }

  /**
   * Toggle curtida em post
   */
  async curtir(req, res) {
    const userId = req.user.id;
    const { id } = req.params;

    // Verificar se post existe
    const post = await db.FeedPost.findById(parseInt(id));
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post nao encontrado'
      });
    }

    const result = await db.FeedPost.toggleCurtida(parseInt(id), userId);

    return res.json({
      success: true,
      data: result
    });
  }

  /**
   * Listar comentarios de um post
   */
  async listarComentarios(req, res) {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const result = await db.FeedPost.getComentarios(parseInt(id), {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.json({
      success: true,
      data: result.comentarios,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: result.hasMore
      }
    });
  }

  /**
   * Adicionar comentario a um post
   */
  async comentar(req, res) {
    const userId = req.user.id;
    const { id } = req.params;
    const { texto } = req.body;

    if (!texto || texto.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Texto e obrigatorio'
      });
    }

    if (texto.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Comentario deve ter no maximo 500 caracteres'
      });
    }

    // Verificar se post existe
    const post = await db.FeedPost.findById(parseInt(id));
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post nao encontrado'
      });
    }

    const comentario = await db.FeedPost.addComentario(parseInt(id), userId, texto.trim());

    return res.status(201).json({
      success: true,
      data: comentario
    });
  }

  /**
   * Deletar comentario (apenas dono)
   */
  async deletarComentario(req, res) {
    const userId = req.user.id;
    const { id } = req.params;

    try {
      await db.FeedPost.deleteComentario(parseInt(id), userId);
      return res.json({
        success: true,
        message: 'Comentario deletado'
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'Comentario nao encontrado ou sem permissao'
        });
      }
      throw error;
    }
  }
}

const feedController = new FeedController();
export default feedController;
