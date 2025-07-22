import React from 'react';
import { MessageTypeSelector } from '../../../../components/MessageTypeSelector';

/**
 * Área de input de mensagens do jogo RPG
 */
const InputArea = ({ 
  messageType, 
  setMessageType, 
  mensagemAtual, 
  setMensagemAtual, 
  webSocket, 
  onEnviarMensagem 
}) => {
  const enviarMensagemComTipo = () => {
    if (!mensagemAtual.trim()) return;
    
    webSocket.sendMessage({
      message: mensagemAtual,
      type: messageType
    });
    setMensagemAtual('');
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
            value={mensagemAtual}
            onChange={(e) => setMensagemAtual(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && enviarMensagemComTipo()}
            disabled={!webSocket.isAuthenticated}
            className={`flex-1 px-4 py-3 rounded-lg border bg-black/20 backdrop-blur-sm border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50`}
          />
          <button 
            onClick={enviarMensagemComTipo}
            disabled={!webSocket.isAuthenticated || !mensagemAtual.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputArea; 