// src/components/shared/ConfirmDialog.tsx
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { FOCO } from './foco';

export interface ConfirmDialogProps {
  aberto: boolean;
  titulo: string;
  descricao?: ReactNode;
  /** O que será refeito/perdido, um item por linha. */
  itens?: string[];
  rotuloConfirmar: string;
  rotuloCancelar?: string;
  perigo?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

const ConfirmDialog = ({ aberto, titulo, descricao, itens = [], rotuloConfirmar, rotuloCancelar = 'Cancelar', perigo = false, onConfirmar, onCancelar }: ConfirmDialogProps) => {
  const tituloId = useId();
  const descId = useId();
  const caixa = useRef<HTMLDivElement>(null);
  const cancelar = useRef<HTMLButtonElement>(null);
  // Ref para o Esc chamar o onCancelar atual sem refazer o efeito (e roubar o foco) a cada render do pai.
  const onCancelarRef = useRef(onCancelar);
  useEffect(() => { onCancelarRef.current = onCancelar; });

  // Ao abrir: foco em Cancelar (a opção segura), Esc cancela e Tab fica preso no diálogo.
  // Ao fechar: o foco volta a quem o tinha antes.
  useEffect(() => {
    if (!aberto) return undefined;
    const anterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    cancelar.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onCancelarRef.current(); return; }
      if (e.key !== 'Tab' || !caixa.current) return;
      const focaveis = caixa.current.querySelectorAll<HTMLElement>('button:not([disabled])');
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      const dentro = caixa.current.contains(document.activeElement);
      if (e.shiftKey && (!dentro || document.activeElement === primeiro)) { e.preventDefault(); ultimo?.focus(); }
      else if (!e.shiftKey && (!dentro || document.activeElement === ultimo)) { e.preventDefault(); primeiro?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); anterior?.focus(); };
  }, [aberto]);

  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={onCancelar}>
      <div ref={caixa} role="alertdialog" aria-modal="true" aria-labelledby={tituloId} aria-describedby={descId} onClick={(e) => e.stopPropagation()} className="card-rpg w-full max-w-md space-y-4 animate-scale-in">
        <h2 id={tituloId} className="flex items-center gap-2 font-fantasy text-xl font-bold text-[var(--foreground)]">
          <AlertTriangle size={18} aria-hidden="true" className={perigo ? 'text-red-500' : 'text-amber-500'} /> {titulo}
        </h2>
        <div id={descId} className="space-y-2 font-modern text-sm text-[var(--muted-foreground)]">
          {descricao}
          {itens.length > 0 && <ul className="list-disc space-y-1 pl-5 text-[var(--foreground)]">{itens.map((i) => <li key={i}>{i}</li>)}</ul>}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button ref={cancelar} type="button" data-acao="cancelar" onClick={onCancelar} className={`btn-rpg-secondary cursor-pointer ${FOCO}`}>{rotuloCancelar}</button>
          <button type="button" data-acao="confirmar" onClick={onConfirmar} className={`btn-rpg cursor-pointer ${perigo ? '!bg-red-600 !text-white' : ''} ${FOCO}`}>{rotuloConfirmar}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
