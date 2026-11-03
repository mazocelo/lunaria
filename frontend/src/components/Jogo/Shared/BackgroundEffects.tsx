import { useMemo, type CSSProperties } from 'react';

interface BackgroundEffectsProps {
  particleCount?: number;
}

/**
 * Componente para efeitos de background animados
 * Posicoes memoizadas com seed deterministico para evitar reposicionamento em re-renders
 */
const BackgroundEffects = ({ particleCount = 30 }: BackgroundEffectsProps) => {
  const particles = useMemo<CSSProperties[]>(() => {
    const seed = (n: number) => {
      const x = Math.sin(n * 9301 + 49297) * 233280;
      return x - Math.floor(x);
    };

    return Array.from({ length: particleCount }, (_, i) => ({
      left: `${seed(i * 3) * 100}%`,
      top: `${seed(i * 3 + 1) * 100}%`,
      animationDelay: `${seed(i * 3 + 2) * 3}s`,
      animationDuration: `${2 + seed(i * 7) * 2}s`
    }));
  }, [particleCount]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {particles.map((style, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
          style={style}
        />
      ))}
    </div>
  );
};

export default BackgroundEffects;
