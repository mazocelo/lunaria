// components/MestrePanelLateral.jsx
import { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';

export default function MestrePanelLateral({ aberto, onToggle, mensagens, enviando, enviarMensagem, onSugestaoClick }) {
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensagens]);

  const handleEnviar = () => {
    if (!input.trim()) return;
    enviarMensagem(input);
    setInput('');
  };

  if (!aberto) return null;

  return (
    <div
      className="w-[380px] max-[768px]:fixed max-[768px]:inset-y-0 max-[768px]:right-0 max-[768px]:w-[85vw] max-[768px]:z-50 border-l flex flex-col backdrop-blur-[24px]"
      style={{
        background: 'var(--wa-panel-strong)',
        borderColor: 'var(--wa-border)',
        boxShadow: 'var(--wa-shadow)',
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
        <span
          className="font-fantasy text-sm font-bold"
          style={{ color: 'var(--wa-accent-bright)' }}
        >
          Mestre Criador
        </span>
        <button
          onClick={onToggle}
          className="wa-mestre-close cursor-pointer p-1 transition-colors"
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
                style={{ background: 'var(--wa-accent)' }}
              >
                {msg.content}
              </div>
            ) : msg.role === 'sistema' ? (
              <div
                className="rounded-xl px-4 py-3 font-modern text-sm max-w-[90%]"
                style={{
                  background: 'var(--wa-panel-soft)',
                  color: 'var(--wa-muted)',
                }}
              >
                {msg.content}
              </div>
            ) : (
              <div
                className="rounded-xl px-4 py-3 font-modern text-sm max-w-[90%] border"
                style={{
                  background: 'var(--wa-panel-soft)',
                  borderColor: 'var(--wa-border)',
                  color: 'var(--wa-ink)',
                }}
              >
                {msg.content}
              </div>
            )}

            {msg.sugestoes?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
                {msg.sugestoes.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onSugestaoClick(s)}
                    className="wa-sugestao-btn px-3 py-1.5 rounded-lg font-modern text-xs font-semibold cursor-pointer border transition-all"
                    style={{
                      background: 'color-mix(in srgb, var(--wa-ember) 15%, transparent)',
                      color: 'var(--wa-ember)',
                      borderColor: 'color-mix(in srgb, var(--wa-ember) 30%, transparent)',
                    }}
                  >
                    + {s.nome} ({s.custo || 0}pt)
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
          className="wa-mestre-input flex-1 rounded-lg border px-3 py-2 font-modern text-sm outline-none transition-colors"
          style={{
            background: 'var(--wa-panel-soft)',
            borderColor: 'var(--wa-border)',
            color: 'var(--wa-ink)',
          }}
        />
        <button
          disabled={enviando || !input.trim()}
          onClick={handleEnviar}
          className="px-4 py-2 rounded-lg text-white text-sm font-semibold cursor-pointer disabled:opacity-40 transition-colors"
          style={{ background: 'var(--wa-accent)' }}
        >
          <Send size={14} />
        </button>
      </div>

      <style>{`
        .wa-mestre-close:hover { color: var(--wa-ink) !important; }
        .wa-mestre-input::placeholder { color: var(--wa-muted); }
        .wa-mestre-input:focus { border-color: var(--wa-accent) !important; }
        .wa-sugestao-btn:hover {
          background: color-mix(in srgb, var(--wa-ember) 25%, transparent) !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
