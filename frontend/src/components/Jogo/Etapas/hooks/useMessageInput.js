import { useState, useRef, useCallback } from 'react';
import { showGameNotification } from '../../NotificationManager';
import { useSocketStore } from '../../../../store/index.js';
import { TIMEOUTS, ROLEPLAY_COOLDOWN_SECONDS } from '../../../../constants/game';

export const useMessageInput = (historia, personagemSelecionado, user, onAdicionarMensagem, faseJogo, ehMeuTurno, cooldownLocal, setCooldownLocal) => {
  const [mensagemAtual, setMensagemAtual] = useState('');
  const combatIntentRef = useRef(null);
  const enviandoRef = useRef(false);

  const socketStoreSafeEmit = useSocketStore((s) => s.safeEmit);

  const buildPersonagemPayload = useCallback(() => ({
    id: personagemSelecionado?.id ?? personagemSelecionado?.personagemId ?? personagemSelecionado?.personagem_id ?? null,
    personagemId: personagemSelecionado?.personagemId ?? personagemSelecionado?.personagem_id ?? personagemSelecionado?.id ?? null,
    nome: personagemSelecionado?.nome || 'Aventureiro',
    classe: personagemSelecionado?.classe_nome || '',
    nivel: personagemSelecionado?.nivel || 1
  }), [personagemSelecionado]);

  const handleMensagemChange = useCallback((e, intent = null) => {
    setMensagemAtual(e.target.value);
    combatIntentRef.current = intent || null;
  }, []);

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
        }
        return;
      }

      const requestId = crypto.randomUUID();
      const payload = {
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
      combatIntentRef.current = null;
      useSocketStore.setState({
        aguardandoRespostaMestre: true,
        mestrePensando: true,
        mestreTimedOut: false,
        mestreStale: false,
        activeMestreRequestId: requestId,
        activeMestreRequestStatus: 'accepted',
        activeMestreRequestAttempt: 1,
        activeMestrePlayerMessageId: null,
        activeMestreUpdatedAt: new Date().toISOString()
      });
    } catch (error) {
      // silenced
    } finally {
      setTimeout(() => {
        enviandoRef.current = false;
      }, TIMEOUTS.FLAG_RESET_DELAY);
    }
  }, [mensagemAtual, historia?.id, user, faseJogo, ehMeuTurno, cooldownLocal, setCooldownLocal, socketStoreSafeEmit, buildPersonagemPayload]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviarMensagem();
    }
  }, [handleEnviarMensagem]);

  return {
    mensagemAtual,
    handleMensagemChange,
    handleKeyPress,
    handleEnviarMensagem
  };
};
