import React from 'react';
import { Skull, BookOpen, BarChart3, Zap, Heart, Swords, Shield, Star, Tag } from 'lucide-react';
import {
  CatalogDetailLayout,
  ChipGroup,
  AtributoBar,
  getRaridadeConfig,
  formatJson,
} from '../../../components/shared';

const VerMonstroView = ({ monstro, loading, error, isLight, handleBack, handleEdit }) => {
  if (loading || error || !monstro) {
    return (
      <CatalogDetailLayout
        loading={loading}
        loadingText="Carregando monstro..."
        error={error || (!loading && !monstro ? 'Monstro não encontrado' : undefined)}
        icon={Skull}
        title=""
        onBack={handleBack}
        onEdit={handleEdit}
      />
    );
  }

  const m = monstro;
  const raridade = m.raridade_rel?.nome || 'Comum';
  const config = getRaridadeConfig(raridade);
  const tipos = Array.isArray(m.tipo) ? m.tipo : [];
  const elementos = Array.isArray(m.elemento) ? m.elemento : [];
  const temas = Array.isArray(m.temas) ? m.temas : [];
  const habilidades = formatJson(m.habilidades);

  // -- Badges ----------------------------------------------------------
  const badges = [
    <span key="rar" className={`px-3 py-1 rounded-full text-xs font-semibold border ${isLight ? config.badgeLight : config.badge}`}>
      {raridade}
    </span>,
    m.categoria_rel?.nome && (
      <span key="cat" className={`px-3 py-1 rounded-full text-xs font-modern ${isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/15 text-indigo-400'}`}>
        {m.categoria_rel.nome}
      </span>
    ),
    <span key="nv" className={`px-3 py-1 rounded-full text-xs font-modern ${isLight ? 'bg-cyan-50 text-cyan-700' : 'bg-cyan-500/15 text-cyan-400'}`}>
      Nv. {m.nivel_min}-{m.nivel_max}
    </span>,
  ].filter(Boolean);

  // -- Sections --------------------------------------------------------
  const sections = [];

  if (m.descricao) {
    sections.push({
      title: 'Descrição',
      icon: BookOpen,
      color: '#d97706',
      content: <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{m.descricao}</p>,
    });
  }

  sections.push({
    title: 'Atributos',
    icon: BarChart3,
    color: '#3b82f6',
    content: (
      <div className="space-y-3">
        <AtributoBar label="FOR" value={m.forca || 0} color="bg-red-500" isLight={isLight} />
        <AtributoBar label="INT" value={m.inteligencia || 0} color="bg-blue-500" isLight={isLight} />
        <AtributoBar label="DEX" value={m.destreza || 0} color="bg-green-500" isLight={isLight} />
        <AtributoBar label="CON" value={m.constituicao || 0} color="bg-amber-500" isLight={isLight} />
        <AtributoBar label="AGI" value={m.agilidade || 0} color="bg-cyan-500" isLight={isLight} />
        <AtributoBar label="CAR" value={m.carisma || 0} color="bg-pink-500" isLight={isLight} />
      </div>
    ),
  });

  if (habilidades) {
    sections.push({
      title: 'Habilidades',
      icon: Zap,
      color: '#8b5cf6',
      content: Array.isArray(habilidades) ? (
        <div className="space-y-3">
          {habilidades.map((hab, i) => (
            <div key={i} className={`p-3 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-slate-700/30'}`}>
              {typeof hab === 'object' ? (
                <>
                  {hab.nome && <p className={`font-semibold text-sm ${isLight ? 'text-slate-800' : 'text-white'}`}>{hab.nome}</p>}
                  {hab.descricao && <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{hab.descricao}</p>}
                  {hab.dano && <p className={`text-xs font-mono mt-1 ${isLight ? 'text-red-600' : 'text-red-400'}`}>Dano: {hab.dano}</p>}
                </>
              ) : (
                <p className={`text-sm ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{String(hab)}</p>
              )}
            </div>
          ))}
        </div>
      ) : typeof habilidades === 'object' ? (
        <div className="space-y-2">
          {Object.entries(habilidades).map(([key, val], i) => (
            <p key={i} className={`font-mono text-sm ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              {key}: {typeof val === 'object' ? JSON.stringify(val) : String(val)}
            </p>
          ))}
        </div>
      ) : (
        <p className={`font-modern ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{String(habilidades)}</p>
      ),
    });
  }

  // -- Stats (sidebar) -------------------------------------------------
  const stats = [
    { icon: Heart, label: 'HP Base', content: <span className={`font-mono font-semibold ${isLight ? 'text-red-600' : 'text-red-400'}`}>{m.hp_base}</span> },
    { icon: Swords, label: 'Ataque Base', content: <span className={`font-mono font-semibold ${isLight ? 'text-orange-600' : 'text-orange-400'}`}>{m.ataque_base}</span> },
    { icon: Shield, label: 'Defesa Base', content: <span className={`font-mono font-semibold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>{m.defesa_base}</span> },
    m.dano_base && { icon: Swords, label: 'Dano Base', content: <span className={`font-mono font-semibold ${isLight ? 'text-red-600' : 'text-red-400'}`}>{m.dano_base}</span> },
    { icon: Star, label: 'XP Base', content: <span className={`font-mono font-semibold ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>{m.xp_base}</span> },
    { icon: BarChart3, label: 'Nivel', content: <span className="text-cyan-400 font-semibold">{m.nivel_min} - {m.nivel_max}</span> },
    tipos.length > 0 && { icon: Tag, label: 'Tipo', content: <ChipGroup items={tipos} colorClass={isLight ? 'bg-amber-50 text-amber-700' : 'bg-amber-500/15 text-amber-400'} /> },
    elementos.length > 0 && { icon: Zap, label: 'Elemento', content: <ChipGroup items={elementos} colorClass={isLight ? 'bg-purple-50 text-purple-700' : 'bg-purple-500/15 text-purple-400'} /> },
    temas.length > 0 && { icon: Tag, label: 'Temas', content: <ChipGroup items={temas} colorClass={isLight ? 'bg-indigo-50 text-indigo-700' : 'bg-indigo-500/15 text-indigo-400'} /> },
  ].filter(Boolean);

  return (
    <CatalogDetailLayout
      title={m.nome}
      image={m.imagem}
      icon={Skull}
      rarity={raridade}
      accentColor={config.accent}
      badges={badges}
      sections={sections}
      stats={stats}
      sidebarTitle="Ficha de Combate"
      onBack={handleBack}
      onEdit={handleEdit}
    />
  );
};

export default VerMonstroView;
