// src/Pages/Personagem/Wizard/stages/ResumoStage.tsx
import type { ReactNode } from 'react';
import { AlertTriangle, Pencil } from 'lucide-react';
import { FOCO } from '../../../../components/shared';
import type { Pendencia } from './pendencias';

export interface EscolhaDoResumo { nome: string; detalhe?: string; classe?: string; }

export interface ResumoStageProps {
  pendencias: Pendencia[];
  onResolver: (etapa: string) => void;
  escolhas: Array<{ titulo: string; etapa: string; itens: EscolhaDoResumo[] }>;
  onEditar: (etapa: string) => void;
  /** DestinoResolutivaBlock (Lunaria) ou atributos/perícias D&D só leitura, montado pela view. */
  leitura: ReactNode;
  ficha: ReactNode;
  isLight: boolean;
}

/** Finalizar: o que falta, as escolhas com Editar, a leitura do Mestre e a ficha. Criar fica no rodapé (MA:L16). */
const ResumoStage = ({ pendencias, onResolver, escolhas, onEditar, leitura, ficha }: ResumoStageProps) => (
  <div className="space-y-6">
    {pendencias.length > 0 && (
      <section role="alert" aria-labelledby="antes-de-criar" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
        <h3 id="antes-de-criar" className="flex items-center gap-2 font-fantasy text-lg font-bold text-[var(--foreground)]">
          <AlertTriangle size={16} aria-hidden="true" className="text-amber-500" /> Antes de criar
        </h3>
        <ul className="mt-2 space-y-1.5">
          {pendencias.map((p) => (
            <li key={`${p.etapa}-${p.texto}`} className="flex flex-wrap items-center justify-between gap-2 font-modern text-sm text-[var(--foreground)]">
              <span>{p.texto}</span>
              <button type="button" data-resolver={p.etapa} onClick={() => onResolver(p.etapa)} className={`font-semibold text-[var(--primary)] underline-offset-2 hover:underline cursor-pointer ${FOCO}`}>
                Resolver
              </button>
            </li>
          ))}
        </ul>
      </section>
    )}
    {escolhas.length > 0 && (
      <div className="grid gap-4 md:grid-cols-2">
        {escolhas.map((g) => (
          <section key={g.etapa} aria-label={g.titulo} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-fantasy text-base font-bold text-[var(--foreground)]">{g.titulo}</h3>
              <button type="button" data-editar={g.etapa} aria-label={`Editar ${g.titulo}`} onClick={() => onEditar(g.etapa)} className={`inline-flex items-center gap-1 font-modern text-sm text-[var(--primary)] cursor-pointer ${FOCO}`}>
                <Pencil size={12} aria-hidden="true" /> Editar
              </button>
            </div>
            {g.itens.length === 0 ? (
              <p className="mt-2 font-modern text-sm italic text-[var(--muted-foreground)]">Nenhuma escolha.</p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {g.itens.map((i) => (
                  <li key={i.nome} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2.5 py-1 font-modern text-sm text-[var(--foreground)]">
                    {i.nome}
                    {i.detalhe ? <span className={i.classe ?? 'text-[var(--muted-foreground)]'}>{i.detalhe}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    )}
    {leitura}
    <section aria-labelledby="resumo-ficha" className="space-y-3">
      <h3 id="resumo-ficha" className="font-fantasy text-xl font-bold text-[var(--foreground)]">Ficha do herói</h3>
      {ficha}
    </section>
  </div>
);

export default ResumoStage;
