import React from 'react';
import { Package } from 'lucide-react';
import XPProgressBar from './XPProgressBar';

/**
 * Barra inferior com status do personagem
 * @param {Object} personagemSelecionado - Dados do personagem
 * @param {Function} onRolarDados - Callback para rolar dados
 * @param {boolean} compact - Se true, usa layout compacto para painel lateral
 * @param {boolean} combateAtivo - Se combate esta ativo
 * @param {Object} combateJogadores - HP live dos jogadores { [userId]: { hp_max, hp_atual, ca, status } }
 * @param {string} userId - ID do usuario atual
 */
const StatusPersonagem = ({
  personagemSelecionado,
  onRolarDados,
  onToggleInventario,
  compact = false,
  combateAtivo = false,
  combateJogadores = {},
  userId
}) => {
  // Validacao: garantir que personagemSelecionado existe
  if (!personagemSelecionado) {
    return (
      <div className={compact ? "p-3" : "p-4 bg-black/20 backdrop-blur-sm border-t border-purple-500/20"}>
        <div className={compact ? "" : "max-w-6xl mx-auto"}>
          <div className="glass p-4 rounded-lg border border-cyan-500/20">
            <div className="text-center text-white">
              <p>Carregando informações do personagem...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determinar HP/HP_max a exibir: combate live ou DB estatico
  const combateStats = combateAtivo && userId ? combateJogadores[String(userId)] : null;
  const hpDisplay = combateStats ? `${combateStats.hp_atual}/${combateStats.hp_max}` : (personagemSelecionado.hp || '???');
  const hpBaixo = combateStats ? (combateStats.hp_atual / combateStats.hp_max) <= 0.3 : false;
  const derrotado = combateStats?.status === 'derrotado';

  // Layout compacto para painel lateral
  if (compact) {
    return (
      <div className={`glass p-3 rounded-lg border ${combateAtivo ? 'border-red-500/40' : 'border-cyan-500/20'}`}>
        <div className="flex items-start space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0 ${
            derrotado ? 'bg-gradient-to-r from-gray-600 to-gray-700' :
            combateAtivo ? 'bg-gradient-to-r from-red-500 to-orange-500' :
            'bg-gradient-to-r from-cyan-500 to-purple-500'
          }`}>
            {derrotado ? '💀' : combateAtivo ? '⚔️' : '⚔️'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-fantasy font-bold text-white truncate">
              {personagemSelecionado.nome || 'Personagem sem nome'}
            </h3>
            <p className="text-cyan-300 text-xs mt-1">
              {personagemSelecionado.classe || 'Classe desconhecida'} • {personagemSelecionado.raca || 'Raça desconhecida'} • Nível {personagemSelecionado.nivel || '1'}
            </p>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-3">
                <div className="text-center">
                  <div className={`text-base font-bold ${
                    derrotado ? 'text-gray-500' :
                    hpBaixo ? 'text-red-400 animate-pulse' :
                    combateStats ? 'text-red-300' : 'text-red-400'
                  }`}>
                    {hpDisplay}
                  </div>
                  <div className="text-xs text-red-300">HP</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-bold text-blue-400">
                    {personagemSelecionado.mp || '???'}
                  </div>
                  <div className="text-xs text-blue-300">MP</div>
                </div>
                {combateStats && (
                  <>
                    <div className="text-center">
                      <div className="text-base font-bold text-green-400">
                        {combateStats.esquiva || 0}%
                      </div>
                      <div className="text-xs text-green-300">ESQ</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-amber-400">
                        {combateStats.armadura || 0}
                      </div>
                      <div className="text-xs text-amber-300">ARM</div>
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* XP Bar */}
            <div className="mt-2">
              <XPProgressBar
                compact
                xpAtual={personagemSelecionado.xp_atual || personagemSelecionado.xp || 0}
                xpProximoNivel={personagemSelecionado.xp_proximo_nivel}
                nivel={personagemSelecionado.nivel || 1}
              />
            </div>
            {/* Inventario button */}
            {onToggleInventario && (
              <button
                onClick={onToggleInventario}
                className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded hover:bg-amber-500/20 transition-colors text-xs font-modern"
              >
                <Package size={12} />
                Inventário ({(personagemSelecionado.equipamentos || []).length})
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Layout horizontal para barra inferior
  return (
    <div className="p-4 bg-black/20 backdrop-blur-sm border-t border-purple-500/20">
      <div className="max-w-6xl mx-auto">
        <div className={`glass p-4 rounded-lg border ${combateAtivo ? 'border-red-500/40' : 'border-cyan-500/20'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${
                derrotado ? 'bg-gradient-to-r from-gray-600 to-gray-700' :
                combateAtivo ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                'bg-gradient-to-r from-cyan-500 to-purple-500'
              }`}>
                {derrotado ? '💀' : '⚔️'}
              </div>
              <div>
                <h3 className="text-lg font-fantasy font-bold text-white">
                  {personagemSelecionado.nome || 'Personagem sem nome'}
                </h3>
                <p className="text-cyan-300 text-sm">
                  {personagemSelecionado.classe || 'Classe desconhecida'} • {personagemSelecionado.raca || 'Raça desconhecida'} • Nível {personagemSelecionado.nivel || '1'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* Status principais */}
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    derrotado ? 'text-gray-500' :
                    hpBaixo ? 'text-red-400 animate-pulse' :
                    combateStats ? 'text-red-300' : 'text-red-400'
                  }`}>
                    {hpDisplay}
                  </div>
                  <div className="text-xs text-red-300">HP</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">
                    {personagemSelecionado.mp || '???'}
                  </div>
                  <div className="text-xs text-blue-300">MP</div>
                </div>
                <div className="min-w-[120px]">
                  <XPProgressBar
                    xpAtual={personagemSelecionado.xp_atual || personagemSelecionado.xp || 0}
                    xpProximoNivel={personagemSelecionado.xp_proximo_nivel}
                    nivel={personagemSelecionado.nivel || 1}
                  />
                </div>
                {combateStats && (
                  <>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">
                        {combateStats.esquiva || 0}%
                      </div>
                      <div className="text-xs text-green-300">ESQ</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-amber-400">
                        {combateStats.armadura || 0}
                      </div>
                      <div className="text-xs text-amber-300">ARM</div>
                    </div>
                  </>
                )}
              </div>

              {/* Acoes rapidas */}
              <div className="flex items-center space-x-2">
                {onRolarDados && (
                  <>
                    <button
                      onClick={() => onRolarDados('1d20', 'Teste rápido')}
                      className="px-3 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors text-sm"
                    >
                      🎲 d20
                    </button>
                    <button
                      onClick={() => onRolarDados('1d6', 'Dado de 6')}
                      className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors text-sm"
                    >
                      🎲 d6
                    </button>
                  </>
                )}
                {onToggleInventario && (
                  <button
                    onClick={onToggleInventario}
                    className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded hover:bg-amber-500/20 transition-colors text-sm flex items-center gap-1.5"
                  >
                    <Package size={14} />
                    ({(personagemSelecionado.equipamentos || []).length})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusPersonagem;
