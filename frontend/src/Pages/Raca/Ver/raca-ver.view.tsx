import { Dna, BookOpen, Coins, Zap } from 'lucide-react';
import { useTheme } from '../../../contexts/theme';
import { CatalogDetailLayout } from '../../../components/shared';
import type { CatalogDetailSection, CatalogDetailStat } from '../../../components/shared/CatalogDetailLayout';
import type { RacaNormalizada } from './raca-ver.model';

interface VerRacaViewProps {
  raca: RacaNormalizada | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onEdit: () => void;
}

const VerRacaView = ({ raca: r, loading, error, onBack, onEdit }: VerRacaViewProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (loading || error || !r) {
    return (
      <CatalogDetailLayout
        loading={loading} loadingText="Carregando raca..."
        error={error || (!loading && !r ? 'Raca nao encontrada' : undefined)}
        icon={Dna} title="" onBack={onBack} onEdit={onEdit}
      />
    );
  }

  const badges = [
    <span key="custo" className={`px-3 py-1 rounded-full text-xs font-semibold ${r.custo === 0
      ? (isLight ? 'bg-green-100 text-green-800' : 'bg-green-500/20 text-green-400')
      : (isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-400')
    }`}>{r.custo === 0 ? 'Gratuita' : `${r.custo} pts`}</span>,
  ];

  const bonusChip = (b: string, i: number) => (
    <span key={i} className={`block font-mono text-xs ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>{b}</span>
  );

  const sections: CatalogDetailSection[] = ([
    r.descricao && {
      title: 'Descricao', icon: BookOpen, color: '#d97706',
      content: <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{r.descricao}</p>,
    },
    r.bonus && r.bonus.length > 0 && {
      title: 'Bonus', icon: Zap, color: '#06b6d4',
      content: <div className="space-y-1">{r.bonus.map(bonusChip)}</div>,
    },
  ].filter(Boolean) as CatalogDetailSection[]);

  const costColor = r.custo === 0
    ? (isLight ? 'text-green-600' : 'text-green-400')
    : (isLight ? 'text-amber-600' : 'text-amber-400');

  const stats: CatalogDetailStat[] = [
    { icon: Coins, label: 'Custo', content: <span className={`font-mono font-semibold ${costColor}`}>{r.custo === 0 ? 'Gratuita' : `${r.custo} pontos`}</span> },
    ...((r.bonus && r.bonus.length > 0)
      ? r.bonus.map((b, i) => ({ icon: Zap, label: i === 0 ? 'Bonus' : ' ', content: bonusChip(b, i) }))
      : []),
  ];

  return (
    <CatalogDetailLayout
      title={r.nome} image={r.imagem} icon={Dna} accentColor="#06b6d4"
      badges={badges} sections={sections} stats={stats}
      onBack={onBack} onEdit={onEdit}
    />
  );
};

export default VerRacaView;
