import React, { useState, useCallback } from 'react';
import { X, ChevronDown, Shield, Swords, Wand2, Scroll, Feather, BookOpen, Gem } from 'lucide-react';

/**
 * Painel de finalizacao editavel pos-criacao de personagem.
 *
 * Props:
 *   data: { personagem_id, fala_personagem, leitura_ficha, combo, catalogo_editavel, meta }
 *   onFechar: () => void
 *   onUpdate: (updatedData | updaterFn) => void
 *   isLight: boolean
 */
const FinalizacaoPanel = ({ data, onFechar, onUpdate, isLight }) => {
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

  const { fala_personagem, leitura_ficha, combo, catalogo_editavel, meta, snapshot } = data;

  const comboVazio = !(combo?.equipamentos?.length || combo?.habilidades?.length || combo?.magias?.length);

  const handleFalaChange = useCallback((e) => {
    onUpdate(prev => ({ ...prev, fala_personagem: e.target.value }));
  }, [onUpdate]);

  const handleRemoveItem = useCallback((secao, itemId) => {
    onUpdate(prev => ({
      ...prev,
      combo: {
        ...prev.combo,
        [secao]: prev.combo[secao].filter(it => it.id !== itemId),
      },
    }));
  }, [onUpdate]);

  const handleSwapItem = useCallback((secao, oldItemId, newItem) => {
    onUpdate(prev => ({
      ...prev,
      combo: {
        ...prev.combo,
        [secao]: prev.combo[secao].map(it =>
          it.id === oldItemId ? { ...newItem, motivo: 'Substituido manualmente' } : it
        ),
      },
    }));
  }, [onUpdate]);

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

        {/* Coluna direita — combo sugerido */}
        <div className="flex flex-col gap-5">
          {comboVazio ? (
            <div className="wa-panel-soft rounded-2xl p-6 text-center">
              <p className={`text-sm font-modern ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
                Nenhum combo foi gerado para esta build. Voce pode equipar itens depois na ficha do personagem.
              </p>
            </div>
          ) : (
            <>
              <ComboSection
                titulo="Equipamentos Sugeridos"
                subtitulo="Sugestoes — equipe na ficha do personagem"
                icon={<Shield size={14} />}
                items={combo?.equipamentos || []}
                catalogo={catalogo_editavel?.equipamentos || []}
                secao="equipamentos"
                accentClass="border-l-purple-500"
                onRemove={handleRemoveItem}
                onSwap={handleSwapItem}
                isLight={isLight}
              />
              <ComboSection
                titulo="Habilidades Sugeridas"
                subtitulo="Recomendacoes — nao serao aplicadas automaticamente"
                icon={<Swords size={14} />}
                items={combo?.habilidades || []}
                catalogo={catalogo_editavel?.habilidades || []}
                secao="habilidades"
                accentClass="border-l-cyan-500"
                onRemove={handleRemoveItem}
                onSwap={handleSwapItem}
                isLight={isLight}
              />
              <ComboSection
                titulo="Magias Sugeridas"
                subtitulo="Recomendacoes — nao serao aplicadas automaticamente"
                icon={<Wand2 size={14} />}
                items={combo?.magias || []}
                catalogo={catalogo_editavel?.magias || []}
                secao="magias"
                accentClass="border-l-amber-500"
                onRemove={handleRemoveItem}
                onSwap={handleSwapItem}
                isLight={isLight}
              />
            </>
          )}
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

const ComboSection = ({ titulo, subtitulo, icon, items, catalogo, secao, accentClass, onRemove, onSwap, isLight }) => {
  if (!items.length && !catalogo.length) return null;

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

      {items.length === 0 ? (
        <p className="text-xs font-modern text-[var(--wa-muted)] italic">Nenhum item sugerido.</p>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <ComboCard
              key={item.id}
              item={item}
              catalogo={catalogo}
              secao={secao}
              accentClass={accentClass}
              onRemove={onRemove}
              onSwap={onSwap}
              isLight={isLight}
            />
          ))}
        </div>
      )}
    </section>
  );
};

const ComboCard = ({ item, catalogo, secao, accentClass, onRemove, onSwap, isLight }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  // Filtrar catalogo: excluir itens ja no combo (por id)
  const opcoesTroca = catalogo.filter(c => c.id !== item.id);

  const handleSwap = useCallback((novoItem) => {
    onSwap(secao, item.id, novoItem);
    setShowDropdown(false);
  }, [onSwap, secao, item.id]);

  return (
    <div className={`relative rounded-xl border-l-4 ${accentClass} ${
      isLight ? 'bg-white border border-l-4 border-slate-200' : 'bg-[var(--wa-bg-deep)] border border-l-4 border-[var(--wa-border)]'
    } p-3.5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-modern font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            {item.nome}
          </p>
          {item.motivo && (
            <p className="mt-1 text-xs font-modern text-[var(--wa-muted)] italic">{item.motivo}</p>
          )}
          {item.descricao && (
            <p className={`mt-1 text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.descricao}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {opcoesTroca.length > 0 && (
            <button
              onClick={() => setShowDropdown(prev => !prev)}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-modern font-semibold transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-[var(--wa-bg)] text-slate-400 hover:text-slate-200'
              }`}
            >
              Trocar <ChevronDown size={12} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
          )}
          <button
            onClick={() => onRemove(secao, item.id)}
            className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
              isLight
                ? 'text-slate-400 hover:bg-red-50 hover:text-red-500'
                : 'text-slate-500 hover:bg-red-500/10 hover:text-red-400'
            }`}
            title="Remover"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Dropdown de troca */}
      {showDropdown && (
        <div className={`mt-3 max-h-48 overflow-y-auto rounded-xl border p-1 ${
          isLight ? 'border-slate-200 bg-white' : 'border-[var(--wa-border)] bg-[var(--wa-bg)]'
        }`}>
          {opcoesTroca.map(op => (
            <button
              key={op.id}
              onClick={() => handleSwap(op)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-modern transition-colors cursor-pointer ${
                isLight
                  ? 'hover:bg-slate-50 text-slate-700'
                  : 'hover:bg-[var(--wa-bg-deep)] text-slate-300'
              }`}
            >
              <span className="flex-1 font-semibold">{op.nome}</span>
              {op.tipo && <span className="text-[10px] text-[var(--wa-muted)]">{op.tipo}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FinalizacaoPanel;
