import React from 'react';

const WizardProgressBar = ({ etapas, etapaIndex, isLight }) => {
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
          const isDone = i < etapaIndex;

          return (
            <div
              key={etapa.id}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-modern whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-purple-500/20 text-purple-400 font-semibold'
                  : isDone
                    ? isLight ? 'text-slate-500' : 'text-slate-500'
                    : isLight ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              <span>{etapa.icon}</span>
              {isActive && <span>{etapa.label}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WizardProgressBar;
