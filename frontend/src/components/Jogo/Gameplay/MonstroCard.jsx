import React from 'react';

const TIPO_ICONS = {
  'besta': '🐺', 'morto-vivo': '💀', 'demonio': '👿', 'dragao': '🐉',
  'elemental': '🌪️', 'constructo': '🤖', 'fada': '🧚', 'aberracao': '👁️',
  'humanoide': '👤', 'celestial': '👼', 'gigante': '🗿', 'monstrosity': '👹',
  'fiend': '😈', 'plant': '🌿'
};

const MonstroCard = ({ monstro, compact = false }) => {
  if (!monstro) return null;

  const hpPercentage = Math.max(0, (monstro.hp_atual / monstro.hp_max) * 100);
  const isDerrotado = monstro.status === 'derrotado' || monstro.hp_atual <= 0;
  const tipoIcon = TIPO_ICONS[monstro.tipo] || '👹';

  const hpColor = hpPercentage > 60
    ? 'from-green-500 to-green-400'
    : hpPercentage > 30
      ? 'from-yellow-500 to-yellow-400'
      : 'from-red-600 to-red-400';

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all ${
        isDerrotado
          ? 'border-gray-600/20 opacity-40 grayscale'
          : 'border-red-500/30 bg-red-900/10'
      }`}>
        <span className="text-sm flex-shrink-0">{tipoIcon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs font-semibold truncate ${isDerrotado ? 'text-gray-500 line-through' : 'text-red-300'}`}>
              {monstro.nome}
            </span>
            <span className={`text-xs flex-shrink-0 ${isDerrotado ? 'text-gray-500' : 'text-red-200'}`}>
              {monstro.hp_atual}/{monstro.hp_max}
            </span>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-1 mt-0.5 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${hpColor} transition-all duration-500`}
              style={{ width: `${hpPercentage}%` }}
            />
          </div>
        </div>
        {isDerrotado && <span className="text-xs flex-shrink-0">💀</span>}
      </div>
    );
  }

  // Full card (fallback, not used by new BatalhaUI)
  return (
    <div className={`glass rounded-lg border p-3 transition-all duration-300 ${
      isDerrotado
        ? 'border-gray-600/30 opacity-50 grayscale'
        : 'border-red-500/40 hover:border-red-400/60'
    }`}>
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-xl">{tipoIcon}</span>
        <div className="flex-1 min-w-0">
          <h4 className={`font-fantasy font-bold text-sm truncate ${
            isDerrotado ? 'text-gray-400 line-through' : 'text-red-300'
          }`}>
            {monstro.nome}
          </h4>
          <p className="text-xs text-gray-400">
            Nv.{monstro.nivel} • {monstro.tipo}
          </p>
        </div>
        {isDerrotado && <span className="text-lg">💀</span>}
      </div>

      <div className="mb-1">
        <div className="flex justify-between text-xs mb-0.5">
          <span className={isDerrotado ? 'text-gray-500' : 'text-red-300'}>HP</span>
          <span className={isDerrotado ? 'text-gray-500' : 'text-red-200'}>
            {monstro.hp_atual}/{monstro.hp_max}
          </span>
        </div>
        <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${hpColor} transition-all duration-500`}
            style={{ width: `${hpPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default MonstroCard;
