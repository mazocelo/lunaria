import { useState, useMemo } from 'react';
import { Minus, Plus, Sparkles, Info, CheckCircle2, ChevronRight } from 'lucide-react';
import { TRESDET_ATTR_CONFIG } from '../../../../constants/tresdetAtributos';

export { TRESDET_ATTR_CONFIG };

const RADAR_SIZE = 200;
const RADAR_CX = RADAR_SIZE / 2;
const RADAR_CY = RADAR_SIZE / 2;
const RADAR_R = 72;
const LABEL_R = RADAR_R + 22;

const polyPoint = (i: number, total: number, radius: number) => {
  const angle = (Math.PI / 2) + (2 * Math.PI * i) / total;
  return {
    x: RADAR_CX + radius * Math.cos(angle),
    y: RADAR_CY - radius * Math.sin(angle),
  };
};

const polyPath = (total: number, radius: number): string =>
  Array.from({ length: total }, (_, i) => {
    const { x, y } = polyPoint(i, total, radius);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ') + ' Z';

interface TresDetRadarProps {
  valores: Record<string, number>;
  isLight: boolean;
}

const TresDetRadar = ({ valores, isLight }: TresDetRadarProps) => {
  const total = TRESDET_ATTR_CONFIG.length;
  const maxVal = 5;

  const dataPoints = useMemo(
    () =>
      TRESDET_ATTR_CONFIG.map((cfg, i) => {
        const raw = valores[cfg.key] || 0;
        const norm = Math.max(0, Math.min(1, raw / maxVal));
        return polyPoint(i, total, norm * RADAR_R);
      }),
    [valores],
  );

  const dataPath =
    dataPoints
      .map(({ x, y }, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
      .join(' ') + ' Z';

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];
  const gridColor = isLight ? 'rgba(100,116,139,0.18)' : 'var(--wa-teal)';
  const gridOpacity = isLight ? 1 : 0.18;

  return (
    <div className="flex justify-center pb-2">
      <svg
        width={RADAR_SIZE}
        height={RADAR_SIZE}
        viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}
        className="overflow-visible"
      >
        {gridLevels.map((pct) => (
          <path
            key={pct}
            d={polyPath(total, RADAR_R * pct)}
            fill="none"
            stroke={gridColor}
            strokeWidth={pct === 1 ? 1.2 : 0.7}
            opacity={gridOpacity}
          />
        ))}

        {TRESDET_ATTR_CONFIG.map((_, i) => {
          const { x, y } = polyPoint(i, total, RADAR_R);
          return (
            <line
              key={`spoke-${i}`}
              x1={RADAR_CX}
              y1={RADAR_CY}
              x2={x}
              y2={y}
              stroke={gridColor}
              strokeWidth={0.6}
              opacity={gridOpacity}
            />
          );
        })}

        <path
          d={dataPath}
          fill="var(--wa-accent)"
          fillOpacity={0.22}
          stroke="var(--wa-accent)"
          strokeWidth={1.8}
          strokeLinejoin="round"
          style={{ transition: 'd 0.35s ease' }}
        />

        {dataPoints.map(({ x, y }, i) => (
          <circle
            key={`dot-${i}`}
            cx={x}
            cy={y}
            r={3}
            fill="var(--wa-accent)"
            style={{ transition: 'cx 0.35s ease, cy 0.35s ease' }}
          />
        ))}

        {TRESDET_ATTR_CONFIG.map((cfg, i) => {
          const { x, y } = polyPoint(i, total, LABEL_R);
          return (
            <text
              key={`label-${i}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[10px] font-mono font-bold"
              fill={isLight ? '#475569' : '#94a3b8'}
            >
              {cfg.sigla}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

interface TresDetCaracteristicasBlockProps {
  valores?: Record<string, number>;
  pontosTotais?: number;
  onSetValor?: (key: string, value: number) => void;
  onConfirmar?: () => void;
  confirmado?: boolean;
  isLight?: boolean;
}

const TresDetCaracteristicasBlock = ({
  valores = {},
  pontosTotais = 5,
  onSetValor,
  onConfirmar,
  confirmado = false,
  isLight = false,
}: TresDetCaracteristicasBlockProps) => {
  const [infoAberta, setInfoAberta] = useState<string | null>(null);

  const pontosUsados = useMemo(
    () => TRESDET_ATTR_CONFIG.reduce((acc, cfg) => acc + (valores[cfg.key] || 0), 0),
    [valores],
  );

  const pontosRestantes = pontosTotais - pontosUsados;
  const pronto = pontosRestantes === 0;
  const erro = pontosRestantes < 0;
  const progressPct = pontosTotais > 0 ? Math.min(100, (pontosUsados / pontosTotais) * 100) : 0;

  if (confirmado) {
    return (
      <section className="wa-combo-block wa-stage-enter wa-stagger-2 rounded-[28px] p-5 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-[var(--wa-teal)]" />
          <span className={`text-base font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
            Caracteristicas confirmadas
          </span>
          <CheckCircle2 size={16} className="ml-auto text-[var(--wa-teal)]" />
        </div>
        <div className="grid grid-cols-5 gap-2">
          {TRESDET_ATTR_CONFIG.map((cfg) => {
            const val = valores[cfg.key] || 0;
            return (
              <div key={cfg.key} className={`rounded-xl border px-2 py-2.5 text-center ${isLight ? 'border-slate-200 bg-white/75' : 'border-slate-700/50 bg-slate-900/55'}`}>
                <div className={`text-[11px] font-mono font-semibold tracking-wide ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{cfg.sigla}</div>
                <div className={`mt-1 text-xl font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{val}</div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="wa-combo-block wa-stage-enter wa-stagger-2 rounded-[28px] p-5 md:p-6">
      <div className="mb-5 flex flex-col items-center gap-2">
        <div className="wa-accent-chip inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em]">
          <Sparkles size={11} />
          Caracteristicas 3D&T
        </div>
        <h4 className={`mt-2 text-lg font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Distribuir Caracteristicas
        </h4>
        <p className={`text-sm font-modern text-center ${isLight ? 'text-slate-600' : 'text-[var(--wa-muted)]'}`}>
          Distribua {pontosTotais} pontos entre as 5 caracteristicas (0-5 cada).
        </p>

        <div className={`mt-2 flex flex-col items-center gap-1.5 rounded-2xl px-6 py-3 transition-all duration-300 ${
          pronto ? 'bg-emerald-500/15 ring-2 ring-emerald-400/50 animate-pulse' : erro ? 'bg-red-500/15 ring-2 ring-red-400/50' : isLight ? 'bg-slate-100' : 'bg-slate-800/60'
        }`}>
          <span className={`flex items-center gap-2 text-2xl font-mono font-bold ${
            pronto ? 'text-emerald-400' : erro ? 'text-red-400' : isLight ? 'text-slate-900' : 'text-white'
          }`}>
            {pronto ? <CheckCircle2 size={22} /> : <Sparkles size={22} />}
            {pontosUsados} / {pontosTotais}
          </span>
          <span className={`text-xs font-modern font-medium ${
            pronto ? 'text-emerald-400' : erro ? 'text-red-400' : 'text-[var(--wa-muted)]'
          }`}>
            {pronto ? 'Todos os pontos distribuidos!' : erro ? `${Math.abs(pontosRestantes)} pontos acima do limite!` : `${pontosRestantes} pontos restantes`}
          </span>
        </div>

        <div className={`mt-1 h-2 w-full max-w-xs overflow-hidden rounded-full ${isLight ? 'bg-slate-200' : 'bg-slate-800/80'}`}>
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              pronto ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : erro ? 'bg-red-500' : 'bg-[var(--wa-accent)]'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <TresDetRadar valores={valores} isLight={isLight} />

      <div className="space-y-3">
        {TRESDET_ATTR_CONFIG.map((cfg) => {
          const val = valores[cfg.key] || 0;
          const showInfo = infoAberta === cfg.key;

          return (
            <div key={cfg.key} className="wa-panel-soft rounded-2xl px-3 py-3">
              <div className="flex items-center gap-2">
                <div className="w-14 shrink-0">
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>{cfg.sigla}</span>
                    <button
                      type="button"
                      onClick={() => setInfoAberta(showInfo ? null : cfg.key)}
                      className={`rounded p-0.5 transition-colors cursor-pointer ${showInfo ? 'text-[var(--wa-accent)]' : isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <Info size={12} />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSetValor?.(cfg.key, val - 1)}
                  disabled={val <= cfg.min}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all active:scale-95 cursor-pointer ${
                    val <= cfg.min
                      ? 'opacity-35 cursor-not-allowed'
                      : isLight ? 'border-slate-300 text-slate-600 hover:bg-white hover:border-slate-400' : 'border-slate-700 text-slate-300 hover:bg-slate-900 hover:border-slate-500'
                  }`}
                >
                  <Minus size={16} />
                </button>

                <div className={`w-10 text-center text-lg font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{val}</div>

                <button
                  type="button"
                  onClick={() => onSetValor?.(cfg.key, val + 1)}
                  disabled={val >= cfg.max || pontosRestantes <= 0}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all active:scale-95 cursor-pointer ${
                    val >= cfg.max || pontosRestantes <= 0
                      ? 'opacity-35 cursor-not-allowed'
                      : isLight ? 'border-slate-300 text-slate-600 hover:bg-white hover:border-slate-400' : 'border-slate-700 text-slate-300 hover:bg-slate-900 hover:border-slate-500'
                  }`}
                >
                  <Plus size={16} />
                </button>

                <div className={`h-2.5 flex-1 overflow-hidden rounded-full ${isLight ? 'bg-slate-200' : 'bg-slate-800/80'}`}>
                  <div className={`h-full rounded-full ${cfg.bar} transition-all duration-300`} style={{ width: `${(val / cfg.max) * 100}%` }} />
                </div>
              </div>

              {showInfo && (
                <div className={`mt-2 rounded-xl px-3 py-2 text-xs font-modern leading-relaxed ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-900/80 text-slate-300'}`}>
                  <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>{cfg.label}</span>
                  {' - '}{cfg.desc}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 border-t border-[var(--wa-border)] pt-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
              Ficha mecanica
            </p>
            <p className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              {pronto ? 'Caracteristicas distribuidas. Confirme para avancar.' : `Distribua os ${pontosRestantes} pontos restantes.`}
            </p>
          </div>

          <button
            type="button"
            onClick={onConfirmar}
            disabled={!pronto}
            className={`inline-flex min-w-[14rem] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-modern font-semibold transition-all ${
              !pronto
                ? 'cursor-not-allowed bg-slate-600 text-slate-300 opacity-70'
                : 'bg-gradient-to-br from-[var(--wa-accent)] to-[var(--wa-teal)] text-white shadow-lg hover:-translate-y-0.5'
            }`}
          >
            <ChevronRight size={16} />
            Confirmar caracteristicas ({pontosUsados}/{pontosTotais})
          </button>
        </div>
      </div>
    </section>
  );
};

export default TresDetCaracteristicasBlock;
