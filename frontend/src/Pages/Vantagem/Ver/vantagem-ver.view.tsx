import { Sparkles, BookOpen, Zap, Coins, BarChart3, Tag, Swords, Shield } from 'lucide-react';
import { useTheme } from '../../../contexts/theme';
import { CatalogDetailLayout, ChipGroup } from '../../../components/shared';
import type { CatalogDetailSection, CatalogDetailStat } from '../../../components/shared/CatalogDetailLayout';
import type { VantagemNormalizada } from './vantagem-ver.model';

interface VerVantagemViewProps {
  vantagem: VantagemNormalizada | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onEdit: () => void;
}

const VerVantagemView = ({ vantagem: v, loading, error, onBack, onEdit }: VerVantagemViewProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (loading || error || !v) {
    return (
      <CatalogDetailLayout
        loading={loading} loadingText="Carregando vantagem..."
        error={error || (!loading && !v ? 'Vantagem nao encontrada' : undefined)}
        icon={Sparkles} title="" onBack={onBack} onEdit={onEdit}
      />
    );
  }

  const badges = [
    <span key="cost" className={`px-3 py-1 rounded-full text-xs font-semibold ${
      v.custo > 0 ? (isLight ? 'bg-green-100 text-green-800' : 'bg-green-500/20 text-green-400')
      : v.custo < 0 ? (isLight ? 'bg-red-100 text-red-800' : 'bg-red-500/20 text-red-400')
      : (isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-700/50 text-slate-300')
    }`}>{v.custo > 0 ? `+${v.custo}` : v.custo} pts</span>,
    ...v.tipos.map((t, i) => (
      <span key={`t${i}`} className={`px-3 py-1 rounded-full text-xs font-modern ${
        t === 'ativa' ? (isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/15 text-blue-400')
        : t === 'passiva' ? (isLight ? 'bg-green-50 text-green-700' : 'bg-green-500/15 text-green-400')
        : (isLight ? 'bg-amber-50 text-amber-700' : 'bg-amber-500/15 text-amber-400')
      }`}>{t}</span>
    )),
    v.usar && <span key="usar" className={`px-3 py-1 rounded-full text-xs font-modern ${isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/15 text-indigo-400'}`}>{v.usar}</span>,
  ].filter(Boolean);

  const textCls = isLight ? 'text-slate-700' : 'text-slate-300';
  const sections: CatalogDetailSection[] = [
    v.descricao && { title: 'Descricao', icon: BookOpen, color: '#d97706',
      content: <p className={`font-modern leading-relaxed ${textCls}`}>{v.descricao}</p> },
    v.efeito && v.efeito.length > 0 && { title: 'Efeito', icon: Zap, color: '#22c55e',
      content: <div className="space-y-2">{v.efeito.map((e, i) => <p key={i} className={`font-mono text-sm ${textCls}`}>{e}</p>)}</div> },
  ].filter(Boolean) as CatalogDetailSection[];

  const monoBlock = (items: string[], cls: string) => (
    <div className="space-y-1">{items.map((a, i) => <span key={i} className={`block font-mono text-xs ${cls}`}>{a}</span>)}</div>
  );

  const stats: CatalogDetailStat[] = ([
    { icon: Coins, label: 'Custo', content: (
      <span className={`font-mono font-semibold ${
        v.custo > 0 ? (isLight ? 'text-green-600' : 'text-green-400')
        : v.custo < 0 ? (isLight ? 'text-red-600' : 'text-red-400')
        : (isLight ? 'text-slate-600' : 'text-slate-300')
      }`}>{v.custo > 0 ? `+${v.custo}` : v.custo} pontos</span>
    )},
    { icon: BarChart3, label: 'Nivel', content: <span className="text-cyan-400 font-semibold">{v.nivel || 1}</span> },
    v.tipos.length > 0 && { icon: Tag, label: 'Tipo', content: <ChipGroup items={v.tipos} colorClass={isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/15 text-blue-400'} /> },
    v.elementos.length > 0 && { icon: Zap, label: 'Elemento', content: <ChipGroup items={v.elementos} colorClass={isLight ? 'bg-purple-50 text-purple-700' : 'bg-purple-500/15 text-purple-400'} /> },
    v.danoBase && { icon: Swords, label: 'Dano Base', content: <span className={`font-mono font-semibold ${isLight ? 'text-red-600' : 'text-red-400'}`}>{v.danoBase}</span> },
    v.bonus && v.bonus.length > 0 && { icon: Shield, label: 'Bonus', content: monoBlock(v.bonus, isLight ? 'text-cyan-700' : 'text-cyan-400') },
    v.restricao && v.restricao.length > 0 && { icon: Shield, label: 'Restricao', content: monoBlock(v.restricao, isLight ? 'text-amber-700' : 'text-amber-400') },
    v.requisitos && v.requisitos.length > 0 && { icon: Shield, label: 'Requisitos', content: monoBlock(v.requisitos, isLight ? 'text-amber-700' : 'text-amber-400') },
  ].filter(Boolean) as CatalogDetailStat[]);

  return (
    <CatalogDetailLayout
      title={v.nome}
      image={v.imagem}
      icon={Sparkles}
      accentColor="#22c55e"
      badges={badges}
      sections={sections}
      stats={stats}
      onBack={onBack}
      onEdit={onEdit}
    />
  );
};

export default VerVantagemView;
