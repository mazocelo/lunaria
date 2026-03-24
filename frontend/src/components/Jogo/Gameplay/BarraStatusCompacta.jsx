import React from 'react';
import { Heart, Shield, Zap, Droplets } from 'lucide-react';
import XPProgressBar from './XPProgressBar';
import { calcularMana, calcularHPMaximo } from '../../../utils/rpgHelpers';

const BARRA_DEATH_LABELS = {
  muito_fraco:  { label: 'Muito Fraco', className: 'text-yellow-400', barColor: 'from-yellow-500 to-yellow-400' },
  inconsciente: { label: 'Inconsciente', className: 'text-orange-400', barColor: 'from-orange-500 to-orange-400' },
  quase_morto:  { label: 'Quase Morto',  className: 'text-red-400 animate-pulse', barColor: 'from-red-600 to-red-400' },
  morto:        { label: 'Morto',         className: 'text-slate-500', barColor: 'from-slate-600 to-slate-500' },
  derrotado:    { label: 'Derrotado',     className: 'text-slate-500', barColor: 'from-slate-600 to-slate-500' },
};

/**
 * Barra de HP/XP/Mana compacta sempre visivel acima do chat.
 * Mostra HP live durante combate (via combateJogadores) ou HP estatico fora de combate.
 */
const BarraStatusCompacta = ({ personagem, combateAtivo, combateJogadores, userId }) => {
  if (!personagem) return null;

  // HP: combate usa dados live, fora de combate usa personagem
  const jogadorCombate = combateAtivo ? combateJogadores?.[String(userId)] : null;
  const hpMaxCalculado = personagem.hp_max || calcularHPMaximo(personagem);
  const hpAtual = jogadorCombate?.hp_atual ?? personagem.hp_atual ?? personagem.hp ?? 0;
  const hpMax = jogadorCombate?.hp_max ?? hpMaxCalculado;
  const hpPercent = Math.max(0, Math.min(100, (hpAtual / hpMax) * 100));

  // Mana: combate usa dados live, fora de combate calcula pela formula
  const manaMax = jogadorCombate?.mana_max ?? calcularMana(personagem);
  const manaAtual = jogadorCombate?.mana_atual ?? manaMax;
  const manaPercent = manaMax > 0 ? Math.max(0, Math.min(100, (manaAtual / manaMax) * 100)) : 0;

  // Death state override for HP bar color
  const combateStatus = jogadorCombate?.status;
  const deathInfo = BARRA_DEATH_LABELS[combateStatus];

  // Cor da barra HP baseada na porcentagem (overridden by death state)
  const hpColor = deathInfo
    ? deathInfo.barColor
    : hpPercent > 60
      ? 'from-green-500 to-emerald-400'
      : hpPercent > 30
        ? 'from-yellow-500 to-amber-400'
        : 'from-red-500 to-rose-400';

  const nivel = personagem.nivel || 1;
  const xpAtual = personagem.xp_atual ?? personagem.xp ?? 0;
  const xpProximoNivel = personagem.xp_proximo_nivel;

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 game-glass-subtle border-b border-white/[0.04] shrink-0">
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
        <div className="flex-1 h-2.5 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${hpColor} transition-all duration-500`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
        <span className={`text-xs font-mono shrink-0 ${deathInfo ? deathInfo.className : 'text-slate-300'}`}>{hpAtual}/{hpMax}</span>
        {deathInfo && (
          <span className={`text-[10px] font-semibold uppercase shrink-0 ${deathInfo.className}`}>{deathInfo.label}</span>
        )}
      </div>

      {/* Mana Bar — hidden when mana is 0 (e.g. 3D&T without Magia) */}
      {manaMax > 0 && (
        <div className="flex items-center gap-1.5 flex-1 min-w-0 max-w-[160px]">
          <Droplets size={12} className="text-blue-400 shrink-0" />
          <div className="flex-1 h-2.5 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${manaPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono text-slate-300 shrink-0">{manaAtual}/{manaMax}</span>
        </div>
      )}

      {/* XP Bar */}
      <div className="flex-1 min-w-0 max-w-[180px]">
        <XPProgressBar xpAtual={xpAtual} xpProximoNivel={xpProximoNivel} nivel={nivel} compact />
      </div>
    </div>
  );
};

export default BarraStatusCompacta;
