import React, { useState, useCallback } from 'react';
import StatCard from '../../../components/StatCard.jsx';
import { PageHeader, Badge, SearchBar, CatalogCard, CatalogCardSkeleton, CatalogPagination } from '../../../components/shared';
import ImageLightbox from '../../../components/ImageLightbox.jsx';
import Notification from '../../../components/Notification.jsx';
import { Skull, Circle, Gem, Leaf } from 'lucide-react';

const raridadeVariant = {
  'Comum': 'slate',
  'Incomum': 'green',
  'Raro': 'blue',
  'Muito Raro': 'purple',
  'Épico': 'pink',
  'Lendário': 'amber',
  'Artefato': 'red',
};

const MonstroListaView = ({
  monstros,
  filteredMonstros,
  loading,
  error,
  searchTerm,
  totalCount,
  currentPage,
  pageSize,
  isLight,
  raridades,
  handlePageChange,
  handlePageSizeChange,
  buscarMonstros,
  clearError,
  navigate,
  generateRoute,
}) => {
  const [galleryIndex, setGalleryIndex] = useState(null);

  const hasFilters = !!searchTerm;
  const displayMonstros = hasFilters ? filteredMonstros : monstros;

  // Build list of items with images for gallery navigation
  const itemsWithImages = displayMonstros
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

  if (loading && monstros.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Monstros" subtitle="Bestiario do mundo de Lunaria" icon={Skull} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CatalogCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {error && (
        <Notification message={error} type="error" onClose={clearError} />
      )}

      <PageHeader
        title="Monstros"
        subtitle="Bestiario do mundo de Lunaria"
        icon={Skull}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total" value={totalCount || monstros?.length || 0} icon={Skull} variant="primary" />
        <StatCard title="Comuns" value={raridades['Comum'] || 0} icon={Circle} variant="secondary" />
        <StatCard title="Raros+" value={(raridades['Raro'] || 0) + (raridades['Épico'] || 0) + (raridades['Lendário'] || 0)} icon={Gem} variant="accent" />
        <StatCard title="Incomuns" value={raridades['Incomum'] || 0} icon={Leaf} variant="secondary" />
      </div>

      <SearchBar
        placeholder="Buscar monstros..."
        onChange={(texto) => buscarMonstros(texto)}
      />

      {displayMonstros.length === 0 ? (
        <div className="text-center py-16">
          <Skull size={48} className={`mx-auto mb-4 ${isLight ? 'text-slate-300' : 'text-slate-600'}`} />
          <p className={`font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Nenhum monstro encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayMonstros.map((row, i) => {
            const rarNome = row.raridade_rel?.nome || 'Comum';
            const tipos = Array.isArray(row.tipo) ? row.tipo : [];
            const elementos = Array.isArray(row.elemento) ? row.elemento : [];

            return (
              <CatalogCard
                key={row.id}
                image={row.imagem}
                icon={Skull}
                title={row.nome}
                rarity={rarNome}
                delay={i}
                onClick={() => navigate(generateRoute.verMonstro(row.id))}
                onImageClick={row.imagem ? () => setGalleryIndex(i) : undefined}
                headerBadge={
                  <Badge variant={raridadeVariant[rarNome] || 'slate'} className="shadow-sm backdrop-blur-sm">
                    {rarNome}
                  </Badge>
                }
              >
                <div className="flex flex-wrap gap-1 mt-1">
                  {tipos.map((t, j) => (
                    <Badge key={j} variant="amber">{t}</Badge>
                  ))}
                  {elementos.map((e, j) => (
                    <Badge key={`el-${j}`} variant="red">{e}</Badge>
                  ))}
                  {row.categoria_rel?.nome && (
                    <Badge variant="indigo">{row.categoria_rel.nome}</Badge>
                  )}
                </div>
                <div className={`flex items-center gap-3 mt-1.5 text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span className="text-cyan-500 font-semibold">Nv {row.nivel_min}-{row.nivel_max}</span>
                  <span className="text-red-400 font-semibold">HP {row.hp_base}</span>
                  {row.dano_base && <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>DMG {row.dano_base}</span>}
                  <span className="text-amber-400 font-semibold">XP {row.xp_base}</span>
                </div>
              </CatalogCard>
            );
          })}
        </div>
      )}

      <CatalogPagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={[12, 24, 48, 100]}
      />

      {/* Gallery lightbox with prev/next navigation */}
      {galleryIndex !== null && displayMonstros[galleryIndex] && (
        <ImageLightbox
          src={displayMonstros[galleryIndex].imagem}
          alt={displayMonstros[galleryIndex].nome}
          title={displayMonstros[galleryIndex].nome}
          isOpen={true}
          onClose={() => setGalleryIndex(null)}
          onPrev={currentGalleryPos > 0 ? handlePrev : undefined}
          onNext={currentGalleryPos < itemsWithImages.length - 1 ? handleNext : undefined}
        />
      )}
    </div>
  );
};

export default MonstroListaView;
