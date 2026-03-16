import React from 'react';
import { RPGActions } from '../../RPGActions';
import BackgroundEffects from '../Shared/BackgroundEffects';
import PainelJogadores from '../Chat/PainelJogadores';
import ChatArea from '../Chat/ChatArea';
import ActionDock from '../Chat/ActionDock';
import MestrePensandoBanner from '../Chat/MestrePensandoBanner';
import SessionHeader from '../Chat/SessionHeader';
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
    dadosSolicitados, dadoSolicitadoInfo, aguardandoMestre, mestrePensando,
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
        <SessionHeader
          faseJogo={faseJogo}
          rodadaAtual={rodadaAtual}
          turnoAtual={turnoAtual}
          ehMeuTurno={ehMeuTurno}
          ordemJogadores={ordemJogadores}
          jogadoresExibir={jogadoresExibir}
          showActions={showActions}
          toggleActions={toggleActions}
          showRodadaInfo={showRodadaInfo}
          setShowRodadaInfo={setShowRodadaInfo}
          rodadaDropdownRef={rodadaDropdownRef}
          handleVerMinhaFicha={handleVerMinhaFicha}
          onSair={onSair}
          theme={theme}
          toggleTheme={toggleTheme}
          mobileDrawer={mobileDrawer}
          setMobileDrawer={setMobileDrawer}
        />

        {/* Main Game Layout */}
        <div className="flex-1 flex overflow-hidden">
          <PainelJogadores
            participantes={jogadoresExibir}
            ordemJogadores={ordemJogadores}
            resultadosDados={resultadosDados}
            turnoAtual={turnoAtual}
            faseJogo={faseJogo}
            onVerFichaJogador={handleVerFichaJogador}
            compactMode={jogadoresExibir.length <= 2}
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

            <MestrePensandoBanner ativo={mestrePensando || aguardandoMestre} />

            <ActionDock
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
              onIniciarTurno={handleIniciarTurno}
              dadosSolicitados={dadosSolicitados}
              dadoSolicitadoInfo={dadoSolicitadoInfo}
              aguardandoMestre={aguardandoMestre}
              combateAtivo={combateAtivo}
              combateMonstros={combateMonstros}
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
