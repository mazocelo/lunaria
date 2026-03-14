import React, { useState } from 'react';
import { useTheme } from '../contexts/theme.jsx';
import { Heart, Shield, Eye, EyeOff, Sparkles, User, AlertTriangle, SkipForward, CheckCircle2, Clock3 } from 'lucide-react';

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

const PersonagemPreviewCard = ({
  nome,
  raca,
  classe,
  atributos,
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

  const atributosEfetivos = {};
  for (const key of Object.keys(ATTR_LABELS)) {
    atributosEfetivos[key] = bonusJaAplicado
      ? Number(atributos[key]) || 0
      : (Number(atributos[key]) || 0) + getAttrBonus(key);
  }

  const hpEstimado = calcHP(atributosEfetivos.constituicao, 1);

  const atributosPendentes = mostrarPendencias
    ? !bonusAplicados
    : Object.values(atributos || {})
        .map(v => Number(v) || 0)
        .reduce((acc, curr) => acc + curr, 0) === ATRIBUTOS_DEFAULT_SUM;

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

  return (
    <div className={`${isLight ? 'glass-light' : 'glass'} overflow-hidden rounded-2xl border ${
      isLight ? 'border-purple-300/20' : 'border-purple-500/20'
    }`}>
      <button
        onClick={() => setCollapsed(prev => !prev)}
        className={`w-full items-center justify-between px-4 py-3 md:hidden cursor-pointer ${
          isLight ? 'hover:bg-slate-100/50' : 'hover:bg-slate-700/30'
        } flex`}
      >
        <span className={`text-sm font-fantasy font-bold ${isLight ? 'text-slate-700' : 'text-white'}`}>
          Ficha do heroi
        </span>
        {collapsed ? <Eye size={16} className="text-slate-400" /> : <EyeOff size={16} className="text-slate-400" />}
      </button>

      <div className={`${collapsed ? 'hidden md:block' : ''}`}>
        <div className="relative flex aspect-[16/10] max-h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-purple-600/30 to-slate-800/50">
          {imagem ? (
            <img src={imagem} alt={nome || 'Personagem'} className="h-full w-full object-cover" />
          ) : (
            <User size={44} className="text-purple-400/50" />
          )}

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
            <h3 className={`text-lg font-fantasy font-bold truncate ${
              isLight ? 'text-slate-800' : 'text-white'
            } ${mostrarPendencias && !nome ? (isLight ? 'text-amber-600' : 'text-amber-400') : ''}`}>
              {nome || 'Sem nome'}
            </h3>
            {mostrarPendencias && !nome && (
              <div className="mt-1 flex justify-center">
                <PendingBadge isLight={isLight}>Nome pendente</PendingBadge>
              </div>
            )}

            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              <span className={`rounded-full px-2 py-1 text-[11px] font-modern ${
                racaNome
                  ? isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/15 text-purple-300'
                  : isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'
              }`}>
                {racaNome || 'Linhagem pendente'}
              </span>
              <span className={`rounded-full px-2 py-1 text-[11px] font-modern ${
                classeNome
                  ? isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/15 text-blue-300'
                  : isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'
              }`}>
                {classeNome || 'Vocacao pendente'}
              </span>
            </div>

            {mostrarPendencias && (!raca || !classe) && (
              <div className="mt-2 flex justify-center gap-1">
                {!raca && <PendingBadge isLight={isLight}>Linhagem</PendingBadge>}
                {!classe && <PendingBadge isLight={isLight}>Vocacao</PendingBadge>}
              </div>
            )}
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
              <span className={`text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Atributos finais
              </span>
              {mostrarPendencias && atributosPendentes && (
                <PendingBadge isLight={isLight}>Distribuicao pendente</PendingBadge>
              )}
            </div>

            {Object.entries(ATTR_LABELS).map(([key, cfg]) => {
              const efetivo = atributosEfetivos[key];
              const bonusDisplay = getAttrBonus(key);
              const pct = Math.min(100, (efetivo / 20) * 100);
              const mod = calcMod(efetivo);

              return (
                <div key={key} className="flex items-center gap-2">
                  <span className={`w-7 text-[10px] font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {cfg.label}
                  </span>
                  <div className={`h-1.5 flex-1 rounded-full ${isLight ? 'bg-slate-200' : 'bg-slate-700/50'}`}>
                    <div className={`h-full rounded-full ${cfg.color} transition-all duration-300`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-right text-[10px] font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {efetivo || '-'}
                    {bonusDisplay !== 0 && (
                      <span className={bonusDisplay > 0 ? 'text-green-400' : 'text-red-400'}>
                        {` (${bonusDisplay > 0 ? '+' : ''}${bonusDisplay})`}
                      </span>
                    )}{' '}
                    <span className={mod >= 0 ? 'text-green-400/70' : 'text-red-400/70'}>
                      {mod >= 0 ? '+' : ''}{mod}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>

          {temBonus && (() => {
            const renderBonus = (bonus, prefix, colorPos, colorNeg, titleLabel) => {
              if (!bonus) return null;

              return Object.entries(bonus)
                .filter(([, value]) => typeof value === 'string' || typeof value === 'number')
                .map(([key, value]) => (
                  <span
                    key={`${prefix}-${key}`}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-modern ${Number(value) >= 0 ? colorPos : colorNeg}`}
                    title={titleLabel}
                  >
                    {key.replace(/_/g, ' ')} {Number(value) >= 0 ? '+' : ''}{value}
                  </span>
                ));
            };

            const racaTags = renderBonus(racaBonus, 'r', 'bg-purple-500/15 text-purple-400', 'bg-orange-500/15 text-orange-400', `Linhagem: ${racaNome}`);
            const classeTags = renderBonus(classeBonus, 'c', 'bg-blue-500/15 text-blue-400', 'bg-orange-500/15 text-orange-400', `Vocacao: ${classeNome}`);
            const racaVants = racaBonus?.vantagens || [];
            const racaDesvs = racaBonus?.desvantagens || [];
            const classeVants = classeBonus?.vantagens || [];
            const classeDesvs = classeBonus?.desvantagens || [];
            const allInnate = [
              ...racaVants.map(item => ({ ...item, tipo: 'vantagem' })),
              ...classeVants.map(item => ({ ...item, tipo: 'vantagem' })),
              ...racaDesvs.map(item => ({ ...item, tipo: 'desvantagem' })),
              ...classeDesvs.map(item => ({ ...item, tipo: 'desvantagem' })),
            ];
            const hasContent = (racaTags?.length > 0) || (classeTags?.length > 0) || allInnate.length > 0;
            if (!hasContent) return null;

            return (
              <div>
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Shield size={12} className="text-blue-400" />
                  <span className={`text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Bonus ativos
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {racaTags}
                  {classeTags}
                  {allInnate.map((item, index) => (
                    <span
                      key={`innate-${index}`}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-modern ${
                        item.tipo === 'desvantagem'
                          ? 'bg-red-500/15 text-red-400'
                          : 'bg-green-500/15 text-green-400'
                      }`}
                    >
                      {item.nome}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {(vantagensNomes.length > 0 || mostrarPendencias) && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5">
                <Sparkles size={12} className="text-yellow-400" />
                <span className={`text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Tracos atuais
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {vantagensNomes.map((item, index) => (
                  <span
                    key={`${item.nome}-${index}`}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-modern ${
                      item.isDesvantagem
                        ? 'bg-red-500/15 text-red-400'
                        : 'bg-green-500/15 text-green-400'
                    }`}
                  >
                    {item.nome}
                  </span>
                ))}

                {mostrarPendencias && !temVantagens && (
                  skipVantagens
                    ? <SkippedBadge isLight={isLight}>Vantagens puladas</SkippedBadge>
                    : <PendingBadge isLight={isLight}>Vantagens pendentes</PendingBadge>
                )}

                {mostrarPendencias && !temDesvantagens && (
                  skipDesvantagens
                    ? <SkippedBadge isLight={isLight}>Desvantagens puladas</SkippedBadge>
                    : <PendingBadge isLight={isLight}>Desvantagens pendentes</PendingBadge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonagemPreviewCard;
