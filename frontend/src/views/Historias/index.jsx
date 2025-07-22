import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useViewModel } from '../../shared/hooks/useViewModel.js';
import { historiaViewModel } from '../../viewmodels/index.js';
import StatCard from '../../components/StatCard.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Notification from '../../components/Notification.jsx';
import ConfirmationModal from '../../components/ConfirmationModal.jsx';
import DataTable from '../../components/Table/DataTable.jsx';
import { useTheme } from '../../contexts/theme.jsx';
import { ROUTES, generateRoute } from '../../routes.jsx';

/**
 * View para exibição e gerenciamento de Histórias
 * Segue o padrão MVVM - apenas responsável pela apresentação
 */
export const HistoriaView = () => {
  const navigate = useNavigate();
  const viewModel = useViewModel(historiaViewModel);
  const {
    historias,
    loading,
    error,
    estatisticas,
    loadHistorias,
    clearError,
    deleteHistoria,
    getNomesTemas
  } = viewModel;

  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Estado para o modal de confirmação
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [historiaToDelete, setHistoriaToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Carrega histórias ao montar o componente
  useEffect(() => {
    loadHistorias();
  }, []);

  // Limpa erro quando componente desmonta
  useEffect(() => {
    return () => {
      clearError();
    };
  }, []);

  // Função para abrir o modal de confirmação
  const handleDeleteClick = (historia) => {
    setHistoriaToDelete(historia);
    setShowDeleteModal(true);
  };

  // Função para confirmar a exclusão
  const handleConfirmDelete = async () => {
    if (!historiaToDelete) return;
    
    setDeleteLoading(true);
    try {
      await deleteHistoria(historiaToDelete.id);
      setShowDeleteModal(false);
      setHistoriaToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar história:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Função para cancelar a exclusão
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setHistoriaToDelete(null);
    setDeleteLoading(false);
  };

  // ✅ Função para navegar para ver história usando constantes
  const handleViewHistoria = (historia) => {
    navigate(generateRoute.verHistoria(historia.id));
  };

  // ✅ Função para iniciar sessão usando constantes
  const handlePlayHistoria = (historia) => {
    navigate(generateRoute.jogo(historia.id));
  };

  // Renderizador para temas
  const renderTemas = (historia) => {
    const nomesTemas = getNomesTemas ? getNomesTemas(historia) : [];
    return (
      <div className="flex flex-wrap gap-1">
        {nomesTemas.length > 0
          ? nomesTemas.map((nomeTema, i) => (
              <span 
                key={i} 
                className={`px-2 py-1 text-xs rounded-full ${
                  isLight 
                    ? 'bg-slate-200/50 text-slate-700' 
                    : 'bg-slate-700/50 text-slate-300'
                } font-modern`}
              >
                {nomeTema}
              </span>
            ))
          : <span className="text-slate-500 text-xs">Sem tema</span>
        }
      </div>
    );
  };

  // Renderizador para máximo de participantes
  const renderMaxParticipantes = (historia) => (
    <div className="flex items-center space-x-2">
      <span className="text-cyan-400 font-semibold">
        {historia.maximo_de_participantes || 0}
      </span>
      <span className="text-slate-400 text-sm">jogadores</span>
    </div>
  );

  const columns = [
    { 
      key: 'id', 
      label: 'ID', 
      align: 'left', 
      render: (row) => <span className="font-mono text-purple-400">#{row.id}</span>
    },
    { 
      key: 'nome', 
      label: 'Nome da História', 
      align: 'left'
    },
    { 
      key: 'temas', 
      label: 'Temas', 
      align: 'left', 
      render: renderTemas
    },
    { 
      key: 'maximo_de_participantes', 
      label: 'Máximo de Participantes', 
      align: 'left', 
      render: renderMaxParticipantes
    }
  ];

  const actions = [
    {
      label: 'Iniciar Sessão',
      icon: '🎮',
      color: 'green',
      onClick: (row) => handlePlayHistoria(row)
    },
    {
      label: 'Ver',
      icon: '👁️',
      color: 'purple',
      onClick: (row) => handleViewHistoria(row)
    },
    {
      label: 'Deletar',
      icon: '🗑️',
      color: 'red',
      onClick: (row) => handleDeleteClick(row)
    }
  ];

  if (loading && historias.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <LoadingSpinner 
            size="xl" 
            text="Carregando histórias..." 
            variant="primary"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Notificação de erro */}
      {error && (
        <Notification
          message={error}
          type="error"
          onClose={clearError}
        />
      )}

      {/* Header da página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
            Histórias & Aventuras
          </h1>
          <p className="text-slate-400 font-modern">
            Gerencie suas campanhas e aventuras épicas
          </p>
        </div>
        
        {/* ✅ Link usando constante de rota */}
        <Link to={ROUTES.NOVA_HISTORIA}>
          <button className="btn-rpg hover-lift flex items-center space-x-2 cursor-pointer">
            <span>✨</span>
            <span>Nova História</span>
          </button>
        </Link>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total de Histórias"
          value={estatisticas?.total || 0}
          icon="📚"
          variant="primary"
        />

        <StatCard
          title="Vagas Disponíveis"
          value={estatisticas?.totalParticipantes || 0}
          icon="🎭"
          variant="secondary"
        />

        <StatCard
          title="Com Temas"
          value={estatisticas?.comTemas || 0}
          icon="⚡"
          variant="accent"
        />
      </div>

      {/* Tabela de histórias */}
      <DataTable
        columns={columns}
        data={historias}
        actions={actions}
        loading={loading}
        title="Lista de Histórias"
        emptyMessage="Nenhuma história encontrada"
        emptyIcon="📖"
        totalItems={historias.length}
      />

      {/* Modal de Confirmação */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Deletar História"
        message={`Tem certeza de que deseja deletar a história "${historiaToDelete?.nome}"? Esta ação não pode ser desfeita.`}
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

export default HistoriaView; 