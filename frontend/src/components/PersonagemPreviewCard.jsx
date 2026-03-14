import React, { useMemo, useState } from 'react';
import { useTheme } from '../contexts/theme.jsx';
import { Heart, Shield, Eye, EyeOff, Sparkles, User, AlertTriangle, SkipForward, CheckCircle2, Clock3, ShieldCheck, ScrollText } from 'lucide-react';
import WizardReadinessSeal from '../Pages/Personagem/Wizard/components/WizardReadinessSeal.jsx';

const ATTR_LABELS = {
  forca: { label: 'FOR', color: 'bg-red-500' },
  inteligencia: { label: 'INT', color: 'bg-blue-500' },
  constituicao: { label: 'CON', color: 'bg-green-500' },
  agilidade: { label: 'AGI', color: 'bg-yellow-500' },
  destreza: { label: 'DES', color: 'bg-purple-500' },
  carisma: { label: 'CAR', color: 'bg-pink-500' },
};

const ATRIBUTOS_DEFAULT_SUM = 60;

function calcMod(val) {
  const v = Number(val) || 10;
  return Math.floor((v - 10) / 2);
}

function calcHP(con, nivel) {
  const mod = calcMod(con);
  return 10 + mod * 2 + (nivel - 1) * (6 + mod);
}

const PendingBadge = ({ children, isLight }) => (
  <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-modern ${
    isLight ? 'bg-amber-100 text-amber-600' : 'bg-amber-500/15 text-amber-400'
  }`}>
    <AlertTriangle size={10} />
    {children}
  </span>
);

const SkippedBadge = ({ children, isLight }) => (
  <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-modern ${
    isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-700/30 text-slate-500'
  }`}>
    <SkipForward size={10} />
    {children}
  </span>
);

const getReadinessState = ({ pendingCount, bonusAplicados, nome, raca, classe }) => {
  if (!nome || !raca || !classe) return 'open';
  if (pendingCount > 0 || !bonusAplicados) return 'shaping';
  return 'sealed';
};

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
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [collapsed, setCollapsed] = useState(false);

  const racaObj = racasDisponiveis?.find(item => String(item.id) === String(raca));
  const classeObj = classesDisponiveis?.find(item => String(item.id) === String(classe));
  const racaNome = racaObj?.nome;
  const classeNome = classeObj?.nome;

  const parseBonus = (raw) => {
    if (!raw) return null;
    try {
      const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(obj) ? obj[0] : obj;
    } catch {
      return null;
    }
  };

  const racaBonus = parseBonus(racaObj?.bonus);
  const classeBonus = parseBonus(classeObj?.bonus);
  const temBonus = racaBonus || classeBonus;

  const getAttrBonus = (key) => {
    let bonus = 0;
    if (racaBonus && (typeof racaBonus[key] === 'string' || typeof racaBonus[key] === 'number')) {
      bonus += Number(racaBonus[key]) || 0;
    }
    if (classeBonus && (typeof classeBonus[key] === 'string' || typeof classeBonus[key] === 'number')) {
      bonus += Number(classeBonus[key]) || 0;
    }
    return bonus;
  };

  const atributosEfetivos = useMemo(() => {
    const result = {};
    for (const key of Object.keys(ATTR_LABELS)) {
      result[key] = bonusJaAplicado
        ? Number(atributos[key]) || 0
        : (Number(atributos[key]) || 0) + getAttrBonus(key);
    }
    return result;
  }, [atributos, bonusJaAplicado, racaObj, classeObj]);

  const hpEstimado = calcHP(atributosEfetivos.constituicao, 1);

  const atributosPendentes = mostrarPendencias
    ? !bonusAplicados
    : Object.values(atributos || {}).map(v => Number(v) || 0).reduce((acc, curr) => acc + curr, 0) === ATRIBUTOS_DEFAULT_SUM;

  const vantagensNomes = (vantagensSelecionadas || []).map(id => {
    const item = vantagensDisponiveis?.find(v => String(v.id) === String(id));
    if (!item) return null;
    return {
      nome: item.nome,
      isDesvantagem: item.custo != null && item.custo < 0,
      custo: item.custo,
    };
  }).filter(Boolean);

  const temVantagens = vantagensNomes.some(item => !item.isDesvantagem);
  const temDesvantagens = vantagensNomes.some(item => item.isDesvantagem);

  const pendingCount = [
    mostrarPendencias && !nome,
    mostrarPendencias && !raca,
    mostrarPendencias && !classe,
    mostrarPendencias && atributosPendentes,
    mostrarPendencias && !temVantagens && !skipVantagens,
    mostrarPendencias && !temDesvantagens && !skipDesvantagens,
  ].filter(Boolean).length;

  const statusLabel = !mostrarPendencias
    ? null
    : pendingCount > 0
      ? { label: 'Em montagem', icon: Clock3, className: isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/15 text-amber-300' }
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
        <div className="relative flex aspect-[16/10] max-h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-purple-600/30 to-slate-800/50">
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
            <h3 className={`truncate text-lg font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} ${mostrarPendencias && !nome ? (isLight ? 'text-amber-600' : 'text-amber-400') : ''}`}>
              {nome || 'Sem nome'}
            </h3>
            {mostrarPendencias && !nome && <div className="mt-1 flex justify-center"><PendingBadge isLight={isLight}>Nome pendente</PendingBadge></div>}
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              <span className={`rounded-full px-2 py-1 text-[11px] font-modern ${racaNome ? isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/15 text-purple-300' : isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'}`}>{racaNome || 'Linhagem pendente'}</span>
              <span className={`rounded-full px-2 py-1 text-[11px] font-modern ${classeNome ? isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/15 text-blue-300' : isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'}`}>{classeNome || 'Vocacao pendente'}</span>
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
            {Object.entries(ATTR_LABELS).map(([key, cfg]) => {
              const efetivo = atributosEfetivos[key];
              const bonusDisplay = getAttrBonus(key);
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
        <div className="relative overflow-hidden border-b border-[var(--wa-border)] p-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(155,124,255,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(214,168,95,0.14),transparent_24%)]" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="wa-brass-chip inline-flex rounded-full px-2 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em]">
                Dossie em forja
              </div>
              <h3 className={`mt-3 truncate text-xl font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{nome || 'Heroi sem selo'}</h3>
              <p className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-[var(--wa-muted)]'}`}>
                {racaNome || 'Linhagem pendente'} {classeNome ? `· ${classeNome}` : '· Vocacao pendente'}
              </p>
            </div>
            <WizardReadinessSeal readinessState={finalReadinessState} />
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div className="wa-panel-soft rounded-2xl p-3">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck size={14} className="text-[var(--wa-brass)]" />
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
              {Object.entries(ATTR_LABELS).map(([key, cfg]) => {
                const efetivo = atributosEfetivos[key];
                const bonusDisplay = getAttrBonus(key);
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
                <Shield size={14} className="text-[var(--wa-info)]" />
                <span className={`text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-600' : 'text-[var(--wa-muted)]'}`}>
                  Bonus ativos
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {racaBonus && Object.entries(racaBonus).filter(([, value]) => typeof value === 'string' || typeof value === 'number').map(([key, value]) => (
                  <span key={`r-${key}`} className="wa-violet-chip rounded-full px-2 py-1 text-[10px] font-modern font-semibold">
                    {key.replace(/_/g, ' ')} {Number(value) >= 0 ? '+' : ''}{value}
                  </span>
                ))}
                {classeBonus && Object.entries(classeBonus).filter(([, value]) => typeof value === 'string' || typeof value === 'number').map(([key, value]) => (
                  <span key={`c-${key}`} className="wa-brass-chip rounded-full px-2 py-1 text-[10px] font-modern font-semibold">
                    {key.replace(/_/g, ' ')} {Number(value) >= 0 ? '+' : ''}{value}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="wa-panel-soft rounded-2xl p-3">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles size={14} className="text-[var(--wa-brass)]" />
              <span className={`text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-600' : 'text-[var(--wa-muted)]'}`}>
                Tracos atuais
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {vantagensNomes.map((item, index) => (
                <span key={`${item.nome}-${index}`} className={`rounded-full px-2 py-1 text-[10px] font-modern ${item.isDesvantagem ? 'wa-ember-chip' : 'wa-emerald-chip'}`}>
                  {item.nome}
                </span>
              ))}
              {mostrarPendencias && !temVantagens && (skipVantagens ? <SkippedBadge isLight={isLight}>Dons pulados</SkippedBadge> : <PendingBadge isLight={isLight}>Dons pendentes</PendingBadge>)}
              {mostrarPendencias && !temDesvantagens && (skipDesvantagens ? <SkippedBadge isLight={isLight}>Marcas puladas</SkippedBadge> : <PendingBadge isLight={isLight}>Marcas pendentes</PendingBadge>)}
            </div>
          </div>

          <div className="wa-panel-soft rounded-2xl p-3">
            <div className="mb-2 flex items-center gap-2">
              <ScrollText size={14} className="text-[var(--wa-violet)]" />
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
