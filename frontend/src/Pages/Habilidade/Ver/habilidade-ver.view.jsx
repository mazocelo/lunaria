import React from 'react';
import { Zap, BookOpen, Sparkles, BarChart3, FlaskConical, Swords, Tag, Shield, Target, Clock, Flame, Brain, ClipboardList } from 'lucide-react';
import { useTheme } from '../../../contexts/theme.jsx';
import { CatalogDetailLayout, formatObjectDisplay } from '../../../components/shared';

// ── Category mappings (visual config, local to View) ─────
const categoriaColors = {
  combate_fisico: '#ef4444', magia_ofensiva: '#8b5cf6', magia_defensiva: '#3b82f6',
  cura: '#22c55e', suporte: '#06b6d4', controle: '#f59e0b',
  utilidade: '#64748b', social: '#ec4899', crafting: '#f97316',
};
const categoriaLabels = {
  combate_fisico: 'Combate Físico', magia_ofensiva: 'Magia Ofensiva', magia_defensiva: 'Magia Defensiva',
  cura: 'Cura', suporte: 'Suporte', controle: 'Controle',
  utilidade: 'Utilidade', social: 'Social', crafting: 'Crafting',
};

// ── Badge helpers ─────────────────────────────────────────
const catBadge = (categoria) => {
  const color = categoriaColors[categoria] || '#8b5cf6';
  return (
    <span key="cat" className="px-3 py-1 rounded-full text-xs font-semibold"
      style={{ background: `${color}20`, color }}>{categoriaLabels[categoria] || categoria}</span>
  );
};

const simpleBadge = (key, label, isLight, light, dark) => (
  <span key={key} className={`px-3 py-1 rounded-full text-xs font-modern ${isLight ? light : dark}`}>{label}</span>
);

// ── Crafting recipe card ──────────────────────────────────
const RecipeCard = ({ receita, isLight }) => (
  <div className={`p-4 rounded-lg ${isLight ? 'bg-white border border-orange-200/50' : 'bg-slate-800/50 border border-orange-500/10'}`}>
    <div className="flex items-center justify-between mb-2">
      <span className={`font-modern font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>{receita.nome}</span>
      <span className={`text-xs font-mono px-2 py-0.5 rounded ${isLight ? 'bg-orange-100 text-orange-700' : 'bg-orange-500/20 text-orange-400'}`}>
        Nv. {receita.nivel_requerido || 1} | {receita.tempo_minutos || '?'}min | DC {receita.dificuldade || '?'}
      </span>
    </div>
    {receita.descricao && (
      <p className={`text-xs font-modern mb-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{receita.descricao}</p>
    )}
    {receita.ingredientes_rel?.length > 0 && (
      <div className="mt-2">
        <span className={`text-[10px] uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Ingredientes</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {receita.ingredientes_rel.map((ri, j) => (
            <span key={j} className={`px-2 py-0.5 rounded text-[11px] font-modern ${isLight ? 'bg-green-50 text-green-700' : 'bg-green-500/15 text-green-400'}`}>
              {ri.ingrediente?.nome || `ID ${ri.ingrediente_id}`} x{ri.quantidade}
            </span>
          ))}
        </div>
      </div>
    )}
    {receita.ferramentas_rel?.length > 0 && (
      <div className="mt-2">
        <span className={`text-[10px] uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Ferramentas</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {receita.ferramentas_rel.map((rf, j) => (
            <span key={j} className={`px-2 py-0.5 rounded text-[11px] font-modern ${isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/15 text-blue-400'}`}>
              {rf.ferramenta?.nome || `ID ${rf.ferramenta_id}`}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);

// ── Main view ─────────────────────────────────────────────
const VerHabilidadeView = ({ habilidade: h, loading, error, onBack, onEdit }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (loading || error || !h) {
    return (
      <CatalogDetailLayout
        loading={loading} loadingText="Carregando habilidade..."
        error={error || (!loading && !h ? 'Habilidade não encontrada' : undefined)}
        icon={Zap} title="" onBack={onBack} onEdit={onEdit}
      />
    );
  }

  const accent = categoriaColors[h.categoria] || '#8b5cf6';
  const preRequisitoItems = formatObjectDisplay(h.preRequisitos);

  const mono = (items, color) => (
    <div className="space-y-2">
      {items.map((e, i) => <p key={i} className={`font-mono text-sm ${color}`}>{e}</p>)}
    </div>
  );

  // ── Badges ──
  const badges = [
    catBadge(h.categoria),
    h.tipo && simpleBadge('tipo', h.tipo, isLight, 'bg-blue-50 text-blue-700', 'bg-blue-500/15 text-blue-400'),
    h.elemento && simpleBadge('elem', h.elemento, isLight, 'bg-purple-50 text-purple-700', 'bg-purple-500/15 text-purple-400'),
    h.usaConcentracao && simpleBadge('conc', 'Concentração', isLight, 'bg-amber-50 text-amber-700', 'bg-amber-500/15 text-amber-400'),
  ].filter(Boolean);

  // ── Sections ──
  const textCls = isLight ? 'text-slate-700' : 'text-slate-300';
  const sections = [
    h.descricao && { title: 'Descrição', icon: BookOpen, color: '#d97706',
      content: <p className={`font-modern leading-relaxed ${textCls}`}>{h.descricao}</p> },
    h.efeito?.length > 0 && { title: 'Efeito', icon: Sparkles, color: '#8b5cf6',
      content: mono(h.efeito, textCls) },
    h.escalamento?.length > 0 && { title: 'Escalamento', icon: BarChart3, color: '#3b82f6',
      content: mono(h.escalamento, textCls) },
    h.receitas?.length > 0 && { title: `Receitas de Crafting (${h.receitas.length})`, icon: FlaskConical, color: '#22c55e',
      content: <div className="space-y-4">{h.receitas.map((r, i) => <RecipeCard key={r.id || i} receita={r} isLight={isLight} />)}</div> },
  ].filter(Boolean);

  // ── Stats ──
  const monoBlock = (items, cls) => <div className="space-y-1">{items.map((a, i) => <span key={i} className={`block font-mono text-xs ${cls}`}>{a}</span>)}</div>;

  const stats = [
    { icon: Tag, label: 'Categoria', content: catBadge(h.categoria) },
    h.tipo && { icon: Swords, label: 'Tipo', content: h.tipo },
    h.nivelRequerido && { icon: BarChart3, label: 'Nível Requerido', content: <span className="text-cyan-400 font-semibold">{h.nivelRequerido}</span> },
    h.custoMana > 0 && { icon: Zap, label: 'Custo de Mana', content: <span className={`font-mono font-semibold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>{h.custoMana}</span> },
    h.danoBase && { icon: Swords, label: 'Dano Base', content: <span className={`font-mono font-semibold ${isLight ? 'text-red-600' : 'text-red-400'}`}>{h.danoBase}</span> },
    h.elemento && { icon: Flame, label: 'Elemento', content: h.elemento },
    h.alvo && { icon: Target, label: 'Alvo', content: h.alvo },
    h.alcance && { icon: Target, label: 'Alcance', content: h.alcance },
    h.tempoConjuracao && { icon: Clock, label: 'Tempo de Conjuração', content: h.tempoConjuracao },
    h.cooldownTurnos > 0 && { icon: Clock, label: 'Cooldown', content: `${h.cooldownTurnos} turno${h.cooldownTurnos > 1 ? 's' : ''}` },
    h.usosPorDescanso && { icon: Zap, label: 'Usos por Descanso', content: h.usosPorDescanso },
    h.escolaMagia && { icon: Brain, label: 'Escola Mágica', content: h.escolaMagia },
    h.savingThrow && { icon: Shield, label: 'Saving Throw', content: h.savingThrow },
    h.classeNome && { icon: Shield, label: 'Classe', content: h.classeNome },
    h.racaNome && { icon: Tag, label: 'Raça', content: h.racaNome },
    h.areaEfeito?.length > 0 && { icon: Target, label: 'Área de Efeito', content: monoBlock(h.areaEfeito, isLight ? 'text-cyan-700' : 'text-cyan-400') },
    h.componenteMaterial?.length > 0 && { icon: Sparkles, label: 'Componente Material', content: monoBlock(h.componenteMaterial, isLight ? 'text-amber-700' : 'text-amber-400') },
    preRequisitoItems?.length > 0 && { icon: ClipboardList, label: 'Pré-requisitos', content: monoBlock(preRequisitoItems, isLight ? 'text-amber-700' : 'text-amber-400') },
  ].filter(Boolean);

  return (
    <CatalogDetailLayout
      title={h.nome} image={h.imagem} icon={Zap} accentColor={accent}
      badges={badges} sections={sections} stats={stats}
      onBack={onBack} onEdit={onEdit}
      loadingText="Carregando habilidade..."
    />
  );
};

export default VerHabilidadeView;
