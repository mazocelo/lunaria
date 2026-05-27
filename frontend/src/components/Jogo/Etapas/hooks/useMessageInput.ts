import { useState, useRef, useCallback, useEffect } from 'react';
import { showGameNotification } from '../../NotificationManager';
import { useSocketStore } from '../../../../store/index';
import { TIMEOUTS, ROLEPLAY_COOLDOWN_SECONDS } from '../../../../constants/game';

interface BasicEntity {
  id?: number | string;
  [key: string]: unknown;
}

interface PersonagemBasico {
  id?: number | string;
  personagemId?: number | string;
  personagem_id?: number | string;
  nome?: string;
  classe?: string;
  classe_nome?: string;
  nivel?: number | string;
}

interface UserBasico {
  id?: number | string;
  nome?: string;
  name?: string;
}

interface CombatIntent {
  tipo?: string;
  [key: string]: unknown;
}

export const useMessageInput = (
  historia: BasicEntity | null | undefined,
  personagemSelecionado: PersonagemBasico | null | undefined,
  user: UserBasico | null | undefined,
  _onAdicionarMensagem: (msg: unknown) => void,
  faseJogo: string | null | undefined,
  ehMeuTurno: boolean,
  cooldownLocal: number,
  setCooldownLocal: (n: number) => void,
  combateAtivo: boolean = false,
) => {
  const [mensagemAtual, setMensagemAtual] = useState('');
  const [combatIntentAtual, setCombatIntentAtual] = useState<CombatIntent | null>(null);
  const combatIntentRef = useRef<CombatIntent | null>(null);
  const enviandoRef = useRef(false);

  const socketStoreSafeEmit = useSocketStore((s) => s.safeEmit);

  const buildPersonagemPayload = useCallback(() => ({
    id: personagemSelecionado?.id ?? personagemSelecionado?.personagemId ?? personagemSelecionado?.personagem_id ?? null,
    personagemId: personagemSelecionado?.personagemId ?? personagemSelecionado?.personagem_id ?? personagemSelecionado?.id ?? null,
    nome: personagemSelecionado?.nome || 'Aventureiro',
    classe: personagemSelecionado?.classe_nome || '',
    nivel: personagemSelecionado?.nivel || 1
  }), [personagemSelecionado]);

  const setCombatIntent = useCallback((intent: CombatIntent | null | undefined) => {
    combatIntentRef.current = intent || null;
    setCombatIntentAtual(intent || null);
  }, []);

  const clearCombatIntent = useCallback(() => {
    combatIntentRef.current = null;
    setCombatIntentAtual(null);
  }, []);

  useEffect(() => {
    if (!combateAtivo) {
      clearCombatIntent();
    }
  }, [combateAtivo, clearCombatIntent]);

  const handleMensagemChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>, intent?: CombatIntent | null) => {
    setMensagemAtual(e.target.value);
    if (intent !== undefined) {
      setCombatIntent(intent);
    }
  }, [setCombatIntent]);

  const handleEnviarMensagem = useCallback(async () => {
    if (!mensagemAtual.trim()) return;
    if (enviandoRef.current) return;

    try {
      enviandoRef.current = true;

      const roomId = `historia_${historia?.id}`;
      const ehMensagemRoleplay = faseJogo === 'rodada_em_andamento' && !ehMeuTurno;

      if (ehMensagemRoleplay) {
        if (cooldownLocal > 0) {
          showGameNotification(`Aguarde ${cooldownLocal}s para enviar outra mensagem roleplay`, 'warning');
          return;
        }

        const enviado = socketStoreSafeEmit('mensagem_roleplay', {
          roomId,
          userId: String(user?.id),
          username: user?.nome || user?.name,
          mensagem: mensagemAtual
        });

        if (enviado) {
          setCooldownLocal(ROLEPLAY_COOLDOWN_SECONDS);
          setMensagemAtual('');
          clearCombatIntent();
        }
        return;
      }

      const requestId = crypto.randomUUID();
      const storeBeforeSend = useSocketStore.getState();
      const activeStatus = storeBeforeSend.activeMestreRequestStatus;
      if (storeBeforeSend.pendingMestreRequestId || (activeStatus && !['completed', 'failed', 'timed_out', 'superseded'].includes(activeStatus))) {
        showGameNotification('Ja existe uma resposta do Mestre em andamento nesta sala. Aguarde a conclusao ou verifique o status.', 'warning');
        return;
      }

      const payload: Record<string, unknown> = {
        roomId,
        userId: String(user?.id),
        username: user?.nome || user?.name,
        mensagem: mensagemAtual,
        personagem: buildPersonagemPayload(),
        requestId
      };

      if (combatIntentRef.current) {
        payload.combatIntent = combatIntentRef.current;
      }

      const enviado = socketStoreSafeEmit('mensagem_para_mestre', payload);
      if (!enviado) {
        showGameNotification('Falha ao enviar mensagem. Verifique sua conexao.', 'error');
        return;
      }

      setMensagemAtual('');
      clearCombatIntent();
      useSocketStore.setState({
        mestreTimedOut: false,
        mestreStale: false,
        pendingMestreRequestId: requestId,
        pendingMestreRequestKind: 'player_action',
        pendingMestreSentAt: new Date().toISOString()
      });
    } catch {
      // silenced
    } finally {
      setTimeout(() => {
        enviandoRef.current = false;
      }, TIMEOUTS.FLAG_RESET_DELAY);
    }
  }, [mensagemAtual, historia?.id, user, faseJogo, ehMeuTurno, cooldownLocal, setCooldownLocal, socketStoreSafeEmit, buildPersonagemPayload, clearCombatIntent]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviarMensagem();
    }
  }, [handleEnviarMensagem]);

  return {
    mensagemAtual,
    combatIntentAtual,
    setCombatIntent,
    clearCombatIntent,
    handleMensagemChange,
    handleKeyPress,
    handleEnviarMensagem
  };
};
