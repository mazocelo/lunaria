import { useState, useMemo, useCallback } from 'react';
import { ChevronRight, CheckCircle2, Sparkles, Info, RotateCcw } from 'lucide-react';
import { ABILITIES, STANDARD_ARRAY } from '../../../../utils/dnd5eData';

interface AbilityMeta { bar: string; desc: string; }

// Cor da barra e descricao por atributo. Os labels (nome) vem de ABILITIES.
const ABILITY_META: Record<string, AbilityMeta> = {
  STR: { bar: 'bg-red-500', desc: 'Poder fisico, ataques corpo a corpo e capacidade de carga.' },
  DEX: { bar: 'bg-green-500', desc: 'Agilidade, reflexos, ataques a distancia e Classe de Armadura.' },
  CON: { bar: 'bg-yellow-500', desc: 'Vigor, resistencia, pontos de vida e concentracao.' },
  INT: { bar: 'bg-blue-500', desc: 'Raciocinio, conhecimento, arcanismo e investigacao.' },
  WIS: { bar: 'bg-purple-500', desc: 'Percepcao, intuicao e forca de vontade.' },
  CHA: { bar: 'bg-pink-500', desc: 'Presenca, persuasao, enganacao e conjuracao de algumas classes.' },
};

const calcModificador = (valor: number) => Math.floor((valor - 10) / 2);

const formatMod = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`);

interface DnDAbilityScoreBlockProps {
  scores?: Record<string, number | null | undefined>;
  racialBonuses?: Record<string, number>;
  onSetScore: (abilityId: string, valor: number | null) => void;
  onConfirmar?: () => void;
  onReset?: () => void;
  confirmado?: boolean;
  isLight?: boolean;
}

const DnDAbilityScoreBlock = ({
  scores = {},
  racialBonuses = {},
  onSetScore,
  onConfirmar,
  onReset,
  confirmado = false,
  isLight = false,
}: DnDAbilityScoreBlockProps) => {
  const [infoAberta, setInfoAberta] = useState<string | null>(null);

  const valoresAtribuidos = useMemo<number[]>(() => {
    const vals: number[] = [];
    ABILITIES.forEach((ab) => {
      const v = scores[ab.id];
      if (v != null) vals.push(v);
    });
    return vals;
  }, [scores]);

  const valoresDisponiveis = useMemo(() => {
    const pool = [...STANDARD_ARRAY];
    valoresAtribuidos.forEach((v) => {
      const idx = pool.indexOf(v);
      if (idx !== -1) pool.splice(idx, 1);
    });
    return pool.sort((a, b) => b - a);
  }, [valoresAtribuidos]);

  const todosAtribuidos = valoresAtribuidos.length === 6;
  const totalAtribuidos = valoresAtribuidos.length;

  const handleSelecionar = useCallback(
    (abilityId: string, valor: number) => {
      onSetScore(abilityId, valor);
    },
    [onSetScore],
  );

  const handleLimpar = useCallback(
    (abilityId: string) => {
      onSetScore(abilityId, null);
    },
    [onSetScore],
  );

  if (confirmado) {
    return (
      <section className="wa-combo-block wa-stage-enter wa-stagger-2 rounded-[28px] p-5 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-[var(--wa-teal)]" />
          <span className={`text-base font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
            Atributos confirmados
          </span>
          <CheckCircle2 size={16} className="ml-auto text-[var(--wa-teal)]" />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {ABILITIES.map((ab) => {
            const base = scores[ab.id] || 10;
            const racial = racialBonuses[ab.id] || 0;
            const total = base + racial;
            const mod = calcModificador(total);
            return (
              <div
                key={ab.id}
                className={`rounded-xl border px-2 py-2.5 text-center ${isLight ? 'border-slate-200 bg-white/75' : 'border-slate-700/50 bg-slate-900/55'}`}
              >
                <div className={`text-[11px] font-mono font-semibold tracking-wide ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {ab.id}
                </div>
                <div className={`mt-1 text-xl font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {total}
                </div>
                <div className={`text-xs font-mono ${mod >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatMod(mod)}
                </div>
                {racial !== 0 && (
                  <div className={`mt-1 text-[10px] font-mono ${racial > 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>
                    {racial > 0 ? '+' : ''}{racial} racial
                  </div>
                )}
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
          Atributos D&D 5e
        </div>
        <h4 className={`mt-2 text-lg font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Distribuicao por Conjunto Padrao
        </h4>
        <p className={`text-sm font-modern text-center ${isLight ? 'text-slate-600' : 'text-[var(--wa-muted)]'}`}>
          Atribua os valores do Conjunto Padrao [{STANDARD_ARRAY.join(', ')}] a cada atributo.
        </p>

        <div
          className={`mt-2 flex flex-col items-center gap-1.5 rounded-2xl px-6 py-3 transition-all duration-300 ${
            todosAtribuidos
              ? 'bg-emerald-500/15 ring-2 ring-emerald-400/50 animate-pulse'
              : isLight
                ? 'bg-slate-100'
                : 'bg-slate-800/60'
          }`}
        >
          <span
            className={`flex items-center gap-2 text-2xl font-mono font-bold ${
              todosAtribuidos ? 'text-emerald-400' : isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            {todosAtribuidos ? <CheckCircle2 size={22} /> : <Sparkles size={22} />}
            {totalAtribuidos} / 6
          </span>
          <span
            className={`text-xs font-modern font-medium ${
              todosAtribuidos ? 'text-emerald-400' : 'text-[var(--wa-muted)]'
            }`}
          >
            {todosAtribuidos ? 'Todos os atributos atribuidos!' : `${6 - totalAtribuidos} restantes`}
          </span>
        </div>

        {valoresDisponiveis.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span className={`text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
              Disponiveis:
            </span>
            {valoresDisponiveis.map((v, i) => (
              <span
                key={`disp-${v}-${i}`}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-mono font-bold ${
                  isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-200'
                }`}
              >
                {v}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {ABILITIES.map((ab) => {
          const meta = ABILITY_META[ab.id] || { bar: 'bg-slate-500', desc: '' };
          const valorAtual = scores[ab.id];
          const racial = racialBonuses[ab.id] || 0;
          const total = valorAtual != null ? valorAtual + racial : null;
          const mod = total != null ? calcModificador(total) : null;
          const mostrarInfo = infoAberta === ab.id;

          return (
            <div key={ab.id} className="wa-panel-soft rounded-2xl px-3 py-3">
              <div className="flex items-center gap-3">
                <div className="w-20 shrink-0">
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                      {ab.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => setInfoAberta(mostrarInfo ? null : ab.id)}
                      aria-label={`Sobre ${ab.nome}`}
                      aria-expanded={mostrarInfo}
                      className={`rounded p-0.5 transition-colors cursor-pointer ${
                        mostrarInfo
                          ? 'text-[var(--wa-accent)]'
                          : isLight
                            ? 'text-slate-400 hover:text-slate-600'
                            : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Info size={12} />
                    </button>
                  </div>
                  <div className={`text-[10px] font-modern ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                    {ab.nome}
                  </div>
                </div>

                <select
                  value={valorAtual ?? ''}
                  aria-label={`Valor de ${ab.nome}`}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      handleLimpar(ab.id);
                    } else {
                      handleSelecionar(ab.id, Number(val));
                    }
                  }}
                  className={`h-10 flex-1 max-w-[140px] rounded-xl border px-3 text-sm font-mono font-bold outline-none transition-colors cursor-pointer ${
                    isLight
                      ? 'border-slate-300 bg-white text-slate-900 focus:border-[var(--wa-accent)]'
                      : 'border-slate-700 bg-slate-900/80 text-white focus:border-[var(--wa-accent)]'
                  }`}
                >
                  <option value="">--</option>
                  {valorAtual != null && (
                    <option value={valorAtual}>{valorAtual}</option>
                  )}
                  {valoresDisponiveis.map((v, i) => (
                    <option key={`${ab.id}-${v}-${i}`} value={v}>
                      {v}
                    </option>
                  ))}
                </select>

                {total != null && (
                  <div className="flex items-center gap-3">
                    {racial !== 0 && (
                      <span className={`text-xs font-mono ${racial > 0 ? 'text-green-400/80' : 'text-red-400/80'}`}>
                        {racial > 0 ? '+' : ''}{racial}
                      </span>
                    )}
                    <div className={`text-center ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      <div className="text-lg font-mono font-bold">{total}</div>
                      {mod != null && (
                        <div className={`text-xs font-mono ${mod >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatMod(mod)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className={`h-2.5 flex-1 overflow-hidden rounded-full ${isLight ? 'bg-slate-200' : 'bg-slate-800/80'}`}>
                  <div
                    className={`h-full rounded-full ${meta.bar} transition-all duration-300`}
                    style={{ width: total != null ? `${Math.min(100, ((total - 3) / 17) * 100)}%` : '0%' }}
                  />
                </div>
              </div>

              {mostrarInfo && (
                <div className={`mt-2 rounded-xl px-3 py-2 text-xs font-modern leading-relaxed ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-900/80 text-slate-300'}`}>
                  <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>{ab.nome}</span>
                  {' - '}{meta.desc}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 border-t border-[var(--wa-border)] pt-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
                Atributos
              </p>
              <p className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                {todosAtribuidos
                  ? 'Todos os atributos atribuidos. Confirme para avancar.'
                  : `Atribua os ${6 - totalAtribuidos} valores restantes.`}
              </p>
            </div>
            {onReset && totalAtribuidos > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="wa-panel-soft inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-modern font-medium transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <RotateCcw size={12} />
                Redefinir
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onConfirmar}
            disabled={!todosAtribuidos}
            className={`inline-flex min-w-[14rem] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-modern font-semibold transition-all ${
              !todosAtribuidos
                ? 'cursor-not-allowed bg-slate-600 text-slate-300 opacity-70'
                : 'bg-gradient-to-br from-[var(--wa-accent)] to-[var(--wa-teal)] text-white shadow-lg hover:-translate-y-0.5'
            }`}
          >
            <ChevronRight size={16} />
            Confirmar atributos ({totalAtribuidos}/6)
          </button>
        </div>
      </div>
    </section>
  );
};

export default DnDAbilityScoreBlock;
