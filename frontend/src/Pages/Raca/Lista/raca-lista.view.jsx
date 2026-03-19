import React from 'react';
import StatCard from '../../../components/StatCard.jsx';
import { PageHeader, Badge, SearchBar, CatalogCard, CatalogCardSkeleton } from '../../../components/shared';
import Notification from '../../../components/Notification.jsx';
import { Dna, Gift, Coins } from 'lucide-react';

const RacaListaView = ({
  racas,
  filteredRacas,
  loading,
  error,
  isLight,
  gratuitas,
  pagas,
  buscarRacas,
  clearError,
  navigate,
  generateRoute,
}) => {
  if (loading && racas.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Racas" subtitle="Racas disponiveis para personagens" icon={Dna} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CatalogCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const displayRacas = filteredRacas?.length > 0 ? filteredRacas : racas;

  return (
    <div className="animate-fade-in space-y-6">
      {error && (
        <Notification message={error} type="error" onClose={clearError} />
      )}

      <PageHeader
        title="Racas"
        subtitle="Racas disponiveis para personagens"
        icon={Dna}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total de Racas" value={racas?.length || 0} icon={Dna} variant="primary" />
        <StatCard title="Gratuitas" value={gratuitas} icon={Gift} variant="secondary" />
        <StatCard title="Com Custo" value={pagas} icon={Coins} variant="accent" />
      </div>

      <SearchBar
        placeholder="Buscar racas..."
        onChange={(texto) => buscarRacas(texto)}
      />

      {displayRacas.length === 0 ? (
        <div className="text-center py-16">
          <Dna size={48} className={`mx-auto mb-4 ${isLight ? 'text-slate-300' : 'text-slate-600'}`} />
          <p className={`font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Nenhuma raca encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayRacas.map((row, i) => (
            <CatalogCard
              key={row.id}
              image={row.imagem}
              icon={Dna}
              title={row.nome}
              subtitle={row.descricao}
              delay={i}
              onClick={() => navigate(generateRoute.verRaca(row.id))}
              headerBadge={
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-sm backdrop-blur-sm ${
                  row.custo === 0
                    ? (isLight ? 'bg-green-100/90 text-green-800' : 'bg-green-500/30 text-green-300')
                    : (isLight ? 'bg-amber-100/90 text-amber-800' : 'bg-amber-500/30 text-amber-300')
                }`}>
                  {row.custo === 0 ? 'Gratuita' : `${row.custo} pts`}
                </span>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RacaListaView;
