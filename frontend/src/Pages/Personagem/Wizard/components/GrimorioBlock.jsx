import React, { useState, useMemo } from 'react';
import {
  Loader2,
  AlertTriangle,
  Check,
  ChevronRight,
  Search,
  X,
  Sparkles,
  BookOpen,
} from 'lucide-react';

const ESCOLA_LABELS = {
  evocacao: 'Evocacao',
  abjuracao: 'Abjuracao',
  conjuracao: 'Conjuracao',
  transmutacao: 'Transmutacao',
  adivinhacao: 'Adivinhacao',
  encantamento: 'Encantamento',
  ilusao: 'Ilusao',
  necromancia: 'Necromancia',
};

const ESCOLA_COLORS = {
  evocacao: 'wa-ember-chip',
  abjuracao: 'wa-teal-chip',
  conjuracao: 'wa-accent-chip',
  transmutacao: 'wa-forge-chip',
  adivinhacao: 'wa-emerald-chip',
  encantamento: 'wa-accent-chip',
  ilusao: 'wa-forge-chip',
  necromancia: 'wa-ember-chip',
};

const GrimorioBlock = ({
  magias = [],
  slots = 0,
  selecionadas = [],
  onToggleMagia,
  onContinuar,
  loading = false,
  error = null,
  isLight = false,
}) => {
  const [busca, setBusca] = useState('');
  const [escolaFiltro, setEscolaFiltro] = useState(null);

  const selecionadasSet = useMemo(() => new Set(selecionadas.map(String)), [selecionadas]);

  const escolas = useMemo(() => {
    const set = new Set();
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
      <section className="wa-combo-block wa-stage-enter wa-stagger-2 rounded-[28px] p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="wa-accent-chip inline-flex h-11 w-11 items-center justify-center rounded-2xl">
            <Loader2 size={18} className="animate-spin" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
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
      <section className="wa-combo-block wa-stage-enter wa-stagger-2 rounded-[28px] p-5 md:p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--wa-ember)]" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-ember)]">
              Grimorio indisponivel
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
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="wa-accent-chip inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em]">
                <BookOpen size={12} />
                Grimorio
              </span>
              <span className="wa-teal-chip inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em]">
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

          <div className="wa-panel-soft flex shrink-0 flex-col gap-1 rounded-2xl px-4 py-3">
            <span className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
              Slots
            </span>
            <span className={`text-lg font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {selecionadas.length}/{slots}
            </span>
            <span className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
              {slots - selecionadas.length} restantes
            </span>
          </div>
        </div>

        {/* Search + escola filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className={`flex flex-1 items-center gap-2 rounded-2xl border px-3 py-2.5 ${isLight ? 'border-slate-200 bg-white/90' : 'border-slate-700 bg-slate-950/70'}`}>
            <Search size={14} className={isLight ? 'text-slate-400' : 'text-[var(--wa-muted)]'} />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar magias..."
              className={`flex-1 bg-transparent text-sm font-modern outline-none ${isLight ? 'text-slate-700 placeholder-slate-400' : 'text-slate-100 placeholder-slate-500'}`}
            />
            {busca && (
              <button type="button" onClick={() => setBusca('')} className="cursor-pointer">
                <X size={12} className={isLight ? 'text-slate-400' : 'text-[var(--wa-muted)]'} />
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
                  className={`rounded-full px-2.5 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em] transition-all cursor-pointer ${
                    escolaFiltro === escola
                      ? (ESCOLA_COLORS[escola] || 'wa-accent-chip')
                      : 'wa-panel-soft hover:opacity-80'
                  }`}
                >
                  {ESCOLA_LABELS[escola] || escola}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Spell grid */}
        <div className="wa-panel-soft rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2 mb-4">
            <p className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
              Magias elegiveis
            </p>
            <span className="wa-accent-chip rounded-full px-3 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em]">
              {magiasFiltradas.length} resultados
            </span>
          </div>

          {magiasFiltradas.length === 0 ? (
            <div className={`rounded-2xl border border-dashed p-4 text-sm font-modern text-center ${isLight ? 'border-slate-300 text-slate-500' : 'border-[var(--wa-border)] text-[var(--wa-muted)]'}`}>
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
                    onClick={() => onToggleMagia(magia.id)}
                    disabled={disabled}
                    className={`group relative rounded-2xl border border-l-4 p-4 text-left transition-all cursor-pointer ${
                      selected
                        ? 'border-[var(--wa-accent)]/60 bg-[var(--wa-accent)]/8'
                        : disabled
                          ? 'cursor-not-allowed opacity-50 border-[var(--wa-border)]'
                          : isLight
                            ? 'border-slate-200 bg-white/70 hover:border-[var(--wa-accent)]/40'
                            : 'border-[var(--wa-border)] bg-black/15 hover:border-[var(--wa-accent)]/40'
                    }`}
                  >
                    {/* Selection indicator */}
                    <div className="absolute right-3 top-3">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                        selected
                          ? 'border-[var(--wa-accent)] bg-[var(--wa-accent)] text-white'
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
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${ESCOLA_COLORS[magia.escola_magia] || 'wa-accent-chip'}`}>
                          {ESCOLA_LABELS[magia.escola_magia] || magia.escola_magia}
                        </span>
                      )}
                      {magia.custo_mana > 0 && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/15 text-blue-300'}`}>
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
        <div className="border-t border-[var(--wa-border)] pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
                Grimorio do personagem
              </p>
              <p className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                {selecionadas.length === 0
                  ? 'Selecione magias acima para preencher os slots disponiveis.'
                  : `${selecionadas.length} de ${slots} slots preenchidos. Confirme para avancar.`
                }
              </p>
            </div>

            <button
              type="button"
              onClick={onContinuar}
              disabled={selecionadas.length === 0}
              className={`inline-flex min-w-[14rem] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-modern font-semibold transition-all ${
                selecionadas.length === 0
                  ? 'cursor-not-allowed bg-slate-600 text-slate-300 opacity-70'
                  : 'bg-gradient-to-br from-[var(--wa-accent)] to-[var(--wa-teal)] text-white shadow-lg hover:-translate-y-0.5'
              }`}
            >
              <ChevronRight size={16} />
              Confirmar magias ({selecionadas.length}/{slots})
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GrimorioBlock;
