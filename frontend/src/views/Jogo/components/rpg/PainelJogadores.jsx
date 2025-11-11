import React from 'react';
import { useAuth } from '../../../../contexts/AuthContext';

/**
 * Painel lateral com outros jogadores
 * 🎲 SISTEMA DE TURNOS: Mostra ordem, valores de dados e turno atual
 */
const PainelJogadores = ({ 
  participantes, 
  ordemJogadores = [], 
  resultadosDados = {},
  turnoAtual = null,
  faseJogo = 'aguardando_inicio'
}) => {
  const { user } = useAuth();

  // Se já temos ordem definida, usar ela para exibir os jogadores
  const jogadoresParaExibir = ordemJogadores.length > 0 
    ? ordemJogadores 
    : participantes;

  /**
   * Renderizar jogador baseado na fase do jogo
   */
  const renderJogador = (jogador, index) => {
    const userId = jogador.userId || jogador.id;
    const username = jogador.username || jogador.nome;
    const personagem = jogador.personagemNome || jogador.personagem;
    const isOwner = jogador.isOwner;
    const valorDado = jogador.valorDado || resultadosDados[userId]?.valor;
    const ehTurnoAtual = turnoAtual === index;
    const ehUsuarioAtual = String(userId) === String(user?.id);

    return (
      <div 
        key={userId || index} 
        className={`glass p-3 rounded-lg border transition-all ${
          ehTurnoAtual 
            ? 'border-cyan-400 ring-2 ring-cyan-500/50 animate-pulse' 
            : ehUsuarioAtual
            ? 'border-purple-400/50'
            : 'border-white/10'
        }`}
      >
        <div className="flex items-center space-x-3 mb-2">
          {/* Avatar com posição/número */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
            ehTurnoAtual
              ? 'bg-gradient-to-r from-cyan-500 to-purple-500'
              : 'bg-gradient-to-r from-green-500 to-blue-500'
          }`}>
            {ordemJogadores.length > 0 ? (
              <span>{index + 1}º</span>
            ) : (
              <span>{username?.charAt(0).toUpperCase() || '?'}</span>
            )}
          </div>
          
          <div className="flex-1">
            <div className="text-white font-medium text-sm flex items-center">
              {username || 'Jogador'}
              {isOwner && (
                <span className="text-yellow-400 text-xs ml-1">👑</span>
              )}
              {ehUsuarioAtual && (
                <span className="text-purple-400 text-xs ml-1">(Você)</span>
              )}
            </div>
            {personagem && (
              <div className="text-green-300 text-xs">
                {personagem}
              </div>
            )}
          </div>

          {/* Indicador de turno atual */}
          {ehTurnoAtual && (
            <div className="text-xl animate-bounce">⚡</div>
          )}
        </div>

        {/* Valor do dado (se rolado) */}
        {valorDado && (
          <div className="mt-2 flex items-center justify-center p-2 bg-amber-900/30 rounded border border-amber-500/30">
            <span className="text-amber-400 text-xs mr-1">🎲</span>
            <span className="text-amber-300 font-bold text-lg">{valorDado}</span>
          </div>
        )}

        {/* Status do jogador (se disponível) */}
        {jogador.details && (
          <div className="grid grid-cols-2 gap-2 text-xs mt-2">
            {jogador.details.health && (
              <div className="text-red-400">
                ❤️ {jogador.details.health}
              </div>
            )}
            {jogador.details.mana && (
              <div className="text-blue-400">
                🔮 {jogador.details.mana}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-80 bg-black/20 backdrop-blur-sm border-r border-purple-500/20 p-4 overflow-y-auto">
      <h3 className="text-lg font-fantasy font-bold text-white mb-2 flex items-center">
        👥 Aventureiros
      </h3>

      {/* Indicador de fase */}
      {faseJogo && (
        <div className="mb-4 text-xs text-center">
          <span className={`px-2 py-1 rounded-full ${
            faseJogo === 'rolagem_inicial' 
              ? 'bg-amber-900/30 text-amber-400 border border-amber-500/30' 
              : faseJogo === 'rodada_em_andamento'
              ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/30'
              : 'bg-purple-900/30 text-purple-400 border border-purple-500/30'
          }`}>
            {faseJogo === 'rolagem_inicial' && '🎲 Rolagem Inicial'}
            {faseJogo === 'rodada_em_andamento' && '⚔️ Em Jogo'}
            {faseJogo === 'entre_rodadas' && '⏸️ Entre Rodadas'}
            {faseJogo === 'aguardando_inicio' && '⏳ Aguardando'}
          </span>
        </div>
      )}
      
      <div className="space-y-3">
        {jogadoresParaExibir.length > 0 ? (
          jogadoresParaExibir.map((jogador, index) => renderJogador(jogador, index))
        ) : (
          <div className="text-center py-8 text-purple-400">
            <div className="text-2xl mb-2">👻</div>
            <p className="text-sm">Aguardando jogadores...</p>
          </div>
        )}
      </div>

      {/* Legenda */}
      {ordemJogadores.length > 0 && (
        <div className="mt-4 pt-4 border-t border-purple-500/20">
          <p className="text-purple-300 text-xs text-center mb-2">Legenda:</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full animate-pulse" />
              <span className="text-purple-300">Turno Atual</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-amber-400">🎲</span>
              <span className="text-purple-300">Valor do Dado</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PainelJogadores; 