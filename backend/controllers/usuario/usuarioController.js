import bcrypt from 'bcryptjs';
import db from '../../Model/index.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { PreferenciasSchema, PrivacidadeSchema, validateJson } from '../../helpers/jsonSchemas.js';

/**
 * Controller para gerenciar operações CRUD de usuários
 */
class UsuarioController {
  
  /**
   * Listar todos os usuários (apenas dados públicos)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async listarUsuarios(req, res) {
    try {
      console.log('📋 Listando usuários');

      const { limit = 50, offset = 0 } = req.query;

      const usuarios = await db.Usuario.findAll({
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: {
          nome: 'asc'
        }
      });

      const total = await db.Usuario.count();

      console.log(`✅ ${usuarios.length} usuários encontrados`);

      res.status(200).json({
        success: true,
        data: usuarios,
        total,
        offset: parseInt(offset),
        limit: parseInt(limit)
      });

    } catch (error) {
      console.error('❌ Erro ao listar usuários:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obter usuário por ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async obterUsuario(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = parseInt(id);

      console.log(`👤 Buscando usuário ID: ${usuarioId}`);

      if (isNaN(usuarioId)) {
        return res.status(400).json({
          success: false,
          error: 'ID de usuário inválido'
        });
      }

      const usuario = await db.Usuario.findById(usuarioId);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        });
      }

      console.log('✅ Usuário encontrado:', usuario.nome);

      res.status(200).json({
        success: true,
        data: usuario
      });

    } catch (error) {
      console.error('❌ Erro ao obter usuário:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obter perfil do usuário logado
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async obterPerfil(req, res) {
    try {
      const usuarioId = req.user.id;

      console.log(`👤 Buscando perfil do usuário ID: ${usuarioId}`);

      const usuario = await db.Usuario.findById(usuarioId);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        });
      }

      console.log('✅ Perfil encontrado:', usuario.nome);

      res.status(200).json({
        success: true,
        data: usuario
      });

    } catch (error) {
      console.error('❌ Erro ao obter perfil:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Atualizar usuário
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async atualizarUsuario(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = parseInt(id);
      const { nome, email, senha, senha_atual, avatar, bio, preferencias, privacidade } = req.body;

      console.log(`✏️ Atualizando usuário ID: ${usuarioId}`);

      if (isNaN(usuarioId)) {
        return res.status(400).json({
          success: false,
          error: 'ID de usuário inválido'
        });
      }

      // Verificar se usuário existe
      const usuarioExistente = await db.Usuario.findById(usuarioId);
      if (!usuarioExistente) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        });
      }

      // Verificar permissões (usuário só pode editar o próprio perfil, exceto admin)
      if (req.user.id !== usuarioId && req.user.role !== 'superadmin') {
        return res.status(403).json({
          success: false,
          error: 'Você só pode editar seu próprio perfil'
        });
      }

      const dadosAtualizacao = {};

      // Validar e preparar dados para atualização
      if (nome !== undefined) {
        if (!nome.trim()) {
          return res.status(400).json({
            success: false,
            error: 'Nome não pode estar vazio'
          });
        }
        dadosAtualizacao.nome = nome.trim();
      }

      if (email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            error: 'Formato de email inválido'
          });
        }

        // Verificar se email já existe (exceto para o usuário atual)
        const emailExiste = await db.Usuario.emailExists(email, usuarioId);
        if (emailExiste) {
          return res.status(400).json({
            success: false,
            error: 'Este email já está sendo usado por outro usuário'
          });
        }

        dadosAtualizacao.email = email.toLowerCase().trim();
      }

      if (senha !== undefined) {
        // Exigir senha atual para segurança
        if (!senha_atual) {
          return res.status(400).json({
            success: false,
            error: 'Senha atual é obrigatória para alterar a senha'
          });
        }

        // Verificar senha atual
        const senhaValida = await bcrypt.compare(senha_atual, usuarioExistente.senha);
        if (!senhaValida) {
          return res.status(401).json({
            success: false,
            error: 'Senha atual incorreta'
          });
        }

        if (senha.length < 8) {
          return res.status(400).json({
            success: false,
            error: 'Senha deve ter no mínimo 8 caracteres'
          });
        }

        // Criptografar nova senha
        const saltRounds = 12;
        dadosAtualizacao.senha = await bcrypt.hash(senha, saltRounds);
      }

      // Campos de perfil
      if (avatar !== undefined) {
        dadosAtualizacao.avatar = avatar ? String(avatar).slice(0, 500) : null;
      }
      if (bio !== undefined) {
        dadosAtualizacao.bio = bio ? String(bio).slice(0, 500) : null;
      }
      if (preferencias !== undefined) {
        const v = validateJson(PreferenciasSchema, preferencias);
        if (!v.success) return res.status(400).json({ success: false, error: `preferencias invalido: ${v.error}` });
        dadosAtualizacao.preferencias = v.data;
      }
      if (privacidade !== undefined) {
        const v = validateJson(PrivacidadeSchema, privacidade);
        if (!v.success) return res.status(400).json({ success: false, error: `privacidade invalido: ${v.error}` });
        dadosAtualizacao.privacidade = v.data;
      }

      // Atualizar usuário
      const usuarioAtualizado = await db.Usuario.update(usuarioId, dadosAtualizacao);

      console.log('✅ Usuário atualizado com sucesso:', usuarioAtualizado.id);

      res.status(200).json({
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: usuarioAtualizado
      });

    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Deletar usuário (apenas admin ou próprio usuário)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async deletarUsuario(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = parseInt(id);

      console.log(`🗑️ Deletando usuário ID: ${usuarioId}`);

      if (isNaN(usuarioId)) {
        return res.status(400).json({
          success: false,
          error: 'ID de usuário inválido'
        });
      }

      // Verificar se usuário existe
      const usuarioExistente = await db.Usuario.findById(usuarioId);
      if (!usuarioExistente) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        });
      }

      // Verificar permissões (usuário só pode deletar própria conta, exceto admin)
      if (req.user.id !== usuarioId && req.user.role !== 'superadmin') {
        return res.status(403).json({
          success: false,
          error: 'Você só pode deletar sua própria conta'
        });
      }

      // Deletar usuario (cascade configurado no schema)
      await db.Usuario.delete(usuarioId);

      res.status(204).send();

    } catch (error) {
      console.error('❌ Erro ao deletar usuário:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Restaurar um usuário soft-deleted
   */
  async restaurarUsuario(req, res) {
    try {
      const { id } = req.params;

      const usuario = await db.Usuario.restore(parseInt(id));

      res.status(200).json({
        success: true,
        message: 'Usuário restaurado com sucesso',
        data: usuario
      });
    } catch (error) {
      console.error('Erro ao restaurar usuário:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obter estatísticas do usuário
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async obterEstatisticas(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = parseInt(id);

      console.log(`📊 Obtendo estatísticas do usuário ID: ${usuarioId}`);

      if (isNaN(usuarioId)) {
        return res.status(400).json({
          success: false,
          error: 'ID de usuário inválido'
        });
      }

      // Verificar permissões
      if (req.user.id !== usuarioId && req.user.role !== 'superadmin') {
        return res.status(403).json({
          success: false,
          error: 'Você só pode ver suas próprias estatísticas'
        });
      }

      const usuario = await db.Usuario.findById(usuarioId);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        });
      }

      const estatisticas = {
        total_historias: usuario.historias?.length || 0,
        total_personagens: usuario.personagens?.length || 0,
        historias_ativas: usuario.historias?.filter(h => h.status === 'ativa').length || 0,
        personagens_por_nivel: usuario.personagens?.reduce((acc, p) => {
          acc[p.nivel || 1] = (acc[p.nivel || 1] || 0) + 1;
          return acc;
        }, {}) || {}
      };

      console.log('✅ Estatísticas obtidas com sucesso');

      res.status(200).json({
        success: true,
        data: {
          usuario: {
            id: usuario.id,
            nome: usuario.nome
          },
          estatisticas
        }
      });

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Buscar novidades do usuário (convites pendentes, notificações, etc.)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async obterNovidades(req, res) {
    try {
      const usuario_id = req.user.id;
      const { limit = 20, offset = 0 } = req.query;

      console.log(`📬 Buscando novidades para usuário ${usuario_id}`);

      // Por enquanto, buscar apenas convites pendentes
      const convites = await db.prisma.historias_convite.findMany({
        where: {
          usuario_id: usuario_id,
          status: 'pendente'
        },
        include: {
          historias: {
            select: {
              id: true,
              nome: true,
              descricao: true,
              temas: true,
              maximo_de_participantes: true,
              prologo: true,
              usuarios: {
                select: {
                  id: true,
                  nome: true
                }
              }
            }
          },
          usuarios: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          }
        },
        orderBy: {
          criado_em: 'desc'
        },
        take: parseInt(limit),
        skip: parseInt(offset)
      });

      // Contar total de convites pendentes
      const totalConvites = await db.prisma.historias_convite.count({
        where: {
          usuario_id: usuario_id,
          status: 'pendente'
        }
      });

      // Buscar solicitacoes de amizade pendentes
      const solicitacoesAmizade = await db.Amizade.findPendingReceived(usuario_id);
      const totalSolicitacoes = solicitacoesAmizade.length;

      console.log(`✅ ${convites.length} convites + ${totalSolicitacoes} solicitacoes de amizade`);

      return res.status(200).json({
        success: true,
        data: {
          convites: convites.map(convite => ({
            id: convite.id,
            tipo: 'convite_historia',
            historia: convite.historias,
            remetente: convite.historias.usuarios
              ? { id: convite.historias.usuarios.id, nome: convite.historias.usuarios.nome }
              : { id: null, nome: 'Desconhecido' },
            status: convite.status,
            criado_em: convite.criado_em
          })),
          solicitacoes_amizade: solicitacoesAmizade.map(s => ({
            id: s.id,
            tipo: 'solicitacao_amizade',
            usuario: s.requester,
            criado_em: s.criado_em
          }))
        },
        resumo: {
          total_convites: totalConvites,
          total_solicitacoes_amizade: totalSolicitacoes,
          total_novidades: totalConvites + totalSolicitacoes
        },
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < totalConvites
        }
      });

    } catch (error) {
      console.error('❌ Erro ao buscar novidades:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Promover usuário a admin (apenas admin)
   */
  async promoverSuperAdmin(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = parseInt(id);

      console.log(`👑 Promovendo usuário ${usuarioId} a superadmin`);

      const usuario = await db.Usuario.update(usuarioId, { role: 'superadmin' });

      res.status(200).json({
        success: true,
        message: 'Usuário promovido a super admin com sucesso',
        data: usuario
      });
    } catch (error) {
      console.error('❌ Erro ao promover usuário:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}

export default new UsuarioController(); 