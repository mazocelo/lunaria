import { useState, useEffect, useCallback } from 'react';
import StatCard from '../../../components/StatCard';
import { PageHeader, Badge, SearchBar, CatalogCard, CatalogCardSkeleton, CatalogPagination } from '../../../components/shared';
import ImageLightbox from '../../../components/ImageLightbox';
import Notification from '../../../components/Notification';
import { useTheme } from '../../../contexts/theme';
import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import type { VantagemDesvantagem } from '../../../types/api';

type BadgeVariant = 'purple' | 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'indigo' | 'cyan' | 'pink';

const tipoVariant: Record<string, BadgeVariant> = { 'ativa': 'blue', 'passiva': 'green', 'reacao': 'amber' };

interface VantagemListaViewProps {
  vantagens: VantagemDesvantagem[];
  filteredVantagens: VantagemDesvantagem[];
  loading: boolean;
  error: string | null;
  positivas: number;
  negativas: number;
  buscarVantagens: (term: string) => void;
  clearError: () => void;
  onVerVantagem: (id: number | string) => void;
}

const VantagemListaView = ({
  vantagens,
  filteredVantagens,
  loading,
  error,
  positivas,
  negativas,
  buscarVantagens,
  clearError,
  onVerVantagem,
}: VantagemListaViewProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

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
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  const displayVantagens = filteredVantagens?.length > 0 ? filteredVantagens : vantagens;

  useEffect(() => { setPage(1); }, [displayVantagens]);

  const paginatedVantagens = displayVantagens.slice((page - 1) * perPage, page * perPage);

  // Build list of items with images for gallery navigation
  const itemsWithImages = displayVantagens
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
                onClick={() => onVerVantagem(row.id)}
                onImageClick={row.imagem ? () => setGalleryIndex(displayVantagens.findIndex(item => item.id === row.id)) : undefined}
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

      {/* Gallery lightbox with prev/next navigation */}
      {galleryIndex !== null && displayVantagens[galleryIndex] && (
        <ImageLightbox
          src={displayVantagens[galleryIndex].imagem ?? ''}
          alt={displayVantagens[galleryIndex].nome ?? ''}
          title={displayVantagens[galleryIndex].nome ?? undefined}
          isOpen={true}
          onClose={() => setGalleryIndex(null)}
          onPrev={currentGalleryPos > 0 ? handlePrev : undefined}
          onNext={currentGalleryPos < itemsWithImages.length - 1 ? handleNext : undefined}
        />
      )}
    </div>
  );
};

export default VantagemListaView;
