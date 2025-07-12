import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useViewModel } from '../../shared/hooks/useViewModel.js';
import { historiaViewModel } from '../../viewmodels/index.js';
import { StatCard, LoadingSpinner, Notification, ConfirmationModal } from '../../components/index.js';
import Table from '../../components/Table/Table.jsx';
import { useTheme } from '../../contexts/theme.jsx';

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
    deleteHistoria
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
        
        <Link to="/nova-historia">
          <button className="btn-rpg hover-lift flex items-center space-x-2">
            <span>✨</span>
            <span>Nova História</span>
          </button>
        </Link>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total de Histórias"
          value={estatisticas.total}
          icon="📚"
          variant="primary"
        />

        <StatCard
          title="Vagas Disponíveis"
          value={estatisticas.totalParticipantes}
          icon="🎭"
          variant="secondary"
        />

        <StatCard
          title="Com Temas"
          value={estatisticas.comTemas}
          icon="⚡"
          variant="accent"
        />
      </div>

      {/* Tabela de histórias */}
      <div className="card-rpg">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-fantasy font-semibold ${isLight ? 'text-slate-700' : 'text-white'}`}>
            Lista de Histórias
          </h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse-slow" />
            <span className="text-sm text-slate-400 font-modern">
              {historias.length} histórias encontradas
            </span>
          </div>
        </div>

        {historias.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl">📖</span>
            </div>
            <h3 className={`text-lg font-semibold mb-2 font-modern ${isLight ? 'text-slate-700' : 'text-white'}`}>
              Nenhuma história encontrada
            </h3>
            <p className="text-slate-400 font-modern mb-6">
              Comece criando sua primeira aventura épica!
            </p>
            <Link to="/nova-historia">
              <button className="btn-rpg">
                Criar Primeira História
              </button>
            </Link>
          </div>
        ) : (
          <Table
            columns={[
              { key: 'id', label: 'ID', align: 'left', render: (row) => `#${row.id}` },
              { key: 'nome', label: 'Nome da História', align: 'left' },
              { key: 'temas', label: 'Temas', align: 'left', render: (row) => {
                const nomesTemas = viewModel.getNomesTemas(row);
                return (
                  <div className="flex flex-wrap gap-1">
                    {nomesTemas.length > 0
                      ? nomesTemas.map((nomeTema, i) => (
                          <span key={i} className="px-2 py-1 text-xs rounded-full bg-slate-700/50 text-slate-300 font-modern">{nomeTema}</span>
                        ))
                      : <span className="text-slate-500 text-xs">Sem tema</span>
                    }
                  </div>
                );
              } },
              { key: 'maximo_de_participantes', label: 'Máximo de Participantes', align: 'left', render: (row) => (
                <div className="flex items-center space-x-2">
                  <span className="text-cyan-400 font-semibold">{row.maximo_de_participantes || 0}</span>
                  <span className="text-slate-400 text-sm">jogadores</span>
                </div>
              ) },
            ]}
            data={historias}
            keyField="id"
            actions={[
              { label: 'Iniciar Sessão', icon: '🎮', onClick: (row) => navigate(`/jogo/${row.id}`), color: 'green' },
              { label: 'Ver', icon: '👁️', onClick: (row) => navigate(`/historias/${row.id}`), color: 'purple' },
              { label: 'Deletar', icon: '🗑️', onClick: (row) => handleDeleteClick(row), color: 'red' },
            ]}
          />
        )}
      </div>

      {/* Modal de Confirmação */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Deletar História"
        message={`Tem certeza que deseja deletar a história "${historiaToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Deletar"
        cancelText="Cancelar"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
}; 