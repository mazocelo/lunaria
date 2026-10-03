// src/Pages/Personagem/Wizard/components/WizardFooter.tsx
import { ArrowLeft, ArrowRight, Loader2, SkipForward } from 'lucide-react';

export interface WizardFooterProps {
  etapaIndex: number;
  etapasTotal: number;
  proximaLabel?: string | null;
  podeContinuar: boolean;
  enviando: boolean;
  onVoltar: () => void;
  /** Ausente nas etapas legado: lá o chat continua dono do avanço e o rodapé só oferece Voltar. */
  onContinuar?: () => void;
  onPular?: () => void;
  /** Substitui "Continuar: {próxima}" (ex.: "Confirmar magias", "Criar Ayla"). */
  rotuloContinuar?: string | null;
  /** Por que o botão principal está desabilitado. Aparece sob o botão. */
  motivoBloqueio?: string | null;
  isLight: boolean;
}

const WizardFooter = ({ etapaIndex, etapasTotal, proximaLabel = null, podeContinuar, enviando, onVoltar, onContinuar, onPular, rotuloContinuar = null, motivoBloqueio = null, isLight }: WizardFooterProps) => {
  const primeira = etapaIndex === 0;
  const ultima = etapaIndex >= etapasTotal - 1;
  const rotulo = rotuloContinuar ?? (ultima ? 'Finalizar' : proximaLabel ? `Continuar: ${proximaLabel}` : 'Continuar');
  const desabilitado = !podeContinuar || enviando;
  const mostrarMotivo = Boolean(motivoBloqueio) && !podeContinuar && !enviando;

  return (
    <footer className={`sticky bottom-0 z-10 -mx-6 mt-2 flex items-center justify-between gap-3 border-t px-6 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0 ${isLight ? 'border-slate-200 bg-white/85' : 'border-slate-700/60 bg-slate-950/70'}`} style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
      <div>
        {!primeira && (
          <button type="button" data-acao="voltar" onClick={onVoltar} disabled={enviando} className="btn-rpg-secondary inline-flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
            <ArrowLeft size={16} /> Voltar
          </button>
        )}
      </div>
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-2">
          {onPular && (
            <button type="button" data-acao="pular" onClick={onPular} disabled={enviando} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-modern text-sm cursor-pointer disabled:opacity-50 ${isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800/60'}`}>
              <SkipForward size={14} /> Pular etapa
            </button>
          )}
          {onContinuar && (
            <button type="button" data-acao="continuar" aria-describedby={mostrarMotivo ? 'rodape-motivo' : undefined} onClick={onContinuar} disabled={desabilitado} className="btn-rpg inline-flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
              {enviando ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>{rotulo}</span>
              {!enviando && !ultima ? <ArrowRight size={16} /> : null}
            </button>
          )}
        </div>
        {mostrarMotivo && (
          <p id="rodape-motivo" role="status" className={`mt-2 text-right font-modern text-sm ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{motivoBloqueio}</p>
        )}
      </div>
    </footer>
  );
};

export default WizardFooter;
