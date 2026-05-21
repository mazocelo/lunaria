import React from 'react';
import { Sparkles, BookOpen, Target, Clock, Zap, Shield, Tag, BarChart3 } from 'lucide-react';
import { useTheme } from '../../../contexts/theme.jsx';
import { CatalogDetailLayout } from '../../../components/shared';

const escolaColors = {
  branca: '#f59e0b',
  negra: '#8b5cf6',
  elemental: '#ef4444',
};

const escolaLabels = {
  branca: 'Branca',
  negra: 'Negra',
  elemental: 'Elemental',
};

const VerMagiaTresDetView = ({ magia: m, loading, error, onBack, onEdit }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (loading || error || !m) {
    return (
      <CatalogDetailLayout
        loading={loading} loadingText="Carregando magia..."
        error={error || (!loading && !m ? 'Magia nao encontrada' : undefined)}
        icon={Sparkles} title="" onBack={onBack} onEdit={onEdit}
      />
    );
  }

  const accent = escolaColors[m.escola] || '#8b5cf6';

  const badges = [
    <span key="escola" className="px-3 py-1 rounded-full text-xs font-semibold"
      style={{ background: `${accent}20`, color: accent }}>
      {escolaLabels[m.escola] || m.escola}
    </span>,
    m.tipo && (
      <span key="tipo" className={`px-3 py-1 rounded-full text-xs font-modern ${isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/15 text-blue-400'}`}>
        {m.tipo}
      </span>
    ),
  ].filter(Boolean);

  const textCls = isLight ? 'text-slate-700' : 'text-slate-300';

  const sections = [
    m.descricao && {
      title: 'Descricao', icon: BookOpen, color: '#d97706',
      content: <p className={`font-modern leading-relaxed ${textCls}`}>{m.descricao}</p>,
    },
    m.efeito?.length > 0 && {
      title: 'Efeito Mecanico', icon: Sparkles, color: '#8b5cf6',
      content: (
        <div className="space-y-2">
          {m.efeito.map((e, i) => <p key={i} className={`font-mono text-sm ${textCls}`}>{e}</p>)}
        </div>
      ),
    },
  ].filter(Boolean);

  const monoBlock = (items, cls) => (
    <div className="space-y-1">
      {items.map((a, i) => <span key={i} className={`block font-mono text-xs ${cls}`}>{a}</span>)}
    </div>
  );

  const stats = [
    { icon: Tag, label: 'Escola', content: (
      <span className="px-3 py-1 rounded-full text-xs font-semibold"
        style={{ background: `${accent}20`, color: accent }}>
        {escolaLabels[m.escola] || m.escola}
      </span>
    )},
    m.tipo && { icon: Shield, label: 'Tipo', content: m.tipo },
    { icon: Zap, label: 'Custo PM', content: <span className={`font-mono font-semibold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>{m.custoPm}</span> },
    { icon: Target, label: 'Alcance', content: m.alcance },
    { icon: Clock, label: 'Duracao', content: m.duracao },
    m.nivelMinimo > 1 && { icon: BarChart3, label: 'Nivel Minimo', content: <span className="text-cyan-400 font-semibold">{m.nivelMinimo}</span> },
    m.exigencias && { icon: Shield, label: 'Exigencias', content: m.exigencias },
    m.focusRequisito?.length > 0 && { icon: Sparkles, label: 'Focus Requisito', content: monoBlock(m.focusRequisito, isLight ? 'text-amber-700' : 'text-amber-400') },
  ].filter(Boolean);

  return (
    <CatalogDetailLayout
      title={m.nome} icon={Sparkles} accentColor={accent}
      badges={badges} sections={sections} stats={stats}
      sidebarTitle="Ficha da Magia"
      onBack={onBack} onEdit={onEdit}
      loadingText="Carregando magia..."
    />
  );
};

export default VerMagiaTresDetView;
