import { useState, useMemo } from 'react';
import {
  Loader2,
  AlertTriangle,
  Check,
  RefreshCw,
  Search,
  X,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { FOCO } from '../../../../components/shared';
import { mensagemDeErro } from '../stages/mensagemDeErro';

interface Magia {
  id?: number | string;
  nome?: string;
  descricao?: string;
  escola_magia?: string;
  nivel?: number;
  custo_mana?: number;
  dano_base?: string;
  alcance?: string;
  duracao?: string;
  componentes?: string;
  tipo?: string;
  alvo?: string;
  tempo_conjuracao?: string;
  [key: string]: unknown;
}

const ESCOLA_LABELS: Record<string, string> = {
  evocacao: 'Evocacao',
  abjuracao: 'Abjuracao',
  conjuracao: 'Conjuracao',
  transmutacao: 'Transmutacao',
  adivinhacao: 'Adivinhacao',
  encantamento: 'Encantamento',
  ilusao: 'Ilusao',
  necromancia: 'Necromancia',
};

const ESCOLA_COLORS: Record<string, string> = {
  evocacao: 'bg-amber-400/20 text-amber-500',
  abjuracao: 'bg-emerald-500/15 text-emerald-500',
  conjuracao: 'bg-[var(--primary)]/15 text-[var(--primary)]',
  transmutacao: 'bg-amber-400/15 text-amber-600',
  adivinhacao: 'bg-emerald-500/15 text-emerald-500',
  encantamento: 'bg-[var(--primary)]/15 text-[var(--primary)]',
  ilusao: 'bg-amber-400/15 text-amber-600',
  necromancia: 'bg-amber-400/20 text-amber-500',
};

interface GrimorioBlockProps {
  magias?: Magia[];
  slots?: number;
  selecionadas?: Array<number | string>;
  onToggleMagia?: (id: number | string) => void;
  /** "Tentar de novo" quando o grimório não carregou (B13). */
  onRetry?: () => void;
  loading?: boolean;
  error?: string | null;
  isLight?: boolean;
}

const GrimorioBlock = ({
  magias = [],
  slots = 0,
  selecionadas = [],
  onToggleMagia,
  onRetry,
  loading = false,
  error = null,
  isLight = false,
}: GrimorioBlockProps) => {
  const [busca, setBusca] = useState('');
  const [escolaFiltro, setEscolaFiltro] = useState<string | null>(null);

  const selecionadasSet = useMemo(() => new Set(selecionadas.map(String)), [selecionadas]);

  const escolas = useMemo<string[]>(() => {
    const set = new Set<string>();
    magias.forEach(m => { if (m.escola_magia) set.add(m.escola_magia); });
    return [...set].sort();
  }, [magias]);

  const magiasFiltradas = useMemo(() => {
    let resultado = magias;
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      resultado = resultado.filter(m =>
        m.nome?.toLowerCase().includes(termo) ||
        m.descricao?.toLowerCase().includes(termo)
      );
    }
    if (escolaFiltro) {
      resultado = resultado.filter(m => m.escola_magia === escolaFiltro);
    }
    return resultado;
  }, [magias, busca, escolaFiltro]);

  const podeSelecionar = selecionadas.length < slots;

  if (loading) {
    return (
      <section className="border border-[var(--border)] bg-[var(--card)] rounded-xl p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="bg-[var(--primary)]/15 text-[var(--primary)] inline-flex h-11 w-11 items-center justify-center rounded-2xl">
            <Loader2 size={18} className="animate-spin" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-modern font-semibold text-[var(--muted-foreground)]">
              Grimorio
            </p>
            <h3 className={`mt-2 text-2xl font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Consultando o grimorio
            </h3>
            <p className={`mt-2 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Buscando as magias disponiveis para a sua vocacao e nivel...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="border border-[var(--border)] bg-[var(--card)] rounded-xl p-5 md:p-6">
        <div role="alert" className="flex items-start gap-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-modern font-semibold text-amber-500">
              Grimório indisponível
            </p>
            <p className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              {mensagemDeErro(error)}
            </p>
          </div>
          {onRetry && (
            <button type="button" onClick={onRetry} className={`btn-rpg-secondary inline-flex shrink-0 items-center gap-2 cursor-pointer ${FOCO}`}>
              <RefreshCw size={12} />
              Tentar de novo
            </button>
          )}
        </div>
      </section>
    );
  }
  // Classe sem magia no nível 1: chega aqui só na revisita (na primeira vez a etapa é pulada).
  if (slots === 0) {
    return (
      <section className="border border-[var(--border)] bg-[var(--card)] rounded-xl p-5 md:p-6">
        <p className={`font-fantasy text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Sua classe não conjura magias no nível 1</p>
        <p className="mt-1 font-modern text-sm text-[var(--muted-foreground)]">Não há magias para escolher nesta etapa. Continue para finalizar o personagem.</p>
      </section>
    );
  }

  return (
    <section className="border border-[var(--border)] bg-[var(--card)] rounded-xl p-5 md:p-6">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[var(--primary)]/15 text-[var(--primary)] inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-modern font-semibold">
                <BookOpen size={12} />
                Grimorio
              </span>
              <span className="bg-emerald-500/15 text-emerald-500 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-modern font-semibold">
                <Sparkles size={12} />
                {magias.length} magias disponiveis
              </span>
            </div>
            <h3 className={`mt-3 text-2xl font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Selecione suas magias iniciais
            </h3>
            <p className={`mt-2 max-w-3xl text-sm font-modern leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Escolha ate {slots} {slots === 1 ? 'magia' : 'magias'} para compor o grimorio inicial do personagem.
            </p>
          </div>

          <div className="bg-[var(--muted)]/40 flex shrink-0 flex-col gap-1 rounded-2xl px-4 py-3">
            <span className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
              Slots
            </span>
            <span className={`text-lg font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {selecionadas.length}/{slots}
            </span>
            <span className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-[var(--muted-foreground)]'}`}>
              {slots - selecionadas.length} restantes
            </span>
          </div>
        </div>

        {/* Search + escola filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className={`flex flex-1 items-center gap-2 rounded-2xl border px-3 py-2.5 ${isLight ? 'border-slate-200 bg-white/90' : 'border-slate-700 bg-slate-950/70'}`}>
            <Search size={14} className={isLight ? 'text-slate-400' : 'text-[var(--muted-foreground)]'} />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar magias..."
              className={`flex-1 bg-transparent text-sm font-modern outline-none ${isLight ? 'text-slate-700 placeholder-slate-400' : 'text-slate-100 placeholder-slate-500'}`}
            />
            {busca && (
              <button type="button" aria-label="Limpar busca" onClick={() => setBusca('')} className={`cursor-pointer rounded ${FOCO}`}>
                <X size={12} className={isLight ? 'text-slate-400' : 'text-[var(--muted-foreground)]'} />
              </button>
            )}
          </div>
          {escolas.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {escolas.map(escola => (
                <button
                  key={escola}
                  type="button"
                  onClick={() => setEscolaFiltro(prev => prev === escola ? null : escola)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-modern font-semibold transition-all cursor-pointer ${
                    escolaFiltro === escola
                      ? (ESCOLA_COLORS[escola] || 'bg-[var(--primary)]/15 text-[var(--primary)]')
                      : 'bg-[var(--muted)]/40 hover:opacity-80'
                  }`}
                >
                  {ESCOLA_LABELS[escola] || escola}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Spell grid */}
        <div className="bg-[var(--muted)]/40 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2 mb-4">
            <p className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
              Magias elegiveis
            </p>
            <span className="bg-[var(--primary)]/15 text-[var(--primary)] rounded-full px-3 py-1 text-[10px] font-modern font-semibold">
              {magiasFiltradas.length} resultados
            </span>
          </div>

          {magiasFiltradas.length === 0 ? (
            <div className={`rounded-2xl border border-dashed p-4 text-sm font-modern text-center ${isLight ? 'border-slate-300 text-slate-500' : 'border-[var(--border)] text-[var(--muted-foreground)]'}`}>
              {busca || escolaFiltro ? 'Nenhuma magia encontrada com esses filtros.' : 'Nenhuma magia disponivel para esta vocacao.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {magiasFiltradas.map(magia => {
                const selected = selecionadasSet.has(String(magia.id));
                const disabled = !selected && !podeSelecionar;

                return (
                  <button
                    key={magia.id}
                    type="button"
                    onClick={() => magia.id != null && onToggleMagia?.(magia.id)}
                    disabled={disabled}
                    className={`group relative rounded-2xl border border-l-4 p-4 text-left transition-all cursor-pointer ${
                      selected
                        ? 'border-[var(--primary)]/60 bg-[var(--primary)]/8'
                        : disabled
                          ? 'cursor-not-allowed opacity-50 border-[var(--border)]'
                          : isLight
                            ? 'border-slate-200 bg-white/70 hover:border-[var(--primary)]/40'
                            : 'border-[var(--border)] bg-black/15 hover:border-[var(--primary)]/40'
                    }`}
                  >
                    {/* Selection indicator */}
                    <div className="absolute right-3 top-3">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                        selected
                          ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                          : isLight
                            ? 'border-slate-300'
                            : 'border-slate-600'
                      }`}>
                        {selected && <Check size={12} />}
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pr-8">
                      {magia.escola_magia && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-modern font-semibold ${ESCOLA_COLORS[magia.escola_magia] || 'bg-[var(--primary)]/15 text-[var(--primary)]'}`}>
                          {ESCOLA_LABELS[magia.escola_magia] || magia.escola_magia}
                        </span>
                      )}
                      {(magia.custo_mana ?? 0) > 0 && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] tabular-nums ${isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/15 text-blue-300'}`}>
                          {magia.custo_mana} mana
                        </span>
                      )}
                      {magia.tipo && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-modern ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'}`}>
                          {magia.tipo}
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <h4 className={`mt-2.5 text-base font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {magia.nome}
                    </h4>

                    {/* Description */}
                    {magia.descricao && (
                      <p className={`mt-1.5 text-xs font-modern leading-relaxed line-clamp-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        {magia.descricao}
                      </p>
                    )}

                    {/* Extra info */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[10px] font-modern">
                      {magia.alcance && (
                        <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                          Alcance: {magia.alcance}
                        </span>
                      )}
                      {magia.alvo && (
                        <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                          Alvo: {magia.alvo}
                        </span>
                      )}
                      {magia.tempo_conjuracao && (
                        <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                          Tempo: {magia.tempo_conjuracao}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
                Grimorio do personagem
              </p>
              <p role="status" className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                {selecionadas.length} de {slots} slots preenchidos.
                {selecionadas.length === 0 ? ' Selecione magias acima.' : ' Para seguir, use Confirmar magias no rodapé.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GrimorioBlock;
