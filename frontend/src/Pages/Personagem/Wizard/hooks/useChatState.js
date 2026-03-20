
import { useState, useEffect, useRef } from 'react';

export const useChatState = () => {
  const [mensagens, setMensagens] = useState([]);
  const [inputTexto, setInputTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const enviandoRef = useRef(false);
  const [sugestoes, setSugestoes] = useState([]);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  return {
    mensagens, setMensagens,
    inputTexto, setInputTexto,
    enviando, setEnviando, enviandoRef,
    sugestoes, setSugestoes,
    error, setError, clearError: () => setError(null),
    chatEndRef,
  };
};
