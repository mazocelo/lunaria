import React from 'react';

/**
 * Header compacto da sessao de jogo RPG
 * Extraido de EtapaJogoRPG.view.jsx — estado da sessao + controles
 */
const SessionHeader = ({
  faseJogo, rodadaAtual, turnoAtual, ehMeuTurno,
  ordemJogadores, jogadoresExibir,
  showActions, toggleActions,
  showRodadaInfo, setShowRodadaInfo, rodadaDropdownRef,
  handleVerMinhaFicha, onSair,
  theme, toggleTheme,
  mobileDrawer, setMobileDrawer,
}) => {
  return (
    <div className="flex-shrink-0 h-14 px-4 flex items-center justify-between bg-black/30 backdrop-blur-sm border-b border-purple-500/20 z-40">
      {/* Left: status + fase + turno */}
      <div className="flex items-center space-x-3">
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
          <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-400/50 rounded-full text-cyan-300 text-sm font-bold animate-pulse">
            Seu Turno
          </span>
        )}
        <span className="text-purple-300/70 text-xs hidden sm:inline">{jogadoresExibir.length} jogadores</span>
      </div>

      {/* Right: buttons */}
      <div className="flex items-center space-x-2">
        {/* RODADA button with dropdown */}
        <div className="relative" ref={rodadaDropdownRef}>
          <button
            onClick={() => setShowRodadaInfo(!showRodadaInfo)}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg font-bold shadow-md transition-all flex items-center space-x-1.5 text-sm"
          >
            <span>RODADA</span>
          </button>

          {showRodadaInfo && (
            <div className="absolute right-0 top-full mt-1 w-72 glass p-4 rounded-xl border-2 border-purple-500/50 shadow-2xl animate-scale-in max-h-96 overflow-y-auto z-50">
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
          <span>ACOES</span>
        </button>

        <button
          onClick={toggleTheme}
          className="px-3 py-1.5 bg-purple-600/30 text-purple-200 border border-purple-500/50 rounded-lg hover:bg-purple-600/50 transition-all font-bold shadow-md flex items-center space-x-1.5 text-sm"
          aria-label="Alternar tema"
        >
          <span>{theme === 'dark' ? '\u{1F319}' : '\u{2600}\u{FE0F}'}</span>
        </button>

        <button
          onClick={onSair}
          className="px-3 py-1.5 bg-red-500/30 text-red-200 border border-red-500/50 rounded-lg hover:bg-red-500/40 transition-all font-bold shadow-md flex items-center space-x-1.5 text-sm"
        >
          <span className="hidden sm:inline">SAIR</span>
          <span className="sm:hidden">{'\u{1F6AA}'}</span>
        </button>

        <button
          onClick={() => setMobileDrawer(mobileDrawer === 'jogadores' ? null : 'jogadores')}
          className="md:hidden px-2 py-1.5 bg-purple-600/30 text-purple-200 border border-purple-500/50 rounded-lg hover:bg-purple-600/50 transition-all text-sm"
          title="Jogadores"
        >
          {'\u{1F465}'}
        </button>
        <button
          onClick={() => setMobileDrawer(mobileDrawer === 'acoes' ? null : 'acoes')}
          className="md:hidden px-2 py-1.5 bg-cyan-600/30 text-cyan-200 border border-cyan-500/50 rounded-lg hover:bg-cyan-600/50 transition-all text-sm"
          title="Acoes"
        >
          {'\u{2694}\u{FE0F}'}
        </button>
      </div>
    </div>
  );
};

export default SessionHeader;
