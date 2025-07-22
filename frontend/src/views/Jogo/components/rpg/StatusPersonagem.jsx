import React from 'react';

/**
 * Barra inferior com status do personagem
 */
const StatusPersonagem = ({ personagemSelecionado, onRolarDados }) => {
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
                  {personagemSelecionado.nome}
                </h3>
                <p className="text-cyan-300 text-sm">
                  {personagemSelecionado.classe} • {personagemSelecionado.raca} • Nível {personagemSelecionado.nivel}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusPersonagem; 