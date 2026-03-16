import React from 'react';
import { BarChart3, ChevronLeft, ChevronRight, Swords, Users, X } from 'lucide-react';
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
import { useTTS } from '../../../hooks/useTTS';

const EtapaJogoRPGView = (props) => {
  const tts = useTTS();
  const {
    historia,
    personagemSelecionado,
    participantes,
    mensagens,
    user,
    onSair,
    effectiveVoiceId,
    effectiveVoiceProvider,
    faseJogo,
    rodadaAtual,
    turnoAtual,
    ordemJogadores,
    resultadosDados,
    ehMeuTurno,
    combateAtivo,
    combateMonstros,
    combateJogadores,
    combateRodada,
    combateResultado,
    combateLog,
    combateXpGanho,
    sessionRecap,
    clearSessionRecap,
    levelUpData,
    setLevelUpData,
    mensagemAtual,
    handleMensagemChange,
    handleKeyPress,
    handleEnviarMensagem,
    handleRolarDados,
    handleRolarDadoInicial,
    handleIniciarTurno,
    handleExecutarAcao,
    handleUsarHabilidade,
    handleUsarEquipamento,
    fichaModalAberta,
    fichaSelecionada,
    fichaCarregando,
    fichaErro,
    tituloFicha,
    fecharFichaModal,
    handleVerMinhaFicha,
    handleVerFichaJogador,
    mobileDrawer,
    setMobileDrawer,
    showActions,
    toggleActions,
    rightPanelExpanded,
    setRightPanelExpanded,
    showRodadaInfo,
    setShowRodadaInfo,
    rodadaDropdownRef,
    inventarioAberto,
    setInventarioAberto,
    habilidadesPersonagem,
    infoPersonagem,
    jogadoresExibir,
    dadosSolicitados,
    dadoSolicitadoInfo,
    aguardandoMestre,
    mestrePensando,
    mestreTimedOut,
    mestreStale,
    activeMestreRequestStatus,
    mestreRequestIsMine,
    handleMestreBannerAction,
    jaRolouDadoInicial,
    cooldownLocal,
    entidadesComImagem,
    contextoImagemCena,
    handleSceneImageGenerated,
    turnoIniciado,
    turnoStatus,
    ordemDefinida,
    manaAtual,
    manaMax,
  } = props;

  const panelTitle = showActions ? 'Acoes RPG' : 'Painel recolhido';

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
          mobileDrawer={mobileDrawer}
          setMobileDrawer={setMobileDrawer}
          prologo={historia?.prologo}
          tts={tts}
          voiceId={effectiveVoiceId}
          voiceProvider={effectiveVoiceProvider}
        />

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

          <div className="flex-1 flex flex-col min-w-0">
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

            <MestrePensandoBanner
              ativo={mestrePensando || aguardandoMestre}
              timedOut={mestreTimedOut}
              stale={mestreStale}
              status={activeMestreRequestStatus}
              onAction={mestreRequestIsMine ? handleMestreBannerAction : null}
            />

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
            <div
              className={`transition-all duration-300 game-glass-subtle border-l border-white/[0.06] p-4 overflow-y-auto overflow-x-hidden hidden md:block ${
                rightPanelExpanded ? 'w-80' : 'w-16'
              }`}
              aria-label={panelTitle}
            >
              <div className={`flex items-center mb-3 ${rightPanelExpanded ? 'justify-between' : 'justify-center'}`}>
                {rightPanelExpanded && (
                  <h3 className="text-base font-fantasy font-bold text-purple-200/80 uppercase tracking-wider">
                    Acoes RPG
                  </h3>
                )}
                <button
                  type="button"
                  onClick={() => setRightPanelExpanded(!rightPanelExpanded)}
                  className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 transition-all transform hover:scale-105 flex-shrink-0"
                  title={rightPanelExpanded ? 'Retrair painel' : 'Expandir painel'}
                  aria-label={rightPanelExpanded ? 'Retrair painel' : 'Expandir painel'}
                >
                  {rightPanelExpanded ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
              </div>

              {rightPanelExpanded ? (
                <div className="space-y-4">
                  <RPGActions
                    onRollDice={handleRolarDados}
                    onUsarHabilidade={handleUsarHabilidade}
                    onUsarEquipamento={handleUsarEquipamento}
                    personagem={personagemSelecionado}
                  />
                  <div className="border-t border-purple-500/20 pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-purple-300/60 font-fantasy text-xs uppercase tracking-widest">Status</span>
                      <div className="flex-1 h-px bg-gradient-to-r from-purple-500/20 to-transparent" />
                    </div>
                    <StatusPersonagem
                      personagemSelecionado={infoPersonagem}
                      onRolarDados={handleRolarDados}
                      onToggleInventario={() => setInventarioAberto(!inventarioAberto)}
                      compact
                      combateAtivo={combateAtivo}
                      combateJogadores={combateJogadores}
                      userId={String(user.id)}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setRightPanelExpanded(true)}
                    className="w-10 h-10 rounded-full game-glass-subtle flex items-center justify-center border border-purple-500/20 hover:border-purple-400/40 transition-all"
                    title="Expandir painel de acoes"
                    aria-label="Expandir painel de acoes"
                  >
                    <Swords size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRightPanelExpanded(true)}
                    className="w-10 h-10 rounded-full game-glass-subtle flex items-center justify-center border border-cyan-500/20 hover:border-cyan-400/40 transition-all"
                    title="Expandir painel de status"
                    aria-label="Expandir painel de status"
                  >
                    <BarChart3 size={18} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {mobileDrawer && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setMobileDrawer(null)} />
          <div className="absolute top-0 right-0 h-full w-80 max-w-[85vw] game-glass-solid border-l border-white/[0.08] overflow-y-auto animate-fade-in shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                {mobileDrawer === 'jogadores' ? <Users size={18} className="text-purple-200" /> : <Swords size={18} className="text-cyan-200" />}
                <h3 className="text-white font-fantasy font-bold">
                  {mobileDrawer === 'jogadores' ? 'Aventureiros' : 'Acoes RPG'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawer(null)}
                className="p-2 rounded-lg game-glass-subtle border border-white/[0.08] hover:border-white/[0.16] text-white transition-all"
                aria-label="Fechar painel lateral"
                title="Fechar painel lateral"
              >
                <X size={16} />
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
                      <div
                        key={uid || i}
                        className={`p-3 rounded-xl border game-glass-subtle ${
                          ehTurno
                            ? 'border-cyan-400/50 shadow-[0_0_18px_rgba(34,211,238,0.16)]'
                            : 'border-white/[0.08]'
                        }`}
                      >
                        <div className="text-white font-medium text-sm">{nome}</div>
                        <div className="text-purple-300 text-xs">{pNome}</div>
                        {jogador.valorDado && (
                          <div className="text-yellow-300 text-xs mt-1">Dado {jogador.valorDado}</div>
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
                      onToggleInventario={() => {
                        setInventarioAberto(!inventarioAberto);
                        setMobileDrawer(null);
                      }}
                      compact
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
