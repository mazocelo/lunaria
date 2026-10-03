// src/Pages/Personagem/Wizard/stages/custoTraco.ts
export interface CustoFormatado { texto: string; efeito: 'gasta' | 'devolve' | 'gratis'; classe: string; }

const PILULA = 'rounded-full px-2 py-0.5 font-modern text-xs font-semibold tabular-nums';
const pts = (n: number) => `${n} ${n === 1 ? 'pt' : 'pts'}`;

/** Convenção única (G-01/G-02): vantagem custa, desvantagem devolve. Mesmo texto no wizard, no Mestre e na ficha. */
export function formatarCustoTraco(custo: number | null | undefined): CustoFormatado {
  const n = Number(custo) || 0;
  if (n > 0) return { texto: `Custa ${pts(n)}`, efeito: 'gasta', classe: `${PILULA} bg-amber-400/20 text-amber-700 dark:text-amber-400` };
  if (n < 0) return { texto: `Devolve ${pts(-n)}`, efeito: 'devolve', classe: `${PILULA} bg-emerald-500/15 text-emerald-700 dark:text-emerald-400` };
  return { texto: 'Grátis', efeito: 'gratis', classe: `${PILULA} bg-emerald-500/15 text-emerald-700 dark:text-emerald-400` };
}

/** Cor do tipo, igual à ficha pronta (personagem-ver): vantagem ciano, desvantagem vermelho. */
export const CLASSE_TIPO = {
  vantagem: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  desvantagem: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
} as const;
