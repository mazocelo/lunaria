// src/Pages/Personagem/Wizard/components/MestrePanel.tsx
import { RefreshCw, Send, Sparkles, X } from 'lucide-react';
import MarkdownRenderer from '../../../../components/MarkdownRenderer';
import type { WizardMessage, WizardSuggestion } from '../hooks/useChatState';
import { getStageConfig } from '../stages/stageConfig';
import '../wizard-motion.css';

export interface MestrePanelProps {
  aberto: boolean;
  onFechar: () => void;
  mensagens: WizardMessage[];
  enviando: boolean;
  inputTexto: string;
  setInputTexto: (v: string) => void;
  etapaAtual: string;
  sistema: string;
  onEnviar: (texto: string, options?: { manterEtapa?: boolean; aceitarNome?: boolean }) => void;
  onEscolherSugestao: (s: WizardSuggestion) => void;
  isLight: boolean;
}

const tipoDe = (s: WizardSuggestion) => String(s.tipo ?? '');

const MestrePanel = (props: MestrePanelProps) => {
  const { aberto, onFechar, mensagens, enviando, inputTexto, setInputTexto, etapaAtual, sistema, onEnviar, onEscolherSugestao, isLight } = props;
  if (!aberto) return null;

  const config = getStageConfig(etapaAtual, sistema);
  const ultimaDoMestre = [...mensagens].reverse().find((m) => m.role === 'mestre');
  const sugestoes = (ultimaDoMestre?.sugestoes ?? []) as WizardSuggestion[];
  const texto = isLight ? 'text-slate-800' : 'text-slate-100';
  const suave = isLight ? 'text-slate-500' : 'text-slate-400';
  const chip = `rounded-full border px-3 py-1.5 font-modern text-sm transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 border-[var(--primary)]/30 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 ${isLight ? 'text-slate-800' : 'text-slate-100'}`;

  const enviar = () => {
    if (!inputTexto.trim() || enviando) return;
    onEnviar(inputTexto);
    setInputTexto('');
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/40 md:bg-transparent md:pointer-events-none" onClick={onFechar}>
      <aside
        role="dialog"
        aria-label="Mestre Criador"
        onClick={(e) => e.stopPropagation()}
        className={`wz-sheet-in pointer-events-auto flex h-[85vh] w-full flex-col self-end rounded-t-2xl border shadow-2xl md:h-full md:w-[26rem] md:self-stretch md:rounded-none md:border-y-0 md:border-r-0 ${isLight ? 'border-slate-200 bg-white' : 'border-slate-700/60 bg-slate-900'}`}
      >
        <header className={`flex items-center gap-3 border-b px-4 py-3 ${isLight ? 'border-slate-200' : 'border-slate-700/60'}`}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]"><Sparkles size={18} /></span>
          <div className="min-w-0 flex-1">
            <h3 className={`font-fantasy text-lg font-bold leading-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>Mestre Criador</h3>
            <p className={`font-modern text-xs ${suave}`}>Sugestões para a etapa {config.label}</p>
          </div>
          <button type="button" onClick={onFechar} aria-label="Fechar" className={`rounded-lg p-1.5 cursor-pointer ${isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800'}`}><X size={18} /></button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {mensagens.length === 0 && <p className={`font-modern text-sm italic ${suave}`}>O Mestre ainda não falou nesta etapa. Peça uma sugestão abaixo.</p>}
          {mensagens.map((msg, i) => (
            <div key={i} className={msg.role === 'jogador' ? 'ml-8' : ''}>
              <p className={`mb-1 font-modern text-xs font-semibold ${suave}`}>{msg.role === 'mestre' ? 'Mestre Criador' : msg.role === 'sistema' ? 'Sistema' : 'Você'}</p>
              <div className={`rounded-xl px-3 py-2 font-modern text-sm leading-relaxed ${texto} ${msg.role === 'jogador' ? 'bg-[var(--primary)]/15' : isLight ? 'bg-slate-50' : 'bg-slate-800/60'}`}>
                <MarkdownRenderer>{msg.content}</MarkdownRenderer>
              </div>
            </div>
          ))}

          {sugestoes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sugestoes.map((s, i) => {
                const tipo = tipoDe(s);
                const nome = String(s.nome ?? '');
                if (!nome) return null;
                const onClick = tipo === 'nome' ? () => onEnviar(nome, { aceitarNome: true })
                  : tipo === 'background' ? () => onEnviar(nome)
                  : () => onEscolherSugestao(s);
                return (
                  <button key={`${tipo}-${i}`} type="button" data-sugestao={tipo} disabled={enviando} onClick={onClick} title={String(s.descricao ?? '')} className={chip}>
                    {nome}{typeof s.custo === 'number' ? <span className="ml-1 opacity-70 tabular-nums">{s.custo} pts</span> : null}
                  </button>
                );
              })}
            </div>
          )}

          {config.allowRefresh && (
            <button type="button" disabled={enviando} onClick={() => onEnviar(config.refreshPrompt ?? 'Me dê outras opções', { manterEtapa: true })} className={`inline-flex items-center gap-2 font-modern text-sm cursor-pointer disabled:opacity-50 text-[var(--primary)]`}>
              <RefreshCw size={14} /> Mais sugestões
            </button>
          )}
        </div>

        <form className={`flex items-end gap-2 border-t px-4 py-3 ${isLight ? 'border-slate-200' : 'border-slate-700/60'}`} onSubmit={(e) => { e.preventDefault(); enviar(); }}>
          <textarea
            id="mestre-input"
            rows={2}
            value={inputTexto}
            disabled={enviando}
            onChange={(e) => setInputTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
            placeholder={config.placeholder}
            className={`min-h-[44px] flex-1 resize-none rounded-lg border px-3 py-2 font-modern text-sm outline-none focus:border-[var(--primary)] ${isLight ? 'border-slate-300 bg-white text-slate-800' : 'border-slate-700 bg-slate-950/50 text-white'}`}
          />
          <button type="submit" data-acao="enviar-mestre" disabled={enviando || !inputTexto.trim()} aria-label="Enviar" className="btn-rpg !px-3 cursor-pointer disabled:opacity-50"><Send size={16} /></button>
        </form>
      </aside>
    </div>
  );
};

export default MestrePanel;
