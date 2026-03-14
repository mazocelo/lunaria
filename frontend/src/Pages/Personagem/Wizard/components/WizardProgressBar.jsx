import React from 'react';
import { Check } from 'lucide-react';

const WizardProgressBar = ({ etapas, etapaIndex, isLight, onEtapaClick, etapasConcluidas = [], etapasVisitadas = [] }) => {
  const progresso = ((etapaIndex + 1) / etapas.length) * 100;

  return (
    <div className={`px-4 py-3 border-b ${isLight ? 'border-slate-200 bg-white/80' : 'border-slate-700/50 bg-slate-900/80'}`}>
      {/* Barra de progresso */}
      <div className={`w-full h-1.5 rounded-full mb-3 ${isLight ? 'bg-slate-200' : 'bg-slate-700/50'}`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
          style={{ width: `${progresso}%` }}
        />
      </div>

      {/* Etapas */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
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
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-modern whitespace-nowrap transition-all ${
                isClickable ? 'cursor-pointer hover:bg-purple-500/10' : isActive ? '' : 'cursor-default'
              } ${
                isActive
                  ? 'bg-purple-500/20 text-purple-400 font-semibold'
                  : isConcluida
                    ? isLight ? 'text-green-600' : 'text-green-400'
                    : isFuture
                      ? isLight ? 'text-slate-400 opacity-50' : 'text-slate-600 opacity-50'
                      : isLight ? 'text-slate-600' : 'text-slate-500'
              }`}
            >
              {isConcluida && !isActive ? (
                <span className="flex items-center justify-center w-4 h-4">
                  <Check size={12} />
                </span>
              ) : (
                <span>{etapa.icon}</span>
              )}
              {(isActive || isConcluida) && <span>{etapa.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WizardProgressBar;
