/**
 * Modelo PersonagemSessao - Clone do personagem durante sessao de jogo
 * Armazena snapshot imutavel + estado runtime + merge ao finalizar
 */
import { verificarLevelUp, xpParaNivel } from '../helpers/evolucaoHelper.js';

const PersonagemSessao = (prisma) => {
  const model = prisma.personagem_sessao;

  const methods = {
    /**
     * Cria clone do personagem ao iniciar sessao
     * Busca dados completos e salva snapshot imutavel
     */
    async criarClone(sessaoJogoId, personagemId, usuarioId) {
      // Verificar se clone ja existe
      const existente = await model.findUnique({
        where: { sessao_jogo_id_personagem_id: { sessao_jogo_id: sessaoJogoId, personagem_id: personagemId } }
      });
      if (existente) return existente;

      // Buscar personagem completo
      const personagem = await prisma.personagens.findFirst({
        where: { id: personagemId, deleted_at: null },
        include: {
          classes: true,
          racas: true,
          personagem_equipamento: { include: { equipamentos: true } },
          personagem_desvantagem: true
        }
      });

      if (!personagem) throw new Error(`Personagem ${personagemId} não encontrado`);

      // Buscar vantagens
      const vantagensVinculos = await prisma.personagem_vantagem.findMany({
        where: { personagem_id: personagemId }
      });
      let vantagens = [];
      if (vantagensVinculos.length > 0) {
        vantagens = await prisma.vantagens.findMany({
          where: { id: { in: vantagensVinculos.map(v => v.desvantagem_id) } } // coluna legada: desvantagem_id na tabela personagem_vantagem
        });
      }

      // Buscar desvantagens
      let desvantagens = [];
      if (personagem.personagem_desvantagem.length > 0) {
        desvantagens = await prisma.desvantagens.findMany({
          where: { id: { in: personagem.personagem_desvantagem.map(d => d.habilidade_id) } } // coluna legada: habilidade_id na tabela personagem_desvantagem
        });
      }

      const equipamentos = personagem.personagem_equipamento.map(pe => pe.equipamentos);
      const nivel = personagem.nivel || 1;

      // Calcular HP max
      const modConstituicao = Math.floor(((personagem.constituicao || 10) - 10) / 2);
      const hpMax = 10 + (nivel * 2) + (modConstituicao * nivel);

      try {
        return await model.create({
          data: {
            sessao_jogo_id: sessaoJogoId,
            personagem_id: personagemId,
            usuario_id: usuarioId,
            nome: personagem.nome,
            nivel_inicio: nivel,
            xp_inicio: personagem.xp_atual || 0,
            atributos_snapshot: {
              forca: personagem.forca || 10,
              inteligencia: personagem.inteligencia || 10,
              carisma: personagem.carisma || 10,
              destreza: personagem.destreza || 10,
              constituicao: personagem.constituicao || 10,
              agilidade: personagem.agilidade || 10
            },
            equipamentos_inicio: equipamentos.map(e => ({ id: e.id, nome: e.nome, tipo: e.tipo, bonus: e.bonus })),
            vantagens_snapshot: vantagens.map(v => ({ id: v.id, nome: v.nome, custo: v.custo })),
            desvantagens_snapshot: desvantagens.map(d => ({ id: d.id, nome: d.nome, custo: d.custo })),
            classe_nome: personagem.classes?.nome || null,
            raca_nome: personagem.racas?.nome || null,
            hp_atual: hpMax,
            hp_max: hpMax,
            nivel_fim: nivel,
            status: 'ativa'
          }
        });
      } catch (e) {
        // Race condition: outro request criou o clone entre o findUnique e o create
        if (e.code === 'P2002') {
          return await model.findUnique({
            where: { sessao_jogo_id_personagem_id: { sessao_jogo_id: sessaoJogoId, personagem_id: personagemId } }
          });
        }
        throw e;
      }
    },

    async findBySessaoEPersonagem(sessaoJogoId, personagemId) {
      return await model.findUnique({
        where: { sessao_jogo_id_personagem_id: { sessao_jogo_id: sessaoJogoId, personagem_id: personagemId } }
      });
    },

    async findBySessaoId(sessaoJogoId) {
      return await model.findMany({ where: { sessao_jogo_id: sessaoJogoId } });
    },

    async findBySessaoEUsuario(sessaoJogoId, usuarioId) {
      return await model.findFirst({
        where: { sessao_jogo_id: sessaoJogoId, usuario_id: usuarioId }
      });
    },

    async atualizarRuntime(id, data) {
      return await model.update({ where: { id }, data });
    },

    async registrarItemGanho(id, item) {
      const clone = await model.findUnique({ where: { id } });
      if (!clone) return null;
      const itens = Array.isArray(clone.itens_ganhos) ? clone.itens_ganhos : [];
      itens.push({ ...item, timestamp: new Date().toISOString() });
      return await model.update({ where: { id }, data: { itens_ganhos: itens } });
    },

    async registrarItemPerdido(id, item) {
      const clone = await model.findUnique({ where: { id } });
      if (!clone) return null;
      const itens = Array.isArray(clone.itens_perdidos) ? clone.itens_perdidos : [];
      itens.push({ ...item, timestamp: new Date().toISOString() });
      return await model.update({ where: { id }, data: { itens_perdidos: itens } });
    },

    /**
     * Adiciona XP ao clone e recalcula nivel
     * Retorna info de level-up se ocorrer
     */
    async adicionarXP(id, xpAmount) {
      const clone = await model.findUnique({ where: { id } });
      if (!clone) return null;

      const xpGanhoNovo = clone.xp_ganho + xpAmount;
      const xpTotal = clone.xp_inicio + xpGanhoNovo;
      let nivelAtual = clone.nivel_fim || clone.nivel_inicio;
      const levelUps = [];

      // Loop multi-level-up
      let xpRestante = xpTotal;
      let levelUp = verificarLevelUp(nivelAtual, xpRestante);
      while (levelUp.podeEvoluir) {
        nivelAtual = levelUp.ganhos.novoNivel;
        xpRestante = levelUp.ganhos.xpRestante;
        levelUps.push(levelUp.ganhos);
        levelUp = verificarLevelUp(nivelAtual, xpRestante);
      }

      await model.update({
        where: { id },
        data: { xp_ganho: xpGanhoNovo, nivel_fim: nivelAtual }
      });

      return { xpGanhoNovo, nivelFim: nivelAtual, levelUps, xpRestante };
    },

    /**
     * Finaliza clone e aplica mudancas ao personagem original
     */
    async finalizarEMesclar(id) {
      const clone = await model.findUnique({ where: { id } });
      if (!clone || clone.status !== 'ativa') return null;

      const personagem = await prisma.personagens.findUnique({ where: { id: clone.personagem_id } });
      if (!personagem) return null;

      // Calcular XP final
      const xpTotal = (personagem.xp_atual || 0) + clone.xp_ganho;
      let nivelAtual = personagem.nivel || 1;
      let xpRestante = xpTotal;
      let pontosAtributoPendentes = personagem.pontos_atributo_pendentes || 0;

      // Loop multi-level-up
      let levelUp = verificarLevelUp(nivelAtual, xpRestante);
      while (levelUp.podeEvoluir) {
        nivelAtual = levelUp.ganhos.novoNivel;
        xpRestante = levelUp.ganhos.xpRestante;
        pontosAtributoPendentes += levelUp.ganhos.pontosAtributo;
        levelUp = verificarLevelUp(nivelAtual, xpRestante);
      }

      // Transaction: aplica tudo atomicamente (evita merge parcial / double XP)
      return await prisma.$transaction(async (tx) => {
        // Atualizar personagem original
        await tx.personagens.update({
          where: { id: clone.personagem_id },
          data: {
            xp_atual: xpRestante,
            nivel: nivelAtual,
            xp_proximo_nivel: xpParaNivel(nivelAtual),
            pontos_atributo_pendentes: pontosAtributoPendentes,
            atualizado_em: new Date()
          }
        });

        // Adicionar itens ganhos ao personagem_equipamento
        const itensGanhos = Array.isArray(clone.itens_ganhos) ? clone.itens_ganhos : [];
        for (const item of itensGanhos) {
          if (item.equipamento_id) {
            try {
              await tx.personagem_equipamento.create({
                data: {
                  personagem_id: clone.personagem_id,
                  equipamento_id: item.equipamento_id
                }
              });
            } catch (e) {
              // Ignora duplicatas (ja possui o item)
            }
          }
        }

        // Remover itens perdidos do personagem_equipamento
        const itensPerdidos = Array.isArray(clone.itens_perdidos) ? clone.itens_perdidos : [];
        for (const item of itensPerdidos) {
          if (item.equipamento_id) {
            try {
              await tx.personagem_equipamento.delete({
                where: {
                  personagem_id_equipamento_id: {
                    personagem_id: clone.personagem_id,
                    equipamento_id: item.equipamento_id
                  }
                }
              });
            } catch (e) {
              // Ignora se nao existe
            }
          }
        }

        // Marcar clone como finalizado
        return await tx.personagem_sessao.update({
          where: { id },
          data: { status: 'finalizada', merged_at: new Date() }
        });
      });
    },

    async marcarAbandonada(id) {
      return await model.update({
        where: { id },
        data: { status: 'abandonada' }
      });
    }
  };

  return Object.assign(model, methods);
};

export default PersonagemSessao;
