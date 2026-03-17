import React, { useState, useRef, useCallback } from 'react';
import { useSocketStore } from '../../../store/index.js';
import CooldownRoleplay from '../Gameplay/CooldownRoleplay';
import { TIMEOUTS } from '../../../constants/game';

/**
 * Dock compacto de acoes do jogador.
 */
const ActionDock = ({
  mensagemAtual,
  onMensagemChange,
  onKeyPress,
  onEnviarMensagem,
  onRolarDados,
  onExecutarAcao,
  faseJogo = 'aguardando_inicio',
  ehMeuTurno = false,
  turnoIniciado = false,
  turnoStatus = 'idle',
  cooldownRoleplay = 0,
  onIniciarTurno,
  dadosSolicitados = false,
  dadoSolicitadoInfo = null,
  aguardandoMestre = false,
  combateAtivo = false,
  combateMonstros = [],
  habilidadesPersonagem = [],
  magiasPersonagem = [],
  manaAtual = 0,
  manaMax = 0,
  cooldownsHabilidades = {},
  concentracaoAtiva = null,
  onUsarMagia,
  combatIntentAtual = null,
  onClearCombatIntent = null,
}) => {
  const isConnected = useSocketStore((s) => s.isConnected);
  const inRoom = useSocketStore((s) => s.inRoom);

  const [isSending, setIsSending] = useState(false);
  const [iniciandoTurno, setIniciandoTurno] = useState(false);
  const [showSkillMenu, setShowSkillMenu] = useState(false);
  const [showSpellMenu, setShowSpellMenu] = useState(false);
  const lastSentTimeRef = useRef(null);

  const getConnectionStatus = useCallback(() => {
    if (!isConnected) return { status: 'error', text: 'Desconectado', color: 'text-red-400' };
    if (!inRoom) return { status: 'warning', text: 'Conectando...', color: 'text-yellow-400' };
    return { status: 'success', text: 'Conectado', color: 'text-green-400' };
  }, [inRoom, isConnected]);

  const connectionStatus = getConnectionStatus();

  const enviarMensagemComTipo = async () => {
    if (!mensagemAtual?.trim() || isSending) return;
    if (lastSentTimeRef.current && Date.now() - lastSentTimeRef.current < 1000) return;

    setIsSending(true);
    try {
      await onEnviarMensagem();
      lastSentTimeRef.current = Date.now();
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagemComTipo();
    }
    if (onKeyPress) onKeyPress(e);
  };

  const inputDesabilitado =
    faseJogo === 'rolagem_inicial' ||
    (faseJogo === 'rodada_em_andamento' && ehMeuTurno && !turnoIniciado) ||
    dadosSolicitados ||
    aguardandoMestre ||
    turnoStatus === 'starting' ||
    turnoStatus === 'finishing';

  const mostrarCooldown = faseJogo === 'rodada_em_andamento' && !ehMeuTurno && cooldownRoleplay > 0;

  const getPlaceholderDinamico = () => {
    if (aguardandoMestre) return 'Aguardando resposta do Mestre...';
    if (turnoStatus === 'starting') return 'O Mestre esta abrindo seu turno...';
    if (turnoStatus === 'resolving_roll') return 'O Mestre esta interpretando sua rolagem...';
    if (dadosSolicitados) return 'Role os dados antes de continuar.';
    if (faseJogo === 'rolagem_inicial') return 'Aguardando rolagem inicial...';
    if (faseJogo === 'rodada_em_andamento') {
      if (ehMeuTurno && combateAtivo) return 'Combate. Descreva sua acao...';
      if (ehMeuTurno) return 'E sua vez. Digite sua acao...';
      return 'Aguarde sua vez ou envie uma mensagem roleplay...';
    }
    return 'Digite sua mensagem...';
  };

  const fillInput = (text, intent = null) => {
    if (onMensagemChange) onMensagemChange({ target: { value: text } }, intent);
  };

  const showQuickActions = ehMeuTurno && turnoIniciado && faseJogo === 'rodada_em_andamento';
  const primeiroMonstroVivo = combateMonstros.find((m) => m.status === 'vivo');
  const alvoIdPadrao = primeiroMonstroVivo?.id || null;
  const combatIntentLabel = combatIntentAtual?.habilidadeNome
    || combatIntentAtual?.magiaNome
    || ({
      atacar: 'Atacar',
      defender: 'Defender',
      fugir: 'Fugir',
      usar_habilidade: 'Habilidade',
      conjurar_magia: 'Magia'
    }[combatIntentAtual?.tipo] || 'Acao selecionada');

  return (
    <div className="px-4 py-3 game-glass-solid border-t border-white/[0.08]">
      <div className="w-full space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {mostrarCooldown && (
            <CooldownRoleplay segundosRestantes={cooldownRoleplay} ativo={mostrarCooldown} />
          )}
          {faseJogo === 'rodada_em_andamento' && !ehMeuTurno && cooldownRoleplay === 0 && (
            <div className="px-3 py-1.5 game-glass-subtle border border-purple-500/40 rounded-lg">
              <p className="text-purple-200 text-xs font-semibold">Nao e seu turno. Mensagens roleplay liberadas.</p>
            </div>
          )}
          {connectionStatus.status !== 'success' && (
            <span className={`text-xs ${connectionStatus.color}`}>{connectionStatus.text}</span>
          )}
        </div>

        {faseJogo === 'rodada_em_andamento' && ehMeuTurno && (
          <div className="flex justify-center">
            {!turnoIniciado ? (
              <button
                type="button"
                onClick={async () => {
                  setIniciandoTurno(true);
                  if (onIniciarTurno) await onIniciarTurno();
                  setTimeout(() => setIniciandoTurno(false), TIMEOUTS.INICIAR_TURNO_RESET);
                }}
                disabled={iniciandoTurno || aguardandoMestre}
                className={`px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
                  iniciandoTurno || aguardandoMestre ? '' : 'hover:scale-105 animate-pulse'
                }`}
              >
                <span className="flex items-center space-x-2">
                  {iniciandoTurno || aguardandoMestre ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
            ) : (
              <div className="px-4 py-2 game-glass border border-cyan-400/40 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.1)] animate-pulse">
                <p className="text-cyan-200 text-sm font-bold">
                  {turnoStatus === 'awaiting_roll' ? 'Sua vez: resolva a rolagem pendente.' : 'E SUA VEZ! Responda ao Mestre.'}
                </p>
              </div>
            )}
          </div>
        )}

        {dadosSolicitados && dadoSolicitadoInfo && (
          <div className="flex items-center justify-between gap-3 px-4 py-2 bg-gradient-to-r from-amber-900/50 to-orange-900/40 border border-amber-400/60 rounded-lg shadow-lg animate-fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl animate-bounce flex-shrink-0">🎲</span>
              <div className="min-w-0">
                <p className="text-amber-100 font-bold text-sm truncate">
                  O Mestre pede: {dadoSolicitadoInfo.teste || 'Rolagem'}
                </p>
                <p className="text-amber-300/80 text-xs">
                  {dadoSolicitadoInfo.tipoDado?.toUpperCase()} · DC {dadoSolicitadoInfo.dificuldade}
                  {dadoSolicitadoInfo.modificador != null && dadoSolicitadoInfo.modificador !== 0 && (
                    <span className="ml-1 text-green-300 font-bold">
                      ({dadoSolicitadoInfo.modificador > 0 ? '+' : ''}{dadoSolicitadoInfo.modificador} {dadoSolicitadoInfo.atributo})
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRolarDados && onRolarDados(dadoSolicitadoInfo.tipoDado, dadoSolicitadoInfo.teste, dadoSolicitadoInfo)}
              disabled={connectionStatus.status === 'error'}
              className="flex-shrink-0 px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-lg font-bold shadow-lg transition-all hover:scale-105 animate-pulse disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Rolar {dadoSolicitadoInfo.tipoDado?.toUpperCase()}
            </button>
          </div>
        )}

        {showQuickActions && combateAtivo && (
          <div className="flex items-center gap-2 flex-wrap">
            {manaMax > 0 && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-xs text-blue-300">MP</span>
                <div className="w-20 h-2 bg-blue-900/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                    style={{ width: `${Math.max(0, (manaAtual / manaMax) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-blue-200 font-mono">{manaAtual}/{manaMax}</span>
              </div>
            )}
            {[
              { label: 'Atacar', emoji: '⚔', acao: 'Ataco o inimigo mais proximo com minha arma!', intent: { tipo: 'atacar', alvoId: alvoIdPadrao } },
              { label: 'Defender', emoji: '🛡', acao: 'Me coloco em posicao defensiva, protegendo-me dos ataques!', intent: { tipo: 'defender' } },
              { label: 'Fugir', emoji: '🏃', acao: 'Tento fugir do combate!', intent: { tipo: 'fugir' } }
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={() => fillInput(btn.acao, btn.intent)}
                className="px-3 py-1.5 text-xs game-glass-subtle border border-red-500/25 text-red-200 rounded-lg hover:border-red-400/40 hover:bg-red-500/10 transition-all"
              >
                {btn.emoji} {btn.label}
              </button>
            ))}

            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowSkillMenu(!showSkillMenu); setShowSpellMenu(false); }}
                className={`px-3 py-1.5 text-xs border rounded-lg transition-all ${
                  habilidadesPersonagem.length > 0
                    ? 'bg-purple-900/40 border-purple-500/40 text-purple-200 hover:bg-purple-800/50'
                    : 'bg-red-900/40 border-red-500/40 text-red-200 hover:bg-red-800/50'
                }`}
              >
                ✨ Habilidades {habilidadesPersonagem.length > 0 ? `(${habilidadesPersonagem.length})` : ''}
              </button>

              {showSkillMenu && habilidadesPersonagem.length > 0 && (
                <div className="absolute bottom-full left-0 mb-1 w-64 max-h-48 overflow-y-auto game-glass-solid border border-purple-500/30 rounded-xl shadow-lg z-50">
                  {habilidadesPersonagem.map((hab) => {
                    const cdRestante = cooldownsHabilidades[`hab_${hab.id}`] || cooldownsHabilidades[hab.id] || 0;
                    const semMana = hab.custo_mana > manaAtual;
                    const desabilitada = cdRestante > 0 || semMana;
                    return (
                      <button
                        type="button"
                        key={hab.id}
                        disabled={desabilitada}
                        onClick={() => {
                          fillInput(`Uso a habilidade ${hab.nome} contra o inimigo!`, {
                            tipo: 'usar_habilidade',
                            habilidadeId: hab.id,
                            habilidadeNome: hab.nome,
                            alvoId: alvoIdPadrao
                          });
                          setShowSkillMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm border-b border-slate-700/50 last:border-0 transition-colors ${
                          desabilitada ? 'text-slate-500 cursor-not-allowed' : 'text-purple-200 hover:bg-purple-800/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{hab.nome}</span>
                          <div className="flex items-center gap-1.5 text-xs">
                            {hab.custo_mana > 0 && <span className={semMana ? 'text-red-400' : 'text-blue-300'}>{hab.custo_mana} MP</span>}
                            {cdRestante > 0 && <span className="text-yellow-400">{cdRestante}t</span>}
                          </div>
                        </div>
                        {hab.descricao && <p className="text-xs text-slate-400 mt-0.5 truncate">{hab.descricao}</p>}
                      </button>
                    );
                  })}
                </div>
              )}

              {showSkillMenu && habilidadesPersonagem.length === 0 && (
                <div className="absolute bottom-full left-0 mb-1 w-48 game-glass-solid border border-white/[0.08] rounded-xl shadow-lg z-50 p-3">
                  <p className="text-xs text-slate-400">Nenhuma habilidade disponivel para sua classe e nivel.</p>
                </div>
              )}
            </div>

            {magiasPersonagem.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowSpellMenu(!showSpellMenu); setShowSkillMenu(false); }}
                  className="px-3 py-1.5 text-xs bg-blue-900/40 border border-blue-500/40 text-blue-200 rounded-lg hover:bg-blue-800/50 transition-all"
                >
                  🔮 Magias ({magiasPersonagem.length})
                </button>

                {showSpellMenu && (
                  <div className="absolute bottom-full left-0 mb-1 w-72 max-h-56 overflow-y-auto game-glass-solid border border-blue-500/30 rounded-xl shadow-lg z-50">
                    {concentracaoAtiva && (
                      <div className="px-3 py-1.5 border-b border-blue-500/20 bg-amber-900/30">
                        <p className="text-xs text-amber-200">⚡ Concentracao: <span className="font-bold">{concentracaoAtiva.nome || 'Ativa'}</span></p>
                      </div>
                    )}
                    {magiasPersonagem.map((mag) => {
                      const cdKey = `mag_${mag.id}`;
                      const cdRestante = cooldownsHabilidades[cdKey] || 0;
                      const semMana = mag.custo_mana > manaAtual;
                      const bloqueioConcentracao = mag.usa_concentracao && concentracaoAtiva;
                      const desabilitada = cdRestante > 0 || semMana || bloqueioConcentracao;
                      let motivo = '';
                      if (cdRestante > 0) motivo = `CD: ${cdRestante}t`;
                      else if (semMana) motivo = 'Mana insuficiente';
                      else if (bloqueioConcentracao) motivo = 'Concentracao ativa';

                      return (
                        <button
                          type="button"
                          key={mag.id}
                          disabled={desabilitada}
                          onClick={() => {
                            if (onUsarMagia) {
                              onUsarMagia(mag);
                            } else {
                              fillInput(`Conjuro a magia ${mag.nome}!`, {
                                tipo: 'conjurar_magia',
                                magiaId: mag.id,
                                magiaNome: mag.nome,
                                alvoId: alvoIdPadrao
                              });
                            }
                            setShowSpellMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm border-b border-slate-700/50 last:border-0 transition-colors ${
                            desabilitada ? 'text-slate-500 cursor-not-allowed' : 'text-blue-200 hover:bg-blue-800/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium">{mag.nome}</span>
                              {mag.escola_magia && (
                                <span className="px-1.5 py-0.5 text-[10px] rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">
                                  {mag.escola_magia}
                                </span>
                              )}
                              {mag.usa_concentracao && (
                                <span className="text-[10px] text-amber-300" title="Requer concentracao">⚡</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                              {mag.custo_mana > 0 && <span className={semMana ? 'text-red-400' : 'text-blue-300'}>{mag.custo_mana} MP</span>}
                              {cdRestante > 0 && <span className="text-yellow-400">{cdRestante}t</span>}
                              {motivo && desabilitada && cdRestante === 0 && <span className="text-red-400/70 text-[10px]">{motivo}</span>}
                            </div>
                          </div>
                          {mag.descricao && <p className="text-xs text-slate-400 mt-0.5 truncate">{mag.descricao}</p>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {combateAtivo && showQuickActions && (
          <div className="flex items-center gap-2 flex-wrap">
            {combatIntentAtual ? (
              <div className="flex items-center gap-2 px-3 py-1.5 game-glass-subtle border border-cyan-400/30 rounded-lg">
                <span className="text-xs text-cyan-200 font-semibold">
                  Acao selecionada: {combatIntentLabel}
                </span>
                <button
                  type="button"
                  onClick={() => onClearCombatIntent && onClearCombatIntent()}
                  className="text-[11px] text-cyan-100/70 hover:text-cyan-100 transition-colors"
                  title="Limpar acao selecionada"
                  aria-label="Limpar acao selecionada"
                >
                  Limpar
                </button>
              </div>
            ) : (
              <div className="px-3 py-1.5 game-glass-subtle border border-white/[0.08] rounded-lg">
                <p className="text-xs text-slate-300">
                  Se preferir escrever livremente, o sistema tentara inferir sua acao.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {showQuickActions && !combateAtivo && (
            <>
              {[
                { label: 'Falar', emoji: '💬', acao: 'Quero conversar com ' },
                { label: 'Investigar', emoji: '🔍', acao: 'Investigo os arredores em busca de ' },
                { label: 'Interagir', emoji: '🤝', acao: 'Interajo com ' },
                { label: 'Descrever magia', emoji: '✨', acao: 'Uso magia para ' },
                { label: 'Item', emoji: '🎒', acao: 'Uso um item: ' }
              ].map((btn) => (
                <button
                  type="button"
                  key={btn.label}
                  onClick={() => fillInput(btn.acao)}
                  className="flex-shrink-0 px-3 py-1.5 text-xs game-glass-subtle border border-purple-500/20 text-purple-200 rounded-lg hover:border-purple-400/40 hover:bg-purple-500/10 transition-all"
                >
                  {btn.emoji} {btn.label}
                </button>
              ))}
            </>
          )}

          <input
            type="text"
            placeholder={getPlaceholderDinamico()}
            value={mensagemAtual || ''}
            onChange={onMensagemChange}
            onKeyDown={handleKeyPress}
            disabled={isSending || inputDesabilitado}
            className={`flex-1 min-w-0 px-4 py-2.5 text-sm rounded-xl game-glass-subtle border border-purple-500/25 shadow-lg caret-purple-400 ${
              ehMeuTurno && faseJogo === 'rodada_em_andamento' && turnoIniciado
                ? 'border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.12)]'
                : 'border-purple-500/25'
            } text-white placeholder-purple-300/60 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 transition-all`}
          />

          <button
            type="button"
            onClick={enviarMensagemComTipo}
            disabled={connectionStatus.status === 'error' || !mensagemAtual?.trim() || isSending || inputDesabilitado}
            className="flex-shrink-0 px-5 py-2.5 text-sm bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]"
          >
            {isSending || aguardandoMestre ? (
              <span className="flex items-center gap-1">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </span>
            ) : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionDock;
