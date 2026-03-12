import React from 'react';
import { Heart, Shield, Zap, Droplets } from 'lucide-react';
import XPProgressBar from './XPProgressBar';
import { calcularMana } from '../../../utils/rpgHelpers';

/**
 * Barra de HP/XP/Mana compacta sempre visível acima do chat.
 * Mostra HP live durante combate (via combateJogadores) ou HP estático fora de combate.
 */
const BarraStatusCompacta = ({ personagem, combateAtivo, combateJogadores, userId }) => {
  if (!personagem) return null;

  // HP: combate usa dados live, fora de combate usa personagem
  const jogadorCombate = combateAtivo ? combateJogadores?.[String(userId)] : null;
  const hpAtual = jogadorCombate?.hp_atual ?? personagem.hp ?? personagem.hp_max ?? 0;
  const hpMax = jogadorCombate?.hp_max ?? personagem.hp_max ?? personagem.hp ?? 1;
  const hpPercent = Math.max(0, Math.min(100, (hpAtual / hpMax) * 100));

  // Mana: combate usa dados live, fora de combate calcula pela fórmula
  const manaMax = jogadorCombate?.mana_max ?? calcularMana(personagem);
  const manaAtual = jogadorCombate?.mana_atual ?? manaMax;
  const manaPercent = manaMax > 0 ? Math.max(0, Math.min(100, (manaAtual / manaMax) * 100)) : 0;

  // Cor da barra HP baseada na porcentagem
  const hpColor = hpPercent > 60
    ? 'from-green-500 to-emerald-400'
    : hpPercent > 30
      ? 'from-yellow-500 to-amber-400'
      : 'from-red-500 to-rose-400';

  const nivel = personagem.nivel || 1;
  const xpAtual = personagem.xp_atual ?? personagem.xp ?? 0;
  const xpProximoNivel = personagem.xp_proximo_nivel;

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-black/30 backdrop-blur-sm border-b border-purple-500/10 shrink-0">
      {/* Avatar + Nível */}
      <div className="flex items-center gap-1.5 shrink-0">
        {personagem.imagem ? (
          <img src={personagem.imagem} alt={personagem.nome} className="w-6 h-6 rounded-full object-cover border border-purple-500/50" />
        ) : (
          <Shield size={12} className="text-purple-400" />
        )}
        <span className="text-xs font-bold text-purple-300">Nv{nivel}</span>
      </div>

      {/* HP Bar */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 max-w-[200px]">
        <Heart size={12} className="text-red-400 shrink-0" />
        <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${hpColor} transition-all duration-500`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-slate-300 shrink-0">{hpAtual}/{hpMax}</span>
      </div>

      {/* Mana Bar */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 max-w-[160px]">
        <Droplets size={12} className="text-blue-400 shrink-0" />
        <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${manaPercent}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-slate-300 shrink-0">{manaAtual}/{manaMax}</span>
      </div>

      {/* XP Bar */}
      <div className="flex-1 min-w-0 max-w-[180px]">
        <XPProgressBar xpAtual={xpAtual} xpProximoNivel={xpProximoNivel} nivel={nivel} compact />
      </div>
    </div>
  );
};

export default BarraStatusCompacta;
