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
      const sessionId = `${this.prefix}${salaId}`;
      const sessao = await this.client.get(sessionId);
      
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
}

// Instância singleton do gerenciador de sessões
const gerenciadorSessoes = new SessaoRPG();

// Os event listeners para SIGINT e SIGTERM estão centralizados no redis-config.js

export default gerenciadorSessoes;
