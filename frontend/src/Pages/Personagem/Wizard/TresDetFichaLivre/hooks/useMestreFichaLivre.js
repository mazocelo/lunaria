// hooks/useMestreFichaLivre.js
import { useState, useCallback, useRef } from 'react';
import { mestreCriadorService } from '../../../../../services/index.js';

export function useMestreFichaLivre({ getEstado }) {
  const [mensagens, setMensagens] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const enviandoRef = useRef(false);

  const enviarMensagem = useCallback(async (texto) => {
    if (!texto?.trim() || enviandoRef.current) return;

    const msg = texto.trim();
    setMensagens(prev => [...prev, { id: Date.now(), role: 'jogador', content: msg, timestamp: new Date() }]);
    enviandoRef.current = true;
    setEnviando(true);

    try {
      const resultado = await mestreCriadorService.interagir({
        etapa: 'vantagens',
        estado: getEstado(),
        mensagemJogador: msg,
        historico: mensagens.filter(m => m.role !== 'sistema').map(m => ({ role: m.role === 'jogador' ? 'user' : 'assistant', content: m.content })),
        actionMode: 'reply',
        sistema: 'tresdet',
      });

      setMensagens(prev => [...prev, {
        id: Date.now() + 1,
        role: 'mestre',
        content: resultado.mensagem,
        sugestoes: resultado.sugestoes,
        timestamp: new Date(),
      }]);
    } catch {
      setMensagens(prev => [...prev, {
        id: Date.now() + 1,
        role: 'sistema',
        content: 'Nao foi possivel contatar o Mestre. Tente novamente.',
        timestamp: new Date(),
      }]);
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }, [mensagens, getEstado]);

  return { mensagens, enviando, enviarMensagem };
}
