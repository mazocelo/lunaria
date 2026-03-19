import React from 'react';
import { Shield, BookOpen, Coins, Zap } from 'lucide-react';
import { CatalogDetailLayout, formatBonusDisplay } from '../../../components/shared';

const costBadge = (custo, isLight) => (
  <span key="custo" className={`px-3 py-1 rounded-full text-xs font-semibold ${custo === 0
    ? (isLight ? 'bg-green-100 text-green-800' : 'bg-green-500/20 text-green-400')
    : (isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-400')
  }`}>{custo === 0 ? 'Gratuita' : `${custo} pts`}</span>
);

const VerClasseView = ({ classe, loading, error, isLight, handleBack, handleEdit }) => {
  if (loading || error || !classe) {
    return (
      <CatalogDetailLayout
        loading={loading} loadingText="Carregando classe..."
        error={error || (!loading && !classe ? 'Classe não encontrada' : undefined)}
        icon={Shield} title="" onBack={handleBack} onEdit={handleEdit}
      />
    );
  }

  const bonusItems = formatBonusDisplay(classe.bonus);
  const bonusChip = (b, i) => <span key={i} className={`block font-mono text-xs ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>{b}</span>;

  const sections = [
    classe.descricao && { title: 'Descrição', icon: BookOpen, color: '#d97706',
      content: <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{classe.descricao}</p> },
    bonusItems?.length > 0 && { title: 'Bônus', icon: Zap, color: '#8b5cf6',
      content: <div className="space-y-1">{bonusItems.map(bonusChip)}</div> },
  ].filter(Boolean);

  const costColor = classe.custo === 0
    ? (isLight ? 'text-green-600' : 'text-green-400')
    : (isLight ? 'text-amber-600' : 'text-amber-400');

  const stats = [
    { icon: Coins, label: 'Custo', content: <span className={`font-mono font-semibold ${costColor}`}>{classe.custo === 0 ? 'Gratuita' : `${classe.custo} pontos`}</span> },
    ...(bonusItems?.length > 0
      ? bonusItems.map((b, i) => ({ icon: Zap, label: i === 0 ? 'Bônus' : ' ', content: bonusChip(b, i) }))
      : []),
  ];

  return (
    <CatalogDetailLayout
      title={classe.nome} image={classe.imagem} icon={Shield} accentColor="#8b5cf6"
      badges={[costBadge(classe.custo, isLight)]} sections={sections} stats={stats}
      onBack={handleBack} onEdit={handleEdit}
    />
  );
};

export default VerClasseView;
