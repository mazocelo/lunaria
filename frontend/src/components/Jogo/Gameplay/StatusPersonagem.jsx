import React from 'react';

/**
 * Barra inferior com status do personagem
 * @param {Object} personagemSelecionado - Dados do personagem
 * @param {Function} onRolarDados - Callback para rolar dados
 * @param {boolean} compact - Se true, usa layout compacto para painel lateral
 */
const StatusPersonagem = ({ personagemSelecionado, onRolarDados, compact = false }) => {
  // Validação: garantir que personagemSelecionado existe
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

  // Layout compacto para painel lateral
  if (compact) {
    return (
      <div className="glass p-3 rounded-lg border border-cyan-500/20">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-base flex-shrink-0">
            ⚔️
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
                  <div className="text-base font-bold text-red-400">
                    {personagemSelecionado.hp || '???'}
                  </div>
                  <div className="text-xs text-red-300">HP</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-bold text-blue-400">
                    {personagemSelecionado.mp || '???'}
                  </div>
                  <div className="text-xs text-blue-300">MP</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-bold text-yellow-400">
                    {personagemSelecionado.xp || '0'}
                  </div>
                  <div className="text-xs text-yellow-300">XP</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Layout horizontal para barra inferior
  return (
    <div className="p-4 bg-black/20 backdrop-blur-sm border-t border-purple-500/20">
      <div className="max-w-6xl mx-auto">
        <div className="glass p-4 rounded-lg border border-cyan-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-lg">
                ⚔️
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
                  <div className="text-lg font-bold text-red-400">
                    {personagemSelecionado.hp || '???'}
                  </div>
                  <div className="text-xs text-red-300">HP</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">
                    {personagemSelecionado.mp || '???'}
                  </div>
                  <div className="text-xs text-blue-300">MP</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-400">
                    {personagemSelecionado.xp || '0'}
                  </div>
                  <div className="text-xs text-yellow-300">XP</div>
                </div>
              </div>
              
              {/* Ações rápidas */}
              {onRolarDados && (
                <div className="flex items-center space-x-2">
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
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusPersonagem; 