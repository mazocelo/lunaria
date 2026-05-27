import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles } from 'lucide-react';

interface Mensagem {
  id?: number | string;
  role?: string;
  content?: string;
  sugestoes?: Array<{ nome?: string; descricao?: string; [key: string]: unknown }>;
  timestamp?: Date;
}

interface MestrePanelLateralProps {
  aberto: boolean;
  onToggle: () => void;
  mensagens: Mensagem[];
  enviando: boolean;
  enviarMensagem: (texto: string) => void;
  onSugestaoClick?: (s: { nome?: string; [key: string]: unknown }) => void;
}

export default function MestrePanelLateral({ aberto, onToggle, mensagens, enviando, enviarMensagem, onSugestaoClick }: MestrePanelLateralProps) {
  const [input, setInput] = useState('');
  const [visible, setVisible] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensagens]);

  useEffect(() => {
    if (aberto) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [aberto]);

  const handleEnviar = () => {
    if (!input.trim()) return;
    enviarMensagem(input);
    setInput('');
  };

  if (!aberto) return null;

  return (
    <div
      className="wa-mestre-panel w-[380px] max-[768px]:fixed max-[768px]:inset-y-0 max-[768px]:right-0 max-[768px]:w-[85vw] max-[768px]:z-50 border-l flex flex-col backdrop-blur-[24px] transition-all duration-300 ease-out"
      style={{
        background: 'linear-gradient(180deg, color-mix(in srgb, var(--wa-panel-strong) 95%, transparent), color-mix(in srgb, var(--wa-panel) 92%, transparent))',
        borderColor: 'var(--wa-border)',
        boxShadow: 'var(--wa-glow), var(--wa-shadow)',
        borderLeft: '2px solid color-mix(in srgb, var(--wa-accent) 40%, var(--wa-border))',
        transform: visible ? 'translateX(0)' : 'translateX(16px)',
        opacity: visible ? 1 : 0,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{
          background: 'var(--wa-panel-strong)',
          borderColor: 'var(--wa-border)',
        }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: 'var(--wa-forge-gold)' }} />
          <span
            className="font-fantasy text-sm font-bold uppercase tracking-wider"
            style={{ color: 'var(--wa-accent-bright)' }}
          >
            Mestre Criador
          </span>
        </div>
        <button
          onClick={onToggle}
          className="wa-mestre-close cursor-pointer p-1.5 rounded-lg transition-all duration-200"
          style={{ color: 'var(--wa-muted)' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mensagens.map(msg => (
          <div key={msg.id}>
            {msg.role === 'jogador' ? (
              <div
                className="rounded-xl px-4 py-3 font-modern text-sm max-w-[90%] ml-auto text-white"
                style={{
                  background: 'linear-gradient(135deg, var(--wa-accent), color-mix(in srgb, var(--wa-accent) 75%, var(--wa-teal)))',
                }}
              >
                {msg.content}
              </div>
            ) : msg.role === 'sistema' ? (
              <div
                className="rounded-xl px-4 py-3 font-modern text-xs max-w-[90%] italic"
                style={{
                  background: 'var(--wa-panel-soft)',
                  color: 'var(--wa-muted)',
                }}
              >
                {msg.content}
              </div>
            ) : (
              <div
                className="rounded-xl px-4 py-3 font-modern text-sm max-w-[90%] border-l-2"
                style={{
                  background: 'var(--wa-panel-soft)',
                  borderLeftColor: 'color-mix(in srgb, var(--wa-accent) 50%, transparent)',
                  borderColor: 'var(--wa-border)',
                  color: 'var(--wa-ink)',
                }}
              >
                {msg.content}
              </div>
            )}

            {(msg.sugestoes?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
                {msg.sugestoes!.map((s, i: number) => (
                  <button
                    key={i}
                    onClick={() => onSugestaoClick?.(s)}
                    className="wa-sugestao-btn wa-forge-chip px-3 py-1.5 rounded-lg font-modern text-xs font-semibold cursor-pointer border transition-all duration-200"
                  >
                    + {s.nome} ({String(s.custo ?? 0)}pt)
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input area */}
      <div
        className="p-3 border-t flex gap-2"
        style={{ borderColor: 'var(--wa-border)' }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleEnviar()}
          placeholder="Peca ajuda ao Mestre..."
          className="wa-mestre-input flex-1 rounded-xl border px-3 py-2.5 font-modern text-sm outline-none transition-all duration-200 backdrop-blur-[18px]"
          style={{
            background: 'var(--wa-panel-soft)',
            borderColor: 'var(--wa-border)',
            color: 'var(--wa-ink)',
          }}
        />
        <button
          disabled={enviando || !input.trim()}
          onClick={handleEnviar}
          className="wa-mestre-send px-4 py-2.5 rounded-xl text-white text-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, var(--wa-accent), var(--wa-teal))',
          }}
        >
          <Send size={14} />
        </button>
      </div>

      <style>{`
        .wa-mestre-close:hover {
          color: var(--wa-ink) !important;
          background: var(--wa-panel-soft);
        }
        .wa-mestre-input::placeholder { color: var(--wa-muted); }
        .wa-mestre-input:focus {
          border-color: var(--wa-accent) !important;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
        }
        .wa-sugestao-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 12px rgba(232, 180, 72, 0.25);
        }
        .wa-mestre-send:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
        }
      `}</style>
    </div>
  );
}
