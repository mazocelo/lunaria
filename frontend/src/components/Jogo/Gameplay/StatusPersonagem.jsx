import React, { useRef, useState, useEffect } from 'react';
import { Package, Shield } from 'lucide-react';
import XPProgressBar from './XPProgressBar';
import { calcularMana, calcularHPMaximo, getDnd5eModifier, getDnd5eProficiencyBonus } from '../../../utils/rpgHelpers';

const DEATH_STATES = {
  muito_fraco:  { text: 'text-yellow-400', border: 'border-yellow-600', label: 'Muito Fraco', grayscale: false, pulse: false },
  inconsciente: { text: 'text-orange-400', border: 'border-orange-600', label: 'Inconsciente', grayscale: false, pulse: false },
  quase_morto:  { text: 'text-red-400',    border: 'border-red-600',    label: 'Quase Morto',  grayscale: false, pulse: true },
  morto:        { text: 'text-slate-500',   border: 'border-gray-600',   label: 'Morto',        grayscale: true,  pulse: false },
  derrotado:    { text: 'text-gray-500',    border: 'border-gray-600',   label: 'Derrotado',    grayscale: true,  pulse: false },
};

const STATUS_BADGE_STYLES = {
  muito_fraco:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  inconsciente: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  quase_morto:  'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse',
  morto:        'bg-slate-700/30 text-slate-500 border-slate-600/30',
  derrotado:    'bg-slate-600/20 text-slate-500 border-slate-600/30',
};

const StatusPersonagem = ({
  personagemSelecionado,
  onRolarDados,
  onToggleInventario,
  compact = false,
  combateAtivo = false,
  combateJogadores = {},
  userId
}) => {
  if (!personagemSelecionado) {
    return (
      <div className={compact ? 'p-3' : 'p-4 game-glass-subtle border-t border-white/[0.04]'}>
        <div className={compact ? '' : 'max-w-6xl mx-auto'}>
          <div className="game-glass-subtle p-4 rounded-xl border border-cyan-500/20">
            <div className="text-center text-white">
              <p>Carregando informacoes do personagem...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const combateStats = combateAtivo && userId ? combateJogadores[String(userId)] : null;
  const hpAtualNum = combateStats?.hp_atual ?? personagemSelecionado?.hp ?? 0;
  const prevHpRef = useRef(hpAtualNum);
  const [hpFlash, setHpFlash] = useState(false);
  useEffect(() => {
    if (hpAtualNum < prevHpRef.current && prevHpRef.current > 0) {
      setHpFlash(true);
      const t = setTimeout(() => setHpFlash(false), 1200);
      return () => clearTimeout(t);
    }
    prevHpRef.current = hpAtualNum;
  }, [hpAtualNum]);
  const hpDisplay = combateStats
    ? `${combateStats.hp_atual}/${combateStats.hp_max}`
    : (personagemSelecionado.hp != null ? `${personagemSelecionado.hp}/${personagemSelecionado.hp_max || calcularHPMaximo(personagemSelecionado)}` : '???');
  const hpBaixo = combateStats && combateStats.hp_max > 0 ? (combateStats.hp_atual / combateStats.hp_max) <= 0.3 : false;
  const combateStatus = combateStats?.status;
  const deathState = DEATH_STATES[combateStatus];
  const derrotado = deathState?.grayscale ?? false;
  const isIncapacitated = !!deathState;

  const isTresDet = personagemSelecionado?.sistema === 'tresdet';
  const isDnd5e = personagemSelecionado?.sistema === 'dnd5e';
  const manaMax = combateStats?.mana_max ?? calcularMana(personagemSelecionado);
  const manaAtual = combateStats?.mana_atual ?? manaMax;
  const mpDisplay = `${manaAtual}/${manaMax}`;
  const hpLabel = isTresDet ? 'PV' : 'HP';
  const mpLabel = isTresDet ? 'PM' : 'MP';

  const dnd5eAC = isDnd5e
    ? (combateStats?.ac ?? personagemSelecionado?.stats_sistema?.ac ?? (10 + getDnd5eModifier(personagemSelecionado?.atributos?.DEX)))
    : null;
  const dnd5eProfBonus = isDnd5e ? getDnd5eProficiencyBonus(personagemSelecionado?.nivel || 1) : null;
  const dnd5eSpellSlots = isDnd5e ? (personagemSelecionado?.stats_sistema?.spellSlots || []) : [];
  const dnd5eHasSlots = dnd5eSpellSlots.some(s => s > 0);
  const dnd5eDeathSaves = isDnd5e && combateStats?.hp_atual === 0 ? (combateStats?.deathSaves || { successes: 0, failures: 0 }) : null;

  const topContainerClass = compact
    ? `game-glass-subtle p-3 rounded-xl border ${combateAtivo ? 'border-red-500/30' : 'border-cyan-500/15'}`
    : `game-glass-subtle p-4 rounded-xl border ${combateAtivo ? 'border-red-500/30' : 'border-cyan-500/15'}`;

  const avatarFallbackClass = derrotado
    ? 'bg-gradient-to-r from-gray-600 to-gray-700'
    : isIncapacitated
      ? 'bg-gradient-to-r from-yellow-600 to-orange-600'
      : combateAtivo
        ? 'bg-gradient-to-r from-red-500 to-orange-500'
        : 'bg-gradient-to-r from-cyan-500 to-purple-500';

  const baseInfo = (
    <>
      <h3 className={`${compact ? 'text-base' : 'text-lg'} font-fantasy font-bold text-white`}>
        {personagemSelecionado.nome || 'Personagem sem nome'}
      </h3>
      <p className={`${compact ? 'text-xs' : 'text-sm'} text-cyan-300 ${compact ? 'mt-1' : ''}`}>
        {personagemSelecionado.classe || 'Classe desconhecida'} · {personagemSelecionado.raca || 'Raca desconhecida'} · Nivel {personagemSelecionado.nivel || '1'}
      </p>
    </>
  );

  if (compact) {
    return (
      <div className={topContainerClass}>
        <div className="flex items-start space-x-3">
          {personagemSelecionado.imagem ? (
            <img
              src={personagemSelecionado.imagem}
              alt={personagemSelecionado.nome}
              className={`w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 ${
                derrotado ? 'border-gray-600 grayscale' : deathState ? `${deathState.border} ${deathState.pulse ? 'animate-pulse' : ''}` : combateAtivo ? 'border-red-500' : 'border-cyan-500'
              }`}
            />
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0 ${avatarFallbackClass}`}>
              <Shield size={16} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {baseInfo}
              {deathState && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${STATUS_BADGE_STYLES[combateStatus]}`}>
                  {deathState.label}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-3">
                <div className="text-center">
                  <div className={`text-base font-bold transition-all duration-300 ${
                    hpFlash ? 'text-red-500 scale-110' :
                    deathState ? `${deathState.text} ${deathState.pulse ? 'animate-pulse' : ''}` : hpBaixo ? 'text-red-400 animate-pulse' : combateStats ? 'text-red-300' : 'text-red-400'
                  }`}>
                    {hpDisplay}
                  </div>
                  <div className="text-xs text-red-300">{hpLabel}</div>
                </div>
                {!isDnd5e && (manaMax > 0 || !isTresDet) && (
                  <div className="text-center">
                    <div className="text-base font-bold text-blue-400">{mpDisplay}</div>
                    <div className="text-xs text-blue-300">{mpLabel}</div>
                  </div>
                )}
                {isDnd5e && (
                  <>
                    <div className="text-center">
                      <div className="text-base font-bold text-cyan-400">{dnd5eAC}</div>
                      <div className="text-xs text-cyan-300">AC</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-green-400">+{dnd5eProfBonus}</div>
                      <div className="text-xs text-green-300">PROF</div>
                    </div>
                    {dnd5eHasSlots && (
                      <div className="text-center">
                        <div className="text-base font-bold text-indigo-400">{dnd5eSpellSlots.filter(s => s > 0).length}</div>
                        <div className="text-xs text-indigo-300">SLOTS</div>
                      </div>
                    )}
                  </>
                )}
                {combateStats && !isTresDet && !isDnd5e && (
                  <>
                    <div className="text-center">
                      <div className="text-base font-bold text-green-400">{combateStats.esquiva || 0}%</div>
                      <div className="text-xs text-green-300">ESQ</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-amber-400">{combateStats.armadura || 0}</div>
                      <div className="text-xs text-amber-300">ARM</div>
                    </div>
                  </>
                )}
              </div>
              {dnd5eDeathSaves && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-red-400 uppercase font-semibold">Death Saves</span>
                  <div className="flex gap-0.5">
                    {[0,1,2].map(i => (
                      <span key={`s${i}`} className={`w-2.5 h-2.5 rounded-full border ${i < dnd5eDeathSaves.successes ? 'bg-green-500 border-green-400' : 'border-green-500/30'}`} />
                    ))}
                  </div>
                  <div className="flex gap-0.5">
                    {[0,1,2].map(i => (
                      <span key={`f${i}`} className={`w-2.5 h-2.5 rounded-full border ${i < dnd5eDeathSaves.failures ? 'bg-red-500 border-red-400' : 'border-red-500/30'}`} />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2">
              <XPProgressBar
                compact
                xpAtual={personagemSelecionado.xp_atual || personagemSelecionado.xp || 0}
                xpProximoNivel={personagemSelecionado.xp_proximo_nivel}
                nivel={personagemSelecionado.nivel || 1}
              />
            </div>
            {onToggleInventario && (
              <button
                type="button"
                onClick={onToggleInventario}
                className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded hover:bg-amber-500/20 transition-colors text-xs font-modern"
              >
                <Package size={12} />
                Inventario ({(personagemSelecionado.equipamentos || []).length})
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 game-glass-subtle border-t border-white/[0.04]">
      <div className="max-w-6xl mx-auto">
        <div className={topContainerClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {personagemSelecionado.imagem ? (
                <img
                  src={personagemSelecionado.imagem}
                  alt={personagemSelecionado.nome}
                  className={`w-12 h-12 rounded-full object-cover border-2 ${
                    derrotado ? 'border-gray-600 grayscale' : deathState ? `${deathState.border} ${deathState.pulse ? 'animate-pulse' : ''}` : combateAtivo ? 'border-red-500' : 'border-cyan-500'
                  }`}
                />
              ) : (
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${avatarFallbackClass}`}>
                  <Shield size={18} />
                </div>
              )}
              <div className="flex items-center gap-2">
                {baseInfo}
                {deathState && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${STATUS_BADGE_STYLES[combateStatus]}`}>
                    {deathState.label}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className={`text-lg font-bold transition-all duration-300 ${
                    hpFlash ? 'text-red-500 scale-110' :
                    deathState ? `${deathState.text} ${deathState.pulse ? 'animate-pulse' : ''}` : hpBaixo ? 'text-red-400 animate-pulse' : combateStats ? 'text-red-300' : 'text-red-400'
                  }`}>
                    {hpDisplay}
                  </div>
                  <div className="text-xs text-red-300">{hpLabel}</div>
                </div>
                {!isDnd5e && (manaMax > 0 || !isTresDet) && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-400">{mpDisplay}</div>
                    <div className="text-xs text-blue-300">{mpLabel}</div>
                  </div>
                )}
                <div className="min-w-[120px]">
                  <XPProgressBar
                    xpAtual={personagemSelecionado.xp_atual || personagemSelecionado.xp || 0}
                    xpProximoNivel={personagemSelecionado.xp_proximo_nivel}
                    nivel={personagemSelecionado.nivel || 1}
                  />
                </div>
                {isDnd5e && (
                  <>
                    <div className="text-center">
                      <div className="text-lg font-bold text-cyan-400">{dnd5eAC}</div>
                      <div className="text-xs text-cyan-300">AC</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">+{dnd5eProfBonus}</div>
                      <div className="text-xs text-green-300">PROF</div>
                    </div>
                    {dnd5eHasSlots && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-indigo-400">{dnd5eSpellSlots.filter(s => s > 0).length}</div>
                        <div className="text-xs text-indigo-300">SLOTS</div>
                      </div>
                    )}
                  </>
                )}
                {combateStats && !isTresDet && !isDnd5e && (
                  <>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">{combateStats.esquiva || 0}%</div>
                      <div className="text-xs text-green-300">ESQ</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-amber-400">{combateStats.armadura || 0}</div>
                      <div className="text-xs text-amber-300">ARM</div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {onRolarDados && (
                  <>
                    <button
                      type="button"
                      onClick={() => onRolarDados('1d20', 'Teste rapido')}
                      className="px-3 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors text-sm"
                    >
                      d20
                    </button>
                    <button
                      type="button"
                      onClick={() => onRolarDados('1d6', 'Dado de 6')}
                      className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors text-sm"
                    >
                      d6
                    </button>
                  </>
                )}
                {onToggleInventario && (
                  <button
                    type="button"
                    onClick={onToggleInventario}
                    className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded hover:bg-amber-500/20 transition-colors text-sm flex items-center gap-1.5"
                  >
                    <Package size={14} />
                    ({(personagemSelecionado.equipamentos || []).length})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(StatusPersonagem);
