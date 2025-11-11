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
    <div className="bg-amber-900/30 border border-amber-600/50 rounded-lg p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-amber-400 text-lg">⏱️</span>
          <span className="text-amber-300 text-sm font-semibold">
            Cooldown Roleplay
          </span>
        </div>
        <span className="text-amber-400 font-bold">
          {segundos}s
        </span>
      </div>
      
      {/* Barra de progresso */}
      <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000 ease-linear"
          style={{ width: `${porcentagem}%` }}
        />
      </div>

      <p className="text-amber-300/70 text-xs mt-2">
        Aguarde para enviar outra mensagem roleplay
      </p>
    </div>
  );
};

export default CooldownRoleplay;

