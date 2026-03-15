import db from '../../Model/index.js';
import criadorCompleto from '../../agents/historia/Criador.js';
import { criarGeradorPrologo } from '../../agents/historia/prologo/index.js';
import { criarGeradorTitulo } from '../../agents/historia/titulos/aleatorios/index.js';
import gerenciadorSessoes from '../../redis/sessoes.js';
import blueprintService from '../../services/blueprintService.js';
import { enqueueRoteiroJob } from '../../jobs/enqueueRoteiroJob.js';
import { findLatestRoteiroJobForHistoria, serializeAiJob } from '../../jobs/aiJobs.js';
import { processarGeracaoRoteiro as processarGeracaoRoteiroService } from '../../services/roteiroGenerationService.js';
import { isValidMode } from '../../config/blueprintModes.js';
import { consumirCotaBlueprint } from '../../services/blueprintQuotaService.js';
import { usuarioPodeAcessarHistoria, sincronizarRoteiroNaSessao } from '../../helpers/historiaAuthPolicy.js';
import logger from '../../helpers/logger.js';
const log = logger.child({ module: 'historiaController' });

/**
 * Controller para gerenciar operações de história
 */
class HistoriaController {
  constructor() {
    this.criarHistoria = this.criarHistoria.bind(this);
    this.listarHistorias = this.listarHistorias.bind(this);
    this.obterHistoria = this.obterHistoria.bind(this);
    this.atualizarHistoria = this.atualizarHistoria.bind(this);
    this.excluirHistoria = this.excluirHistoria.bind(this);
    this.restaurarHistoria = this.restaurarHistoria.bind(this);
    this.gerarHistoriaComIA = this.gerarHistoriaComIA.bind(this);
    this.gerarAventuraCompleta = this.gerarAventuraCompleta.bind(this);
    this.listarMinhasHistorias = this.listarMinhasHistorias.bind(this);
    this.listarHistoriasComPersonagens = this.listarHistoriasComPersonagens.bind(this);
    this.gerarRoteiro = this.gerarRoteiro.bind(this);
    this.obterRoteiro = this.obterRoteiro.bind(this);
    this.atualizarRoteiro = this.atualizarRoteiro.bind(this);
    this.obterProgressao = this.obterProgressao.bind(this);
    this.atualizarProgressao = this.atualizarProgressao.bind(this);
  }

  parseTemaQueryValue(req) {
    const raw = req.query.temas ?? req.query.tema ?? req.query.tema_id;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  async obterSocketManager() {
    return (await import('../../websocket/socketManager.js')).default;
  }

  async emitirEventoRoteiro(historiaId, evento, payload = {}) {
    try {
      const socketManager = await this.obterSocketManager();
      if (socketManager?.io) {
        socketManager.io.to(`historia_${historiaId}`).emit(evento, {
          historiaId: parseInt(historiaId, 10),
          ...payload
        });
      }
    } catch (_) {
      // socket nao disponivel
    }
  }

  async gerarTemasNomes(temas = []) {
    const temasDB = await db.Temas.findAll();
    return (temas || []).map(tid => {
      const tema = temasDB.find(item => item.id === tid);
      return tema?.nome || `Tema ${tid}`;
    });
  }

  async processarGeracaoRoteiro(historia, userId, options = {}) {
    const {
      emitirErroSocket = true,
      onSuccess = null,
      onError = null,
      ...serviceOptions
    } = options;

    return processarGeracaoRoteiroService(historia, userId, {
      ...serviceOptions,
      onSuccess: async (payload) => {
        await this.emitirEventoRoteiro(payload.historiaId, 'roteiro_gerado');
        log.info({ payload_historiaId: payload.historiaId }, 'Roteiro gerado com sucesso para historia');

        if (typeof onSuccess === 'function') {
          await onSuccess(payload);
        }
      },
      onError: async (payload) => {
        if (emitirErroSocket) {
          await this.emitirEventoRoteiro(payload.historiaId, 'roteiro_erro', {
            error: payload.error.message
          });
        }

        if (typeof onError === 'function') {
          await onError(payload);
        }
      }
    });
  }

  
  /**
   * Criar uma nova história com prólogo gerado automaticamente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async criarHistoria(req, res, next) {
    try {
      log.info('Criando nova historia');
      
      const { nome, temas, maximo_de_participantes, descricao, participantes, temas_disponiveis, mestre_id, publica, imagem, mapas } = req.body;
      
      // Validações básicas
      if (!Array.isArray(temas) || temas.length === 0) {
        return res.status(400).json({ 
          error: 'Temas são obrigatórios' 
        });
      }
      
      if (maximo_de_participantes && (maximo_de_participantes < 1 || maximo_de_participantes > 10)) {
        return res.status(400).json({ 
          error: 'Máximo de participantes deve estar entre 1 e 10' 
        });
      }
      
      // Obter temas disponíveis do banco ou usar os fornecidos
      let temasParaUsar = temas_disponiveis || [];
      if (!temas_disponiveis || temas_disponiveis.length === 0) {
        // Buscar temas do banco de dados
        const temasDB = await db.Temas.findAll();
        temasParaUsar = temasDB.map(t => t.nome);
      }
      
      log.info({ temasParaUsar_length: temasParaUsar.length }, 'Usando temas para geração');
      
      // Verificar autenticação antecipado (para tracking)
      const userId = req.user?.id;

      // Gerar título se não fornecido
      let nomeHistoria = nome;
      if (!nome || nome.trim() === '') {
        log.info('Gerando título automático...');
        const geradorTitulo = await criarGeradorTitulo(temasParaUsar);
        const resultadoTitulo = await geradorTitulo.gerarTitulo({ tema: temas, userId });
        nomeHistoria = resultadoTitulo.titulo;
        log.info({ nomeHistoria: nomeHistoria }, 'Título gerado');
      }

      // Gerar prólogo automaticamente
      const geradorPrologo = await criarGeradorPrologo(temasParaUsar);
      const resultadoPrologo = await geradorPrologo.gerarPrologo({ temas, descricao: descricao || '', userId });
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Autenticação necessária para criar história' });
      }

      // Criar história no banco com prólogo
      const novaHistoria = await db.Historia.createHistoria({
        nome: nomeHistoria,
        temas: temas, // Salvar IDs diretamente
        maximo_de_participantes: maximo_de_participantes || 5,
        descricao: descricao || '',
        prologo: resultadoPrologo.prologo,
        status: 'ativa',
        id_usuario: userId,
        mestre_id: mestre_id ? parseInt(mestre_id) : null,
        publica: publica === true || publica === 'true' ? true : false,
        ...(imagem ? { imagem } : {}),
        ...(mapas && Array.isArray(mapas) ? { mapas } : {})
      });
      
      log.info({ novaHistoria_id: novaHistoria.id }, 'História criada com prólogo gerado automaticamente');

      // Auto-evento no feed
      db.FeedPost.createAutoEvent(userId, 'historia_criada', { nome: nomeHistoria }, 'historia', novaHistoria.id);

      let roteiroJob = null;
      let roteiroStatus = novaHistoria.roteiro_status || null;

      try {
        const enqueued = await enqueueRoteiroJob({
          historia: {
            ...novaHistoria,
            prologo: resultadoPrologo.prologo,
            descricao: descricao || '',
            temas,
            maximo_de_participantes: maximo_de_participantes || 5
          },
          userId,
          ensureQuota: () => consumirCotaBlueprint(userId)
        });

        roteiroJob = enqueued.job;
        roteiroStatus = roteiroJob?.status === 'active' ? 'generating' : 'queued';
      } catch (error) {
        if (error.statusCode === 429) {
          log.warn({ novaHistoria_id: novaHistoria.id, error_message: error.message }, 'Geracao automatica de roteiro ignorada para historia');
        } else {
          roteiroStatus = 'error';
          log.error({ err: error, historiaId: novaHistoria.id }, 'Erro ao enfileirar roteiro automatico');

          try {
            await db.Historia.updateHistoria(novaHistoria.id, { roteiro_status: 'error' });
          } catch (_) {
            // melhor esforco
          }
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Historia criada com prologo gerado automaticamente',
        data: {
          ...novaHistoria,
          prologo: resultadoPrologo.prologo,
          temas_utilizados: resultadoPrologo.temasUtilizados,
          titulo_gerado: !nome || nome.trim() === '' ? nomeHistoria : null,
          roteiro_status: roteiroStatus,
          job: serializeAiJob(roteiroJob)
        }
      });
      
    } catch (error) {
      log.error({ err: error }, '? Erro ao criar hist?ria');
      next(error);
    }
  }
  /**
   * Listar todas as histórias
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async listarHistorias(req, res, next) {
    try {
      const { status, limit = 20, offset = 0, todas = false, incluir_personagens = true } = req.query;
      const temaIdFiltro = this.parseTemaQueryValue(req);
      const parsedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
      const parsedOffset = Math.max(parseInt(offset) || 0, 0);

      let historias = [];
      let total = 0;
      let usedDbPagination = false;

      // Se o usuário estiver logado e não for solicitada listagem pública
      if (req.user && req.user.id && todas !== 'true') {
        if (incluir_personagens === 'true' || incluir_personagens === true) {
          // Buscar histórias criadas + participação (query composta, paginação em memória)
          historias = await db.Historia.findAllByUsuario(req.user.id);
        } else {
          // Buscar apenas histórias criadas pelo usuário (paginação DB-level)
          const result = await db.Historia.findByUsuarioPaginated(req.user.id, {
            limit: parsedLimit,
            offset: parsedOffset,
            status: status || undefined
          });
          historias = result.data;
          total = result.total;
          usedDbPagination = true;
        }
      } else {
        // Buscar histórias públicas (modo público)
        const result = await db.Historia.findPublicas({
          limit: parsedLimit,
          offset: parsedOffset,
          status: status || undefined,
          temas: temaIdFiltro || undefined
        });
        historias = result.data;
        total = result.total;
        usedDbPagination = true;
      }

      // Aplicar filtros em memória apenas quando não usou paginação DB
      if (!usedDbPagination) {
        if (status) {
          historias = historias.filter(h => h.status === status);
        }
        if (temaIdFiltro !== null) {
          historias = historias.filter(h => Array.isArray(h.temas) && h.temas.includes(temaIdFiltro));
        }

        if (!req.user || todas === 'true') {
          historias.sort((a, b) => new Date(b.criada_em) - new Date(a.criada_em));
        }

        total = historias.length;
        historias = historias.slice(parsedOffset, parsedOffset + parsedLimit);
      }

      const historiasPaginadas = historias;
      
      // Verificar status de sessão ativa para cada história (se usuário estiver logado)
      let historiasComSessao = historiasPaginadas;
      if (req.user && req.user.id) {
        historiasComSessao = await Promise.all(historiasPaginadas.map(async (historia) => {
          try {
            const sessao = await gerenciadorSessoes.obterSessao(`historia_${historia.id}`);
            if (sessao) {
              // Verificar se o usuário está na sessão
              const usuarioNaSessao = sessao.jogadoresConectados?.some(
                jogador => String(jogador.userId) === String(req.user.id)
              );
              
              return {
                ...historia,
                sessaoAtiva: true,
                statusSessao: sessao.status || 'aguardando',
                usuarioNaSessao: usuarioNaSessao || false,
                totalJogadores: sessao.totalJogadores || 0
              };
            }
            
            return {
              ...historia,
              sessaoAtiva: false,
              statusSessao: null,
              usuarioNaSessao: false,
              totalJogadores: 0
            };
          } catch (error) {
            log.error({ err: error, historiaId: historia.id }, 'Erro ao verificar sessao da historia');
            return {
              ...historia,
              sessaoAtiva: false,
              statusSessao: null,
              usuarioNaSessao: false,
              totalJogadores: 0
            };
          }
        }));
      }
      
      res.status(200).json({
        success: true,
        data: historiasComSessao,
        pagination: {
          total,
          limit: parsedLimit,
          offset: parsedOffset,
          hasMore: parsedOffset + historiasPaginadas.length < total
        },
        filtrado_por_usuario: req.user && req.user.id && todas !== 'true' ? req.user.id : null,
        incluindo_personagens: req.user && req.user.id && todas !== 'true' && (incluir_personagens === 'true' || incluir_personagens === true)
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao listar histórias');
      next(error);
    }
  }
  
  /**
   * Obter uma história específica
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async obterHistoria(req, res, next) {
    try {
      const { id } = req.params;
      
      log.info({ id: id }, 'Buscando história ID');
      
      const historia = await db.Historia.findById(parseInt(id));
      
      if (!historia) {
        return res.status(404).json({
          success: false,
          error: 'História não encontrada'
        });
      }
      
      const podeAcessar = await usuarioPodeAcessarHistoria(historia, req.user);
      if (!podeAcessar) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para acessar esta história'
        });
      }
      
      log.info('História encontrada');
      
      res.status(200).json({
        success: true,
        data: historia
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao obter história');
      next(error);
    }
  }
  
  /**
   * Atualizar uma história
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async atualizarHistoria(req, res, next) {
    try {
      const { id } = req.params;

      log.info({ id: id }, 'Atualizando história ID');

      const historia = await db.Historia.findById(parseInt(id));

      if (!historia) {
        return res.status(404).json({
          success: false,
          error: 'História não encontrada'
        });
      }

      // Ownership já verificado pelo middleware requireResourceOwnerOrAdmin

      const { nome, temas, descricao, maximo_de_participantes, status, prologo, mestre_id, imagem, mapas, estilo_imagem, config } = req.body;
      const dadosSeguros = {};
      if (nome !== undefined) dadosSeguros.nome = nome;
      if (temas !== undefined) dadosSeguros.temas = temas;
      if (descricao !== undefined) dadosSeguros.descricao = descricao;
      if (maximo_de_participantes !== undefined) dadosSeguros.maximo_de_participantes = maximo_de_participantes;
      if (status !== undefined) dadosSeguros.status = status;
      if (prologo !== undefined) dadosSeguros.prologo = prologo;
      if (mestre_id !== undefined) dadosSeguros.mestre_id = mestre_id ? parseInt(mestre_id) : null;
      if (imagem !== undefined) dadosSeguros.imagem = imagem;
      if (mapas !== undefined) dadosSeguros.mapas = Array.isArray(mapas) ? mapas : [];
      if (estilo_imagem !== undefined) dadosSeguros.estilo_imagem = estilo_imagem;
      if (config !== undefined) {
        try {
          const { validateHistoriaConfig } = await import('../../helpers/historiaConfigHelper.js');
          dadosSeguros.config = validateHistoriaConfig(config);
        } catch (validationError) {
          return res.status(400).json({ success: false, error: validationError.message });
        }
      }
      dadosSeguros.atualizada_em = new Date();

      await db.Historia.updateHistoria(parseInt(id), dadosSeguros);

      // Se mestre_id mudou, invalidar sessao Redis e cache em memoria
      if (mestre_id !== undefined) {
        const salaId = `historia_${id}`;
        try {
          // Montar novo mestreConfig
          let novoMestreConfig = null;
          const parsedMestreId = mestre_id ? parseInt(mestre_id) : null;
          if (parsedMestreId) {
            const novoMestre = await db.Mestre.findById(parsedMestreId);
            if (novoMestre) {
              novoMestreConfig = {
                nome: novoMestre.nome,
                personalidade: novoMestre.personalidade,
                tom_narrativo: novoMestre.tom_narrativo,
                regras_especiais: novoMestre.regras_especiais,
                modelo: novoMestre.modelo,
                temperatura: novoMestre.temperatura,
                max_tokens: novoMestre.max_tokens,
                voice_id: novoMestre.voice_id || null,
                voice_provider: novoMestre.voice_provider || null,
              };
            }
          }

          // Atualizar sessao Redis se existir
          const sessao = await gerenciadorSessoes.obterSessao(salaId);
          if (sessao) {
            await gerenciadorSessoes.atualizarSessao(salaId, { mestreConfig: novoMestreConfig });
            log.info({ salaId: salaId }, 'mestreConfig atualizado no Redis para sala');
          }

          // Invalidar cache em memoria do socketManager
          const socketManager = (await import('../../websocket/socketManager.js')).default;
          if (socketManager?.mestresCache) {
            socketManager.mestresCache.delete(salaId);
            log.info({ salaId: salaId }, 'mestresCache invalidado para sala');
          }
        } catch (cacheError) {
          log.warn({ err: cacheError }, 'Erro ao invalidar cache de mestre (nao critico)');
        }
      }

      // Se config mudou, sincronizar com sessao Redis ativa
      if (config !== undefined) {
        const salaId = `historia_${id}`;
        try {
          const sessao = await gerenciadorSessoes.obterSessao(salaId);
          if (sessao) {
            await gerenciadorSessoes.atualizarSessao(salaId, { historiaConfig: dadosSeguros.config });
            log.info({ salaId }, 'historiaConfig sincronizado no Redis para sala');
          }
        } catch (cacheError) {
          log.warn({ err: cacheError }, 'Erro ao sincronizar historiaConfig no Redis (nao critico)');
        }
      }

      // Buscar a história atualizada
      const historiaAtualizada = await db.Historia.findById(parseInt(id));

      log.info('História atualizada com sucesso');
      
      res.status(200).json({
        success: true,
        message: 'História atualizada com sucesso',
        data: historiaAtualizada
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao atualizar história');
      next(error);
    }
  }
  
  /**
   * Excluir uma história
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async excluirHistoria(req, res, next) {
    try {
      const { id } = req.params;
      
      log.info({ id: id }, 'Excluindo história ID');
      
      const historia = await db.Historia.findById(parseInt(id));
      
      if (!historia) {
        return res.status(404).json({
          success: false,
          error: 'História não encontrada'
        });
      }
      
      // Ownership já verificado pelo middleware requireResourceOwnerOrAdmin
      
      await db.Historia.deleteHistoria(parseInt(id));

      res.status(200).json({
        success: true,
        message: 'História removida com sucesso (soft delete)'
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao excluir história');
      next(error);
    }
  }
  
  /**
   * Restaurar uma história soft-deleted
   */
  async restaurarHistoria(req, res, next) {
    try {
      const { id } = req.params;

      const historia = await db.Historia.restoreHistoria(parseInt(id));

      res.status(200).json({
        success: true,
        message: 'História restaurada com sucesso',
        data: historia
      });
    } catch (error) {
      log.error({ err: error }, 'Erro ao restaurar história');
      next(error);
    }
  }

  /**
   * Gerar história com prólogo usando IA
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async gerarHistoriaComIA(req, res, next) {
    try {
      const { temas, nome, descricao, maximo_de_participantes, temas_disponiveis } = req.body;
      
      log.info({ temas, nome, temas_disponiveis: temas_disponiveis?.length || 0 }, 'Gerando historia com IA');
      
      if (!Array.isArray(temas) || temas.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Tema é obrigatório para gerar história com IA'
        });
      }
      
      // Obter temas disponíveis do banco ou usar os fornecidos
      let temasParaUsar = temas_disponiveis || [];
      if (!temas_disponiveis || temas_disponiveis.length === 0) {
        // Buscar temas do banco de dados
        const temasDB = await db.Temas.findAll();
        temasParaUsar = temasDB.map(t => t.nome);
      }
      
      log.info({ temasParaUsar_length: temasParaUsar.length }, 'Usando temas para geração');
      
      // Verificar autenticação
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Autenticação necessária para gerar história' });
      }

      // Usar o gerador de prólogo diretamente (tracking happens inside agent)
      const geradorPrologo = await criarGeradorPrologo(temasParaUsar);
      const historiaGerada = await geradorPrologo.criarHistoriaCompleta({
        temas,
        nome: nome || `Aventura em ${temas}`,
        descricao: descricao || '',
        userId
      });

      // Salvar no banco de dados
      const novaHistoria = await db.Historia.createHistoria({
        nome: historiaGerada.nome,
        temas: historiaGerada.temas, // Salvar IDs diretamente
        descricao: historiaGerada.descricao,
        prologo: historiaGerada.prologo,
        maximo_de_participantes: maximo_de_participantes || 5,
        status: 'ativa',
        id_usuario: userId
      });
      
      log.info({ novaHistoria_id: novaHistoria.id }, 'História gerada com IA e salva');
      
      res.status(201).json({
        success: true,
        message: 'História gerada com IA com sucesso',
        data: {
          ...novaHistoria,
          elementos: historiaGerada.elementos,
          temas_utilizados: historiaGerada.metadata.temasUtilizados
        }
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao gerar história com IA');
      next(error);
    }
  }
  

  
  /**
   * Gerar aventura completa com mestre de RPG
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async gerarAventuraCompleta(req, res, next) {
    try {
      const { temas, nome, descricao, personagens, temas_disponiveis } = req.body;
      
      log.info({ temas, nome, personagens: personagens?.length || 0 }, 'Gerando aventura completa');
      
      if (!Array.isArray(temas) || temas.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Tema é obrigatório para gerar aventura'
        });
      }
      
      // Obter temas disponíveis do banco ou usar os fornecidos
      let temasParaUsar = temas_disponiveis || [];
      if (!temas_disponiveis || temas_disponiveis.length === 0) {
        const temasDB = await db.Temas.findAll({
          attributes: ['nome']
        });
        temasParaUsar = temasDB.map(t => t.nome);
      }
      
      log.info({ temasParaUsar_length: temasParaUsar.length, personagens_length: personagens?.length || 0 }, 'Usando temas e personagens');
      
      // Usar o criador completo com agentes separados
      // Verificar autenticação
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Autenticação necessária para gerar aventura' });
      }

      const criador = await criadorCompleto(temasParaUsar, personagens || []);

      // Gerar aventura completa (tracking happens inside sub-agents)
      const aventuraCompleta = await criador.criarAventuraCompleta({
        temas,
        nome: nome || `Aventura em ${temas}`,
        descricao: descricao || '',
        personagens: personagens || [],
        userId
      });

      // Salvar no banco de dados
      const novaHistoria = await db.Historia.createHistoria({
        nome: aventuraCompleta.nome,
        temas: aventuraCompleta.temas, // Salvar IDs diretamente
        descricao: aventuraCompleta.descricao,
        prologo: aventuraCompleta.prologo,
        maximo_de_participantes: personagens?.length || 5,
        status: 'ativa',
        id_usuario: userId
      });
      
      log.info({ novaHistoria_id: novaHistoria.id }, 'Aventura completa gerada e salva');
      
      res.status(201).json({
        success: true,
        message: 'Aventura completa gerada com sucesso',
        data: {
          ...novaHistoria,
          personagens: aventuraCompleta.personagens,
          sessao: aventuraCompleta.sessao,
          elementos: aventuraCompleta.elementos,
          temas_utilizados: aventuraCompleta.metadata.temasUtilizados,
          agentes: aventuraCompleta.metadata.agentes
        }
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao gerar aventura completa');
      next(error);
    }
  }







  /**
   * Listar apenas histórias criadas pelo usuário
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async listarMinhasHistorias(req, res, next) {
    try {
      const { status, limit = 20, offset = 0 } = req.query;
      const parsedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
      const parsedOffset = Math.max(parseInt(offset) || 0, 0);

      const result = await db.Historia.findByUsuarioPaginated(req.user.id, {
        limit: parsedLimit,
        offset: parsedOffset,
        status: status || undefined
      });

      const historiasPaginadas = result.data;
      const total = result.total;
      
      // Verificar status de sessão ativa para cada história
      const historiasComSessao = await Promise.all(historiasPaginadas.map(async (historia) => {
        try {
          const sessao = await gerenciadorSessoes.obterSessao(`historia_${historia.id}`);
          
          if (sessao) {
            // Verificar se o usuário está na sessão
            const usuarioNaSessao = sessao.jogadoresConectados?.some(
              jogador => String(jogador.userId) === String(req.user.id)
            );
            
            return {
              ...historia,
              sessaoAtiva: true,
              statusSessao: sessao.status || 'aguardando',
              usuarioNaSessao: usuarioNaSessao || false,
              totalJogadores: sessao.totalJogadores || 0
            };
          }
          
          return {
            ...historia,
            sessaoAtiva: false,
            statusSessao: null,
            usuarioNaSessao: false,
            totalJogadores: 0
          };
        } catch (error) {
          log.error({ err: error, historiaId: historia.id }, 'Erro ao verificar sessao da historia');
          // Em caso de erro, retornar história sem informação de sessão
          return {
            ...historia,
            sessaoAtiva: false,
            statusSessao: null,
            usuarioNaSessao: false,
            totalJogadores: 0
          };
        }
      }));
      
      res.status(200).json({
        success: true,
        data: historiasComSessao,
        pagination: {
          total,
          limit: parsedLimit,
          offset: parsedOffset,
          hasMore: parsedOffset + historiasPaginadas.length < total
        },
        tipo: 'historias_criadas'
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao listar histórias criadas');
      next(error);
    }
  }

  /**
   * Listar histórias onde personagens do usuário participam
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async listarHistoriasComPersonagens(req, res, next) {
    try {
      log.info({ req_user_id: req.user.id }, 'Listando histórias onde personagens do usuário participam');
      
      const { status, limit = 20, offset = 0 } = req.query;
      const temaIdFiltro = this.parseTemaQueryValue(req);
      
      // Buscar histórias onde personagens do usuário participam
      let historias = await db.Historia.findByPersonagensUsuario(req.user.id);
      
      // Aplicar filtros
      if (status) {
        historias = historias.filter(h => h.status === status);
      }
      if (temaIdFiltro !== null) {
        historias = historias.filter(h => Array.isArray(h.temas) && h.temas.includes(temaIdFiltro));
      }
      
      // Ordenar por data de criação (mais recente primeiro)
      historias.sort((a, b) => new Date(b.criada_em) - new Date(a.criada_em));
      
      const total = historias.length;
      
      // Aplicar paginação
      const startIndex = parseInt(offset) || 0;
      const endIndex = startIndex + parseInt(limit || 20);
      const historiasPaginadas = historias.slice(startIndex, endIndex);
      
      log.info({ historiasPaginadas_length: historiasPaginadas.length, total: total }, 'histórias com personagens encontradas ( total)');
      
      res.status(200).json({
        success: true,
        data: historiasPaginadas,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: startIndex + historiasPaginadas.length < total
        },
        tipo: 'historias_com_personagens'
      });
      
    } catch (error) {
      log.error({ err: error }, 'Erro ao listar histórias com personagens');
      next(error);
    }
  }

  /**
   * Gerar roteiro narrativo (Story Blueprint) com Claude Sonnet 4.5
   */
  async gerarRoteiro(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const historia = await db.Historia.findById(parseInt(id));
      if (!historia) {
        return res.status(404).json({ success: false, error: 'Historia nao encontrada' });
      }

      // Verificar ownership
      if (String(historia.id_usuario) !== String(userId) && !['admin', 'superadmin'].includes(req.user?.role)) {
        return res.status(403).json({ success: false, error: 'Apenas o dono pode gerar roteiro' });
      }

      // Resolver modo: do body, ou auto-detect
      const requestedMode = req.body?.mode;
      const resolvedMode = (requestedMode && isValidMode(requestedMode))
        ? requestedMode
        : (historia?.roteiro ? 'regenerate' : 'initial');

      const enqueued = await enqueueRoteiroJob({
        historia,
        userId,
        mode: resolvedMode,
        ensureQuota: () => consumirCotaBlueprint(userId)
      });

      return res.status(202).json({
        success: true,
        data: {
          jobId: enqueued.job?.id || null,
          queue: 'roteiro',
          status: enqueued.job?.status || 'queued',
          existing: enqueued.existing
        }
      });
    } catch (error) {
      log.error({ err: error }, '? Erro ao iniciar gera??o de roteiro');
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  /**
   * Obter roteiro de uma história
   */
  async obterRoteiro(req, res, next) {
    try {
      const { id } = req.params;
      const historia = await db.Historia.findById(parseInt(id));

      if (!historia) {
        return res.status(404).json({ success: false, error: 'História não encontrada' });
      }

      const podeAcessar = await usuarioPodeAcessarHistoria(historia, req.user);
      if (!podeAcessar) {
        return res.status(403).json({ success: false, error: 'Você não tem permissão para acessar esta história' });
      }

      // Evita 304/cache durante polling de geração/regeneração do roteiro.
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        'Surrogate-Control': 'no-store'
      });

      const job = await findLatestRoteiroJobForHistoria(parseInt(id, 10));

      res.status(200).json({
        success: true,
        data: {
          roteiro: historia.roteiro || null,
          roteiro_status: historia.roteiro_status || null,
          job: serializeAiJob(job)
        }
      });
    } catch (error) {
      log.error({ err: error }, 'Erro ao obter roteiro');
      next(error);
    }
  }

  /**
   * Atualizar roteiro manualmente
   */
  async atualizarRoteiro(req, res, next) {
    try {
      const { id } = req.params;
      const { roteiro } = req.body;

      if (!roteiro || typeof roteiro !== 'object') {
        return res.status(400).json({ success: false, error: 'Roteiro deve ser um objeto JSON v?lido' });
      }

      const roteiroNormalizado = blueprintService.normalizarRoteiro(roteiro);
      if (!roteiroNormalizado) {
        return res.status(400).json({ success: false, error: 'Roteiro fora da estrutura esperada' });
      }

      const historia = await db.Historia.findById(parseInt(id));
      if (!historia) {
        return res.status(404).json({ success: false, error: 'Hist?ria n?o encontrada' });
      }

      await db.Historia.updateHistoria(parseInt(id), {
        roteiro: roteiroNormalizado,
        roteiro_status: 'completed'
      });

      await sincronizarRoteiroNaSessao(
        { ...historia, roteiro: roteiroNormalizado, roteiro_status: 'completed' },
        roteiroNormalizado,
        'completed'
      );
      await this.emitirEventoRoteiro(id, 'roteiro_gerado');

      res.status(200).json({ success: true, message: 'Roteiro atualizado' });
    } catch (error) {
      log.error({ err: error }, '? Erro ao atualizar roteiro');
      next(error);
    }
  }

  /**
   * Obter progressão do roteiro
   */
  async obterProgressao(req, res, next) {
    try {
      const { id } = req.params;
      const historia = await db.Historia.findById(parseInt(id));

      if (!historia) {
        return res.status(404).json({ success: false, error: 'História não encontrada' });
      }

      const podeAcessar = await usuarioPodeAcessarHistoria(historia, req.user);
      if (!podeAcessar) {
        return res.status(403).json({ success: false, error: 'Você não tem permissão para acessar esta história' });
      }

      const progressao = historia.roteiro?.progressao || null;
      res.status(200).json({ success: true, data: progressao });
    } catch (error) {
      log.error({ err: error }, 'Erro ao obter progressão');
      next(error);
    }
  }

  /**
   * Atualizar progressão do roteiro
   */
  async atualizarProgressao(req, res, next) {
    try {
      const { id } = req.params;
      const { progressao } = req.body;

      if (!progressao || typeof progressao !== 'object') {
        return res.status(400).json({ success: false, error: 'Progress?o deve ser um objeto JSON v?lido' });
      }

      const historia = await db.Historia.findById(parseInt(id));
      if (!historia || !historia.roteiro) {
        return res.status(404).json({ success: false, error: 'Hist?ria ou roteiro n?o encontrado' });
      }

      const roteiroAtualizado = { ...historia.roteiro, progressao };
      await db.Historia.updateHistoria(parseInt(id), { roteiro: roteiroAtualizado });
      await sincronizarRoteiroNaSessao(
        { ...historia, roteiro: roteiroAtualizado, roteiro_status: historia.roteiro_status || 'completed' },
        roteiroAtualizado,
        historia.roteiro_status || 'completed'
      );

      res.status(200).json({ success: true, message: 'Progress?o atualizada' });
    } catch (error) {
      log.error({ err: error }, '? Erro ao atualizar progress?o');
      next(error);
    }
  }

  /**
   * Listar versões de roteiro de uma história
   */
  async listarVersoesRoteiro(req, res, next) {
    try {
      const { id } = req.params;
      const versoes = await db.prisma.roteiro_versoes.findMany({
        where: { historia_id: parseInt(id) },
        orderBy: { versao: 'desc' },
        select: {
          id: true,
          versao: true,
          modo: true,
          temperatura: true,
          modelo: true,
          ativa: true,
          criado_em: true
        }
      });
      res.json({ success: true, data: { versoes } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ativar uma versão específica do roteiro
   */
  async ativarVersaoRoteiro(req, res, next) {
    try {
      const { id, versaoId } = req.params;
      const historiaId = parseInt(id);
      const versaoIdInt = parseInt(versaoId);

      const versao = await db.prisma.roteiro_versoes.findFirst({
        where: { id: versaoIdInt, historia_id: historiaId }
      });

      if (!versao) {
        return res.status(404).json({ success: false, error: 'Versão não encontrada' });
      }

      await db.prisma.$transaction([
        db.prisma.roteiro_versoes.updateMany({
          where: { historia_id: historiaId, ativa: true },
          data: { ativa: false }
        }),
        db.prisma.roteiro_versoes.update({
          where: { id: versaoIdInt },
          data: { ativa: true }
        }),
        db.prisma.historias.update({
          where: { id: historiaId },
          data: { roteiro: versao.roteiro, roteiro_status: 'completed' }
        })
      ]);

      const historia = await db.Historia.findById(historiaId);
      if (historia) {
        await sincronizarRoteiroNaSessao(historia, versao.roteiro, 'completed');
      }

      res.json({ success: true, message: 'Versão ativada' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar status de uma versão do roteiro (approval workflow)
   * Transições permitidas:
   *   - Owner: draft → pending
   *   - Admin/reviewer: pending → approved | rejected
   *   - Approved auto-ativa a versão
   */
  async atualizarStatusVersaoRoteiro(req, res, next) {
    try {
      const { id, versaoId } = req.params;
      const { status, comment } = req.body;
      const historiaId = parseInt(id);
      const versaoIdInt = parseInt(versaoId);
      const userId = req.user?.id;

      const validStatuses = ['draft', 'pending', 'approved', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, error: `Status inválido. Use: ${validStatuses.join(', ')}` });
      }

      const versao = await db.prisma.roteiro_versoes.findFirst({
        where: { id: versaoIdInt, historia_id: historiaId }
      });

      if (!versao) {
        return res.status(404).json({ success: false, error: 'Versão não encontrada' });
      }

      const historia = await db.prisma.historias.findUnique({ where: { id: historiaId } });
      const isOwner = historia && historia.id_usuario === userId;
      const isAdmin = req.user?.role === 'superadmin' || req.user?.role === 'admin';

      // Validar transições
      if (status === 'draft' && versao.status !== 'draft' && !isOwner && !isAdmin) {
        return res.status(403).json({ success: false, error: 'Apenas o dono ou admin pode retornar para draft' });
      }
      if (status === 'pending' && versao.status !== 'draft') {
        return res.status(400).json({ success: false, error: 'Só é possível submeter para revisão a partir de draft' });
      }
      if (status === 'pending' && !isOwner && !isAdmin) {
        return res.status(403).json({ success: false, error: 'Apenas o dono pode submeter para revisão' });
      }
      if ((status === 'approved' || status === 'rejected') && versao.status !== 'pending') {
        return res.status(400).json({ success: false, error: 'Só é possível aprovar/rejeitar versões pendentes' });
      }
      if ((status === 'approved' || status === 'rejected') && !isAdmin) {
        return res.status(403).json({ success: false, error: 'Apenas admins podem aprovar ou rejeitar versões' });
      }

      const updateData = {
        status,
        ...(status === 'approved' || status === 'rejected' ? {
          reviewer_id: userId,
          reviewed_at: new Date(),
          review_comment: comment || null
        } : {})
      };

      // Se aprovado, auto-ativar a versão
      if (status === 'approved') {
        await db.prisma.$transaction([
          db.prisma.roteiro_versoes.updateMany({
            where: { historia_id: historiaId, ativa: true },
            data: { ativa: false }
          }),
          db.prisma.roteiro_versoes.update({
            where: { id: versaoIdInt },
            data: { ...updateData, ativa: true }
          }),
          db.prisma.historias.update({
            where: { id: historiaId },
            data: { roteiro: versao.roteiro, roteiro_status: 'completed' }
          })
        ]);

        if (historia) {
          await sincronizarRoteiroNaSessao(historia, versao.roteiro, 'completed');
        }

        log.info({ versaoId: versaoIdInt, historiaId, reviewer: userId }, 'Versão aprovada e ativada');
      } else {
        await db.prisma.roteiro_versoes.update({
          where: { id: versaoIdInt },
          data: updateData
        });
        log.info({ versaoId: versaoIdInt, historiaId, status }, 'Status da versão atualizado');
      }

      const updated = await db.prisma.roteiro_versoes.findUnique({ where: { id: versaoIdInt } });
      res.json({ success: true, data: { versao: updated } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter detalhe completo de uma versão do roteiro (incluindo roteiro JSON)
   */
  async obterVersaoRoteiro(req, res, next) {
    try {
      const { id, versaoId } = req.params;
      const versao = await db.prisma.roteiro_versoes.findFirst({
        where: { id: parseInt(versaoId), historia_id: parseInt(id) }
      });

      if (!versao) {
        return res.status(404).json({ success: false, error: 'Versão não encontrada' });
      }

      res.json({ success: true, data: { versao } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Determinar gênero baseado no temas
   * @param {string} temas - Tema da história
   * @returns {string} Gênero determinado
   */
  determinarGenero(temas) {
    const temaLower = temas.toLowerCase();
    
    if (temaLower.includes('fantasia') || temaLower.includes('medieval')) {
      return 'fantasia';
    } else if (temaLower.includes('sci-fi') || temaLower.includes('espacial')) {
      return 'sci-fi';
    } else if (temaLower.includes('horror') || temaLower.includes('assombrado')) {
      return 'horror';
    } else if (temaLower.includes('cyberpunk') || temaLower.includes('futuro')) {
      return 'cyberpunk';
    } else if (temaLower.includes('western') || temaLower.includes('velho oeste')) {
      return 'western';
    } else {
      return 'aventura';
    }
  }
  

}

export default new HistoriaController(); 
