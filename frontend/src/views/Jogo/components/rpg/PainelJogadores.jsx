import React from 'react';
import { useAuth } from '../../../../contexts/AuthContext';

/**
 * Painel lateral com outros jogadores
 */
const PainelJogadores = ({ participantes }) => {
  const { user } = useAuth();

  return (
    <div className="w-80 bg-black/20 backdrop-blur-sm border-r border-purple-500/20 p-4 overflow-y-auto">
      <h3 className="text-lg font-fantasy font-bold text-white mb-4 flex items-center">
        👥 Aventureiros
      </h3>
      
      <div className="space-y-4">
        {participantes.filter(p => p.userId !== user?.id).map((participante, index) => (
          <div key={participante.userId || index} className="glass p-3 rounded-lg border border-white/10">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-xs font-bold">
                {participante.username?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <div className="text-white font-medium text-sm">
                  {participante.username || 'Jogador'}
                  {participante.isOwner && (
                    <span className="text-yellow-400 text-xs ml-1">👑</span>
                  )}
                </div>
                <div className="text-green-300 text-xs">
                  {participante.personagem || 'Personagem'}
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${
                participante.status === 'in_combat' ? 'bg-red-400' :
                participante.status === 'casting' ? 'bg-purple-400' :
                participante.status === 'hidden' ? 'bg-gray-400' :
                'bg-green-400'
              } animate-pulse`} />
            </div>
            
            {/* Status do jogador */}
            {participante.details && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {participante.details.health && (
                  <div className="text-red-400">
                    ❤️ {participante.details.health}
                  </div>
                )}
                {participante.details.mana && (
                  <div className="text-blue-400">
                    🔮 {participante.details.mana}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        
        {participantes.filter(p => p.userId !== user?.id).length === 0 && (
          <div className="text-center py-8 text-purple-400">
            <div className="text-2xl mb-2">👻</div>
            <p className="text-sm">Aventura solo</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PainelJogadores; 