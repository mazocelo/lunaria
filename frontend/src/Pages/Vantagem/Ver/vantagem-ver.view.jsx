import React from 'react';
import { Sparkles, BookOpen, Zap, Coins, BarChart3, Tag, Swords, Shield } from 'lucide-react';
import {
  CatalogDetailLayout,
  ChipGroup,
  formatBonusDisplay,
  formatObjectDisplay,
  formatRequisitosDisplay,
} from '../../../components/shared';

const VerVantagemView = ({ vantagem, loading, error, isLight, handleBack, handleEdit }) => {
  if (loading || error || !vantagem) {
    return (
      <CatalogDetailLayout
        loading={loading} loadingText="Carregando vantagem..."
        error={error || (!loading && !vantagem ? 'Vantagem nao encontrada' : undefined)}
        icon={Sparkles} title="" onBack={handleBack} onEdit={handleEdit}
      />
    );
  }

  const v = vantagem;
  const tipos = Array.isArray(v.tipo) ? v.tipo : [];
  const elementos = Array.isArray(v.elemento) ? v.elemento : [];
  const bonusItems = formatBonusDisplay(v.bonus);
  const efeitoItems = formatObjectDisplay(v.efeito);
  const restricaoItems = formatObjectDisplay(v.restricao);
  const requisitosItems = formatRequisitosDisplay(v.requisitos);

  // -- Badges --
  const badges = [
    <span key="cost" className={`px-3 py-1 rounded-full text-xs font-semibold ${
      v.custo > 0 ? (isLight ? 'bg-green-100 text-green-800' : 'bg-green-500/20 text-green-400')
      : v.custo < 0 ? (isLight ? 'bg-red-100 text-red-800' : 'bg-red-500/20 text-red-400')
      : (isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-700/50 text-slate-300')
    }`}>{v.custo > 0 ? `+${v.custo}` : v.custo} pts</span>,
    ...tipos.map((t, i) => (
      <span key={`t${i}`} className={`px-3 py-1 rounded-full text-xs font-modern ${
        t === 'ativa' ? (isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/15 text-blue-400')
        : t === 'passiva' ? (isLight ? 'bg-green-50 text-green-700' : 'bg-green-500/15 text-green-400')
        : (isLight ? 'bg-amber-50 text-amber-700' : 'bg-amber-500/15 text-amber-400')
      }`}>{t}</span>
    )),
    v.usar && <span key="usar" className={`px-3 py-1 rounded-full text-xs font-modern ${isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/15 text-indigo-400'}`}>{v.usar}</span>,
  ].filter(Boolean);

  // -- Sections --
  const textCls = isLight ? 'text-slate-700' : 'text-slate-300';
  const sections = [
    v.descricao && { title: 'Descricao', icon: BookOpen, color: '#d97706',
      content: <p className={`font-modern leading-relaxed ${textCls}`}>{v.descricao}</p> },
    efeitoItems?.length > 0 && { title: 'Efeito', icon: Zap, color: '#22c55e',
      content: <div className="space-y-2">{efeitoItems.map((e, i) => <p key={i} className={`font-mono text-sm ${textCls}`}>{e}</p>)}</div> },
  ].filter(Boolean);

  // -- Stats --
  const monoBlock = (items, cls) => (
    <div className="space-y-1">{items.map((a, i) => <span key={i} className={`block font-mono text-xs ${cls}`}>{a}</span>)}</div>
  );

  const stats = [
    { icon: Coins, label: 'Custo', content: (
      <span className={`font-mono font-semibold ${
        v.custo > 0 ? (isLight ? 'text-green-600' : 'text-green-400')
        : v.custo < 0 ? (isLight ? 'text-red-600' : 'text-red-400')
        : (isLight ? 'text-slate-600' : 'text-slate-300')
      }`}>{v.custo > 0 ? `+${v.custo}` : v.custo} pontos</span>
    )},
    { icon: BarChart3, label: 'Nivel', content: <span className="text-cyan-400 font-semibold">{v.nivel || 1}</span> },
    tipos.length > 0 && { icon: Tag, label: 'Tipo', content: <ChipGroup items={tipos} colorClass={isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/15 text-blue-400'} /> },
    elementos.length > 0 && { icon: Zap, label: 'Elemento', content: <ChipGroup items={elementos} colorClass={isLight ? 'bg-purple-50 text-purple-700' : 'bg-purple-500/15 text-purple-400'} /> },
    v.dano_base && { icon: Swords, label: 'Dano Base', content: <span className={`font-mono font-semibold ${isLight ? 'text-red-600' : 'text-red-400'}`}>{v.dano_base}</span> },
    bonusItems?.length > 0 && { icon: Shield, label: 'Bonus', content: monoBlock(bonusItems, isLight ? 'text-cyan-700' : 'text-cyan-400') },
    restricaoItems?.length > 0 && { icon: Shield, label: 'Restricao', content: monoBlock(restricaoItems, isLight ? 'text-amber-700' : 'text-amber-400') },
    requisitosItems?.length > 0 && { icon: Shield, label: 'Requisitos', content: monoBlock(requisitosItems, isLight ? 'text-amber-700' : 'text-amber-400') },
  ].filter(Boolean);

  return (
    <CatalogDetailLayout
      title={v.nome}
      image={v.imagem}
      icon={Sparkles}
      accentColor="#22c55e"
      badges={badges}
      sections={sections}
      stats={stats}
      onBack={handleBack}
      onEdit={handleEdit}
    />
  );
};

export default VerVantagemView;
