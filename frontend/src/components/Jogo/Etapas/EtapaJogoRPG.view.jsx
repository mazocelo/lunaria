import React from 'react';
import { RPGActions } from '../../RPGActions';
import BackgroundEffects from '../Shared/BackgroundEffects';
import PainelJogadores from '../Chat/PainelJogadores';
import ChatArea from '../Chat/ChatArea';
import InputArea from '../Chat/InputArea';
import StatusPersonagem from '../Gameplay/StatusPersonagem';
import RolagemDadosInicial from '../Gameplay/RolagemDadosInicial';
import BatalhaUI from '../Gameplay/BatalhaUI';
import InventarioPanel from '../Gameplay/InventarioPanel';
import LevelUpCelebration from '../Gameplay/LevelUpCelebration';
import SessionRecap from '../Gameplay/SessionRecap';
import NotificationManager from '../NotificationManager';
import BarraStatusCompacta from '../Gameplay/BarraStatusCompacta';
import FichaPersonagemModal from '../Modals/FichaPersonagemModal';
import { PARTICLES } from '../../../constants/game';

const EtapaJogoRPGView = (props) => {
  const {
    // Theme
    theme, toggleTheme,

    // Props passthrough
    historia, personagemSelecionado, participantes, mensagens, user, onSair,

    // Voice
    effectiveVoiceId, effectiveVoiceProvider,

    // Socket/game state
    faseJogo, rodadaAtual, turnoAtual,
    ordemJogadores, resultadosDados,
    ehMeuTurno,
    combateAtivo, combateMonstros, combateJogadores,
    combateRodada, combateResultado, combateLog, combateXpGanho,
    sessionRecap, clearSessionRecap,
    levelUpData, setLevelUpData,

    // Message input
    mensagemAtual, handleMensagemChange, handleKeyPress, handleEnviarMensagem,

    // Dice & turns
    handleRolarDados, handleRolarDadoInicial, handleIniciarTurno,
    handleExecutarAcao, handleUsarHabilidade, handleUsarEquipamento,

    // Ficha modal
    fichaModalAberta, fichaSelecionada, fichaCarregando, fichaErro, tituloFicha,
    fecharFichaModal, handleVerMinhaFicha, handleVerFichaJogador,

    // UI layout
    mobileDrawer, setMobileDrawer,
    showActions, toggleActions,
    rightPanelExpanded, setRightPanelExpanded,
    showRodadaInfo, setShowRodadaInfo,
    rodadaDropdownRef,
    inventarioAberto, setInventarioAberto,

    // Habilidades
    habilidadesPersonagem,

    // Derived
    infoPersonagem, jogadoresExibir,
    dadosSolicitados, dadoSolicitadoInfo, aguardandoMestre,
    jaRolouDadoInicial, cooldownLocal,
    entidadesComImagem, contextoImagemCena, handleSceneImageGenerated,
    turnoIniciado, turnoStatus, ordemDefinida,

    // Mana
    manaAtual, manaMax,
  } = props;

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      <NotificationManager />
      <BackgroundEffects particleCount={PARTICLES.GAME_SCREEN_COUNT} />

      <div className="relative z-10 h-screen flex flex-col">
        {/* Header bar */}
        <div className="flex-shrink-0 h-14 px-4 flex items-center justify-between bg-black/30 backdrop-blur-sm border-b border-purple-500/20 z-40">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-fantasy font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent hidden sm:block">
              The Fable Forge
            </h1>
            <span className="text-purple-500/30 hidden sm:inline">|</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                faseJogo === 'rodada_em_andamento' ? 'bg-green-400 animate-pulse' : 'bg-purple-400'
              }`} />
              <span className="text-sm font-semibold text-purple-200">
                {faseJogo === 'rolagem_inicial' ? 'Rolagem Inicial' :
                 faseJogo === 'rodada_em_andamento' ? `Rodada ${rodadaAtual}` :
                 'Aguardando'}
              </span>
            </div>
            {ehMeuTurno && faseJogo === 'rodada_em_andamento' && (
              <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-400/50 rounded-full text-cyan-300 text-xs font-bold animate-pulse">
                Seu Turno
              </span>
            )}
            <span className="text-purple-500/50 text-xs hidden sm:inline">|</span>
            <span className="text-purple-300/70 text-xs hidden sm:inline">{jogadoresExibir.length} jogadores</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* RODADA button with dropdown */}
            <div className="relative" ref={rodadaDropdownRef}>
              <button
                onClick={() => setShowRodadaInfo(!showRodadaInfo)}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg font-bold shadow-md transition-all flex items-center space-x-1.5 text-sm"
              >
                <span>📊</span>
                <span>RODADA</span>
              </button>

              {showRodadaInfo && (
                <div className="absolute right-0 top-full mt-1 w-80 glass p-4 rounded-xl border-2 border-purple-500/50 shadow-2xl animate-scale-in max-h-96 overflow-y-auto z-50">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {historia?.imagem && (
                        <img src={historia.imagem} alt={historia.nome} className="w-14 h-14 rounded-lg object-cover border border-purple-500/30 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-purple-300 text-xs font-semibold mb-1">Historia</p>
                        <p className="text-white font-bold text-lg">{historia?.nome || historia?.titulo || 'Aventura RPG'}</p>
                      </div>
                    </div>

                    <div className="border-t border-purple-500/20 pt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-purple-300 text-xs font-semibold mb-1">Rodada Atual</p>
                          <p className="text-cyan-400 font-bold text-2xl">{rodadaAtual}</p>
                        </div>
                        <div>
                          <p className="text-purple-300 text-xs font-semibold mb-1">Jogadores</p>
                          <p className="text-cyan-400 font-bold text-2xl">{jogadoresExibir.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-purple-500/20 pt-3">
                      <p className="text-purple-300 text-xs font-semibold mb-1">Status</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-green-300 text-sm font-semibold">
                          {faseJogo === 'rolagem_inicial' ? 'Rolagem Inicial' :
                           faseJogo === 'rodada_em_andamento' ? 'Jogo Ativo' :
                           'Aguardando Inicio'}
                        </span>
                      </div>
                    </div>

                    {ordemJogadores.length > 0 && (
                      <div className="border-t border-purple-500/20 pt-3">
                        <p className="text-purple-300 text-xs font-semibold mb-2">Ordem de Jogadores</p>
                        <div className="space-y-2">
                          {ordemJogadores.map((jogador, index) => (
                            <div
                              key={jogador.userId}
                              className={`flex items-center justify-between p-2 rounded-lg ${
                                index === turnoAtual && faseJogo === 'rodada_em_andamento'
                                  ? 'bg-cyan-500/20 border border-cyan-400/50'
                                  : 'bg-white/5'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-purple-400 font-bold text-sm">#{index + 1}</span>
                                <div>
                                  <p className="text-white text-sm font-semibold">{jogador.username}</p>
                                  {jogador.personagemNome && (
                                    <p className="text-purple-300 text-xs">{jogador.personagemNome}</p>
                                  )}
                                </div>
                              </div>
                              {index === turnoAtual && faseJogo === 'rodada_em_andamento' && (
                                <span className="text-cyan-400 text-xs font-bold">TURNO</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleVerMinhaFicha}
              className="px-3 py-1.5 rounded-lg font-bold shadow-md transition-all flex items-center space-x-1.5 text-sm bg-gradient-to-r from-cyan-600/70 to-purple-600/70 text-white border border-cyan-300/40 hover:from-cyan-500/80 hover:to-purple-500/80"
            >
              <span>📜</span>
              <span>FICHA</span>
            </button>

            <button
              onClick={toggleActions}
              className={`px-3 py-1.5 rounded-lg font-bold shadow-md transition-all flex items-center space-x-1.5 text-sm ${
                showActions
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border border-purple-300'
                  : 'bg-gradient-to-r from-purple-600/40 to-pink-600/40 text-purple-200 hover:from-purple-600/60 hover:to-pink-600/60 border border-purple-500/30'
              }`}
            >
              <span>⚡</span>
              <span>ACOES</span>
            </button>

            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 bg-purple-600/30 text-purple-200 border border-purple-500/50 rounded-lg hover:bg-purple-600/50 transition-all font-bold shadow-md flex items-center space-x-1.5 text-sm"
              aria-label="Alternar tema"
            >
              <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
            </button>

            <button
              onClick={onSair}
              className="px-3 py-1.5 bg-red-500/30 text-red-200 border border-red-500/50 rounded-lg hover:bg-red-500/40 transition-all font-bold shadow-md flex items-center space-x-1.5 text-sm"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">SAIR</span>
            </button>

            <button
              onClick={() => setMobileDrawer(mobileDrawer === 'jogadores' ? null : 'jogadores')}
              className="md:hidden px-2 py-1.5 bg-purple-600/30 text-purple-200 border border-purple-500/50 rounded-lg hover:bg-purple-600/50 transition-all text-sm"
              title="Jogadores"
            >
              👥
            </button>
            <button
              onClick={() => setMobileDrawer(mobileDrawer === 'acoes' ? null : 'acoes')}
              className="md:hidden px-2 py-1.5 bg-cyan-600/30 text-cyan-200 border border-cyan-500/50 rounded-lg hover:bg-cyan-600/50 transition-all text-sm"
              title="Ações"
            >
              ⚔️
            </button>
          </div>
        </div>

        {/* Main Game Layout */}
        <div className="flex-1 flex overflow-hidden">
          <PainelJogadores
            participantes={jogadoresExibir}
            ordemJogadores={ordemJogadores}
            resultadosDados={resultadosDados}
            turnoAtual={turnoAtual}
            faseJogo={faseJogo}
            onVerFichaJogador={handleVerFichaJogador}
          />

          <div className="flex-1 flex flex-col">
            <BarraStatusCompacta
              personagem={personagemSelecionado}
              combateAtivo={combateAtivo}
              combateJogadores={combateJogadores}
              userId={user?.id}
            />

            {faseJogo === 'rolagem_inicial' && (
              <div className="p-6">
                <RolagemDadosInicial
                  jogadores={Object.values(participantes || {})}
                  resultados={resultadosDados}
                  ordemDefinida={ordemDefinida}
                  ordemJogadores={ordemJogadores}
                  usuarioAtual={user}
                  onRolarDado={handleRolarDadoInicial}
                />
              </div>
            )}

            {(combateAtivo || combateResultado) && (
              <div className="px-4 pt-4">
                <BatalhaUI
                  monstros={combateMonstros}
                  jogadores={combateJogadores}
                  rodada={combateRodada}
                  log={combateLog}
                  resultado={combateResultado}
                  xpGanho={combateXpGanho}
                  userId={String(user?.id)}
                />
              </div>
            )}

            <ChatArea
              mensagens={mensagens}
              usuariosDigitando={[]}
              mensagensRef={null}
              voiceId={effectiveVoiceId}
              voiceProvider={effectiveVoiceProvider}
              entidadesComImagem={entidadesComImagem}
              contextoImagemCena={contextoImagemCena}
              onSceneImageGenerated={handleSceneImageGenerated}
              estiloImagem={historia?.estilo_imagem}
            />

            <InputArea
              mensagemAtual={mensagemAtual}
              onMensagemChange={handleMensagemChange}
              onKeyPress={handleKeyPress}
              onEnviarMensagem={handleEnviarMensagem}
              onRolarDados={handleRolarDados}
              onExecutarAcao={handleExecutarAcao}
              faseJogo={faseJogo}
              ehMeuTurno={ehMeuTurno}
              turnoIniciado={turnoIniciado}
              turnoStatus={turnoStatus}
              cooldownRoleplay={cooldownLocal}
              onRolarDadoInicial={handleRolarDadoInicial}
              onIniciarTurno={handleIniciarTurno}
              jaRolouDadoInicial={jaRolouDadoInicial}
              dadosSolicitados={dadosSolicitados}
              dadoSolicitadoInfo={dadoSolicitadoInfo}
              aguardandoMestre={aguardandoMestre}
              combateAtivo={combateAtivo}
              habilidadesPersonagem={habilidadesPersonagem}
              manaAtual={manaAtual}
              manaMax={manaMax}
              cooldownsHabilidades={{}}
            />
          </div>

          {showActions && (
            <div className={`transition-all duration-300 bg-black/20 backdrop-blur-sm border-l border-purple-500/20 p-4 overflow-y-auto overflow-x-hidden hidden md:block ${
              rightPanelExpanded ? 'w-80' : 'w-16'
            }`}>
              <div className={`flex items-center mb-3 ${rightPanelExpanded ? 'justify-between' : 'justify-center'}`}>
                {rightPanelExpanded && (
                  <h3 className="text-white font-bold text-lg">Acoes RPG</h3>
                )}
                <button
                  onClick={() => setRightPanelExpanded(!rightPanelExpanded)}
                  className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 transition-all flex-shrink-0"
                  title={rightPanelExpanded ? 'Retrair painel' : 'Expandir painel'}
                >
                  <span className="text-lg">{rightPanelExpanded ? '▶' : '◀'}</span>
                </button>
              </div>

              {rightPanelExpanded && (
                <div className="space-y-4">
                  <RPGActions
                    onRollDice={handleRolarDados}
                    onUsarHabilidade={handleUsarHabilidade}
                    onUsarEquipamento={handleUsarEquipamento}
                    personagem={personagemSelecionado}
                  />
                  <div className="border-t border-purple-500/20 pt-4">
                    <h4 className="text-white font-semibold mb-2">Status</h4>
                    <StatusPersonagem
                      personagemSelecionado={infoPersonagem}
                      onRolarDados={handleRolarDados}
                      onToggleInventario={() => setInventarioAberto(!inventarioAberto)}
                      compact={true}
                      combateAtivo={combateAtivo}
                      combateJogadores={combateJogadores}
                      userId={String(user.id)}
                    />
                  </div>
                </div>
              )}

              {!rightPanelExpanded && (
                <div className="flex flex-col items-center space-y-3 mt-4">
                  <button
                    onClick={() => setRightPanelExpanded(true)}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 flex items-center justify-center border border-purple-500/30 hover:bg-purple-500/40 transition-all"
                    title="Acoes RPG"
                  >
                    <span className="text-lg">⚔️</span>
                  </button>
                  <button
                    onClick={() => setRightPanelExpanded(true)}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500/30 to-purple-500/30 flex items-center justify-center border border-cyan-500/30 hover:bg-cyan-500/40 transition-all"
                    title="Status"
                  >
                    <span className="text-lg">📊</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileDrawer && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileDrawer(null)} />
          <div className="absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-slate-900/95 backdrop-blur-md border-l border-purple-500/20 overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
              <h3 className="text-white font-fantasy font-bold">
                {mobileDrawer === 'jogadores' ? '👥 Aventureiros' : '⚔️ Ações RPG'}
              </h3>
              <button
                onClick={() => setMobileDrawer(null)}
                className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              {mobileDrawer === 'jogadores' && (
                <div className="space-y-3">
                  {(ordemJogadores.length > 0 ? ordemJogadores : jogadoresExibir).map((jogador, i) => {
                    const uid = jogador.userId || jogador.id;
                    const nome = jogador.username || jogador.nome;
                    const pNome = jogador.personagemNome || jogador.personagem;
                    const ehTurno = turnoAtual === i;
                    return (
                      <div key={uid || i} className={`p-3 rounded-lg border ${
                        ehTurno ? 'border-cyan-400/50 bg-cyan-500/10' : 'border-purple-500/20 bg-black/20'
                      }`}>
                        <div className="text-white font-medium text-sm">{nome}</div>
                        <div className="text-purple-300 text-xs">{pNome}</div>
                        {jogador.valorDado && (
                          <div className="text-yellow-300 text-xs mt-1">🎲 {jogador.valorDado}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {mobileDrawer === 'acoes' && (
                <div className="space-y-4">
                  <RPGActions
                    onRollDice={handleRolarDados}
                    onUsarHabilidade={handleUsarHabilidade}
                    onUsarEquipamento={handleUsarEquipamento}
                    personagem={personagemSelecionado}
                  />
                  <div className="border-t border-purple-500/20 pt-4">
                    <StatusPersonagem
                      personagemSelecionado={infoPersonagem}
                      onRolarDados={handleRolarDados}
                      onToggleInventario={() => { setInventarioAberto(!inventarioAberto); setMobileDrawer(null); }}
                      compact={true}
                      combateAtivo={combateAtivo}
                      combateJogadores={combateJogadores}
                      userId={String(user.id)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <FichaPersonagemModal
        isOpen={fichaModalAberta}
        onClose={fecharFichaModal}
        personagem={fichaSelecionada}
        loading={fichaCarregando}
        error={fichaErro}
        titulo={tituloFicha}
      />

      <InventarioPanel
        isOpen={inventarioAberto}
        onClose={() => setInventarioAberto(false)}
        equipamentos={personagemSelecionado?.equipamentos || []}
        personagemNome={personagemSelecionado?.nome || 'Aventureiro'}
      />

      <LevelUpCelebration
        isVisible={!!levelUpData}
        novoNivel={levelUpData?.novoNivel}
        ganhos={levelUpData?.ganhos}
        onClose={() => setLevelUpData(null)}
      />

      <SessionRecap
        isVisible={!!sessionRecap}
        recapData={sessionRecap}
        onClose={clearSessionRecap}
      />
    </div>
  );
};

export default EtapaJogoRPGView;
