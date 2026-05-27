import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Loader2,
  AlertTriangle,
  Check,
  ChevronRight,
  Search,
  X,
  Sparkles,
  Shield,
} from 'lucide-react';
import { vantagemService, desvantagemService } from '../../../../services/index';

interface TresDetItem {
  id?: number | string;
  nome?: string;
  descricao?: string;
  custo?: number;
  tipo?: string | string[];
  [key: string]: unknown;
}

const TIPO_LABELS: Record<string, string> = {
  ofensiva: 'Ofensiva',
  defensiva: 'Defensiva',
  passiva: 'Passiva',
  magico: 'Magico',
  movimento: 'Movimento',
  social: 'Social',
  comportamental: 'Comportamental',
  sobrenatural: 'Sobrenatural',
  mental: 'Mental',
  fisica: 'Fisica',
};

const TIPO_COLORS: Record<string, string> = {
  ofensiva: 'wa-ember-chip',
  defensiva: 'wa-teal-chip',
  passiva: 'wa-accent-chip',
  magico: 'wa-accent-chip',
  movimento: 'wa-forge-chip',
  social: 'wa-emerald-chip',
  comportamental: 'wa-forge-chip',
  sobrenatural: 'wa-accent-chip',
  mental: 'wa-teal-chip',
  fisica: 'wa-ember-chip',
};

interface TresDetVantagensBlockProps {
  modo?: 'vantagens' | 'desvantagens';
  selecionadas?: Array<number | string>;
  onToggle?: (id: number | string, custo: number) => void;
  onConfirmar?: () => void;
  pontosDisponiveis?: number;
  isLight?: boolean;
}

const TresDetVantagensBlock = ({
  modo = 'vantagens',
  selecionadas = [],
  onToggle,
  onConfirmar,
  pontosDisponiveis: _pontosDisponiveis = 0,
  isLight = false,
}: TresDetVantagensBlockProps) => {
  const [itens, setItens] = useState<TresDetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string | null>(null);

  const isDesvantagem = modo === 'desvantagens';

  useEffect(() => {
    let cancelled = false;
    const carregar = async () => {
      setLoading(true);
      setError(null);
      try {
        const service = isDesvantagem ? desvantagemService : vantagemService;
        const response = await service.getAll({ sistema: 'tresdet' }) as { data?: TresDetItem[] } | TresDetItem[];
        if (!cancelled) {
          const data = Array.isArray(response) ? response : (response as { data?: TresDetItem[] }).data || [];
          setItens(data);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Erro ao carregar catalogo';
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    carregar();
    return () => { cancelled = true; };
  }, [isDesvantagem]);

  const selecionadasSet = useMemo(() => new Set(selecionadas.map(String)), [selecionadas]);

  const tipos = useMemo<string[]>(() => {
    const set = new Set<string>();
    itens.forEach((item) => {
      const tipoArr = Array.isArray(item.tipo) ? item.tipo : item.tipo ? [item.tipo] : [];
      tipoArr.forEach((t) => set.add(t));
    });
    return [...set].sort();
  }, [itens]);

  const itensFiltrados = useMemo(() => {
    let resultado = itens;
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      resultado = resultado.filter(
        (item) =>
          item.nome?.toLowerCase().includes(termo) ||
          item.descricao?.toLowerCase().includes(termo),
      );
    }
    if (tipoFiltro) {
      resultado = resultado.filter((item) => {
        const tipoArr = Array.isArray(item.tipo) ? item.tipo : item.tipo ? [item.tipo] : [];
        return tipoArr.includes(tipoFiltro);
      });
    }
    return resultado;
  }, [itens, busca, tipoFiltro]);

  const custoSelecionado = useMemo<number>(() => {
    return selecionadas.reduce<number>((acc, id) => {
      const item = itens.find((i) => String(i.id) === String(id));
      return acc + Math.abs(Number(item?.custo) || 0);
    }, 0);
  }, [selecionadas, itens]);

  const handleToggle = useCallback(
    (id: number | string, custo: number) => {
      onToggle?.(id, custo);
    },
    [onToggle],
  );

  const titulo = isDesvantagem ? 'Desvantagens' : 'Vantagens';
  const subtitulo = isDesvantagem
    ? 'Aceite fraquezas para ganhar pontos extras'
    : 'Compre poderes com seus pontos';
  const iconHeader = isDesvantagem ? Shield : Sparkles;
  const IconComp = iconHeader;

  if (loading) {
    return (
      <section className="wa-combo-block wa-stage-enter wa-stagger-2 rounded-[28px] p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="wa-accent-chip inline-flex h-11 w-11 items-center justify-center rounded-2xl">
            <Loader2 size={18} className="animate-spin" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
              Catalogo 3D&T
            </p>
            <h3 className={`mt-2 text-2xl font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Carregando {titulo.toLowerCase()}
            </h3>
            <p className={`mt-2 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Buscando o catalogo de {titulo.toLowerCase()} do sistema 3D&T...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="wa-combo-block wa-stage-enter wa-stagger-2 rounded-[28px] p-5 md:p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--wa-ember)]" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-ember)]">
              Catalogo indisponivel
            </p>
            <p className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              {error}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="wa-combo-block wa-stage-enter wa-stagger-2 rounded-[28px] p-5 md:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${isDesvantagem ? 'wa-ember-chip' : 'wa-accent-chip'}`}>
                <IconComp size={12} />
                {titulo} 3D&T
              </span>
              <span className="wa-teal-chip inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em]">
                {itens.length} disponiveis
              </span>
            </div>
            <h3 className={`mt-3 text-2xl font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {subtitulo}
            </h3>
            <p className={`mt-2 max-w-3xl text-sm font-modern leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              {isDesvantagem
                ? 'Cada desvantagem aceita devolve pontos para a build. Selecione e confirme.'
                : 'Cada vantagem consome pontos da build. Selecione as que deseja e confirme.'}
            </p>
          </div>

          <div className="wa-panel-soft flex shrink-0 flex-col gap-1 rounded-2xl px-4 py-3">
            <span className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
              {isDesvantagem ? 'Pontos recuperados' : 'Pontos gastos'}
            </span>
            <span className={`text-lg font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {custoSelecionado}
            </span>
            <span className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
              {selecionadas.length} {selecionadas.length === 1 ? 'selecionada' : 'selecionadas'}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className={`flex flex-1 items-center gap-2 rounded-2xl border px-3 py-2.5 ${isLight ? 'border-slate-200 bg-white/90' : 'border-slate-700 bg-slate-950/70'}`}>
            <Search size={14} className={isLight ? 'text-slate-400' : 'text-[var(--wa-muted)]'} />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={`Buscar ${titulo.toLowerCase()}...`}
              className={`flex-1 bg-transparent text-sm font-modern outline-none ${isLight ? 'text-slate-700 placeholder-slate-400' : 'text-slate-100 placeholder-slate-500'}`}
            />
            {busca && (
              <button type="button" onClick={() => setBusca('')} className="cursor-pointer">
                <X size={12} className={isLight ? 'text-slate-400' : 'text-[var(--wa-muted)]'} />
              </button>
            )}
          </div>
          {tipos.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {tipos.map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setTipoFiltro((prev) => (prev === tipo ? null : tipo))}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em] transition-all cursor-pointer ${
                    tipoFiltro === tipo
                      ? (TIPO_COLORS[tipo] || 'wa-accent-chip')
                      : 'wa-panel-soft hover:opacity-80'
                  }`}
                >
                  {TIPO_LABELS[tipo] || tipo}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="wa-panel-soft rounded-2xl p-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <p className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
              Catalogo
            </p>
            <span className="wa-accent-chip rounded-full px-3 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em]">
              {itensFiltrados.length} resultados
            </span>
          </div>

          {itensFiltrados.length === 0 ? (
            <div className={`rounded-2xl border border-dashed p-4 text-sm font-modern text-center ${isLight ? 'border-slate-300 text-slate-500' : 'border-[var(--wa-border)] text-[var(--wa-muted)]'}`}>
              {busca || tipoFiltro ? 'Nenhum item encontrado com esses filtros.' : `Nenhuma ${titulo.toLowerCase()} disponivel.`}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {itensFiltrados.map((item) => {
                const selected = selecionadasSet.has(String(item.id));
                const custo = Math.abs(item.custo || 0);
                const tipoArr = Array.isArray(item.tipo) ? item.tipo : item.tipo ? [item.tipo] : [];

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => item.id != null && handleToggle(item.id, Number(item.custo) || 0)}
                    className={`group relative rounded-2xl border border-l-4 p-4 text-left transition-all cursor-pointer ${
                      selected
                        ? isDesvantagem
                          ? 'border-[var(--wa-ember)]/60 bg-[var(--wa-ember)]/8'
                          : 'border-[var(--wa-accent)]/60 bg-[var(--wa-accent)]/8'
                        : isLight
                          ? 'border-slate-200 bg-white/70 hover:border-[var(--wa-accent)]/40'
                          : 'border-[var(--wa-border)] bg-black/15 hover:border-[var(--wa-accent)]/40'
                    }`}
                  >
                    <div className="absolute right-3 top-3">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                        selected
                          ? isDesvantagem
                            ? 'border-[var(--wa-ember)] bg-[var(--wa-ember)] text-white'
                            : 'border-[var(--wa-accent)] bg-[var(--wa-accent)] text-white'
                          : isLight
                            ? 'border-slate-300'
                            : 'border-slate-600'
                      }`}>
                        {selected && <Check size={12} />}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pr-8">
                      {tipoArr.map((tipo) => (
                        <span key={tipo} className={`rounded-full px-2 py-0.5 text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${TIPO_COLORS[tipo] || 'wa-accent-chip'}`}>
                          {TIPO_LABELS[tipo] || tipo}
                        </span>
                      ))}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${isDesvantagem ? 'wa-emerald-chip' : 'wa-ember-chip'}`}>
                        {isDesvantagem ? `+${custo}` : `-${custo}`} pt{custo !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <h4 className={`mt-2.5 text-base font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {item.nome}
                    </h4>

                    {item.descricao && (
                      <p className={`mt-1.5 text-xs font-modern leading-relaxed line-clamp-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        {item.descricao}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-[var(--wa-border)] pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
                {titulo} selecionadas
              </p>
              <p className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                {selecionadas.length === 0
                  ? `Selecione ${titulo.toLowerCase()} acima para compor a build.`
                  : `${selecionadas.length} ${titulo.toLowerCase()} selecionadas (${custoSelecionado} pts). Confirme para avancar.`}
              </p>
            </div>

            <button
              type="button"
              onClick={onConfirmar}
              disabled={selecionadas.length === 0}
              className={`inline-flex min-w-[14rem] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-modern font-semibold transition-all ${
                selecionadas.length === 0
                  ? 'cursor-not-allowed bg-slate-600 text-slate-300 opacity-70'
                  : 'bg-gradient-to-br from-[var(--wa-accent)] to-[var(--wa-teal)] text-white shadow-lg hover:-translate-y-0.5'
              }`}
            >
              <ChevronRight size={16} />
              Confirmar {titulo.toLowerCase()} ({selecionadas.length})
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TresDetVantagensBlock;
