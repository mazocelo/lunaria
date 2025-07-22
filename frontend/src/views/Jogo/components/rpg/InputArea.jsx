import React, { useState } from 'react';
import { MessageTypeSelector } from '../../../../components/MessageTypeSelector';
import { useSocketStore } from '../../../../store';

/**
 * Área de input de mensagens do jogo RPG
 * 📍 Usado por: EtapaJogoRPG
 */
const InputArea = ({ 
  mensagemAtual, 
  onMensagemChange,
  onKeyPress,
  onEnviarMensagem,
  onRolarDados,
  onExecutarAcao
}) => {
  const [messageType, setMessageType] = useState('chat');
  
  // 🌐 SOCKET STORE - Usar diretamente
  const {
    isAuthenticated,
    isConnected,
    sendMessage
  } = useSocketStore();

  const enviarMensagemComTipo = () => {
    if (!mensagemAtual?.trim()) return;
    
    // Usar o socket store para enviar mensagem
    if (isConnected && isAuthenticated) {
      sendMessage({
        message: mensagemAtual,
        type: messageType
      });
    }
    
    // Também chamar o callback para atualizar local state
    if (onEnviarMensagem) {
      onEnviarMensagem();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagemComTipo();
    }
    
    // Chamar callback adicional se existir
    if (onKeyPress) {
      onKeyPress(e);
    }
  };

  return (
    <div className="p-6 bg-black/20 backdrop-blur-sm border-t border-purple-500/20">
      <div className="max-w-4xl mx-auto">
        {/* Seletor de tipo de mensagem */}
        <MessageTypeSelector 
          selectedType={messageType}
          onTypeChange={setMessageType}
          className="mb-3"
        />
        
        {/* Input de mensagem */}
        <div className="flex space-x-3">
          <input 
            type="text" 
            placeholder={`Digite sua mensagem ${messageType === 'action' ? '(ação/emote)' : messageType === 'ooc' ? '(fora do personagem)' : ''}...`}
            value={mensagemAtual || ''}
            onChange={onMensagemChange}
            onKeyPress={handleKeyPress}
            disabled={!isAuthenticated || !isConnected}
            className={`flex-1 px-4 py-3 rounded-lg border bg-black/20 backdrop-blur-sm border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50`}
          />
          <button 
            onClick={enviarMensagemComTipo}
            disabled={!isAuthenticated || !isConnected || !mensagemAtual?.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Enviar
          </button>
          
          {/* Botão de dados rápido */}
          <button 
            onClick={onRolarDados}
            disabled={!isAuthenticated || !isConnected}
            className="px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Rolar dados (d20)"
          >
            🎲
          </button>
        </div>
        
        {/* Status de conexão */}
        {(!isConnected || !isAuthenticated) && (
          <div className="mt-2 text-center">
            <span className="text-xs text-red-400">
              ⚠️ {!isConnected ? 'Desconectado' : 'Não autenticado'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputArea; 