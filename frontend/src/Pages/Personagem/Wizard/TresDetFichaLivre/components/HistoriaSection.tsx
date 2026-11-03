import { useState } from 'react';

interface HistoriaSectionProps {
  historia: string;
  setHistoria: (v: string) => void;
}

export default function HistoriaSection({ historia, setHistoria }: HistoriaSectionProps) {
  const [charCount, setCharCount] = useState(historia?.length || 0);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHistoria(e.target.value);
    setCharCount(e.target.value.length);
  };

  return (
    <section
      className="wa-panel rounded-2xl border p-3 backdrop-blur-[18px] wa-stage-enter wa-stagger-3"
      style={{
        background: 'var(--wa-panel)',
        borderColor: 'var(--wa-border)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3
          className="font-fantasy text-base font-bold uppercase tracking-wider"
          style={{ color: 'var(--wa-accent-bright)' }}
        >
          Historia & Background
        </h3>
        <span
          className="font-modern text-xs tabular-nums"
          style={{ color: 'var(--wa-muted)' }}
        >
          {charCount} caracteres
        </span>
      </div>

      <textarea
        value={historia}
        onChange={handleChange}
        placeholder="Descreva a historia, motivacoes e personalidade do personagem..."
        className="wa-historia-textarea w-full min-h-[70px] rounded-xl border p-3 font-modern text-sm resize-y outline-none transition-all duration-200 backdrop-blur-[18px]"
        style={{
          background: 'var(--wa-panel-soft)',
          borderColor: 'var(--wa-border)',
          color: 'var(--wa-ink)',
        }}
      />

      <style>{`
        .wa-historia-textarea::placeholder { color: var(--wa-muted); }
        .wa-historia-textarea:focus {
          border-color: var(--wa-accent) !important;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15), 0 0 16px rgba(139, 92, 246, 0.08);
        }
      `}</style>
    </section>
  );
}
