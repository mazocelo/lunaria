import React, { useMemo } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ScrollText,
  Shield,
  Sparkles,
  Swords,
} from 'lucide-react';

const PERFIL_LABELS = {
  contido: 'Combo contido',
  equilibrado: 'Combo equilibrado',
  amplo: 'Combo amplo',
};

const ATTR_LABELS = {
  forca: 'FOR',
  destreza: 'DES',
  constituicao: 'CON',
  inteligencia: 'INT',
  agilidade: 'AGI',
  carisma: 'CAR',
};

function buildItensCombo(combo = {}) {
  return [
    ...(combo.equipamentos || []).map((item) => ({
      ...item,
      grupo: 'Equipamento',
      badge: 'Inventario',
      badgeClass: 'wa-forge-chip',
      barClass: 'border-[var(--wa-accent)]/35',
    })),
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
}

const DestinoResolutivaBlock = ({
  data,
  loading = false,
  error = null,
  onRetry,
  onCriar,
  podeCriar = false,
  salvando = false,
  creationFlowStatus = 'idle',
  isLight = false,
}) => {
  const itensCombo = useMemo(() => buildItensCombo(data?.combo), [data]);
  const snapshot = data?.snapshot || {};
  const meta = data?.meta || {};
  const criando = salvando || creationFlowStatus !== 'idle';

  if (loading && !data) {
    return (
      <section className="wa-combo-block wa-stage-enter wa-stagger-2 rounded-[28px] p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="wa-accent-chip inline-flex h-11 w-11 items-center justify-center rounded-2xl">
            <Loader2 size={18} className="animate-spin" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
              Resolutiva do Mestre
            </p>
            <h3 className={`mt-2 text-2xl font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Selando o destino da ficha
            </h3>
            <p className={`mt-2 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              O Mestre esta cruzando a build, o saldo de criacao e os catalogos elegiveis para montar um combo final coerente.
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
                <Sparkles size={12} />
                Resolutiva do Mestre
              </span>
              <span className="wa-teal-chip inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em]">
                <Shield size={12} />
                {PERFIL_LABELS[meta.perfil_combo] || 'Combo equilibrado'}
              </span>
            </div>
            <h3 className={`mt-3 text-2xl font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Esta e a leitura final usada para selar a ficha
            </h3>
            <p className={`mt-2 max-w-3xl text-sm font-modern leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              O combo abaixo nasce da sua build atual. Equipamentos entram na criacao; habilidades e magias continuam como recomendacao de leitura e postura.
            </p>
          </div>

        </div>

        {error && (
          <div className="wa-panel-soft flex items-start gap-3 rounded-2xl border border-[var(--wa-ember)]/30 px-4 py-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--wa-ember)]" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-ember)]">
                Resolutiva indisponivel
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

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="wa-panel-soft rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[var(--wa-accent)]" />
                <span className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
                  Resumo da ficha
                </span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">Nome</p>
                  <p className={`mt-1 text-base font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{snapshot.nome || 'Sem nome'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">Leitura base</p>
                  <p className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                    {[snapshot.raca, snapshot.classe].filter(Boolean).join(' • ')}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="wa-forge-chip rounded-full px-3 py-1 text-[11px] font-modern font-semibold">
                  Saldo de criacao {meta.pontos_restantes ?? 0}
                </span>
                <span className="wa-accent-chip rounded-full px-3 py-1 text-[11px] font-modern font-semibold">
                  Nivel {meta.nivel ?? 1}
                </span>
                <span className="wa-teal-chip rounded-full px-3 py-1 text-[11px] font-modern font-semibold">
                  Tier {meta.tier ?? 1}
                </span>
              </div>
            </div>

            <div className="wa-panel-soft rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <ScrollText size={14} className="text-[var(--wa-accent)]" />
                <span className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
                  Primeiras palavras
                </span>
              </div>
              <blockquote className={`mt-3 border-l-2 border-[var(--wa-accent)] pl-4 text-sm font-modern italic leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                {data?.fala_personagem || 'A fala do personagem ainda esta sendo preparada.'}
              </blockquote>
            </div>

            <div className="wa-panel-soft rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[var(--wa-accent)]" />
                <span className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
                  Leitura da ficha
                </span>
              </div>
              <p className={`mt-3 text-sm font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                {data?.leitura_ficha || 'Leitura da build indisponivel.'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="wa-panel-soft rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <Swords size={14} className="text-[var(--wa-accent)]" />
                <span className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
                  Atributos finais
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {Object.entries(ATTR_LABELS).map(([key, label]) => (
                  <div key={key} className={`rounded-xl border px-3 py-2 text-center ${isLight ? 'border-slate-200 bg-white/70' : 'border-[var(--wa-border)] bg-black/15'}`}>
                    <p className="text-[10px] font-modern font-semibold uppercase tracking-[0.16em] text-[var(--wa-muted)]">{label}</p>
                    <p className={`mt-1 text-lg font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {snapshot.atributos?.[key] ?? '-'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="wa-panel-soft rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
                    Combo unificado
                  </p>
                  <p className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    Um unico pacote final para entrar no mundo.
                  </p>
                </div>
                <span className="wa-accent-chip rounded-full px-3 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em]">
                  {itensCombo.length} itens
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {itensCombo.length === 0 && (
                  <div className={`rounded-2xl border border-dashed p-4 text-sm font-modern ${isLight ? 'border-slate-300 text-slate-500' : 'border-[var(--wa-border)] text-[var(--wa-muted)]'}`}>
                    Nenhum item elegivel foi encontrado para esta leitura.
                  </div>
                )}

                {itensCombo.map((item, index) => (
                  <article
                    key={`${item.grupo}-${item.id}-${index}`}
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
          </div>
        </div>

        <div className="border-t border-[var(--wa-border)] pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
                Selo da etapa
              </p>
              <p className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Criar usa este combo exatamente como ele esta agora. Volte ao Arsenal para regenerar.
              </p>
            </div>

            <button
              type="button"
              onClick={onCriar}
              disabled={!podeCriar || criando || loading || !data}
              className={`inline-flex min-w-[14rem] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-modern font-semibold transition-all ${
                !podeCriar || criando || loading || !data
                  ? 'cursor-not-allowed bg-slate-600 text-slate-300 opacity-70'
                  : 'bg-gradient-to-br from-[var(--wa-accent)] to-[var(--wa-teal)] text-white shadow-lg hover:-translate-y-0.5'
              }`}
            >
              {criando ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {criando ? 'Selando...' : 'Criar personagem'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DestinoResolutivaBlock;
