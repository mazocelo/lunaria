import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSocketStore, useGameStore } from '../../../../store/index';
import { showGameNotification } from '../../NotificationManager';
import type { MutableRefObject } from 'react';

interface UserBasico {
  id?: number | string;
}

/**
 * Substitui o anti-pattern de `useSocketStore.subscribe()` + setState mirror.
 * Lê estados diretamente do store com useShallow e registra os 14 socket listeners.
 */
export const useSocketMirror = (
  user: UserBasico | null | undefined,
  onAdicionarMensagemRef: MutableRefObject<(msg: unknown) => void>,
) => {
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
    combateFase: s.combateFase ?? null,
    combateMonstros: s.combateMonstros ?? [],
    combateJogadores: s.combateJogadores ?? {},
    combateRodada: s.combateRodada ?? 0,
    combateResultado: s.combateResultado ?? null,
    combateLog: s.combateLog ?? [],
    combateXpGanho: s.combateXpGanho ?? 0,
    combateOrdemIniciativa: s.combateOrdemIniciativa ?? [],
    combateTurnoAtual: s.combateTurnoAtual ?? null,
    combateIniciativaPendente: s.combateIniciativaPendente ?? false,
    combateIniciativaModificador: s.combateIniciativaModificador ?? 0,
    sessionRecap: s.sessionRecap ?? null,
    pendingMestreRequestId: s.pendingMestreRequestId ?? null,
    pendingMestreRequestKind: s.pendingMestreRequestKind ?? null,
    pendingMestreSentAt: s.pendingMestreSentAt ?? null,
    activeMestreRequestId: s.activeMestreRequestId ?? null,
    activeMestreRequestStatus: s.activeMestreRequestStatus ?? null,
    activeMestreRequestAttempt: s.activeMestreRequestAttempt ?? 0,
    activeMestreRequestUserId: s.activeMestreRequestUserId ?? null,
    activeMestreUpdatedAt: s.activeMestreUpdatedAt ?? null,
    lastRegenerableMestreRequest: s.lastRegenerableMestreRequest ?? null,
    mestreStale: s.mestreStale ?? false,
  })));

  // Socket store actions
  const socketStoreOn = useSocketStore(s => s.on);
  const socketStoreOff = useSocketStore(s => s.off);

  // Game store
  const gameStoreMensagens = useGameStore(s => s.mensagens);
  const gameStoreSetMensagens = useGameStore(s => s.setMensagens);
  const gameStoreAtualizarMensagem = useGameStore(s => s.atualizarMensagem);

  // Level up queue
  interface LevelUpEntry { novoNivel?: number; ganhos: Record<string, unknown>; }
  const [levelUpData, setLevelUpData] = useState<LevelUpEntry | null>(null);
  const [levelUpQueue, setLevelUpQueue] = useState<LevelUpEntry[]>([]);

  useEffect(() => {
    if (!levelUpData && levelUpQueue.length > 0) {
      const [next, ...rest] = levelUpQueue;
      setLevelUpData(next);
      setLevelUpQueue(rest);
    }
  }, [levelUpData, levelUpQueue]);

  const loadingMensagensAtivas = gameStoreMensagens.some((m) => m.tipo === 'mestre_streaming');

  useEffect(() => {
    const pendingRequestId = gameState.pendingMestreRequestId;
    const pendingSentAt = gameState.pendingMestreSentAt;
    if (!pendingRequestId || !pendingSentAt) {
      return;
    }

    const timeoutId = setTimeout(() => {
      const state = useSocketStore.getState();
      if (state.pendingMestreRequestId !== pendingRequestId) {
        return;
      }

      useSocketStore.setState({
        pendingMestreRequestId: null,
        pendingMestreRequestKind: null,
        pendingMestreSentAt: null,
        mestrePensando: false,
        aguardandoRespostaMestre: false
      });
      showGameNotification('Nao foi possivel confirmar o inicio da resposta do Mestre. Tente novamente.', 'error');
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [gameState.pendingMestreRequestId, gameState.pendingMestreSentAt]);

  // Watchdog por heartbeat/status do Mestre
  useEffect(() => {
    const activeRequestId = gameState.activeMestreRequestId;
    const activeStatus = gameState.activeMestreRequestStatus;
    const updatedAt = gameState.activeMestreUpdatedAt;
    if (!activeRequestId || !activeStatus || ['completed', 'failed', 'timed_out', 'superseded', 'rejected_busy'].includes(activeStatus)) {
      return;
    }

    const interval = setInterval(() => {
      const lastUpdate = updatedAt ? Date.parse(updatedAt) : Date.now();
      if (Date.now() - lastUpdate > 15000) {
        useSocketStore.setState({ mestreStale: true });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.activeMestreRequestId, gameState.activeMestreRequestStatus, gameState.activeMestreUpdatedAt]);

  // Limpar loading se socket desconectar
  useEffect(() => {
    let wasConnected = useSocketStore.getState().isConnected;
    const unsubscribe = useSocketStore.subscribe((state) => {
      if (wasConnected && !state.isConnected && loadingMensagensAtivas) {
        const msgs = useGameStore.getState().mensagens || [];
        const semLoading = msgs.filter(m => m.tipo !== 'mestre_streaming');
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
    interface MestreEventData {
      status?: string;
      requestId?: string | null;
      attempt?: number;
      userId?: string | number;
      playerMessageId?: string | number | null;
      updatedAt?: string;
      kind?: string;
      errorCode?: string | null;
      errorMessage?: string | null;
      [key: string]: unknown;
    }
    interface MestreEventOverrides {
      status?: string;
      updatedAt?: string;
    }
    const updateRequestState = (data: MestreEventData = {}, overrides: MestreEventOverrides = {}) => {
      const state = useSocketStore.getState() as Record<string, unknown>;
      const status = overrides.status || data.status || null;
      const terminal = ['completed', 'failed', 'timed_out', 'superseded'].includes(String(status));
      const requestId = data.requestId || state.activeMestreRequestId || state.pendingMestreRequestId || null;
      const attempt = data.attempt || (state.activeMestreRequestAttempt as number | undefined) || 0;
      const requestUserId = data.userId || state.activeMestreRequestUserId || null;
      const playerMessageId = data.playerMessageId || (state.activeMestrePlayerMessageId as string | number | null | undefined) || null;
      const updatedAt = overrides.updatedAt || data.updatedAt || new Date().toISOString();
      const nextState: Record<string, unknown> = {
        pendingMestreRequestId: requestId === state.pendingMestreRequestId ? null : state.pendingMestreRequestId,
        pendingMestreRequestKind: requestId === state.pendingMestreRequestId ? null : state.pendingMestreRequestKind,
        pendingMestreSentAt: requestId === state.pendingMestreRequestId ? null : state.pendingMestreSentAt,
        activeMestreRequestId: requestId,
        activeMestreRequestStatus: status,
        activeMestreRequestAttempt: attempt,
        activeMestreRequestUserId: requestUserId,
        activeMestrePlayerMessageId: playerMessageId,
        activeMestreUpdatedAt: updatedAt,
        mestrePensando: !!status && !terminal,
        aguardandoRespostaMestre: !!status && !terminal,
        mestreTimedOut: status === 'timed_out',
        mestreStale: false
      };

      const lastReq = state.lastRegenerableMestreRequest as { requestId?: string; kind?: string } | null | undefined;
      if (status === 'failed' || status === 'timed_out') {
        nextState.lastRegenerableMestreRequest = {
          requestId,
          kind: data.kind || state.pendingMestreRequestKind || lastReq?.kind || 'player_action',
          status,
          attempt,
          userId: requestUserId,
          updatedAt,
          playerMessageId,
          errorCode: data.errorCode || null,
          errorMessage: data.errorMessage || null
        };
      } else if (!terminal && requestId === lastReq?.requestId) {
        nextState.lastRegenerableMestreRequest = null;
      } else if (status === 'completed' && requestId === lastReq?.requestId) {
        nextState.lastRegenerableMestreRequest = null;
      }

      useSocketStore.setState({
        ...nextState
      } as unknown as Parameters<typeof useSocketStore.setState>[0]);
    };

    const clearAnonymousMestreState = () => {
      const state = useSocketStore.getState();
      if (state.activeMestreRequestId) {
        return;
      }

      useSocketStore.setState({
        activeMestreRequestStatus: null,
        activeMestreRequestAttempt: 0,
        activeMestreRequestUserId: null,
        activeMestrePlayerMessageId: null,
        activeMestreUpdatedAt: null,
        aguardandoRespostaMestre: false,
        mestrePensando: false,
        mestreTimedOut: false,
        mestreStale: false
      });
    };

    const handleMestrePensando = (data: { ativo?: boolean } | undefined) => {
      const state = useSocketStore.getState();
      if (state.pendingMestreRequestId || state.activeMestreRequestId) {
        return;
      }
      useSocketStore.setState({ mestrePensando: !!data?.ativo });
    };

    const handleMestreRequestStatus = (data: MestreEventData) => {
      if (!data?.requestId) return;
      if (data.status === 'rejected_busy' && data.errorMessage) {
        const state = useSocketStore.getState();
        if (state.pendingMestreRequestId === data.requestId) {
          useSocketStore.setState({
            pendingMestreRequestId: null,
            pendingMestreRequestKind: null,
            pendingMestreSentAt: null,
            mestrePensando: false,
            aguardandoRespostaMestre: false,
            mestreStale: false
          });
        }
        showGameNotification(data.errorMessage, 'warning');
        return;
      }
      updateRequestState(data);
    };

    const handleMensagemMestre = (data: MestreEventData & { requestId?: string }) => {
      const state = useSocketStore.getState();
      const activeRequestId = state.activeMestreRequestId;
      const pendingRequestId = state.pendingMestreRequestId;
      if (data?.requestId && activeRequestId && String(data.requestId) !== String(activeRequestId) && String(data.requestId) !== String(pendingRequestId || '')) {
        return;
      }

      if (data?.requestId) {
        updateRequestState(data, { status: 'completed' });
      } else {
        useSocketStore.setState({
          aguardandoRespostaMestre: false,
          mestrePensando: false,
          mestreTimedOut: false,
          mestreStale: false,
          ...(state.activeMestreRequestId ? {} : {
            activeMestreRequestStatus: null,
            activeMestreRequestAttempt: 0,
            activeMestreRequestUserId: null,
            activeMestrePlayerMessageId: null,
            activeMestreUpdatedAt: null
          })
        });
      }

      const mensagensAtuais = useGameStore.getState().mensagens || [];
      const mensagensLimpas = mensagensAtuais.filter((m) => {
        if (!['mestre_streaming', 'loading'].includes(String(m.tipo))) return true;
        if (!data?.requestId) return false;
        return String(m.requestId) !== String(data.requestId);
      });
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

    const handleChatMessage = (data: Record<string, unknown>) => {
      if (!data?.tipo) return;
      if (data.userId !== 'mestre' && data.tipo !== 'mestre') {
        if (onAdicionarMensagemRef.current) {
          onAdicionarMensagemRef.current(data);
        }
      }
    };

    const handleResultadoDado = (data: Record<string, unknown>) => {
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

    const handleMensagemRoleplay = (data: Record<string, unknown>) => {
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

    const handleRodadaFinalizada = (data: Record<string, unknown>) => {
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

    const handleDiceRoll = (data: Record<string, unknown>) => {
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

    const handleResultadoTeste = (data: Record<string, unknown> & { groupId?: string | number; remainingGroupTests?: unknown[]; nextTestePendente?: unknown; groupResolved?: boolean; testePendente?: unknown; teste_pendente?: unknown }) => {
      const resolvedGroupId = data?.groupId || null;
      if (resolvedGroupId) {
        const promptId = `solicitacao_${resolvedGroupId}`;
        const remainingGroupTests = Array.isArray(data?.remainingGroupTests) ? data.remainingGroupTests : [];
        const nextTestePendente = data?.nextTestePendente || remainingGroupTests[0] || null;
        const mensagensAtuais = useGameStore.getState().mensagens || [];
        const promptExistente = mensagensAtuais.find(
          (mensagem) => {
            const m = mensagem as { id?: number | string; tipo?: string; payload?: { groupId?: number | string; testePendente?: { groupId?: number | string } } };
            return String(m.id) === String(promptId)
              || (m.tipo === 'solicitacao_dados'
                && String(m.payload?.groupId || m.payload?.testePendente?.groupId || '') === String(resolvedGroupId));
          }
        );

        if (data?.groupResolved) {
          const mensagensFiltradas = mensagensAtuais.filter((mensagem) => {
            const m = mensagem as { tipo?: string; payload?: { groupId?: number | string; testePendente?: { groupId?: number | string } } };
            if (m.tipo !== 'solicitacao_dados') return true;
            const payloadGroupId = m.payload?.groupId || m.payload?.testePendente?.groupId || null;
            return String(payloadGroupId || '') !== String(resolvedGroupId);
          });
          if (mensagensFiltradas.length !== mensagensAtuais.length) {
            gameStoreSetMensagens(mensagensFiltradas);
          }
        } else if (promptExistente) {
          const promptExistenteAny = promptExistente as { id?: number | string; payload?: Record<string, unknown> };
          gameStoreAtualizarMensagem((promptExistenteAny.id ?? ''), {
            payload: {
              ...(promptExistenteAny.payload || {}),
              groupId: resolvedGroupId,
              testePendente: nextTestePendente,
              testesPendentes: remainingGroupTests
            }
          });
        } else if (remainingGroupTests.length > 0 && onAdicionarMensagemRef.current) {
          onAdicionarMensagemRef.current({
            id: promptId,
            tipo: 'solicitacao_dados',
            userId: 'mestre',
            username: 'Mestre',
            message: 'O Mestre solicita uma rolagem de dados.',
            payload: {
              groupId: resolvedGroupId,
              testePendente: nextTestePendente,
              testesPendentes: remainingGroupTests
            },
            timestamp: data.timestamp || Date.now()
          });
        }
      }

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

    const handleMestreSolicitaDados = (data: Record<string, unknown> & { testePendente?: { groupId?: string | number }; testesPendentes?: Array<{ groupId?: string | number }>; narrativa?: string }) => {
      const groupId = data?.testePendente?.groupId || data?.testesPendentes?.[0]?.groupId || null;
      if (groupId) {
        const mensagensAtuais = useGameStore.getState().mensagens || [];
        const mensagemExistente = mensagensAtuais.find(
          (m) => {
            const msg = m as { tipo?: string; payload?: { groupId?: string | number; testePendente?: { groupId?: string | number } } };
            return msg.tipo === 'solicitacao_dados'
              && String(msg.payload?.groupId || msg.payload?.testePendente?.groupId) === String(groupId);
          }
        );
        if (mensagemExistente) {
          const msgExistAny = mensagemExistente as { id?: number | string; message?: string; payload?: Record<string, unknown> };
          gameStoreAtualizarMensagem((msgExistAny.id ?? ''), {
            message: data.narrativa || msgExistAny.message || 'O Mestre solicita uma rolagem de dados.',
            payload: {
              ...(msgExistAny.payload || {}),
              groupId,
              testePendente: data.testePendente || null,
              testesPendentes: data.testesPendentes || []
            }
          });
        } else if (onAdicionarMensagemRef.current) {
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

    const handleLevelUp = (data: Record<string, unknown> & { personagemNome?: string; username?: string; novoNivel?: number; nivel?: number; userId?: string | number; ganhos?: Record<string, unknown> }) => {
      const personagemNome = data.personagemNome || data.username || 'Jogador';
      const novoNivel = data.novoNivel || data.nivel;

      if (String(data.userId) === String(user?.id)) {
        setLevelUpQueue(prev => [...prev, {
          novoNivel,
          ganhos: data.ganhos || {}
        }]);
      }
      if (onAdicionarMensagemRef.current) {
        onAdicionarMensagemRef.current({
          id: `levelup_${Date.now()}_${novoNivel}`,
          tipo: 'acao_mestre',
          userId: 'sistema',
          username: 'Sistema',
          message: `${personagemNome} subiu para o Nivel ${novoNivel}!`,
          payload: data,
          timestamp: Date.now()
        });
      }
    };

    const handleAcaoMestre = (data: Record<string, unknown> & { userId?: string | number; tipo?: string; item?: { nome?: string }; itemNome?: string; hp_restaurado?: number; dano?: number; elemento?: string; derrotado?: boolean; status?: string; duracao?: number; fonte?: string; imune?: boolean; hp_atual?: number; message?: string; mensagem?: string }) => {
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

    const handleCombateFinalizado = (data: Record<string, unknown> & { xpPorJogador?: number; resultado?: string }) => {
      const xpPorJogador = data.xpPorJogador || 0;
      if (xpPorJogador > 0) {
        showGameNotification(`+${xpPorJogador} XP ganho no combate!`, 'success');
      }
      if (onAdicionarMensagemRef.current) {
        const resultado = data.resultado === 'vitoria' ? 'Vitoria!' : data.resultado === 'derrota' ? 'Derrota...' : 'Combate encerrado';
        onAdicionarMensagemRef.current({
          id: `combate_fim_${Date.now()}`,
          tipo: 'acao_mestre',
          userId: 'sistema',
          username: 'Sistema',
          message: `${resultado}${xpPorJogador > 0 ? ` (+${xpPorJogador} XP)` : ''}`,
          payload: data,
          timestamp: Date.now()
        });
      }
    };

    const handleCombateLoot = (data: { lootPorJogador?: Record<string, Array<{ nome?: string }>>; todosItens?: Array<{ nome?: string }> }) => {
      const meusItens = data.lootPorJogador?.[String(user?.id)] || [];
      if (meusItens.length > 0) {
        const nomes = meusItens.map((i: { nome?: string }) => i.nome).join(', ');
        showGameNotification(`Loot recebido: ${nomes}`, 'success');
      }
      if (onAdicionarMensagemRef.current && (data.todosItens?.length ?? 0) > 0) {
        const listaItens = (data.todosItens || []).map((i: { nome?: string }) => i.nome).join(', ');
        onAdicionarMensagemRef.current({
          id: `loot_${Date.now()}`,
          tipo: 'acao_mestre',
          userId: 'sistema',
          username: 'Sistema',
          message: `Loot obtido: ${listaItens}`,
          payload: data,
          timestamp: Date.now()
        });
      }
    };

    const handleErroMensagem = (data: { requestId?: string; mensagem?: string; message?: string }) => {
      const state = useSocketStore.getState();
      const currentStatus = state.activeMestreRequestStatus;
      if (!currentStatus || !['failed', 'timed_out'].includes(currentStatus)) {
        useSocketStore.setState({
          pendingMestreRequestId: null,
          pendingMestreRequestKind: null,
          pendingMestreSentAt: null,
          aguardandoRespostaMestre: false,
          mestrePensando: false,
          mestreTimedOut: false,
          mestreStale: false
        });
      }
      if (data?.message) showGameNotification(data.message, 'warning');
      const msgs = useGameStore.getState().mensagens || [];
      const semLoading = msgs.filter(m => !['mestre_streaming', 'loading'].includes(String(m.tipo)));
      if (msgs.length !== semLoading.length) gameStoreSetMensagens(semLoading);
    };

    // --- Streaming handlers ---
    const handleMestreStreamStart = (data: Record<string, unknown> & { requestId?: string; attempt?: number; streamId?: string }) => {
      if (data?.requestId) {
        updateRequestState(data, { status: 'streaming', updatedAt: new Date().toISOString() });
      } else {
        useSocketStore.setState({
          aguardandoRespostaMestre: true,
          mestrePensando: true,
          mestreStale: false
        });
      }

      if (onAdicionarMensagemRef.current) {
        onAdicionarMensagemRef.current({
          id: data.streamId || `stream_${data.requestId}_${data.attempt}`,
          userId: 'mestre',
          username: 'Mestre',
          message: '',
          tipo: 'mestre_streaming',
          requestId: data.requestId,
          attempt: data.attempt || 1,
          timestamp: data.timestamp || Date.now()
        });
      }
    };

    const handleMestreStreamChunk = (data: Record<string, unknown> & { requestId?: string; attempt?: number; streamId?: string; accumulated?: string }) => {
      if (data?.requestId) {
        updateRequestState(data, { status: 'streaming', updatedAt: new Date().toISOString() });
      }
      gameStoreAtualizarMensagem(data.streamId || `stream_${data.requestId}_${data.attempt}`, {
        message: data.accumulated,
        requestId: data.requestId,
        attempt: data.attempt || 1
      });
    };

    const handleMestreStreamEnd = (data: { requestId?: string; attempt?: number; streamId?: string }) => {
      if (!data?.requestId) {
        clearAnonymousMestreState();
      }
      // Mark streaming balloon as completed but keep it visible until mensagem_mestre arrives.
      // This prevents the flicker gap where text disappears then reappears.
      const msgs = useGameStore.getState().mensagens || [];
      const streamId = data.streamId || `stream_${data.requestId}_${data.attempt}`;
      const updated = msgs.map((m) => {
        if (m.id === streamId && m.tipo === 'mestre_streaming') {
          return { ...m, streamEnded: true };
        }
        return m;
      });
      // Only remove loading placeholders, not the stream balloon itself
      const sem = updated.filter((m) => {
        if (m.tipo === 'loading' && data?.requestId && String(m.requestId || '') === String(data.requestId)) return false;
        return true;
      });
      if (msgs.length !== sem.length || updated.some((m, i) => m !== msgs[i])) gameStoreSetMensagens(sem);
    };

    const handleMestreStreamError = (data: { requestId?: string; attempt?: number; streamId?: string }) => {
      if (data?.requestId) {
        updateRequestState(data, { status: 'processing', updatedAt: new Date().toISOString() });
      } else {
        clearAnonymousMestreState();
      }
      const msgs = useGameStore.getState().mensagens || [];
      const sem = msgs.filter((m) => {
        if (m.id === (data.streamId || `stream_${data.requestId}_${data.attempt}`)) return false;
        if (m.tipo === 'loading' && data?.requestId && String(m.requestId || '') === String(data.requestId)) return false;
        return true;
      });
      if (msgs.length !== sem.length) gameStoreSetMensagens(sem);
    };

    type SocketListenerCb = (...args: unknown[]) => void;
    const onCb = (event: string, fn: (data: never) => void) => socketStoreOn(event, fn as unknown as SocketListenerCb);

    // Register all 17 listeners
    onCb('mestre_request_status', handleMestreRequestStatus as unknown as (data: never) => void);
    onCb('mensagem_mestre', handleMensagemMestre as unknown as (data: never) => void);
    onCb('chat_message', handleChatMessage as unknown as (data: never) => void);
    onCb('resultado_dado_inicial', handleResultadoDado as unknown as (data: never) => void);
    onCb('mensagem_roleplay', handleMensagemRoleplay as unknown as (data: never) => void);
    onCb('rodada_finalizada', handleRodadaFinalizada as unknown as (data: never) => void);
    socketStoreOn('ordem_definida', handleOrdemDefinida);
    onCb('dice_roll', handleDiceRoll as unknown as (data: never) => void);
    onCb('resultado_teste', handleResultadoTeste as unknown as (data: never) => void);
    onCb('mestre_solicita_dados', handleMestreSolicitaDados as unknown as (data: never) => void);
    onCb('level_up', handleLevelUp as unknown as (data: never) => void);
    onCb('acao_mestre', handleAcaoMestre as unknown as (data: never) => void);

    // Monster action → chat message
    const handleCombatMonsterAction = (rawData: Record<string, unknown>) => {
      const data = rawData as {
        atacanteNome?: string; alvoNome?: string; bonusAtaque?: number;
        rolagem?: number; defesaJogador?: number | string; acertou?: boolean;
        esquivou?: boolean; critico?: boolean; dano?: number; hpRestante?: number;
        hpMax?: number; habilidade?: string;
      };
      if (!data || !onAdicionarMensagemRef.current) return;
      const atacante = data.atacanteNome || 'Monstro';
      const alvo = data.alvoNome || 'Jogador';
      const bonus = data.bonusAtaque || 0;
      const total = data.rolagem != null ? (data.rolagem + bonus) : '?';
      const defesa = data.defesaJogador || '?';

      let texto: string;
      if (!data.acertou && !data.esquivou) {
        texto = `**${atacante}** ataca ${alvo}! d20:${data.rolagem}${bonus ? `+${bonus}=${total}` : ''} vs DEF ${defesa} — **ERROU**`;
      } else if (data.esquivou) {
        texto = `**${atacante}** ataca ${alvo}! d20:${data.rolagem}${bonus ? `+${bonus}=${total}` : ''} — ${alvo} **ESQUIVOU!**`;
      } else {
        const critico = data.critico ? ' **CRÍTICO!**' : '';
        const danoTexto = (data.dano ?? 0) > 0 ? ` Dano: ${data.dano}` : ' Golpe fraco!';
        const hpTexto = data.hpRestante != null && data.hpMax != null ? ` (HP: ${data.hpRestante}/${data.hpMax})` : '';
        texto = `**${atacante}** ataca ${alvo}! d20:${data.rolagem}${bonus ? `+${bonus}=${total}` : ''} vs DEF ${defesa} — **HIT!**${critico}${danoTexto}${hpTexto}`;
      }
      if (data.habilidade && data.habilidade !== 'Ataque básico' && data.habilidade !== 'Ataque basico') {
        texto += ` _(${data.habilidade})_`;
      }

      onAdicionarMensagemRef.current({
        id: `monster_action_${Date.now()}`,
        userId: 'combat',
        username: atacante,
        message: texto,
        tipo: 'combat_monster',
        origem: 'combate',
        timestamp: Date.now()
      });
    };
    onCb('combat_monster_action', handleCombatMonsterAction as unknown as (data: never) => void);

    onCb('combate_finalizado', handleCombateFinalizado as unknown as (data: never) => void);
    onCb('combate_loot', handleCombateLoot as unknown as (data: never) => void);
    onCb('erro_mensagem', handleErroMensagem as unknown as (data: never) => void);
    onCb('mestre_pensando', handleMestrePensando as unknown as (data: never) => void);
    onCb('mestre_stream_start', handleMestreStreamStart as unknown as (data: never) => void);
    onCb('mestre_stream_chunk', handleMestreStreamChunk as unknown as (data: never) => void);
    onCb('mestre_stream_end', handleMestreStreamEnd as unknown as (data: never) => void);
    onCb('mestre_stream_error', handleMestreStreamError as unknown as (data: never) => void);

    const offCb = (event: string, fn: (data: never) => void) => socketStoreOff(event, fn as unknown as SocketListenerCb);
    return () => {
      offCb('mestre_request_status', handleMestreRequestStatus as unknown as (data: never) => void);
      offCb('mensagem_mestre', handleMensagemMestre as unknown as (data: never) => void);
      offCb('chat_message', handleChatMessage as unknown as (data: never) => void);
      offCb('resultado_dado_inicial', handleResultadoDado as unknown as (data: never) => void);
      offCb('mensagem_roleplay', handleMensagemRoleplay as unknown as (data: never) => void);
      offCb('rodada_finalizada', handleRodadaFinalizada as unknown as (data: never) => void);
      socketStoreOff('ordem_definida', handleOrdemDefinida);
      offCb('dice_roll', handleDiceRoll as unknown as (data: never) => void);
      offCb('resultado_teste', handleResultadoTeste as unknown as (data: never) => void);
      offCb('mestre_solicita_dados', handleMestreSolicitaDados as unknown as (data: never) => void);
      offCb('level_up', handleLevelUp as unknown as (data: never) => void);
      offCb('acao_mestre', handleAcaoMestre as unknown as (data: never) => void);
      offCb('combat_monster_action', handleCombatMonsterAction as unknown as (data: never) => void);
      offCb('combate_finalizado', handleCombateFinalizado as unknown as (data: never) => void);
      offCb('combate_loot', handleCombateLoot as unknown as (data: never) => void);
      offCb('erro_mensagem', handleErroMensagem as unknown as (data: never) => void);
      offCb('mestre_pensando', handleMestrePensando as unknown as (data: never) => void);
      offCb('mestre_stream_start', handleMestreStreamStart as unknown as (data: never) => void);
      offCb('mestre_stream_chunk', handleMestreStreamChunk as unknown as (data: never) => void);
      offCb('mestre_stream_end', handleMestreStreamEnd as unknown as (data: never) => void);
      offCb('mestre_stream_error', handleMestreStreamError as unknown as (data: never) => void);
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
