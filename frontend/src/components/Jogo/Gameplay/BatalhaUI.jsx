import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import MonstroCard from './MonstroCard';

/**
 * UI compacta de batalha — foco nos monstros e log de ações.
 * HP/status do jogador já aparece na BarraStatusCompacta e StatusPersonagem.
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
  const [collapsed, setCollapsed] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const monstrosVivos = monstros.filter(m => m.status === 'vivo');

  // Fade out da tela de resultado antes de desmontar
  useEffect(() => {
    if (resultado) {
      setFadingOut(false);
      const timer = setTimeout(() => setFadingOut(true), 6000);
      return () => clearTimeout(timer);
    }
  }, [resultado]);

  // Tela de resultado
  if (resultado) {
    return (
      <div
        className={`rounded-lg border border-yellow-500/40 bg-yellow-900/20 px-4 py-3 mb-2 ${fadingOut ? 'opacity-0' : 'animate-fade-in opacity-100'}`}
        style={{ transition: 'opacity 2s ease-out' }}
      >
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl">
            {resultado === 'vitoria' ? '🏆' : resultado === 'derrota' ? '💀' : '🏃'}
          </span>
          <span className="text-lg font-fantasy font-bold text-yellow-300">
            {resultado === 'vitoria' ? 'Vitória!' : resultado === 'derrota' ? 'Derrota...' : 'Fuga!'}
          </span>
          {xpGanho > 0 && (
            <span className="text-yellow-200 text-sm">+{xpGanho} XP</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-red-500/30 bg-red-900/10 mb-2 animate-fade-in">
      {/* Header compacto — clicável para expandir */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer select-none"
        onClick={() => setCollapsed(prev => !prev)}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">⚔️</span>
          <span className="text-sm font-fantasy font-bold text-red-300">Combate</span>
          <span className="text-xs text-gray-400 bg-gray-800/40 px-1.5 py-0.5 rounded">
            R{rodada}
          </span>
          <span className="text-xs text-red-300/70">
            {monstrosVivos.length} inimigo{monstrosVivos.length !== 1 ? 's' : ''}
          </span>
        </div>
        {collapsed ? (
          <ChevronDown size={16} className="text-gray-400" />
        ) : (
          <ChevronUp size={16} className="text-gray-400" />
        )}
      </div>

      {/* Conteúdo expandido */}
      {!collapsed && (
        <div className="px-3 pb-2 space-y-1.5">
          {/* Monstros — cards compactos empilhados */}
          <div className="space-y-1">
            {monstros.map((monstro) => (
              <MonstroCard key={monstro.id} monstro={monstro} compact />
            ))}
          </div>

          {/* Log de combate — últimas 3 ações, ultra-compacto */}
          {log.length > 0 && (
            <div className="border-t border-red-500/15 pt-1.5">
              <div className="space-y-0.5">
                {log.slice(-3).map((entry, i) => (
                  <LogEntry key={i} entry={entry} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** Linha individual do log — extraída para clareza */
const LogEntry = ({ entry }) => {
  if (entry.tipo === 'status_efeito') {
    return (
      <div className="text-xs text-purple-400">
        💫 {entry.personagem || entry.alvo?.nome} — <strong>{entry.status}</strong>
      </div>
    );
  }
  if (entry.tipo === 'status_dano') {
    return (
      <div className="text-xs text-orange-400">
        {entry.status === 'queimando' ? '🔥' : '🧪'} {entry.alvo?.nome} <span className="text-red-300">-{entry.dano}</span> ({entry.status})
      </div>
    );
  }

  // Ataques
  const icon = entry.acertou ? '🗡️' : entry.esquivou ? '💨' : '❌';
  const atacante = entry.atacante?.nome || entry.atacante;
  const alvo = entry.alvo?.nome || entry.alvo;
  const isPlayer = entry.tipo === 'ataque_jogador';

  return (
    <div className="text-xs text-gray-400">
      {icon}{' '}
      <span className={isPlayer ? 'text-cyan-400' : 'text-red-400'}>{atacante}</span>
      {' → '}
      <span className={isPlayer ? 'text-red-400' : 'text-cyan-400'}>{alvo}</span>
      {entry.esquivou && !entry.acertou && <span className="text-green-300"> ESQUIVOU</span>}
      {entry.acertou && entry.dano > 0 && <span className="text-orange-300"> -{entry.dano}</span>}
      {entry.critico && <span className="text-yellow-300"> CRIT!</span>}
      {!entry.acertou && !entry.esquivou && <span className="text-gray-500"> miss</span>}
    </div>
  );
};

export default React.memo(BatalhaUI);
