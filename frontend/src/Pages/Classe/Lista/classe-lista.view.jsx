import React, { useState, useEffect } from 'react';
import StatCard from '../../../components/StatCard.jsx';
import { PageHeader, SearchBar, CatalogCard, CatalogCardSkeleton, CatalogPagination } from '../../../components/shared';
import Notification from '../../../components/Notification.jsx';
import { Shield, Gift, Coins } from 'lucide-react';

const ClasseListaView = ({
  classes,
  filteredClasses,
  loading,
  error,
  isLight,
  gratuitas,
  pagas,
  buscarClasses,
  clearError,
  navigate,
  generateRoute,
}) => {
  if (loading && classes.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Classes" subtitle="Classes disponiveis para personagens" icon={Shield} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CatalogCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);

  const displayClasses = filteredClasses?.length > 0 ? filteredClasses : classes;

  useEffect(() => { setPage(1); }, [displayClasses]);

  const paginatedClasses = displayClasses.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="animate-fade-in space-y-6">
      {error && (
        <Notification message={error} type="error" onClose={clearError} />
      )}

      <PageHeader
        title="Classes"
        subtitle="Classes disponiveis para personagens"
        icon={Shield}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total de Classes" value={classes?.length || 0} icon={Shield} variant="primary" />
        <StatCard title="Gratuitas" value={gratuitas} icon={Gift} variant="secondary" />
        <StatCard title="Com Custo" value={pagas} icon={Coins} variant="accent" />
      </div>

      <SearchBar
        placeholder="Buscar classes..."
        onChange={(texto) => buscarClasses(texto)}
      />

      {displayClasses.length === 0 ? (
        <div className="text-center py-16">
          <Shield size={48} className={`mx-auto mb-4 ${isLight ? 'text-slate-300' : 'text-slate-600'}`} />
          <p className={`font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Nenhuma classe encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedClasses.map((row, i) => (
            <CatalogCard
              key={row.id}
              image={row.imagem}
              icon={Shield}
              title={row.nome}
              subtitle={row.descricao}
              delay={i}
              onClick={() => navigate(generateRoute.verClasse(row.id))}
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

      <CatalogPagination
        currentPage={page}
        pageSize={perPage}
        totalCount={displayClasses.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPerPage(size); setPage(1); }}
        pageSizeOptions={[12, 24, 48]}
      />
    </div>
  );
};

export default ClasseListaView;
