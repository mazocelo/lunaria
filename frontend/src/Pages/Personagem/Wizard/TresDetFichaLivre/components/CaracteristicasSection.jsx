// components/CaracteristicasSection.jsx
import { useTheme } from '../../../../../contexts/theme.jsx';

const ATTRS = [
  { key: 'F', label: 'Forca', sigla: 'F' },
  { key: 'H', label: 'Habilidade', sigla: 'H' },
  { key: 'R', label: 'Resistencia', sigla: 'R' },
  { key: 'A', label: 'Armadura', sigla: 'A' },
  { key: 'PdF', label: 'Poder de Fogo', sigla: 'PdF' },
];

const STAGGER = ['wa-stagger-1', 'wa-stagger-2', 'wa-stagger-3', 'wa-stagger-4', 'wa-stagger-5'];

export default function CaracteristicasSection({
  caracteristicas, setCaracteristica, pontosCaracteristicas,
  pontosRestantes, pv, pm, temMagia, maxAttr = 3,
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <section
      className="wa-panel wa-etched relative rounded-2xl p-5 backdrop-blur-[18px]"
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
          style={{ color: 'var(--wa-accent-bright)' }}
        >
          Caracteristicas
        </h3>
        <span
          className="wa-forge-chip text-xs font-semibold px-2.5 py-1 rounded-lg"
        >
          {pontosCaracteristicas} pts
        </span>
      </div>

      {/* decorative line */}
      <div
        className="mb-4 rounded-full"
        style={{
          height: 2,
          width: 48,
          background: 'linear-gradient(90deg, var(--wa-accent), transparent)',
          opacity: 0.5,
        }}
      />

      <div className="grid grid-cols-5 gap-3 max-[768px]:grid-cols-3">
        {ATTRS.map((attr, i) => {
          const val = caracteristicas[attr.key];
          const active = val > 0;
          const canInc = val < maxAttr && pontosRestantes > 0;
          const canDec = val > 0;

          return (
            <div
              key={attr.key}
              className={`wa-stage-enter ${STAGGER[i]} rounded-xl p-4 text-center transition-all duration-200`}
              style={{
                background: active
                  ? isLight
                    ? 'linear-gradient(180deg, rgba(139,92,246,0.08), rgba(139,92,246,0.02))'
                    : 'linear-gradient(180deg, rgba(139,92,246,0.12), rgba(139,92,246,0.04))'
                  : 'var(--wa-panel-soft)',
                border: `1px solid ${active ? 'color-mix(in srgb, var(--wa-accent) 40%, var(--wa-border))' : 'var(--wa-border)'}`,
                boxShadow: active
                  ? 'inset 0 0 18px rgba(139,92,246,0.08), 0 0 12px rgba(139,92,246,0.06)'
                  : 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'var(--wa-accent)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = active
                  ? 'color-mix(in srgb, var(--wa-accent) 40%, var(--wa-border))'
                  : 'var(--wa-border)';
              }}
            >
              <div
                className="font-modern text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: 'var(--wa-muted)' }}
              >
                {attr.label}
              </div>

              <div
                className="font-fantasy text-4xl font-extrabold mb-2 transition-all duration-200"
                style={{
                  color: active ? 'var(--wa-ink)' : 'var(--wa-muted)',
                  textShadow: active
                    ? '0 0 16px rgba(139,92,246,0.45), 0 0 32px rgba(139,92,246,0.15)'
                    : 'none',
                }}
              >
                {val}
              </div>

              <div className="flex justify-center gap-2">
                <button
                  disabled={!canDec}
                  onClick={() => setCaracteristica(attr.key, val - 1)}
                  className="w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center cursor-pointer transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
                  style={{
                    background: 'transparent',
                    color: 'var(--wa-accent)',
                    border: '1px solid var(--wa-accent)',
                    backgroundImage: 'linear-gradient(180deg, rgba(139,92,246,0.08), rgba(139,92,246,0.02))',
                  }}
                  onMouseEnter={e => {
                    if (canDec) {
                      e.currentTarget.style.background = 'var(--wa-accent)';
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.backgroundImage = 'linear-gradient(180deg, rgba(139,92,246,0.08), rgba(139,92,246,0.02))';
                    e.currentTarget.style.color = 'var(--wa-accent)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >-</button>
                <button
                  disabled={!canInc}
                  onClick={() => setCaracteristica(attr.key, val + 1)}
                  className="w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center cursor-pointer transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
                  style={{
                    background: 'transparent',
                    color: 'var(--wa-accent)',
                    border: '1px solid var(--wa-accent)',
                    backgroundImage: 'linear-gradient(180deg, rgba(139,92,246,0.08), rgba(139,92,246,0.02))',
                  }}
                  onMouseEnter={e => {
                    if (canInc) {
                      e.currentTarget.style.background = 'var(--wa-accent)';
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.backgroundImage = 'linear-gradient(180deg, rgba(139,92,246,0.08), rgba(139,92,246,0.02))';
                    e.currentTarget.style.color = 'var(--wa-accent)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >+</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 mt-4">
        {/* PV badge — teal */}
        <div
          className="wa-teal-chip flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-modern font-semibold backdrop-blur-[12px]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          PV: <strong>{pv}</strong>
        </div>

        {/* PM badge — violet */}
        <div
          className="wa-violet-chip flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-modern font-semibold backdrop-blur-[12px]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          PM: <strong>{pm}</strong>
          {!temMagia && <span className="ml-1 opacity-50">(sem magia)</span>}
        </div>
      </div>
    </section>
  );
}
