import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

/**
 * SceneTransition — overlay fullscreen com fade-in/out ao entrar em um local.
 *
 * Props:
 *   image   { url, nome, tipo } | null   — entidade a exibir. null fecha.
 *   onDone  () => void                   — chamado após o fade-out completar.
 */
const FADE_MS = 800;
const HOLD_MS = 2200;

const SceneTransition = ({ image, onDone }) => {
  const [phase, setPhase] = useState('hidden'); // hidden | fadein | hold | fadeout

  useEffect(() => {
    if (!image) return;

    setPhase('fadein');

    const holdTimer = setTimeout(() => setPhase('hold'), FADE_MS);
    const fadeOutTimer = setTimeout(() => setPhase('fadeout'), FADE_MS + HOLD_MS);
    const doneTimer = setTimeout(() => {
      setPhase('hidden');
      onDone?.();
    }, FADE_MS + HOLD_MS + FADE_MS);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(doneTimer);
    };
  }, [image]);

  if (phase === 'hidden' || !image) return null;

  const opacity = phase === 'fadein' ? 'opacity-100' : phase === 'hold' ? 'opacity-100' : 'opacity-0';
  const transition = `transition-opacity duration-[${FADE_MS}ms]`;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black ${opacity} ${transition}`}
      style={{ transition: `opacity ${FADE_MS}ms ease-in-out` }}
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
