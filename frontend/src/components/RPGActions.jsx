import React, { useState } from 'react';
import { useTheme } from '../contexts/theme';

/**
 * Componente para ações RPG rápidas
 */
export const RPGActions = ({ 
  onRollDice, 
  onExecuteAction, 
  onAttack, 
  onUseSkill, 
  onMove, 
  className = '' 
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  
  const [customDice, setCustomDice] = useState('1d20');
  const [customTarget, setCustomTarget] = useState('');
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

  // Ações comuns
  const commonActions = [
    { 
      label: 'Atacar', 
      icon: '⚔️', 
      action: 'attack',
      color: 'red',
      needsTarget: true
    },
    { 
      label: 'Defender', 
      icon: '🛡️', 
      action: 'defend',
      color: 'blue'
    },
    { 
      label: 'Conjurar', 
      icon: '🔮', 
      action: 'cast_spell',
      color: 'purple',
      needsTarget: true
    },
    { 
      label: 'Mover', 
      icon: '🏃', 
      action: 'move',
      color: 'green',
      needsTarget: true
    },
    { 
      label: 'Esconder', 
      icon: '👤', 
      action: 'hide',
      color: 'gray'
    },
    { 
      label: 'Procurar', 
      icon: '🔍', 
      action: 'search',
      color: 'yellow'
    }
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

  const handleAction = (action, needsTarget = false) => {
    if (needsTarget && !customTarget.trim()) {
      alert('Esta ação requer um alvo');
      return;
    }

    const target = needsTarget ? customTarget : null;
    const description = `${action}${target ? ` → ${target}` : ''}`;

    if (onExecuteAction) {
      onExecuteAction(action, target, description);
    }
  };

  const getActionColor = (color) => {
    const colors = {
      red: isLight 
        ? 'bg-red-100 hover:bg-red-200 text-red-700 border-red-300' 
        : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30',
      blue: isLight 
        ? 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300' 
        : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30',
      purple: isLight 
        ? 'bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-300' 
        : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/30',
      green: isLight 
        ? 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300' 
        : 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-500/30',
      gray: isLight 
        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300' 
        : 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 border-gray-500/30',
      yellow: isLight 
        ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border-yellow-300' 
        : 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border-yellow-500/30'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Rolagem de Dados */}
      <div>
        <h3 className={`text-sm font-semibold mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
          🎲 Rolagem de Dados
        </h3>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {commonDice.map((dice) => (
            <button
              key={dice.value}
              onClick={() => handleDiceRoll(dice.value)}
              className={`
                px-3 py-2 text-sm font-medium rounded-lg border transition-all
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
              px-3 py-1 text-sm font-medium rounded border transition-all
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

      {/* Ações Rápidas */}
      <div>
        <h3 className={`text-sm font-semibold mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
          ⚡ Ações Rápidas
        </h3>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {commonActions.map((action) => (
            <button
              key={action.action}
              onClick={() => handleAction(action.action, action.needsTarget)}
              className={`
                flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all
                ${getActionColor(action.color)}
              `}
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        {/* Campo para alvo */}
        <input
          type="text"
          value={customTarget}
          onChange={(e) => setCustomTarget(e.target.value)}
          placeholder="Alvo (opcional)"
          className={`
            w-full px-2 py-1 text-sm rounded border
            ${isLight 
              ? 'bg-white border-slate-300 text-slate-700' 
              : 'bg-slate-800 border-slate-600 text-slate-200'
            }
          `}
        />
      </div>

      {/* Status Rápido */}
      <div>
        <h3 className={`text-sm font-semibold mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
          📊 Status Rápido
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Em Combate', icon: '⚔️', status: 'in_combat' },
            { label: 'Ferido', icon: '🩸', status: 'injured' },
            { label: 'Conjurando', icon: '🔮', status: 'casting' },
            { label: 'Escondido', icon: '👤', status: 'hidden' }
          ].map((status) => (
            <button
              key={status.status}
              className={`
                flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all
                ${isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                  : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 border-slate-600/50'
                }
              `}
            >
              <span>{status.icon}</span>
              <span>{status.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 