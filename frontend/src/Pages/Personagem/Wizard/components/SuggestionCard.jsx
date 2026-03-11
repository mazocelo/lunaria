import React from 'react';
import { Sparkles, Shield, Sword, Zap } from 'lucide-react';

const TIPO_CONFIG = {
  raca: { icon: Sparkles, color: 'purple', label: 'Raça' },
  classe: { icon: Sword, color: 'blue', label: 'Classe' },
  vantagem: { icon: Zap, color: 'green', label: 'Vantagem' },
  desvantagem: { icon: Shield, color: 'red', label: 'Desvantagem' },
};

const SuggestionCard = ({ sugestao, onSelect, isLight, selected = false }) => {
  const config = TIPO_CONFIG[sugestao.tipo] || TIPO_CONFIG.vantagem;
  const Icon = config.icon;

  return (
    <button
      onClick={() => onSelect(sugestao)}
      className={`group w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
        selected
          ? `border-${config.color}-500/50 ${isLight ? `bg-${config.color}-50` : `bg-${config.color}-500/10`}`
          : isLight
            ? 'border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 bg-white'
            : 'border-slate-700/50 hover:border-purple-500/30 hover:bg-slate-800/50 bg-slate-800/30'
      }`}
    >
      <div className="flex items-start gap-2">
        <div className={`p-1.5 rounded-md ${
          isLight ? `bg-${config.color}-100` : `bg-${config.color}-500/15`
        }`}>
          <Icon size={14} className={`text-${config.color}-400`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              {sugestao.nome}
            </span>
            {sugestao.custo != null && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                sugestao.custo > 0
                  ? 'bg-amber-500/15 text-amber-400'
                  : sugestao.custo < 0
                    ? 'bg-green-500/15 text-green-400'
                    : 'bg-slate-500/15 text-slate-400'
              }`}>
                {sugestao.custo > 0 ? `+${sugestao.custo}` : sugestao.custo}
              </span>
            )}
          </div>

          {sugestao.descricao && (
            <p className={`text-xs mt-0.5 line-clamp-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {sugestao.descricao}
            </p>
          )}
        </div>

        {selected && (
          <span className="text-green-400 text-xs font-bold">✓</span>
        )}
      </div>
    </button>
  );
};

export default SuggestionCard;
