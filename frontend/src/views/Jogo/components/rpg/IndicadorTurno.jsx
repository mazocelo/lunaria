import React, { useState } from 'react';

/**
 * Componente para indicar rodada e turno atual
 * 🔽 Com opção de collapse
 */
const IndicadorTurno = ({ 
  rodadaAtual = 1, 
  turnoAtual = 0,
  jogadorAtual = null,
  ordemJogadores = [],
  ehMeuTurno = false 
}) => {
  const [expandido, setExpandido] = useState(true);
  const totalJogadores = ordemJogadores.length;
  const progresso = totalJogadores > 0 ? ((turnoAtual + 1) / totalJogadores) * 100 : 0;

  return (
    <div className="glass p-4 rounded-xl border border-purple-500/30 mb-4">
      {/* Cabeçalho com Rodada - Clicável para expandir/retrair */}
      <div 
        className="flex items-center justify-between mb-3 cursor-pointer hover:bg-purple-500/10 -m-2 p-2 rounded-lg transition-colors"
        onClick={() => setExpandido(!expandido)}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 text-white font-bold">
            R{rodadaAtual}
          </div>
          <div>
            <p className="text-purple-300 text-sm">Rodada Atual</p>
            <p className="text-white font-bold text-lg">Rodada {rodadaAtual}</p>
          </div>
        </div>

        {/* Turno */}
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <p className="text-purple-300 text-sm">Turno</p>
            <p className="text-white font-bold text-lg">
              {turnoAtual + 1} / {totalJogadores}
            </p>
          </div>
          
          {/* Ícone de expand/collapse */}
          <button className="text-purple-400 hover:text-purple-300 transition-colors">
            {expandido ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Conteúdo que pode ser retraído */}
      {expandido && (
        <>
          {/* Barra de Progresso dos Turnos */}
          <div className="mb-3">
        <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>

      {/* Indicador de Jogador Atual */}
      {jogadorAtual && (
        <div className={`p-3 rounded-lg border ${
          ehMeuTurno 
            ? 'bg-gradient-to-r from-purple-600/30 to-cyan-600/30 border-cyan-400 animate-pulse' 
            : 'bg-black/20 border-purple-500/20'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-sm mb-1">
                {ehMeuTurno ? '👉 É SUA VEZ!' : 'Turno de:'}
              </p>
              <p className="text-white font-bold text-lg">{jogadorAtual.username}</p>
              {jogadorAtual.personagemNome && (
                <p className="text-purple-300 text-sm">{jogadorAtual.personagemNome}</p>
              )}
            </div>
            {ehMeuTurno && (
              <div className="text-4xl animate-bounce">⚡</div>
            )}
          </div>
        </div>
      )}

          {/* Mini lista da ordem (opcional, pode ser escondido) */}
          {ordemJogadores.length > 0 && (
            <div className="mt-3 pt-3 border-t border-purple-500/20">
              <p className="text-purple-300 text-xs mb-2">Ordem de Jogadores:</p>
              <div className="flex flex-wrap gap-2">
                {ordemJogadores.map((jogador, index) => (
                  <div
                    key={jogador.userId}
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      index === turnoAtual
                        ? 'bg-cyan-500 text-white'
                        : index < turnoAtual
                        ? 'bg-gray-600 text-gray-300'
                        : 'bg-purple-600/30 text-purple-300'
                    }`}
                  >
                    {index + 1}. {jogador.username}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default IndicadorTurno;

