import db from '../../Model/index.js';
import criadorCompleto from '../../agents/historia/Criador.js';
import { criarGeradorPrologo } from '../../agents/historia/prologo/index.js';
import { criarGeradorTitulo } from '../../agents/historia/titulos/aleatorios/index.js';
import gerenciadorSessoes from '../../redis/sessoes.js';
import blueprintService from '../../services/blueprintService.js';
import { buildCatalogoCompleto } from '../../agents/Mestre/catalogo/catalogoMestre.js';
import { buildMestreContext } from '../../agents/Mestre/contexto/mestreContextBuilder.js';

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

  async consumirCotaBlueprint(userId, limit = 5, windowSeconds = 60 * 60) {
    if (!userId) {
      throw Object.assign(new Error('Autenticacao necessaria para gerar roteiro'), { statusCode: 401 });
    }

    try {
      await gerenciadorSessoes.initialize();
      const redis = gerenciadorSessoes.client;
      if (!redis) return { allowed: true, remaining: limit };

      const key = `rate_limit:blueprint:${userId}`;
      const total = await redis.incr(key);
      if (total === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (total > limit) {
        throw Object.assign(
          new Error('Limite de geracao de roteiros atingido. Tente novamente em 1 hora.'),
          { statusCode: 429 }
        );
      }

      return { allowed: true, remaining: Math.max(limit - total, 0) };
    } catch (error) {
      if (error.statusCode) throw error;
      console.warn('Falha ao validar cota de blueprint no Redis, seguindo sem bloqueio:', error.message);
      return { allowed: true, remaining: limit };
    }
  }

  async obterSocketManager() {
    return (await import('../../websocket/socketManager.js')).default;
  }

  async sincronizarRoteiroNaSessao(historia, roteiro, roteiroStatus = 'completed') {
    const salaId = `historia_${historia.id}`;
    const sessao = await gerenciadorSessoes.obterSessao(salaId);
    if (!sessao) return;

    const historiaComRoteiro = { ...historia, roteiro, roteiro_status: roteiroStatus };
    const estadoJogo = {
      ...(sessao.estadoJogo || {}),
      historiaRoteiroAtualizadoEm: new Date().toISOString()
    };

    const sessaoAtualizada = {
      ...sessao,
      historiaRoteiro: roteiro,
      estadoJogo
    };

    const mestreContexto = buildMestreContext(sessaoAtualizada, historiaComRoteiro);

    await gerenciadorSessoes.atualizarSessao(salaId, {
      historiaRoteiro: roteiro,
      mestreContexto,
      estadoJogo: {
        ...estadoJogo,
        mestreContexto
      }
    });

    try {
      const socketManager = await this.obterSocketManager();
      if (socketManager?.mestresCache) {
        socketManager.mestresCache.delete(salaId);
      }
    } catch (error) {
      console.warn(`Erro ao invalidar cache do Mestre para ${salaId}:`, error.message);
    }
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
    const historiaId = parseInt(historia.id, 10);
    const { emitirErroSocket = true } = options;

    try {
      const catalogo = await buildCatalogoCompleto();
      const temasNomes = await this.gerarTemasNomes(historia.temas || []);
      const roteiro = await blueprintService.gerarRoteiro(historia, catalogo, temasNomes, userId);

      await db.Historia.updateHistoria(historiaId, {
        roteiro,
        roteiro_status: 'completed'
      });

      const historiaAtualizada = {
        ...historia,
        roteiro,
        roteiro_status: 'completed'
      };

      await this.sincronizarRoteiroNaSessao(historiaAtualizada, roteiro, 'completed');
      await this.emitirEventoRoteiro(historiaId, 'roteiro_gerado');
      console.log(`Roteiro gerado com sucesso para historia ${historiaId}`);
      return roteiro;
    } catch (error) {
      await db.Historia.updateHistoria(historiaId, { roteiro_status: 'error' });

      if (emitirErroSocket) {
        await this.emitirEventoRoteiro(historiaId, 'roteiro_erro', { error: error.message });
      }

      throw error;
    }
  }

  async usuarioPodeAcessarHistoria(historia, user) {
    if (!historia) return false;
    if (historia.publica === true) return true;
    if (!user || !user.id) return false;
    if (user.role === 'superadmin') return true;
    if (String(historia.id_usuario) === String(user.id)) return true;

    const userId = parseInt(user.id, 10);
    const historiaId = parseInt(historia.id, 10);

    const [participacao, convite] = await Promise.all([
      db.prisma.historias_personagens.findFirst({
        where: {
          historia_id: historiaId,
          personagens: {
            id_usuario: userId,
            deleted_at: null
          }
        },
        select: { id: true }
      }),
      db.prisma.historias_convite.findFirst({
        where: {
          historia_id: historiaId,
          usuario_id: userId,
          status: { in: ['pendente', 'aceito'] }
        },
        select: { id: true }
      })
    ]);

    return Boolean(participacao || convite);
  }
  
  /**
   * Criar uma nova história com prólogo gerado automaticamente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async criarHistoria(req, res, next) {
    try {
      console.log('Criando nova historia');
      
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
      
      console.log(`Usando ${temasParaUsar.length} temas para geração`);
      
      // Verificar autenticação antecipado (para tracking)
      const userId = req.user?.id;

      // Gerar título se não fornecido
      let nomeHistoria = nome;
      if (!nome || nome.trim() === '') {
        console.log('📝 Gerando título automático...');
        const geradorTitulo = await criarGeradorTitulo(temasParaUsar);
        const resultadoTitulo = await geradorTitulo.gerarTitulo({ tema: temas, userId });
        nomeHistoria = resultadoTitulo.titulo;
        console.log('✅ Título gerado:', nomeHistoria);
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
      
      console.log('✅ História criada com prólogo gerado automaticamente:', novaHistoria.id);

      // Auto-evento no feed
      db.FeedPost.createAutoEvent(userId, 'historia_criada', { nome: nomeHistoria }, 'historia', novaHistoria.id);

      res.status(201).json({
        success: true,
        message: 'História criada com prólogo gerado automaticamente',
        data: {
          ...novaHistoria,
          prologo: resultadoPrologo.prologo,
          temas_utilizados: resultadoPrologo.temasUtilizados,
          titulo_gerado: !nome || nome.trim() === '' ? nomeHistoria : null
        }
      });
      let roteiroAutoSkipped = false;
      try {
        await this.consumirCotaBlueprint(userId);
      } catch (error) {
        if (error.statusCode === 429) {
          roteiroAutoSkipped = true;
          console.warn(`Geracao automatica de roteiro ignorada para historia ${novaHistoria.id}: ${error.message}`);
        } else {
          throw error;
        }
      }

      // Gerar roteiro em background (nao bloqueia a resposta)
      (async () => {
        if (roteiroAutoSkipped) {
          return;
        }

        try {
          await db.Historia.updateHistoria(novaHistoria.id, { roteiro_status: 'generating' });
          await this.processarGeracaoRoteiro(
            { ...novaHistoria, prologo: resultadoPrologo.prologo, descricao: descricao || '', temas, maximo_de_participantes: maximo_de_participantes || 5 },
            userId
          );
        } catch (error) {
          console.error(`Erro ao gerar roteiro automatico para historia ${novaHistoria.id}:`, error.message);
        }
      })();
      
    } catch (error) {
      console.error('? Erro ao criar hist?ria:', error);
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
            console.error(`⚠️ Erro ao verificar sessão da história ${historia.id}:`, error.message);
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
      console.error('❌ Erro ao listar histórias:', error);
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
      
      console.log(`🔍 Buscando história ID: ${id}`);
      
      const historia = await db.Historia.findById(parseInt(id));
      
      if (!historia) {
        return res.status(404).json({
          success: false,
          error: 'História não encontrada'
        });
      }
      
      const podeAcessar = await this.usuarioPodeAcessarHistoria(historia, req.user);
      if (!podeAcessar) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para acessar esta história'
        });
      }
      
      console.log('✅ História encontrada');
      
      res.status(200).json({
        success: true,
        data: historia
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter história:', error);
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

      console.log(`📝 Atualizando história ID: ${id}`);

      const historia = await db.Historia.findById(parseInt(id));

      if (!historia) {
        return res.status(404).json({
          success: false,
          error: 'História não encontrada'
        });
      }

      // Ownership já verificado pelo middleware requireResourceOwnerOrAdmin

      const { nome, temas, descricao, maximo_de_participantes, status, prologo, mestre_id, imagem, mapas, estilo_imagem } = req.body;
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
                max_tokens: novoMestre.max_tokens
              };
            }
          }

          // Atualizar sessao Redis se existir
          const sessao = await gerenciadorSessoes.obterSessao(salaId);
          if (sessao) {
            await gerenciadorSessoes.atualizarSessao(salaId, { mestreConfig: novoMestreConfig });
            console.log(`🔄 mestreConfig atualizado no Redis para sala ${salaId}`);
          }

          // Invalidar cache em memoria do socketManager
          const socketManager = (await import('../../websocket/socketManager.js')).default;
          if (socketManager?.mestresCache) {
            socketManager.mestresCache.delete(salaId);
            console.log(`🗑️ mestresCache invalidado para sala ${salaId}`);
          }
        } catch (cacheError) {
          console.warn('⚠️ Erro ao invalidar cache de mestre (nao critico):', cacheError.message);
        }
      }

      // Buscar a história atualizada
      const historiaAtualizada = await db.Historia.findById(parseInt(id));

      console.log('✅ História atualizada com sucesso');
      
      res.status(200).json({
        success: true,
        message: 'História atualizada com sucesso',
        data: historiaAtualizada
      });
      
    } catch (error) {
      console.error('❌ Erro ao atualizar história:', error);
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
      
      console.log(`🗑️ Excluindo história ID: ${id}`);
      
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
      console.error('❌ Erro ao excluir história:', error);
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
      console.error('Erro ao restaurar história:', error);
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
      
      console.log('🤖 Gerando história com IA:', { temas, nome, temas_disponiveis: temas_disponiveis?.length || 0 });
      
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
      
      console.log(`🎲 Usando ${temasParaUsar.length} temas para geração`);
      
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
      
      console.log('✅ História gerada com IA e salva:', novaHistoria.id);
      
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
      console.error('❌ Erro ao gerar história com IA:', error);
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
      
      console.log('🎮 Gerando aventura completa:', { temas, nome, personagens: personagens?.length || 0 });
      
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
      
      console.log(`🎲 Usando ${temasParaUsar.length} temas e ${personagens?.length || 0} personagens`);
      
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
      
      console.log('✅ Aventura completa gerada e salva:', novaHistoria.id);
      
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
      console.error('❌ Erro ao gerar aventura completa:', error);
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
          console.error(`⚠️ Erro ao verificar sessão da história ${historia.id}:`, error.message);
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
      console.error('❌ Erro ao listar histórias criadas:', error);
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
      console.log('📋 Listando histórias onde personagens do usuário participam:', req.user.id);
      
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
      
      console.log(`✅ ${historiasPaginadas.length} histórias com personagens encontradas (${total} total)`);
      
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
      console.error('❌ Erro ao listar histórias com personagens:', error);
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
        return res.status(404).json({ success: false, error: 'Hist?ria n?o encontrada' });
      }

      // Verificar ownership
      if (String(historia.id_usuario) !== String(userId) && !['admin', 'superadmin'].includes(req.user?.role)) {
        return res.status(403).json({ success: false, error: 'Apenas o dono pode gerar roteiro' });
      }

      // Verificar se j? est? gerando
      if (historia.roteiro_status === 'generating') {
        return res.status(409).json({ success: false, error: 'Roteiro j? est? sendo gerado' });
      }

      await this.consumirCotaBlueprint(userId);

      // Marcar como generating
      await db.Historia.updateHistoria(parseInt(id), { roteiro_status: 'generating' });

      // Responder imediatamente
      res.status(202).json({ success: true, status: 'generating', message: 'Gera??o do roteiro iniciada' });

      // Gerar em background
      (async () => {
        try {
          await this.processarGeracaoRoteiro(historia, userId);
        } catch (error) {
          console.error(`Erro ao gerar roteiro para historia ${id}:`, error.message);
        }
      })();
    } catch (error) {
      console.error('? Erro ao iniciar gera??o de roteiro:', error);
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

      const podeAcessar = await this.usuarioPodeAcessarHistoria(historia, req.user);
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

      res.status(200).json({
        success: true,
        data: {
          roteiro: historia.roteiro || null,
          roteiro_status: historia.roteiro_status || null
        }
      });
    } catch (error) {
      console.error('❌ Erro ao obter roteiro:', error);
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

      await this.sincronizarRoteiroNaSessao(
        { ...historia, roteiro: roteiroNormalizado, roteiro_status: 'completed' },
        roteiroNormalizado,
        'completed'
      );
      await this.emitirEventoRoteiro(id, 'roteiro_gerado');

      res.status(200).json({ success: true, message: 'Roteiro atualizado' });
    } catch (error) {
      console.error('? Erro ao atualizar roteiro:', error);
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

      const podeAcessar = await this.usuarioPodeAcessarHistoria(historia, req.user);
      if (!podeAcessar) {
        return res.status(403).json({ success: false, error: 'Você não tem permissão para acessar esta história' });
      }

      const progressao = historia.roteiro?.progressao || null;
      res.status(200).json({ success: true, data: progressao });
    } catch (error) {
      console.error('❌ Erro ao obter progressão:', error);
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
      await this.sincronizarRoteiroNaSessao(
        { ...historia, roteiro: roteiroAtualizado, roteiro_status: historia.roteiro_status || 'completed' },
        roteiroAtualizado,
        historia.roteiro_status || 'completed'
      );

      res.status(200).json({ success: true, message: 'Progress?o atualizada' });
    } catch (error) {
      console.error('? Erro ao atualizar progress?o:', error);
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
