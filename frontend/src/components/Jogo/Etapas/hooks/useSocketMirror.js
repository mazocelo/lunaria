import { useState, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSocketStore, useGameStore } from '../../../../store/index.js';
import { showGameNotification } from '../../NotificationManager';

/**
 * Substitui o anti-pattern de `useSocketStore.subscribe()` + setState mirror.
 * Lê estados diretamente do store com useShallow e registra os 14 socket listeners.
 */
export const useSocketMirror = (user, onAdicionarMensagemRef) => {
  // Ler estados do socket store diretamente (elimina mirror anti-pattern)
  const gameState = useSocketStore(useShallow(s => ({
    faseJogo: s.faseJogo ?? 'aguardando_inicio',
    rodadaAtual: s.rodadaAtual ?? 1,
    turnoAtual: s.turnoAtual ?? 0,
    jogadorAtual: s.jogadorAtual ?? null,
    ordemJogadores: s.ordemJogadores ?? [],
    ordemDefinida: s.ordemDefinida ?? false,
    resultadosDados: s.resultadosDados ?? {},
    ehMeuTurno: s.ehMeuTurno ?? false,
    turnoIniciado: s.turnoIniciado ?? false,
    turnoStatus: s.turnoStatus ?? 'idle',
    testePendente: s.testePendente ?? null,
    testesPendentes: s.testesPendentes ?? [],
    cooldownRoleplay: s.cooldownRoleplay ?? 0,
    combateAtivo: s.combateAtivo ?? false,
    combateMonstros: s.combateMonstros ?? [],
    combateJogadores: s.combateJogadores ?? {},
    combateRodada: s.combateRodada ?? 0,
    combateResultado: s.combateResultado ?? null,
    combateLog: s.combateLog ?? [],
    combateXpGanho: s.combateXpGanho ?? 0,
    sessionRecap: s.sessionRecap ?? null,
  })));

  // Socket store actions
  const socketStoreOn = useSocketStore(s => s.on);
  const socketStoreOff = useSocketStore(s => s.off);

  // Game store
  const gameStoreMensagens = useGameStore(s => s.mensagens);
  const gameStoreSetMensagens = useGameStore(s => s.setMensagens);
  const gameStoreAtualizarMensagem = useGameStore(s => s.atualizarMensagem);

  // Level up queue
  const [levelUpData, setLevelUpData] = useState(null);
  const [levelUpQueue, setLevelUpQueue] = useState([]);

  useEffect(() => {
    if (!levelUpData && levelUpQueue.length > 0) {
      const [next, ...rest] = levelUpQueue;
      setLevelUpData(next);
      setLevelUpQueue(rest);
    }
  }, [levelUpData, levelUpQueue]);

  // Loading messages flag (inclui streaming)
  const loadingMensagensAtivas = gameStoreMensagens.some((m) => m.tipo === 'loading' || m.tipo === 'mestre_streaming');

  // Timeout de seguranca para loading/streaming do Mestre (30s)
  useEffect(() => {
    if (!loadingMensagensAtivas) return;
    const timeout = setTimeout(() => {
      showGameNotification('O Mestre demorou para responder. Tente novamente.', 'warning');
      const msgs = useGameStore.getState().mensagens || [];
      const semLoading = msgs.filter(m => m.tipo !== 'loading' && m.tipo !== 'mestre_streaming');
      if (msgs.length !== semLoading.length) gameStoreSetMensagens(semLoading);
    }, 30000);
    return () => clearTimeout(timeout);
  }, [loadingMensagensAtivas, gameStoreSetMensagens]);

  // Limpar loading se socket desconectar
  useEffect(() => {
    let wasConnected = useSocketStore.getState().isConnected;
    const unsubscribe = useSocketStore.subscribe((state) => {
      if (wasConnected && !state.isConnected && loadingMensagensAtivas) {
        const msgs = useGameStore.getState().mensagens || [];
        const semLoading = msgs.filter(m => m.tipo !== 'loading');
        if (msgs.length !== semLoading.length) gameStoreSetMensagens(semLoading);
      }
      wasConnected = state.isConnected;
    });
    return unsubscribe;
  }, [loadingMensagensAtivas, gameStoreSetMensagens]);

  // Limpar mensagens de dados quando ordem definida
  useEffect(() => {
    const limparMensagensDados = () => {
      const mensagensAtuais = useGameStore.getState().mensagens || [];
      const mensagensFiltradas = mensagensAtuais.filter(m => m.tipo === 'mestre' || m.tipo === 'entre_rodadas');
      gameStoreSetMensagens(mensagensFiltradas);
    };

    window.addEventListener('limparMensagensDados', limparMensagensDados);
    return () => window.removeEventListener('limparMensagensDados', limparMensagensDados);
  }, [gameStoreSetMensagens]);

  // 14 socket listeners
  useEffect(() => {
    const handleMensagemMestre = (data) => {
      const mensagensAtuais = useGameStore.getState().mensagens || [];
      // Limpar loading e streaming placeholders
      const mensagensLimpas = mensagensAtuais.filter(m => m.tipo !== 'loading' && m.tipo !== 'mestre_streaming');
      if (mensagensAtuais.length !== mensagensLimpas.length) {
        gameStoreSetMensagens(mensagensLimpas);
      }

      const mensagem = {
        ...data,
        id: data.id || Date.now(),
        userId: data.userId || 'mestre',
        username: data.username || 'Mestre',
        message: data.message || data.mensagem || '',
        tipo: 'mestre',
        timestamp: data.timestamp || Date.now()
      };

      if (onAdicionarMensagemRef.current) {
        onAdicionarMensagemRef.current(mensagem);
      }
    };

    const handleChatMessage = (data) => {
      if (!data?.tipo) return;
      if (data.userId !== 'mestre' && data.tipo !== 'mestre') {
        if (onAdicionarMensagemRef.current) {
          onAdicionarMensagemRef.current(data);
        }
      }
    };

    const handleResultadoDado = (data) => {
      const mensagem = {
        id: data.id || `dado_${Date.now()}`,
        userId: data.userId,
        username: data.username,
        personagemNome: data.personagemNome,
        valor: data.valor,
        dice: 'd20',
        tipo: 'dado',
        timestamp: data.timestamp || Date.now()
      };
      if (onAdicionarMensagemRef.current) {
        onAdicionarMensagemRef.current(mensagem);
      }
    };

    const handleMensagemRoleplay = (data) => {
      const mensagem = {
        id: data.id || Date.now(),
        userId: data.userId,
        username: data.username,
        message: data.message,
        tipo: 'roleplay',
        timestamp: data.timestamp || Date.now()
      };
      if (onAdicionarMensagemRef.current) {
        onAdicionarMensagemRef.current(mensagem);
      }
    };

    const handleRodadaFinalizada = (data) => {
      const mensagem = {
        id: `rodada_${data.rodada}_fim`,
        tipo: 'entre_rodadas',
        titulo: `Fim da Rodada ${data.rodada}`,
        mensagem: `A rodada ${data.rodada} foi concluida. Preparando proxima rodada...`,
        timestamp: data.timestamp || Date.now()
      };
      if (onAdicionarMensagemRef.current) {
        onAdicionarMensagemRef.current(mensagem);
      }
    };

    const handleOrdemDefinida = () => {
      window.dispatchEvent(new CustomEvent('limparMensagensDados'));
    };

    const handleDiceRoll = (data) => {
      if (data.dadosSolicitados) return;
      const mensagem = {
        id: data.id || `dice_${Date.now()}`,
        userId: data.userId,
        username: data.username,
        dice: data.dice,
        result: data.result,
        tipo: 'dado',
        timestamp: data.timestamp || Date.now()
      };
      if (onAdicionarMensagemRef.current) {
        onAdicionarMensagemRef.current(mensagem);
      }
    };

    const handleResultadoTeste = (data) => {
      if (onAdicionarMensagemRef.current) {
        onAdicionarMensagemRef.current({
          id: data.testeId || `teste_${data.groupId || Date.now()}_${data.userId || data.username}`,
          userId: data.userId || data.username,
          username: data.username,
          dice: data.dice || 'd20',
          result: data.rolagemBruta,
          rolagemBruta: data.rolagemBruta,
          modificador: data.modificador,
          bonusNivel: data.bonusNivel,
          totalModificador: data.totalModificador,
          atributoNome: data.atributoNome,
          bonusVantDesvant: data.bonusVantDesvant,
          detalhesBonus: data.detalhesBonus,
          total: data.total,
          dc: data.dc,
          sucesso: data.sucesso,
          descricaoResultado: data.descricaoResultado,
          tipo: 'resultado_teste',
          payload: data,
          timestamp: data.timestamp || Date.now()
        });
      }
    };

    const handleMestreSolicitaDados = (data) => {
      const groupId = data?.testePendente?.groupId || data?.testesPendentes?.[0]?.groupId || null;
      if (groupId) {
        const mensagensAtuais = useGameStore.getState().mensagens || [];
        const jaExiste = mensagensAtuais.some(
          (m) => m.tipo === 'solicitacao_dados'
            && String(m.payload?.groupId || m.payload?.testePendente?.groupId) === String(groupId)
        );
        if (!jaExiste && onAdicionarMensagemRef.current) {
          onAdicionarMensagemRef.current({
            id: `solicitacao_${groupId}`,
            tipo: 'solicitacao_dados',
            userId: 'mestre',
            username: 'Mestre',
            message: data.narrativa || 'O Mestre solicita uma rolagem de dados.',
            payload: {
              groupId,
              testePendente: data.testePendente || null,
              testesPendentes: data.testesPendentes || []
            },
            timestamp: data.timestamp || Date.now()
          });
        }
      }
    };

    const handleLevelUp = (data) => {
      if (String(data.userId) === String(user?.id)) {
        setLevelUpQueue(prev => [...prev, {
          novoNivel: data.novoNivel || data.nivel,
          ganhos: data.ganhos || {}
        }]);
      }
      if (onAdicionarMensagemRef.current) {
        onAdicionarMensagemRef.current({
          id: `levelup_${Date.now()}_${data.novoNivel}`,
          tipo: 'mestre',
          userId: 'sistema',
          username: 'Sistema',
          message: `🎉 **${data.personagemNome || data.username || 'Jogador'}** subiu para o **Nivel ${data.novoNivel || data.nivel}**!`,
          timestamp: Date.now()
        });
      }
    };

    const handleAcaoMestre = (data) => {
      const ehMeu = String(data.userId) === String(user?.id);
      if (onAdicionarMensagemRef.current) {
        onAdicionarMensagemRef.current({
          id: data.id || `acao_${data.tipo}_${data.userId || 'sistema'}_${data.timestamp || Date.now()}`,
          tipo: 'acao_mestre',
          userId: data.userId || 'sistema',
          username: data.username || 'Sistema',
          message: data.message || data.mensagem || '',
          payload: data,
          timestamp: data.timestamp || Date.now()
        });
      }
      if (data.tipo === 'item_recebido' && ehMeu) {
        if (data.item) showGameNotification(`Item recebido: ${data.item.nome || 'Novo item'}`, 'success');
      } else if (data.tipo === 'item_removido' && ehMeu) {
        const nomeItem = data.item?.nome || data.itemNome;
        if (nomeItem) showGameNotification(`Item removido: ${nomeItem}`, 'warning');
      } else if (data.tipo === 'curado' && ehMeu) {
        showGameNotification(`+${data.hp_restaurado || 0} HP restaurado!`, 'success');
      } else if (data.tipo === 'dano_recebido' && ehMeu) {
        if (data.imune) {
          showGameNotification(`Imune ao dano${data.elemento ? ` de ${data.elemento}` : ''}!`, 'info');
        } else {
          showGameNotification(`-${data.dano} HP${data.elemento ? ` (${data.elemento})` : ''}${data.derrotado ? ' - Derrotado!' : ''}`, 'error');
        }
      } else if (data.tipo === 'status_aplicado' && ehMeu) {
        showGameNotification(`Status: ${data.status} (${data.duracao || 3} turnos)`, 'warning');
      } else if (data.tipo === 'status_removido' && ehMeu) {
        showGameNotification(`Status removido: ${data.status}`, 'info');
      } else if (data.tipo === 'dano_ambiental' && ehMeu) {
        if (data.imune) {
          showGameNotification(`Imune ao dano ambiental${data.elemento ? ` de ${data.elemento}` : ''}!`, 'info');
        } else {
          showGameNotification(`-${data.dano} HP ambiental${data.fonte ? ` (${data.fonte})` : ''}${data.derrotado ? ' - Derrotado!' : ''}`, 'error');
        }
      } else if (data.tipo === 'personagem_estabilizado' && ehMeu) {
        showGameNotification(`Estabilizado! HP: ${data.hp_atual}`, 'success');
      }
    };

    const handleCombateFinalizado = (data) => {
      const xpPorJogador = data.xpPorJogador || 0;
      if (xpPorJogador > 0) {
        showGameNotification(`+${xpPorJogador} XP ganho no combate!`, 'success');
      }
      if (onAdicionarMensagemRef.current) {
        const resultado = data.resultado === 'vitoria' ? 'Vitoria!' : data.resultado === 'derrota' ? 'Derrota...' : 'Combate encerrado';
        onAdicionarMensagemRef.current({
          id: `combate_fim_${Date.now()}`,
          tipo: 'mestre',
          userId: 'sistema',
          username: 'Sistema',
          message: `${resultado}${xpPorJogador > 0 ? ` (+${xpPorJogador} XP)` : ''}`,
          timestamp: Date.now()
        });
      }
    };

    const handleCombateLoot = (data) => {
      const meusItens = data.lootPorJogador?.[String(user?.id)] || [];
      if (meusItens.length > 0) {
        const nomes = meusItens.map(i => i.nome).join(', ');
        showGameNotification(`Loot recebido: ${nomes}`, 'success');
      }
      if (onAdicionarMensagemRef.current && data.todosItens?.length > 0) {
        const listaItens = data.todosItens.map(i => i.nome).join(', ');
        onAdicionarMensagemRef.current({
          id: `loot_${Date.now()}`,
          tipo: 'mestre',
          userId: 'sistema',
          username: 'Sistema',
          message: `Loot obtido: ${listaItens}`,
          timestamp: Date.now()
        });
      }
    };

    const handleErroMensagem = (data) => {
      if (data?.message) showGameNotification(data.message, 'warning');
      const msgs = useGameStore.getState().mensagens || [];
      const semLoading = msgs.filter(m => m.tipo !== 'loading');
      if (msgs.length !== semLoading.length) gameStoreSetMensagens(semLoading);
    };

    // --- Streaming handlers ---
    const handleMestreStreamStart = (data) => {
      const msgs = useGameStore.getState().mensagens || [];
      const semLoading = msgs.filter(m => m.tipo !== 'loading');
      if (msgs.length !== semLoading.length) gameStoreSetMensagens(semLoading);

      if (onAdicionarMensagemRef.current) {
        onAdicionarMensagemRef.current({
          id: data.streamId,
          userId: 'mestre',
          username: 'Mestre',
          message: '',
          tipo: 'mestre_streaming',
          timestamp: data.timestamp || Date.now()
        });
      }
    };

    const handleMestreStreamChunk = (data) => {
      gameStoreAtualizarMensagem(data.streamId, { message: data.accumulated });
    };

    const handleMestreStreamEnd = (data) => {
      // Remover placeholder — mensagem_mestre chega logo depois
      const msgs = useGameStore.getState().mensagens || [];
      const sem = msgs.filter(m => m.id !== data.streamId);
      if (msgs.length !== sem.length) gameStoreSetMensagens(sem);
    };

    // Register all 17 listeners
    socketStoreOn('mensagem_mestre', handleMensagemMestre);
    socketStoreOn('chat_message', handleChatMessage);
    socketStoreOn('resultado_dado_inicial', handleResultadoDado);
    socketStoreOn('mensagem_roleplay', handleMensagemRoleplay);
    socketStoreOn('rodada_finalizada', handleRodadaFinalizada);
    socketStoreOn('ordem_definida', handleOrdemDefinida);
    socketStoreOn('dice_roll', handleDiceRoll);
    socketStoreOn('resultado_teste', handleResultadoTeste);
    socketStoreOn('mestre_solicita_dados', handleMestreSolicitaDados);
    socketStoreOn('level_up', handleLevelUp);
    socketStoreOn('acao_mestre', handleAcaoMestre);
    socketStoreOn('combate_finalizado', handleCombateFinalizado);
    socketStoreOn('combate_loot', handleCombateLoot);
    socketStoreOn('erro_mensagem', handleErroMensagem);
    socketStoreOn('mestre_stream_start', handleMestreStreamStart);
    socketStoreOn('mestre_stream_chunk', handleMestreStreamChunk);
    socketStoreOn('mestre_stream_end', handleMestreStreamEnd);

    return () => {
      socketStoreOff('mensagem_mestre', handleMensagemMestre);
      socketStoreOff('chat_message', handleChatMessage);
      socketStoreOff('resultado_dado_inicial', handleResultadoDado);
      socketStoreOff('mensagem_roleplay', handleMensagemRoleplay);
      socketStoreOff('rodada_finalizada', handleRodadaFinalizada);
      socketStoreOff('ordem_definida', handleOrdemDefinida);
      socketStoreOff('dice_roll', handleDiceRoll);
      socketStoreOff('resultado_teste', handleResultadoTeste);
      socketStoreOff('mestre_solicita_dados', handleMestreSolicitaDados);
      socketStoreOff('level_up', handleLevelUp);
      socketStoreOff('acao_mestre', handleAcaoMestre);
      socketStoreOff('combate_finalizado', handleCombateFinalizado);
      socketStoreOff('combate_loot', handleCombateLoot);
      socketStoreOff('erro_mensagem', handleErroMensagem);
      socketStoreOff('mestre_stream_start', handleMestreStreamStart);
      socketStoreOff('mestre_stream_chunk', handleMestreStreamChunk);
      socketStoreOff('mestre_stream_end', handleMestreStreamEnd);
    };
  }, [socketStoreOn, socketStoreOff, gameStoreSetMensagens, user?.id]);

  return {
    // Game state (from store directly — no more mirror)
    ...gameState,

    // Level up
    levelUpData,
    setLevelUpData,

    // Game store
    gameStoreAtualizarMensagem,
  };
};
