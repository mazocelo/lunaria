import criarMestreRPG from '../../agents/Mestre/index.js';
import { buscarTemasCompletos, extrairNomesTemas } from '../../helpers/temasHelper.js';
import { formatarPersonagensParaMestre } from '../../helpers/personagensHelper.js';
import sessaoSnapshotService from '../../services/sessaoSnapshot.js';
import analyticsService from '../../services/analyticsService.js';
import { MESTRE_CONFIG } from '../../agents/Mestre/config.js';
import {
  applyResumoToSessao,
  buildMestreContext,
  getCompactacaoState,
  prepareMestrePayload
} from '../../agents/Mestre/contexto/mestreContextBuilder.js';

export default class SessionEngine {
  constructor(manager) {
    this.manager = manager;
  }

  /**
   * Obter ou criar sessão de uma história
   */
  async obterSessaoHistoria(salaId) {
    const sm = this.manager;
    try {
      await sm.gerenciadorSessoes.initialize();

      if (!salaId.startsWith('historia_')) {
        return null;
      }

      const historiaId = parseInt(salaId.replace('historia_', ''));

      if (isNaN(historiaId)) {
        console.error('❌ ID de história inválido:', salaId);
        return null;
      }

      // Verificar se já existe uma sessão no Redis
      let sessao = await sm.gerenciadorSessoes.obterSessao(salaId);

      if (sessao) {
        console.log(`📋 Sessão existente encontrada para história ${historiaId}`);
        return sessao;
      }

      // Tentar restaurar do PostgreSQL (snapshot salvo)
      try {
        const sessaoRestaurada = await sessaoSnapshotService.restaurarSessao(salaId);
        if (sessaoRestaurada) {
          console.log(`♻️ Sessão restaurada do PostgreSQL para história ${historiaId}`);
          return sessaoRestaurada;
        }
      } catch (restoreErr) {
        console.warn(`⚠️ Falha ao restaurar sessão do PostgreSQL: ${restoreErr.message}`);
      }

      // Se não existe nem no snapshot, buscar dados da história no banco e criar sessão
      console.log(`🔍 Criando nova sessão para história ${historiaId}`);

      const { default: db } = await import('../../Model/index.js');

      const historia = await db.Historia.findById(historiaId);

      if (!historia) {
        console.error(`❌ História ${historiaId} não encontrada no banco`);
        return null;
      }

      // Buscar dados do usuário dono
      let donoNome = 'Dono da História';
      if (historia.id_usuario) {
        try {
          const usuario = await db.Usuario.findById(historia.id_usuario);
          if (usuario) {
            donoNome = usuario.nome;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao buscar dados do usuário dono:', error.message);
        }
      }

      // Buscar temas completos antes de criar sessão
      const temasCompletos = await buscarTemasCompletos(historia.temas || []);
      console.log(`🎨 Temas completos para sessão:`, temasCompletos);

      // Montar mestreConfig a partir do mestre atribuido (se existir)
      const mestreConfig = historia.mestres ? {
        nome: historia.mestres.nome,
        personalidade: historia.mestres.personalidade,
        tom_narrativo: historia.mestres.tom_narrativo,
        regras_especiais: historia.mestres.regras_especiais,
        modelo: historia.mestres.modelo,
        temperatura: historia.mestres.temperatura,
        max_tokens: historia.mestres.max_tokens,
        voice_id: historia.mestres.voice_id || null,
        voice_provider: historia.mestres.voice_provider || null
      } : null;

      // Criar dados da sessão
      const dadosSessao = {
        historiaId: historia.id,
        historiaNome: historia.nome,
        historiaTemas: temasCompletos,
        historiaPrologo: historia.prologo || '',
        historiaRoteiro: historia.roteiro || null,
        donoId: historia.id_usuario ? String(historia.id_usuario) : null,
        donoNome: donoNome,
        maxJogadores: historia.maximo_de_participantes || 5,
        mestreConfig,
        status: 'aberta',
        statusJogo: null,
        jogadoresConectados: [],
        estadoJogo: {
          fase: 'aguardando_inicio',
          cenaAtual: 'Aguardando início',
          mensagemMestre: `Bem-vindos à história "${historia.nome}"!`,
          npcs: [],
          ambiente: 'Sala de espera',
          turno: {
            status: 'idle',
            jogadorAtual: null,
            rodadaAtual: 1,
            contadorInteracoes: 0,
            iniciadoEm: null,
            lockReason: null
          },
          testePendente: null,
          compactacao: {
            ultimaMensagemIndex: 0,
            ultimaRodadaCompactada: 0,
            ultimaCompactacaoEm: null
          }
        },
        mensagens: [],
        acoes: []
      };

      // Criar sessão no Redis
      dadosSessao.mestreContexto = buildMestreContext(dadosSessao, historia);
      sessao = await sm.gerenciadorSessoes.criarSessao(salaId, dadosSessao);

      console.log(`✅ Nova sessão criada para história "${historia.nome}" (ID: ${historiaId})`);

      return sessao;

    } catch (error) {
      console.error('❌ Erro ao obter/criar sessão da história:', error.message);
      return null;
    }
  }

  /**
   * Compactação de contexto com resumo IA
   */
  async executarCompactacaoSeNecessaria(roomId, sessao, options = {}) {
    const sm = this.manager;
    if (!sessao) return sessao;

    const estadoJogo = sessao.estadoJogo || {};
    const compactacao = getCompactacaoState(estadoJogo, sessao.mensagens || []);
    const totalMensagens = (sessao.mensagens || []).length;
    const mensagensCanonicas = (sessao.mensagens || []).filter((mensagem) => {
      const canal = mensagem?.canal || 'formal';
      const tipo = mensagem?.tipo || mensagem?.type;
      return canal !== 'roleplay' && tipo !== 'roleplay';
    });
    const totalMensagensCanonicas = mensagensCanonicas.length;
    const rodadaAtual = estadoJogo.rodadaAtual || 0;
    const deveCompactarPorMensagens = totalMensagensCanonicas - compactacao.ultimoIndiceCanonicoCompactado >= 30;
    const deveCompactarPorRodada = !!options.forceRound && rodadaAtual > compactacao.ultimaRodadaCompactada;

    if (!deveCompactarPorMensagens && !deveCompactarPorRodada && !options.force) {
      return sessao;
    }

    try {
      let mensagensParaResumo = [];
      if (compactacao.ultimaMensagemCompactadaId) {
        const indiceUltima = mensagensCanonicas.findIndex(
          (mensagem) => String(mensagem?.id) === String(compactacao.ultimaMensagemCompactadaId)
        );
        if (indiceUltima >= 0) {
          mensagensParaResumo = mensagensCanonicas.slice(indiceUltima + 1);
        }
      }
      if (!mensagensParaResumo.length && compactacao.ultimoIndiceCanonicoCompactado > 0) {
        mensagensParaResumo = mensagensCanonicas.slice(
          Math.min(compactacao.ultimoIndiceCanonicoCompactado, mensagensCanonicas.length)
        );
      }
      if (!mensagensParaResumo.length && (options.force || deveCompactarPorRodada)) {
        mensagensParaResumo = mensagensCanonicas.slice(-50);
      }
      if (!mensagensParaResumo.length) {
        return sessao;
      }

      const resumoAgent = (await import('../../agents/Resumo/index.js')).default;
      const resumoAnteriorObj = await sm.gerenciadorSessoes.obterUltimoResumo(roomId);
      const resumo = await resumoAgent.resumirAventura({
        mensagens: mensagensParaResumo,
        temas: extrairNomesTemas(sessao.historiaTemas || []),
        personagens: Object.values(sessao.jogadores || {}),
        rodadasJogadas: rodadaAtual,
        resumoAnterior: resumoAnteriorObj?.resumo || null,
        userId: options.userId || null
      });

      let novaProgressao = estadoJogo.progressao || null;
      if (sessao.historiaRoteiro) {
        try {
          const { atualizarProgressao } = await import('../../agents/Mestre/prompts/roteiroCondenser.js');
          novaProgressao = await atualizarProgressao(
            sessao.historiaRoteiro,
            resumo.resumo,
            estadoJogo.progressao || null,
            options.userId || null
          );
        } catch (error) {
          console.warn('⚠️ Erro ao atualizar progressão na compactação:', error.message);
        }
      }

      let historia = null;
      if (sessao.historiaId) {
        try {
          const { default: db } = await import('../../Model/index.js');
          historia = await db.Historia.findById(parseInt(sessao.historiaId));
        } catch (error) {
          console.warn(`⚠️ Erro ao carregar história ${sessao.historiaId} para compactação:`, error.message);
        }
      }

      const sessaoComResumo = applyResumoToSessao(sessao, resumo, historia, novaProgressao);
      sessaoComResumo.estadoJogo = sessaoComResumo.estadoJogo || {};
      const ultimaMensagemCanonica = mensagensCanonicas[mensagensCanonicas.length - 1] || null;
      sessaoComResumo.estadoJogo.compactacao = {
        ultimaMensagemIndex: totalMensagens,
        ultimaMensagemCompactadaId: ultimaMensagemCanonica?.id || compactacao.ultimaMensagemCompactadaId || null,
        ultimoIndiceCanonicoCompactado: totalMensagensCanonicas,
        totalMensagensCanonicas,
        ultimaRodadaCompactada: deveCompactarPorRodada ? rodadaAtual : compactacao.ultimaRodadaCompactada,
        ultimaCompactacaoEm: new Date().toISOString()
      };
      if (novaProgressao) {
        sessaoComResumo.estadoJogo.progressao = novaProgressao;
      }
      sessaoComResumo.resumos = [...(sessao.resumos || []), resumo].slice(-2);
      sessaoComResumo.ultimoResumoRodada = rodadaAtual;
      sessaoComResumo.ultimoResumoMensagens = totalMensagens;
      if ((sessaoComResumo.mensagens || []).length > 200) {
        sessaoComResumo.mensagens = sessaoComResumo.mensagens.slice(-200);
      }
      await sm.gerenciadorSessoes.atualizarSessao(roomId, sessaoComResumo);

      sm.mestresCache.delete(roomId);
      sm._tentarSnapshot(roomId, sessaoComResumo, true);

      return sessaoComResumo;
    } catch (error) {
      console.error(`❌ Erro ao compactar contexto da sala ${roomId}:`, error);
      return sessao;
    }
  }

  /**
   * Obter ou criar instância do Mestre IA (com cache LRU)
   */
  async obterMestre(salaId, temas, sessao, userId = null) {
    const sm = this.manager;

    // Verificar se já existe no cache
    if (sm.mestresCache.has(salaId)) {
      const cache = sm.mestresCache.get(salaId);
      if (sm.masterCacheManager.isMestreCacheStale(cache, sessao)) {
        sm.mestresCache.delete(salaId);
        console.log(`Mestre invalidado por roteiro mais recente na sessao ${salaId}`);
      } else {
        cache.ultimoUso = Date.now();
        if (userId) cache.mestre.userId = userId;
        console.log(`♻️ Mestre reutilizado do cache para sala ${salaId}`);
        return cache.mestre;
      }
    }

    // Criar novo mestre
    console.log(`🆕 Criando novo Mestre para sala ${salaId}`);
    const payloadMestre = await prepareMestrePayload(sessao);

    // Formatar personagens com dados completos
    const jogadoresConectados = Array.isArray(sessao.jogadoresConectados)
      ? sessao.jogadoresConectados
      : Object.values(sessao.jogadores || {});

    const personagensFormatados = formatarPersonagensParaMestre(
      jogadoresConectados,
      sessao.personagensCompletos || {}
    );

    console.log(`🎭 Criando Mestre com ${personagensFormatados.length} personagens formatados`);

    // Construir catálogo filtrado por nível dos jogadores
    let catalogo = '';
    try {
      const { buildCatalogo } = await import('../../agents/Mestre/catalogo/catalogoMestre.js');
      const niveisJogadores = jogadoresConectados
        .map(j => {
          const pc = (sessao.personagensCompletos || {})[j.personagemId || j.id];
          return pc?.nivel || j.nivel || 1;
        })
        .filter(n => typeof n === 'number');
      catalogo = await buildCatalogo({ niveisJogadores });
    } catch (error) {
      console.warn('⚠️ Erro ao construir catálogo para Mestre:', error.message);
    }

    // Condensar roteiro se disponível
    let roteiroCondensado = '';
    if (sessao.historiaRoteiro) {
      try {
        const { condensarRoteiro } = await import('../../agents/Mestre/prompts/roteiroCondenser.js');
        roteiroCondensado = condensarRoteiro(sessao.historiaRoteiro, sessao.estadoJogo || null);
        if (roteiroCondensado) {
          console.log(`📜 Roteiro condensado para sala ${salaId} (${roteiroCondensado.length} chars)`);
        }
      } catch (error) {
        console.warn('⚠️ Erro ao condensar roteiro:', error.message);
      }
    }

    const mestre = await criarMestreRPG(
      payloadMestre.nomesTemas.length > 0 ? payloadMestre.nomesTemas : extrairNomesTemas(temas),
      payloadMestre.personagensFormatados,
      sessao.mestreConfig || null,
      payloadMestre.catalogo,
      payloadMestre.roteiroCondensado,
      payloadMestre.contextoPersistenteFormatado,
      payloadMestre.mestreContexto
    );
    if (userId) mestre.userId = userId;

    // Limitar tamanho do cache (LRU eviction)
    const MAX_CACHE_SIZE = MESTRE_CONFIG.cache.maxSize;
    if (sm.mestresCache.size >= MAX_CACHE_SIZE) {
      let oldestKey = null, oldestTime = Number.POSITIVE_INFINITY;
      for (const [key, cache] of sm.mestresCache.entries()) {
        if (cache.ultimoUso < oldestTime) {
          oldestTime = cache.ultimoUso;
          oldestKey = key;
        }
      }
      if (oldestKey) {
        sm.mestresCache.delete(oldestKey);
        console.log(`🧹 Cache de mestre evicted (LRU): ${oldestKey}`);
      }
    }

    // Salvar no cache
    sm.mestresCache.set(salaId, {
      mestre,
      criadoEm: Date.now(),
      ultimoUso: Date.now(),
      rodadaInicial: sessao?.estadoJogo?.rodadaAtual || 1,
      historiaRoteiroAtualizadoEm: sessao?.estadoJogo?.historiaRoteiroAtualizadoEm || null
    });

    return mestre;
  }

  /**
   * Limpeza completa de uma sessao: mestresCache, roomUsers, snapshotCounters, sockets
   */
  limparSessaoCompleta(salaId, recapData = {}) {
    const sm = this.manager;

    // 1. Limpar cache de mestres
    if (sm.mestresCache) {
      sm.mestresCache.delete(salaId);
    }

    // 2. Limpar contador de snapshots
    if (sm._snapshotCounters) {
      sm._snapshotCounters.delete(salaId);
    }

    // 2b. Cancelar timer de próxima rodada (evita setTimeout orphan)
    if (sm._roundTimers?.has(salaId)) {
      clearTimeout(sm._roundTimers.get(salaId));
      sm._roundTimers.delete(salaId);
    }

    // 3. Emitir evento e forcar todos os sockets a sairem da room
    if (sm.io) {
      // @event sessao_encerrada → room (broadcast) | sessão encerrada pelo administrador
      sm.sendToRoom(salaId, 'sessao_encerrada', {
        salaId,
        motivo: 'Sessão encerrada pelo administrador',
        timestamp: Date.now(),
        resumo: recapData.resumo || null,
        historiaNome: recapData.historiaNome || null,
        xpGanho: recapData.xpGanho || 0,
        loot: recapData.loot || []
      });
      analyticsService.track('sessao_fim', { salaId, xpGanho: recapData.xpGanho || 0 });

      const room = sm.io.sockets.adapter.rooms.get(salaId);
      if (room) {
        for (const socketId of room) {
          const socket = sm.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.leave(salaId);
          }
        }
      }
    }

    // 4. Limpar roomUsers
    if (sm.roomUsers) {
      sm.roomUsers.delete(salaId);
    }

    console.log(`🧹 Sessão ${salaId} limpa completamente (cache, room, sockets)`);
  }
}
