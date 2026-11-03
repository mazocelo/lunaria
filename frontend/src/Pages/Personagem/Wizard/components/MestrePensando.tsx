// src/Pages/Personagem/Wizard/components/MestrePensando.tsx
import { Sparkles } from 'lucide-react';

/** Indicador de que o Mestre está gerando a resposta. Região viva para leitores de tela. */
const MestrePensando = ({ isLight }: { isLight: boolean }) => (
  <div role="status" aria-live="polite" data-mestre="pensando" className={`inline-flex items-center gap-3 rounded-xl px-3 py-2 font-modern text-sm ${isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800/60 text-slate-200'}`}>
    <Sparkles size={16} className="shrink-0 text-[var(--primary)] motion-safe:animate-pulse" aria-hidden="true" />
    <span>O Mestre está pensando…</span>
    <span className="flex gap-1" aria-hidden="true">
      {[0, 150, 300].map((atraso) => (
        <span key={atraso} className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] motion-safe:animate-pulse" style={{ animationDelay: `${atraso}ms` }} />
      ))}
    </span>
  </div>
);

export default MestrePensando;
