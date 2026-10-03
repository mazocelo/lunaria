// src/Pages/Personagem/Wizard/components/AtributoTile.tsx
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { modificadorLunaria } from '../stages/atributos';

export interface FonteDeBonus { label: string; valor: number; }

export interface AtributoTileProps {
  chave: string;
  rotulo: string;
  base: number;
  fontes: FonteDeBonus[];
  icone?: LucideIcon;
  dica?: string;
  children?: ReactNode;
  isLight: boolean;
}

const sinal = (n: number) => `${n >= 0 ? '+' : ''}${n}`;

/** Tile no estilo da ficha pronta (AtributosSection), com base e bônus decompostos. */
const AtributoTile = ({ chave, rotulo, base, fontes, icone: Icone, dica, children, isLight }: AtributoTileProps) => {
  const final = base + fontes.reduce((t, f) => t + f.valor, 0);
  const mod = modificadorLunaria(final);
  return (
    <div data-atributo={chave} data-base={base} data-final={final} className={`rounded-lg p-3 text-center ${isLight ? 'bg-[var(--muted)]/60' : 'bg-[var(--muted)]/40'}`}>
      <div className="flex items-center justify-center gap-1.5 font-modern text-xs text-[var(--muted-foreground)]">
        {Icone ? <Icone size={14} aria-hidden="true" /> : null} {rotulo}
      </div>
      <div className="font-modern text-2xl font-bold tabular-nums text-[var(--foreground)]">
        <span className="sr-only">final </span>{final}
      </div>
      <div className={`font-modern text-xs tabular-nums ${mod < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>mod {sinal(mod)}</div>
      <div className="mt-1 font-modern text-xs tabular-nums text-[var(--muted-foreground)]">base {base}</div>
      {fontes.length > 0 && (
        <ul aria-label={`Bônus de ${rotulo}`} className="mt-1 flex flex-wrap justify-center gap-1">
          {fontes.map((f, i) => (
            <li key={`${f.label}-${i}`} className={`rounded-full px-1.5 py-0.5 font-modern text-xs tabular-nums ${f.valor > 0 ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300' : 'bg-red-500/10 text-red-700 dark:text-red-300'}`}>{sinal(f.valor)} {f.label}</li>
          ))}
        </ul>
      )}
      {dica ? <p className="mt-1 font-modern text-xs text-[var(--muted-foreground)]">{dica}</p> : null}
      {children ? <div className="mt-2 flex items-center justify-center gap-2">{children}</div> : null}
    </div>
  );
};

export default AtributoTile;
