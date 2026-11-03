import { useState, useEffect, useCallback } from 'react';
import StatCard from '../../../components/StatCard';
import { PageHeader, Badge, SearchBar, CatalogCard, CatalogCardSkeleton, CatalogPagination } from '../../../components/shared';
import ImageLightbox from '../../../components/ImageLightbox';
import Notification from '../../../components/Notification';
import { useTheme } from '../../../contexts/theme';
import { AlertTriangle, BarChart3, Tag } from 'lucide-react';
import type { VantagemDesvantagem } from '../../../types/api';

type BadgeVariant = 'purple' | 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'indigo' | 'cyan' | 'pink';

const tipoVariant: Record<string, BadgeVariant> = { 'ativa': 'blue', 'passiva': 'green', 'reacao': 'amber' };

interface DesvantagemListaViewProps {
  desvantagens: VantagemDesvantagem[];
  filteredDesvantagens: VantagemDesvantagem[];
  loading: boolean;
  error: string | null;
  nivelMaisComum: number | null;
  tipoMaisComum: string | null;
  buscarDesvantagens: (term: string) => void;
  clearError: () => void;
  onVerDesvantagem: (id: number | string) => void;
}

const DesvantagemListaView = ({
  desvantagens,
  filteredDesvantagens,
  loading,
  error,
  nivelMaisComum,
  tipoMaisComum,
  buscarDesvantagens,
  clearError,
  onVerDesvantagem,
}: DesvantagemListaViewProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (loading && desvantagens.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Desvantagens" subtitle="Fraquezas e desvantagens para personagens" icon={AlertTriangle} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CatalogCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  const displayDesvantagens = filteredDesvantagens?.length > 0 ? filteredDesvantagens : desvantagens;

  useEffect(() => { setPage(1); }, [displayDesvantagens]);

  const paginatedDesvantagens = displayDesvantagens.slice((page - 1) * perPage, page * perPage);

  const itemsWithImages = displayDesvantagens
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
        title="Desvantagens"
        subtitle="Fraquezas e desvantagens para personagens"
        icon={AlertTriangle}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total" value={desvantagens?.length || 0} icon={AlertTriangle} variant="primary" />
        <StatCard title="Nivel Mais Comum" value={nivelMaisComum || 1} icon={BarChart3} variant="secondary" />
        <StatCard title="Tipo Mais Comum" value={tipoMaisComum || '-'} icon={Tag} variant="accent" />
      </div>

      <SearchBar
        placeholder="Buscar desvantagens..."
        onChange={(texto) => buscarDesvantagens(texto)}
      />

      {displayDesvantagens.length === 0 ? (
        <div className="text-center py-16">
          <AlertTriangle size={48} className={`mx-auto mb-4 ${isLight ? 'text-slate-300' : 'text-slate-600'}`} />
          <p className={`font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Nenhuma desvantagem encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedDesvantagens.map((row, i) => {
            const tipos = Array.isArray(row.tipo) ? row.tipo : [];
            const elementos = Array.isArray(row.elemento) ? row.elemento : [];

            return (
              <CatalogCard
                key={row.id}
                image={row.imagem}
                icon={AlertTriangle}
                title={row.nome}
                delay={i}
                onClick={() => onVerDesvantagem(row.id)}
                onImageClick={row.imagem ? () => setGalleryIndex(displayDesvantagens.findIndex(item => item.id === row.id)) : undefined}
                headerBadge={
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-sm backdrop-blur-sm ${
                    isLight ? 'bg-red-100/90 text-red-800' : 'bg-red-500/30 text-red-300'
                  }`}>
                    {row.custo} pts
                  </span>
                }
              >
                <div className="flex flex-wrap gap-1 mt-1">
                  {tipos.map((t, j) => (
                    <Badge key={j} variant={tipoVariant[t] || 'slate'}>{t}</Badge>
                  ))}
                  {elementos.map((e, j) => (
                    <Badge key={`el-${j}`} variant="red">{e}</Badge>
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
        totalCount={displayDesvantagens.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPerPage(size); setPage(1); }}
        pageSizeOptions={[12, 24, 48]}
      />

      {galleryIndex !== null && displayDesvantagens[galleryIndex] && (
        <ImageLightbox
          src={displayDesvantagens[galleryIndex].imagem ?? ''}
          alt={displayDesvantagens[galleryIndex].nome ?? ''}
          title={displayDesvantagens[galleryIndex].nome ?? undefined}
          isOpen={true}
          onClose={() => setGalleryIndex(null)}
          onPrev={currentGalleryPos > 0 ? handlePrev : undefined}
          onNext={currentGalleryPos < itemsWithImages.length - 1 ? handleNext : undefined}
        />
      )}
    </div>
  );
};

export default DesvantagemListaView;
