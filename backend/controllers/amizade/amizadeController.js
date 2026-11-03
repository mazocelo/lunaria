import db from '../../Model/index.js';

/**
 * Controller para gerenciamento de amizades
 */
class AmizadeController {

  /**
   * Listar amigos do usuario autenticado
   */
  async listarAmigos(req, res) {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const result = await db.Amizade.findFriends(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.json({
      success: true,
      data: result.friends,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: result.hasMore
      }
    });
  }

  /**
   * Listar solicitacoes pendentes recebidas
   */
  async listarPendentes(req, res) {
    const userId = req.user.id;
    const pendentes = await db.Amizade.findPendingReceived(userId);

    return res.json({
      success: true,
      data: pendentes.map(p => ({
        id: p.id,
        usuario: p.requester,
        criado_em: p.criado_em
      }))
    });
  }

  /**
   * Sugestoes baseadas em historias em comum
   */
  async listarSugestoes(req, res) {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const sugestoes = await db.Amizade.suggestFromStories(userId, parseInt(limit));

    return res.json({
      success: true,
      data: sugestoes
    });
  }

  /**
   * Pesquisar usuarios por nome ou email
   */
  async pesquisarUsuarios(req, res) {
    const userId = req.user.id;
    const { q, limit = 20 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Busca deve ter pelo menos 2 caracteres'
      });
    }

    const results = await db.Amizade.searchUsers(q, userId, parseInt(limit));

    return res.json({
      success: true,
      data: results
    });
  }

  /**
   * Enviar solicitacao de amizade
   */
  async enviarSolicitacao(req, res) {
    const requesterId = req.user.id;
    const { receiver_id } = req.body;

    if (!receiver_id) {
      return res.status(400).json({
        success: false,
        error: 'receiver_id e obrigatorio'
      });
    }

    if (receiver_id === requesterId) {
      return res.status(400).json({
        success: false,
        error: 'Nao pode adicionar a si mesmo'
      });
    }

    // Verificar se o usuario existe
    const receiver = await db.Usuario.findById(receiver_id);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        error: 'Usuario nao encontrado'
      });
    }

    // Verificar se ja existe relacao
    const existing = await db.Amizade.findByPair(requesterId, receiver_id);
    if (existing) {
      if (existing.status === 'bloqueada') {
        return res.status(403).json({
          success: false,
          error: 'Nao foi possivel enviar solicitacao'
        });
      }
      return res.status(409).json({
        success: false,
        error: existing.status === 'aceita'
          ? 'Voces ja sao amigos'
          : 'Solicitacao ja enviada'
      });
    }

    const amizade = await db.Amizade.create(requesterId, receiver_id);

    return res.status(201).json({
      success: true,
      message: 'Solicitacao enviada',
      data: amizade
    });
  }

  /**
   * Aceitar solicitacao de amizade
   */
  async aceitarSolicitacao(req, res) {
    const userId = req.user.id;
    const { id } = req.params;

    try {
      const amizade = await db.Amizade.accept(parseInt(id), userId);
      return res.json({
        success: true,
        message: 'Amizade aceita',
        data: amizade
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'Solicitacao nao encontrada ou ja respondida'
        });
      }
      throw error;
    }
  }

  /**
   * Rejeitar solicitacao de amizade
   */
  async rejeitarSolicitacao(req, res) {
    const userId = req.user.id;
    const { id } = req.params;

    try {
      await db.Amizade.reject(parseInt(id), userId);
      return res.json({
        success: true,
        message: 'Solicitacao rejeitada'
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'Solicitacao nao encontrada'
        });
      }
      throw error;
    }
  }

  /**
   * Bloquear usuario
   */
  async bloquearUsuario(req, res) {
    const userId = req.user.id;
    const { id } = req.params;

    await db.Amizade.block(userId, parseInt(id));

    return res.json({
      success: true,
      message: 'Usuario bloqueado'
    });
  }

  /**
   * Remover amizade
   */
  async removerAmizade(req, res) {
    const userId = req.user.id;
    const { id } = req.params;

    try {
      await db.Amizade.remove(userId, parseInt(id));
      return res.json({
        success: true,
        message: 'Amizade removida'
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'Amizade nao encontrada'
        });
      }
      throw error;
    }
  }
}

const amizadeController = new AmizadeController();
export default amizadeController;
