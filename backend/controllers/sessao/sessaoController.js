import db from '../../Model/index.js';
import gerenciadorSessoes from '../../redis/sessoes.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

/**
 * Controller para gerenciar sessões de RPG
 */
class SessaoController {
  
  /**
   * Iniciar uma sessão de RPG
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async iniciarSessao(req, res, next) {
    try {
      const { historiaId } = req.params;
      const { salaId, jogadores, mestre } = req.body;
      
      console.log(`🎮 Iniciando sessão para história ID: ${historiaId}`);
      
      // Verificar se a história existe
      const historia = await db.Historia.findById(parseInt(historiaId));
      
      if (!historia) {
        return res.status(404).json({
          success: false,
          error: 'História não encontrada'
        });
      }
      
      if (historia.status !== 'ativa') {
        return res.status(400).json({
          success: false,
          error: 'História não está ativa'
        });
      }
      
      // Validar número de jogadores
      if (jogadores && jogadores.length > historia.maximo_de_participantes) {
        return res.status(400).json({
          success: false,
          error: `Máximo de ${historia.maximo_de_participantes} participantes permitido`
        });
      }
      
      // Gerar ID da sala se não fornecido
      const salaIdFinal = salaId || `sala_${historiaId}_${Date.now()}`;
      
      // Criar sessão no Redis
      const dadosSessao = {
        historiaId: historiaId,
        historiaNome: historia.nome,
        tema: historia.tema,
        mestre: mestre || 'Mestre do Sistema',
        jogadores: jogadores || [],
        maxJogadores: historia.maximo_de_participantes,
        estadoJogo: {
          cena: 'Início da Aventura',
          npcs: [],
          inventario: [],
          clima: 'Ensolarado',
          tempo: 'Dia'
        },
        mensagens: []
      };
      
      const sessao = await gerenciadorSessoes.criarSessao(salaIdFinal, dadosSessao);
      
      console.log('✅ Sessão iniciada com sucesso:', salaIdFinal);
      
      res.status(200).json({
        success: true,
        message: 'Sessão iniciada com sucesso',
        data: {
          salaId: salaIdFinal,
          sessao: sessao
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao iniciar sessão:', error);
      next(error);
    }
  }
  
  /**
   * Obter sessão ativa
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async obterSessao(req, res, next) {
    try {
      const { salaId } = req.params;
      
      console.log(`🔍 Buscando sessão: ${salaId}`);
      
      const sessao = await gerenciadorSessoes.obterSessao(salaId);
      
      if (!sessao) {
        return res.status(404).json({
          success: false,
          error: 'Sessão não encontrada'
        });
      }
      
      console.log('✅ Sessão encontrada');
      
      res.status(200).json({
        success: true,
        data: sessao
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter sessão:', error);
      next(error);
    }
  }
  
  /**
   * Adicionar mensagem à sessão
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async adicionarMensagem(req, res, next) {
    try {
      const { salaId } = req.params;
      const { autor, tipo, conteudo } = req.body;
      
      console.log(`💬 Adicionando mensagem à sessão: ${salaId}`);
      
      if (!autor || !tipo || !conteudo) {
        return res.status(400).json({
          success: false,
          error: 'Autor, tipo e conteúdo são obrigatórios'
        });
      }
      
      // Validar tipo de mensagem
      const tiposValidos = ['mestre', 'jogador', 'sistema', 'npc'];
      if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({
          success: false,
          error: 'Tipo de mensagem inválido. Tipos válidos: mestre, jogador, sistema, npc'
        });
      }
      
      const mensagem = {
        autor,
        tipo,
        conteudo
      };
      
      const sessao = await gerenciadorSessoes.adicionarMensagem(salaId, mensagem);
      
      console.log('✅ Mensagem adicionada com sucesso');
      
      res.status(200).json({
        success: true,
        message: 'Mensagem adicionada com sucesso',
        data: sessao
      });
      
    } catch (error) {
      console.error('❌ Erro ao adicionar mensagem:', error);
      next(error);
    }
  }
  
  /**
   * Atualizar estado do jogo
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async atualizarEstadoJogo(req, res, next) {
    try {
      const { salaId } = req.params;
      const { estadoJogo } = req.body;
      
      console.log(`🎯 Atualizando estado do jogo na sessão: ${salaId}`);
      
      if (!estadoJogo) {
        return res.status(400).json({
          success: false,
          error: 'Estado do jogo é obrigatório'
        });
      }
      
      const sessao = await gerenciadorSessoes.atualizarEstadoJogo(salaId, estadoJogo);
      
      console.log('✅ Estado do jogo atualizado com sucesso');
      
      res.status(200).json({
        success: true,
        message: 'Estado do jogo atualizado com sucesso',
        data: sessao
      });
      
    } catch (error) {
      console.error('❌ Erro ao atualizar estado do jogo:', error);
      next(error);
    }
  }
  
  /**
   * Adicionar jogador à sessão
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async adicionarJogador(req, res, next) {
    try {
      const { salaId } = req.params;
      const { nomeJogador } = req.body;
      
      console.log(`👤 Adicionando jogador à sessão: ${salaId}`);
      
      if (!nomeJogador) {
        return res.status(400).json({
          success: false,
          error: 'Nome do jogador é obrigatório'
        });
      }
      
      const sessao = await gerenciadorSessoes.obterSessao(salaId);
      
      if (!sessao) {
        return res.status(404).json({
          success: false,
          error: 'Sessão não encontrada'
        });
      }
      
      // Verificar se já atingiu o limite de jogadores
      if (sessao.jogadores.length >= sessao.maxJogadores) {
        return res.status(400).json({
          success: false,
          error: 'Sessão já atingiu o limite máximo de jogadores'
        });
      }
      
      // Verificar se jogador já existe
      if (sessao.jogadores.includes(nomeJogador)) {
        return res.status(400).json({
          success: false,
          error: 'Jogador já está na sessão'
        });
      }
      
      // Adicionar jogador
      const jogadoresAtualizados = [...sessao.jogadores, nomeJogador];
      const sessaoAtualizada = await gerenciadorSessoes.atualizarSessao(salaId, {
        jogadores: jogadoresAtualizados
      });
      
      console.log('✅ Jogador adicionado com sucesso');
      
      res.status(200).json({
        success: true,
        message: 'Jogador adicionado com sucesso',
        data: sessaoAtualizada
      });
      
    } catch (error) {
      console.error('❌ Erro ao adicionar jogador:', error);
      next(error);
    }
  }
  
  /**
   * Remover jogador da sessão
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async removerJogador(req, res, next) {
    try {
      const { salaId, nomeJogador } = req.params;
      
      console.log(`👤 Removendo jogador da sessão: ${salaId}`);
      
      const sessao = await gerenciadorSessoes.obterSessao(salaId);
      
      if (!sessao) {
        return res.status(404).json({
          success: false,
          error: 'Sessão não encontrada'
        });
      }
      
      // Verificar se jogador existe
      if (!sessao.jogadores.includes(nomeJogador)) {
        return res.status(400).json({
          success: false,
          error: 'Jogador não está na sessão'
        });
      }
      
      // Remover jogador
      const jogadoresAtualizados = sessao.jogadores.filter(j => j !== nomeJogador);
      const sessaoAtualizada = await gerenciadorSessoes.atualizarSessao(salaId, {
        jogadores: jogadoresAtualizados
      });
      
      console.log('✅ Jogador removido com sucesso');
      
      res.status(200).json({
        success: true,
        message: 'Jogador removido com sucesso',
        data: sessaoAtualizada
      });
      
    } catch (error) {
      console.error('❌ Erro ao remover jogador:', error);
      next(error);
    }
  }
  
  /**
   * Finalizar sessão
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async finalizarSessao(req, res, next) {
    try {
      const { salaId } = req.params;
      
      console.log(`🏁 Finalizando sessão: ${salaId}`);
      
      const finalizada = await gerenciadorSessoes.finalizarSessao(salaId);
      
      if (!finalizada) {
        return res.status(404).json({
          success: false,
          error: 'Sessão não encontrada'
        });
      }
      
      console.log('✅ Sessão finalizada com sucesso');
      
      res.status(200).json({
        success: true,
        message: 'Sessão finalizada com sucesso'
      });
      
    } catch (error) {
      console.error('❌ Erro ao finalizar sessão:', error);
      next(error);
    }
  }
  
  /**
   * Listar sessões ativas
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async listarSessoesAtivas(req, res, next) {
    try {
      console.log('📋 Listando sessões ativas...');
      
      const sessoes = await gerenciadorSessoes.listarSessoesAtivas();
      
      console.log(`✅ ${sessoes.length} sessões ativas encontradas`);
      
      res.status(200).json({
        success: true,
        data: sessoes
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar sessões:', error);
      next(error);
    }
  }
  
  /**
   * Renovar sessão (estender TTL)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async renovarSessao(req, res, next) {
    try {
      const { salaId } = req.params;
      
      console.log(`🔄 Renovando sessão: ${salaId}`);
      
      const renovada = await gerenciadorSessoes.renovarSessao(salaId);
      
      if (!renovada) {
        return res.status(404).json({
          success: false,
          error: 'Sessão não encontrada'
        });
      }
      
      console.log('✅ Sessão renovada com sucesso');
      
      res.status(200).json({
        success: true,
        message: 'Sessão renovada com sucesso'
      });
      
    } catch (error) {
      console.error('❌ Erro ao renovar sessão:', error);
      next(error);
    }
  }
  
  /**
   * Obter estatísticas da sessão
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async obterEstatisticas(req, res, next) {
    try {
      const { salaId } = req.params;
      
      console.log(`📊 Obtendo estatísticas da sessão: ${salaId}`);
      
      const sessao = await gerenciadorSessoes.obterSessao(salaId);
      
      if (!sessao) {
        return res.status(404).json({
          success: false,
          error: 'Sessão não encontrada'
        });
      }
      
      // Calcular estatísticas
      const estatisticas = {
        totalMensagens: sessao.mensagens.length,
        mensagensPorTipo: sessao.mensagens.reduce((acc, msg) => {
          acc[msg.tipo] = (acc[msg.tipo] || 0) + 1;
          return acc;
        }, {}),
        totalJogadores: sessao.jogadores.length,
        tempoAtivo: Date.now() - new Date(sessao.criadaEm).getTime(),
        status: sessao.status
      };
      
      console.log('✅ Estatísticas obtidas com sucesso');
      
      res.status(200).json({
        success: true,
        data: estatisticas
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      next(error);
    }
  }
}

export default new SessaoController(); 