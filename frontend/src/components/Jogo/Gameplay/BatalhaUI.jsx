import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import MonstroCard from './MonstroCard';

/**
 * UI completa de batalha — iniciativa, painel de combate, log, e resultado.
 * HP/status do jogador aparece na BarraStatusCompacta e StatusPersonagem.
 */
const BatalhaUI = ({
  monstros = [],
  jogadores = {},
  rodada = 1,
  log = [],
  resultado = null,
  xpGanho = 0,
  userId,
  fase = 'combate',
  iniciativaPendente = false,
  iniciativaModificador = 0,
  ordemIniciativa = [],
  turnoAtual = null,
  onRolarIniciativa = null,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const logRef = useRef(null);
  const monstrosVivos = monstros.filter(m => m.status !== 'derrotado' && m.hp_atual > 0);

  // Auto-scroll log when new entries arrive
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log.length]);

  // Fade out da tela de resultado antes de desmontar
  useEffect(() => {
    if (resultado) {
      setFadingOut(false);
      const timer = setTimeout(() => setFadingOut(true), 6000);
      return () => clearTimeout(timer);
    }
  }, [resultado]);

  // ── Tela de Resultado ──────────────────────────────────────────────
  if (resultado) {
    return (
      <div
        className={`rounded-lg border border-yellow-500/40 bg-yellow-900/20 px-4 py-3 mb-2 ${fadingOut ? 'opacity-0' : 'animate-fade-in opacity-100'}`}
        style={{ transition: 'opacity 2s ease-out' }}
      >
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl">
            {resultado === 'vitoria' ? '\u{1F3C6}' : resultado === 'derrota' ? '\u{1F480}' : '\u{1F3C3}'}
          </span>
          <span className="text-lg font-fantasy font-bold text-yellow-300">
            {resultado === 'vitoria' ? 'Vitoria!' : resultado === 'derrota' ? 'Derrota...' : 'Fuga!'}
          </span>
          {xpGanho > 0 && (
            <span className="text-yellow-200 text-sm">+{xpGanho} XP</span>
          )}
        </div>
      </div>
    );
  }

  // ── Fase de Iniciativa ─────────────────────────────────────────────
  if (fase === 'iniciativa') {
    return (
      <div className="rounded-lg border border-amber-500/40 bg-amber-900/15 mb-2 animate-fade-in px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">{'\u2694\uFE0F'}</span>
          <span className="text-sm font-fantasy font-bold text-amber-300">Combate Iniciado!</span>
        </div>
        <div className="space-y-1.5 mb-3">
          {monstros.map((m) => (
            <div key={m.id} className="flex items-center gap-2 text-xs">
              <span>{'\u{1F479}'}</span>
              <span className="font-bold text-red-300">{m.nome}</span>
              <span className="text-gray-400">HP {m.hp_atual}/{m.hp_max}</span>
              <div className="flex-1 bg-gray-700/50 rounded-full h-1 max-w-[80px] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          ))}
        </div>
        {iniciativaPendente ? (
          <button
            onClick={onRolarIniciativa}
            className="w-full py-2 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {'\u{1F3B2}'} Rolar Iniciativa (d20 {iniciativaModificador >= 0 ? '+' : ''}{iniciativaModificador} Agi)
          </button>
        ) : (
          <div className="text-xs text-amber-200/60 text-center animate-pulse">Calculando ordem de combate...</div>
        )}
      </div>
    );
  }

  // ── Fase Ordem Definida (mostra resultados por 4s) ─────────────────
  if (fase === 'ordem_definida') {
    return (
      <div className="rounded-lg border border-amber-500/40 bg-amber-900/15 mb-2 animate-fade-in px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">{'\u{1F3AF}'}</span>
          <span className="text-sm font-fantasy font-bold text-amber-300">Ordem de Combate</span>
        </div>
        <div className="space-y-1.5">
          {ordemIniciativa.map((e, i) => (
            <div key={e.id} className={`flex items-center justify-between px-3 py-1.5 rounded ${
              e.tipo === 'jogador' ? 'bg-cyan-900/30 border border-cyan-500/20' : 'bg-red-900/30 border border-red-500/20'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-300 w-5">{i + 1}.</span>
                <span className={`text-sm ${e.tipo === 'jogador' ? 'text-cyan-300' : 'text-red-300'}`}>
                  {e.tipo === 'jogador' ? '\u{1F6E1}\uFE0F' : '\u{1F479}'} {e.nome}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">d20:{e.rolagem}</span>
                <span className="text-xs text-gray-500">{e.modificador >= 0 ? '+' : ''}{e.modificador}</span>
                <span className="text-xs font-bold text-amber-300">= {e.iniciativa}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-center text-xs text-amber-200/50 animate-pulse">
          Combate comeca em instantes...
        </div>
      </div>
    );
  }

  // ── Painel Principal de Combate ────────────────────────────────────
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-900/10 mb-2 animate-fade-in">
      {/* Header compacto — clicavel para expandir */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer select-none"
        onClick={() => setCollapsed(prev => !prev)}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-base">{'\u2694\uFE0F'}</span>
          <span className="text-sm font-fantasy font-bold text-red-300">Combate</span>
          <span className="text-xs text-gray-400 bg-gray-800/40 px-1.5 py-0.5 rounded">
            R{rodada}
          </span>
          <span className="text-xs text-red-300/70">
            {monstrosVivos.length} inimigo{monstrosVivos.length !== 1 ? 's' : ''}
          </span>
          {turnoAtual && (
            <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
              turnoAtual.tipo === 'jogador'
                ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-500/30'
                : 'bg-red-900/40 text-red-300 border border-red-500/30'
            }`}>
              Turno: {turnoAtual.nome}
            </span>
          )}
        </div>
        {collapsed ? (
          <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
        )}
      </div>

      {/* Conteudo expandido */}
      {!collapsed && (
        <div className="px-3 pb-2 space-y-1.5">
          {/* Monstros — cards compactos empilhados */}
          <div className="space-y-1">
            {monstros.map((monstro) => (
              <MonstroCard key={monstro.id} monstro={monstro} compact />
            ))}
          </div>

          {/* Ordem de iniciativa — compacta inline */}
          {ordemIniciativa.length > 0 && (
            <div className="border-t border-red-500/15 pt-1.5">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs text-gray-500">Ordem:</span>
                {ordemIniciativa.map((e, i) => {
                  const isCurrent = turnoAtual?.id === e.id;
                  const isDerrotado = e.tipo === 'monstro' && monstros.find(m => m.id === e.id && (m.status === 'derrotado' || m.hp_atual <= 0));
                  return (
                    <React.Fragment key={e.id}>
                      {i > 0 && <span className="text-gray-600 text-xs">{'\u2192'}</span>}
                      <span className={`text-xs px-1 rounded ${
                        isDerrotado
                          ? 'text-gray-600 line-through'
                          : isCurrent
                            ? (e.tipo === 'jogador' ? 'bg-cyan-800/50 text-cyan-200 font-bold ring-1 ring-cyan-400/40' : 'bg-red-800/50 text-red-200 font-bold ring-1 ring-red-400/40')
                            : (e.tipo === 'jogador' ? 'text-cyan-400/70' : 'text-red-400/70')
                      }`}>
                        {e.nome}({e.iniciativa})
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* Log de combate — ultimas 5 entradas, scrollable */}
          {log.length > 0 && (
            <div className="border-t border-red-500/15 pt-1.5">
              <div
                ref={logRef}
                className="space-y-0.5 max-h-[140px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
              >
                {log.slice(-5).map((entry, i) => (
                  <LogEntry key={`${log.length - 5 + i}-${entry.tipo}`} entry={entry} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── LogEntry ─────────────────────────────────────────────────────────
// Handles all combat log entry types with rich formatting.

const LogEntry = ({ entry }) => {
  if (!entry) return null;

  // ── Status Effect Applied ──
  if (entry.tipo === 'status_efeito') {
    return (
      <div className="text-xs text-purple-400">
        {'\u{1F4AB}'} {entry.personagem || entry.alvo?.nome} — <strong>{entry.status}</strong>
      </div>
    );
  }

  // ── Status Damage (DOT) ──
  if (entry.tipo === 'status_dano') {
    return (
      <div className="text-xs text-orange-400">
        {entry.status === 'queimando' ? '\u{1F525}' : '\u{1F9EA}'} {entry.alvo?.nome || entry.personagem} <span className="text-red-300">-{entry.dano}</span> ({entry.status})
        {entry.hpRestante != null && entry.hpMax != null && (
          <span className="text-gray-500"> (HP: {entry.hpRestante}/{entry.hpMax})</span>
        )}
      </div>
    );
  }

  // ── Player Defense ──
  if (entry.tipo === 'defesa_jogador') {
    return (
      <div className="text-xs text-blue-300">
        {'\u{1F6E1}\uFE0F'} <span className="text-cyan-400 font-semibold">{entry.personagem}</span> defende!{' '}
        <span className="text-blue-200">Esquiva +{entry.esquivaBonus}%, Dano -{Math.round((entry.reducaoDano ?? 0.5) * 100)}%</span>
      </div>
    );
  }

  // ── Player Flee Attempt ──
  if (entry.tipo === 'fuga_jogador') {
    return (
      <div className={`text-xs ${entry.sucesso ? 'text-green-300' : 'text-red-300'}`}>
        {'\u{1F3C3}'} <span className="text-cyan-400">{entry.personagem}</span>
        {entry.sucesso
          ? <span className="text-green-200"> fugiu! (d20={entry.rolagem}+{entry.modificador}={entry.total} vs DC {entry.dc})</span>
          : <span className="text-red-200"> falhou na fuga (d20={entry.rolagem}+{entry.modificador}={entry.total} vs DC {entry.dc})</span>
        }
      </div>
    );
  }

  // ── Player Ability ──
  if (entry.tipo === 'habilidade_jogador') {
    const atkData = entry.ataque;
    return (
      <div className="text-xs space-y-0.5">
        <div className="text-purple-300">
          {'\u2728'} <span className="text-cyan-400 font-semibold">{entry.personagem}</span> usa{' '}
          <strong>{entry.habilidadeNome}</strong>
          {entry.custoMana > 0 && <span className="text-blue-300"> (-{entry.custoMana} MP)</span>}
          {entry.rolagem != null && <span className="text-gray-400"> {'\u2192'} d20:{entry.rolagem}</span>}
          {entry.acertou != null && (
            <span className={entry.acertou ? 'text-green-300' : 'text-red-400'}>
              {' '}{'\u2192'} {entry.acertou ? 'Sucesso!' : 'Falhou'}
            </span>
          )}
        </div>
        {atkData?.dano > 0 && (
          <div className="text-orange-300 pl-4">
            {'\u{1F3AF}'} Dano: {atkData.dano}
            {atkData.alvo && <span> {'\u2192'} {atkData.alvo}</span>}
            {atkData.hpRestante != null && atkData.hpMax != null && (
              <span className="text-gray-400"> HP: {atkData.hpRestante}/{atkData.hpMax}</span>
            )}
          </div>
        )}
        {entry.efeitoAplicado && (
          <div className="text-yellow-300 pl-4">
            {'\u{1F4AB}'} [{entry.efeitoAplicado.status} {entry.efeitoAplicado.duracao}t]
          </div>
        )}
      </div>
    );
  }

  // ── Player Ability Failed ──
  if (entry.tipo === 'habilidade_falhou' || entry.tipo === 'habilidade_teste_falhou') {
    return (
      <div className="text-xs text-gray-500">
        {'\u274C'} <span className="text-cyan-400">{entry.personagem}</span> tentou <strong>{entry.habilidadeNome}</strong>
        {' '}{'\u2014'} {entry.erro || (entry.tipo === 'habilidade_teste_falhou' ? 'falhou no teste' : 'falhou')}
        {entry.custoMana > 0 && <span className="text-blue-300"> (-{entry.custoMana} MP)</span>}
      </div>
    );
  }

  // ── Monster Attack (from combat_monster_action) ──
  // Data fields: atacanteNome, alvoNome, rolagem, acertou, esquivou, critico, dano, hpRestante, hpMax, habilidade
  if (entry.tipo === 'ataque_monstro') {
    const atacante = entry.atacanteNome || entry.atacante?.nome || entry.atacante || '???';
    const alvo = entry.alvoNome || entry.alvo?.nome || entry.alvo || '???';
    const bonusAtaque = entry.bonusAtaque ?? 0;
    const totalAtaque = entry.rolagem != null ? entry.rolagem + bonusAtaque : null;

    // Monster hit and dealt damage
    if (entry.acertou && !entry.esquivou) {
      return (
        <div className="text-xs space-y-0.5">
          <div className="text-red-400">
            {'\u{1F479}'} <span className="font-semibold">{atacante}</span>
            {' '}{'\u2192'}{' '}
            <span className="text-cyan-400">{alvo}</span>
            {entry.rolagem != null && (
              <span className="text-gray-400">
                : d20:{entry.rolagem}{bonusAtaque ? `+${bonusAtaque}` : ''}
                {totalAtaque != null && bonusAtaque ? `=${totalAtaque}` : ''}
              </span>
            )}
            {' '}{'\u2192'}{' '}
            <span className="text-orange-300 font-bold">
              {entry.critico ? 'CRIT! ' : ''}HIT! {entry.dano} dano
            </span>
            {entry.hpRestante != null && entry.hpMax != null && (
              <span className="text-gray-500"> (HP: {entry.hpRestante}/{entry.hpMax})</span>
            )}
          </div>
          {entry.habilidade && entry.habilidade !== 'Ataque basico' && entry.habilidade !== 'Ataque básico' && (
            <div className="text-xs text-red-300/60 pl-4">{'\u{1F525}'} {entry.habilidade}</div>
          )}
        </div>
      );
    }

    // Monster attacked but player dodged
    if (entry.esquivou) {
      return (
        <div className="text-xs text-green-400">
          {'\u{1F479}'} <span className="text-red-300 font-semibold">{atacante}</span>
          {' '}{'\u2192'}{' '}
          <span className="text-cyan-400">{alvo}</span>
          {entry.rolagem != null && (
            <span className="text-gray-400">: d20:{entry.rolagem}</span>
          )}
          {' '}{'\u2192'}{' '}
          <span className="font-bold">{alvo} ESQUIVOU!</span>
        </div>
      );
    }

    // Monster missed
    return (
      <div className="text-xs text-gray-500">
        {'\u{1F479}'} <span className="text-red-300/70">{atacante}</span>
        {' '}{'\u2192'}{' '}
        <span className="text-cyan-400/70">{alvo}</span>
        {entry.rolagem != null && (
          <span className="text-gray-500">: d20:{entry.rolagem}{bonusAtaque ? `+${bonusAtaque}` : ''}{totalAtaque != null && bonusAtaque ? `=${totalAtaque}` : ''}</span>
        )}
        {' '}{'\u2192'}{' '}
        <span>ERROU</span>
      </div>
    );
  }

  // ── Player Attack ──
  if (entry.tipo === 'ataque_jogador') {
    const atacante = entry.atacante?.nome || entry.atacante || entry.personagem || '???';
    const alvo = entry.alvo?.nome || entry.alvo || '???';

    if (entry.acertou) {
      return (
        <div className="text-xs space-y-0.5">
          <div className="text-cyan-300">
            {'\u2694\uFE0F'} <span className="font-semibold">{atacante}</span>
            {' '}{'\u2192'}{' '}
            <span className="text-red-400">{alvo}</span>
            {entry.rolagem != null && (
              <span className="text-gray-400">: d20:{entry.rolagem}</span>
            )}
            {' '}{'\u2192'}{' '}
            <span className="text-green-300 font-bold">
              {entry.critico ? 'CRIT! ' : ''}Sucesso!
            </span>
          </div>
          {entry.dano > 0 && (
            <div className="text-orange-300 pl-4">
              {'\u{1F3AF}'} Dano: {entry.dano}
              {entry.hpRestante != null && entry.hpMax != null && (
                <span className="text-gray-400"> {'\u2192'} {alvo} HP: {entry.hpRestante}/{entry.hpMax}</span>
              )}
            </div>
          )}
        </div>
      );
    }

    // Player missed or target dodged
    return (
      <div className="text-xs text-gray-500">
        {'\u2694\uFE0F'} <span className="text-cyan-400/70">{atacante}</span>
        {' '}{'\u2192'}{' '}
        <span className="text-red-400/70">{alvo}</span>
        {entry.rolagem != null && (
          <span className="text-gray-500">: d20:{entry.rolagem}</span>
        )}
        {' '}{'\u2192'}{' '}
        {entry.esquivou
          ? <span className="text-green-300">{alvo} ESQUIVOU!</span>
          : <span>miss</span>
        }
      </div>
    );
  }

  // ── Fallback: hide redundant 'acao' entries, show unknown types ──
  if (entry.tipo === 'acao') return null;
  return (
    <div className="text-xs text-gray-500 italic">
      {entry.mensagem || entry.tipo || 'Acao de combate'}
    </div>
  );
};

export default React.memo(BatalhaUI);
