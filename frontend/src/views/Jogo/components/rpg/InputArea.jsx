import React, { useState, useEffect } from 'react';
import { MessageTypeSelector } from '../../../../components/MessageTypeSelector';
import { inputAreaViewModel } from '../../../../viewmodels/Jogo';

/**
 * Área de input de mensagens do jogo RPG
 * 📍 Usado por: EtapaJogoRPG
 * 🎯 MIGRADO: Agora usa ViewModel específico para lógica de negócio
 */
const InputArea = ({ 
  mensagemAtual, 
  onMensagemChange,
  onKeyPress,
  onEnviarMensagem,
  onRolarDados,
  onExecutarAcao
}) => {
  // 🎯 VIEWMODEL - Estado reativo
  const [viewModelState, setViewModelState] = useState(inputAreaViewModel.getState());

  // 🔄 SUBSCRIBE AO VIEWMODEL
  useEffect(() => {
    const unsubscribe = inputAreaViewModel.subscribe(setViewModelState);
    return unsubscribe;
  }, []);

  // 📊 DESTRUCTURING DO ESTADO
  const { messageType, isSending } = viewModelState;

  // 🚀 INICIALIZAÇÃO
  useEffect(() => {
    inputAreaViewModel.initialize();
    
    // Cleanup ao desmontar
    return () => {
      inputAreaViewModel.destroy();
    };
  }, []);

  // 🎯 HANDLERS: Usando ViewModel
  const handleMessageTypeChange = (type) => {
    inputAreaViewModel.setMessageType(type);
  };

  const enviarMensagemComTipo = async () => {
    const sucesso = await inputAreaViewModel.enviarMensagem(mensagemAtual, onEnviarMensagem);
    if (sucesso && onEnviarMensagem) {
      onEnviarMensagem();
    }
  };

  const handleKeyPress = (e) => {
    const preventDefault = inputAreaViewModel.handleKeyPress(e, enviarMensagemComTipo);
    if (preventDefault) {
      e.preventDefault();
    }
    
    // Chamar callback adicional se existir
    if (onKeyPress) {
      onKeyPress(e);
    }
  };

  // 📋 HELPERS: Via ViewModel
  const placeholder = inputAreaViewModel.getPlaceholder();
  const connectionStatus = inputAreaViewModel.getConnectionStatus();
  const messageTypeOptions = inputAreaViewModel.getMessageTypeOptions();

  return (
    <div className="p-6 bg-black/20 backdrop-blur-sm border-t border-purple-500/20">
      <div className="max-w-4xl mx-auto">
        {/* Seletor de tipo de mensagem */}
        <MessageTypeSelector 
          selectedType={messageType}
          onTypeChange={handleMessageTypeChange}
          className="mb-3"
        />
        
        {/* Input de mensagem */}
        <div className="flex space-x-3">
          <input 
            type="text" 
            placeholder={placeholder}
            value={mensagemAtual || ''}
            onChange={onMensagemChange}
            onKeyPress={handleKeyPress}
            disabled={connectionStatus.status === 'error' || isSending}
            className={`flex-1 px-4 py-3 rounded-lg border bg-black/20 backdrop-blur-sm border-purple-500/30 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50`}
          />
          <button 
            onClick={enviarMensagemComTipo}
            disabled={connectionStatus.status === 'error' || !mensagemAtual?.trim() || isSending}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSending ? 'Enviando...' : 'Enviar'}
          </button>
          
          {/* Botão de dados rápido */}
          <button 
            onClick={onRolarDados}
            disabled={connectionStatus.status === 'error'}
            className="px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Rolar dados (d20)"
          >
            🎲
          </button>
        </div>
        
        {/* Status de conexão */}
        {connectionStatus.status === 'error' && (
          <div className="mt-2 text-center">
            <span className={`text-xs ${connectionStatus.color}`}>
              ⚠️ {connectionStatus.text}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputArea; 