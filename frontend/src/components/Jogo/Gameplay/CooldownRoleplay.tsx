import { useState, useEffect } from 'react';
import { Clock3 } from 'lucide-react';
import { ROLEPLAY_COOLDOWN_SECONDS, TIMEOUTS } from '../../../constants/game';

interface CooldownRoleplayProps {
  segundosRestantes?: number;
  ativo?: boolean;
}

const CooldownRoleplay = ({
  segundosRestantes = 0,
  ativo = false,
}: CooldownRoleplayProps) => {
  const [segundos, setSegundos] = useState(segundosRestantes);

  useEffect(() => {
    setSegundos(segundosRestantes);
  }, [segundosRestantes]);

  useEffect(() => {
    if (!ativo || segundos <= 0) return;

    const intervalo = setInterval(() => {
      setSegundos((prev) => {
        if (prev <= 1) {
          clearInterval(intervalo);
          return 0;
        }
        return prev - 1;
      });
    }, TIMEOUTS.COOLDOWN_TICK);

    return () => clearInterval(intervalo);
  }, [ativo, segundos]);

  if (!ativo || segundos <= 0) return null;

  const porcentagem = (segundos / ROLEPLAY_COOLDOWN_SECONDS) * 100;

  return (
    <div className="game-glass-subtle border border-amber-600/40 rounded-xl px-4 py-2.5 shadow-lg inline-flex items-center space-x-3">
      <Clock3 size={18} className="text-amber-400" />
      <div className="flex flex-col">
        <span className="text-amber-300 text-sm font-semibold">Cooldown: {segundos}s</span>
        <div className="w-32 h-1.5 rounded-full overflow-hidden mt-1 bg-white/[0.08] border border-white/[0.06]">
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
