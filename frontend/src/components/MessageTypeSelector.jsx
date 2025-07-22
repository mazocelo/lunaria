import React from 'react';
import { useTheme } from '../contexts/theme';

/**
 * Seletor de tipo de mensagem para chat RPG
 */
export const MessageTypeSelector = ({ selectedType, onTypeChange, className = '' }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const messageTypes = [
    {
      value: 'chat',
      label: 'Chat',
      icon: '💬',
      description: 'Mensagem normal'
    },
    {
      value: 'ic',
      label: 'IC',
      icon: '🗣️',
      description: 'In Character'
    },
    {
      value: 'ooc',
      label: 'OOC',
      icon: '📢',
      description: 'Out of Character'
    },
    {
      value: 'action',
      label: 'Ação',
      icon: '⚡',
      description: 'Ação/Emote'
    },
    {
      value: 'gm',
      label: 'Mestre',
      icon: '👑',
      description: 'Mensagem do Mestre'
    }
  ];

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {messageTypes.map((type) => (
        <button
          key={type.value}
          onClick={() => onTypeChange(type.value)}
          className={`
            flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-all
            ${selectedType === type.value
              ? isLight
                ? 'bg-purple-100 text-purple-700 border border-purple-300'
                : 'bg-purple-500/30 text-purple-200 border border-purple-500/50'
              : isLight
                ? 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                : 'bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-600/50'
            }
          `}
          title={type.description}
        >
          <span>{type.icon}</span>
          <span>{type.label}</span>
        </button>
      ))}
    </div>
  );
}; 