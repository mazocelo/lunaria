import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, Shield, Sparkles, ScrollText, Swords, ShoppingBag, X } from 'lucide-react';
import LojaMestreModal from '../../../../components/LojaMestreModal';
import { FOCO } from '../../../../components/shared';
import { ATRIBUTOS_LUNARIA } from '../stages/atributos';
import type { FalhaPosCriacao } from '../stages/criacao';

interface ComboItem {
  id?: number | string;
  nome?: string;
  motivo?: string;
  [key: string]: unknown;
}

interface ComboItemEnriched extends ComboItem {
  grupo: string;
  badge: string;
  badgeClass: string;
}

interface PreviewCombo {
  equipamentos?: ComboItem[];
  habilidades?: ComboItem[];
  magias?: ComboItem[];
}

interface PreviewSnapshot {
  nome?: string;
  raca?: string;
  classe?: string;
  atributos?: Record<string, number>;
  vantagens?: Array<{ id?: number | string; nome?: string }>;
  desvantagens?: Array<{ id?: number | string; nome?: string }>;
}

interface PreviewData {
  combo?: PreviewCombo;
  snapshot?: PreviewSnapshot;
  fala_personagem?: string;
  leitura_ficha?: string;
}

interface PersonagemResultado {
  id?: number;
  nome?: string;
  sistema?: string;
  moedas?: number;
  [key: string]: unknown;
}

interface ResultadoData {
  personagem?: PersonagemResultado | null;
  preview?: PreviewData | null;
  background_digitado?: string;
  background_gerado?: string | null;
  background_final?: string;
  background_indisponivel?: boolean;
  /** Passos pós-criação que falharam (A36): o personagem existe, o jogador precisa saber o que faltou. */
  falhas?: FalhaPosCriacao[];
}

function buildItensCombo(combo: PreviewCombo = {}): ComboItemEnriched[] {
  return [
    ...(combo.equipamentos || []).map((item) => ({ ...item, grupo: 'Equipamento', badge: 'Inventario', badgeClass: 'bg-amber-400/15 text-amber-600' })),
    ...(combo.habilidades || []).map((item) => ({ ...item, grupo: 'Habilidade', badge: 'Recomendacao', badgeClass: 'bg-emerald-500/15 text-emerald-500' })),
    ...(combo.magias || []).map((item) => ({ ...item, grupo: 'Magia', badge: 'Recomendacao', badgeClass: 'bg-[var(--primary)]/15 text-[var(--primary)]' })),
  ];
}

interface WizardCreationResultModalProps {
  open?: boolean;
  data?: ResultadoData | null;
  onViewSheet: () => void;
  onGoToCharacters: () => void;
  /** Esc e o X fecham o modal (o personagem já existe; criar de novo só reabre o resultado). */
  onClose?: () => void;
  /** Mantido por compatibilidade com quem passa o tema; as cores vêm dos tokens. */
  isLight?: boolean;
}

const WizardCreationResultModal = ({
  open = false,
  data,
  onViewSheet,
  onGoToCharacters,
  onClose,
}: WizardCreationResultModalProps) => {
  const itensCombo = useMemo(() => buildItensCombo(data?.preview?.combo), [data]);
  const [lojaAberta, setLojaAberta] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const aberto = open && Boolean(data);
  // Refs para o teclado usar os valores atuais sem refazer o efeito (e roubar o foco) a cada render.
  const onCloseRef = useRef(onClose);
  const lojaAbertaRef = useRef(lojaAberta);
  useEffect(() => { onCloseRef.current = onClose; lojaAbertaRef.current = lojaAberta; });

  // Mesmo contrato do ConfirmDialog: foco no primeiro botão, Tab preso, Esc fecha, foco devolvido.
  // Com a loja aberta, o teclado é dela.
  useEffect(() => {
    if (!aberto) return undefined;
    const anterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    caixa.current?.querySelector<HTMLElement>('button:not([disabled])')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (lojaAbertaRef.current || !caixa.current) return;
      if (e.key === 'Escape') { e.preventDefault(); onCloseRef.current?.(); return; }
      if (e.key !== 'Tab') return;
      const focaveis = caixa.current.querySelectorAll<HTMLElement>('button:not([disabled])');
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      const dentro = caixa.current.contains(document.activeElement);
      if (e.shiftKey && (!dentro || document.activeElement === primeiro)) { e.preventDefault(); ultimo?.focus(); }
      else if (!e.shiftKey && (!dentro || document.activeElement === ultimo)) { e.preventDefault(); primeiro?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); anterior?.focus(); };
  }, [aberto]);

  if (!open || !data) return null;

  const snapshot = data.preview?.snapshot || {};
  const personagem = data.personagem || {};
  const isTresDet = personagem.sistema === 'tresdet';
  const preview = data.preview ?? null;
  const falhas = new Set<FalhaPosCriacao>(data.falhas ?? []);
  if (data.background_indisponivel) falhas.add('background');

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/72 px-4 py-6 backdrop-blur-md">
      <div ref={caixa} role="dialog" aria-modal="true" aria-labelledby="resultado-titulo" className="card-rpg !p-0 animate-scale-in relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-xl border">
        {onClose && (
          <button type="button" aria-label="Fechar" onClick={onClose} className={`absolute right-3 top-3 z-10 rounded-lg p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer ${FOCO}`}>
            <X size={18} aria-hidden="true" />
          </button>
        )}
        <div className="max-h-[92vh] overflow-y-auto p-5 md:p-7">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="bg-emerald-500/15 text-emerald-500 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-modern font-semibold">
                  <CheckCircle2 size={12} aria-hidden="true" />
                  Personagem criado com sucesso
                </span>
                <h2 id="resultado-titulo" className="mt-3 text-3xl font-fantasy font-bold text-[var(--foreground)]">
                  {personagem.nome || snapshot.nome || 'Personagem criado'}
                </h2>
                <p className="mt-2 text-sm font-modern text-[var(--muted-foreground)]">
                  {[snapshot.raca, snapshot.classe].filter(Boolean).join(' • ')}
                </p>
              </div>

              <div className="bg-[var(--muted)]/40 rounded-2xl px-4 py-3">
                <p className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
                  Registro final
                </p>
                <p className="mt-1 text-sm font-modern text-[var(--foreground)]">
                  {preview
                    ? 'O background foi finalizado e a resolutiva do Mestre foi anexada ao fechamento da ficha.'
                    : 'O background foi finalizado e a ficha está pronta.'}
                </p>
              </div>
            </div>

            {falhas.size > 0 && (
              <div role="status" className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 font-modern text-sm text-[var(--foreground)]">
                <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-amber-500" />
                <div className="space-y-1">
                  {falhas.has('magias') && <p>As magias não foram gravadas. Adicione na ficha.</p>}
                  {falhas.has('retrato') && <p>O retrato não foi salvo. Gere de novo na ficha.</p>}
                  {falhas.has('background') && <p>O Mestre não conseguiu reescrever sua história; usamos o seu texto.</p>}
                </div>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <section className="bg-[var(--muted)]/40 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <ScrollText size={14} className="text-[var(--primary)]" />
                    <span className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
                      Background final
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-modern leading-relaxed text-[var(--foreground)]">
                    {data.background_final}
                  </p>
                </section>

                {preview?.fala_personagem && (
                <section className="bg-[var(--muted)]/40 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-[var(--primary)]" />
                    <span className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
                      Primeiras palavras
                    </span>
                  </div>
                  <blockquote className="mt-3 border-l-2 border-[var(--primary)] pl-4 text-sm font-modern italic leading-relaxed text-[var(--foreground)]">
                    {preview.fala_personagem}
                  </blockquote>
                </section>
                )}

                {preview?.leitura_ficha && (
                <section className="bg-[var(--muted)]/40 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <BookOpen size={14} className="text-[var(--primary)]" />
                    <span className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
                      Leitura da ficha
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-modern leading-relaxed text-[var(--foreground)]">
                    {preview.leitura_ficha}
                  </p>
                </section>
                )}
              </div>

              <div className="space-y-4">
                {preview?.snapshot && (
                <section className="bg-[var(--muted)]/40 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-[var(--primary)]" />
                    <span className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
                      Snapshot final
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {ATRIBUTOS_LUNARIA.map(({ chave: key, abrev: label }) => (
                      <div key={key} className="rounded-xl border px-3 py-2 text-center border-[var(--border)] bg-[var(--muted)]/30">
                        <p className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">{label}</p>
                        <p className="mt-1 text-lg tabular-nums font-bold text-[var(--foreground)]">
                          {snapshot.atributos?.[key] ?? '-'}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(snapshot.vantagens || []).map((item) => (
                      <span key={`vant-${item.id || item.nome}`} className="bg-emerald-500/15 text-emerald-500 rounded-full px-3 py-1 text-[10px] font-modern font-semibold">
                        {item.nome}
                      </span>
                    ))}
                    {(snapshot.desvantagens || []).map((item) => (
                      <span key={`desv-${item.id || item.nome}`} className="bg-amber-400/20 text-amber-500 rounded-full px-3 py-1 text-[10px] font-modern font-semibold">
                        {item.nome}
                      </span>
                    ))}
                  </div>
                </section>
                )}

                {itensCombo.length > 0 && (
                <section className="bg-[var(--muted)]/40 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Swords size={14} className="text-[var(--primary)]" />
                      <span className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
                        Combo usado na criação
                      </span>
                    </div>
                    <span className="bg-[var(--primary)]/15 text-[var(--primary)] rounded-full px-3 py-1 text-[10px] font-modern font-semibold">
                      {itensCombo.length} itens
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {itensCombo.map((item, index) => (
                      <article key={`${item.grupo}-${item.id}-${index}`} className="rounded-2xl border p-4 border-[var(--border)] bg-[var(--muted)]/30">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-modern font-semibold ${item.badgeClass}`}>
                            {item.badge}
                          </span>
                          <span className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
                            {item.grupo}
                          </span>
                        </div>
                        <h4 className="mt-3 text-base font-fantasy font-bold text-[var(--foreground)]">{item.nome}</h4>
                        {item.motivo && (
                          <p className="mt-2 text-sm font-modern leading-relaxed text-[var(--muted-foreground)]">
                            {item.motivo}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onGoToCharacters}
                className={`btn-rpg-secondary cursor-pointer ${FOCO}`}
              >
                Ir para personagens
              </button>
              {isTresDet && (personagem.moedas ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => setLojaAberta(true)}
                  className={`flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-3 text-sm font-modern font-semibold text-amber-50 shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer ${FOCO}`}
                >
                  <ShoppingBag size={16} aria-hidden="true" />
                  Comprar Equipamentos
                </button>
              )}
              <button
                type="button"
                onClick={onViewSheet}
                className={`btn-rpg cursor-pointer ${FOCO}`}
              >
                Ver ficha
              </button>
            </div>

            {isTresDet && (
              <LojaMestreModal
                isOpen={lojaAberta}
                onClose={() => setLojaAberta(false)}
                personagemId={personagem.id ?? 0}
                moedas={personagem.moedas || 0}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WizardCreationResultModal;
