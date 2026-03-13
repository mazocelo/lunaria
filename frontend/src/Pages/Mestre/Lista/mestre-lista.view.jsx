import React from 'react';
import { Link } from 'react-router-dom';
import { TabelaList, PageHeader, Badge, SearchBar } from '../../../components/shared';
import StatCard from '../../../components/StatCard.jsx';
import Notification from '../../../components/Notification.jsx';
import ConfirmationModal from '../../../components/ConfirmationModal.jsx';
import { ROUTES } from '../../../routes.jsx';
import { Crown, Plus, Eye, Pencil, Trash2, Volume2 } from 'lucide-react';

const MestreListaView = ({
  mestres,
  filteredMestres,
  loading,
  error,
  isLight,
  showDeleteModal,
  mestreToDelete,
  deleteLoading,
  buscarMestres,
  handleDeleteClick,
  handleConfirmDelete,
  handleCancelDelete,
  handlePreviewVoz,
  clearError,
  navigate,
  generateRoute,
}) => {
  if (loading && mestres.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse-slow">
                <Crown size={24} className="text-white" />
              </div>
              <div className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Carregando mestres...</div>
            </div>
          </div>
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
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <Crown size={16} className="text-white" />
          </div>
          <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
            {row.nome}
          </span>
        </div>
      )
    },
    {
      key: 'modelo',
      label: 'Modelo',
      align: 'left',
      render: (row) => (
        <Badge variant="slate">{row.modelo || 'Padrao'}</Badge>
      )
    },
    {
      key: 'tom_narrativo',
      label: 'Tom Narrativo',
      align: 'left',
      render: (row) => (
        <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          {row.tom_narrativo || 'Nao definido'}
        </span>
      )
    },
    {
      key: 'tags',
      label: 'Etiquetas',
      align: 'left',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {(Array.isArray(row.tags) ? row.tags : []).slice(0, 3).map((tag) => (
            <Badge key={`${row.id}-${tag}`} variant="purple">{tag}</Badge>
          ))}
          {Array.isArray(row.tags) && row.tags.length > 3 && (
            <Badge variant="slate">+{row.tags.length - 3}</Badge>
          )}
          {(!Array.isArray(row.tags) || row.tags.length === 0) && (
            <span className={`font-modern ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Sem tags</span>
          )}
        </div>
      )
    }
  ];

  const actions = [
    {
      label: 'Ver',
      icon: <Eye size={18} />,
      color: 'purple',
      onClick: (row) => navigate(generateRoute.verMestre(row.id))
    },
    {
      label: 'Editar',
      icon: <Pencil size={18} />,
      color: 'cyan',
      onClick: (row) => navigate(generateRoute.editarMestre(row.id))
    },
    {
      label: 'Ouvir voz',
      icon: <Volume2 size={18} />,
      color: 'green',
      show: (row) => Boolean(row.voice_id),
      onClick: (row) => handlePreviewVoz(row)
    },
    {
      label: 'Deletar',
      icon: <Trash2 size={18} />,
      color: 'red',
      onClick: (row) => handleDeleteClick(row)
    }
  ];

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
          <Link to={ROUTES.NOVO_MESTRE}>
            <button className="btn-rpg hover-lift flex items-center gap-2 cursor-pointer">
              <Plus size={18} />
              <span>Novo Mestre</span>
            </button>
          </Link>
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

      <TabelaList
        header="Lista de Mestres"
        columns={columns}
        data={filteredMestres}
        actions={actions}
        loading={loading}
        pagination={true}
        initialPageSize={10}
        pageSizeOptions={[5, 10, 25, 50]}
        emptyMessage="Nenhum mestre encontrado"
        emptyIcon={<Crown size={32} />}
        hoverable={true}
      />

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
