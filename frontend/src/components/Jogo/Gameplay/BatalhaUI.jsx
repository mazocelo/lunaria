import React from 'react';
import MonstroCard from './MonstroCard';

/**
 * UI principal de batalha - exibida quando combate está ativo
 * Mostra monstros, HP dos jogadores e log de combate
 */
const BatalhaUI = ({
  monstros = [],
  jogadores = {},
  rodada = 1,
  log = [],
  resultado = null,
  xpGanho = 0,
  userId
}) => {
  const monstrosVivos = monstros.filter(m => m.status === 'vivo');
  const monstrosDerrotados = monstros.filter(m => m.status === 'derrotado');
  const jogadorStats = jogadores[userId];

  // Tela de resultado
  if (resultado) {
    return (
      <div className="glass rounded-xl border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-900/30 to-amber-900/20 p-6 mb-4 animate-fade-in">
        <div className="text-center">
          <span className="text-5xl">
            {resultado === 'vitoria' ? '🏆' : resultado === 'derrota' ? '💀' : '🏃'}
          </span>
          <h3 className="text-2xl font-fantasy font-bold mt-2 text-yellow-300">
            {resultado === 'vitoria' ? 'Vitória!' : resultado === 'derrota' ? 'Derrota...' : 'Fuga!'}
          </h3>
          {xpGanho > 0 && (
            <p className="text-yellow-200 mt-2 text-lg">
              +{xpGanho} XP ganhos!
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl border-2 border-red-500/40 bg-gradient-to-br from-red-900/20 to-orange-900/10 p-4 mb-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">⚔️</span>
          <h3 className="text-lg font-fantasy font-bold text-red-300">Combate</h3>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
            Rodada {rodada}
          </span>
          <span className="text-xs text-red-300 bg-red-900/30 px-2 py-1 rounded">
            {monstrosVivos.length} inimigo{monstrosVivos.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Monstros Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
        {monstros.map((monstro) => (
          <MonstroCard key={monstro.id} monstro={monstro} />
        ))}
      </div>

      {/* HP do jogador atual */}
      {jogadorStats && (
        <div className="border-t border-red-500/20 pt-3 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🛡️</span>
              <span className="text-sm text-cyan-300 font-semibold">
                {jogadorStats.personagemNome || 'Você'}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-red-300">
                HP {jogadorStats.hp_atual}/{jogadorStats.hp_max}
              </span>
              <span className="text-green-300">
                ESQ {jogadorStats.esquiva || 0}%
              </span>
              <span className="text-amber-300">
                ARM {jogadorStats.armadura || 0}
              </span>
            </div>
          </div>
          {/* HP bar do jogador */}
          <div className="w-full bg-gray-700/50 rounded-full h-2 mt-1 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                (jogadorStats.hp_atual / jogadorStats.hp_max) > 0.6
                  ? 'from-green-500 to-green-400'
                  : (jogadorStats.hp_atual / jogadorStats.hp_max) > 0.3
                    ? 'from-yellow-500 to-yellow-400'
                    : 'from-red-600 to-red-400'
              }`}
              style={{ width: `${Math.max(0, (jogadorStats.hp_atual / jogadorStats.hp_max) * 100)}%` }}
            />
          </div>
          {/* Status effects ativos */}
          {jogadorStats.status_efeitos && jogadorStats.status_efeitos.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {jogadorStats.status_efeitos.map((efeito, i) => {
                const cores = {
                  envenenado: 'bg-green-900/50 text-green-300 border-green-500/40',
                  queimando: 'bg-orange-900/50 text-orange-300 border-orange-500/40',
                  atordoado: 'bg-yellow-900/50 text-yellow-300 border-yellow-500/40',
                  paralizado: 'bg-purple-900/50 text-purple-300 border-purple-500/40',
                  congelado: 'bg-blue-900/50 text-blue-300 border-blue-500/40',
                  cego: 'bg-gray-800/50 text-gray-300 border-gray-500/40',
                };
                const icones = {
                  envenenado: '🧪', queimando: '🔥', atordoado: '💫',
                  paralizado: '⚡', congelado: '🧊', cego: '👁️',
                };
                return (
                  <span
                    key={i}
                    className={`text-xs px-2 py-0.5 rounded border ${cores[efeito.nome] || 'bg-gray-800/50 text-gray-300 border-gray-500/40'}`}
                  >
                    {icones[efeito.nome] || '⚠️'} {efeito.nome} ({efeito.duracao}t)
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Log de combate (últimas ações) */}
      {log.length > 0 && (
        <div className="border-t border-red-500/20 pt-2 mt-3">
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {log.slice(-5).map((entry, i) => {
              // Status effect (impedimento)
              if (entry.tipo === 'status_efeito') {
                return (
                  <div key={i} className="text-xs text-purple-400 flex items-center space-x-1">
                    <span>💫</span>
                    <span>{entry.personagem || entry.alvo?.nome} está <strong>{entry.status}</strong>!</span>
                  </div>
                );
              }
              // Status DoT damage
              if (entry.tipo === 'status_dano') {
                return (
                  <div key={i} className="text-xs text-orange-400 flex items-center space-x-1">
                    <span>{entry.status === 'queimando' ? '🔥' : '🧪'}</span>
                    <span>
                      {entry.alvo?.nome} sofre <span className="text-red-300">-{entry.dano} HP</span> de {entry.status}
                    </span>
                  </div>
                );
              }
              // Ataques (jogador e monstro)
              return (
                <div key={i} className="text-xs text-gray-400 flex items-center space-x-1">
                  <span>{entry.acertou ? '🗡️' : '❌'}</span>
                  <span>
                    <span className={entry.tipo === 'ataque_jogador' ? 'text-cyan-400' : 'text-red-400'}>
                      {entry.atacante?.nome || entry.atacante}
                    </span>
                    {' '}{entry.acertou ? 'acertou' : 'errou'}{' '}
                    <span className={entry.tipo === 'ataque_jogador' ? 'text-red-400' : 'text-cyan-400'}>
                      {entry.alvo?.nome || entry.alvo}
                    </span>
                    {entry.acertou && entry.dano > 0 && (
                      <span className="text-orange-300"> (-{entry.dano} HP)</span>
                    )}
                    {entry.critico && <span className="text-yellow-300"> CRIT!</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(BatalhaUI);
