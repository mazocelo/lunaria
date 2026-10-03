// src/Pages/Personagem/Wizard/components/MestreFalaCard.tsx
import { MessageCircle, Sparkles, X } from 'lucide-react';
import MarkdownRenderer from '../../../../components/MarkdownRenderer';

interface MestreFalaCardProps {
  fala: string;
  onAbrirConversa: () => void;
  onFechar: () => void;
  isLight: boolean;
}

/** Fala do Mestre quando ele recusa o avanço: aparece acima do rodapé, já que o chat está fechado. */
const MestreFalaCard = ({ fala, onAbrirConversa, onFechar, isLight }: MestreFalaCardProps) => (
  <div role="status" aria-live="polite" data-mestre="recusa" className="card-rpg flex items-start gap-3 !py-3">
    <Sparkles size={18} className="mt-0.5 shrink-0 text-[var(--primary)]" aria-hidden="true" />
    <div className={`min-w-0 flex-1 space-y-2 font-modern text-sm ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
      <p className="font-semibold">O Mestre Criador respondeu</p>
      <MarkdownRenderer>{fala}</MarkdownRenderer>
      <button type="button" onClick={onAbrirConversa} className="inline-flex items-center gap-1.5 font-semibold text-[var(--primary)] cursor-pointer">
        <MessageCircle size={14} /> Abrir conversa
      </button>
    </div>
    <button type="button" onClick={onFechar} aria-label="Fechar resposta do Mestre" className="cursor-pointer opacity-70 hover:opacity-100"><X size={16} /></button>
  </div>
);

export default MestreFalaCard;
