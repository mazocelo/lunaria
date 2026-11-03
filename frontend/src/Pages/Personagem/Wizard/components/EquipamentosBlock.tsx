import { useMemo } from 'react';
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  Shield,
  Sparkles,
} from 'lucide-react';
import { RARIDADE_CONFIG, FOCO } from '../../../../components/shared';
import type { RaridadeConfig } from '../../../../components/shared/catalogDetailHelpers';
import { lerItemCombo, type ItemCombo } from '../stages/itemCombo';
import { mensagemDeErro } from '../stages/mensagemDeErro';

interface ComboItem {
  id?: number | string;
  nome?: string;
  motivo?: string;
  [key: string]: unknown;
}

interface Combo {
  equipamentos?: ComboItem[];
  habilidades?: ComboItem[];
  magias?: ComboItem[];
}

interface EquipamentosData {
  combo?: Combo;
  /** Catálogo da mesma resposta do combo-preview: é dele que vêm raridade, tipo, dano, preço e peso. */
  catalogo_editavel?: { equipamentos?: Array<Record<string, unknown>> };
  meta?: Record<string, unknown>;
}

const semAcento = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Cores da raridade do catálogo compartilhado, casando nome sem acento/caixa ("raro" → "Raro"). */
function raridadeConfig(nome: string): RaridadeConfig | null {
  const chave = (Object.keys(RARIDADE_CONFIG) as Array<keyof typeof RARIDADE_CONFIG>).find((k) => semAcento(k) === semAcento(nome));
  return chave ? RARIDADE_CONFIG[chave] : null;
}

const fmtNumero = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

function detalhesDoItem(it: ItemCombo): Array<[string, string]> {
  const linhas: Array<[string, string]> = [];
  if (it.tipo) linhas.push(['Tipo', it.tipo]);
  if (it.dano) linhas.push(['Dano', it.dano]);
  if (it.preco != null) linhas.push(['Preço', fmtNumero(it.preco)]);
  if (it.peso != null) linhas.push(['Peso', fmtNumero(it.peso)]);
  return linhas;
}

const PERFIL_LABELS: Record<string, string> = {
  contido: 'Combo contido',
  equilibrado: 'Combo equilibrado',
  amplo: 'Combo amplo',
};

function buildItensAgrupados(combo: Combo = {}, catalogo: Array<Record<string, unknown>> = []) {
  const porId = new Map(catalogo.map((c) => [String(c.id), c]));
  const inventario = (combo.equipamentos || []).map((item) => ({
    ...item,
    // O nome e o motivo do combo valem sobre os do catálogo.
    dados: lerItemCombo({ ...(porId.get(String(item.id)) ?? {}), ...item }),
    barClass: 'border-[var(--primary)]/35',
  }));

  const recomendacoes = [
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

  return { inventario, recomendacoes };
}

interface EquipamentosBlockProps {
  data?: EquipamentosData | null;
  loading?: boolean;
  error?: string | null;
  tentativasUsadas?: number;
  onRegenerar?: () => void;
  onRetry?: () => void;
  isLight?: boolean;
}

const EquipamentosBlock = ({
  data,
  loading = false,
  error = null,
  tentativasUsadas = 0,
  onRegenerar,
  onRetry,
  isLight = false,
}: EquipamentosBlockProps) => {
  const { inventario, recomendacoes } = useMemo(() => buildItensAgrupados(data?.combo, data?.catalogo_editavel?.equipamentos), [data]);
  const meta = data?.meta || {};
  const tentativasRestantes = Math.max(0, 3 - tentativasUsadas);

  if (loading && !data) {
    return (
      <section className="border border-[var(--border)] bg-[var(--card)] rounded-xl p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="bg-[var(--primary)]/15 text-[var(--primary)] inline-flex h-11 w-11 items-center justify-center rounded-2xl">
            <Loader2 size={18} className="animate-spin" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-modern font-semibold text-[var(--muted-foreground)]">
              Arsenal do Mestre
            </p>
            <h3 className={`mt-2 text-2xl font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Montando o arsenal inicial
            </h3>
            <p className={`mt-2 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              O Mestre esta cruzando a build com os catalogos elegiveis para selecionar equipamentos e recomendacoes taticas.
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
                <Shield size={12} />
                Arsenal do Mestre
              </span>
              <span className="bg-emerald-500/15 text-emerald-500 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-modern font-semibold">
                <Sparkles size={12} />
                {PERFIL_LABELS[String(meta.perfil_combo ?? '')] || 'Combo equilibrado'}
              </span>
            </div>
            <h3 className={`mt-3 text-2xl font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Equipamentos e recomendacoes taticas
            </h3>
            <p className={`mt-2 max-w-3xl text-sm font-modern leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Equipamentos entram no inventario na criacao. Habilidades e magias sao recomendacoes de leitura do Mestre.
            </p>
          </div>

          <div className="bg-[var(--muted)]/40 flex shrink-0 flex-col gap-1 rounded-2xl px-4 py-3">
            <span className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
              Regeneracoes
            </span>
            <span className={`text-lg font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {tentativasUsadas}/3
            </span>
            <span className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-[var(--muted-foreground)]'}`}>
              {tentativasRestantes} restantes
            </span>
          </div>
        </div>

        {error && (
          <div role="alert" className="bg-[var(--muted)]/40 flex items-start gap-3 rounded-2xl border border-amber-500/30 px-4 py-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-modern font-semibold text-amber-500">
                Arsenal indisponivel
              </p>
              <p className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                {mensagemDeErro(error)}
              </p>
            </div>
            {onRetry && (
              <button
                type="button"
                disabled={loading}
                onClick={onRetry}
                className={`btn-rpg-secondary inline-flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${FOCO}`}
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Tentar de novo
              </button>
            )}
          </div>
        )}

        {/* Inventário — equipamentos que entram na criação */}
        <div className="bg-[var(--muted)]/40 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
                Inventario inicial
              </p>
              <p className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Estes equipamentos serao adicionados ao inventario na criacao.
              </p>
            </div>
            <span className="bg-amber-400/15 text-amber-600 rounded-full px-3 py-1 text-[10px] font-modern font-semibold">
              {inventario.length} itens
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {inventario.length === 0 && (
              <div className={`rounded-2xl border border-dashed p-4 text-sm font-modern ${isLight ? 'border-slate-300 text-slate-500' : 'border-[var(--border)] text-[var(--muted-foreground)]'}`}>
                Nenhum equipamento elegivel encontrado para esta build.
              </div>
            )}
            {inventario.map((item, index) => {
              const it = item.dados;
              const rar = it.raridade ? raridadeConfig(it.raridade) : null;
              const detalhes = detalhesDoItem(it);
              return (
                <article
                  key={`equip-${item.id}-${index}`}
                  className={`rounded-2xl border border-l-4 p-4 ${item.barClass} ${isLight ? 'bg-white/70' : 'bg-black/15'}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className={`text-base font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {it.nome}
                    </h4>
                    {it.raridade && (
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-modern font-semibold ${
                        rar ? (isLight ? rar.badgeLight : rar.badge) : 'border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]'
                      }`}>
                        {it.raridade}
                      </span>
                    )}
                  </div>
                  {detalhes.length > 0 && (
                    <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-modern">
                      {detalhes.map(([rotulo, valor]) => (
                        <div key={rotulo} className="flex gap-1">
                          <dt className="text-[var(--muted-foreground)]">{rotulo}</dt>
                          <dd className={`tabular-nums font-semibold ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>{valor}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {it.motivo && (
                    <p className={`mt-2 text-sm font-modern leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      {it.motivo}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        {/* Recomendações táticas — habilidades e magias */}
        {recomendacoes.length > 0 && (
          <div className="bg-[var(--muted)]/40 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
                  Recomendacoes taticas
                </p>
                <p className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Sugestoes do Mestre para habilidades e magias. Nao sao persistidas na criacao.
                </p>
              </div>
              <span className="bg-emerald-500/15 text-emerald-500 rounded-full px-3 py-1 text-[10px] font-modern font-semibold">
                {recomendacoes.length} sugestoes
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {recomendacoes.map((item, index) => (
                <article
                  key={`rec-${item.id}-${index}`}
                  className={`rounded-2xl border border-l-4 p-4 ${item.barClass} ${isLight ? 'bg-white/70' : 'bg-black/15'}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-modern font-semibold ${item.badgeClass}`}>
                      {item.badge}
                    </span>
                    <span className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
                      {item.grupo}
                    </span>
                  </div>
                  <h4 className={`mt-3 text-base font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {item.nome}
                  </h4>
                  {item.motivo && (
                    <p className={`mt-2 text-sm font-modern leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      {item.motivo}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Footer — ações */}
        <div className="border-t border-[var(--border)] pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
                Arsenal da build
              </p>
              <p className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Regenerar troca todo o combo. Para seguir, use o Continuar no rodapé.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={loading || tentativasUsadas >= 3 || !data}
                onClick={onRegenerar}
                className={`${FOCO} inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-modern font-semibold transition-all ${
                  loading || tentativasUsadas >= 3 || !data
                    ? 'cursor-not-allowed opacity-60'
                    : 'bg-[var(--muted)]/40 hover:-translate-y-0.5'
                }`}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                {loading ? 'Regenerando...' : `Regenerar combo (${tentativasRestantes})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EquipamentosBlock;
