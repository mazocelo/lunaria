import React, { useState, useEffect, useCallback } from 'react';
import StatCard from '../../../components/StatCard.jsx';
import { PageHeader, Badge, SearchBar, CatalogCard, CatalogCardSkeleton, CatalogPagination } from '../../../components/shared';
import ImageLightbox from '../../../components/ImageLightbox.jsx';
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

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [galleryIndex, setGalleryIndex] = useState(null);

  const displayRacas = filteredRacas?.length > 0 ? filteredRacas : racas;

  useEffect(() => { setPage(1); }, [displayRacas]);

  const paginatedRacas = displayRacas.slice((page - 1) * perPage, page * perPage);

  // Build list of items with images for gallery navigation
  const itemsWithImages = displayRacas
    .map((m, i) => ({ index: i, src: m.imagem, title: m.nome }))
    .filter(item => item.src);

  const currentGalleryPos = galleryIndex !== null
    ? itemsWithImages.findIndex(item => item.index === galleryIndex)
    : -1;

  const handlePrev = useCallback(() => {
    if (currentGalleryPos > 0) {
      setGalleryIndex(itemsWithImages[currentGalleryPos - 1].index);
    }
  }, [currentGalleryPos, itemsWithImages]);

  const handleNext = useCallback(() => {
    if (currentGalleryPos < itemsWithImages.length - 1) {
      setGalleryIndex(itemsWithImages[currentGalleryPos + 1].index);
    }
  }, [currentGalleryPos, itemsWithImages]);

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
          {paginatedRacas.map((row, i) => (
            <CatalogCard
              key={row.id}
              image={row.imagem}
              icon={Dna}
              title={row.nome}
              subtitle={row.descricao}
              delay={i}
              onClick={() => navigate(generateRoute.verRaca(row.id))}
              onImageClick={row.imagem ? () => setGalleryIndex(displayRacas.findIndex(item => item.id === row.id)) : undefined}
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
        totalCount={displayRacas.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPerPage(size); setPage(1); }}
        pageSizeOptions={[12, 24, 48]}
      />

      {/* Gallery lightbox with prev/next navigation */}
      {galleryIndex !== null && displayRacas[galleryIndex] && (
        <ImageLightbox
          src={displayRacas[galleryIndex].imagem}
          alt={displayRacas[galleryIndex].nome}
          title={displayRacas[galleryIndex].nome}
          isOpen={true}
          onClose={() => setGalleryIndex(null)}
          onPrev={currentGalleryPos > 0 ? handlePrev : undefined}
          onNext={currentGalleryPos < itemsWithImages.length - 1 ? handleNext : undefined}
        />
      )}
    </div>
  );
};

export default RacaListaView;
