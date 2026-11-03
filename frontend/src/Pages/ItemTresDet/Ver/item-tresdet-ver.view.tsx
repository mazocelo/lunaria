import { BookOpen, Tag, Coins, Zap, Package, Layers, Sparkles, ScrollText } from 'lucide-react';
import { useTheme } from '../../../contexts/theme';
import { CatalogDetailLayout, formatJson } from '../../../components/shared';
import type { CatalogDetailSection, CatalogDetailStat } from '../../../components/shared/CatalogDetailLayout';
import type { ItemTresDetNormalizado } from './item-tresdet-ver.model';

const TIPO_LABELS: Record<string, string> = {
  'arma': 'Arma',
  'armadura': 'Armadura',
  'acessorio': 'Acessorio',
  'consumivel': 'Consumivel',
  'pergaminho': 'Pergaminho',
  'mecha': 'Mecha',
};

interface RaridadeConfig { badge: string; badgeLight: string; accent: string }

const RARIDADE_COLORS: Record<string, RaridadeConfig> = {
  'comum': { badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30', badgeLight: 'bg-gray-100 text-gray-700 border-gray-300', accent: '#64748b' },
  'incomum': { badge: 'bg-green-500/20 text-green-400 border-green-500/30', badgeLight: 'bg-green-100 text-green-700 border-green-300', accent: '#22c55e' },
  'raro': { badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30', badgeLight: 'bg-blue-100 text-blue-700 border-blue-300', accent: '#3b82f6' },
  'lendario': { badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', badgeLight: 'bg-amber-100 text-amber-700 border-amber-300', accent: '#f59e0b' },
  'variavel': { badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30', badgeLight: 'bg-purple-100 text-purple-700 border-purple-300', accent: '#8b5cf6' },
};

const capitalize = (str: string | undefined | null): string =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

interface VerItemTresDetViewProps {
  item: ItemTresDetNormalizado | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onEdit: () => void;
}

const VerItemTresDetView = ({ item, loading, error, onBack, onEdit }: VerItemTresDetViewProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (loading || error || !item) {
    return (
      <CatalogDetailLayout
        loading={loading} loadingText="Carregando item..."
        error={error || (!loading && !item ? 'Item nao encontrado' : undefined)}
        icon={Package} title="" onBack={onBack} onEdit={onEdit}
      />
    );
  }

  const raridadeConfig = RARIDADE_COLORS[item.raridade] || RARIDADE_COLORS['comum'];

  const badges = [
    <span key="rar" className={`relative overflow-hidden px-3 py-1 rounded-full text-xs font-semibold border ${isLight ? raridadeConfig.badgeLight : raridadeConfig.badge}`}>
      {capitalize(item.raridade)}
    </span>,
    <span key="tipo" className={`px-3 py-1 rounded-full text-xs font-modern ${isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/15 text-indigo-400'}`}>
      {TIPO_LABELS[item.tipo] || item.tipo}
    </span>,
    item.empilhavel && (
      <span key="emp" className={`px-3 py-1 rounded-full text-xs font-modern ${isLight ? 'bg-green-50 text-green-600' : 'bg-green-500/15 text-green-400'}`}>
        Empilhavel
      </span>
    ),
  ].filter(Boolean);

  const textCls = isLight ? 'text-slate-700' : 'text-slate-300';
  const sections: CatalogDetailSection[] = ([
    item.descricao && {
      title: 'Descricao', icon: BookOpen, color: '#d97706',
      content: <p className={`font-modern leading-relaxed ${textCls}`}>{item.descricao}</p>,
    },
    item.efeito && {
      title: 'Efeito', icon: Zap, color: '#8b5cf6',
      content: <p className={`font-modern leading-relaxed ${textCls}`}>{item.efeito}</p>,
    },
    item.poderes && {
      title: 'Poderes', icon: Sparkles, color: '#eab308',
      content: (() => {
        const parsed = formatJson(item.poderes);
        if (!parsed) return null;
        if (typeof parsed === 'string') return <p className={`font-modern leading-relaxed ${textCls}`}>{parsed}</p>;
        return <pre className={`font-mono text-xs whitespace-pre-wrap ${textCls}`}>{JSON.stringify(parsed, null, 2)}</pre>;
      })(),
    },
    item.magiaVinculada && {
      title: 'Magia Vinculada', icon: ScrollText, color: '#c2410c',
      content: <p className={`font-modern leading-relaxed italic ${textCls}`}>{item.magiaVinculada}</p>,
    },
  ].filter(Boolean) as CatalogDetailSection[]);

  const stats: CatalogDetailStat[] = ([
    { icon: Tag, label: 'Tipo', content: TIPO_LABELS[item.tipo] || item.tipo },
    { icon: Tag, label: 'Raridade', content: <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${isLight ? raridadeConfig.badgeLight : raridadeConfig.badge}`}>{capitalize(item.raridade)}</span> },
    item.custoPe > 0 && { icon: Zap, label: 'Custo PE', content: <span className={`font-mono font-semibold ${isLight ? 'text-purple-600' : 'text-purple-400'}`}>{item.custoPe}</span> },
    item.precoMoedas > 0 && { icon: Coins, label: 'Preco (Moedas)', content: <span className={`font-mono font-semibold ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>{item.precoMoedas}</span> },
    { icon: Layers, label: 'Empilhavel', content: item.empilhavel ? 'Sim' : 'Nao' },
    item.magiaVinculada && { icon: ScrollText, label: 'Magia Vinculada', content: item.magiaVinculada },
  ].filter(Boolean) as CatalogDetailStat[]);

  return (
    <CatalogDetailLayout
      title={item.nome}
      subtitle={`#${item.id}`}
      image={item.imagem}
      icon={Package}
      rarity={capitalize(item.raridade)}
      accentColor={raridadeConfig.accent}
      badges={badges}
      sections={sections}
      stats={stats}
      sidebarTitle="Ficha Tecnica"
      onBack={onBack}
      onEdit={onEdit}
    />
  );
};

export default VerItemTresDetView;
