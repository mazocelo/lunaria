// src/Pages/Personagem/Wizard/stages/BackgroundStage.tsx
import type { CSSProperties } from 'react';
import { Check, ScrollText, Sparkles } from 'lucide-react';
import { FOCO } from '../../../../components/shared/foco';
import '../wizard-motion.css';

export interface BackgroundSugestao { nome: string; descricao: string | null; }

export interface BackgroundStageProps {
  /** Background do modelo (persistido no rascunho). */
  valor: string;
  sugestoes: BackgroundSugestao[];
  enviando: boolean;
  /** Grava o texto no modelo sem chamar o Mestre; quem avança é o rodapé. */
  onMudar: (texto: string) => void;
  /** Pede ideias ao Mestre sem sair da etapa (manterEtapa). */
  onPedirIdeias: () => void;
  isLight: boolean;
}

const LIMITE = 2000;

const BackgroundStage = ({ valor, sugestoes, enviando, onMudar, onPedirIdeias, isLight }: BackgroundStageProps) => (
  <div className="space-y-6">
    <div className="space-y-2">
      <label htmlFor="background-heroi" className="font-modern text-sm font-semibold text-[var(--foreground)]">De onde o seu herói vem?</label>
      <textarea
        id="background-heroi"
        aria-describedby="background-contador"
        rows={6}
        value={valor}
        maxLength={LIMITE}
        onChange={(e) => onMudar(e.target.value)}
        placeholder="O que ele perdeu, o que ele quer, quem deixou para trás."
        className={`w-full resize-y rounded-xl border border-[var(--border)] px-4 py-3 font-modern text-base leading-relaxed ${isLight ? 'bg-white' : 'bg-[var(--card)]'} text-[var(--foreground)] ${FOCO}`}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span id="background-contador" className="font-modern text-xs tabular-nums text-[var(--muted-foreground)]">{valor.length}/{LIMITE}</span>
        <button type="button" data-acao="pedir-ideias" disabled={enviando} onClick={onPedirIdeias} className={`btn-rpg-secondary inline-flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${FOCO}`}>
          <Sparkles size={14} aria-hidden="true" /> Pedir ideias ao Mestre
        </button>
      </div>
    </div>

    {sugestoes.length > 0 && (
      <section aria-labelledby="bg-sugestoes" className="space-y-3">
        <h3 id="bg-sugestoes" className="font-modern text-sm font-semibold text-[var(--muted-foreground)]">Ideias do Mestre (clique para usar e edite à vontade)</h3>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {sugestoes.map((s, i) => {
            const escolhida = valor.trim() === s.nome.trim();
            return (
              <li key={`${s.nome}-${i}`} className="wz-card-in" style={{ '--wz-i': Math.min(i, 11) } as CSSProperties}>
                <button
                  type="button"
                  data-sugestao-bg={String(i)}
                  aria-pressed={escolhida}
                  onClick={() => onMudar(s.nome)}
                  className={`h-full w-full rounded-xl border p-4 text-left transition-colors cursor-pointer hover:border-[var(--primary)] ${escolhida ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]' : 'border-[var(--border)]'} bg-[var(--card)] ${FOCO}`}
                >
                  <span className="flex items-center gap-2 font-fantasy text-base font-bold text-[var(--foreground)]">
                    <ScrollText size={14} aria-hidden="true" className="shrink-0 text-[var(--primary)]" /> {s.nome}
                    {escolhida && <span className="ml-auto inline-flex items-center gap-1 font-modern text-xs text-[var(--primary)]"><Check size={12} aria-hidden="true" /> Escolhida</span>}
                  </span>
                  {s.descricao ? <span className="mt-1 block font-modern text-sm text-[var(--muted-foreground)]">{s.descricao}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    )}
  </div>
);

export default BackgroundStage;
