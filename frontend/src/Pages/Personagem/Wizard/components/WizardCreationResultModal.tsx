import { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Shield, Sparkles, ScrollText, Swords, ShoppingBag } from 'lucide-react';
import LojaMestreModal from '../../../../components/LojaMestreModal';

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
}

const ATTR_LABELS: Record<string, string> = {
  forca: 'FOR',
  destreza: 'DES',
  constituicao: 'CON',
  inteligencia: 'INT',
  agilidade: 'AGI',
  carisma: 'CAR',
};

function buildItensCombo(combo: PreviewCombo = {}): ComboItemEnriched[] {
  return [
    ...(combo.equipamentos || []).map((item) => ({ ...item, grupo: 'Equipamento', badge: 'Inventario', badgeClass: 'wa-forge-chip' })),
    ...(combo.habilidades || []).map((item) => ({ ...item, grupo: 'Habilidade', badge: 'Recomendacao', badgeClass: 'wa-teal-chip' })),
    ...(combo.magias || []).map((item) => ({ ...item, grupo: 'Magia', badge: 'Recomendacao', badgeClass: 'wa-accent-chip' })),
  ];
}

interface WizardCreationResultModalProps {
  open?: boolean;
  data?: ResultadoData | null;
  onViewSheet: () => void;
  onGoToCharacters: () => void;
  isLight?: boolean;
}

const WizardCreationResultModal = ({
  open = false,
  data,
  onViewSheet,
  onGoToCharacters,
  isLight = false,
}: WizardCreationResultModalProps) => {
  const itensCombo = useMemo(() => buildItensCombo(data?.preview?.combo), [data]);
  const [lojaAberta, setLojaAberta] = useState(false);

  if (!open || !data) return null;

  const snapshot = data.preview?.snapshot || {};
  const personagem = data.personagem || {};
  const isTresDet = personagem.sistema === 'tresdet';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/72 px-4 py-6 backdrop-blur-md">
      <div className="wizard-atelier wa-main-shell relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[32px] border">
        <div className="max-h-[92vh] overflow-y-auto p-5 md:p-7">
          <div className="flex flex-col gap-5">
            <div className="wa-stage-enter wa-stagger-1 flex flex-col gap-4 border-b border-[var(--wa-border)] pb-5 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="wa-teal-chip inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em]">
                  <CheckCircle2 size={12} />
                  Personagem criado com sucesso
                </span>
                <h2 className={`mt-3 text-3xl font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {personagem.nome || snapshot.nome || 'Personagem criado'}
                </h2>
                <p className={`mt-2 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {[snapshot.raca, snapshot.classe].filter(Boolean).join(' • ')}
                </p>
              </div>

              <div className="wa-panel-soft rounded-2xl px-4 py-3">
                <p className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
                  Registro final
                </p>
                <p className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                  O background foi finalizado e a resolutiva do Mestre foi anexada ao fechamento da ficha.
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <section className="wa-panel-soft wa-stage-enter wa-stagger-2 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <ScrollText size={14} className="text-[var(--wa-accent)]" />
                    <span className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
                      Background final
                    </span>
                    {data.background_indisponivel && (
                      <span className="wa-ember-chip ml-auto rounded-full px-2.5 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em]">
                        Fallback local
                      </span>
                    )}
                  </div>
                  <p className={`mt-3 text-sm font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                    {data.background_final}
                  </p>
                </section>

                <section className="wa-panel-soft wa-stage-enter wa-stagger-3 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-[var(--wa-accent)]" />
                    <span className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
                      Primeiras palavras
                    </span>
                  </div>
                  <blockquote className={`mt-3 border-l-2 border-[var(--wa-accent)] pl-4 text-sm font-modern italic leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                    {data.preview?.fala_personagem}
                  </blockquote>
                </section>

                <section className="wa-panel-soft wa-stage-enter wa-stagger-4 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <BookOpen size={14} className="text-[var(--wa-accent)]" />
                    <span className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
                      Leitura da ficha
                    </span>
                  </div>
                  <p className={`mt-3 text-sm font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                    {data.preview?.leitura_ficha}
                  </p>
                </section>
              </div>

              <div className="space-y-4">
                <section className="wa-panel-soft wa-stage-enter wa-stagger-2 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-[var(--wa-accent)]" />
                    <span className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
                      Snapshot final
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {Object.entries(ATTR_LABELS).map(([key, label]) => (
                      <div key={key} className={`rounded-xl border px-3 py-2 text-center ${isLight ? 'border-slate-200 bg-white/70' : 'border-[var(--wa-border)] bg-black/15'}`}>
                        <p className="text-[10px] font-modern font-semibold uppercase tracking-[0.16em] text-[var(--wa-muted)]">{label}</p>
                        <p className={`mt-1 text-lg font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {snapshot.atributos?.[key] ?? '-'}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(snapshot.vantagens || []).map((item) => (
                      <span key={`vant-${item.id || item.nome}`} className="wa-teal-chip rounded-full px-3 py-1 text-[10px] font-modern font-semibold">
                        {item.nome}
                      </span>
                    ))}
                    {(snapshot.desvantagens || []).map((item) => (
                      <span key={`desv-${item.id || item.nome}`} className="wa-ember-chip rounded-full px-3 py-1 text-[10px] font-modern font-semibold">
                        {item.nome}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="wa-panel-soft wa-stage-enter wa-stagger-3 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Swords size={14} className="text-[var(--wa-accent)]" />
                      <span className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
                        Combo usado na criacao
                      </span>
                    </div>
                    <span className="wa-accent-chip rounded-full px-3 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em]">
                      {itensCombo.length} itens
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {itensCombo.map((item, index) => (
                      <article key={`${item.grupo}-${item.id}-${index}`} className={`rounded-2xl border p-4 ${isLight ? 'border-slate-200 bg-white/70' : 'border-[var(--wa-border)] bg-black/15'}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${item.badgeClass}`}>
                            {item.badge}
                          </span>
                          <span className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
                            {item.grupo}
                          </span>
                        </div>
                        <h4 className={`mt-3 text-base font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.nome}</h4>
                        {item.motivo && (
                          <p className={`mt-2 text-sm font-modern leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                            {item.motivo}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            <div className="wa-stage-enter wa-stagger-4 flex flex-col gap-3 border-t border-[var(--wa-border)] pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onGoToCharacters}
                className="wa-panel-soft rounded-2xl px-5 py-3 text-sm font-modern font-semibold transition-all hover:-translate-y-0.5"
              >
                Ir para personagens
              </button>
              {isTresDet && (personagem.moedas ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => setLojaAberta(true)}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-500 px-5 py-3 text-sm font-modern font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5"
                >
                  <ShoppingBag size={16} />
                  Comprar Equipamentos
                </button>
              )}
              <button
                type="button"
                onClick={onViewSheet}
                className="rounded-2xl bg-gradient-to-br from-[var(--wa-accent)] to-[var(--wa-teal)] px-5 py-3 text-sm font-modern font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5"
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
