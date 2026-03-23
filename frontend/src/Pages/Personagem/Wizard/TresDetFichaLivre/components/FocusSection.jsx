// components/FocusSection.jsx
import { useTheme } from '../../../../../contexts/theme.jsx';

const FOCUS_FALLBACK = [
  { nome: 'fogo', label: 'Fogo', emoji: '🔥' },
  { nome: 'agua', label: 'Agua', emoji: '💧' },
  { nome: 'terra', label: 'Terra', emoji: '🍃' },
  { nome: 'ar', label: 'Ar', emoji: '🌀' },
  { nome: 'luz', label: 'Luz', emoji: '☀️' },
  { nome: 'trevas', label: 'Trevas', emoji: '🌑' },
];

const ELEMENT_COLORS = {
  fogo:   { border: '#f97316', glow: 'rgba(249,115,22,0.35)', bg: 'rgba(124,45,18,0.20)',  bgLight: 'rgba(249,115,22,0.08)', text: '#fb923c', textLight: '#c2410c' },
  agua:   { border: '#3b82f6', glow: 'rgba(59,130,246,0.35)',  bg: 'rgba(30,58,138,0.20)',  bgLight: 'rgba(59,130,246,0.08)', text: '#60a5fa', textLight: '#1d4ed8' },
  terra:  { border: '#10b981', glow: 'rgba(16,185,129,0.35)',  bg: 'rgba(6,78,59,0.20)',    bgLight: 'rgba(16,185,129,0.08)', text: '#34d399', textLight: '#047857' },
  ar:     { border: '#38bdf8', glow: 'rgba(56,189,248,0.35)',  bg: 'rgba(12,74,110,0.20)',  bgLight: 'rgba(56,189,248,0.08)', text: '#7dd3fc', textLight: '#0284c7' },
  luz:    { border: '#fbbf24', glow: 'rgba(251,191,36,0.35)',  bg: 'rgba(120,53,15,0.20)',  bgLight: 'rgba(251,191,36,0.08)', text: '#fcd34d', textLight: '#b45309' },
  trevas: { border: '#a855f7', glow: 'rgba(168,85,247,0.35)',  bg: 'rgba(88,28,135,0.20)',  bgLight: 'rgba(168,85,247,0.08)', text: '#c084fc', textLight: '#7e22ce' },
};

const STAGGER = ['wa-stagger-1', 'wa-stagger-2', 'wa-stagger-3', 'wa-stagger-4', 'wa-stagger-5', 'wa-stagger-6'];

export default function FocusSection({ focus, setFocusNivel, pontosFocus, pontosRestantes, maxAttr = 3, focusCatalogo }) {
  const focusConfig = (focusCatalogo?.length > 0 ? focusCatalogo : FOCUS_FALLBACK)
    .map(f => ({ key: f.nome, label: f.label, emoji: f.emoji, descricao: f.descricao }));
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <section
      className="relative rounded-2xl p-3 backdrop-blur-[18px]"
      style={{
        background: isLight
          ? 'linear-gradient(180deg, rgba(255,253,255,0.92), rgba(232,228,245,0.70))'
          : 'linear-gradient(180deg, var(--wa-panel-strong), var(--wa-panel))',
        border: '1px solid var(--wa-border)',
        boxShadow: 'var(--wa-glow)',
      }}
    >

      <div className="flex items-center justify-between mb-1">
        <h3
          className="font-fantasy text-base font-bold uppercase tracking-widest"
          style={{ color: 'var(--wa-teal)' }}
        >
          Focus Elementais
        </h3>
        <span className="wa-teal-chip text-xs font-semibold px-2.5 py-1 rounded-lg">
          {pontosFocus} pts
        </span>
      </div>

      {/* decorative line */}
      <div
        className="mb-2 rounded-full"
        style={{
          height: 2,
          width: 48,
          background: 'linear-gradient(90deg, var(--wa-teal), transparent)',
          opacity: 0.5,
        }}
      />

      <div
        className="grid grid-cols-3 gap-3 max-[768px]:grid-cols-2"
        style={!temMagia ? { opacity: 0.35, pointerEvents: 'none' } : undefined}
      >
        {focusConfig.map((fc, i) => {
          const val = focus[fc.key];
          const hasPoints = val > 0;
          const canInc = val < maxAttr && pontosRestantes > 0;
          const colors = ELEMENT_COLORS[fc.key] || ELEMENT_COLORS.trevas;

          return (
            <div
              key={fc.key}
              className={`wa-stage-enter ${STAGGER[i]} rounded-xl p-2.5 text-center transition-all duration-200`}
              style={{
                background: hasPoints
                  ? isLight ? colors.bgLight : colors.bg
                  : 'var(--wa-panel-soft)',
                border: `1px solid ${hasPoints ? colors.border : 'var(--wa-border)'}`,
                boxShadow: hasPoints
                  ? `inset 0 0 18px ${colors.glow.replace('0.35', '0.08')}, 0 0 12px ${colors.glow.replace('0.35', '0.10')}`
                  : 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = colors.border;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = hasPoints ? colors.border : 'var(--wa-border)';
              }}
            >
              <div className="text-xl mb-1">{fc.emoji}</div>

              <div
                className="font-modern text-[10px] font-bold uppercase tracking-widest mb-1 transition-colors duration-200"
                style={{
                  color: hasPoints
                    ? isLight ? colors.textLight : colors.text
                    : 'var(--wa-muted)',
                }}
              >
                {fc.label}
              </div>

              <div
                className="font-fantasy text-2xl font-extrabold mb-1 transition-all duration-200"
                style={{
                  color: hasPoints
                    ? isLight ? colors.textLight : colors.text
                    : 'var(--wa-muted)',
                  textShadow: hasPoints
                    ? `0 0 14px ${colors.glow}, 0 0 28px ${colors.glow.replace('0.35', '0.12')}`
                    : 'none',
                }}
              >
                {val}
              </div>

              <div className="flex justify-center gap-2">
                <button
                  disabled={val <= 0}
                  onClick={() => setFocusNivel(fc.key, val - 1)}
                  className="w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center cursor-pointer transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
                  style={{
                    background: 'transparent',
                    color: colors.border,
                    border: `1px solid ${colors.border}`,
                    opacity: val <= 0 ? 0.2 : 1,
                  }}
                  onMouseEnter={e => {
                    if (val > 0) {
                      e.currentTarget.style.background = colors.border;
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = colors.border;
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >-</button>
                <button
                  disabled={!canInc}
                  onClick={() => setFocusNivel(fc.key, val + 1)}
                  className="w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center cursor-pointer transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
                  style={{
                    background: 'transparent',
                    color: colors.border,
                    border: `1px solid ${colors.border}`,
                    opacity: !canInc ? 0.2 : 1,
                  }}
                  onMouseEnter={e => {
                    if (canInc) {
                      e.currentTarget.style.background = colors.border;
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = colors.border;
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >+</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
