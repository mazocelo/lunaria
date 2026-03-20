import React, { useState, useEffect } from 'react';
import StatCard from '../../../components/StatCard.jsx';
import { PageHeader, Badge, SearchBar, CatalogCard, CatalogCardSkeleton, CatalogPagination } from '../../../components/shared';
import Notification from '../../../components/Notification.jsx';
import { Wand2, Swords, Heart, Flame } from 'lucide-react';

const categoriaLabels = {
  combate_fisico: 'Combate Físico',
  magia_ofensiva: 'Magia Ofensiva',
  magia_defensiva: 'Magia Defensiva',
  cura: 'Cura',
  suporte: 'Suporte',
  controle: 'Controle',
  utilidade: 'Utilidade',
  social: 'Social',
  crafting: 'Crafting',
};

const categoriaVariant = {
  combate_fisico: 'red',
  magia_ofensiva: 'purple',
  magia_defensiva: 'blue',
  cura: 'green',
  suporte: 'cyan',
  controle: 'amber',
  utilidade: 'slate',
  social: 'pink',
  crafting: 'amber',
};

const tipoVariant = { dano: 'red', cura: 'green', buff: 'cyan', debuff: 'amber', controle: 'purple' };

const HabilidadeListaView = ({
  habilidades,
  filteredHabilidades,
  loading,
  error,
  isLight,
  total,
  stats,
  buscarHabilidades,
  filtroCategoria,
  setFiltroCategoria,
  clearError,
  navigate,
  generateRoute,
}) => {
  if (loading && habilidades.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Habilidades" subtitle={`${total} habilidades no sistema de RPG`} icon={Wand2} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CatalogCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);

  const displayData = filteredHabilidades?.length > 0 || filteredHabilidades?.length === 0
    ? filteredHabilidades
    : habilidades;

  useEffect(() => { setPage(1); }, [displayData]);

  const paginatedData = displayData.slice((page - 1) * perPage, page * perPage);

  const categoriaOptions = Object.entries(categoriaLabels);

  return (
    <div className="animate-fade-in space-y-6">
      {error && <Notification message={error} type="error" onClose={clearError} />}

      <PageHeader
        title="Habilidades"
        subtitle={`${total} habilidades no sistema de RPG`}
        icon={Wand2}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total" value={total} icon={Wand2} variant="primary" />
        <StatCard title="Combate" value={(stats.categorias?.combate_fisico || 0) + (stats.categorias?.magia_ofensiva || 0)} icon={Swords} variant="accent" />
        <StatCard title="Cura/Suporte" value={(stats.categorias?.cura || 0) + (stats.categorias?.suporte || 0)} icon={Heart} variant="secondary" />
        <StatCard title="Crafting" value={stats.categorias?.crafting || 0} icon={Flame} variant="warning" />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            placeholder="Buscar habilidades por nome ou descricao..."
            onChange={(texto) => buscarHabilidades(texto)}
          />
        </div>
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className={`px-4 py-2 rounded-lg font-modern text-sm ${
            isLight
              ? 'bg-white border border-slate-300 text-slate-800'
              : 'bg-slate-800 border border-slate-600 text-white'
          }`}
        >
          <option value="">Todas as categorias</option>
          {categoriaOptions.map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {displayData.length === 0 ? (
        <div className="text-center py-16">
          <Wand2 size={48} className={`mx-auto mb-4 ${isLight ? 'text-slate-300' : 'text-slate-600'}`} />
          <p className={`font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Nenhuma habilidade encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedData.map((row, i) => (
            <CatalogCard
              key={row.id}
              image={row.imagem}
              icon={Wand2}
              title={row.nome}
              delay={i}
              onClick={() => navigate(generateRoute.verHabilidade(row.id))}
              headerBadge={
                <Badge variant={categoriaVariant[row.categoria] || 'slate'} className="shadow-sm backdrop-blur-sm">
                  {categoriaLabels[row.categoria] || row.categoria}
                </Badge>
              }
            >
              <div className="flex flex-wrap gap-1 mt-1">
                {row.tipo && <Badge variant={tipoVariant[row.tipo] || 'slate'}>{row.tipo}</Badge>}
                {row.elemento && <Badge variant="purple">{row.elemento}</Badge>}
              </div>
              <div className={`flex items-center gap-3 mt-1.5 text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <span className="text-cyan-500 font-semibold">Nv {row.nivel_requerido}</span>
                <span className={`px-1.5 py-0.5 rounded-full font-semibold ${
                  isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {row.custo_mana} MP
                </span>
                {row.classe && (
                  <span className={isLight ? 'text-slate-400' : 'text-slate-500'}>{row.classe.nome}</span>
                )}
              </div>
            </CatalogCard>
          ))}
        </div>
      )}

      <CatalogPagination
        currentPage={page}
        pageSize={perPage}
        totalCount={displayData.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPerPage(size); setPage(1); }}
        pageSizeOptions={[12, 24, 48]}
      />
    </div>
  );
};

export default HabilidadeListaView;
