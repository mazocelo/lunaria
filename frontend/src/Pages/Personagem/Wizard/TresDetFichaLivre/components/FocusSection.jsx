// components/FocusSection.jsx
import { Lock } from 'lucide-react';

const FOCUS_FALLBACK = [
  { nome: 'fogo', label: 'Fogo', emoji: '🔥' },
  { nome: 'agua', label: 'Agua', emoji: '💧' },
  { nome: 'terra', label: 'Terra', emoji: '🍃' },
  { nome: 'ar', label: 'Ar', emoji: '🌀' },
  { nome: 'luz', label: 'Luz', emoji: '☀️' },
  { nome: 'trevas', label: 'Trevas', emoji: '🌑' },
];

const ELEMENT_COLORS = {
  fogo:   { border: 'rgba(239, 68, 68, 0.4)',  text: '#ef4444' },
  agua:   { border: 'rgba(59, 130, 246, 0.4)',  text: '#3b82f6' },
  terra:  { border: 'rgba(34, 197, 94, 0.4)',   text: '#22c55e' },
  ar:     { border: 'rgba(168, 162, 158, 0.4)', text: '#a8a29e' },
  luz:    { border: 'rgba(250, 204, 21, 0.4)',  text: '#facc15' },
  trevas: { border: 'rgba(147, 51, 234, 0.4)',  text: '#9333ea' },
};

export default function FocusSection({ focus, setFocusNivel, pontosFocus, pontosRestantes, temMagia, maxAttr = 3, focusCatalogo }) {
  const focusConfig = (focusCatalogo?.length > 0 ? focusCatalogo : FOCUS_FALLBACK)
    .map(f => ({ key: f.nome, label: f.label, emoji: f.emoji, descricao: f.descricao }));

  return (
    <section
      className={`relative rounded-2xl border p-5 backdrop-blur-[18px] ${!temMagia ? 'opacity-40 pointer-events-none' : ''}`}
      style={{ background: 'var(--wa-panel)', borderColor: 'var(--wa-border)' }}
    >
      {!temMagia && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold"
            style={{
              background: 'var(--wa-panel-strong)',
              borderColor: 'var(--wa-border)',
              color: 'var(--wa-muted)',
            }}
          >
            <Lock size={14} /> Compre uma vantagem de Magia para desbloquear
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-fantasy text-sm font-bold uppercase tracking-wider" style={{ color: '#38bdf8' }}>
          Focus Elementais
        </h3>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-md"
          style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8' }}
        >
          {pontosFocus} pts
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 max-[768px]:grid-cols-2">
        {focusConfig.map(fc => {
          const val = focus[fc.key];
          const hasPoints = val > 0;
          const canInc = val < maxAttr && pontosRestantes > 0;
          const elColor = ELEMENT_COLORS[fc.key] || { border: 'var(--wa-border)', text: 'var(--wa-ink)' };

          return (
            <div
              key={fc.key}
              className="rounded-xl border p-4 text-center transition-all duration-200"
              style={{
                background: 'var(--wa-panel-soft)',
                borderColor: hasPoints ? elColor.border : 'var(--wa-border)',
              }}
            >
              <div
                className="text-3xl mb-1"
                style={hasPoints ? { textShadow: `0 0 8px ${elColor.border}` } : undefined}
              >
                {fc.emoji}
              </div>
              <div
                className="font-fantasy text-xs uppercase tracking-wider mb-2"
                style={{ color: hasPoints ? elColor.text : 'var(--wa-muted)' }}
              >
                {fc.label}
              </div>
              <div
                className="font-fantasy text-2xl font-extrabold mb-2"
                style={{ color: hasPoints ? elColor.text : 'var(--wa-muted)' }}
              >
                {val}
              </div>
              <div className="flex justify-center gap-2">
                <button
                  disabled={val <= 0}
                  onClick={() => setFocusNivel(fc.key, val - 1)}
                  className="w-7 h-7 rounded-lg border text-sm font-bold flex items-center justify-center cursor-pointer transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    borderColor: 'var(--wa-border)',
                    color: hasPoints ? elColor.text : 'var(--wa-muted)',
                  }}
                  onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = `${elColor.border}`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  -
                </button>
                <button
                  disabled={!canInc}
                  onClick={() => setFocusNivel(fc.key, val + 1)}
                  className="w-7 h-7 rounded-lg border text-sm font-bold flex items-center justify-center cursor-pointer transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    borderColor: 'var(--wa-border)',
                    color: hasPoints ? elColor.text : 'var(--wa-muted)',
                  }}
                  onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = `${elColor.border}`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
