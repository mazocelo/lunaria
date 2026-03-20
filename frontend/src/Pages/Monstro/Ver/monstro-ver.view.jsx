import React from 'react';
import { Skull, BookOpen, BarChart3, Zap, Heart, Swords, Shield, Star, Tag } from 'lucide-react';
import { useTheme } from '../../../contexts/theme.jsx';
import { CatalogDetailLayout, ChipGroup, AtributoBar } from '../../../components/shared';

/**
 * View: montagem visual completa.
 * Recebe dados normalizados do ViewModel e constroi toda a apresentacao.
 * Resolve tema, escolhe cores, monta JSX de badges/sections/stats.
 */

const ATTR_BARS = [
  { key: 'forca', label: 'FOR', color: 'bg-red-500' },
  { key: 'inteligencia', label: 'INT', color: 'bg-blue-500' },
  { key: 'destreza', label: 'DEX', color: 'bg-green-500' },
  { key: 'constituicao', label: 'CON', color: 'bg-amber-500' },
  { key: 'agilidade', label: 'AGI', color: 'bg-cyan-500' },
  { key: 'carisma', label: 'CAR', color: 'bg-pink-500' },
];

const VerMonstroView = ({ monstro: m, loading, error, onBack, onEdit }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Loading/Error
  if (loading || error || !m) {
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

  // --- Badges ---
  const badges = [
    <span key="rar" className={`px-3 py-1 rounded-full text-xs font-semibold border ${isLight ? m.raridadeConfig.badgeLight : m.raridadeConfig.badge}`}>
      {m.raridade}
    </span>,
    m.categoria && (
      <span key="cat" className={`px-3 py-1 rounded-full text-xs font-modern ${isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/15 text-indigo-400'}`}>
        {m.categoria}
      </span>
    ),
    <span key="nv" className={`px-3 py-1 rounded-full text-xs font-modern ${isLight ? 'bg-cyan-50 text-cyan-700' : 'bg-cyan-500/15 text-cyan-400'}`}>
      Nv. {m.nivelMin}-{m.nivelMax}
    </span>,
  ].filter(Boolean);

  // --- Sections ---
  const sections = [];

  if (m.descricao) {
    sections.push({
      title: 'Descrição', icon: BookOpen, color: '#d97706',
      content: <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{m.descricao}</p>,
    });
  }

  sections.push({
    title: 'Atributos', icon: BarChart3, color: '#3b82f6',
    content: (
      <div className="space-y-3">
        {ATTR_BARS.map(a => (
          <AtributoBar key={a.key} label={a.label} value={m.atributos[a.key]} color={a.color} isLight={isLight} />
        ))}
      </div>
    ),
  });

  if (m.habilidades) {
    sections.push({
      title: 'Habilidades', icon: Zap, color: '#8b5cf6',
      content: (
        <div className="space-y-3">
          {m.habilidades.map((hab, i) => (
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

  // --- Stats sidebar ---
  const stats = [
    { icon: Heart, label: 'HP Base', content: <span className={`font-mono font-semibold ${isLight ? 'text-red-600' : 'text-red-400'}`}>{m.combate.hpBase}</span> },
    { icon: Swords, label: 'Ataque Base', content: <span className={`font-mono font-semibold ${isLight ? 'text-orange-600' : 'text-orange-400'}`}>{m.combate.ataqueBase}</span> },
    { icon: Shield, label: 'Defesa Base', content: <span className={`font-mono font-semibold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>{m.combate.defesaBase}</span> },
    m.combate.danoBase && { icon: Swords, label: 'Dano Base', content: <span className={`font-mono font-semibold ${isLight ? 'text-red-600' : 'text-red-400'}`}>{m.combate.danoBase}</span> },
    { icon: Star, label: 'XP Base', content: <span className={`font-mono font-semibold ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>{m.combate.xpBase}</span> },
    { icon: BarChart3, label: 'Nivel', content: <span className="text-cyan-400 font-semibold">{m.nivelMin} - {m.nivelMax}</span> },
    m.tipos.length > 0 && { icon: Tag, label: 'Tipo', content: <ChipGroup items={m.tipos} colorClass={isLight ? 'bg-amber-50 text-amber-700' : 'bg-amber-500/15 text-amber-400'} /> },
    m.elementos.length > 0 && { icon: Zap, label: 'Elemento', content: <ChipGroup items={m.elementos} colorClass={isLight ? 'bg-purple-50 text-purple-700' : 'bg-purple-500/15 text-purple-400'} /> },
    m.temas.length > 0 && { icon: Tag, label: 'Temas', content: <ChipGroup items={m.temas} colorClass={isLight ? 'bg-indigo-50 text-indigo-700' : 'bg-indigo-500/15 text-indigo-400'} /> },
  ].filter(Boolean);

  return (
    <CatalogDetailLayout
      title={m.nome}
      image={m.imagem}
      icon={Skull}
      rarity={m.raridade}
      accentColor={m.raridadeConfig.accent}
      badges={badges}
      sections={sections}
      stats={stats}
      sidebarTitle="Ficha de Combate"
      onBack={onBack}
      onEdit={onEdit}
    />
  );
};

export default VerMonstroView;
