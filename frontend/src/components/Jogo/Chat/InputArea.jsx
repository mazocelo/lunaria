import React, { useState, useEffect, useRef } from 'react';
import { MessageTypeSelector } from '../../MessageTypeSelector';
import { inputAreaViewModel } from '../../../viewmodels/Jogo';
import CooldownRoleplay from '../Gameplay/CooldownRoleplay';
import { TIMEOUTS } from '../../../constants/game';

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
  jaRolouDadoInicial = false,
  dadosSolicitados = false,
  aguardandoMestre = false,
  // Props de combate
  combateAtivo = false
}) => {
  // 🎯 VIEWMODEL - Estado reativo
  const [viewModelState, setViewModelState] = useState(inputAreaViewModel.getState());
  
  // ⏳ Estado de loading para botão iniciar turno
  const [iniciandoTurno, setIniciandoTurno] = useState(false);

  // 🎲 Popover de dados
  const [showDicePopover, setShowDicePopover] = useState(false);
  const dicePopoverRef = useRef(null);

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

  // 🎲 Click-outside para fechar popover de dados
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dicePopoverRef.current && !dicePopoverRef.current.contains(event.target)) {
        setShowDicePopover(false);
      }
    };
    if (showDicePopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDicePopover]);

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
    (faseJogo === 'rodada_em_andamento' && ehMeuTurno && !turnoIniciado) ||
    dadosSolicitados ||
    aguardandoMestre;
  const podeEnviarRoleplay = faseJogo === 'rodada_em_andamento' && !ehMeuTurno && cooldownRoleplay === 0;
  const mostrarCooldown = faseJogo === 'rodada_em_andamento' && !ehMeuTurno && cooldownRoleplay > 0;

  // 🎯 Placeholder dinâmico
  const getPlaceholderDinamico = () => {
    if (aguardandoMestre) {
      return '⏳ Aguardando resposta do Mestre...';
    }
    if (dadosSolicitados) {
      return '🎲 Role os dados antes de continuar!';
    }
    if (faseJogo === 'rolagem_inicial') {
      return 'Aguardando rolagem de dados inicial...';
    }
    if (faseJogo === 'rodada_em_andamento') {
      if (ehMeuTurno && combateAtivo) {
        return '⚔️ Combate! Descreva sua ação de combate...';
      }
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
          <div className="flex items-center gap-3">
            {faseJogo === 'rodada_em_andamento' && (
              <div className="bg-black/50 backdrop-blur-sm border-2 border-purple-500/40 rounded-xl px-4 py-2.5 shadow-lg">
                <MessageTypeSelector 
                  selectedType={messageType}
                  onTypeChange={handleMessageTypeChange}
                />
              </div>
            )}
            
            {/* Botão de Dados RPG - popover */}
            {faseJogo === 'rodada_em_andamento' && (
              <div className="relative" ref={dicePopoverRef}>
                <button
                  onClick={() => setShowDicePopover(!showDicePopover)}
                  className={`px-3 py-2.5 text-xl rounded-xl font-bold transition-all shadow-md bg-gradient-to-br from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 ${
                    dadosSolicitados
                      ? 'ring-2 ring-amber-400 animate-pulse shadow-amber-500/50'
                      : ''
                  } ${showDicePopover ? 'ring-2 ring-purple-300' : ''}`}
                  title="Rolar Dados"
                >
                  🎲
                </button>

                {showDicePopover && (
                  <div className="absolute bottom-full left-0 mb-2 p-3 glass rounded-xl border-2 border-purple-500/50 shadow-2xl animate-scale-in z-50 min-w-[240px]">
                    <p className="text-purple-300 text-xs font-semibold mb-2">Rolar Dados</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { tipo: 'd4', emoji: '🔺', classes: 'bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600' },
                        { tipo: 'd6', emoji: '🎲', classes: 'bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600' },
                        { tipo: 'd8', emoji: '🔶', classes: 'bg-gradient-to-br from-green-500 to-green-700 hover:from-green-400 hover:to-green-600' },
                        { tipo: 'd10', emoji: '🔟', classes: 'bg-gradient-to-br from-yellow-500 to-yellow-700 hover:from-yellow-400 hover:to-yellow-600' },
                        { tipo: 'd12', emoji: '🌟', classes: 'bg-gradient-to-br from-orange-500 to-orange-700 hover:from-orange-400 hover:to-orange-600' },
                        { tipo: 'd20', emoji: '⭐', classes: 'bg-gradient-to-br from-cyan-500 to-cyan-700 hover:from-cyan-400 hover:to-cyan-600' },
                        { tipo: 'd100', emoji: '💯', classes: 'bg-gradient-to-br from-pink-500 to-pink-700 hover:from-pink-400 hover:to-pink-600' }
                      ].map((dado) => (
                        <button
                          key={dado.tipo}
                          onClick={() => {
                            onRolarDados && onRolarDados(dado.tipo, '');
                            setShowDicePopover(false);
                          }}
                          disabled={connectionStatus.status === 'error'}
                          className={`px-2 py-2 rounded-lg font-bold transition-all shadow-md hover:shadow-lg transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${dado.classes}`}
                          title={`Rolar ${dado.tipo.toUpperCase()}`}
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-lg">{dado.emoji}</span>
                            <span className="text-[10px] text-white/80 mt-0.5">{dado.tipo}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
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
                  setTimeout(() => setIniciandoTurno(false), TIMEOUTS.INICIAR_TURNO_RESET);
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
          
        {/* COMBATE: Botões de ação rápida */}
        {combateAtivo && ehMeuTurno && turnoIniciado && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-red-300 mr-1">Ações:</span>
            {[
              { label: 'Atacar', emoji: '⚔️', acao: 'Ataco o inimigo mais próximo com minha arma!' },
              { label: 'Defender', emoji: '🛡️', acao: 'Me coloco em posição defensiva, protegendo-me dos ataques!' },
              { label: 'Habilidade', emoji: '✨', acao: 'Uso minha habilidade especial contra o inimigo!' },
              { label: 'Fugir', emoji: '🏃', acao: 'Tento fugir do combate!' }
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={() => {
                  if (onMensagemChange) {
                    onMensagemChange({ target: { value: btn.acao } });
                  }
                }}
                className="px-3 py-1.5 text-sm bg-red-900/40 border border-red-500/40 text-red-200 rounded-lg hover:bg-red-800/50 hover:border-red-400/60 transition-all"
              >
                {btn.emoji} {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* LINHA 2: Input + Botão Enviar */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder={getPlaceholderDinamico()}
            value={mensagemAtual || ''}
            onChange={onMensagemChange}
            onKeyPress={handleKeyPress}
            disabled={connectionStatus.status === 'error' || isSending || inputDesabilitado}
            className={`flex-1 min-w-0 px-5 py-3 text-base rounded-xl border-2 bg-black/30 backdrop-blur-sm shadow-lg ${
              ehMeuTurno && faseJogo === 'rodada_em_andamento' && turnoIniciado
                ? 'border-cyan-400 ring-2 ring-cyan-500/50 shadow-cyan-500/30'
                : 'border-purple-500/40'
            } text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 transition-all`}
          />

          <button
            onClick={enviarMensagemComTipo}
            disabled={connectionStatus.status === 'error' || !mensagemAtual?.trim() || isSending || inputDesabilitado}
            className="flex-shrink-0 w-28 py-3 text-sm bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {isSending ? 'Enviando...' : 'Enviar'}
          </button>
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