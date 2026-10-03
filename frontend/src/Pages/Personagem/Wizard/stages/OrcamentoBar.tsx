// src/Pages/Personagem/Wizard/stages/OrcamentoBar.tsx
import { X } from 'lucide-react';
import { FOCO } from '../../../../components/shared/foco';
import { formatarCustoTraco } from './custoTraco';

export interface SelecaoEscolhida {
  id: number | string;
  nome: string;
  custo: number;
}

export interface OrcamentoBarProps {
  tipo: 'vantagem' | 'desvantagem';
  total: number;
  gastos: number;
  restantes: number;
  custoRaca: number;
  custoClasse: number;
  pontosVantagem: number;
  devolvidos: number;
  maxDevolucao: number;
  escolhidas: SelecaoEscolhida[];
  enviando: boolean;
  onRemover: (id: number | string) => void;
  isLight: boolean;
}

const OrcamentoBar = ({ tipo, total, gastos, restantes, custoRaca, custoClasse, pontosVantagem, devolvidos, maxDevolucao, escolhidas, enviando, onRemover, isLight }: OrcamentoBarProps) => {
  const excedido = restantes < 0;
  const erro = isLight ? 'text-red-600' : 'text-red-400';
  const pilula = 'rounded-full bg-[var(--muted)] px-2.5 py-1 font-modern text-xs tabular-nums text-[var(--muted-foreground)]';

  return (
    <section aria-label="Orçamento de criação" className={`rounded-xl border p-4 ${excedido ? 'border-red-500/40 bg-red-500/5' : 'border-[var(--border)] bg-[var(--muted)]/30'}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-fantasy text-base font-bold text-[var(--foreground)]">Pontos de criação</p>
          <p role="status" aria-live="polite" className="font-modern text-sm text-[var(--muted-foreground)]">
            <span data-saldo={restantes} className={`font-modern text-2xl font-bold tabular-nums ${excedido ? erro : 'text-[var(--foreground)]'}`}>{restantes}</span>
            {' '}de {total} restantes · {gastos} gastos
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className={pilula}>Raça {custoRaca}</span>
          <span className={pilula}>Classe {custoClasse}</span>
          <span className={pilula}>Vantagens {pontosVantagem}</span>
          <span className={`rounded-full bg-emerald-500/15 px-2.5 py-1 font-modern text-xs tabular-nums ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>Desvantagens +{devolvidos} de {maxDevolucao}</span>
        </div>
      </div>

      {excedido && (
        <p role="alert" className={`mt-3 font-modern text-sm ${erro}`}>Orçamento excedido: remova uma vantagem ou volte e escolha raça ou classe mais baratas.</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {escolhidas.length === 0 ? (
          <span className="font-modern text-sm italic text-[var(--muted-foreground)]">Nenhuma {tipo} escolhida ainda.</span>
        ) : escolhidas.map((e) => (
          <span key={String(e.id)} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 py-1 pl-3 pr-1 font-modern text-sm">
            <span className="text-[var(--foreground)]">{e.nome}</span>
            <span className={formatarCustoTraco(e.custo).classe}>{formatarCustoTraco(e.custo).texto}</span>
            <button
              type="button"
              data-remover={String(e.id)}
              aria-label={`Remover ${e.nome}`}
              disabled={enviando}
              onClick={() => onRemover(e.id)}
              className={`rounded-full p-1.5 text-[var(--foreground)] cursor-pointer hover:bg-[var(--primary)]/20 disabled:cursor-not-allowed disabled:opacity-50 ${FOCO}`}
            >
              <X size={12} aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
    </section>
  );
};

export default OrcamentoBar;
