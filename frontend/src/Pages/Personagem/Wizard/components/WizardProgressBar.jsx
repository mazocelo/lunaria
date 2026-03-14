import React from 'react';
import { ArrowLeft, Check, ChevronDown, ChevronUp, ScrollText } from 'lucide-react';

const WizardProgressBar = ({
  etapas,
  etapaIndex,
  isLight,
  onEtapaClick,
  etapasConcluidas = [],
  etapasVisitadas = [],
  tooltipMap = {},
  onBack,
  onToggleFicha,
  fichaAberta = false,
  embedded = false,
}) => {
  const progresso = ((etapaIndex + 1) / etapas.length) * 100;
  const etapaAtual = etapas[etapaIndex];

  return (
    <div className={embedded ? 'px-5 py-4 md:px-6' : 'wa-progress-rail mx-4 mt-4 rounded-2xl px-4 py-3 md:mx-5 md:mt-5 md:px-5'}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-colors cursor-pointer ${
                isLight
                  ? 'border-slate-300 bg-white/70 text-slate-600 hover:bg-white'
                  : 'border-slate-700 bg-slate-950/50 text-slate-300 hover:bg-slate-900'
              }`}
              aria-label="Voltar para personagens"
            >
              <ArrowLeft size={17} />
            </button>
          )}

          <div className="min-w-0">
            <p className="wa-brass-chip inline-flex items-center rounded-full px-2 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.2em]">
              Trilho da forja
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`text-sm font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                {etapaAtual?.label}
              </span>
              <span className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
                {`${etapaIndex + 1} / ${etapas.length}`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onToggleFicha && (
            <button
              type="button"
              onClick={onToggleFicha}
              className={`xl:hidden inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-modern font-semibold transition-all cursor-pointer ${
                fichaAberta
                  ? 'wa-brass-chip'
                  : isLight
                    ? 'border-slate-300 bg-white/70 text-slate-600 hover:bg-white'
                    : 'border-slate-700 bg-slate-950/50 text-slate-300 hover:bg-slate-900'
              }`}
            >
              <ScrollText size={14} />
              Ficha
              {fichaAberta ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}

          <div className={`hidden text-right text-[11px] font-modern md:block ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
            Selo atual: {etapaAtual?.label}
          </div>
        </div>
      </div>

      <div className={`relative mb-4 h-2 rounded-full ${isLight ? 'bg-slate-200/90' : 'bg-slate-800/80'}`}>
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--wa-brass)] via-[var(--wa-violet)] to-[var(--wa-emerald)] transition-all duration-500" style={{ width: `${progresso}%` }} />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {etapas.map((etapa, i) => {
          const isActive = i === etapaIndex;
          const isConcluida = etapasConcluidas.includes(etapa.id);
          const isVisitada = etapasVisitadas.includes(etapa.id);
          const isFuture = !isActive && !isConcluida && !isVisitada;
          const isClickable = isConcluida && !isActive && !!onEtapaClick;
          const tooltip = tooltipMap?.[etapa.id];

          return (
            <button
              key={etapa.id}
              type="button"
              title={tooltip ? `${etapa.label}: ${tooltip}` : etapa.label}
              onClick={isClickable ? () => onEtapaClick(etapa.id) : undefined}
              disabled={!isClickable}
              className={[
                'wa-rune-step group inline-flex min-w-fit items-center gap-2 rounded-full px-2.5 py-2 text-[11px] font-modern transition-all',
                isActive ? 'is-active' : '',
                isConcluida ? 'is-complete' : '',
                isVisitada && !isConcluida && !isActive ? 'is-visited' : '',
                isFuture ? 'is-future' : '',
                isClickable ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-default',
              ].filter(Boolean).join(' ')}
            >
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${
                isActive
                  ? 'border-[var(--wa-violet)] text-[var(--wa-violet)]'
                  : isConcluida
                    ? 'border-[var(--wa-brass)] text-[var(--wa-brass)]'
                    : isLight
                      ? 'border-slate-300 text-slate-500'
                      : 'border-slate-700 text-slate-500'
              }`}>
                {isConcluida ? <Check size={12} /> : <span className="text-[12px]">{etapa.icon}</span>}
              </span>
              <span className="whitespace-nowrap">{etapa.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WizardProgressBar;
