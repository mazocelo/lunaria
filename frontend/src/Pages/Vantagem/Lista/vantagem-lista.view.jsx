import React, { useState, useEffect } from 'react';
import StatCard from '../../../components/StatCard.jsx';
import { PageHeader, Badge, SearchBar, CatalogCard, CatalogCardSkeleton, CatalogPagination } from '../../../components/shared';
import Notification from '../../../components/Notification.jsx';
import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

const tipoVariant = { 'ativa': 'blue', 'passiva': 'green', 'reacao': 'amber' };

const VantagemListaView = ({
  vantagens,
  filteredVantagens,
  loading,
  error,
  isLight,
  positivas,
  negativas,
  buscarVantagens,
  clearError,
  navigate,
  generateRoute,
}) => {
  if (loading && vantagens.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Vantagens" subtitle="Habilidades e poderes para personagens" icon={Sparkles} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CatalogCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);

  const displayVantagens = filteredVantagens?.length > 0 ? filteredVantagens : vantagens;

  useEffect(() => { setPage(1); }, [displayVantagens]);

  const paginatedVantagens = displayVantagens.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="animate-fade-in space-y-6">
      {error && (
        <Notification message={error} type="error" onClose={clearError} />
      )}

      <PageHeader
        title="Vantagens"
        subtitle="Habilidades e poderes para personagens"
        icon={Sparkles}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total de Vantagens" value={vantagens?.length || 0} icon={Sparkles} variant="primary" />
        <StatCard title="Positivas" value={positivas} icon={TrendingUp} variant="secondary" />
        <StatCard title="Negativas" value={negativas} icon={TrendingDown} variant="accent" />
      </div>

      <SearchBar
        placeholder="Buscar vantagens..."
        onChange={(texto) => buscarVantagens(texto)}
      />

      {displayVantagens.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles size={48} className={`mx-auto mb-4 ${isLight ? 'text-slate-300' : 'text-slate-600'}`} />
          <p className={`font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Nenhuma vantagem encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedVantagens.map((row, i) => {
            const tipos = Array.isArray(row.tipo) ? row.tipo : [];
            const elementos = Array.isArray(row.elemento) ? row.elemento : [];

            return (
              <CatalogCard
                key={row.id}
                image={row.imagem}
                icon={Sparkles}
                title={row.nome}
                delay={i}
                onClick={() => navigate(generateRoute.verVantagem(row.id))}
                headerBadge={
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-sm backdrop-blur-sm ${
                    row.custo > 0
                      ? (isLight ? 'bg-green-100/90 text-green-800' : 'bg-green-500/30 text-green-300')
                      : row.custo < 0
                      ? (isLight ? 'bg-red-100/90 text-red-800' : 'bg-red-500/30 text-red-300')
                      : (isLight ? 'bg-slate-100/90 text-slate-700' : 'bg-slate-600/50 text-slate-300')
                  }`}>
                    {row.custo > 0 ? `+${row.custo}` : row.custo} pts
                  </span>
                }
              >
                <div className="flex flex-wrap gap-1 mt-1">
                  {tipos.map((t, j) => (
                    <Badge key={j} variant={tipoVariant[t] || 'slate'}>{t}</Badge>
                  ))}
                  {elementos.map((e, j) => (
                    <Badge key={`el-${j}`} variant="purple">{e}</Badge>
                  ))}
                </div>
                <div className={`mt-1.5 text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span className="text-cyan-500 font-semibold">Nv {row.nivel || 1}</span>
                </div>
              </CatalogCard>
            );
          })}
        </div>
      )}

      <CatalogPagination
        currentPage={page}
        pageSize={perPage}
        totalCount={displayVantagens.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPerPage(size); setPage(1); }}
        pageSizeOptions={[12, 24, 48]}
      />
    </div>
  );
};

export default VantagemListaView;
