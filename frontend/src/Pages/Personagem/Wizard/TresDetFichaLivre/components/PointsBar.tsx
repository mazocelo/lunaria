import { useTheme } from '../../../../../contexts/theme';

interface NivelDef { id: string; label: string; pts: number; }

const NIVEIS: NivelDef[] = [
  { id: 'novato', label: 'Novato', pts: 5 },
  { id: 'lutador', label: 'Lutador', pts: 7 },
  { id: 'campeao', label: 'Campeao', pts: 10 },
  { id: 'lenda', label: 'Lenda', pts: 12 },
];

interface PointsBarProps {
  nivelPoder: string;
  mudarNivelPoder: (n: string) => void;
  pontosTotal: number;
  pontosRestantes: number;
  pontosCaracteristicas: number;
  pontosVantagens: number;
  pontosFocus: number;
  pontosDesvantagens: number;
}

export default function PointsBar({
  nivelPoder, mudarNivelPoder,
  pontosTotal, pontosRestantes,
  pontosCaracteristicas, pontosVantagens, pontosFocus, pontosDesvantagens,
}: PointsBarProps) {
  useTheme();

  const isOver = pontosRestantes < 0;

  return (
    <div
      className="wa-panel-strong sticky top-0 z-10 flex items-center gap-3 flex-wrap px-4 py-2 backdrop-blur-sm"
    >
      {/* Nivel de Poder */}
      <div className="flex items-center gap-3">
        <span
          className="font-fantasy text-xs font-bold uppercase"
          style={{ color: 'var(--wa-muted)', letterSpacing: '0.15em' }}
        >
          Poder
        </span>
        <div className="flex gap-1.5">
          {NIVEIS.map(n => {
            const isActive = nivelPoder === n.id;
            return (
              <button
                key={n.id}
                onClick={() => mudarNivelPoder(n.id)}
                className={`wa-choice-card px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  isActive ? 'wa-forge-chip' : ''
                }`}
                style={isActive
                  ? {
                      animation: 'wa-pulseGlow 2s ease infinite',
                      boxShadow: '0 0 12px color-mix(in srgb, var(--wa-forge-gold) 40%, transparent)',
                    }
                  : {
                      background: 'var(--wa-panel-soft)',
                      color: 'var(--wa-muted)',
                    }
                }
              >
                {n.label} ({n.pts})
              </button>
            );
          })}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Pip track */}
      <div className="flex items-center gap-3">
        <div
          className="wa-progress-shimmer flex gap-1 flex-wrap max-w-[180px] rounded-lg px-2 py-1.5"
          style={{
            background: 'var(--wa-panel-soft)',
            border: '1px solid var(--wa-border)',
          }}
        >
          {Array.from({ length: pontosCaracteristicas }).map((_, i) => (
            <div
              key={`c${i}`}
              className="w-2.5 h-2.5 rounded-sm"
              style={{
                background: 'var(--wa-accent)',
                boxShadow: '0 0 6px color-mix(in srgb, var(--wa-accent) 50%, transparent)',
              }}
            />
          ))}
          {Array.from({ length: pontosVantagens }).map((_, i) => (
            <div
              key={`v${i}`}
              className="w-2.5 h-2.5 rounded-sm"
              style={{
                background: 'var(--wa-ember)',
                boxShadow: '0 0 6px color-mix(in srgb, var(--wa-ember) 50%, transparent)',
              }}
            />
          ))}
          {Array.from({ length: pontosFocus }).map((_, i) => (
            <div
              key={`f${i}`}
              className="w-2.5 h-2.5 rounded-sm"
              style={{
                background: 'var(--wa-teal)',
                boxShadow: '0 0 6px color-mix(in srgb, var(--wa-teal) 50%, transparent)',
              }}
            />
          ))}
          {Array.from({ length: Math.max(0, pontosRestantes) }).map((_, i) => (
            <div
              key={`r${i}`}
              className="w-2.5 h-2.5 rounded-sm"
              style={{
                border: '1px solid var(--wa-border)',
                background: 'transparent',
              }}
            />
          ))}
          {Array.from({ length: Math.abs(pontosDesvantagens) }).map((_, i) => (
            <div
              key={`d${i}`}
              className="w-2.5 h-2.5 rounded-sm"
              style={{
                background: '#34d399',
                boxShadow: '0 0 6px rgba(52, 211, 153, 0.5)',
              }}
            />
          ))}
        </div>

        {/* Counter */}
        <div className="text-center">
          <div
            className="text-xl font-extrabold font-fantasy"
            style={{
              color: isOver ? 'var(--wa-danger)' : 'var(--wa-forge-gold)',
              textShadow: isOver
                ? '0 0 12px color-mix(in srgb, var(--wa-danger) 40%, transparent)'
                : 'none',
            }}
          >
            {pontosRestantes}
          </div>
          <div
            className="font-modern text-[10px] leading-tight"
            style={{ color: 'var(--wa-muted)' }}
          >
            de {pontosTotal}
          </div>
        </div>
      </div>
    </div>
  );
}
