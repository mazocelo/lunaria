import React from 'react';
import { AlertTriangle, BookOpen, Zap, Coins, BarChart3, Tag, Shield } from 'lucide-react';
import { useTheme } from '../../../contexts/theme.jsx';
import { CatalogDetailLayout, ChipGroup } from '../../../components/shared';

/**
 * View: apresentacao completa.
 * Recebe dados normalizados do Model (via ViewModel) e monta toda a UI.
 * Resolve tema, badges, sections, stats — tudo visual vive aqui.
 */

const VerDesvantagemView = ({ desvantagem: d, loading, error, onBack, onEdit }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (loading || error || !d) {
    return (
      <CatalogDetailLayout
        loading={loading} loadingText="Carregando desvantagem..."
        error={error || (!loading && !d ? 'Desvantagem nao encontrada' : undefined)}
        icon={AlertTriangle} title="" onBack={onBack} onEdit={onEdit}
      />
    );
  }

  // -- Badges --
  const badges = [
    <span key="cost" className={`px-3 py-1 rounded-full text-xs font-semibold ${isLight ? 'bg-red-100 text-red-800' : 'bg-red-500/20 text-red-400'}`}>
      {d.custo} pts
    </span>,
    ...d.tipos.map((t, i) => (
      <span key={`t${i}`} className={`px-3 py-1 rounded-full text-xs font-modern ${
        t === 'ativa' ? (isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/15 text-blue-400')
        : t === 'passiva' ? (isLight ? 'bg-green-50 text-green-700' : 'bg-green-500/15 text-green-400')
        : (isLight ? 'bg-amber-50 text-amber-700' : 'bg-amber-500/15 text-amber-400')
      }`}>{t}</span>
    )),
  ].filter(Boolean);

  // -- Sections --
  const textCls = isLight ? 'text-slate-700' : 'text-slate-300';
  const sections = [
    d.descricao && { title: 'Descricao', icon: BookOpen, color: '#d97706',
      content: <p className={`font-modern leading-relaxed ${textCls}`}>{d.descricao}</p> },
    d.efeito?.length > 0 && { title: 'Efeito', icon: Zap, color: '#ef4444',
      content: <div className="space-y-2">{d.efeito.map((e, i) => <p key={i} className={`font-mono text-sm ${textCls}`}>{e}</p>)}</div> },
  ].filter(Boolean);

  // -- Stats --
  const monoBlock = (items, cls) => (
    <div className="space-y-1">{items.map((a, i) => <span key={i} className={`block font-mono text-xs ${cls}`}>{a}</span>)}</div>
  );

  const stats = [
    { icon: Coins, label: 'Custo', content: <span className={`font-mono font-semibold ${isLight ? 'text-red-600' : 'text-red-400'}`}>{d.custo} pontos</span> },
    { icon: BarChart3, label: 'Nivel', content: <span className="text-cyan-400 font-semibold">{d.nivel || 1}</span> },
    d.tipos.length > 0 && { icon: Tag, label: 'Tipo', content: <ChipGroup items={d.tipos} colorClass={isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/15 text-blue-400'} /> },
    d.elementos.length > 0 && { icon: Zap, label: 'Elemento', content: <ChipGroup items={d.elementos} colorClass={isLight ? 'bg-purple-50 text-purple-700' : 'bg-purple-500/15 text-purple-400'} /> },
    d.bonus?.length > 0 && { icon: Shield, label: 'Bonus', content: monoBlock(d.bonus, isLight ? 'text-cyan-700' : 'text-cyan-400') },
    d.restricao?.length > 0 && { icon: Shield, label: 'Restricao', content: monoBlock(d.restricao, isLight ? 'text-amber-700' : 'text-amber-400') },
    d.requisitos?.length > 0 && { icon: Shield, label: 'Requisitos', content: monoBlock(d.requisitos, isLight ? 'text-amber-700' : 'text-amber-400') },
  ].filter(Boolean);

  return (
    <CatalogDetailLayout
      title={d.nome}
      image={d.imagem}
      icon={AlertTriangle}
      accentColor="#ef4444"
      badges={badges}
      sections={sections}
      stats={stats}
      onBack={onBack}
      onEdit={onEdit}
    />
  );
};

export default VerDesvantagemView;
