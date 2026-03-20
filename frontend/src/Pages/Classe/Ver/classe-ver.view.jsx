import React from 'react';
import { Shield, BookOpen, Coins, Zap } from 'lucide-react';
import { useTheme } from '../../../contexts/theme.jsx';
import { CatalogDetailLayout } from '../../../components/shared';

/**
 * View: apresentacao completa.
 * Recebe dados normalizados do Model (via ViewModel) e monta toda a UI.
 * Resolve tema, badges, sections, stats — tudo visual vive aqui.
 */

const VerClasseView = ({ classe: c, loading, error, onBack, onEdit }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (loading || error || !c) {
    return (
      <CatalogDetailLayout
        loading={loading} loadingText="Carregando classe..."
        error={error || (!loading && !c ? 'Classe nao encontrada' : undefined)}
        icon={Shield} title="" onBack={onBack} onEdit={onEdit}
      />
    );
  }

  // Badges
  const badges = [
    <span key="custo" className={`px-3 py-1 rounded-full text-xs font-semibold ${c.custo === 0
      ? (isLight ? 'bg-green-100 text-green-800' : 'bg-green-500/20 text-green-400')
      : (isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-400')
    }`}>{c.custo === 0 ? 'Gratuita' : `${c.custo} pts`}</span>,
  ];

  // Bonus chip helper
  const bonusChip = (b, i) => <span key={i} className={`block font-mono text-xs ${isLight ? 'text-violet-700' : 'text-violet-400'}`}>{b}</span>;

  // Sections
  const sections = [
    c.descricao && {
      title: 'Descricao', icon: BookOpen, color: '#d97706',
      content: <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{c.descricao}</p>,
    },
    c.bonus?.length > 0 && {
      title: 'Bonus', icon: Zap, color: '#8b5cf6',
      content: <div className="space-y-1">{c.bonus.map(bonusChip)}</div>,
    },
  ].filter(Boolean);

  // Stats sidebar
  const costColor = c.custo === 0
    ? (isLight ? 'text-green-600' : 'text-green-400')
    : (isLight ? 'text-amber-600' : 'text-amber-400');

  const stats = [
    { icon: Coins, label: 'Custo', content: <span className={`font-mono font-semibold ${costColor}`}>{c.custo === 0 ? 'Gratuita' : `${c.custo} pontos`}</span> },
    ...(c.bonus?.length > 0
      ? c.bonus.map((b, i) => ({ icon: Zap, label: i === 0 ? 'Bonus' : ' ', content: bonusChip(b, i) }))
      : []),
  ];

  return (
    <CatalogDetailLayout
      title={c.nome} image={c.imagem} icon={Shield} accentColor="#8b5cf6"
      badges={badges} sections={sections} stats={stats}
      onBack={onBack} onEdit={onEdit}
    />
  );
};

export default VerClasseView;
