import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useViewModel } from '../../../shared/hooks/useViewModel';
import { mestreViewModel } from '../../../viewmodels/Mestres';
import { useTheme } from '../../../contexts/theme.jsx';
import { TabelaList } from '../../../components/shared';
import StatCard from '../../../components/StatCard.jsx';
import Notification from '../../../components/Notification.jsx';
import ConfirmationModal from '../../../components/ConfirmationModal.jsx';
import { ROUTES, generateRoute } from '../../../routes.jsx';

const MestreListaView = () => {
  const vm = useViewModel(mestreViewModel);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mestreToDelete, setMestreToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    vm.loadMestres();
  }, []);

  useEffect(() => {
    return () => vm.clearError();
  }, []);

  const handleDeleteClick = (mestre) => {
    setMestreToDelete(mestre);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!mestreToDelete) return;
    setDeleteLoading(true);
    try {
      await vm.deleteMestre(mestreToDelete.id);
      setShowDeleteModal(false);
      setMestreToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar mestre:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setMestreToDelete(null);
    setDeleteLoading(false);
  };

  if (vm.loading && vm.mestres.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse-slow">
                <span className="text-2xl">🧙</span>
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
            <span className="text-sm">🧙</span>
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
        <span className={`px-2 py-1 text-xs rounded-full ${isLight ? 'bg-slate-200/50 text-slate-700' : 'bg-slate-700/50 text-slate-300'} font-modern`}>
          {row.modelo || 'Padrão'}
        </span>
      )
    },
    {
      key: 'tom_narrativo',
      label: 'Tom Narrativo',
      align: 'left',
      render: (row) => (
        <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          {row.tom_narrativo || 'Não definido'}
        </span>
      )
    }
  ];

  const actions = [
    {
      label: 'Ver',
      icon: '👁️',
      color: 'purple',
      onClick: (row) => navigate(generateRoute.verMestre(row.id))
    },
    {
      label: 'Editar',
      icon: '✏️',
      color: 'cyan',
      onClick: (row) => navigate(generateRoute.editarMestre(row.id))
    },
    {
      label: 'Deletar',
      icon: '🗑️',
      color: 'red',
      onClick: (row) => handleDeleteClick(row)
    }
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {vm.error && (
        <Notification message={vm.error} type="error" onClose={vm.clearError} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
            Mestres de Jogo
          </h1>
          <p className="text-slate-400 font-modern">
            Gerencie seus mestres e narradores
          </p>
        </div>

        <Link to={ROUTES.NOVO_MESTRE}>
          <button className="btn-rpg hover-lift flex items-center space-x-2 cursor-pointer">
            <span>✨</span>
            <span>Novo Mestre</span>
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total de Mestres"
          value={vm.mestres?.length || 0}
          icon="🧙"
          variant="primary"
        />
      </div>

      <TabelaList
        header="Lista de Mestres"
        columns={columns}
        data={vm.mestres}
        actions={actions}
        loading={vm.loading}
        pagination={true}
        initialPageSize={10}
        pageSizeOptions={[5, 10, 25, 50]}
        emptyMessage="Nenhum mestre encontrado"
        emptyIcon="🧙"
        hoverable={true}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Deletar Mestre"
        message={`Tem certeza de que deseja deletar o mestre "${mestreToDelete?.nome}"? Esta ação não pode ser desfeita.`}
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
