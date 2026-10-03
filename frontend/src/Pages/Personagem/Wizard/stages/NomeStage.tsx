// src/Pages/Personagem/Wizard/stages/NomeStage.tsx
import { useState } from 'react';
import { Sparkles, Check } from 'lucide-react';
import '../wizard-motion.css';

export interface NomeStageProps {
  nomeAtual: string;
  sugestoes: string[];
  enviando: boolean;
  onConfirmar: (nome: string) => void;
  onPedirSugestoes: () => void;
  isLight: boolean;
}

const NomeStage = ({ nomeAtual, sugestoes, enviando, onConfirmar, onPedirSugestoes, isLight }: NomeStageProps) => {
  const [rascunho, setRascunho] = useState(nomeAtual);
  const valido = rascunho.trim().length > 0;
  const confirmar = (valor: string) => {
    const nome = valor.trim();
    if (!nome || enviando) return;
    onConfirmar(nome);
  };

  return (
    <div className="space-y-6">
      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={(e) => { e.preventDefault(); confirmar(rascunho); }}>
        <input
          id="nome-heroi"
          type="text"
          value={rascunho}
          maxLength={60}
          disabled={enviando}
          onChange={(e) => setRascunho(e.target.value)}
          placeholder="Como o seu herói se chama?"
          className={`flex-1 rounded-xl border px-4 py-3 font-fantasy text-2xl outline-none focus:border-[var(--primary)] ${isLight ? 'border-slate-300 bg-white text-slate-900' : 'border-slate-700 bg-slate-950/40 text-white'}`}
          autoComplete="off"
        />
        <button type="submit" data-acao="confirmar-nome" disabled={!valido || enviando} className="btn-rpg inline-flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
          <Check size={16} /> Usar este nome
        </button>
      </form>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={`font-modern text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {sugestoes.length > 0 ? 'Nomes sugeridos pelo Mestre Criador' : 'Sem ideias? O Mestre Criador sugere nomes que combinam com o mundo de Lunaria.'}
          </p>
          <button type="button" onClick={onPedirSugestoes} disabled={enviando} className="btn-rpg-secondary inline-flex items-center gap-2 cursor-pointer disabled:opacity-50">
            <Sparkles size={14} /> {sugestoes.length > 0 ? 'Mais nomes' : 'Pedir nomes ao Mestre'}
          </button>
        </div>
        {sugestoes.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {sugestoes.map((nome, i) => (
              <li key={`${nome}-${i}`} className="wz-card-in" style={{ ['--wz-i' as string]: i }}>
                <button type="button" disabled={enviando} onClick={() => { setRascunho(nome); confirmar(nome); }} className={`rounded-full border px-4 py-2 font-modern text-sm cursor-pointer disabled:opacity-50 ${isLight ? 'border-slate-300 bg-white text-slate-700 hover:border-[var(--primary)]' : 'border-slate-700 bg-slate-900/60 text-slate-200 hover:border-[var(--primary)]'}`}>
                  {nome}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NomeStage;
