import React from 'react';
import StatCard from '../../../components/StatCard.jsx';
import Notification from '../../../components/Notification.jsx';
import ConfirmationModal from '../../../components/ConfirmationModal.jsx';
import { PageHeader, CatalogCard, CatalogCardSkeleton } from '../../../components/shared';
import { Palette, Plus, Pencil, Trash2 } from 'lucide-react';

const TemaListaView = ({
  temas,
  loading,
  error,
  isLight,
  showDeleteModal,
  temaToDelete,
  deleteLoading,
  handleDeleteClick,
  handleConfirmDelete,
  handleCancelDelete,
  clearError,
  navigate,
  generateRoute,
  ROUTES,
}) => {
  if (loading && temas.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Temas" subtitle="Temas de ambientacao para historias" icon={Palette} />
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
        title="Temas"
        subtitle="Temas de ambientacao para historias"
        icon={Palette}
        actions={
          <button className="btn-rpg hover-lift flex items-center gap-2 cursor-pointer" onClick={() => navigate(ROUTES.NOVO_TEMA)}>
            <Plus size={18} />
            <span>Novo Tema</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total de Temas" value={temas?.length || 0} icon={Palette} variant="primary" />
      </div>

      {temas.length === 0 ? (
        <div className="text-center py-16">
          <Palette size={48} className={`mx-auto mb-4 ${isLight ? 'text-slate-300' : 'text-slate-600'}`} />
          <p className={`font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Nenhum tema encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {temas.map((row, i) => (
            <CatalogCard
              key={row.id}
              image={row.imagem}
              icon={Palette}
              title={row.nome}
              subtitle={row.descricao}
              delay={i}
              onClick={() => navigate(generateRoute.editarTema(row.id))}
              actions={[
                { label: 'Editar', icon: Pencil, onClick: () => navigate(generateRoute.editarTema(row.id)) },
                { label: 'Excluir', icon: Trash2, onClick: () => handleDeleteClick(row) },
              ]}
            />
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Deletar Tema"
        message={`Tem certeza de que deseja deletar o tema "${temaToDelete?.nome}"? Esta acao nao pode ser desfeita.`}
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

export default TemaListaView;
