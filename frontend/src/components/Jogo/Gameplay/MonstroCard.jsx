import React from 'react';
import { Ghost, Skull, Sword, Trees, User, Waves, Bot, FlameKindling } from 'lucide-react';

const TIPO_ICONS = {
  besta: Ghost,
  'morto-vivo': Skull,
  demonio: FlameKindling,
  dragao: Waves,
  elemental: Waves,
  constructo: Bot,
  fada: Trees,
  aberracao: Ghost,
  humanoide: User,
  celestial: Ghost,
  gigante: Sword,
  monstrosity: Ghost,
  fiend: FlameKindling,
  plant: Trees
};

const MonstroCard = ({ monstro, compact = false }) => {
  if (!monstro) return null;

  const hpPercentage = Math.max(0, (monstro.hp_atual / monstro.hp_max) * 100);
  const isDerrotado = monstro.status === 'derrotado' || monstro.hp_atual <= 0;
  const Icon = TIPO_ICONS[monstro.tipo] || Ghost;

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
        {monstro.imagem ? (
          <img src={monstro.imagem} alt={monstro.nome} className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-red-500/30" />
        ) : (
          <Icon size={14} className="text-red-300 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs font-semibold truncate ${isDerrotado ? 'text-gray-500 line-through' : 'text-red-300'}`}>
              {monstro.nome}
            </span>
            <span className={`text-xs flex-shrink-0 ${isDerrotado ? 'text-gray-500' : 'text-red-200'}`}>
              {isDerrotado ? '\u{1F480} DERROTADO' : `${monstro.hp_atual}/${monstro.hp_max}`}
            </span>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-1 mt-0.5 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${hpColor} transition-all duration-500`}
              style={{ width: `${hpPercentage}%` }}
            />
          </div>
        </div>
        {isDerrotado && <Skull size={12} className="text-gray-400 flex-shrink-0" />}
      </div>
    );
  }

  return (
    <div className={`game-glass rounded-lg border p-3 transition-all duration-300 ${
      isDerrotado
        ? 'border-gray-600/30 opacity-50 grayscale'
        : 'border-red-500/40 hover:border-red-400/60'
    }`}>
      <div className="flex items-center space-x-2 mb-2">
        {monstro.imagem ? (
          <img src={monstro.imagem} alt={monstro.nome} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-red-500/30" />
        ) : (
          <Icon size={18} className="text-red-300" />
        )}
        <div className="flex-1 min-w-0">
          <h4 className={`font-fantasy font-bold text-sm truncate ${
            isDerrotado ? 'text-gray-400 line-through' : 'text-red-300'
          }`}>
            {monstro.nome}
          </h4>
          <p className="text-xs text-gray-400">
            Nv.{monstro.nivel} · {monstro.tipo}
          </p>
        </div>
        {isDerrotado && <Skull size={16} className="text-gray-400" />}
      </div>

      <div className="mb-1">
        <div className="flex justify-between text-xs mb-0.5">
          <span className={isDerrotado ? 'text-gray-500' : 'text-red-300'}>HP</span>
          <span className={isDerrotado ? 'text-gray-500 font-bold' : 'text-red-200'}>
            {isDerrotado ? '\u{1F480} DERROTADO' : `${monstro.hp_atual}/${monstro.hp_max}`}
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
