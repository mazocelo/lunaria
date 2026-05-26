import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

interface SceneTransitionImage {
  url: string;
  nome: string;
  tipo?: 'local' | 'encontro' | string;
}

interface SceneTransitionProps {
  image: SceneTransitionImage | null;
  onDone?: () => void;
}

type ScenePhase = 'hidden' | 'enter' | 'visible' | 'exit';

const FADE_MS = 800;
const HOLD_MS = 2200;

const SceneTransition = ({ image, onDone }: SceneTransitionProps) => {
  const [phase, setPhase] = useState<ScenePhase>('hidden');

  useEffect(() => {
    if (!image) return;

    // Monta invisível → próximo frame anima para visível
    setPhase('enter');
    const visibleTimer = setTimeout(() => setPhase('visible'), 30);
    const exitTimer = setTimeout(() => setPhase('exit'), 30 + HOLD_MS);
    const doneTimer = setTimeout(() => {
      setPhase('hidden');
      onDone?.();
    }, 30 + HOLD_MS + FADE_MS);

    return () => {
      clearTimeout(visibleTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  if (phase === 'hidden' || !image) return null;

  const isVisible = phase === 'visible';

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black"
      style={{ opacity: isVisible ? 1 : 0, transition: `opacity ${FADE_MS}ms ease-in-out` }}
    >
      <img
        src={image.url}
        alt={image.nome}
        className="w-full h-full object-cover absolute inset-0"
        draggable={false}
      />
      {/* Gradient overlay + label */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
      <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-2 px-6">
        <div className="flex items-center gap-2 text-white/60 text-xs uppercase tracking-widest font-modern">
          <MapPin size={12} />
          <span>{image.tipo === 'local' ? 'Local' : 'Encontro'}</span>
        </div>
        <p className="text-white text-3xl font-fantasy font-bold drop-shadow-2xl text-center">
          {image.nome}
        </p>
      </div>
    </div>
  );
};

export default SceneTransition;
