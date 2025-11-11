import React, { useState, useEffect } from 'react';

/**
 * Componente para exibir cooldown de mensagens roleplay (12 segundos)
 */
const CooldownRoleplay = ({ 
  segundosRestantes = 0, 
  ativo = false 
}) => {
  const [segundos, setSegundos] = useState(segundosRestantes);

  useEffect(() => {
    setSegundos(segundosRestantes);
  }, [segundosRestantes]);

  useEffect(() => {
    if (!ativo || segundos <= 0) return;

    const intervalo = setInterval(() => {
      setSegundos(prev => {
        if (prev <= 1) {
          clearInterval(intervalo);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [ativo, segundos]);

  if (!ativo || segundos <= 0) return null;

  const porcentagem = (segundos / 12) * 100;

  return (
    <div className="bg-amber-900/30 border-2 border-amber-600/50 rounded-xl px-4 py-2.5 shadow-lg inline-flex items-center space-x-3">
      <span className="text-amber-400 text-lg">⏱️</span>
      <div className="flex flex-col">
        <span className="text-amber-300 text-sm font-semibold">
          Cooldown: {segundos}s
        </span>
        {/* Barra de progresso compacta */}
        <div className="w-32 h-1.5 bg-black/30 rounded-full overflow-hidden mt-1">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000 ease-linear"
            style={{ width: `${porcentagem}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default CooldownRoleplay;

