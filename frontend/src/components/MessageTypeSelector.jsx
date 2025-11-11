import React, { useState } from 'react';
import { useTheme } from '../contexts/theme';

/**
 * Seletor de tipo de mensagem para chat RPG
 */
export const MessageTypeSelector = ({ selectedType, onTypeChange, className = '' }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [hoveredType, setHoveredType] = useState(null);

  const messageTypes = [
    {
      value: 'chat',
      label: 'Chat',
      icon: '💬',
      description: 'Mensagem normal',
      tooltip: 'Mensagem normal de chat entre jogadores'
    },
    {
      value: 'ic',
      label: 'IC',
      icon: '🗣️',
      description: 'In Character',
      tooltip: 'In Character - Fale como seu personagem'
    },
    {
      value: 'ooc',
      label: 'OOC',
      icon: '📢',
      description: 'Out of Character',
      tooltip: 'Out of Character - Fale fora do personagem'
    },
    {
      value: 'action',
      label: 'Ação',
      icon: '⚡',
      description: 'Ação/Emote',
      tooltip: 'Ação/Emote - Descreva ações do personagem'
    },
    {
      value: 'gm',
      label: 'Mestre',
      icon: '👑',
      description: 'Mensagem do Mestre',
      tooltip: 'Mensagem do Mestre - Narração oficial'
    }
  ];

  const handleTypeChange = (value) => {
    console.log('🔘 [MessageTypeSelector] Botão clicado:', value);
    onTypeChange(value);
  };

  return (
    <div className={`relative flex flex-wrap gap-1.5 ${className}`}>
      {messageTypes.map((type) => (
        <div key={type.value} className="relative group">
          <button
            onClick={() => handleTypeChange(type.value)}
            onMouseEnter={() => setHoveredType(type.value)}
            onMouseLeave={() => setHoveredType(null)}
            className={`
              flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all transform hover:scale-105
              ${selectedType === type.value
                ? isLight
                  ? 'bg-purple-600 text-white border-2 border-purple-700 shadow-lg'
                  : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white border-2 border-purple-400 shadow-lg shadow-purple-500/50'
                : isLight
                  ? 'bg-white text-slate-700 border border-slate-300 hover:bg-purple-50 hover:border-purple-300'
                  : 'bg-slate-800/80 text-slate-300 border border-slate-600/50 hover:bg-slate-700/80 hover:border-purple-500/50'
              }
            `}
          >
            <span className="text-sm">{type.icon}</span>
            <span>{type.label}</span>
          </button>
          
          {/* Tooltip customizada */}
          {hoveredType === type.value && (
            <div className={`
              absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap z-50
              animate-in fade-in slide-in-from-bottom-2 duration-200
              ${isLight
                ? 'bg-slate-900 text-white border border-slate-700'
                : 'bg-slate-800 text-white border border-purple-500/50 shadow-lg shadow-purple-500/20'
              }
            `}>
              <div className="flex items-center space-x-2">
                <span className="text-base">{type.icon}</span>
                <div>
                  <div className="font-bold">{type.label}</div>
                  <div className="text-xs opacity-90">{type.tooltip}</div>
                </div>
              </div>
              {/* Seta do tooltip */}
              <div className={`
                absolute top-full left-1/2 transform -translate-x-1/2 -mt-px
                border-4 border-transparent
                ${isLight ? 'border-t-slate-900' : 'border-t-slate-800'}
              `} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}; 