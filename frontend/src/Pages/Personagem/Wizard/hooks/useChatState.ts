import { useState, useEffect, useRef } from 'react';

export interface WizardMessage {
  id?: string | number;
  origem?: string;
  texto?: string;
  role?: string;
  content?: string;
  etapa?: string;
  timestamp?: Date | string | number;
  sugestoes?: unknown[];
  [key: string]: unknown;
}

export interface WizardSuggestion {
  id?: string | number;
  nome?: string;
  [key: string]: unknown;
}

export const useChatState = () => {
  const [mensagens, setMensagens] = useState<WizardMessage[]>([]);
  const [inputTexto, setInputTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const enviandoRef = useRef(false);
  const [sugestoes, setSugestoes] = useState<WizardSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

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

export type ChatStateApi = ReturnType<typeof useChatState>;
