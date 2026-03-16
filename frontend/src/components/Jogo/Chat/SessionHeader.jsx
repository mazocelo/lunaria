import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, DoorOpen, ScrollText, Swords, Users, BookMarked, Volume2 } from 'lucide-react';

/**
 * Header compacto da sessao de jogo RPG
 */
const SessionHeader = ({
  faseJogo,
  rodadaAtual,
  turnoAtual,
  ehMeuTurno,
  ordemJogadores,
  jogadoresExibir,
  showActions,
  toggleActions,
  showRodadaInfo,
  setShowRodadaInfo,
  rodadaDropdownRef,
  handleVerMinhaFicha,
  onSair,
  mobileDrawer,
  setMobileDrawer,
  prologo,
  tts,
  voiceId,
  voiceProvider,
}) => {
  const [showPrologo, setShowPrologo] = useState(false);
  const prologoRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (prologoRef.current && !prologoRef.current.contains(e.target)) {
        setShowPrologo(false);
      }
    };
    if (showPrologo) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPrologo]);
  const faseLabel = faseJogo === 'rolagem_inicial'
    ? 'Rolagem Inicial'
    : faseJogo === 'rodada_em_andamento'
      ? `Rodada ${rodadaAtual}`
      : 'Aguardando';

  const statusLabel = faseJogo === 'rolagem_inicial'
    ? 'Rolagem Inicial'
    : faseJogo === 'rodada_em_andamento'
      ? 'Jogo Ativo'
      : 'Aguardando Inicio';

  return (
    <div className="flex-shrink-0 h-14 px-4 flex items-center justify-between game-glass-solid border-b border-white/[0.06] z-40">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-2 h-2 rounded-full ${
              faseJogo === 'rodada_em_andamento' ? 'bg-green-400 animate-pulse' : 'bg-purple-400'
            }`}
          />
          <span className="text-sm font-semibold text-purple-200 truncate">{faseLabel}</span>
        </div>
        {ehMeuTurno && faseJogo === 'rodada_em_andamento' && (
          <span className="hidden sm:inline-flex px-3 py-1 bg-cyan-500/20 border border-cyan-400/50 rounded-full text-cyan-300 text-sm font-bold animate-pulse">
            Seu Turno
          </span>
        )}
        <span className="text-purple-300/70 text-xs hidden sm:inline">{jogadoresExibir.length} jogadores</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl game-glass-subtle border border-white/[0.08]">
          {prologo && (
            <div className="relative" ref={prologoRef}>
              <button
                type="button"
                onClick={() => { setShowPrologo(!showPrologo); setShowRodadaInfo(false); }}
                className={`px-3 py-1.5 rounded-lg font-bold shadow-md transition-all flex items-center gap-1.5 text-sm ${
                  showPrologo
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border border-amber-300'
                    : 'bg-gradient-to-r from-amber-600/40 to-orange-600/40 text-amber-200 hover:from-amber-600/60 hover:to-orange-600/60 border border-amber-500/30'
                }`}
                title="Ler prologo da historia"
                aria-label="Ler prologo da historia"
              >
                <BookMarked size={14} />
                <span className="hidden sm:inline">PROLOGO</span>
              </button>

              {showPrologo && (
                <div className="absolute right-0 top-full mt-1 w-80 sm:w-96 game-glass-solid p-5 rounded-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] animate-scale-in max-h-[60vh] overflow-y-auto z-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-fantasy font-bold text-amber-300 uppercase tracking-widest">Prologo</h3>
                    {tts && voiceId && (
                      <button
                        type="button"
                        onClick={() => tts.play(prologo, voiceId, 'prologo', voiceProvider, { allowGenerate: true })}
                        className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
                        title="Ouvir prologo"
                        aria-label="Ouvir prologo"
                      >
                        <Volume2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-purple-100/90 leading-relaxed whitespace-pre-line">{prologo}</p>
                </div>
              )}
            </div>
          )}

          <div className="relative" ref={rodadaDropdownRef}>
            <button
              type="button"
              onClick={() => { setShowRodadaInfo(!showRodadaInfo); setShowPrologo(false); }}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg font-bold shadow-md transition-all flex items-center gap-1.5 text-sm"
              aria-label="Abrir resumo da rodada"
              title="Abrir resumo da rodada"
            >
              <ScrollText size={14} />
              <span className="hidden sm:inline">RODADA</span>
            </button>

            {showRodadaInfo && (
              <div className="absolute right-0 top-full mt-1 w-72 game-glass-solid p-5 rounded-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] animate-scale-in max-h-96 overflow-y-auto z-50">
                <div className="space-y-3">
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

                  <div className="border-t border-purple-500/20 pt-3">
                    <p className="text-purple-300 text-xs font-semibold mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-green-300 text-sm font-semibold">{statusLabel}</span>
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
                                ? 'game-glass-subtle border border-cyan-400/50 shadow-[0_0_16px_rgba(34,211,238,0.12)]'
                                : 'game-glass-subtle border border-white/[0.08]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
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
            type="button"
            onClick={handleVerMinhaFicha}
            className="px-3 py-1.5 rounded-lg font-bold shadow-md transition-all flex items-center gap-1.5 text-sm bg-gradient-to-r from-cyan-600/70 to-purple-600/70 text-white border border-cyan-300/40 hover:from-cyan-500/80 hover:to-purple-500/80"
            title="Ver minha ficha"
            aria-label="Ver minha ficha"
          >
            <BookOpen size={14} />
            <span className="hidden sm:inline">FICHA</span>
          </button>

          <button
            type="button"
            onClick={toggleActions}
            className={`px-3 py-1.5 rounded-lg font-bold shadow-md transition-all flex items-center gap-1.5 text-sm ${
              showActions
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border border-purple-300'
                : 'bg-gradient-to-r from-purple-600/40 to-pink-600/40 text-purple-200 hover:from-purple-600/60 hover:to-pink-600/60 border border-purple-500/30'
            }`}
            title={showActions ? 'Ocultar painel de acoes' : 'Mostrar painel de acoes'}
            aria-label={showActions ? 'Ocultar painel de acoes' : 'Mostrar painel de acoes'}
          >
            <Swords size={14} />
            <span className="hidden sm:inline">ACOES</span>
          </button>

          <button
            type="button"
            onClick={onSair}
            className="px-3 py-1.5 bg-red-500/30 text-red-200 border border-red-500/50 rounded-lg hover:bg-red-500/40 transition-all font-bold shadow-md flex items-center gap-1.5 text-sm"
            title="Sair da sessao"
            aria-label="Sair da sessao"
          >
            <DoorOpen size={14} />
            <span className="hidden sm:inline">SAIR</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMobileDrawer(mobileDrawer === 'jogadores' ? null : 'jogadores')}
          className="md:hidden p-2 rounded-lg game-glass-subtle text-purple-200 border border-purple-500/35 hover:border-purple-400/50 transition-all"
          title="Abrir painel de jogadores"
          aria-label="Abrir painel de jogadores"
        >
          <Users size={16} />
        </button>
        <button
          type="button"
          onClick={() => setMobileDrawer(mobileDrawer === 'acoes' ? null : 'acoes')}
          className="md:hidden p-2 rounded-lg game-glass-subtle text-cyan-200 border border-cyan-500/35 hover:border-cyan-400/50 transition-all"
          title="Abrir painel de acoes"
          aria-label="Abrir painel de acoes"
        >
          <Swords size={16} />
        </button>
      </div>
    </div>
  );
};

export default SessionHeader;
