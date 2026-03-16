import React, { useEffect, useState } from 'react';
import { nomeTier } from '../../../utils/evolucaoHelper';

const LevelUpCelebration = ({ isVisible, novoNivel, ganhos, onClose }) => {
  const [fase, setFase] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setFase(0);
      return;
    }

    setFase(1);
    const t1 = setTimeout(() => setFase(2), 300);
    const t2 = setTimeout(() => setFase(3), 800);
    const t3 = setTimeout(() => {
      setFase(4);
      setTimeout(() => onClose?.(), 500);
    }, 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isVisible, onClose]);

  if (!isVisible && fase === 0) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${
        fase === 4 ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={() => {
        setFase(4);
        setTimeout(() => onClose?.(), 300);
      }}
    >
      <div className="absolute inset-0 bg-black/70" />

      {fase >= 1 && (
        <div className={`absolute inset-0 bg-gradient-radial from-yellow-500/30 to-transparent transition-opacity duration-500 ${
          fase >= 2 ? 'opacity-0' : 'opacity-100'
        }`} />
      )}

      <div className="relative text-center z-10">
        {fase >= 2 && (
          <div className="animate-bounce-in">
            <div className="text-6xl font-fantasy font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-500 mb-2 drop-shadow-lg">
              NIVEL {novoNivel}!
            </div>
            <div className="text-lg text-yellow-200/80 font-modern mb-6">
              Seu personagem evoluiu!
            </div>
          </div>
        )}

        {fase >= 3 && ganhos && (
          <div className="space-y-2 animate-fade-in">
            {ganhos.pontosAtributo > 0 && (
              <div className="game-glass px-6 py-2 rounded-lg border border-green-500/30 inline-block mx-1">
                <span className="text-green-400 font-modern font-semibold">
                  +{ganhos.pontosAtributo} Pontos de Atributo
                </span>
              </div>
            )}
            {ganhos.pontosVantagem > 0 && (
              <div className="game-glass px-6 py-2 rounded-lg border border-blue-500/30 inline-block mx-1">
                <span className="text-blue-400 font-modern font-semibold">
                  +{ganhos.pontosVantagem} Ponto de Vantagem
                </span>
              </div>
            )}
            {ganhos.tierMudou && (
              <div className="game-glass px-6 py-2 rounded-lg border border-purple-500/30 inline-block mx-1">
                <span className="text-purple-400 font-modern font-semibold">
                  Novo Tier: {nomeTier(ganhos.novoTier)}!
                </span>
              </div>
            )}
          </div>
        )}

        {fase >= 3 && (
          <div className="mt-6 text-slate-400 text-xs font-modern animate-fade-in">
            Clique para fechar
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LevelUpCelebration;
