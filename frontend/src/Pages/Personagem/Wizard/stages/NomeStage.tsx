// src/Pages/Personagem/Wizard/stages/NomeStage.tsx
import { Sparkles } from 'lucide-react';
import '../wizard-motion.css';

export interface NomeStageProps {
  /** Valor digitado; quem controla é a view, para o Continuar do rodapé confirmar o rascunho. */
  rascunho: string;
  onRascunhoChange: (valor: string) => void;
  sugestoes: string[];
  enviando: boolean;
  /** Enter no input: mesmo caminho do Continuar do rodapé. */
  onConfirmar: () => void;
  onPedirSugestoes: () => void;
  nomeSistema: string;
  isLight: boolean;
}

const NomeStage = ({ rascunho, onRascunhoChange, sugestoes, enviando, onConfirmar, onPedirSugestoes, nomeSistema, isLight }: NomeStageProps) => (
  <div className="space-y-6">
    <form onSubmit={(e) => { e.preventDefault(); if (rascunho.trim() && !enviando) onConfirmar(); }}>
      <input
        id="nome-heroi"
        type="text"
        value={rascunho}
        maxLength={60}
        disabled={enviando}
        onChange={(e) => onRascunhoChange(e.target.value)}
        placeholder="Como o seu herói se chama?"
        aria-label="Nome do herói"
        className={`w-full rounded-xl border px-4 py-3 font-fantasy text-2xl outline-none focus:border-[var(--primary)] ${isLight ? 'border-slate-300 bg-white text-slate-900' : 'border-slate-700 bg-slate-950/40 text-white'}`}
        autoComplete="off"
      />
    </form>

    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`font-modern text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          {sugestoes.length > 0 ? 'Nomes sugeridos pelo Mestre Criador. Toque em um para editar antes de continuar.' : `Sem ideias? O Mestre Criador sugere nomes que combinam com ${nomeSistema}.`}
        </p>
        <button type="button" onClick={onPedirSugestoes} disabled={enviando} className="btn-rpg-secondary inline-flex items-center gap-2 cursor-pointer disabled:opacity-50">
          <Sparkles size={14} /> {sugestoes.length > 0 ? 'Mais nomes' : 'Pedir nomes ao Mestre'}
        </button>
      </div>
      {sugestoes.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {sugestoes.map((nome, i) => (
            <li key={`${nome}-${i}`} className="wz-card-in" style={{ ['--wz-i' as string]: i }}>
              <button type="button" disabled={enviando} onClick={() => onRascunhoChange(nome)} className={`rounded-full border px-4 py-2 font-modern text-sm cursor-pointer disabled:opacity-50 ${isLight ? 'border-slate-300 bg-white text-slate-700 hover:border-[var(--primary)]' : 'border-slate-700 bg-slate-900/60 text-slate-200 hover:border-[var(--primary)]'}`}>
                {nome}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

export default NomeStage;
