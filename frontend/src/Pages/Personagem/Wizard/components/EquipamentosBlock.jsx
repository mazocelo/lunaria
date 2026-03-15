import React, { useMemo } from 'react';
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  Shield,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const PERFIL_LABELS = {
  contido: 'Combo contido',
  equilibrado: 'Combo equilibrado',
  amplo: 'Combo amplo',
};

function buildItensAgrupados(combo = {}) {
  const inventario = (combo.equipamentos || []).map((item) => ({
    ...item,
    grupo: 'Equipamento',
    badge: 'Inventario',
    badgeClass: 'wa-forge-chip',
    barClass: 'border-[var(--wa-accent)]/35',
  }));

  const recomendacoes = [
    ...(combo.habilidades || []).map((item) => ({
      ...item,
      grupo: 'Habilidade',
      badge: 'Recomendacao',
      badgeClass: 'wa-teal-chip',
      barClass: 'border-[var(--wa-teal)]/35',
    })),
    ...(combo.magias || []).map((item) => ({
      ...item,
      grupo: 'Magia',
      badge: 'Recomendacao',
      badgeClass: 'wa-accent-chip',
      barClass: 'border-[var(--wa-accent-bright)]/35',
    })),
  ];

  return { inventario, recomendacoes };
}

const EquipamentosBlock = ({
  data,
  loading = false,
  error = null,
  tentativasUsadas = 0,
  onRegenerar,
  onRetry,
  onContinuar,
  isLight = false,
}) => {
  const { inventario, recomendacoes } = useMemo(() => buildItensAgrupados(data?.combo), [data]);
  const meta = data?.meta || {};
  const tentativasRestantes = Math.max(0, 3 - tentativasUsadas);

  if (loading && !data) {
    return (
      <section className="wa-combo-block wa-stage-enter wa-stagger-2 rounded-[28px] p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="wa-accent-chip inline-flex h-11 w-11 items-center justify-center rounded-2xl">
            <Loader2 size={18} className="animate-spin" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
              Arsenal do Mestre
            </p>
            <h3 className={`mt-2 text-2xl font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Montando o arsenal inicial
            </h3>
            <p className={`mt-2 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              O Mestre esta cruzando a build com os catalogos elegiveis para selecionar equipamentos e recomendacoes taticas.
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
              <span className="wa-accent-chip inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em]">
                <Shield size={12} />
                Arsenal do Mestre
              </span>
              <span className="wa-teal-chip inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em]">
                <Sparkles size={12} />
                {PERFIL_LABELS[meta.perfil_combo] || 'Combo equilibrado'}
              </span>
            </div>
            <h3 className={`mt-3 text-2xl font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Equipamentos e recomendacoes taticas
            </h3>
            <p className={`mt-2 max-w-3xl text-sm font-modern leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Equipamentos entram no inventario na criacao. Habilidades e magias sao recomendacoes de leitura do Mestre.
            </p>
          </div>

          <div className="wa-panel-soft flex shrink-0 flex-col gap-1 rounded-2xl px-4 py-3">
            <span className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
              Regeneracoes
            </span>
            <span className={`text-lg font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {tentativasUsadas}/3
            </span>
            <span className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
              {tentativasRestantes} restantes
            </span>
          </div>
        </div>

        {error && (
          <div className="wa-panel-soft flex items-start gap-3 rounded-2xl border border-[var(--wa-ember)]/30 px-4 py-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--wa-ember)]" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-ember)]">
                Arsenal indisponivel
              </p>
              <p className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                {error}
              </p>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                disabled={loading}
                className="wa-panel-soft inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-modern font-semibold hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Tentar novamente
              </button>
            )}
          </div>
        )}

        {/* Inventário — equipamentos que entram na criação */}
        <div className="wa-panel-soft rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
                Inventario inicial
              </p>
              <p className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Estes equipamentos serao adicionados ao inventario na criacao.
              </p>
            </div>
            <span className="wa-forge-chip rounded-full px-3 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em]">
              {inventario.length} itens
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {inventario.length === 0 && (
              <div className={`rounded-2xl border border-dashed p-4 text-sm font-modern ${isLight ? 'border-slate-300 text-slate-500' : 'border-[var(--wa-border)] text-[var(--wa-muted)]'}`}>
                Nenhum equipamento elegivel encontrado para esta build.
              </div>
            )}
            {inventario.map((item, index) => (
              <article
                key={`equip-${item.id}-${index}`}
                className={`rounded-2xl border border-l-4 p-4 ${item.barClass} ${isLight ? 'bg-white/70' : 'bg-black/15'}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${item.badgeClass}`}>
                    {item.badge}
                  </span>
                  <span className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
                    {item.grupo}
                  </span>
                </div>
                <h4 className={`mt-3 text-base font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {item.nome}
                </h4>
                {item.motivo && (
                  <p className={`mt-2 text-sm font-modern leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    {item.motivo}
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>

        {/* Recomendações táticas — habilidades e magias */}
        {recomendacoes.length > 0 && (
          <div className="wa-panel-soft rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
                  Recomendacoes taticas
                </p>
                <p className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Sugestoes do Mestre para habilidades e magias. Nao sao persistidas na criacao.
                </p>
              </div>
              <span className="wa-teal-chip rounded-full px-3 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em]">
                {recomendacoes.length} sugestoes
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {recomendacoes.map((item, index) => (
                <article
                  key={`rec-${item.id}-${index}`}
                  className={`rounded-2xl border border-l-4 p-4 ${item.barClass} ${isLight ? 'bg-white/70' : 'bg-black/15'}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${item.badgeClass}`}>
                      {item.badge}
                    </span>
                    <span className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
                      {item.grupo}
                    </span>
                  </div>
                  <h4 className={`mt-3 text-base font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {item.nome}
                  </h4>
                  {item.motivo && (
                    <p className={`mt-2 text-sm font-modern leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      {item.motivo}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Footer — ações */}
        <div className="border-t border-[var(--wa-border)] pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
                Arsenal da build
              </p>
              <p className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Regenerar troca todo o combo. Confirmar avanca para o resumo final.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onRegenerar}
                disabled={loading || tentativasUsadas >= 3 || !data}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-modern font-semibold transition-all ${
                  loading || tentativasUsadas >= 3 || !data
                    ? 'cursor-not-allowed opacity-60'
                    : 'wa-panel-soft hover:-translate-y-0.5'
                }`}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                {loading ? 'Regenerando...' : `Regenerar combo (${tentativasRestantes})`}
              </button>

              <button
                type="button"
                onClick={onContinuar}
                disabled={loading || !data}
                className={`inline-flex min-w-[14rem] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-modern font-semibold transition-all ${
                  loading || !data
                    ? 'cursor-not-allowed bg-slate-600 text-slate-300 opacity-70'
                    : 'bg-gradient-to-br from-[var(--wa-accent)] to-[var(--wa-teal)] text-white shadow-lg hover:-translate-y-0.5'
                }`}
              >
                <ChevronRight size={16} />
                Confirmar e continuar
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EquipamentosBlock;
