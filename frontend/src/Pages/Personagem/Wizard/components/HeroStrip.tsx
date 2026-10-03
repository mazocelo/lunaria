// src/Pages/Personagem/Wizard/components/HeroStrip.tsx
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import '../wizard-motion.css';

export interface HeroStripAtributo { chave: string; sigla: string; valor: number }

export interface HeroStripProps {
  nome: string;
  racaNome?: string | null;
  classeNome?: string | null;
  imageUrl?: string | null;
  atributos: HeroStripAtributo[];
  etapasConcluidas: number;
  etapasTotal: number;
  pontosRestantes?: number | null;
  expandida: boolean;
  onToggle: () => void;
  isLight: boolean;
  children?: ReactNode;
}

const HeroStrip = ({
  nome, racaNome, classeNome, imageUrl, atributos, etapasConcluidas, etapasTotal,
  pontosRestantes = null, expandida, onToggle, isLight, children,
}: HeroStripProps) => {
  const nomeExibido = nome.trim() || 'Herói sem nome';
  const inicial = nome.trim() ? nome.trim().charAt(0).toUpperCase() : '?';
  const linhagem = racaNome || classeNome
    ? [racaNome, classeNome].filter(Boolean).join(' · ')
    : 'Raça e classe pendentes';
  const texto = isLight ? 'text-slate-800' : 'text-white';
  const suave = isLight ? 'text-slate-500' : 'text-slate-400';

  return (
    <section className="card-rpg !p-0 overflow-hidden" aria-label="Ficha do herói">
      <div className="flex items-center gap-3 px-4 py-3 md:gap-4">
        {imageUrl ? (
          <img src={imageUrl} alt={nomeExibido} className="h-11 w-11 shrink-0 rounded-xl object-cover" />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15 font-fantasy text-xl font-bold text-[var(--primary)]">{inicial}</div>
        )}

        <div className="min-w-0 flex-1">
          <h2 className={`truncate font-fantasy text-lg font-bold leading-tight ${texto}`}>{nomeExibido}</h2>
          <p className={`truncate font-modern text-xs ${suave}`}>{linhagem} · {etapasConcluidas}/{etapasTotal} etapas</p>
        </div>

        <ul className="hidden items-center gap-1 lg:flex" aria-label="Atributos">
          {atributos.map((a) => (
            <li key={a.chave} className={`rounded-md border px-2 py-1 font-modern text-[11px] tabular-nums ${isLight ? 'border-slate-200 text-slate-600' : 'border-slate-700 text-slate-300'}`}>
              <span className="mr-1 opacity-70">{a.sigla}</span><b>{a.valor}</b>
            </li>
          ))}
        </ul>

        {pontosRestantes !== null && (
          <span className={`hidden rounded-md px-2 py-1 font-modern text-xs font-semibold tabular-nums md:inline-flex ${pontosRestantes < 0 ? 'bg-red-500/15 text-red-400' : 'bg-[var(--primary)]/15 text-[var(--primary)]'}`}>
            {pontosRestantes} pts
          </span>
        )}

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expandida}
          aria-controls="hero-strip-ficha"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 font-modern text-xs font-semibold text-[var(--primary)] transition-colors cursor-pointer hover:bg-[var(--primary)]/10"
        >
          {expandida ? 'Fechar ficha' : 'Ver ficha'}
          <ChevronDown size={14} className={`transition-transform ${expandida ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="wz-expand" data-aberta={expandida ? 'true' : 'false'}>
        <div id="hero-strip-ficha">
          {expandida ? <div className={`border-t px-4 py-4 ${isLight ? 'border-slate-200' : 'border-slate-700/60'}`}>{children}</div> : null}
        </div>
      </div>
    </section>
  );
};

export default HeroStrip;
