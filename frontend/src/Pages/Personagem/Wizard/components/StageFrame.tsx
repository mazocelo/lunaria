// src/Pages/Personagem/Wizard/components/StageFrame.tsx
import type { CSSProperties, ReactNode } from 'react';
import '../wizard-motion.css';

export interface StageFrameProps {
  etapaId: string;
  titulo: string;
  flavor: string;
  direcao: 1 | -1;
  isLight: boolean;
  acoes?: ReactNode;
  children: ReactNode;
}

const StageFrame = ({ etapaId, titulo, flavor, direcao, isLight, acoes, children }: StageFrameProps) => {
  const style = { '--wz-dir': direcao } as CSSProperties;
  return (
    <section key={etapaId} className="card-rpg wz-stage-in" style={style} aria-labelledby="etapa-titulo">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="etapa-titulo" tabIndex={-1} className={`outline-none font-fantasy text-2xl font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{titulo}</h2>
          <p className={`mt-0.5 font-fantasy text-base italic ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{flavor}</p>
        </div>
        {acoes ? <div className="flex shrink-0 items-center gap-2">{acoes}</div> : null}
      </header>
      {children}
    </section>
  );
};

export default StageFrame;
