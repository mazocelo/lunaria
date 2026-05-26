import { useState, useCallback } from 'react';
import StatCard from '../../../components/StatCard';
import Notification from '../../../components/Notification';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { PageHeader, Badge, CatalogCard, CatalogCardSkeleton, CatalogPagination } from '../../../components/shared';
import ImageLightbox from '../../../components/ImageLightbox';
import { useTheme } from '../../../contexts/theme';
import { Sword, Eye, Pencil, Trash2, Gem, Trophy, Flame, Sparkles } from 'lucide-react';
import type { Equipamento, EquipamentoRel } from './equipamento-lista.model';

type BadgeVariant = 'purple' | 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'indigo' | 'cyan' | 'pink';

const raridadeVariant: Record<string, BadgeVariant> = {
  'Comum': 'slate',
  'Incomum': 'green',
  'Raro': 'blue',
  'Muito Raro': 'purple',
  'Épico': 'pink',
  'Lendário': 'amber',
  'Artefato': 'red',
  'Variável': 'slate',
};

interface EquipamentoListaViewProps {
  equipamentos: Equipamento[];
  displayEquipamentos: Equipamento[];
  loading: boolean;
  error: string | null;
  categoriaFilter: string;
  raridadeFilter: string;
  currentPage?: number;
  pageSize?: number;
  totalCount?: number;
  raridades: EquipamentoRel[];
  categorias: EquipamentoRel[];
  showDeleteModal: boolean;
  equipToDelete: Equipamento | null;
  deleteLoading: boolean;
  setCategoriaFilter: (value: string) => void;
  setRaridadeFilter: (value: string) => void;
  handlePageChange?: (page: number) => void;
  handlePageSizeChange?: (size: number) => void;
  handleDeleteClick: (row: Equipamento) => void;
  handleConfirmDelete: () => void;
  handleCancelDelete: () => void;
  countByRaridade: (nome: string) => number;
  clearError: () => void;
  onVerEquipamento: (id: number | string) => void;
  onEditarEquipamento: (id: number | string) => void;
}

const EquipamentoListaView = ({
  equipamentos,
  displayEquipamentos,
  loading,
  error,
  categoriaFilter,
  raridadeFilter,
  currentPage,
  pageSize,
  totalCount,
  raridades,
  categorias,
  showDeleteModal,
  equipToDelete,
  deleteLoading,
  setCategoriaFilter,
  setRaridadeFilter,
  handlePageChange,
  handlePageSizeChange,
  handleDeleteClick,
  handleConfirmDelete,
  handleCancelDelete,
  countByRaridade,
  clearError,
  onVerEquipamento,
  onEditarEquipamento,
}: EquipamentoListaViewProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  if (loading && equipamentos.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Equipamentos" subtitle="Armas, armaduras e itens mágicos" icon={Sword} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CatalogCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  const itemsWithImages = displayEquipamentos
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

  const selectCls = `px-3 py-2 rounded-lg text-sm font-modern transition-all duration-200 ${
    isLight
      ? 'bg-slate-100 border border-slate-300 text-slate-800 focus:border-purple-500'
      : 'bg-slate-800/50 border border-slate-600 text-white focus:border-purple-500'
  } focus:outline-none focus:ring-2 focus:ring-purple-500/20`;

  return (
    <div className="animate-fade-in space-y-6">
      {error && (
        <Notification message={error} type="error" onClose={clearError} />
      )}

      <PageHeader
        title="Equipamentos"
        subtitle="Armas, armaduras e itens mágicos"
        icon={Sword}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total de Equipamentos" value={totalCount || equipamentos?.length || 0} icon={Sword} variant="primary" />
        <StatCard title="Raros" value={countByRaridade('Raro')} icon={Gem} variant="secondary" />
        <StatCard title="Lendários" value={countByRaridade('Lendário')} icon={Trophy} variant="accent" />
        <StatCard title="Artefatos" value={countByRaridade('Artefato')} icon={Flame} variant="primary" />
      </div>

      <div className="flex flex-wrap gap-4">
        <select value={categoriaFilter} onChange={(e) => setCategoriaFilter(e.target.value)} className={selectCls}>
          <option value="">Todas as Categorias</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.nome}>{cat.nome}</option>
          ))}
        </select>

        <select value={raridadeFilter} onChange={(e) => setRaridadeFilter(e.target.value)} className={selectCls}>
          <option value="">Todas as Raridades</option>
          {raridades.map(rar => (
            <option key={rar.id} value={rar.nome}>{rar.nome}</option>
          ))}
        </select>
      </div>

      {displayEquipamentos.length === 0 ? (
        <div className="text-center py-16">
          <Sword size={48} className={`mx-auto mb-4 ${isLight ? 'text-slate-300' : 'text-slate-600'}`} />
          <p className={`font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Nenhum equipamento encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayEquipamentos.map((row, i) => {
            const rarNome = row.raridade_rel?.nome || 'Comum';

            return (
              <CatalogCard
                key={row.id}
                image={row.imagem}
                icon={Sword}
                title={row.nome}
                rarity={rarNome}
                delay={i}
                onClick={() => onVerEquipamento(row.id)}
                onImageClick={row.imagem ? () => setGalleryIndex(displayEquipamentos.findIndex(item => item.id === row.id)) : undefined}
                headerBadge={
                  <Badge variant={raridadeVariant[rarNome] || 'slate'} className="shadow-sm backdrop-blur-sm">
                    {rarNome}
                  </Badge>
                }
                actions={[
                  { label: 'Ver', icon: Eye, onClick: () => onVerEquipamento(row.id) },
                  { label: 'Editar', icon: Pencil, onClick: () => onEditarEquipamento(row.id) },
                  { label: 'Deletar', icon: Trash2, onClick: () => handleDeleteClick(row) },
                ]}
              >
                <div className="flex flex-wrap gap-1 mt-1">
                  {row.categoria_rel?.nome && (
                    <Badge variant="indigo">{row.categoria_rel.nome}</Badge>
                  )}
                  {row.vinculo?.requer && (
                    <Badge variant="amber" icon={Sparkles}>
                      {row.vinculo.restricao_tipo || 'Vinculo'}
                    </Badge>
                  )}
                </div>
                <div className={`mt-1.5 text-xs font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  #{row.numero || row.id}
                </div>
              </CatalogCard>
            );
          })}
        </div>
      )}

      {currentPage !== undefined && pageSize !== undefined && totalCount !== undefined && handlePageChange && handlePageSizeChange && (
        <CatalogPagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={[12, 24, 48, 100]}
        />
      )}

      {galleryIndex !== null && displayEquipamentos[galleryIndex] && (
        <ImageLightbox
          src={displayEquipamentos[galleryIndex].imagem ?? ''}
          alt={displayEquipamentos[galleryIndex].nome ?? ''}
          title={displayEquipamentos[galleryIndex].nome ?? undefined}
          isOpen={true}
          onClose={() => setGalleryIndex(null)}
          onPrev={currentGalleryPos > 0 ? handlePrev : undefined}
          onNext={currentGalleryPos < itemsWithImages.length - 1 ? handleNext : undefined}
        />
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Deletar Equipamento"
        message={`Tem certeza de que deseja deletar "${equipToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Deletar"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
};

export default EquipamentoListaView;
