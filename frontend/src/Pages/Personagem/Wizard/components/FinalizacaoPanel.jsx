import React from 'react';
import { Shield, Swords, Wand2, Feather, BookOpen, Gem, RefreshCw, Check, ArrowRight } from 'lucide-react';

/**
 * Painel de finalizacao pos-criacao de personagem.
 *
 * Layout responsivo:
 * - Mobile: coluna unica vertical
 * - Desktop (md+): intro em row (fala + ficha), combo + recomendacoes em grid 2 colunas
 */
const FinalizacaoPanel = ({
  data,
  onFechar,
  onUpdate,
  isLight,
  onAplicarEquipamentos,
  aplicandoEquipamentos,
  equipamentosAplicados,
  equipamentosFalhas,
  onRegenerarEquipamentos,
  regeneracoesUsadas,
  regenerando,
}) => {
  if (!data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-sm font-modern text-[var(--wa-muted)]">Dados de finalizacao indisponiveis.</p>
        <button
          onClick={onFechar}
          className="rounded-xl border border-[var(--wa-border)] px-6 py-2.5 text-sm font-modern font-semibold text-[var(--wa-muted)] transition-colors hover:text-[var(--wa-ink)] cursor-pointer"
        >
          Ir para personagens
        </button>
      </div>
    );
  }

  const { fala_personagem, leitura_ficha, combo, meta, snapshot } = data;
  const equipamentos = combo?.equipamentos || [];
  const habilidades = combo?.habilidades || [];
  const magias = combo?.magias || [];
  const recomendacoes = [
    ...habilidades.map(h => ({ ...h, _tipo: 'habilidade' })),
    ...magias.map(m => ({ ...m, _tipo: 'magia' })),
  ];

  const handleFalaChange = (e) => {
    onUpdate(prev => ({ ...prev, fala_personagem: e.target.value }));
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-5 py-8 md:px-8 md:py-10">

      {/* ── Bloco 1: Introducao (full-width, conteudo em row no desktop) ── */}
      <section className="wa-stage-enter wa-stagger-1 space-y-5">
        {/* Titulo + Meta */}
        <div>
          <h1 className={`text-xl font-modern font-bold tracking-tight md:text-2xl ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
            <Gem size={20} className="mr-2 inline-block text-[var(--wa-accent)]" />
            Forja Concluida
            {snapshot?.nome && <span className="text-[var(--wa-accent)]"> — {snapshot.nome}</span>}
          </h1>

          {meta && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <MetaBadge label="Nivel" value={meta.nivel} isLight={isLight} />
              <MetaBadge label="Tier" value={meta.tier} isLight={isLight} />
              <MetaBadge label="Saldo" value={meta.pontos_restantes} isLight={isLight} />
            </div>
          )}
        </div>

        {/* Fala + Leitura lado a lado no desktop */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Fala do Personagem */}
          <div>
            <label className={`mb-1.5 flex items-center gap-1.5 text-[11px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
              <Feather size={12} />
              Primeiras palavras
            </label>
            <textarea
              value={fala_personagem || ''}
              onChange={handleFalaChange}
              rows={3}
              className={`w-full resize-y rounded-xl border px-4 py-3 text-sm font-modern italic leading-relaxed transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--wa-accent)]/40 ${
                isLight
                  ? 'border-slate-200 bg-white text-slate-700 placeholder-slate-400'
                  : 'border-[var(--wa-border)] bg-[var(--wa-bg-deep,rgba(13,11,26,0.5))] text-slate-300 placeholder-slate-500'
              }`}
              placeholder="A fala introdutoria do personagem..."
            />
          </div>

          {/* Leitura da Ficha */}
          {leitura_ficha && (
            <div className={`flex flex-col rounded-xl border-l-2 border-l-[var(--wa-accent)] py-3 pl-4 pr-3 ${
              isLight ? 'bg-slate-50' : 'bg-[rgba(139,92,246,0.04)]'
            }`}>
              <div className="mb-1.5 flex items-center gap-1.5">
                <BookOpen size={12} className="text-[var(--wa-accent)]" />
                <span className={`text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
                  Leitura da Ficha
                </span>
              </div>
              <p className={`whitespace-pre-wrap text-sm font-modern leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {leitura_ficha}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Blocos 2+3: Grid 2 colunas no desktop ── */}
      <div className="grid gap-6 md:grid-cols-2 md:items-start">

        {/* ── Bloco 2: Combo de Equipamentos (decisao principal) ── */}
        <section className="wa-combo-block wa-stage-enter wa-stagger-2 rounded-2xl p-6 md:p-7">
          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center gap-2.5">
              <Shield size={18} className="text-[var(--wa-accent)]" />
              <h2 className={`text-base font-modern font-bold tracking-tight ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                Combo Inicial do Mestre
              </h2>
              <span className="wa-accent-chip ml-auto rounded-full px-2.5 py-1 text-[10px] font-modern font-bold">
                {equipamentos.length} {equipamentos.length === 1 ? 'item' : 'itens'}
              </span>
            </div>
            <p className={`mt-1.5 text-xs font-modern ${
              equipamentosFalhas
                ? 'text-amber-400'
                : isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              {equipamentosAplicados
                ? 'Equipamentos adicionados ao inventario com sucesso.'
                : equipamentosFalhas
                  ? equipamentosFalhas.falhas === equipamentosFalhas.total
                    ? 'Falha ao aplicar equipamentos — tente novamente.'
                    : `${equipamentosFalhas.total - equipamentosFalhas.falhas} de ${equipamentosFalhas.total} aplicados — ${equipamentosFalhas.falhas} falharam. Tente novamente.`
                  : 'Sugestao baseada na sua build — aplique para adicionar ao inventario.'}
            </p>
          </div>

          {/* Lista de equipamentos */}
          {equipamentos.length === 0 ? (
            <p className={`text-sm font-modern ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
              Nenhum equipamento sugerido para esta build.
            </p>
          ) : (
            <div className="space-y-2.5">
              {equipamentos.map(item => (
                <div
                  key={item.id}
                  className={`rounded-xl border-l-4 border-l-purple-500 px-4 py-3 ${
                    isLight
                      ? 'border border-l-4 border-slate-200 bg-white/60'
                      : 'border border-l-4 border-[var(--wa-border)] bg-[rgba(13,11,26,0.4)]'
                  }`}
                >
                  <p className={`text-sm font-modern font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    {item.nome}
                  </p>
                  {item.motivo && (
                    <p className="mt-0.5 text-xs font-modern text-[var(--wa-muted)] italic">{item.motivo}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Acoes */}
          <div className="mt-6 space-y-3">
            <button
              onClick={onAplicarEquipamentos}
              disabled={aplicandoEquipamentos || equipamentosAplicados || equipamentos.length === 0}
              className={`w-full rounded-xl px-6 py-3 text-sm font-modern font-bold tracking-wide transition-all cursor-pointer ${
                equipamentosAplicados
                  ? 'bg-emerald-500/15 text-emerald-400 cursor-default'
                  : aplicandoEquipamentos
                    ? 'bg-[var(--wa-accent)] text-white opacity-60 cursor-wait'
                    : equipamentosFalhas
                      ? 'bg-amber-500/80 text-white hover:bg-amber-500 hover:-translate-y-0.5'
                      : equipamentos.length === 0
                        ? isLight ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-[rgba(139,92,246,0.1)] text-slate-500 cursor-not-allowed'
                        : 'bg-[var(--wa-accent)] text-white hover:brightness-110 hover:-translate-y-0.5'
              }`}
            >
              {equipamentosAplicados
                ? <span className="inline-flex items-center gap-2"><Check size={16} /> Combo aplicado</span>
                : aplicandoEquipamentos
                  ? 'Aplicando...'
                  : equipamentosFalhas
                    ? 'Tentar novamente'
                    : 'Usar este combo'}
            </button>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onRegenerarEquipamentos}
                disabled={(3 - (regeneracoesUsadas || 0)) <= 0 || regenerando || equipamentosAplicados}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-modern font-semibold transition-all cursor-pointer ${
                  (3 - (regeneracoesUsadas || 0)) <= 0 || equipamentosAplicados
                    ? isLight ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 cursor-not-allowed'
                    : regenerando
                      ? isLight ? 'text-slate-500 cursor-wait' : 'text-slate-400 cursor-wait'
                      : isLight ? 'text-slate-600 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <RefreshCw size={13} className={regenerando ? 'animate-spin' : ''} />
                {regenerando ? 'Regenerando...' : 'Regenerar combo'}
              </button>
              <span className={`wa-accent-chip rounded-full px-2.5 py-1 text-[10px] font-modern font-bold ${
                (3 - (regeneracoesUsadas || 0)) <= 0 ? 'opacity-50' : ''
              }`}>
                {3 - (regeneracoesUsadas || 0)}/3
              </span>
            </div>
          </div>
        </section>

        {/* ── Bloco 3: Recomendacoes secundarias ── */}
        {recomendacoes.length > 0 && (
          <section className="wa-panel-soft wa-stage-enter wa-stagger-3 rounded-2xl p-5">
            <div className="mb-4">
              <h2 className={`text-xs font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-600' : 'text-[var(--wa-muted)]'}`}>
                Recomendacoes do Mestre
              </h2>
              <p className={`mt-1 text-[11px] font-modern italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                Nao serao aplicadas automaticamente — consulte durante o jogo.
              </p>
            </div>

            <div className="space-y-2">
              {recomendacoes.map(item => (
                <div
                  key={`${item._tipo}-${item.id}`}
                  className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${
                    isLight ? 'bg-white/40' : 'bg-[rgba(255,255,255,0.02)]'
                  }`}
                >
                  <span className={`mt-0.5 shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    {item._tipo === 'magia' ? <Wand2 size={13} /> : <Swords size={13} />}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm font-modern font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {item.nome}
                    </p>
                    {item.motivo && (
                      <p className="mt-0.5 text-xs font-modern text-[var(--wa-muted)]">{item.motivo}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Bloco 4: Saida (full-width) ── */}
      <section className={`wa-stage-enter wa-stagger-4 border-t pt-6 ${isLight ? 'border-slate-200' : 'border-[var(--wa-border)]'}`}>
        <button
          onClick={onFechar}
          className={`inline-flex items-center gap-2 rounded-xl border px-6 py-2.5 text-sm font-modern font-semibold transition-all cursor-pointer ${
            isLight
              ? 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800'
              : 'border-[var(--wa-border)] text-[var(--wa-muted)] hover:border-[var(--wa-accent)]/30 hover:text-slate-200'
          }`}
        >
          Concluir
          <ArrowRight size={14} />
        </button>
        <p className={`mt-2 text-[11px] font-modern ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
          Ir para seus personagens
        </p>
      </section>
    </div>
  );
};

// ── Subcomponente interno ──

const MetaBadge = ({ label, value, isLight }) => (
  <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-modern ${
    isLight ? 'bg-slate-100 text-slate-700' : 'bg-[rgba(255,255,255,0.05)] text-slate-300'
  }`}>
    <span className="font-semibold uppercase tracking-wider text-[9px] text-[var(--wa-muted)]">{label}</span>
    <span className="font-bold">{value ?? '—'}</span>
  </div>
);

export default FinalizacaoPanel;
