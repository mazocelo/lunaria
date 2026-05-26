import { useState, useCallback } from 'react';
import StatCard from '../../../components/StatCard';
import Notification from '../../../components/Notification';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { PageHeader, Badge, CatalogCard, CatalogCardSkeleton } from '../../../components/shared';
import ImageLightbox from '../../../components/ImageLightbox';
import { useTheme } from '../../../contexts/theme';
import { Package, Eye, Pencil, Trash2, Sword, Shield, Sparkles, ScrollText } from 'lucide-react';
import type { ComponentType } from 'react';
import type { ItemTresDet } from './item-tresdet-lista.model';

type BadgeVariant = 'purple' | 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'indigo' | 'cyan' | 'pink';

const raridadeVariant: Record<string, BadgeVariant> = {
  'comum': 'slate',
  'incomum': 'green',
  'raro': 'blue',
  'lendario': 'amber',
  'variavel': 'purple',
};

const tipoIcon: Record<string, ComponentType<{ size?: number | string; className?: string }>> = {
  'arma': Sword,
  'armadura': Shield,
  'acessorio': Sparkles,
  'consumivel': Package,
  'pergaminho': ScrollText,
  'mecha': Package,
};

interface SelectOption { value: string; label: string }

interface ItemTresDetListaViewProps {
  itens: ItemTresDet[];
  displayItens: ItemTresDet[];
  loading: boolean;
  error: string | null;
  tipoFilter: string;
  raridadeFilter: string;
  tiposOptions: SelectOption[];
  raridadeOptions: SelectOption[];
  showDeleteModal: boolean;
  itemToDelete: ItemTresDet | null;
  deleteLoading: boolean;
  setTipoFilter: (tipo: string) => void;
  setRaridadeFilter: (raridade: string) => void;
  handleDeleteClick: (row: ItemTresDet) => void;
  handleConfirmDelete: () => void;
  handleCancelDelete: () => void;
  countByTipo: (tipo: string) => number;
  clearError: () => void;
  onVerItem: (id: number | string) => void;
  onEditarItem: (id: number | string) => void;
}

const ItemTresDetListaView = ({
  itens,
  displayItens,
  loading,
  error,
  tipoFilter,
  raridadeFilter,
  tiposOptions,
  raridadeOptions,
  showDeleteModal,
  itemToDelete,
  deleteLoading,
  setTipoFilter,
  setRaridadeFilter,
  handleDeleteClick,
  handleConfirmDelete,
  handleCancelDelete,
  countByTipo,
  clearError,
  onVerItem,
  onEditarItem,
}: ItemTresDetListaViewProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (loading && itens.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Itens 3D&T" subtitle="Armas, armaduras e itens do sistema 3D&T" icon={Package} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CatalogCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  const itemsWithImages = displayItens
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
        title="Itens 3D&T"
        subtitle="Armas, armaduras e itens do sistema 3D&T"
        icon={Package}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total de Itens" value={itens?.length || 0} icon={Package} variant="primary" />
        <StatCard title="Armas" value={countByTipo('arma')} icon={Sword} variant="secondary" />
        <StatCard title="Armaduras" value={countByTipo('armadura')} icon={Shield} variant="accent" />
        <StatCard title="Consumiveis" value={countByTipo('consumivel')} icon={Sparkles} variant="primary" />
      </div>

      <div className="flex flex-wrap gap-4">
        <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className={selectCls}>
          <option value="">Todos os Tipos</option>
          {tiposOptions.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <select value={raridadeFilter} onChange={(e) => setRaridadeFilter(e.target.value)} className={selectCls}>
          <option value="">Todas as Raridades</option>
          {raridadeOptions.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {displayItens.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className={`mx-auto mb-4 ${isLight ? 'text-slate-300' : 'text-slate-600'}`} />
          <p className={`font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Nenhum item encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayItens.map((row, i) => {
            const raridade = row.raridade || 'comum';
            const TipoIcon = (row.tipo && tipoIcon[row.tipo]) || Package;

            return (
              <CatalogCard
                key={row.id}
                image={row.imagem}
                icon={TipoIcon}
                title={row.nome}
                rarity={raridade}
                delay={i}
                onClick={() => onVerItem(row.id)}
                onImageClick={row.imagem ? () => setGalleryIndex(displayItens.findIndex(item => item.id === row.id)) : undefined}
                headerBadge={
                  <Badge variant={raridadeVariant[raridade] || 'slate'} className="shadow-sm backdrop-blur-sm">
                    {raridade}
                  </Badge>
                }
                actions={[
                  { label: 'Ver', icon: Eye, onClick: () => onVerItem(row.id) },
                  { label: 'Editar', icon: Pencil, onClick: () => onEditarItem(row.id) },
                  { label: 'Deletar', icon: Trash2, onClick: () => handleDeleteClick(row) },
                ]}
              >
                <div className="flex flex-wrap gap-1 mt-1">
                  {row.tipo && <Badge variant="indigo">{row.tipo}</Badge>}
                  {(row.custo_pe ?? 0) > 0 && (
                    <Badge variant="amber">{row.custo_pe} PE</Badge>
                  )}
                </div>
                <div className={`mt-1.5 text-xs font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  #{row.id}
                </div>
              </CatalogCard>
            );
          })}
        </div>
      )}

      {galleryIndex !== null && displayItens[galleryIndex] && (
        <ImageLightbox
          src={displayItens[galleryIndex].imagem ?? ''}
          alt={displayItens[galleryIndex].nome ?? ''}
          title={displayItens[galleryIndex].nome ?? undefined}
          isOpen={true}
          onClose={() => setGalleryIndex(null)}
          onPrev={currentGalleryPos > 0 ? handlePrev : undefined}
          onNext={currentGalleryPos < itemsWithImages.length - 1 ? handleNext : undefined}
        />
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Deletar Item 3D&T"
        message={`Tem certeza de que deseja deletar "${itemToDelete?.nome}"? Esta acao nao pode ser desfeita.`}
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

export default ItemTresDetListaView;
