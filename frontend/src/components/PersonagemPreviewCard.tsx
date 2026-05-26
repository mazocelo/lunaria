import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { useTheme } from '../contexts/theme';
import { Heart, Shield, Eye, EyeOff, Sparkles, User, AlertTriangle, SkipForward, CheckCircle2, Clock3, ShieldCheck, ScrollText } from 'lucide-react';
import WizardReadinessSeal from '../Pages/Personagem/Wizard/components/WizardReadinessSeal.jsx';
import { BONUS_ATTR_KEYS, parseRacaClasseBonus, somarBonusAtributos, type BonusMap } from '../utils/personagemBonus';

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
  destreza: { label: 'DES', color: 'bg-purple-500' },
  carisma: { label: 'CAR', color: 'bg-pink-500' },
};

const ATRIBUTOS_DEFAULT_SUM = 60;

function calcMod(val: number | string | null | undefined): number {
  const v = Number(val) || 10;
  return Math.floor((v - 10) / 2);
}

function calcHP(con: number | string | null | undefined, nivel: number, multRaca = 5): number {
  const mod = calcMod(con);
  return multRaca * (nivel + Math.max(1, mod));
}

interface BadgeProps {
  children: ReactNode;
  isLight: boolean;
}

const PendingBadge = ({ children, isLight }: BadgeProps) => (
  <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-modern ${
    isLight ? 'bg-purple-100 text-purple-600' : 'bg-purple-500/15 text-purple-400'
  }`}>
    <AlertTriangle size={10} />
    {children}
  </span>
);

const SkippedBadge = ({ children, isLight }: BadgeProps) => (
  <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-modern ${
    isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-700/30 text-slate-500'
  }`}>
    <SkipForward size={10} />
    {children}
  </span>
);

type ReadinessState = 'open' | 'shaping' | 'sealed';

interface ReadinessInput {
  pendingCount: number;
  bonusAplicados: boolean;
  nome?: string | null;
  raca?: string | number | null;
  classe?: string | number | null;
}

const getReadinessState = ({ pendingCount, bonusAplicados, nome, raca, classe }: ReadinessInput): ReadinessState => {
  if (!nome || !raca || !classe) return 'open';
  if (pendingCount > 0 || !bonusAplicados) return 'shaping';
  return 'sealed';
};

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
  variant?: 'default' | 'wizard';
  readinessState?: ReadinessState;
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
  variant = 'default',
  readinessState,
}: PersonagemPreviewCardProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [collapsed, setCollapsed] = useState(false);

  const racaObj = racasDisponiveis?.find(item => String(item.id) === String(raca));
  const classeObj = classesDisponiveis?.find(item => String(item.id) === String(classe));
  const racaNome = racaObj?.nome;
  const classeNome = classeObj?.nome;

  const racaBonus = parseRacaClasseBonus(racaObj?.bonus);
  const classeBonus = parseRacaClasseBonus(classeObj?.bonus);
  const temBonus = racaBonus || classeBonus;

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

  const hpEstimado = calcHP(atributosEfetivos.constituicao, 1, racaObj?.mult_raca ?? 5);

  const atributosPendentes = mostrarPendencias
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

  const pendingCount = [
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
      ? { label: 'Em montagem', icon: Clock3, className: isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/15 text-purple-300' }
      : { label: 'Pronto para fechar', icon: CheckCircle2, className: isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/15 text-emerald-300' };

  const finalReadinessState = readinessState || getReadinessState({ pendingCount, bonusAplicados, nome, raca, classe });

  const renderDefault = () => (
    <div className={`${isLight ? 'glass-light' : 'glass'} overflow-hidden rounded-2xl border ${
      isLight ? 'border-purple-300/20' : 'border-purple-500/20'
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
        <div className="relative flex aspect-[16/10] max-h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-purple-700/30 to-slate-800/50">
          {imagem ? <img src={imagem} alt={nome || 'Personagem'} className="h-full w-full object-cover" /> : <User size={44} className="text-purple-400/50" />}
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
            <h3 className={`truncate text-lg font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} ${mostrarPendencias && !nome ? (isLight ? 'text-purple-600' : 'text-purple-400') : ''}`}>
              {nome || 'Sem nome'}
            </h3>
            {mostrarPendencias && !nome && <div className="mt-1 flex justify-center"><PendingBadge isLight={isLight}>Nome pendente</PendingBadge></div>}
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              <span className={`rounded-full px-2 py-1 text-[11px] font-modern ${racaNome ? isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/15 text-purple-300' : isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'}`}>{racaNome || 'Linhagem pendente'}</span>
              <span className={`rounded-full px-2 py-1 text-[11px] font-modern ${classeNome ? isLight ? 'bg-purple-50 text-purple-600' : 'bg-purple-600/15 text-purple-200' : isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'}`}>{classeNome || 'Vocacao pendente'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Heart size={14} className="shrink-0 text-red-400" />
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-700/50">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400" />
            </div>
            <span className="shrink-0 text-[11px] font-mono text-slate-300">{hpEstimado}/{hpEstimado}</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Atributos finais</span>
              {mostrarPendencias && atributosPendentes && <PendingBadge isLight={isLight}>Distribuicao pendente</PendingBadge>}
            </div>
            {(Object.entries(ATTR_LABELS) as [AttrKey, AttrLabelConfig][]).map(([key, cfg]) => {
              const efetivo = atributosEfetivos[key];
              const bonusDisplay = mergedAttrBonus[key] || 0;
              const pct = Math.min(100, (efetivo / 20) * 100);
              const mod = calcMod(efetivo);
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className={`w-7 text-[10px] font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{cfg.label}</span>
                  <div className={`h-1.5 flex-1 rounded-full ${isLight ? 'bg-slate-200' : 'bg-slate-700/50'}`}>
                    <div className={`h-full rounded-full ${cfg.color} transition-all duration-300`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-right text-[10px] font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
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

  const renderWizard = () => (
    <div className="wa-readiness-panel wa-etched overflow-hidden rounded-[24px] border">
      <button
        onClick={() => setCollapsed(prev => !prev)}
        className={`flex w-full items-center justify-between border-b px-4 py-3 md:hidden cursor-pointer ${
          isLight ? 'border-slate-200 bg-white/40' : 'border-slate-700/50 bg-slate-950/30'
        }`}
      >
        <span className={`text-sm font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>Dossie do heroi</span>
        {collapsed ? <Eye size={16} className="text-slate-400" /> : <EyeOff size={16} className="text-slate-400" />}
      </button>

      <div className={`${collapsed ? 'hidden md:block' : ''}`}>
        <div className="border-b border-[var(--wa-border)] p-4">
          <div className={`rounded-[20px] border px-4 py-4 ${
            isLight
              ? 'border-slate-200/80 bg-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]'
              : 'border-[rgba(139,92,246,0.14)] bg-[linear-gradient(180deg,rgba(25,20,45,0.94),rgba(20,17,36,0.86))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className={`text-[10px] font-modern font-semibold uppercase tracking-[0.22em] ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
                  Dossie do heroi
                </p>
                <h3 className={`mt-2 break-words text-[1.95rem] font-fantasy font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {nome || 'Heroi sem nome'}
                </h3>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
                      Linhagem
                    </span>
                    <span className={`min-w-0 text-right text-sm font-modern ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {racaNome || 'Pendente'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
                      Vocacao
                    </span>
                    <span className={`min-w-0 text-right text-sm font-modern ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {classeNome || 'Pendente'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 pt-0.5">
                <WizardReadinessSeal readinessState={finalReadinessState} compact />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div className="wa-panel-soft rounded-2xl p-3">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck size={14} className="text-[var(--wa-accent)]" />
              <span className={`text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-600' : 'text-[var(--wa-muted)]'}`}>
                Integridade da ficha
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {mostrarPendencias && !nome && <PendingBadge isLight={isLight}>Nome</PendingBadge>}
              {mostrarPendencias && !raca && <PendingBadge isLight={isLight}>Linhagem</PendingBadge>}
              {mostrarPendencias && !classe && <PendingBadge isLight={isLight}>Vocacao</PendingBadge>}
              {mostrarPendencias && atributosPendentes && <PendingBadge isLight={isLight}>Atributos</PendingBadge>}
              {mostrarPendencias && !temVantagens && (skipVantagens ? <SkippedBadge isLight={isLight}>Dons pulados</SkippedBadge> : <PendingBadge isLight={isLight}>Dons</PendingBadge>)}
              {mostrarPendencias && !temDesvantagens && (skipDesvantagens ? <SkippedBadge isLight={isLight}>Marcas puladas</SkippedBadge> : <PendingBadge isLight={isLight}>Marcas</PendingBadge>)}
              {!mostrarPendencias && statusLabel && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-modern font-semibold ${statusLabel.className}`}>
                  <statusLabel.icon size={11} />
                  {statusLabel.label}
                </span>
              )}
            </div>
          </div>

          <div className="wa-panel-soft rounded-2xl p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Heart size={14} className="text-red-400" />
                <span className={`text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-600' : 'text-[var(--wa-muted)]'}`}>
                  Vital e atributos
                </span>
              </div>
              <span className={`text-xs font-mono ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{hpEstimado} HP</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(ATTR_LABELS) as [AttrKey, AttrLabelConfig][]).map(([key, cfg]) => {
                const efetivo = atributosEfetivos[key];
                const bonusDisplay = mergedAttrBonus[key] || 0;
                const mod = calcMod(efetivo);
                return (
                  <div key={key} className={`rounded-xl border px-3 py-2 ${isLight ? 'border-slate-200 bg-white/75' : 'border-slate-700/50 bg-slate-900/55'}`}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{cfg.label}</span>
                      <span className={`text-[10px] font-mono ${mod >= 0 ? 'text-green-400' : 'text-red-400'}`}>{mod >= 0 ? '+' : ''}{mod}</span>
                    </div>
                    <div className={`text-lg font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{efetivo}</div>
                    {bonusDisplay !== 0 && <div className={`text-[10px] font-mono ${bonusDisplay > 0 ? 'text-green-400' : 'text-red-400'}`}>{bonusDisplay > 0 ? '+' : ''}{bonusDisplay} de bonus</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {temBonus && (
            <div className="wa-panel-soft rounded-2xl p-3">
              <div className="mb-2 flex items-center gap-2">
                <Shield size={14} className="text-[var(--wa-accent)]" />
                <span className={`text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-600' : 'text-[var(--wa-muted)]'}`}>
                  Bonus ativos
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {racaBonus && Object.entries(racaBonus).filter(([, value]) => typeof value === 'string' || typeof value === 'number').map(([key, value]) => (
                  <span key={`r-${key}`} className="wa-forge-chip rounded-full px-2 py-1 text-[10px] font-modern font-semibold">
                    {key.replace(/_/g, ' ')} {Number(value) >= 0 ? '+' : ''}{value}
                  </span>
                ))}
                {classeBonus && Object.entries(classeBonus).filter(([, value]) => typeof value === 'string' || typeof value === 'number').map(([key, value]) => (
                  <span key={`c-${key}`} className="wa-forge-chip rounded-full px-2 py-1 text-[10px] font-modern font-semibold">
                    {key.replace(/_/g, ' ')} {Number(value) >= 0 ? '+' : ''}{value}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="wa-panel-soft rounded-2xl p-3">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles size={14} className="text-[var(--wa-accent)]" />
              <span className={`text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-600' : 'text-[var(--wa-muted)]'}`}>
                Tracos atuais
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {vantagensNomes.map((item, index) => (
                <span key={`${item.nome}-${index}`} className={`rounded-full px-2 py-1 text-[10px] font-modern ${item.isDesvantagem ? 'wa-warning-chip' : 'wa-teal-chip'}`}>
                  {item.nome}
                </span>
              ))}
              {mostrarPendencias && !temVantagens && (skipVantagens ? <SkippedBadge isLight={isLight}>Dons pulados</SkippedBadge> : <PendingBadge isLight={isLight}>Dons pendentes</PendingBadge>)}
              {mostrarPendencias && !temDesvantagens && (skipDesvantagens ? <SkippedBadge isLight={isLight}>Marcas puladas</SkippedBadge> : <PendingBadge isLight={isLight}>Marcas pendentes</PendingBadge>)}
            </div>
          </div>

          <div className="wa-panel-soft rounded-2xl p-3">
            <div className="mb-2 flex items-center gap-2">
              <ScrollText size={14} className="text-[var(--wa-accent)]" />
              <span className={`text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-600' : 'text-[var(--wa-muted)]'}`}>
                Assinatura da forja
              </span>
            </div>
            <p className={`text-sm font-modern leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              {finalReadinessState === 'sealed'
                ? 'A ficha esta coerente, os tracos foram assentados e o personagem esta pronto para entrar em jogo.'
                : finalReadinessState === 'shaping'
                  ? 'A estrutura principal ja existe, mas ainda ha detalhes da build para selar.'
                  : 'O personagem ainda esta em fase de esboco. Fixe identidade, custos e atributos para concluir a forja.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return variant === 'wizard' ? renderWizard() : renderDefault();
};

export default PersonagemPreviewCard;



