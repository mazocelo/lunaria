import React from 'react';
import { Skull, BookOpen, BarChart3, Zap } from 'lucide-react';
import { useTheme } from '../../../contexts/theme.jsx';
import { CatalogDetailLayout, ChipGroup, AtributoBar } from '../../../components/shared';

/**
 * View: renderizacao visual.
 * Recebe decisoes de conteudo do ViewModel (dados estruturados)
 * e converte em JSX com tema, cores e componentes visuais.
 */

// Mapeamento visual — configs de renderizacao
const ATTR_BARS = [
  { key: 'forca', label: 'FOR', color: 'bg-red-500' },
  { key: 'inteligencia', label: 'INT', color: 'bg-blue-500' },
  { key: 'destreza', label: 'DEX', color: 'bg-green-500' },
  { key: 'constituicao', label: 'CON', color: 'bg-amber-500' },
  { key: 'agilidade', label: 'AGI', color: 'bg-cyan-500' },
  { key: 'carisma', label: 'CAR', color: 'bg-pink-500' },
];

const STAT_COLORS = {
  danger: { light: 'text-red-600', dark: 'text-red-400' },
  warning: { light: 'text-orange-600', dark: 'text-orange-400' },
  info: { light: 'text-blue-600', dark: 'text-blue-400' },
  accent: { light: 'text-amber-600', dark: 'text-amber-400' },
  cyan: { light: 'text-cyan-600', dark: 'text-cyan-400' },
};

const CHIP_COLORS = {
  amber: { light: 'bg-amber-50 text-amber-700', dark: 'bg-amber-500/15 text-amber-400' },
  purple: { light: 'bg-purple-50 text-purple-700', dark: 'bg-purple-500/15 text-purple-400' },
  indigo: { light: 'bg-indigo-50 text-indigo-700', dark: 'bg-indigo-500/15 text-indigo-400' },
};

const BADGE_VARIANTS = {
  info: { light: 'bg-indigo-50 text-indigo-600', dark: 'bg-indigo-500/15 text-indigo-400' },
  level: { light: 'bg-cyan-50 text-cyan-700', dark: 'bg-cyan-500/15 text-cyan-400' },
};

const SECTION_CONFIG = {
  descricao: { title: 'Descrição', icon: BookOpen, color: '#d97706' },
  atributos: { title: 'Atributos', icon: BarChart3, color: '#3b82f6' },
  habilidades: { title: 'Habilidades', icon: Zap, color: '#8b5cf6' },
};

const VerMonstroView = ({ monstro: m, badges, sections, stats, loading, error, onBack, onEdit }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const t = isLight ? 'light' : 'dark';

  if (loading || error || !m) {
    return (
      <CatalogDetailLayout
        loading={loading} loadingText="Carregando monstro..."
        error={error} icon={Skull} title="" onBack={onBack} onEdit={onEdit}
      />
    );
  }

  // Renderizar badges
  const renderedBadges = badges?.map(b => (
    <span key={b.key} className={`px-3 py-1 rounded-full text-xs font-semibold border ${
      b.variant === 'rarity'
        ? (isLight ? m.raridadeConfig.badgeLight : m.raridadeConfig.badge)
        : `font-modern ${BADGE_VARIANTS[b.variant]?.[t] || ''}`
    }`}>
      {b.text}
    </span>
  ));

  // Renderizar sections
  const renderedSections = sections?.map(s => {
    const cfg = SECTION_CONFIG[s.type] || SECTION_CONFIG[s.key];
    if (!cfg) return null;

    let content;
    if (s.type === 'text') {
      content = <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{s.text}</p>;
    } else if (s.type === 'atributos') {
      content = (
        <div className="space-y-3">
          {ATTR_BARS.map(a => <AtributoBar key={a.key} label={a.label} value={m.atributos[a.key]} color={a.color} isLight={isLight} />)}
        </div>
      );
    } else if (s.type === 'habilidades') {
      content = (
        <div className="space-y-3">
          {m.habilidades.map((hab, i) => (
            <div key={i} className={`p-3 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-slate-700/30'}`}>
              {hab.nome && <p className={`font-semibold text-sm ${isLight ? 'text-slate-800' : 'text-white'}`}>{hab.nome}</p>}
              {hab.descricao && <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{hab.descricao}</p>}
              {hab.dano && <p className={`text-xs font-mono mt-1 ${isLight ? 'text-red-600' : 'text-red-400'}`}>Dano: {hab.dano}</p>}
            </div>
          ))}
        </div>
      );
    }

    return { title: cfg.title, icon: cfg.icon, color: cfg.color, content };
  }).filter(Boolean);

  // Renderizar stats
  const renderedStats = stats?.map(stat => ({
    icon: stat.icon,
    label: stat.label,
    content: stat.chips
      ? <ChipGroup items={stat.chips} colorClass={CHIP_COLORS[stat.chipColor]?.[t]} />
      : <span className={`font-mono font-semibold ${STAT_COLORS[stat.color]?.[t]}`}>{stat.value}</span>,
  }));

  return (
    <CatalogDetailLayout
      title={m.nome} image={m.imagem} icon={Skull}
      rarity={m.raridade} accentColor={m.raridadeConfig.accent}
      badges={renderedBadges} sections={renderedSections} stats={renderedStats}
      sidebarTitle="Ficha de Combate" onBack={onBack} onEdit={onEdit}
    />
  );
};

export default VerMonstroView;
