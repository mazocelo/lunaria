import React from 'react';
import { xpParaNivel, tierDesbloqueado, nomeTier, NIVEL_MAX } from '../../../utils/evolucaoHelper';
import { Star, Trophy } from 'lucide-react';

const tierColors = {
  1: 'text-slate-400',
  2: 'text-green-400',
  3: 'text-blue-400',
  4: 'text-purple-400',
  5: 'text-yellow-400'
};

const tierBgColors = {
  1: 'bg-slate-500/20 border-slate-500/30',
  2: 'bg-green-500/20 border-green-500/30',
  3: 'bg-blue-500/20 border-blue-500/30',
  4: 'bg-purple-500/20 border-purple-500/30',
  5: 'bg-yellow-500/20 border-yellow-500/30'
};

/**
 * Barra de progresso de XP com tier badge
 * @param {number} xpAtual - XP atual no nivel
 * @param {number} xpProximoNivel - XP necessario para proximo nivel (ou usar calculo)
 * @param {number} nivel - Nivel atual do personagem
 * @param {boolean} compact - Layout compacto para sidebar
 */
const XPProgressBar = ({ xpAtual = 0, xpProximoNivel, nivel = 1, compact = false }) => {
  const isMaxLevel = nivel >= NIVEL_MAX;
  const xpNeeded = xpProximoNivel || xpParaNivel(nivel);
  const percentage = isMaxLevel ? 100 : Math.min(100, Math.max(0, (xpAtual / xpNeeded) * 100));
  const tier = tierDesbloqueado(nivel);

  if (compact) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Star size={12} className="text-yellow-400" />
            <span className="text-xs font-bold text-yellow-400">
              {isMaxLevel ? 'MAX' : `${xpAtual}/${xpNeeded}`}
            </span>
          </div>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${tierBgColors[tier]} ${tierColors[tier]}`}>
            T{tier}
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-700 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isMaxLevel ? (
            <Trophy size={14} className="text-yellow-400" />
          ) : (
            <Star size={14} className="text-yellow-400" />
          )}
          <span className="text-sm font-bold text-yellow-400">
            {isMaxLevel ? 'Nível Máximo' : `${xpAtual} / ${xpNeeded} XP`}
          </span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${tierBgColors[tier]} ${tierColors[tier]}`}>
          {nomeTier(tier)}
        </span>
      </div>
      <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300 transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default XPProgressBar;
