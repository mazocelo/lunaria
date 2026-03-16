import React, { useState } from 'react';

/**
 * Componente para acoes RPG na sidebar (sempre dark/game context)
 * Dados de rolagem + habilidades ativas do personagem + equipamentos
 */
export const RPGActions = ({
  onRollDice,
  onUsarHabilidade,
  onUsarEquipamento,
  personagem,
  className = ''
}) => {
  const [customDice, setCustomDice] = useState('1d20');

  // Dados comuns
  const commonDice = [
    { label: 'd4', value: '1d4' },
    { label: 'd6', value: '1d6' },
    { label: 'd8', value: '1d8' },
    { label: 'd10', value: '1d10' },
    { label: 'd12', value: '1d12' },
    { label: 'd20', value: '1d20' },
    { label: 'd100', value: '1d100' },
    { label: '2d6', value: '2d6' },
    { label: '3d6', value: '3d6' }
  ];

  const handleDiceRoll = (dice) => {
    if (onRollDice) {
      onRollDice(dice, `Rolagem de ${dice}`);
    }
  };

  const handleCustomDiceRoll = () => {
    if (customDice && onRollDice) {
      onRollDice(customDice, `Rolagem personalizada: ${customDice}`);
    }
  };

  // Filtrar vantagens ativas (usar >= 1)
  const vantagensAtivas = (personagem?.vantagens || []).filter(v => v.usar >= 1);
  const vantagensPassivas = (personagem?.vantagens || []).filter(v => !v.usar || v.usar === 0);
  const desvantagens = personagem?.desvantagens || [];
  const equipamentos = personagem?.equipamentos || [];

  const getElementColor = (elemento) => {
    if (!elemento || elemento.length === 0) return 'bg-slate-500/15 text-slate-400';
    const el = Array.isArray(elemento) ? elemento[0]?.toLowerCase() : elemento.toLowerCase();
    const colors = {
      fogo: 'bg-red-500/20 text-red-300',
      gelo: 'bg-sky-500/20 text-sky-300',
      eletrico: 'bg-yellow-500/20 text-yellow-300',
      acido: 'bg-lime-500/20 text-lime-300',
      veneno: 'bg-green-500/20 text-green-300',
      sonico: 'bg-indigo-500/20 text-indigo-300',
      radiante: 'bg-amber-500/20 text-amber-300',
      necrotico: 'bg-purple-500/20 text-purple-300',
      sombrio: 'bg-slate-600/30 text-slate-300',
      psiquico: 'bg-pink-500/20 text-pink-300',
      arcano: 'bg-violet-500/20 text-violet-300',
      divino: 'bg-yellow-500/20 text-yellow-300',
      natureza: 'bg-emerald-500/20 text-emerald-300',
      agua: 'bg-blue-500/20 text-blue-300',
      terra: 'bg-amber-500/20 text-amber-300',
      vento: 'bg-cyan-500/20 text-cyan-300',
      contundente: 'bg-stone-500/20 text-stone-300',
      cortante: 'bg-red-500/20 text-red-300',
      perfurante: 'bg-gray-500/20 text-gray-300',
    };
    return colors[el] || 'bg-slate-500/15 text-slate-400';
  };

  /** Separador de seção */
  const SectionHeader = ({ title }) => (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-purple-300/60 font-fantasy text-xs uppercase tracking-widest">{title}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-purple-500/20 to-transparent" />
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Rolagem de Dados */}
      <div>
        <SectionHeader title="Dados" />
        <div className="grid grid-cols-3 gap-2 mb-2">
          {commonDice.map((dice) => (
            <button
              key={dice.value}
              onClick={() => handleDiceRoll(dice.value)}
              className="glass-subtle aspect-square rounded-xl border border-purple-500/20 hover:border-purple-400/40 hover:shadow-[0_0_10px_rgba(139,92,246,0.1)] text-purple-200 font-fantasy font-bold text-base transition-all hover:scale-105 cursor-pointer flex items-center justify-center"
            >
              {dice.label}
            </button>
          ))}
        </div>

        {/* Dados personalizados */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customDice}
            onChange={(e) => setCustomDice(e.target.value)}
            placeholder="1d20+5"
            className="flex-1 px-2.5 py-1.5 text-sm rounded-lg glass-subtle border border-purple-500/20 text-purple-100 placeholder-purple-400/40 focus:outline-none focus:border-purple-400/50 focus:shadow-[0_0_8px_rgba(139,92,246,0.1)] transition-all"
          />
          <button
            onClick={handleCustomDiceRoll}
            className="px-3 py-1.5 text-sm font-medium rounded-lg glass-subtle border border-purple-500/25 text-purple-200 hover:border-purple-400/40 hover:bg-purple-500/15 transition-all cursor-pointer"
          >
            Rolar
          </button>
        </div>
      </div>

      {/* Habilidades Ativas */}
      {vantagensAtivas.length > 0 && (
        <div>
          <SectionHeader title="Habilidades" />
          <div className="space-y-2">
            {vantagensAtivas.map((vantagem, i) => (
              <button
                key={i}
                onClick={() => onUsarHabilidade && onUsarHabilidade(vantagem)}
                className="w-full text-left glass-subtle rounded-lg p-2.5 border border-purple-500/15 hover:border-purple-400/30 transition-all cursor-pointer"
                title={vantagem.descricao || vantagem.nome}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-purple-100">{vantagem.nome}</span>
                  {vantagem.usar > 1 && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      x{vantagem.usar}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {vantagem.dano_base && (
                    <span className="text-xs text-red-400">{vantagem.dano_base}</span>
                  )}
                  {vantagem.elemento && vantagem.elemento.length > 0 && (
                    vantagem.elemento.map((el, j) => (
                      <span key={j} className={`text-xs px-1.5 py-0.5 rounded ${getElementColor([el])}`}>
                        {el}
                      </span>
                    ))
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Equipamentos */}
      {equipamentos.length > 0 && (
        <div>
          <SectionHeader title="Equipamentos" />
          <div className="space-y-1.5">
            {equipamentos.map((equip, i) => (
              <button
                key={i}
                onClick={() => onUsarEquipamento && onUsarEquipamento(equip)}
                className="w-full text-left glass-subtle rounded-lg p-2.5 border border-amber-500/15 hover:border-amber-400/30 transition-all cursor-pointer"
                title={equip.descricao || equip.nome}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-amber-100">{equip.nome}</span>
                  {equip.tipo && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-mono">
                      {Array.isArray(equip.tipo) ? equip.tipo[0] : equip.tipo}
                    </span>
                  )}
                </div>
                {equip.dano_base && (
                  <span className="text-xs text-red-400">{equip.dano_base}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tracos Passivos (vantagens passivas + desvantagens) */}
      {(vantagensPassivas.length > 0 || desvantagens.length > 0) && (
        <div>
          <SectionHeader title="Tracos" />
          <div className="space-y-1">
            {vantagensPassivas.map((v, i) => (
              <div
                key={`v-${i}`}
                className="glass-subtle rounded-lg px-2.5 py-1.5 border border-emerald-500/15 text-emerald-300 text-sm"
                title={v.descricao || ''}
              >
                + {v.nome}
              </div>
            ))}
            {vantagensPassivas.length > 0 && desvantagens.length > 0 && (
              <div className="flex items-center gap-2 my-1.5">
                <div className="flex-1 h-px bg-gradient-to-r from-red-500/20 to-transparent" />
              </div>
            )}
            {desvantagens.map((d, i) => (
              <div
                key={`d-${i}`}
                className="glass-subtle rounded-lg px-2.5 py-1.5 border border-red-500/15 text-red-300 text-sm"
                title={d.descricao || ''}
              >
                - {d.nome}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem quando nao tem personagem */}
      {!personagem && (
        <div className="text-center py-4 text-sm text-purple-400/60">
          Selecione um personagem para ver habilidades
        </div>
      )}
    </div>
  );
};
