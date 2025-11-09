import React from 'react';

/**
 * Header compacto do jogo RPG
 */
const HeaderJogoRPG = ({ 
  historiaAtual, 
  participantes, 
  showActions, 
  setShowActions, 
  onSairJogo 
}) => {
  // Validação e fallback para título
  const titulo = historiaAtual?.titulo || historiaAtual?.nome || 'Aventura RPG';
  const numJogadores = Array.isArray(participantes) ? participantes.length : 0;
  
  return (
    <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm border-b border-purple-500/20">
      <div className="flex items-center space-x-4">
        <img 
          src="/assets/logo_lunaria.png" 
          alt="Lunaria" 
          className="w-8 h-8 object-contain"
        />
        <div>
          <h1 className="text-lg font-fantasy font-bold text-white">
            {titulo}
          </h1>
          <div className="flex items-center space-x-2 text-xs text-purple-300">
            <span>🎮 Jogo Ativo</span>
            <span>•</span>
            <span>{numJogadores} jogadores</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setShowActions(!showActions)}
          className={`px-3 py-1 rounded-lg text-sm transition-all ${
            showActions 
              ? 'bg-purple-500/30 text-purple-200' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          ⚡ Ações
        </button>
        <button
          onClick={onSairJogo}
          className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
        >
          🚪 Sair
        </button>
      </div>
    </div>
  );
};

export default HeaderJogoRPG; 