import React, { useState, useEffect } from 'react';
import { MessageTypeSelector } from '../../../../components/MessageTypeSelector';
import { inputAreaViewModel } from '../../../../viewmodels/Jogo';
import CooldownRoleplay from './CooldownRoleplay';

/**
 * Área de input de mensagens do jogo RPG
 * 📍 Usado por: EtapaJogoRPG
 * 🎯 MIGRADO: Agora usa ViewModel específico para lógica de negócio
 * 🎲 SISTEMA DE TURNOS: Controla rolagem inicial, turnos e mensagens roleplay
 */
const InputArea = ({ 
  mensagemAtual, 
  onMensagemChange,
  onKeyPress,
  onEnviarMensagem,
  onRolarDados,
  onExecutarAcao,
  // Novas props para sistema de turnos
  faseJogo = 'aguardando_inicio',
  ehMeuTurno = false,
  turnoIniciado = false,
  cooldownRoleplay = 0,
  onRolarDadoInicial,
  onIniciarTurno,
  jaRolouDadoInicial = false
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

  // 🎲 CONTROLE DE FASE
  const inputDesabilitado = 
    faseJogo === 'rolagem_inicial' || 
    (faseJogo === 'rodada_em_andamento' && ehMeuTurno && !turnoIniciado);
  const podeEnviarRoleplay = faseJogo === 'rodada_em_andamento' && !ehMeuTurno && cooldownRoleplay === 0;
  const mostrarCooldown = faseJogo === 'rodada_em_andamento' && !ehMeuTurno && cooldownRoleplay > 0;

  // 🎯 Placeholder dinâmico
  const getPlaceholderDinamico = () => {
    if (faseJogo === 'rolagem_inicial') {
      return 'Aguardando rolagem de dados inicial...';
    }
    if (faseJogo === 'rodada_em_andamento') {
      if (ehMeuTurno) {
        return 'É sua vez! Digite sua ação...';
      }
      return 'Aguarde sua vez ou envie uma mensagem roleplay...';
    }
    return placeholder;
  };

  return (
    <div className="p-6 bg-black/20 backdrop-blur-sm border-t border-purple-500/20">
      <div className="max-w-4xl mx-auto">
        
        {/* Cooldown de mensagens roleplay */}
        {mostrarCooldown && (
          <CooldownRoleplay 
            segundosRestantes={cooldownRoleplay}
            ativo={mostrarCooldown}
          />
        )}

        {/* Aviso quando não é o turno */}
        {faseJogo === 'rodada_em_andamento' && !ehMeuTurno && cooldownRoleplay === 0 && (
          <div className="mb-3 p-3 bg-purple-900/30 border border-purple-500/30 rounded-lg">
            <p className="text-purple-300 text-sm text-center">
              ⏳ Não é seu turno. Você pode enviar mensagens roleplay
            </p>
          </div>
        )}

        {/* Botão para iniciar turno */}
        {faseJogo === 'rodada_em_andamento' && ehMeuTurno && !turnoIniciado && (
          <div className="mb-3 text-center">
            <button
              onClick={onIniciarTurno}
              className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-xl font-bold text-lg shadow-lg transform transition-all hover:scale-105 animate-pulse"
            >
              <span className="flex items-center justify-center space-x-2">
                <span className="text-2xl">⚡</span>
                <span>Iniciar Turno</span>
              </span>
            </button>
            <p className="text-cyan-300 text-sm mt-2">
              Clique para receber a mensagem inicial do Mestre
            </p>
          </div>
        )}

        {/* Aviso após iniciar turno */}
        {faseJogo === 'rodada_em_andamento' && ehMeuTurno && turnoIniciado && (
          <div className="mb-3 p-3 bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border border-cyan-400/50 rounded-lg">
            <p className="text-cyan-300 text-sm text-center font-bold">
              ⚡ É SUA VEZ! Responda ao Mestre
            </p>
          </div>
        )}

        {/* Seletor de tipo de mensagem - apenas durante rodadas */}
        {faseJogo === 'rodada_em_andamento' && (
          <MessageTypeSelector 
            selectedType={messageType}
            onTypeChange={handleMessageTypeChange}
            className="mb-3"
          />
        )}
        
        {/* Input de mensagem */}
        <div className="flex space-x-3">
          <input 
            type="text" 
            placeholder={getPlaceholderDinamico()}
            value={mensagemAtual || ''}
            onChange={onMensagemChange}
            onKeyPress={handleKeyPress}
            disabled={connectionStatus.status === 'error' || isSending || inputDesabilitado}
            className={`flex-1 px-4 py-3 rounded-lg border bg-black/20 backdrop-blur-sm ${
              ehMeuTurno && faseJogo === 'rodada_em_andamento'
                ? 'border-cyan-400 ring-2 ring-cyan-500/50'
                : 'border-purple-500/30'
            } text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50`}
          />
          <button 
            onClick={enviarMensagemComTipo}
            disabled={connectionStatus.status === 'error' || !mensagemAtual?.trim() || isSending || inputDesabilitado}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSending ? 'Enviando...' : 'Enviar'}
          </button>
          
          {/* Botão de dados rápido - apenas em jogo normal */}
          {faseJogo !== 'rolagem_inicial' && (
            <button 
              onClick={onRolarDados}
              disabled={connectionStatus.status === 'error'}
              className="px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Rolar dados (d20)"
            >
              🎲
            </button>
          )}
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