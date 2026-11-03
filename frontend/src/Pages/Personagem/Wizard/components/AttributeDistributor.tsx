import { useMemo } from 'react';
import { Minus, Plus, Wand2 } from 'lucide-react';
import { FOCO } from '../../../../components/shared';
import AtributoTile, { type FonteDeBonus } from './AtributoTile';
import { ATRIBUTOS_LUNARIA, pvEstimado } from '../stages/atributos';

/* ---------- Radar Chart ---------- */

const RADAR_AXES = ATRIBUTOS_LUNARIA.map(({ chave, abrev }) => ({ key: chave, abbr: abrev }));

const RADAR_SIZE = 200;
const RADAR_CX = RADAR_SIZE / 2;
const RADAR_CY = RADAR_SIZE / 2;
const RADAR_R = 72; // max radius for the outermost hexagon
const LABEL_R = RADAR_R + 18;

/** Return {x, y} for a hex vertex at index i (0=top, clockwise). */
const hexPoint = (i: number, radius: number) => {
  const angle = (Math.PI / 2) + (2 * Math.PI * i) / 6; // start from top
  return {
    x: RADAR_CX + radius * Math.cos(angle),
    y: RADAR_CY - radius * Math.sin(angle),
  };
};

const hexPath = (radius: number): string =>
  RADAR_AXES.map((_, i) => {
    const { x, y } = hexPoint(i, radius);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ') + ' Z';

interface RadarChartProps {
  atributos: Record<string, number>;
  attrMin: number;
  attrMax: number;
  isLight: boolean;
}

const RadarChart = ({ atributos, attrMin, attrMax, isLight }: RadarChartProps) => {
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
  const gridColor = 'var(--muted-foreground)';
  const gridOpacity = isLight ? 0.3 : 0.25;

  return (
    <div className="flex justify-center pb-2">
      <svg
        aria-hidden="true"
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
          fill="var(--primary)"
          fillOpacity={0.22}
          stroke="var(--primary)"
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
            fill="var(--primary)"
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
              className="font-modern text-[10px] font-bold"
              fill="var(--muted-foreground)"
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

interface AttributeDistributorProps {
  atributos: Record<string, number>;
  setAtributo: (key: string, value: number) => void;
  pontosDistribuidos: number;
  pontosRestantes: number;
  pontosTotais: number;
  atributosSugeridos?: unknown;
  aplicarAtributosSugeridos?: () => void;
  isLight: boolean;
  disabled?: boolean;
  /** Confirmado: tiles sem os botões de − e +. */
  somenteLeitura?: boolean;
  attrMin?: number;
  attrMax?: number;
  bonusFontes?: Record<string, FonteDeBonus[]>;
  multRaca?: number | null;
}

const somaFontes = (fontes: FonteDeBonus[] | undefined) => (fontes ?? []).reduce((t, f) => t + f.valor, 0);

const AttributeDistributor = ({
  atributos, setAtributo, pontosDistribuidos, pontosRestantes, pontosTotais, atributosSugeridos, aplicarAtributosSugeridos,
  isLight, disabled = false, somenteLeitura = false, attrMin = 5, attrMax = 16, bonusFontes = {}, multRaca = null,
}: AttributeDistributorProps) => {
  const finais = Object.fromEntries(ATRIBUTOS_LUNARIA.map(({ chave }) => [chave, Number(atributos[chave] ?? 0) + somaFontes(bonusFontes[chave])]));
  const pv = pvEstimado(finais.constituicao ?? 10, multRaca);
  // Teto do radar: o maior valor final possível, para o bônus não sair do hexágono.
  const maiorBonus = Math.max(0, ...ATRIBUTOS_LUNARIA.map(({ chave }) => somaFontes(bonusFontes[chave])));
  const estado = pontosRestantes === 0
    ? 'Todos os pontos distribuídos'
    : pontosRestantes < 0 ? `${-pontosRestantes} pts acima do limite` : `${pontosRestantes} pts restantes`;
  const botao = `inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground)] transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-35 hover:border-[var(--primary)] ${FOCO}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {somenteLeitura ? <span /> : (
          <p role="status" aria-live="polite" className={`font-modern text-sm tabular-nums ${pontosRestantes < 0 ? 'text-red-600 dark:text-red-400' : 'text-[var(--foreground)]'}`}>
            <span className="font-bold">{pontosDistribuidos} / {pontosTotais}</span> · {estado}
          </p>
        )}
        <p className="font-modern text-sm text-[var(--foreground)]">PV estimados: <span data-pv={pv} className="font-bold tabular-nums">{pv}</span></p>
        {!!atributosSugeridos && !disabled && !somenteLeitura && aplicarAtributosSugeridos && (
          <button type="button" data-acao="aplicar-sugestao" onClick={aplicarAtributosSugeridos} className={`btn-rpg-secondary inline-flex items-center gap-2 cursor-pointer ${FOCO}`}>
            <Wand2 size={14} aria-hidden="true" /> Aplicar sugestão do Mestre
          </button>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {ATRIBUTOS_LUNARIA.map(({ chave, rotulo, icone, dica }) => {
            const valor = Number(atributos[chave] ?? 0);
            return (
              <AtributoTile key={chave} chave={chave} rotulo={rotulo} base={valor} fontes={bonusFontes[chave] ?? []} icone={icone} dica={dica} isLight={isLight}>
                {somenteLeitura ? null : (
                  <>
                    <button type="button" aria-label={`Diminuir ${rotulo}`} disabled={disabled || valor <= attrMin} onClick={() => setAtributo(chave, valor - 1)} className={botao}><Minus size={14} aria-hidden="true" /></button>
                    <button type="button" aria-label={`Aumentar ${rotulo}`} disabled={disabled || valor >= attrMax || pontosRestantes <= 0} onClick={() => setAtributo(chave, valor + 1)} className={botao}><Plus size={14} aria-hidden="true" /></button>
                  </>
                )}
              </AtributoTile>
            );
          })}
        </div>
        <figure className="self-start">
          <RadarChart atributos={finais} attrMin={attrMin} attrMax={attrMax + maiorBonus} isLight={isLight} />
          <figcaption className="mt-1 text-center font-modern text-xs text-[var(--muted-foreground)]">Radar dos valores finais, com bônus</figcaption>
        </figure>
      </div>
    </div>
  );
};

export default AttributeDistributor;
