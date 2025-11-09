import db from '../../Model/index.js';

/**
 * Controller para gerenciamento de convites para histórias
 */
class ConviteController {
  
  /**
   * Criar um novo convite para uma história
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async criarConvite(req, res) {
    try {
      const { historia_id, email } = req.body;
      const usuario_remetente_id = req.user.id;

      // Validar campos obrigatórios
      if (!historia_id || !email) {
        return res.status(400).json({
          success: false,
          error: 'História ID e email são obrigatórios'
        });
      }

      // Verificar se a história existe e se o usuário é o criador
      const historia = await db.Historia.findById(historia_id);
      if (!historia) {
        return res.status(404).json({
          success: false,
          error: 'História não encontrada'
        });
      }

      if (historia.id_usuario !== usuario_remetente_id) {
        return res.status(403).json({
          success: false,
          error: 'Apenas o criador da história pode enviar convites'
        });
      }

      // Verificar se o usuário destinatário existe
      const usuario_destinatario = await db.Usuario.findByEmail(email);
      if (!usuario_destinatario) {
        return res.status(404).json({
          success: false,
          error: 'Usuário com este email não encontrado'
        });
      }

      // Verificar se já existe um convite pendente
      const conviteExistente = await db.prisma.historias_convite.findFirst({
        where: {
          historia_id: parseInt(historia_id),
          usuario_id: usuario_destinatario.id,
          status: 'pendente'
        }
      });

      if (conviteExistente) {
        return res.status(400).json({
          success: false,
          error: 'Já existe um convite pendente para este usuário nesta história'
        });
      }

      // Criar o convite
      const novoConvite = await db.prisma.historias_convite.create({
        data: {
          historia_id: parseInt(historia_id),
          usuario_id: usuario_destinatario.id,
          status: 'pendente'
        },
        include: {
          historias: {
            select: {
              id: true,
              nome: true,
              descricao: true,
              temas: true
            }
          },
          usuarios: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          }
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Convite enviado com sucesso',
        data: {
          id: novoConvite.id,
          historia: novoConvite.historias,
          usuario_convidado: novoConvite.usuarios,
          status: novoConvite.status,
          criado_em: novoConvite.criado_em
        }
      });

    } catch (error) {
      console.error('❌ Erro ao criar convite:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }


  /**
   * Aceitar um convite
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async aceitarConvite(req, res) {
    try {
      const { id } = req.params;
      const { personagem_id } = req.body;
      const usuario_id = req.user.id;

      // Validar se personagem_id foi fornecido
      if (!personagem_id) {
        return res.status(400).json({
          success: false,
          error: 'ID do personagem é obrigatório para aceitar o convite'
        });
      }

      // Verificar se o convite existe e pertence ao usuário
      const convite = await db.prisma.historias_convite.findFirst({
        where: {
          id: parseInt(id),
          usuario_id: usuario_id,
          status: 'pendente'
        },
        include: {
          historias: {
            select: {
              id: true,
              nome: true,
              descricao: true,
              maximo_de_participantes: true
            }
          }
        }
      });

      if (!convite) {
        return res.status(404).json({
          success: false,
          error: 'Convite não encontrado ou já foi respondido'
        });
      }

      // Verificar se o personagem existe e pertence ao usuário
      const personagem = await db.prisma.personagens.findFirst({
        where: {
          id: parseInt(personagem_id),
          id_usuario: usuario_id
        },
        select: {
          id: true,
          nome: true,
          nivel: true,
          classe_id: true,
          raca_id: true,
          classes: {
            select: {
              nome: true
            }
          },
          racas: {
            select: {
              nome: true
            }
          }
        }
      });

      if (!personagem) {
        return res.status(404).json({
          success: false,
          error: 'Personagem não encontrado ou não pertence a você'
        });
      }

      // Verificar se o personagem já está participando desta história
      const jaParticipa = await db.prisma.historias_personagens.findFirst({
        where: {
          historia_id: convite.historia_id,
          personagem_id: parseInt(personagem_id)
        }
      });

      if (jaParticipa) {
        return res.status(400).json({
          success: false,
          error: 'Este personagem já está participando desta história'
        });
      }

      // Verificar se a história ainda tem vagas
      const participantesAtuais = await db.prisma.historias_personagens.count({
        where: {
          historia_id: convite.historia_id
        }
      });

      if (convite.historias.maximo_de_participantes && 
          participantesAtuais >= convite.historias.maximo_de_participantes) {
        return res.status(400).json({
          success: false,
          error: 'Esta história já atingiu o número máximo de participantes'
        });
      }

      // Usar transação para garantir consistência
      const resultado = await db.prisma.$transaction(async (prisma) => {
        // Atualizar status do convite para aceito
        const conviteAtualizado = await prisma.historias_convite.update({
          where: {
            id: parseInt(id)
          },
          data: {
            status: 'aceito',
            respondido_em: new Date()
          }
        });

        // Adicionar personagem à história
        const participacao = await prisma.historias_personagens.create({
          data: {
            historia_id: convite.historia_id,
            personagem_id: parseInt(personagem_id),
            papel: 'jogador' // papel padrão
          }
        });

        return { conviteAtualizado, participacao };
      });

      return res.status(200).json({
        success: true,
        message: 'Convite aceito com sucesso e personagem adicionado à história',
        data: {
          id: resultado.conviteAtualizado.id,
          historia: convite.historias,
          personagem: {
            id: personagem.id,
            nome: personagem.nome,
            nivel: personagem.nivel,
            classe: personagem.classes?.nome,
            raca: personagem.racas?.nome
          },
          status: resultado.conviteAtualizado.status,
          respondido_em: resultado.conviteAtualizado.respondido_em,
          participacao_id: resultado.participacao.id
        }
      });

    } catch (error) {
      console.error('❌ Erro ao aceitar convite:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Recusar um convite
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async recusarConvite(req, res) {
    try {
      const { id } = req.params;
      const usuario_id = req.user.id;

      // Verificar se o convite existe e pertence ao usuário
      const convite = await db.prisma.historias_convite.findFirst({
        where: {
          id: parseInt(id),
          usuario_id: usuario_id,
          status: 'pendente'
        }
      });

      if (!convite) {
        return res.status(404).json({
          success: false,
          error: 'Convite não encontrado ou já foi respondido'
        });
      }

      // Atualizar status do convite para recusado
      const conviteAtualizado = await db.prisma.historias_convite.update({
        where: {
          id: parseInt(id)
        },
        data: {
          status: 'recusado',
          respondido_em: new Date()
        },
        include: {
          historias: {
            select: {
              id: true,
              nome: true,
              descricao: true
            }
          }
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Convite recusado',
        data: {
          id: conviteAtualizado.id,
          historia: conviteAtualizado.historias,
          status: conviteAtualizado.status,
          respondido_em: conviteAtualizado.respondido_em
        }
      });

    } catch (error) {
      console.error('❌ Erro ao recusar convite:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Listar todos os convites enviados pelo usuário logado
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async listarConvitesEnviados(req, res) {
    try {
      const usuario_id = req.user.id;
      const { limit = 20, offset = 0, status } = req.query;

      // Buscar histórias criadas pelo usuário
      const minhasHistorias = await db.prisma.historias.findMany({
        where: {
          id_usuario: usuario_id
        },
        select: {
          id: true
        }
      });

      const historiaIds = minhasHistorias.map(h => h.id);

      if (historiaIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          pagination: {
            total: 0,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: false
          }
        });
      }

      // Filtros da consulta
      const whereClause = {
        historia_id: {
          in: historiaIds
        }
      };

      if (status) {
        whereClause.status = status;
      }

      const convites = await db.prisma.historias_convite.findMany({
        where: whereClause,
        include: {
          historias: {
            select: {
              id: true,
              nome: true,
              descricao: true
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

      // Contar total
      const total = await db.prisma.historias_convite.count({
        where: whereClause
      });

      return res.status(200).json({
        success: true,
        data: convites.map(convite => ({
          id: convite.id,
          historia: convite.historias,
          usuario_convidado: convite.usuarios,
          status: convite.status,
          criado_em: convite.criado_em,
          respondido_em: convite.respondido_em
        })),
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
      });

    } catch (error) {
      console.error('❌ Erro ao listar convites enviados:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}

export default new ConviteController();
