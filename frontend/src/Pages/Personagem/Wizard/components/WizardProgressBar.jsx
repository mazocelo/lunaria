import React from 'react';
import { Check } from 'lucide-react';

const WizardProgressBar = ({ etapas, etapaIndex, isLight, onEtapaClick, etapasConcluidas = [], etapasVisitadas = [] }) => {
  const progresso = ((etapaIndex + 1) / etapas.length) * 100;
  const etapaAtual = etapas[etapaIndex];

  return (
    <div className={`px-4 py-3 md:px-5 md:py-3 border-b ${isLight ? 'border-slate-200 bg-white/80' : 'border-slate-700/50 bg-slate-900/80'}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[11px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Progresso da forja
          </p>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              {etapaAtual?.label}
            </span>
            <span className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {`${etapaIndex + 1}/${etapas.length}`}
            </span>
          </div>
        </div>
        <span className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Etapas concluidas continuam clicaveis
        </span>
      </div>

      <div className={`w-full h-1.5 rounded-full mb-3 ${isLight ? 'bg-slate-200' : 'bg-slate-700/50'}`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
          style={{ width: `${progresso}%` }}
        />
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
        {etapas.map((etapa, i) => {
          const isActive = i === etapaIndex;
          const isConcluida = etapasConcluidas.includes(etapa.id);
          const isVisitada = etapasVisitadas.includes(etapa.id);
          const isFuture = !isActive && !isConcluida && !isVisitada;
          const isClickable = isConcluida && !isActive && !!onEtapaClick;

          return (
            <button
              key={etapa.id}
              type="button"
              onClick={isClickable ? () => onEtapaClick(etapa.id) : undefined}
              disabled={!isClickable}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-modern whitespace-nowrap transition-all ${
                isClickable ? 'cursor-pointer hover:bg-purple-500/10' : isActive ? '' : 'cursor-default'
              } ${
                isActive
                  ? 'bg-purple-500/20 text-purple-300 font-semibold ring-1 ring-purple-500/30'
                  : isConcluida
                    ? isLight ? 'bg-green-50 text-green-700' : 'bg-green-500/10 text-green-300'
                    : isFuture
                      ? isLight ? 'text-slate-400 opacity-60' : 'text-slate-600 opacity-60'
                      : isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800/60 text-slate-400'
              }`}
            >
              {isConcluida && !isActive ? (
                <span className="flex items-center justify-center w-4 h-4">
                  <Check size={12} />
                </span>
              ) : (
                <span className="text-[12px]">{etapa.icon}</span>
              )}
              {(isActive || isConcluida || isVisitada) && <span>{etapa.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WizardProgressBar;
