import React from 'react';
import { useTheme } from '../contexts/theme';

/**
 * Componente para exibir mensagens RPG com diferentes tipos
 */
export const RPGMessage = ({ message, className = '' }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Obter configuração do tipo de mensagem
  const getMessageConfig = (type) => {
    const configs = {
      chat: {
        icon: '💬',
        label: 'Chat',
        bgColor: isLight ? 'bg-slate-100' : 'bg-slate-800/50',
        textColor: isLight ? 'text-slate-800' : 'text-slate-200',
        borderColor: 'border-slate-300/50'
      },
      ic: {
        icon: '🗣️',
        label: 'IC',
        bgColor: isLight ? 'bg-blue-50' : 'bg-blue-500/20',
        textColor: isLight ? 'text-blue-800' : 'text-blue-200',
        borderColor: 'border-blue-300/50'
      },
      ooc: {
        icon: '📢',
        label: 'OOC',
        bgColor: isLight ? 'bg-gray-50' : 'bg-gray-500/20',
        textColor: isLight ? 'text-gray-800' : 'text-gray-200',
        borderColor: 'border-gray-300/50'
      },
      action: {
        icon: '⚡',
        label: 'Ação',
        bgColor: isLight ? 'bg-yellow-50' : 'bg-yellow-500/20',
        textColor: isLight ? 'text-yellow-800' : 'text-yellow-200',
        borderColor: 'border-yellow-300/50'
      },
      system: {
        icon: '⚙️',
        label: 'Sistema',
        bgColor: isLight ? 'bg-purple-50' : 'bg-purple-500/20',
        textColor: isLight ? 'text-purple-800' : 'text-purple-200',
        borderColor: 'border-purple-300/50'
      },
      gm: {
        icon: '👑',
        label: 'Mestre',
        bgColor: isLight ? 'bg-red-50' : 'bg-red-500/20',
        textColor: isLight ? 'text-red-800' : 'text-red-200',
        borderColor: 'border-red-300/50'
      },
      rpg_action: {
        icon: '⚔️',
        label: 'Ação RPG',
        bgColor: isLight ? 'bg-orange-50' : 'bg-orange-500/20',
        textColor: isLight ? 'text-orange-800' : 'text-orange-200',
        borderColor: 'border-orange-300/50'
      },
      dice_roll: {
        icon: '🎲',
        label: 'Dados',
        bgColor: isLight ? 'bg-green-50' : 'bg-green-500/20',
        textColor: isLight ? 'text-green-800' : 'text-green-200',
        borderColor: 'border-green-300/50'
      }
    };

    return configs[type] || configs.chat;
  };

  const config = getMessageConfig(message.type);

  // Formatar timestamp
  const formatTime = (timestamp) => {
    const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) : timestamp);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor} ${className}`}>
      <div className="flex items-start space-x-3">
        {/* Ícone do tipo */}
        <div className="flex-shrink-0 text-lg">
          {config.icon}
        </div>
        
        {/* Conteúdo da mensagem */}
        <div className="flex-1 min-w-0">
          {/* Header com usuário e tipo */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className={`font-semibold text-sm ${config.textColor}`}>
                {message.username || message.user || 'Sistema'}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.textColor} opacity-75`}>
                {config.label}
              </span>
            </div>
            <span className={`text-xs ${config.textColor} opacity-60`}>
              {formatTime(message.timestamp)}
            </span>
          </div>
          
          {/* Mensagem */}
          <div className={`text-sm ${config.textColor} leading-relaxed`}>
            {message.type === 'action' ? (
              <em>*{message.message}*</em>
            ) : (
              message.message
            )}
          </div>
          
          {/* Informações extras para alguns tipos */}
          {message.type === 'dice_roll' && message.dice && message.result && (
            <div className={`mt-2 text-xs ${config.textColor} opacity-75`}>
              <span className="font-mono bg-black/10 px-2 py-1 rounded">
                {message.dice} = {message.result}
              </span>
            </div>
          )}
          
          {message.type === 'rpg_action' && (message.target || message.description) && (
            <div className={`mt-2 text-xs ${config.textColor} opacity-75`}>
              {message.target && (
                <span className="inline-block mr-2">
                  → <strong>{message.target}</strong>
                </span>
              )}
              {message.description && (
                <span className="italic">
                  {message.description}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 