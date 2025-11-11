import { redisClient, inicializarRedis, fecharConexaoRedis } from './redis-config.js';

/**
 * Classe para gerenciar sessões de RPG usando Redis
 */
class SessaoRPG {
  constructor() {
    this.client = redisClient;
    this.prefix = 'rpg_session:';
    this.ttl = 3600; // 1 hora em segundos
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
      console.log('salaId', salaId);
      const sessionId = `${this.prefix}${salaId}`;
      const sessao = await this.client.get(sessionId);
      console.log('sessao', sessao);
      if (!sessao) {
        return null;
      }

      const dadosSessao = JSON.parse(sessao);
      
      // Renovar TTL ao acessar
      await this.client.expire(sessionId, this.ttl);
      
      return dadosSessao;
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
  async atualizarSessao(salaId, novosDados) {
    try {
      const sessionId = `${this.prefix}${salaId}`;
      const sessaoAtual = await this.obterSessao(salaId);
      
      if (!sessaoAtual) {
        throw new Error('Sessão não encontrada');
      }

      const sessaoAtualizada = {
        ...sessaoAtual,
        ...novosDados,
        atualizadaEm: new Date().toISOString()
      };

      await this.client.setEx(sessionId, this.ttl, JSON.stringify(sessaoAtualizada));
      console.log(`Sessão atualizada para sala ${salaId}`);
      return sessaoAtualizada;
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error);
      throw error;
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
      const chaves = await this.client.keys(`${this.prefix}*`);
      const sessoes = [];

      for (const chave of chaves) {
        const sessao = await this.client.get(chave);
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
      const sessao = await this.obterSessao(salaId);
      
      if (!sessao) {
        throw new Error('Sessão não encontrada');
      }

      const estadoJogo = sessao.estadoJogo || {};
      const turnoAtual = estadoJogo.turnoAtual || 0;
      const ordemJogadores = estadoJogo.ordemJogadores || [];

      // Resetar contador de mensagens do turno
      estadoJogo.contadorMensagensTurno = 0;

      // Avançar turno
      const proximoTurno = turnoAtual + 1;
      estadoJogo.turnoAtual = proximoTurno;

      console.log(`⏭️ Avançando turno na sala ${salaId}: ${turnoAtual} -> ${proximoTurno}`);
      return await this.atualizarSessao(salaId, { estadoJogo });
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
}

// Instância singleton do gerenciador de sessões
const gerenciadorSessoes = new SessaoRPG();

// Os event listeners para SIGINT e SIGTERM estão centralizados no redis-config.js

export default gerenciadorSessoes;
