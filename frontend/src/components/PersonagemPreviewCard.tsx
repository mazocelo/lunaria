import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { useTheme } from '../contexts/theme';
import { Heart, Eye, EyeOff, User, AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react';
import { BONUS_ATTR_KEYS, parseRacaClasseBonus, somarBonusAtributos, type BonusMap } from '../utils/personagemBonus';
import { pvEstimado, siglasDaFaixa } from '../Pages/Personagem/Wizard/stages/atributos';
import type { Pendencia } from '../Pages/Personagem/Wizard/stages/pendencias';

type AttrKey = 'forca' | 'inteligencia' | 'constituicao' | 'agilidade' | 'destreza' | 'carisma';

interface AttrLabelConfig {
  label: string;
  color: string;
}

const ATTR_LABELS: Record<AttrKey, AttrLabelConfig> = {
  forca: { label: 'FOR', color: 'bg-red-500' },
  inteligencia: { label: 'INT', color: 'bg-blue-500' },
  constituicao: { label: 'CON', color: 'bg-green-500' },
  agilidade: { label: 'AGI', color: 'bg-yellow-500' },
  destreza: { label: 'DES', color: 'bg-cyan-500' },
  carisma: { label: 'CAR', color: 'bg-pink-500' },
};

const ATRIBUTOS_DEFAULT_SUM = 60;

function calcMod(val: number | string | null | undefined): number {
  const v = Number(val) || 10;
  return Math.floor((v - 10) / 2);
}

interface BadgeProps {
  children: ReactNode;
  isLight: boolean;
}

const PendingBadge = ({ children }: BadgeProps) => (
  <span className="inline-flex items-center gap-1 rounded bg-[var(--primary)]/15 px-1.5 py-0.5 text-[10px] font-modern text-[var(--primary)]">
    <AlertTriangle size={10} />
    {children}
  </span>
);

interface RacaClasseOption {
  id: number | string;
  nome?: string | null;
  bonus?: unknown;
  mult_raca?: number | null;
}

interface VantagemOption {
  id: number | string;
  nome: string;
  custo?: number | null;
}

interface PersonagemPreviewCardProps {
  nome?: string | null;
  raca?: string | number | null;
  classe?: string | number | null;
  atributos?: Partial<Record<AttrKey, number | string>>;
  vantagensSelecionadas?: Array<string | number>;
  vantagensDisponiveis?: VantagemOption[];
  racasDisponiveis?: RacaClasseOption[];
  classesDisponiveis?: RacaClasseOption[];
  imagem?: string | null;
  bonusJaAplicado?: boolean;
  mostrarPendencias?: boolean;
  bonusAplicados?: boolean;
  skipVantagens?: boolean;
  skipDesvantagens?: boolean;
  /** D&D 5e: sem PV estimado, atributos FOR..CAR de `atributosDnd` (N-07). Padrão: Lunaria. */
  sistema?: 'lunaria' | 'dnd5e';
  /** Texto da etapa Background (L-01), resumido em 2 linhas. */
  background?: string;
  /** Lista "Antes de criar" (wizard): quando vem, decide o status no lugar da contagem própria. */
  pendencias?: Pendencia[];
  /** D&D 5e: valores a exibir por sigla (STR..CHA); null = ainda não atribuído. */
  atributosDnd?: Record<string, number | null>;
}

const PersonagemPreviewCard = ({
  nome,
  raca,
  classe,
  atributos = {},
  vantagensSelecionadas,
  vantagensDisponiveis,
  racasDisponiveis,
  classesDisponiveis,
  imagem,
  bonusJaAplicado = false,
  mostrarPendencias = false,
  bonusAplicados = false,
  skipVantagens = false,
  skipDesvantagens = false,
  sistema = 'lunaria',
  background,
  pendencias,
  atributosDnd = {},
}: PersonagemPreviewCardProps) => {
  const isDnd = sistema === 'dnd5e';
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [collapsed, setCollapsed] = useState(false);

  const racaObj = racasDisponiveis?.find(item => String(item.id) === String(raca));
  const classeObj = classesDisponiveis?.find(item => String(item.id) === String(classe));
  const racaNome = racaObj?.nome;
  const classeNome = classeObj?.nome;

  const racaBonus = parseRacaClasseBonus(racaObj?.bonus);
  const classeBonus = parseRacaClasseBonus(classeObj?.bonus);

  const mergedAttrBonus = useMemo<BonusMap>(() => {
    const selecionados = (vantagensSelecionadas || [])
      .map((id) => (vantagensDisponiveis || []).find((item) => String(item.id) === String(id)))
      .filter((item): item is VantagemOption => Boolean(item));
    const tracosBonus = somarBonusAtributos(selecionados, BONUS_ATTR_KEYS) as BonusMap;

    const merged: BonusMap = {};
    for (const key of Object.keys(ATTR_LABELS) as AttrKey[]) {
      const bonus = (Number(racaBonus?.[key]) || 0) + (Number(classeBonus?.[key]) || 0) + (Number(tracosBonus[key]) || 0);
      if (bonus !== 0) merged[key] = bonus;
    }
    return merged;
  }, [racaBonus, classeBonus, vantagensSelecionadas, vantagensDisponiveis]);

  const atributosEfetivos = useMemo<Record<AttrKey, number>>(() => {
    const result = {} as Record<AttrKey, number>;
    for (const key of Object.keys(ATTR_LABELS) as AttrKey[]) {
      result[key] = bonusJaAplicado
        ? Number(atributos[key]) || 0
        : (Number(atributos[key]) || 0) + (mergedAttrBonus[key] || 0);
    }
    return result;
  }, [atributos, bonusJaAplicado, mergedAttrBonus]);

  const hpEstimado = pvEstimado(atributosEfetivos.constituicao || 10, racaObj?.mult_raca);

  const atributosPendentes = pendencias
    ? pendencias.some((p) => p.etapa === 'atributos')
    : mostrarPendencias
    ? !bonusAplicados
    : Object.values(atributos || {}).map((v) => Number(v) || 0).reduce((acc, curr) => acc + curr, 0) === ATRIBUTOS_DEFAULT_SUM;

  type VantagemEntry = { nome: string; isDesvantagem: boolean; custo: number | null | undefined };
  const vantagensNomes: VantagemEntry[] = (vantagensSelecionadas || []).map((id) => {
    const item = vantagensDisponiveis?.find((v) => String(v.id) === String(id));
    if (!item) return null;
    return {
      nome: item.nome,
      isDesvantagem: item.custo != null && item.custo < 0,
      custo: item.custo,
    };
  }).filter((entry): entry is VantagemEntry => Boolean(entry));

  const temVantagens = vantagensNomes.some((item) => !item.isDesvantagem);
  const temDesvantagens = vantagensNomes.some((item) => item.isDesvantagem);

  const pendingCount = pendencias ? pendencias.length : [
    mostrarPendencias && !nome,
    mostrarPendencias && !raca,
    mostrarPendencias && !classe,
    mostrarPendencias && atributosPendentes,
    mostrarPendencias && !temVantagens && !skipVantagens,
    mostrarPendencias && !temDesvantagens && !skipDesvantagens,
  ].filter(Boolean).length;

  type StatusLabel = { label: string; icon: ComponentType<{ size?: number }>; className: string };
  const statusLabel: StatusLabel | null = !mostrarPendencias
    ? null
    : pendingCount > 0
      ? { label: 'Em montagem', icon: Clock3, className: 'bg-[var(--primary)]/15 text-[var(--primary)]' }
      : { label: pendencias ? 'Pronto para criar' : 'Pronto para fechar', icon: CheckCircle2, className: isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/15 text-emerald-300' };

  const renderDefault = () => (
    <div className={`${isLight ? 'glass-light' : 'glass'} overflow-hidden rounded-2xl border ${
      'border-[var(--border)]'
    }`}>
      <button
        onClick={() => setCollapsed(prev => !prev)}
        className={`flex w-full items-center justify-between px-4 py-3 md:hidden cursor-pointer ${
          isLight ? 'hover:bg-slate-100/50' : 'hover:bg-slate-700/30'
        }`}
      >
        <span className={`text-sm font-fantasy font-bold ${isLight ? 'text-slate-700' : 'text-white'}`}>Ficha do heroi</span>
        {collapsed ? <Eye size={16} className="text-slate-400" /> : <EyeOff size={16} className="text-slate-400" />}
      </button>

      <div className={`${collapsed ? 'hidden md:block' : ''}`}>
        <div className="relative flex aspect-[16/10] max-h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--primary)]/30 to-slate-800/50">
          {imagem ? <img src={imagem} alt={nome || 'Personagem'} className="h-full w-full object-cover" /> : <User size={44} className="text-[var(--primary)]/50" />}
          {statusLabel && (
            <div className="absolute left-3 top-3">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-modern font-semibold ${statusLabel.className}`}>
                <statusLabel.icon size={11} />
                {statusLabel.label}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-4 p-4">
          <div className="text-center">
            <h3 className={`truncate text-lg font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} ${mostrarPendencias && !nome ? 'text-[var(--primary)]' : ''}`}>
              {nome || 'Sem nome'}
            </h3>
            {mostrarPendencias && !nome && <div className="mt-1 flex justify-center"><PendingBadge isLight={isLight}>Nome pendente</PendingBadge></div>}
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              <span className={`rounded-full px-2 py-1 text-[11px] font-modern ${racaNome ? 'bg-[var(--primary)]/15 text-[var(--primary)]' : isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'}`}>{racaNome || 'Linhagem pendente'}</span>
              <span className={`rounded-full px-2 py-1 text-[11px] font-modern ${classeNome ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'}`}>{classeNome || 'Vocacao pendente'}</span>
            </div>
          </div>

          {!isDnd && (
          <div className="flex items-center gap-2">
            <Heart size={14} className="shrink-0 text-red-400" />
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-700/50">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400" />
            </div>
            <span className="shrink-0 text-[11px] font-modern tabular-nums text-slate-300">{hpEstimado}/{hpEstimado}</span>
          </div>
          )}

          {background?.trim() && (
            <div>
              <span className="font-modern text-xs font-semibold text-[var(--muted-foreground)]">Background</span>
              <p className="line-clamp-2 font-modern text-xs text-[var(--foreground)]">{background}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xs font-modern font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Atributos finais</span>
              {mostrarPendencias && atributosPendentes && <PendingBadge isLight={isLight}>Distribuicao pendente</PendingBadge>}
            </div>
            {isDnd && siglasDaFaixa('dnd5e', {}, atributosDnd).map(({ sigla, valor }) => {
              const mod = valor == null ? null : calcMod(valor);
              return (
                <div key={sigla} className="flex items-center gap-2">
                  <span className="w-7 font-modern text-[10px] text-[var(--muted-foreground)]">{sigla}</span>
                  <div className="h-1.5 flex-1 rounded-full bg-[var(--muted)]">
                    <div className="h-full rounded-full bg-[var(--primary)] transition-all duration-300" style={{ width: `${Math.min(100, ((valor ?? 0) / 20) * 100)}%` }} />
                  </div>
                  <span className="text-right font-modern text-[10px] tabular-nums text-[var(--muted-foreground)]">
                    {valor ?? '—'}
                    {mod != null && <span className={mod >= 0 ? ' text-emerald-600 dark:text-emerald-400' : ' text-red-600 dark:text-red-400'}>{` ${mod >= 0 ? '+' : ''}${mod}`}</span>}
                  </span>
                </div>
              );
            })}
            {!isDnd && (Object.entries(ATTR_LABELS) as [AttrKey, AttrLabelConfig][]).map(([key, cfg]) => {
              const efetivo = atributosEfetivos[key];
              const bonusDisplay = mergedAttrBonus[key] || 0;
              const pct = Math.min(100, (efetivo / 20) * 100);
              const mod = calcMod(efetivo);
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className={`w-7 text-[10px] font-modern tabular-nums ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{cfg.label}</span>
                  <div className={`h-1.5 flex-1 rounded-full ${isLight ? 'bg-slate-200' : 'bg-slate-700/50'}`}>
                    <div className={`h-full rounded-full ${cfg.color} transition-all duration-300`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-right text-[10px] font-modern tabular-nums ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {efetivo || '-'}
                    {bonusDisplay !== 0 && <span className={bonusDisplay > 0 ? 'text-green-400' : 'text-red-400'}>{` (${bonusDisplay > 0 ? '+' : ''}${bonusDisplay})`}</span>}{' '}
                    <span className={mod >= 0 ? 'text-green-400/70' : 'text-red-400/70'}>{mod >= 0 ? '+' : ''}{mod}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return renderDefault();
};

export default PersonagemPreviewCard;



