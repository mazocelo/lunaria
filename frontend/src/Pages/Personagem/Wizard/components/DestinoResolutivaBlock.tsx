import { useMemo } from 'react';
import { FOCO } from '../../../../components/shared';
import { ATRIBUTOS_LUNARIA } from '../stages/atributos';
import { mensagemDeErro } from '../stages/mensagemDeErro';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ImageIcon,
  Loader2,
  RefreshCw,
  ScrollText,
  Shield,
  Sparkles,
  Swords,
} from 'lucide-react';

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
  barClass: string;
}

interface Combo {
  equipamentos?: ComboItem[];
  habilidades?: ComboItem[];
  magias?: ComboItem[];
}

interface Snapshot {
  nome?: string;
  raca?: string;
  classe?: string;
  atributos?: Record<string, number>;
  vantagens?: Array<{ id?: number | string; nome?: string }>;
  desvantagens?: Array<{ id?: number | string; nome?: string }>;
}

interface Meta {
  perfil?: string;
  [key: string]: unknown;
}

interface ResolutivaData {
  combo?: Combo;
  snapshot?: Snapshot;
  meta?: Meta;
  fala_personagem?: string;
  leitura_ficha?: string;
}

const PERFIL_LABELS: Record<string, string> = {
  contido: 'Combo contido',
  equilibrado: 'Combo equilibrado',
  amplo: 'Combo amplo',
};

function buildItensCombo(combo: Combo = {}): ComboItemEnriched[] {
  return [
    ...(combo.equipamentos || []).map((item) => ({
      ...item,
      grupo: 'Equipamento',
      badge: 'Inventario',
      badgeClass: 'bg-amber-400/15 text-amber-600',
      barClass: 'border-[var(--primary)]/35',
    })),
    ...(combo.habilidades || []).map((item) => ({
      ...item,
      grupo: 'Habilidade',
      badge: 'Recomendacao',
      badgeClass: 'bg-emerald-500/15 text-emerald-500',
      barClass: 'border-emerald-500/35',
    })),
    ...(combo.magias || []).map((item) => ({
      ...item,
      grupo: 'Magia',
      badge: 'Recomendacao',
      badgeClass: 'bg-[var(--primary)]/15 text-[var(--primary)]',
      barClass: 'border-[var(--primary)]/35',
    })),
  ];
}

interface DestinoResolutivaBlockProps {
  data?: ResolutivaData | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  imageUrl?: string | null;
  imageLoading?: boolean;
  imageError?: string | null;
  onGerarImagem?: () => void;
  /** Mantido por compatibilidade com quem passa o tema; as cores vêm dos tokens. */
  isLight?: boolean;
}

const DestinoResolutivaBlock = ({
  data,
  loading = false,
  error = null,
  onRetry,
  imageUrl = null,
  imageLoading = false,
  imageError = null,
  onGerarImagem,
}: DestinoResolutivaBlockProps) => {
  const itensCombo = useMemo(() => buildItensCombo(data?.combo), [data]);
  const snapshot = data?.snapshot || {};
  const meta = data?.meta || {};
  if (loading && !data) {
    return (
      <section className="border border-[var(--border)] bg-[var(--card)] rounded-xl p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="bg-[var(--primary)]/15 text-[var(--primary)] inline-flex h-11 w-11 items-center justify-center rounded-2xl">
            <Loader2 size={18} className="animate-spin" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-modern font-semibold text-[var(--muted-foreground)]">
              Resolutiva do Mestre
            </p>
            <h3 className="mt-2 text-2xl font-fantasy font-bold text-[var(--foreground)]">
              Selando o destino da ficha
            </h3>
            <p className="mt-2 text-sm font-modern text-[var(--muted-foreground)]">
              O Mestre esta cruzando a build, o saldo de criacao e os catalogos elegiveis para montar um combo final coerente.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border border-[var(--border)] bg-[var(--card)] rounded-xl p-5 md:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[var(--primary)]/15 text-[var(--primary)] inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-modern font-semibold">
                <Sparkles size={12} />
                Resolutiva do Mestre
              </span>
              <span className="bg-emerald-500/15 text-emerald-500 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-modern font-semibold">
                <Shield size={12} />
                {PERFIL_LABELS[String(meta.perfil_combo ?? '')] || 'Combo equilibrado'}
              </span>
            </div>
            <h3 className="mt-3 text-2xl font-fantasy font-bold text-[var(--foreground)]">
              Esta e a leitura final usada para selar a ficha
            </h3>
            <p className="mt-2 max-w-3xl text-sm font-modern leading-relaxed text-[var(--muted-foreground)]">
              O combo abaixo nasce da sua build atual. Equipamentos entram na criacao; habilidades e magias continuam como recomendacao de leitura e postura.
            </p>
          </div>

        </div>

        {error && (
          <div role="alert" className="bg-[var(--muted)]/40 flex items-start gap-3 rounded-2xl border border-amber-500/30 px-4 py-3">
            <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-amber-500" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-modern font-semibold text-amber-600 dark:text-amber-400">
                Resolutiva indisponível
              </p>
              <p className="mt-1 text-sm font-modern text-[var(--foreground)]">
                {mensagemDeErro(error)}
              </p>
            </div>
            {onRetry && (
              <button
                type="button"
                disabled={loading}
                onClick={onRetry}
                className={`bg-[var(--muted)]/40 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-modern font-semibold text-[var(--foreground)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${FOCO}`}
              >
                {loading ? <Loader2 size={12} aria-hidden="true" className="animate-spin" /> : <RefreshCw size={12} aria-hidden="true" />}
                Tentar de novo
              </button>
            )}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="bg-[var(--muted)]/40 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[var(--primary)]" />
                <span className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
                  Resumo da ficha
                </span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">Nome</p>
                  <p className="mt-1 text-base font-fantasy font-bold text-[var(--foreground)]">{snapshot.nome || 'Sem nome'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">Leitura base</p>
                  <p className="mt-1 text-sm font-modern text-[var(--foreground)]">
                    {[snapshot.raca, snapshot.classe].filter(Boolean).join(' • ')}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="bg-amber-400/15 text-amber-600 rounded-full px-3 py-1 text-[11px] font-modern font-semibold">
                  Saldo de criacao {String(meta.pontos_restantes ?? 0)}
                </span>
                <span className="bg-[var(--primary)]/15 text-[var(--primary)] rounded-full px-3 py-1 text-[11px] font-modern font-semibold">
                  Nivel {String(meta.nivel ?? 1)}
                </span>
                <span className="bg-emerald-500/15 text-emerald-500 rounded-full px-3 py-1 text-[11px] font-modern font-semibold">
                  Tier {String(meta.tier ?? 1)}
                </span>
              </div>
            </div>

            <div className="bg-[var(--muted)]/40 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <ScrollText size={14} className="text-[var(--primary)]" />
                <span className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
                  Primeiras palavras
                </span>
              </div>
              <blockquote className="mt-3 border-l-2 border-[var(--primary)] pl-4 text-sm font-modern italic leading-relaxed text-[var(--foreground)]">
                {data?.fala_personagem || 'A fala do personagem ainda esta sendo preparada.'}
              </blockquote>
            </div>

            <div className="bg-[var(--muted)]/40 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[var(--primary)]" />
                <span className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
                  Leitura da ficha
                </span>
              </div>
              <p className="mt-3 text-sm font-modern leading-relaxed text-[var(--foreground)]">
                {data?.leitura_ficha || 'Leitura da build indisponivel.'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[var(--muted)]/40 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <Swords size={14} className="text-[var(--primary)]" />
                <span className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
                  Atributos finais
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
            </div>

            <div className="bg-[var(--muted)]/40 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
                    Combo unificado
                  </p>
                  <p className="mt-1 text-sm font-modern text-[var(--muted-foreground)]">
                    Um unico pacote final para entrar no mundo.
                  </p>
                </div>
                <span className="bg-[var(--primary)]/15 text-[var(--primary)] rounded-full px-3 py-1 text-[10px] font-modern font-semibold">
                  {itensCombo.length} itens
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {itensCombo.length === 0 && (
                  <div className="rounded-2xl border border-dashed p-4 text-sm font-modern border-[var(--border)] text-[var(--muted-foreground)]">
                    Nenhum item elegivel foi encontrado para esta leitura.
                  </div>
                )}

                {itensCombo.map((item, index) => (
                  <article
                    key={`${item.grupo}-${item.id}-${index}`}
                    className={`rounded-2xl border border-l-4 p-4 ${item.barClass} bg-[var(--muted)]/30`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-modern font-semibold ${item.badgeClass}`}>
                        {item.badge}
                      </span>
                      <span className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
                        {item.grupo}
                      </span>
                    </div>
                    <h4 className="mt-3 text-base font-fantasy font-bold text-[var(--foreground)]">
                      {item.nome}
                    </h4>
                    {item.motivo && (
                      <p className="mt-2 text-sm font-modern leading-relaxed text-[var(--muted-foreground)]">
                        {item.motivo}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] rounded-xl p-4 md:p-5">
          <div className="bg-[var(--primary)]/15 text-[var(--primary)] inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-modern font-semibold">
            <ImageIcon size={11} />
            Retrato do heroi
          </div>

          {imageUrl ? (
            <div className="mt-3 flex justify-center">
              <img src={imageUrl} alt={snapshot.nome || 'Retrato'} className="w-48 h-48 rounded-2xl object-cover border-2 border-[var(--primary)]/30 shadow-lg" />
            </div>
          ) : (
            <div className="mt-3">
              {imageLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
                  <span role="status" className="ml-3 text-sm font-modern text-[var(--muted-foreground)]">Gerando retrato...</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onGerarImagem}
                  disabled={imageLoading}
                  className={`bg-[var(--muted)]/40 w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-modern font-medium text-[var(--foreground)] transition-all hover:-translate-y-0.5 cursor-pointer ${FOCO}`}
                >
                  <Sparkles size={15} className="text-amber-500" />
                  Gerar retrato do personagem
                </button>
              )}
              {imageError && (
                <div role="alert" className="mt-2 flex flex-wrap items-center justify-center gap-2 font-modern text-xs text-red-600 dark:text-red-400">
                  <span>{mensagemDeErro(imageError)}</span>
                  {onGerarImagem && (
                    <button type="button" onClick={onGerarImagem} className={`font-semibold underline-offset-2 hover:underline cursor-pointer ${FOCO}`}>
                      Tentar de novo
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-[var(--border)] pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
                Pronto para a aventura?
              </p>
              <p className="mt-1 text-sm font-modern text-[var(--muted-foreground)]">
                Criar (no rodapé) usa este combo exatamente como ele está agora. Volte ao Arsenal para regenerar.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default DestinoResolutivaBlock;
