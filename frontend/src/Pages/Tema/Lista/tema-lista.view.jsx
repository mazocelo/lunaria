import React from 'react';
import { TabelaList, PageHeader } from '../../../components/shared';
import StatCard from '../../../components/StatCard.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner.jsx';
import Notification from '../../../components/Notification.jsx';
import ConfirmationModal from '../../../components/ConfirmationModal.jsx';
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
      <div className="animate-fade-in">
        <div className="card-rpg">
          <LoadingSpinner size="xl" text="Carregando temas..." variant="primary" />
        </div>
      </div>
    );
  }

  const columns = [
    {
      key: 'id',
      label: 'ID',
      align: 'left',
      render: (row) => <span className="font-mono text-purple-400">#{row.id}</span>
    },
    {
      key: 'nome',
      label: 'Nome',
      align: 'left',
      render: (row) => (
        <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
          {row.nome}
        </span>
      )
    },
    {
      key: 'descricao',
      label: 'Descricao',
      align: 'left',
      render: (row) => (
        <span className={`${isLight ? 'text-slate-600' : 'text-slate-300'} font-modern text-sm`}>
          {row.descricao ? (row.descricao.length > 100 ? row.descricao.slice(0, 100) + '...' : row.descricao) : '-'}
        </span>
      )
    }
  ];

  const actions = [
    {
      label: 'Editar',
      icon: <Pencil size={18} />,
      color: 'cyan',
      onClick: (row) => navigate(generateRoute.editarTema(row.id))
    },
    {
      label: 'Excluir',
      icon: <Trash2 size={18} />,
      color: 'red',
      onClick: handleDeleteClick
    }
  ];

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

      <TabelaList
        header="Lista de Temas"
        columns={columns}
        data={temas}
        actions={actions}
        loading={loading}
        pagination={true}
        initialPageSize={10}
        pageSizeOptions={[5, 10, 25, 50]}
        emptyMessage="Nenhum tema encontrado"
        emptyIcon={<Palette size={32} />}
        hoverable={true}
      />

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
