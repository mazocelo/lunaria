import React, { useState, useEffect, useRef } from 'react';
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
  dadoSolicitadoInfo = null,
  aguardandoMestre = false,
  // Props de combate
  combateAtivo = false
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
  const { isSending } = viewModelState;

  // 🚀 INICIALIZAÇÃO
  useEffect(() => {
    inputAreaViewModel.initialize();
    
    // Cleanup ao desmontar
    return () => {
      inputAreaViewModel.destroy();
    };
  }, []);

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
        
        {/* LINHA 1: Status/Avisos */}
        <div className="flex items-center justify-end gap-4">
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
          
        {/* BANNER: Mestre solicitou dado específico */}
        {dadosSolicitados && dadoSolicitadoInfo && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between gap-4 px-5 py-3.5 bg-gradient-to-r from-amber-900/50 to-orange-900/40 border-2 border-amber-400/60 rounded-xl shadow-lg shadow-amber-500/10">
              <div className="flex items-center gap-3">
                <span className="text-2xl animate-bounce">🎲</span>
                <div>
                  <p className="text-amber-100 font-bold text-sm">
                    O Mestre pede: {dadoSolicitadoInfo.teste || 'Rolagem'}
                  </p>
                  <p className="text-amber-300/80 text-xs">
                    {dadoSolicitadoInfo.tipoDado?.toUpperCase()} &middot; Dificuldade {dadoSolicitadoInfo.dificuldade}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onRolarDados && onRolarDados(dadoSolicitadoInfo.tipoDado, dadoSolicitadoInfo.teste);
                }}
                disabled={connectionStatus.status === 'error'}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-bold shadow-lg transition-all hover:scale-105 animate-pulse disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Rolar {dadoSolicitadoInfo.tipoDado?.toUpperCase()}
              </button>
            </div>
          </div>
        )}

        {/* BANNER: Aguardando resposta do Mestre após rolar dado */}
        {aguardandoMestre && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-center gap-3 px-5 py-3.5 bg-gradient-to-r from-purple-900/50 to-indigo-900/40 border-2 border-purple-400/50 rounded-xl shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" />
                <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.15s'}} />
                <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}} />
              </div>
              <p className="text-purple-200 font-semibold text-sm">
                O Mestre esta interpretando o resultado...
              </p>
            </div>
          </div>
        )}

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