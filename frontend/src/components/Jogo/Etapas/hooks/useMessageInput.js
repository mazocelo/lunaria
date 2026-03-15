import { useState, useRef, useCallback } from 'react';
import { showGameNotification } from '../../NotificationManager';
import { useSocketStore, useGameStore } from '../../../../store/index.js';
import { TIMEOUTS, ROLEPLAY_COOLDOWN_SECONDS } from '../../../../constants/game';

export const useMessageInput = (historia, personagemSelecionado, user, onAdicionarMensagem, faseJogo, ehMeuTurno, cooldownLocal, setCooldownLocal) => {
  const [mensagemAtual, setMensagemAtual] = useState('');
  const combatIntentRef = useRef(null);
  const enviandoRef = useRef(false);

  const socketStoreSafeEmit = useSocketStore(s => s.safeEmit);
  const gameStoreSetMensagens = useGameStore(s => s.setMensagens);

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
      } else {
        const loadingMsg = {
          id: `loading_${Date.now()}`,
          userId: 'sistema',
          username: 'Sistema',
          message: '⏳ O Mestre esta pensando...',
          tipo: 'loading',
          timestamp: Date.now()
        };
        onAdicionarMensagem(loadingMsg);

        const payload = {
          roomId,
          userId: String(user?.id),
          username: user?.nome || user?.name,
          mensagem: mensagemAtual,
          personagem: buildPersonagemPayload()
        };
        if (combatIntentRef.current) {
          payload.combatIntent = combatIntentRef.current;
        }
        const enviado = socketStoreSafeEmit('mensagem_para_mestre', payload);

        if (enviado) {
          setMensagemAtual('');
          combatIntentRef.current = null;
          // Sinalizar que estamos aguardando resposta do Mestre
          useSocketStore.setState({ aguardandoRespostaMestre: true });
          // Safety timeout: limpar flag após 60s caso resposta nunca chegue
          setTimeout(() => {
            if (useSocketStore.getState().aguardandoRespostaMestre) {
              useSocketStore.setState({ aguardandoRespostaMestre: false });
            }
          }, 60000);
        } else {
          showGameNotification('Falha ao enviar mensagem. Verifique sua conexao.', 'error');
          const msgs = useGameStore.getState().mensagens || [];
          const semLoading = msgs.filter(m => m.tipo !== 'loading');
          if (msgs.length !== semLoading.length) gameStoreSetMensagens(semLoading);
        }
      }
    } catch (error) {
      // silenced
    } finally {
      setTimeout(() => {
        enviandoRef.current = false;
      }, TIMEOUTS.FLAG_RESET_DELAY);
    }
  }, [mensagemAtual, historia?.id, user, faseJogo, ehMeuTurno, cooldownLocal, setCooldownLocal, socketStoreSafeEmit, onAdicionarMensagem, gameStoreSetMensagens, buildPersonagemPayload]);

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
    handleEnviarMensagem,
  };
};
