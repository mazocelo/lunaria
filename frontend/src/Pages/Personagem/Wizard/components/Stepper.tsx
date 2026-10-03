// src/Pages/Personagem/Wizard/components/Stepper.tsx
import { AlertTriangle, Check } from 'lucide-react';
import type { StageEtapa } from '../stages/stageConfig';

export interface StepperProps {
  etapas: StageEtapa[];
  etapaIndex: number;
  etapasConcluidas: string[];
  etapasVisitadas: string[];
  puladas?: string[];
  /** Etapas que uma troca derrubou e precisam ser refeitas. */
  invalidadas?: string[];
  onEtapaClick: (id: string) => void;
  isLight: boolean;
}

type EstadoEtapa = 'atual' | 'concluida' | 'visitada' | 'futura';

const estadoDe = (id: string, index: number, props: StepperProps): EstadoEtapa => {
  if (index === props.etapaIndex) return 'atual';
  if (props.etapasConcluidas.includes(id)) return 'concluida';
  if (props.etapasVisitadas.includes(id)) return 'visitada';
  return 'futura';
};

const Stepper = (props: StepperProps) => {
  const { etapas, etapaIndex, puladas = [], invalidadas = [], onEtapaClick, isLight } = props;
  const total = etapas.length;
  const progresso = total === 0 ? 0 : Math.round(((etapaIndex + 1) / total) * 100);
  const atual = etapas[etapaIndex];

  return (
    <nav aria-label="Progresso da criação" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className={`font-modern text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Etapa {etapaIndex + 1} de {total}
          {atual ? <span className={`ml-2 font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>{atual.label}</span> : null}
        </span>
      </div>

      <div className={`h-1.5 w-full overflow-hidden rounded-full ${isLight ? 'bg-slate-200' : 'bg-slate-700/60'}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progresso}>
        <div className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-300 ease-out" style={{ width: `${progresso}%` }} />
      </div>

      <ol className="hidden flex-wrap gap-1.5 md:flex">
        {etapas.map((etapa, index) => {
          const estado = estadoDe(etapa.id, index, props);
          const pulada = puladas.includes(etapa.id);
          const invalidada = invalidadas.includes(etapa.id);
          const clicavel = estado === 'concluida' || estado === 'visitada';
          const base = 'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-modern text-xs transition-colors';
          const porEstado: Record<EstadoEtapa, string> = {
            atual: 'border-[var(--primary)] bg-[var(--primary)]/10 ' + (isLight ? 'text-slate-900' : 'text-white'),
            concluida: 'border-transparent ' + (isLight ? 'text-emerald-700 hover:bg-emerald-50' : 'text-emerald-400 hover:bg-emerald-500/10'),
            visitada: 'border-transparent ' + (isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800/60'),
            futura: 'border-transparent ' + (isLight ? 'text-slate-400' : 'text-slate-500'),
          };
          return (
            <li key={etapa.id}>
              <button
                type="button"
                data-etapa={etapa.id}
                data-estado={estado}
                data-invalidada={invalidada ? 'true' : undefined}
                title={invalidada ? `${etapa.label} precisa ser refeita` : undefined}
                aria-current={estado === 'atual' ? 'step' : undefined}
                disabled={!clicavel}
                onClick={() => clicavel && onEtapaClick(etapa.id)}
                className={`${base} ${invalidada && estado !== 'atual' ? (isLight ? 'border-transparent text-amber-700 hover:bg-amber-50' : 'border-transparent text-amber-400 hover:bg-amber-500/10') : porEstado[estado]} ${clicavel ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {invalidada ? <AlertTriangle size={12} aria-hidden="true" className={isLight ? 'text-amber-700' : 'text-amber-400'} /> : estado === 'concluida' ? <Check size={12} /> : null}
                <span>{etapa.label}{pulada ? ' (pulada)' : ''}</span>
                {invalidada ? <span className="sr-only">, precisa ser refeita</span> : null}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Stepper;
