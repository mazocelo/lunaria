import React, { useState, useMemo } from 'react';
import { Minus, Plus, Wand2, Info, Sparkles, CheckCircle2 } from 'lucide-react';

const ATTR_CONFIG = {
  forca: {
    label: 'Forca', abbr: 'FOR', bar: 'bg-red-500',
    desc: 'Poder fisico bruto. Afeta dano corpo-a-corpo, carga e testes de forca.',
  },
  destreza: {
    label: 'Destreza', abbr: 'DES', bar: 'bg-purple-500',
    desc: 'Precisao e coordenacao. Afeta ataques a distancia, furtividade e trabalhos manuais.',
  },
  constituicao: {
    label: 'Constituicao', abbr: 'CON', bar: 'bg-green-500',
    desc: 'Resistencia e vitalidade. Aumenta pontos de vida e suportes de fadiga.',
  },
  inteligencia: {
    label: 'Inteligencia', abbr: 'INT', bar: 'bg-blue-500',
    desc: 'Raciocinio e estudo. Afeta magia arcana, investigacao e conhecimento.',
  },
  agilidade: {
    label: 'Agilidade', abbr: 'AGI', bar: 'bg-yellow-500',
    desc: 'Velocidade e reflexos. Afeta esquiva, iniciativa e movimento.',
  },
  carisma: {
    label: 'Carisma', abbr: 'CAR', bar: 'bg-pink-500',
    desc: 'Presenca e influencia. Afeta persuasao, intimidacao e lideranca.',
  },
};

/* ---------- Radar Chart ---------- */

const RADAR_AXES = [
  { key: 'forca', abbr: 'FOR' },
  { key: 'destreza', abbr: 'DES' },
  { key: 'constituicao', abbr: 'CON' },
  { key: 'inteligencia', abbr: 'INT' },
  { key: 'agilidade', abbr: 'AGI' },
  { key: 'carisma', abbr: 'CAR' },
];

const RADAR_SIZE = 200;
const RADAR_CX = RADAR_SIZE / 2;
const RADAR_CY = RADAR_SIZE / 2;
const RADAR_R = 72; // max radius for the outermost hexagon
const LABEL_R = RADAR_R + 18;

/** Return {x, y} for a hex vertex at index i (0=top, clockwise). */
const hexPoint = (i, radius) => {
  const angle = (Math.PI / 2) + (2 * Math.PI * i) / 6; // start from top
  return {
    x: RADAR_CX + radius * Math.cos(angle),
    y: RADAR_CY - radius * Math.sin(angle),
  };
};

const hexPath = (radius) =>
  RADAR_AXES.map((_, i) => {
    const { x, y } = hexPoint(i, radius);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ') + ' Z';

const RadarChart = ({ atributos, attrMin, attrMax, isLight }) => {
  const range = attrMax - attrMin || 1;

  const dataPoints = useMemo(
    () =>
      RADAR_AXES.map((axis, i) => {
        const raw = atributos[axis.key] || 0;
        const norm = Math.max(0, Math.min(1, (raw - attrMin) / range));
        const r = norm * RADAR_R;
        return hexPoint(i, r);
      }),
    [atributos, attrMin, range],
  );

  const dataPath =
    dataPoints
      .map(({ x, y }, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
      .join(' ') + ' Z';

  const gridLevels = [0.25, 0.5, 0.75, 1];
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
        {/* Concentric hexagonal grid */}
        {gridLevels.map((pct) => (
          <path
            key={pct}
            d={hexPath(RADAR_R * pct)}
            fill="none"
            stroke={gridColor}
            strokeWidth={pct === 1 ? 1.2 : 0.7}
            opacity={gridOpacity}
          />
        ))}

        {/* Axis spokes */}
        {RADAR_AXES.map((_, i) => {
          const { x, y } = hexPoint(i, RADAR_R);
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

        {/* Filled data polygon */}
        <path
          d={dataPath}
          fill="var(--wa-accent)"
          fillOpacity={0.22}
          stroke="var(--wa-accent)"
          strokeWidth={1.8}
          strokeLinejoin="round"
          style={{ transition: 'd 0.35s ease' }}
        />

        {/* Data point dots */}
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

        {/* Axis labels */}
        {RADAR_AXES.map((axis, i) => {
          const { x, y } = hexPoint(i, LABEL_R);
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
              {axis.abbr}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

/* ---------- Attribute Distributor ---------- */

const AttributeDistributor = ({
  atributos,
  setAtributo,
  pontosDistribuidos,
  pontosRestantes,
  pontosTotais,
  atributosSugeridos,
  aplicarAtributosSugeridos,
  isLight,
  disabled = false,
  attrMin = 5,
  attrMax = 16,
}) => {
  const [infoAberta, setInfoAberta] = useState(null);
  const pronto = pontosRestantes === 0;

  return (
    <div className="wa-panel wa-etched rounded-[22px] p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="wa-accent-chip inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em]">
            <Sparkles size={11} />
            Mesa de calibracao
          </div>
          <h4 className={`mt-3 text-lg font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Distribuir Atributos
          </h4>
          <p className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-[var(--wa-muted)]'}`}>
            Ajuste o corpo mecanico da ficha antes de aplicar os bonus finais.
          </p>
        </div>

        <div className="text-right">
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-mono font-semibold ${pronto ? 'wa-emerald-chip' : pontosRestantes < 0 ? 'wa-ember-chip' : 'wa-violet-chip'}`}>
            {pronto ? <CheckCircle2 size={12} /> : <Sparkles size={12} />}
            {pontosDistribuidos}/{pontosTotais}
          </span>
          <p className={`mt-2 text-[11px] font-modern ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
            {pronto ? 'Pronto para confirmar' : `${pontosRestantes} restantes`}
          </p>
        </div>
      </div>

      {atributosSugeridos && !disabled && (
        <button
          onClick={aplicarAtributosSugeridos}
          className="wa-panel-soft mb-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-modern font-medium transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <Wand2 size={15} className="text-[var(--wa-forge-gold)]" />
          Aplicar sugestao do Mestre
        </button>
      )}

      <RadarChart
        atributos={atributos}
        attrMin={attrMin}
        attrMax={attrMax}
        isLight={isLight}
      />

      <div className="space-y-3">
        {Object.entries(ATTR_CONFIG).map(([key, cfg]) => {
          const val = atributos[key] || 0;
          const mod = Math.floor((val - 10) / 2);
          const showInfo = infoAberta === key;
          const modClass = mod >= 0 ? 'wa-emerald-chip' : 'wa-ember-chip';

          return (
            <div key={key} className="wa-panel-soft rounded-2xl px-3 py-3">
              <div className="flex items-center gap-2">
                <div className="w-14 shrink-0">
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>{cfg.abbr}</span>
                    <button
                      type="button"
                      onClick={() => setInfoAberta(showInfo ? null : key)}
                      className={`rounded p-0.5 transition-colors cursor-pointer ${showInfo ? 'text-[var(--wa-accent)]' : isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <Info size={12} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setAtributo(key, val - 1)}
                  disabled={disabled || val <= attrMin}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                    disabled || val <= attrMin
                      ? 'opacity-35 cursor-not-allowed'
                      : isLight ? 'border-slate-300 text-slate-600 hover:bg-white' : 'border-slate-700 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Minus size={14} />
                </button>

                <div className={`w-10 text-center text-lg font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{val}</div>

                <button
                  onClick={() => setAtributo(key, val + 1)}
                  disabled={disabled || val >= attrMax || pontosRestantes <= 0}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                    disabled || val >= attrMax || pontosRestantes <= 0
                      ? 'opacity-35 cursor-not-allowed'
                      : isLight ? 'border-slate-300 text-slate-600 hover:bg-white' : 'border-slate-700 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Plus size={14} />
                </button>

                <span className={`${modClass} inline-flex min-w-[3.25rem] items-center justify-center rounded-full px-2 py-1 text-xs font-mono font-semibold`}>
                  {mod >= 0 ? '+' : ''}{mod}
                </span>

                <div className={`h-2.5 flex-1 overflow-hidden rounded-full ${isLight ? 'bg-slate-200' : 'bg-slate-800/80'}`}>
                  <div className={`h-full rounded-full ${cfg.bar} transition-all duration-300`} style={{ width: `${Math.min(100, (val / 20) * 100)}%` }} />
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
    </div>
  );
};

export default AttributeDistributor;
