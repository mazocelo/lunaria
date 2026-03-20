import React from 'react';
import { Skull, BookOpen, BarChart3, Zap } from 'lucide-react';
import { CatalogDetailLayout, ChipGroup, AtributoBar, StatRow } from '../../../components/shared';

/**
 * View pura: recebe valores prontos e renderiza.
 * Zero logica de negocio, zero formatacao de dados.
 */
const VerMonstroView = ({
  // Hero
  title,
  image,
  rarity,
  accentColor,
  badges,
  // Conteudo
  descricao,
  atributos,
  habilidades,
  // Sidebar
  stats,
  // UI
  isLight,
  loading,
  error,
  // Handlers
  onBack,
  onEdit,
}) => {
  // Loading/Error
  if (loading || error) {
    return (
      <CatalogDetailLayout
        loading={loading}
        loadingText="Carregando monstro..."
        error={error}
        icon={Skull}
        title=""
        onBack={onBack}
        onEdit={onEdit}
      />
    );
  }

  // Montar sections a partir dos dados prontos
  const sections = [];

  if (descricao) {
    sections.push({
      title: 'Descrição', icon: BookOpen, color: '#d97706',
      content: <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{descricao}</p>,
    });
  }

  if (atributos) {
    sections.push({
      title: 'Atributos', icon: BarChart3, color: '#3b82f6',
      content: (
        <div className="space-y-3">
          {atributos.map(a => (
            <AtributoBar key={a.label} label={a.label} value={a.value} color={a.color} isLight={isLight} />
          ))}
        </div>
      ),
    });
  }

  if (habilidades) {
    sections.push({
      title: 'Habilidades', icon: Zap, color: '#8b5cf6',
      content: (
        <div className="space-y-3">
          {habilidades.map((hab, i) => (
            <div key={i} className={`p-3 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-slate-700/30'}`}>
              {hab.nome && <p className={`font-semibold text-sm ${isLight ? 'text-slate-800' : 'text-white'}`}>{hab.nome}</p>}
              {hab.descricao && <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{hab.descricao}</p>}
              {hab.dano && <p className={`text-xs font-mono mt-1 ${isLight ? 'text-red-600' : 'text-red-400'}`}>Dano: {hab.dano}</p>}
            </div>
          ))}
        </div>
      ),
    });
  }

  // Montar stats do sidebar a partir dos dados prontos
  const sidebarStats = stats?.map(stat => ({
    icon: stat.icon,
    label: stat.label,
    content: stat.chips
      ? <ChipGroup items={stat.chips} colorClass={stat.chipClass} />
      : <span className={`font-mono font-semibold ${stat.colorClass}`}>{stat.value}</span>,
  }));

  // Montar badges JSX a partir dos dados prontos
  const badgeElements = badges?.map(b => (
    <span key={b.key} className={`px-3 py-1 rounded-full text-xs font-semibold border ${b.className}`}>
      {b.text}
    </span>
  ));

  return (
    <CatalogDetailLayout
      title={title}
      image={image}
      icon={Skull}
      rarity={rarity}
      accentColor={accentColor}
      badges={badgeElements}
      sections={sections}
      stats={sidebarStats}
      sidebarTitle="Ficha de Combate"
      onBack={onBack}
      onEdit={onEdit}
    />
  );
};

export default VerMonstroView;
