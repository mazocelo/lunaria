import { redisClient, inicializarRedis, fecharConexaoRedis } from './redis-config.js';
import { getCompactacaoState, mergeMestreContext } from '../agents/Mestre/contexto/mestreContextBuilder.js';

function mergeEstadoJogo(estadoAtual = {}, proximoEstado = {}) {
  return {
    ...estadoAtual,
    ...proximoEstado,
    compactacao: {
      ...(estadoAtual?.compactacao || {}),
      ...(proximoEstado?.compactacao || {})
    },
    progressao: proximoEstado?.progressao !== undefined
      ? proximoEstado.progressao
      : (estadoAtual?.progressao || null),
    mestreContexto: mergeMestreContext(
      estadoAtual?.mestreContexto || {},
      proximoEstado?.mestreContexto || {}
    )
  };
}

/**
 * Classe para gerenciar sessões de RPG usando Redis
 */
class SessaoRPG {
  constructor() {
    this.client = redisClient;
    this.prefix = 'rpg_session:';
    this.ttl = 7200; // 2 horas em segundos
    this.initialized = false;
  }

  /**
   * Inicializar conexão com Redis
   */
  async initialize() {
    if (!this.initialized) {
      await inicializarRedis();
      this.initialized = true;
    }
  }

  /**
   * Criar uma nova sessão de RPG
   * @param {string} salaId - ID da sala
   * @param {Object} dadosSessao - Dados da sessão
   * @returns {Promise<Object>} - Dados da sessão criada
   */
  async criarSessao(salaId, dadosSessao) {
    try {
      await this.initialize();
      const sessionId = `${this.prefix}${salaId}`;
      const sessao = {
        id: salaId,
        criadaEm: new Date().toISOString(),
        atualizadaEm: new Date().toISOString(),
        status: 'ativa',
        ...dadosSessao
      };

      await this.client.setEx(sessionId, this.ttl, JSON.stringify(sessao));
      console.log(`Sessão criada para sala ${salaId}`);
      return sessao;
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      throw error;
    }
  }

  /**
   * Recuperar uma sessão de RPG
   * @param {string} salaId - ID da sala
   * @returns {Promise<Object|null>} - Dados da sessão ou null se não encontrada
   */
  async obterSessao(salaId) {
    try {
      const sessionId = `${this.prefix}${salaId}`;
      // GETEX: GET + renew TTL in a single command
      const sessao = await this.client.getEx(sessionId, { EX: this.ttl });

      if (!sessao) {
        return null;
      }

      return JSON.parse(sessao);
    } catch (error) {
      console.error('Erro ao obter sessão:', error);
      throw error;
    }
  }

  /**
   * Atualizar uma sessão de RPG
   * @param {string} salaId - ID da sala
   * @param {Object} novosDados - Novos dados da sessão
   * @returns {Promise<Object>} - Dados atualizados da sessão
   */
  async atualizarSessao(salaId, novosDados, maxRetries = 3) {
    const sessionId = `${this.prefix}${salaId}`;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Atomic update: WATCH + GET + MULTI/EXEC
        await this.client.watch(sessionId);

        const sessaoRaw = await this.client.get(sessionId);
        if (!sessaoRaw) {
          await this.client.unwatch();
          throw new Error('Sessão não encontrada');
        }

        const sessaoAtual = JSON.parse(sessaoRaw);
        const sessaoAtualizada = {
          ...sessaoAtual,
          ...novosDados,
          estadoJogo: mergeEstadoJogo(sessaoAtual.estadoJogo || {}, novosDados.estadoJogo || {}),
          mestreContexto: mergeMestreContext(
            sessaoAtual.mestreContexto || sessaoAtual.estadoJogo?.mestreContexto || {},
            novosDados.mestreContexto || novosDados.estadoJogo?.mestreContexto || {}
          ),
          atualizadaEm: new Date().toISOString()
        };

        if (sessaoAtualizada.mestreContexto && Object.keys(sessaoAtualizada.mestreContexto).length > 0) {
          sessaoAtualizada.estadoJogo = sessaoAtualizada.estadoJogo || {};
          sessaoAtualizada.estadoJogo.mestreContexto = sessaoAtualizada.mestreContexto;
        }

        sessaoAtualizada.estadoJogo = sessaoAtualizada.estadoJogo || {};
        sessaoAtualizada.estadoJogo.compactacao = getCompactacaoState(
          sessaoAtualizada.estadoJogo,
          sessaoAtualizada.mensagens || []
        );

        const multi = this.client.multi();
        multi.setEx(sessionId, this.ttl, JSON.stringify(sessaoAtualizada));
        const results = await multi.exec();

        // If EXEC returns null, the key was modified by another client (race condition)
        if (results === null) {
          if (attempt < maxRetries - 1) continue;
          throw new Error('Conflito de concorrencia ao atualizar sessao');
        }

        return sessaoAtualizada;
      } catch (error) {
        if (error.message === 'Sessão não encontrada' || error.message.includes('Conflito')) {
          throw error;
        }
        console.error('Erro ao atualizar sessão:', error);
        throw error;
      }
    }
  }

  /**
   * Adicionar mensagem à sessão
   * @param {string} salaId - ID da sala
   * @param {Object} mensagem - Dados da mensagem
   * @returns {Promise<Object>} - Sessão atualizada
   */
  async adicionarMensagem(salaId, mensagem) {
    try {
      const sessao = await this.obterSessao(salaId);
      
      if (!sessao) {
        throw new Error('Sessão não encontrada');
      }

      const mensagens = sessao.mensagens || [];
      mensagens.push({
        ...mensagem,
        timestamp: new Date().toISOString()
      });

      // Manter apenas as últimas 500 mensagens
      if (mensagens.length > 500) {
        mensagens.splice(0, mensagens.length - 500);
      }

      return await this.atualizarSessao(salaId, { mensagens });
    } catch (error) {
      console.error('Erro ao adicionar mensagem:', error);
      throw error;
    }
  }

  /**
   * Atualizar estado do jogo na sessão
   * @param {string} salaId - ID da sala
   * @param {Object} estadoJogo - Novo estado do jogo
   * @returns {Promise<Object>} - Sessão atualizada
   */
  async atualizarEstadoJogo(salaId, estadoJogo) {
    try {
      return await this.atualizarSessao(salaId, { estadoJogo });
    } catch (error) {
      console.error('Erro ao atualizar estado do jogo:', error);
      throw error;
    }
  }

  /**
   * Adicionar ação RPG à sessão
   * @param {string} salaId - ID da sala
   * @param {Object} acao - Dados da ação
   * @returns {Promise<Object>} - Sessão atualizada
   */
  async adicionarAcao(salaId, acao) {
    try {
      const sessao = await this.obterSessao(salaId);
      
      if (!sessao) {
        throw new Error('Sessão não encontrada');
      }

      const acoes = sessao.acoes || [];
      acoes.push({
        ...acao,
        timestamp: new Date().toISOString()
      });

      // Manter apenas as últimas 100 ações
      if (acoes.length > 100) {
        acoes.shift();
      }

      return await this.atualizarSessao(salaId, { acoes });
    } catch (error) {
      console.error('Erro ao adicionar ação:', error);
      throw error;
    }
  }

  /**
   * Adicionar rolagem de dados à sessão
   * @param {string} salaId - ID da sala
   * @param {Object} rolagem - Dados da rolagem
   * @returns {Promise<Object>} - Sessão atualizada
   */
  async adicionarRolagem(salaId, rolagem) {
    try {
      const sessao = await this.obterSessao(salaId);
      
      if (!sessao) {
        throw new Error('Sessão não encontrada');
      }

      const rolagens = sessao.rolagens || [];
      rolagens.push({
        ...rolagem,
        timestamp: new Date().toISOString()
      });

      // Manter apenas as últimas 100 rolagens
      if (rolagens.length > 100) {
        rolagens.shift();
      }

      return await this.atualizarSessao(salaId, { rolagens });
    } catch (error) {
      console.error('Erro ao adicionar rolagem:', error);
      throw error;
    }
  }

  /**
   * Finalizar uma sessão de RPG
   * @param {string} salaId - ID da sala
   * @returns {Promise<boolean>} - True se finalizada com sucesso
   */
  async finalizarSessao(salaId) {
    try {
      const sessionId = `${this.prefix}${salaId}`;
      const sessao = await this.obterSessao(salaId);
      
      if (!sessao) {
        return false;
      }

      const sessaoFinalizada = {
        ...sessao,
        status: 'finalizada',
        finalizadaEm: new Date().toISOString(),
        atualizadaEm: new Date().toISOString()
      };

      await this.client.setEx(sessionId, this.ttl, JSON.stringify(sessaoFinalizada));
      console.log(`Sessão finalizada para sala ${salaId}`);
      return true;
    } catch (error) {
      console.error('Erro ao finalizar sessão:', error);
      throw error;
    }
  }

  /**
   * Excluir uma sessão de RPG
   * @param {string} salaId - ID da sala
   * @returns {Promise<boolean>} - True se excluída com sucesso
   */
  async excluirSessao(salaId) {
    try {
      const sessionId = `${this.prefix}${salaId}`;
      const resultado = await this.client.del(sessionId);
      console.log(`Sessão excluída para sala ${salaId}`);
      return resultado > 0;
    } catch (error) {
      console.error('Erro ao excluir sessão:', error);
      throw error;
    }
  }

  /**
   * Listar todas as sessões ativas
   * @returns {Promise<Array>} - Lista de sessões ativas
   */
  async listarSessoesAtivas() {
    try {
      const sessoes = [];
      const pattern = `${this.prefix}*`;

      // Use SCAN instead of KEYS to avoid blocking Redis
      for await (const key of this.client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
        const sessao = await this.client.get(key);
        if (sessao) {
          const dadosSessao = JSON.parse(sessao);
          if (dadosSessao.status === 'ativa') {
            sessoes.push(dadosSessao);
          }
        }
      }

      return sessoes;
    } catch (error) {
      console.error('Erro ao listar sessões:', error);
      throw error;
    }
  }

  /**
   * Verificar se uma sessão existe
   * @param {string} salaId - ID da sala
   * @returns {Promise<boolean>} - True se a sessão existe
   */
  async sessaoExiste(salaId) {
    try {
      const sessionId = `${this.prefix}${salaId}`;
      const existe = await this.client.exists(sessionId);
      return existe === 1;
    } catch (error) {
      console.error('Erro ao verificar existência da sessão:', error);
      throw error;
    }
  }

  /**
   * Renovar TTL de uma sessão
   * @param {string} salaId - ID da sala
   * @returns {Promise<boolean>} - True se renovada com sucesso
   */
  async renovarSessao(salaId) {
    try {
      const sessionId = `${this.prefix}${salaId}`;
      const resultado = await this.client.expire(sessionId, this.ttl);
      return resultado === 1;
    } catch (error) {
      console.error('Erro ao renovar sessão:', error);
      throw error;
    }
  }

  /**
   * Fechar conexão com Redis
   */
  async fecharConexao() {
    try {
      await fecharConexaoRedis();
    } catch (error) {
      console.error('Erro ao fechar conexão com Redis:', error);
    }
  }

  // ===== MÉTODOS PARA SISTEMA DE RODADAS E TURNOS =====

  /**
   * Atualizar fase do jogo
   * @param {string} salaId - ID da sala
   * @param {string} fase - Nova fase ('aguardando_inicio' | 'rolagem_inicial' | 'rodada_em_andamento' | 'entre_rodadas')
   * @returns {Promise<Object>} - Sessão atualizada
   */
  async atualizarFaseJogo(salaId, fase) {
    try {
      const sessao = await this.obterSessao(salaId);
      
      if (!sessao) {
        throw new Error('Sessão não encontrada');
      }

      const estadoJogo = sessao.estadoJogo || {};
      estadoJogo.fase = fase;

      console.log(`🎮 Fase do jogo atualizada para "${fase}" na sala ${salaId}`);
      return await this.atualizarSessao(salaId, { estadoJogo });
    } catch (error) {
      console.error('Erro ao atualizar fase do jogo:', error);
      throw error;
    }
  }

  /**
   * Registrar rolagem de dado inicial
   * @param {string} salaId - ID da sala
   * @param {string} userId - ID do usuário
   * @param {number} valor - Valor do dado (1-20)
   * @returns {Promise<Object>} - Sessão atualizada
   */
  async registrarRolagemDado(salaId, userId, valor) {
    try {
      const sessao = await this.obterSessao(salaId);
      
      if (!sessao) {
        throw new Error('Sessão não encontrada');
      }

      const estadoJogo = sessao.estadoJogo || {};
      const rolagemInicial = estadoJogo.rolagemInicial || {};
      
      rolagemInicial[userId] = {
        valor,
        timestamp: new Date().toISOString()
      };

      estadoJogo.rolagemInicial = rolagemInicial;

      console.log(`🎲 Jogador ${userId} rolou ${valor} na sala ${salaId}`);
      return await this.atualizarSessao(salaId, { estadoJogo });
    } catch (error) {
      console.error('Erro ao registrar rolagem de dado:', error);
      throw error;
    }
  }

  /**
   * Definir ordem dos jogadores baseada na rolagem inicial
   * @param {string} salaId - ID da sala
   * @returns {Promise<Object>} - Sessão atualizada com ordem definida
   */
  async definirOrdemJogadores(salaId) {
    try {
      const sessao = await this.obterSessao(salaId);
      
      if (!sessao) {
        throw new Error('Sessão não encontrada');
      }

      const estadoJogo = sessao.estadoJogo || {};
      const rolagemInicial = estadoJogo.rolagemInicial || {};
      const jogadores = sessao.jogadores || {};

      // Criar array com informações dos jogadores e suas rolagens
      const ordemJogadores = Object.keys(rolagemInicial).map(userId => {
        const jogador = jogadores[userId] || {};
        const rolagem = rolagemInicial[userId];
        
        return {
          userId,
          username: jogador.nome || 'Jogador',
          personagemNome: jogador.personagemNome || null,
          valorDado: rolagem.valor
        };
      });

      // Ordenar por valor do dado (DESC) - maior valor primeiro
      ordemJogadores.sort((a, b) => b.valorDado - a.valorDado);

      estadoJogo.ordemJogadores = ordemJogadores;
      estadoJogo.turnoAtual = 0; // Começa com o primeiro jogador

      console.log(`📋 Ordem dos jogadores definida na sala ${salaId}:`, ordemJogadores.map(j => `${j.username} (${j.valorDado})`).join(', '));
      return await this.atualizarSessao(salaId, { estadoJogo });
    } catch (error) {
      console.error('Erro ao definir ordem dos jogadores:', error);
      throw error;
    }
  }

  /**
   * Avançar para o próximo turno
   * @param {string} salaId - ID da sala
   * @returns {Promise<Object>} - Sessão atualizada
   */
  async avancarTurno(salaId) {
    try {
      // Distributed lock to prevent concurrent turn advances
      const lockKey = `${this.prefix}lock:turno:${salaId}`;
      const lockAcquired = await this.client.set(lockKey, '1', { NX: true, EX: 5 });

      if (!lockAcquired) {
        throw new Error('Turno ja esta sendo avancado por outro jogador');
      }

      try {
        const sessao = await this.obterSessao(salaId);

        if (!sessao) {
          throw new Error('Sessão não encontrada');
        }

        const estadoJogo = sessao.estadoJogo || {};
        const turnoAtual = estadoJogo.turnoAtual || 0;
        const ordemJogadores = estadoJogo.ordemJogadores || [];

        estadoJogo.contadorMensagensTurno = 0;

        const proximoTurno = turnoAtual + 1;
        estadoJogo.turnoAtual = proximoTurno;

        console.log(`Avancando turno na sala ${salaId}: ${turnoAtual} -> ${proximoTurno}`);
        return await this.atualizarSessao(salaId, { estadoJogo });
      } finally {
        await this.client.del(lockKey);
      }
    } catch (error) {
      console.error('Erro ao avançar turno:', error);
      throw error;
    }
  }

  /**
   * Verificar se a rodada chegou ao fim
   * @param {string} salaId - ID da sala
   * @returns {Promise<boolean>} - True se a rodada terminou
   */
  async verificarFimRodada(salaId) {
    try {
      const sessao = await this.obterSessao(salaId);
      
      if (!sessao) {
        throw new Error('Sessão não encontrada');
      }

      const estadoJogo = sessao.estadoJogo || {};
      const turnoAtual = estadoJogo.turnoAtual || 0;
      const ordemJogadores = estadoJogo.ordemJogadores || [];

      const fimRodada = turnoAtual >= ordemJogadores.length;
      
      if (fimRodada) {
        console.log(`🏁 Rodada finalizada na sala ${salaId}`);
      }

      return fimRodada;
    } catch (error) {
      console.error('Erro ao verificar fim de rodada:', error);
      throw error;
    }
  }

  /**
   * Incrementar contador de mensagens do turno
   * @param {string} salaId - ID da sala
   * @returns {Promise<number>} - Novo valor do contador
   */
  async incrementarContadorMensagensTurno(salaId) {
    try {
      const sessao = await this.obterSessao(salaId);
      
      if (!sessao) {
        throw new Error('Sessão não encontrada');
      }

      const estadoJogo = sessao.estadoJogo || {};
      const contador = (estadoJogo.contadorMensagensTurno || 0) + 1;
      estadoJogo.contadorMensagensTurno = contador;

      await this.atualizarSessao(salaId, { estadoJogo });
      return contador;
    } catch (error) {
      console.error('Erro ao incrementar contador de mensagens:', error);
      throw error;
    }
  }

  /**
   * Verificar cooldown de roleplay do jogador
   * @param {string} salaId - ID da sala
   * @param {string} userId - ID do usuário
   * @returns {Promise<number>} - Segundos restantes de cooldown (0 se pode enviar)
   */
  async verificarCooldownRoleplay(salaId, userId) {
    try {
      const sessao = await this.obterSessao(salaId);
      
      if (!sessao) {
        throw new Error('Sessão não encontrada');
      }

      const estadoJogo = sessao.estadoJogo || {};
      const cooldownRoleplay = estadoJogo.cooldownRoleplay || {};
      const ultimoEnvio = cooldownRoleplay[userId];

      if (!ultimoEnvio) {
        return 0; // Nunca enviou, pode enviar
      }

      const agora = new Date().getTime();
      const timestampUltimo = new Date(ultimoEnvio).getTime();
      const diferencaMs = agora - timestampUltimo;
      const diferencaSeg = Math.floor(diferencaMs / 1000);
      const cooldownSeg = 12;

      const restante = Math.max(0, cooldownSeg - diferencaSeg);
      return restante;
    } catch (error) {
      console.error('Erro ao verificar cooldown roleplay:', error);
      throw error;
    }
  }

  /**
   * Atualizar timestamp do cooldown de roleplay
   * @param {string} salaId - ID da sala
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} - Sessão atualizada
   */
  async atualizarCooldownRoleplay(salaId, userId) {
    try {
      const sessao = await this.obterSessao(salaId);
      
      if (!sessao) {
        throw new Error('Sessão não encontrada');
      }

      const estadoJogo = sessao.estadoJogo || {};
      const cooldownRoleplay = estadoJogo.cooldownRoleplay || {};
      
      cooldownRoleplay[userId] = new Date().toISOString();
      estadoJogo.cooldownRoleplay = cooldownRoleplay;

      return await this.atualizarSessao(salaId, { estadoJogo });
    } catch (error) {
      console.error('Erro ao atualizar cooldown roleplay:', error);
      throw error;
    }
  }

  /**
   * Adicionar turno ao histórico
   * @param {string} salaId - ID da sala
   * @param {Object} dadosTurno - Dados do turno {rodada, turno, userId, mensagens}
   * @returns {Promise<Object>} - Sessão atualizada
   */
  async adicionarHistoricoTurno(salaId, dadosTurno) {
    try {
      const sessao = await this.obterSessao(salaId);
      
      if (!sessao) {
        throw new Error('Sessão não encontrada');
      }

      const estadoJogo = sessao.estadoJogo || {};
      const historicoTurnos = estadoJogo.historicoTurnos || [];
      
      historicoTurnos.push({
        ...dadosTurno,
        timestamp: new Date().toISOString()
      });

      estadoJogo.historicoTurnos = historicoTurnos;

      return await this.atualizarSessao(salaId, { estadoJogo });
    } catch (error) {
      console.error('Erro ao adicionar histórico de turno:', error);
      throw error;
    }
  }

  /**
   * Iniciar nova rodada
   * @param {string} salaId - ID da sala
   * @returns {Promise<Object>} - Sessão atualizada
   */
  async iniciarNovaRodada(salaId) {
    try {
      const sessao = await this.obterSessao(salaId);
      
      if (!sessao) {
        throw new Error('Sessão não encontrada');
      }

      const estadoJogo = sessao.estadoJogo || {};
      const rodadaAtual = (estadoJogo.rodadaAtual || 1) + 1;
      
      estadoJogo.rodadaAtual = rodadaAtual;
      estadoJogo.turnoAtual = 0;
      estadoJogo.contadorMensagensTurno = 0;
      estadoJogo.fase = 'rodada_em_andamento';

      console.log(`🔄 Nova rodada iniciada (${rodadaAtual}) na sala ${salaId}`);
      return await this.atualizarSessao(salaId, { estadoJogo });
    } catch (error) {
      console.error('Erro ao iniciar nova rodada:', error);
      throw error;
    }
  }

  /**
   * Verificar se precisa gerar resumo
   * @param {string} salaId - ID da sala
   * @returns {Promise<boolean>} - True se precisa resumir
   */
  async precisaResumir(salaId) {
    try {
      const sessao = await this.obterSessao(salaId);
      if (!sessao) return false;

      const rodadas = sessao.estadoJogo?.rodadaAtual || 0;
      const mensagens = (sessao.mensagens || []).length;
      const compactacao = getCompactacaoState(sessao.estadoJogo || {}, sessao.mensagens || []);

      const precisaPorRodadas = rodadas > compactacao.ultimaRodadaCompactada;
      const precisaPorMensagens = mensagens - compactacao.ultimaMensagemIndex >= 30;

      return precisaPorRodadas || precisaPorMensagens;
    } catch (error) {
      console.error('Erro ao verificar se precisa resumir:', error);
      return false;
    }
  }

  /**
   * Salvar resumo na sessão
   * @param {string} salaId - ID da sala
   * @param {Object} resumo - Dados do resumo
   * @returns {Promise<Object>} - Sessão atualizada
   */
  async salvarResumo(salaId, resumo, meta = {}) {
    try {
      const sessao = await this.obterSessao(salaId);

      if (!sessao.resumos) {
        sessao.resumos = [];
      }

      sessao.resumos.push(resumo);
      sessao.ultimoResumoRodada = sessao.estadoJogo?.rodadaAtual || 0;
      sessao.ultimoResumoMensagens = (sessao.mensagens || []).length;
      sessao.atualizadaEm = new Date().toISOString();
      sessao.estadoJogo = sessao.estadoJogo || {};
      sessao.estadoJogo.compactacao = {
        ultimaMensagemIndex: meta.ultimaMensagemIndex ?? (sessao.mensagens || []).length,
        ultimaRodadaCompactada: meta.ultimaRodadaCompactada ?? (sessao.estadoJogo?.rodadaAtual || 0),
        ultimaCompactacaoEm: new Date().toISOString(),
        totalMensagens: (sessao.mensagens || []).length
      };

      // Trim de mensagens: manter últimas 200 após resumo consolidar as anteriores
      const MAX_MENSAGENS_REDIS = 200;
      if (sessao.mensagens && sessao.mensagens.length > MAX_MENSAGENS_REDIS) {
        const trimmed = sessao.mensagens.length - MAX_MENSAGENS_REDIS;
        sessao.mensagens = sessao.mensagens.slice(-MAX_MENSAGENS_REDIS);
        console.log(`🧹 Trim: ${trimmed} mensagens antigas removidas do Redis (mantidas ${MAX_MENSAGENS_REDIS})`);
      }

      // Manter apenas último resumo (cumulativo — já consolida anteriores)
      if (sessao.resumos.length > 2) {
        sessao.resumos = sessao.resumos.slice(-2);
      }

      console.log(`📝 Resumo salvo - Rodada ${sessao.ultimoResumoRodada}, ${sessao.ultimoResumoMensagens} mensagens`);

      return await this.atualizarSessao(salaId, sessao);
    } catch (error) {
      console.error('Erro ao salvar resumo:', error);
      throw error;
    }
  }

  /**
   * Obter último resumo
   * @param {string} salaId - ID da sala
   * @returns {Promise<Object|null>} - Último resumo ou null
   */
  async obterUltimoResumo(salaId) {
    try {
      const sessao = await this.obterSessao(salaId);
      
      if (!sessao || !sessao.resumos || sessao.resumos.length === 0) {
        return null;
      }

      return sessao.resumos[sessao.resumos.length - 1];
    } catch (error) {
      console.error('Erro ao obter último resumo:', error);
      return null;
    }
  }
}

// Instância singleton do gerenciador de sessões
const gerenciadorSessoes = new SessaoRPG();

// Os event listeners para SIGINT e SIGTERM estão centralizados no redis-config.js

export default gerenciadorSessoes;
