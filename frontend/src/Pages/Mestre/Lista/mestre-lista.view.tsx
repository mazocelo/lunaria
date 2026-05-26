import { PageHeader, Badge, SearchBar, CatalogCard, CatalogCardSkeleton } from '../../../components/shared';
import StatCard from '../../../components/StatCard';
import Notification from '../../../components/Notification';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { useTheme } from '../../../contexts/theme';
import { Crown, Plus, Eye, Pencil, Trash2, Volume2 } from 'lucide-react';
import type { MestreItem } from '../../../store/mestre/states';

interface MestreListaViewProps {
  mestres: MestreItem[];
  filteredMestres: MestreItem[];
  loading: boolean;
  error: string | null;
  showDeleteModal: boolean;
  mestreToDelete: MestreItem | null;
  deleteLoading: boolean;
  buscarMestres: (term: string) => void;
  handleDeleteClick: (mestre: MestreItem) => void;
  handleConfirmDelete: () => void;
  handleCancelDelete: () => void;
  handlePreviewVoz: (mestre: MestreItem) => void;
  playingMestreId: number | null;
  clearError: () => void;
  onVerMestre: (id: number | string) => void;
  onEditarMestre: (id: number | string) => void;
  onNovoMestre: () => void;
}

const MestreListaView = ({
  mestres,
  filteredMestres,
  loading,
  error,
  showDeleteModal,
  mestreToDelete,
  deleteLoading,
  buscarMestres,
  handleDeleteClick,
  handleConfirmDelete,
  handleCancelDelete,
  handlePreviewVoz,
  clearError,
  onVerMestre,
  onEditarMestre,
  onNovoMestre,
}: MestreListaViewProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (loading && mestres.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Mestres de Jogo" subtitle="Gerencie seus mestres e narradores" icon={Crown} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CatalogCardSkeleton key={i} />)}
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
        title="Mestres de Jogo"
        subtitle="Gerencie seus mestres e narradores"
        icon={Crown}
        actions={
          <button className="btn-rpg hover-lift flex items-center gap-2 cursor-pointer" onClick={onNovoMestre}>
            <Plus size={18} />
            <span>Novo Mestre</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total de Mestres"
          value={mestres?.length || 0}
          icon={Crown}
          variant="primary"
        />
      </div>

      <SearchBar
        placeholder="Buscar mestres..."
        onChange={(texto) => buscarMestres(texto)}
      />

      {filteredMestres.length === 0 ? (
        <div className="text-center py-16">
          <Crown size={48} className={`mx-auto mb-4 ${isLight ? 'text-slate-300' : 'text-slate-600'}`} />
          <p className={`font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Nenhum mestre encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMestres.map((row, i) => {
            const actions = [
              { label: 'Ver', icon: Eye, onClick: () => onVerMestre(row.id) },
              { label: 'Editar', icon: Pencil, onClick: () => onEditarMestre(row.id) },
            ];
            if (row.voice_id) {
              actions.push({ label: 'Ouvir voz', icon: Volume2, onClick: () => handlePreviewVoz(row) });
            }
            actions.push({ label: 'Deletar', icon: Trash2, onClick: () => handleDeleteClick(row) });

            const tags = Array.isArray(row.tags) ? (row.tags as string[]) : [];

            return (
              <CatalogCard
                key={row.id}
                image={row.imagem as string | undefined}
                icon={Crown}
                title={row.nome}
                delay={i}
                onClick={() => onVerMestre(row.id)}
                actions={actions}
                headerBadge={
                  <Badge variant="slate" className="shadow-sm backdrop-blur-sm">
                    {(row.modelo as string | undefined) || 'Padrao'}
                  </Badge>
                }
              >
                {row.tom_narrativo ? (
                  <p className={`text-[11px] font-modern line-clamp-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    {String(row.tom_narrativo)}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-1 mt-1">
                  {tags.slice(0, 3).map((tag) => (
                    <Badge key={`${row.id}-${tag}`} variant="purple">{tag}</Badge>
                  ))}
                  {tags.length > 3 && (
                    <Badge variant="slate">+{tags.length - 3}</Badge>
                  )}
                </div>
              </CatalogCard>
            );
          })}
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Deletar Mestre"
        message={`Tem certeza de que deseja ocultar o mestre "${mestreToDelete?.nome}"? Ele sera removido da lista ativa via soft delete.`}
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

export default MestreListaView;
