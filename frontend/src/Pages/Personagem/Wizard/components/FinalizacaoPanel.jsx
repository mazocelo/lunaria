import React from 'react';
import { Shield, Swords, Wand2, Feather, BookOpen, Gem, RefreshCw } from 'lucide-react';

/**
 * Painel de finalizacao pos-criacao de personagem.
 *
 * Equipamentos: combo fechado com regeneracao + persistencia explicita.
 * Habilidades/magias: recomendacao visual read-only.
 */
const FinalizacaoPanel = ({
  data,
  onFechar,
  onUpdate,
  isLight,
  onAplicarEquipamentos,
  aplicandoEquipamentos,
  equipamentosAplicados,
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
          className="wa-accent rounded-xl px-6 py-2.5 text-sm font-modern font-semibold transition-transform hover:-translate-y-0.5 cursor-pointer"
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

  const handleFalaChange = (e) => {
    onUpdate(prev => ({ ...prev, fala_personagem: e.target.value }));
  };

  return (
    <div className="flex flex-col gap-6 p-5 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className={`text-xl font-modern font-bold tracking-tight md:text-2xl ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
          <Gem size={20} className="mr-2 inline-block text-[var(--wa-accent)]" />
          Finalizacao
          {snapshot?.nome && <span className="text-[var(--wa-accent)]"> — {snapshot.nome}</span>}
        </h1>
        <button
          onClick={onFechar}
          className="wa-accent rounded-xl px-5 py-2 text-sm font-modern font-semibold transition-transform hover:-translate-y-0.5 cursor-pointer"
        >
          Concluir
        </button>
      </div>

      {/* Grid 2 colunas (xl) / 1 coluna (mobile) */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Coluna esquerda */}
        <div className="flex flex-col gap-5">
          {/* Fala do Personagem */}
          <section className="wa-panel-soft rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <Feather size={14} className="text-[var(--wa-accent)]" />
              <h2 className={`text-xs font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-600' : 'text-[var(--wa-muted)]'}`}>
                Fala do Personagem
              </h2>
            </div>
            <textarea
              value={fala_personagem || ''}
              onChange={handleFalaChange}
              rows={4}
              className={`w-full resize-y rounded-xl border px-4 py-3 text-sm font-modern transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--wa-accent)]/40 ${
                isLight
                  ? 'border-slate-200 bg-white text-slate-800 placeholder-slate-400'
                  : 'border-[var(--wa-border)] bg-[var(--wa-bg-deep)] text-slate-200 placeholder-slate-500'
              }`}
              placeholder="A fala introdutoria do personagem..."
            />
          </section>

          {/* Leitura da Ficha */}
          {leitura_ficha && (
            <section className="wa-panel-soft rounded-2xl p-5">
              <div className="mb-3 flex items-center gap-2">
                <BookOpen size={14} className="text-[var(--wa-accent)]" />
                <h2 className={`text-xs font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-600' : 'text-[var(--wa-muted)]'}`}>
                  Leitura da Ficha
                </h2>
              </div>
              <div className={`whitespace-pre-wrap rounded-xl border px-4 py-3 text-sm font-modern leading-relaxed ${
                isLight
                  ? 'border-slate-200 bg-slate-50 text-slate-700'
                  : 'border-[var(--wa-border)] bg-[var(--wa-bg-deep)] text-slate-300'
              }`}>
                {leitura_ficha}
              </div>
            </section>
          )}

          {/* Metadados */}
          {meta && (
            <section className="wa-panel-soft rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-4 text-xs font-modern">
                <MetaBadge label="Nivel" value={meta.nivel} isLight={isLight} />
                <MetaBadge label="Tier" value={meta.tier} isLight={isLight} />
                <MetaBadge label="Saldo Vantagens" value={meta.pontos_restantes} isLight={isLight} />
              </div>
            </section>
          )}
        </div>

        {/* Coluna direita — combo */}
        <div className="flex flex-col gap-5">
          {/* Bloco de Equipamentos (combo fechado) */}
          <EquipamentoComboBlock
            items={equipamentos}
            onRegenerar={onRegenerarEquipamentos}
            regeneracoesUsadas={regeneracoesUsadas}
            regenerando={regenerando}
            onAplicar={onAplicarEquipamentos}
            aplicando={aplicandoEquipamentos}
            aplicado={equipamentosAplicados}
            isLight={isLight}
          />

          {/* Habilidades — recomendacao read-only */}
          <RecomendacaoSection
            titulo="Habilidades Sugeridas"
            subtitulo="Recomendacoes — nao serao aplicadas automaticamente"
            icon={<Swords size={14} />}
            items={habilidades}
            accentClass="border-l-cyan-500"
            isLight={isLight}
          />

          {/* Magias — recomendacao read-only */}
          <RecomendacaoSection
            titulo="Magias Sugeridas"
            subtitulo="Recomendacoes — nao serao aplicadas automaticamente"
            icon={<Wand2 size={14} />}
            items={magias}
            accentClass="border-l-amber-500"
            isLight={isLight}
          />
        </div>
      </div>
    </div>
  );
};

// ── Subcomponentes internos ──

const MetaBadge = ({ label, value, isLight }) => (
  <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${
    isLight ? 'bg-slate-100 text-slate-700' : 'bg-[var(--wa-bg-deep)] text-slate-300'
  }`}>
    <span className="font-semibold uppercase tracking-wider text-[10px] text-[var(--wa-muted)]">{label}</span>
    <span className="font-bold">{value ?? '—'}</span>
  </div>
);

/**
 * Bloco de equipamentos: combo fechado com regeneracao e persistencia explicita.
 */
const EquipamentoComboBlock = ({ items, onRegenerar, regeneracoesUsadas, regenerando, onAplicar, aplicando, aplicado, isLight }) => {
  const maxRegens = 3;
  const regensRestantes = maxRegens - (regeneracoesUsadas || 0);

  return (
    <section className="wa-panel-soft rounded-2xl p-5">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-[var(--wa-accent)]" />
          <h2 className={`text-xs font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-600' : 'text-[var(--wa-muted)]'}`}>
            Combo de Equipamentos
          </h2>
          <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-modern font-bold ${
            isLight ? 'bg-slate-100 text-slate-600' : 'bg-[var(--wa-bg-deep)] text-slate-400'
          }`}>
            {items.length} {items.length === 1 ? 'item' : 'itens'}
          </span>
        </div>
        <p className={`mt-1.5 ml-5 text-[11px] font-modern italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
          {aplicado
            ? 'Equipamentos adicionados ao inventario'
            : 'Sugestao baseada na sua build — clique "Usar este combo" para aplicar'}
        </p>
      </div>

      {/* Lista read-only */}
      {items.length === 0 ? (
        <p className={`text-sm font-modern ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
          Nenhum equipamento sugerido para esta build.
        </p>
      ) : (
        <div className="space-y-2.5">
          {items.map(item => (
            <div
              key={item.id}
              className={`rounded-xl border-l-4 border-l-purple-500 p-3.5 ${
                isLight ? 'bg-white border border-l-4 border-slate-200' : 'bg-[var(--wa-bg-deep)] border border-l-4 border-[var(--wa-border)]'
              }`}
            >
              <p className={`text-sm font-modern font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                {item.nome}
              </p>
              {item.motivo && (
                <p className="mt-1 text-xs font-modern text-[var(--wa-muted)] italic">{item.motivo}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Acoes */}
      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
        {/* Regenerar */}
        <button
          onClick={onRegenerar}
          disabled={regensRestantes <= 0 || regenerando || aplicado}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-modern font-semibold transition-all cursor-pointer ${
            regensRestantes <= 0 || aplicado
              ? isLight ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-[var(--wa-bg-deep)] text-slate-600 cursor-not-allowed'
              : regenerando
                ? isLight ? 'bg-slate-100 text-slate-500 cursor-wait' : 'bg-[var(--wa-bg-deep)] text-slate-400 cursor-wait'
                : isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-[var(--wa-bg)] text-slate-300 hover:text-slate-100'
          }`}
        >
          <RefreshCw size={14} className={regenerando ? 'animate-spin' : ''} />
          {regenerando ? 'Regenerando...' : `Regenerar (${regensRestantes})`}
        </button>

        {/* Usar este combo */}
        <button
          onClick={onAplicar}
          disabled={aplicando || aplicado || items.length === 0}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-modern font-semibold transition-all cursor-pointer ${
            aplicado
              ? 'bg-emerald-500/15 text-emerald-400 cursor-default'
              : aplicando
                ? 'wa-accent opacity-60 cursor-wait'
                : 'wa-accent hover:-translate-y-0.5'
          }`}
        >
          {aplicado ? 'Combo aplicado' : aplicando ? 'Aplicando...' : 'Usar este combo'}
        </button>
      </div>
    </section>
  );
};

/**
 * Secao de recomendacao read-only (habilidades/magias).
 */
const RecomendacaoSection = ({ titulo, subtitulo, icon, items, accentClass, isLight }) => {
  if (!items.length) return null;

  return (
    <section className="wa-panel-soft rounded-2xl p-5">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[var(--wa-accent)]">{icon}</span>
          <h2 className={`text-xs font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-600' : 'text-[var(--wa-muted)]'}`}>
            {titulo}
          </h2>
          <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-modern font-bold ${
            isLight ? 'bg-slate-100 text-slate-600' : 'bg-[var(--wa-bg-deep)] text-slate-400'
          }`}>
            {items.length}
          </span>
        </div>
        {subtitulo && (
          <p className={`mt-1.5 ml-5 text-[11px] font-modern italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            {subtitulo}
          </p>
        )}
      </div>

      <div className="space-y-2.5">
        {items.map(item => (
          <div
            key={item.id}
            className={`rounded-xl border-l-4 ${accentClass} p-3.5 ${
              isLight ? 'bg-white border border-l-4 border-slate-200' : 'bg-[var(--wa-bg-deep)] border border-l-4 border-[var(--wa-border)]'
            }`}
          >
            <p className={`text-sm font-modern font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              {item.nome}
            </p>
            {item.motivo && (
              <p className="mt-1 text-xs font-modern text-[var(--wa-muted)] italic">{item.motivo}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default FinalizacaoPanel;
