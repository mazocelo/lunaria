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
  
  // ⏳ Estado de loading para botão iniciar turno
  const [iniciandoTurno, setIniciandoTurno] = useState(false);

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
    console.log('📝 [InputArea] Tipo de mensagem alterado:', type);
    console.log('📝 [InputArea] Estado anterior:', messageType);
    inputAreaViewModel.setMessageType(type);
    console.log('✅ [InputArea] Novo tipo definido no ViewModel:', inputAreaViewModel.messageType);
  };

  const enviarMensagemComTipo = async () => {
    console.log('📤 [InputArea] Tentando enviar mensagem:');
    console.log('   ├─ Tipo:', messageType);
    console.log('   ├─ Conteúdo:', mensagemAtual);
    console.log('   └─ Dados completos:', { message: mensagemAtual, type: messageType });
    
    const sucesso = await inputAreaViewModel.enviarMensagem(mensagemAtual, onEnviarMensagem);
    
    if (sucesso) {
      console.log('✅ [InputArea] Mensagem enviada com sucesso!');
      if (onEnviarMensagem) {
        onEnviarMensagem();
      }
    } else {
      console.error('❌ [InputArea] Falha ao enviar mensagem');
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
    <div className="px-4 py-4 bg-black/30 backdrop-blur-sm border-t-2 border-purple-500/30 shadow-2xl">
      <div className="w-full space-y-3">
        
        {/* LINHA 1: Message Type Selector + Status/Avisos */}
        <div className="flex items-center justify-between gap-4">
          {/* Seletor de tipo de mensagem - à esquerda */}
          {faseJogo === 'rodada_em_andamento' && (
            <div className="bg-black/50 backdrop-blur-sm border-2 border-purple-500/40 rounded-xl px-4 py-2.5 shadow-lg">
              <MessageTypeSelector 
                selectedType={messageType}
                onTypeChange={handleMessageTypeChange}
              />
            </div>
          )}
          
          {/* Mensagens de status/avisos - à direita */}
          <div className="flex-1 flex justify-end">
            {/* Cooldown de mensagens roleplay */}
            {mostrarCooldown && (
              <CooldownRoleplay 
                segundosRestantes={cooldownRoleplay}
                ativo={mostrarCooldown}
              />
            )}

            {/* Aviso quando não é o turno */}
            {faseJogo === 'rodada_em_andamento' && !ehMeuTurno && cooldownRoleplay === 0 && (
              <div className="px-4 py-2.5 bg-purple-900/40 border-2 border-purple-500/50 rounded-xl shadow-lg">
                <p className="text-purple-200 text-sm font-semibold">
                  ⏳ Não é seu turno. Você pode enviar mensagens roleplay
                </p>
              </div>
            )}

            {/* Botão para iniciar turno */}
            {faseJogo === 'rodada_em_andamento' && ehMeuTurno && !turnoIniciado && (
              <button
                onClick={async () => {
                  setIniciandoTurno(true);
                  if (onIniciarTurno) {
                    await onIniciarTurno();
                  }
                  setTimeout(() => setIniciandoTurno(false), 10000);
                }}
                disabled={iniciandoTurno}
                className={`px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
                  iniciandoTurno ? '' : 'hover:scale-105 animate-pulse'
                }`}
              >
                <span className="flex items-center space-x-2">
                  {iniciandoTurno ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Aguarde o Mestre...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl">⚡</span>
                      <span>Iniciar Turno</span>
                    </>
                  )}
                </span>
              </button>
            )}

            {/* Aviso após iniciar turno */}
            {faseJogo === 'rodada_em_andamento' && ehMeuTurno && turnoIniciado && (
              <div className="px-6 py-2.5 bg-gradient-to-r from-cyan-900/40 to-purple-900/40 border-2 border-cyan-400/70 rounded-xl shadow-xl animate-pulse">
                <p className="text-cyan-200 font-bold drop-shadow-lg">
                  ⚡ É SUA VEZ! Responda ao Mestre
                </p>
              </div>
            )}
          </div>
        </div>
          
        {/* LINHA 2: Input + Botões */}
        <div className="grid grid-cols-12 gap-3">
          {/* Input ocupa maior parte do espaço */}
          <input 
            type="text" 
            placeholder={getPlaceholderDinamico()}
            value={mensagemAtual || ''}
            onChange={onMensagemChange}
            onKeyPress={handleKeyPress}
            disabled={connectionStatus.status === 'error' || isSending || inputDesabilitado}
            className={`col-span-8 px-5 py-4 text-base rounded-xl border-2 bg-black/30 backdrop-blur-sm shadow-lg ${
              ehMeuTurno && faseJogo === 'rodada_em_andamento' && turnoIniciado
                ? 'border-cyan-400 ring-2 ring-cyan-500/50 shadow-cyan-500/30'
                : 'border-purple-500/40'
            } text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 transition-all`}
          />
          
          {/* Botão Enviar */}
          <button 
            onClick={enviarMensagemComTipo}
            disabled={connectionStatus.status === 'error' || !mensagemAtual?.trim() || isSending || inputDesabilitado}
            className="col-span-3 px-4 py-4 text-base bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {isSending ? 'Enviando...' : 'Enviar'}
          </button>
          
          {/* Botão de dados rápido - apenas em jogo normal */}
          {faseJogo !== 'rolagem_inicial' && (
            <button 
              onClick={() => onRolarDados && onRolarDados('d20', '')}
              disabled={connectionStatus.status === 'error'}
              className="col-span-1 px-3 py-4 text-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
              title="Rolar dados (d20)"
            >
              🎲
            </button>
          )}
        </div>
        
        {/* Status de conexão */}
        {connectionStatus.status === 'error' && (
          <div className="text-center">
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