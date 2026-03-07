import React, { useState } from 'react';
import { useTheme } from '../contexts/theme';

/**
 * Componente para acoes RPG na sidebar
 * Dados de rolagem + habilidades ativas do personagem + equipamentos
 */
export const RPGActions = ({
  onRollDice,
  onUsarHabilidade,
  onUsarEquipamento,
  personagem,
  className = ''
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [customDice, setCustomDice] = useState('1d20');
  const [showCustom, setShowCustom] = useState(false);

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
    if (!elemento || elemento.length === 0) return isLight
      ? 'bg-slate-100 text-slate-600'
      : 'bg-slate-700/50 text-slate-400';

    const el = Array.isArray(elemento) ? elemento[0]?.toLowerCase() : elemento.toLowerCase();
    const colors = {
      fogo: isLight ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-300',
      agua: isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-300',
      terra: isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-300',
      ar: isLight ? 'bg-cyan-100 text-cyan-700' : 'bg-cyan-500/20 text-cyan-300',
      luz: isLight ? 'bg-yellow-100 text-yellow-700' : 'bg-yellow-500/20 text-yellow-300',
      sagrado: isLight ? 'bg-yellow-100 text-yellow-700' : 'bg-yellow-500/20 text-yellow-300',
      trevas: isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/20 text-purple-300',
      arcano: isLight ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-500/20 text-indigo-300',
      natureza: isLight ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-300',
      gelo: isLight ? 'bg-sky-100 text-sky-700' : 'bg-sky-500/20 text-sky-300',
      raio: isLight ? 'bg-yellow-100 text-yellow-700' : 'bg-yellow-500/20 text-yellow-300',
      veneno: isLight ? 'bg-lime-100 text-lime-700' : 'bg-lime-500/20 text-lime-300',
    };
    return colors[el] || (isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-700/50 text-slate-400');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Rolagem de Dados */}
      <div>
        <h3 className={`text-sm font-semibold mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
          Rolagem de Dados
        </h3>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {commonDice.map((dice) => (
            <button
              key={dice.value}
              onClick={() => handleDiceRoll(dice.value)}
              className={`
                px-3 py-2 text-sm font-medium rounded-lg border transition-all cursor-pointer
                ${isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 border-slate-600/50'
                }
              `}
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
            className={`
              flex-1 px-2 py-1 text-sm rounded border
              ${isLight
                ? 'bg-white border-slate-300 text-slate-700'
                : 'bg-slate-800 border-slate-600 text-slate-200'
              }
            `}
          />
          <button
            onClick={handleCustomDiceRoll}
            className={`
              px-3 py-1 text-sm font-medium rounded border transition-all cursor-pointer
              ${isLight
                ? 'bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-300'
                : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/30'
              }
            `}
          >
            Rolar
          </button>
        </div>
      </div>

      {/* Habilidades Ativas */}
      {vantagensAtivas.length > 0 && (
        <div>
          <h3 className={`text-sm font-semibold mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            Habilidades Ativas
          </h3>
          <div className="space-y-2">
            {vantagensAtivas.map((vantagem, i) => (
              <button
                key={i}
                onClick={() => onUsarHabilidade && onUsarHabilidade(vantagem)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg border transition-all cursor-pointer
                  ${isLight
                    ? 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-900'
                    : 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-200'
                  }
                `}
                title={vantagem.descricao || vantagem.nome}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{vantagem.nome}</span>
                  {vantagem.usar > 1 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${isLight ? 'bg-purple-200 text-purple-700' : 'bg-purple-500/30 text-purple-300'}`}>
                      x{vantagem.usar}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {vantagem.dano_base && (
                    <span className={`text-xs ${isLight ? 'text-red-600' : 'text-red-400'}`}>
                      {vantagem.dano_base}
                    </span>
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
          <h3 className={`text-sm font-semibold mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            Equipamentos
          </h3>
          <div className="space-y-1.5">
            {equipamentos.map((equip, i) => (
              <button
                key={i}
                onClick={() => onUsarEquipamento && onUsarEquipamento(equip)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg border transition-all cursor-pointer
                  ${isLight
                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-200'
                  }
                `}
                title={equip.descricao || equip.nome}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{equip.nome}</span>
                  {equip.tipo && (
                    <span className={`text-xs ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
                      {Array.isArray(equip.tipo) ? equip.tipo[0] : equip.tipo}
                    </span>
                  )}
                </div>
                {equip.dano_base && (
                  <span className={`text-xs ${isLight ? 'text-red-600' : 'text-red-400'}`}>
                    {equip.dano_base}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tracos Passivos (vantagens passivas + desvantagens) - info only */}
      {(vantagensPassivas.length > 0 || desvantagens.length > 0) && (
        <div>
          <h3 className={`text-sm font-semibold mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            Tracos
          </h3>
          <div className="space-y-1">
            {vantagensPassivas.map((v, i) => (
              <div
                key={`v-${i}`}
                className={`px-2 py-1.5 rounded text-xs ${isLight ? 'bg-green-50 text-green-700' : 'bg-green-500/10 text-green-400'}`}
                title={v.descricao || ''}
              >
                + {v.nome}
              </div>
            ))}
            {desvantagens.map((d, i) => (
              <div
                key={`d-${i}`}
                className={`px-2 py-1.5 rounded text-xs ${isLight ? 'bg-red-50 text-red-700' : 'bg-red-500/10 text-red-400'}`}
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
        <div className={`text-center py-4 text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Selecione um personagem para ver habilidades
        </div>
      )}
    </div>
  );
};