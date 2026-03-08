import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useViewModel } from '../../../shared/hooks/useViewModel.js';
import { historiaViewModel } from './viewmodel.js';
import StatCard from '../../../components/StatCard.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner.jsx';
import Notification from '../../../components/Notification.jsx';
import ConfirmationModal from '../../../components/ConfirmationModal.jsx';
import ConviteModal from '../../../components/ConviteModal.jsx';
import { TabelaList, SearchBar, PageHeader, Badge } from '../../../components/shared';
import { useTheme } from '../../../contexts/theme.jsx';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { ROUTES, generateRoute } from '../../../routes.jsx';
import { BookOpen, Plus, Eye, Mail, Play, Target, RotateCcw, StopCircle, Trash2 } from 'lucide-react';

/**
 * View para exibição e gerenciamento de Histórias
 * Segue o padrão MVVM - apenas responsável pela apresentação
 */
export const HistoriaListaView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const viewModel = useViewModel(historiaViewModel);
  const {
    historias,
    loading,
    error,
    estatisticas,
    loadHistorias,
    clearError,
    deleteHistoria,
    getNomesTemas,
    enviarConvite,
    aplicarFiltros,
    historiasFiltradasComTemas
  } = viewModel;

  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Estado para o modal de confirmação
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [historiaToDelete, setHistoriaToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Estado para o modal de convite
  const [showConviteModal, setShowConviteModal] = useState(false);
  const [historiaParaConvite, setHistoriaParaConvite] = useState(null);
  const [conviteLoading, setConviteLoading] = useState(false);

  // Estado para o modal de reset de sessão
  const [showResetModal, setShowResetModal] = useState(false);
  const [historiaToReset, setHistoriaToReset] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);

  // Estado para o modal de encerrar sessão
  const [showEncerrarModal, setShowEncerrarModal] = useState(false);
  const [historiaToEncerrar, setHistoriaToEncerrar] = useState(null);
  const [encerrarLoading, setEncerrarLoading] = useState(false);

  // Estado para bulk delete
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteIds, setBulkDeleteIds] = useState([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

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
    navigate(generateRoute.jogoSelecaoPersonagem(historia.id));
  };

  // Função para abrir modal de convite
  const handleConviteClick = (historia) => {
    setHistoriaParaConvite(historia);
    setShowConviteModal(true);
  };

  // Função para enviar convite
  const handleEnviarConvite = async (email) => {
    if (!historiaParaConvite) return;

    setConviteLoading(true);
    try {
      await enviarConvite(historiaParaConvite.id, email);
      setShowConviteModal(false);
      setHistoriaParaConvite(null);

      // Mostrar notificação de sucesso (opcional)
    } catch (error) {
      console.error('❌ Erro ao enviar convite:', error);
      // O erro já é tratado no viewModel
    } finally {
      setConviteLoading(false);
    }
  };

  // Função para cancelar convite
  const handleCancelConvite = () => {
    setShowConviteModal(false);
    setHistoriaParaConvite(null);
    setConviteLoading(false);
  };

  // Função para abrir modal de reset
  const handleResetarSessao = (historia) => {
    setHistoriaToReset(historia);
    setShowResetModal(true);
  };

  // Função para confirmar reset
  const handleConfirmReset = async () => {
    if (!historiaToReset) return;

    setResetLoading(true);
    try {
      const response = await viewModel.resetarSessao(historiaToReset.id);
      
      if (response && response.success) {
        // Recarregar lista de histórias
        await loadHistorias();
        setShowResetModal(false);
        setHistoriaToReset(null);
      }
    } catch (error) {
      console.error('❌ Erro ao resetar sessão:', error);
    } finally {
      setResetLoading(false);
    }
  };

  // Função para cancelar reset
  const handleCancelReset = () => {
    setShowResetModal(false);
    setHistoriaToReset(null);
    setResetLoading(false);
  };

  // Função para abrir modal de encerrar sessão
  const handleEncerrarSessao = (historia) => {
    setHistoriaToEncerrar(historia);
    setShowEncerrarModal(true);
  };

  const handleConfirmEncerrar = async () => {
    if (!historiaToEncerrar) return;

    setEncerrarLoading(true);
    try {
      const response = await viewModel.encerrarSessao(historiaToEncerrar.id);

      if (response && response.success) {
        await loadHistorias();
        setShowEncerrarModal(false);
        setHistoriaToEncerrar(null);
      }
    } catch (error) {
      console.error('❌ Erro ao encerrar sessão:', error);
    } finally {
      setEncerrarLoading(false);
    }
  };

  const handleCancelEncerrar = () => {
    setShowEncerrarModal(false);
    setHistoriaToEncerrar(null);
    setEncerrarLoading(false);
  };

  // Funções de bulk delete
  const handleBulkDeleteClick = (ids) => {
    setBulkDeleteIds(ids);
    setShowBulkDeleteModal(true);
  };

  const handleConfirmBulkDelete = async () => {
    setBulkDeleteLoading(true);
    try {
      for (const id of bulkDeleteIds) {
        await deleteHistoria(id);
      }
      setShowBulkDeleteModal(false);
      setBulkDeleteIds([]);
    } catch (error) {
      console.error('Erro ao deletar historias em lote:', error);
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleCancelBulkDelete = () => {
    setShowBulkDeleteModal(false);
    setBulkDeleteIds([]);
    setBulkDeleteLoading(false);
  };

  // Função para verificar se o usuário é dono da história
  const isOwner = (historia) => {
    if(user && historia){
      const {id_usuario} = historia;
      return id_usuario == user.id;
    }
    return false;
  };

  // Renderizador para temas
  const renderTemas = (historia) => {
    const nomesTemas = getNomesTemas ? getNomesTemas(historia) : [];
    return (
      <div className="flex flex-wrap gap-1">
        {nomesTemas.length > 0
          ? nomesTemas.map((nomeTema, i) => (
            <Badge key={i} variant="slate">{nomeTema}</Badge>
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

  // Renderizador para status de sessão
  const renderStatusSessao = (historia) => {
    if (historia.sessaoAtiva) {
      return (
        <Badge variant="green" dot>
          Em Andamento {historia.totalJogadores > 0 ? `(${historia.totalJogadores})` : ''}
        </Badge>
      );
    }
    return <Badge variant="slate" dot>Aguardando</Badge>;
  };

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
      key: 'status_sessao',
      label: 'Status',
      align: 'left',
      render: renderStatusSessao
    },
    {
      key: 'maximo_de_participantes',
      label: 'Máximo de Participantes',
      align: 'left',
      render: renderMaxParticipantes
    }
  ];

  // Handler para entrar em partida ativa
  const handleEntrarPartida = (historia) => {
    navigate(generateRoute.jogoSelecaoPersonagem(historia.id));
  };

  // Ações que incluem verificação de propriedade dentro do onClick
  const actions = [
    {
      label: 'Entrar na Partida',
      icon: <Target size={18} />,
      color: 'orange',
      onClick: (row) => handleEntrarPartida(row),
      show: (row) => row.sessaoAtiva === true
    },
    {
      label: 'Iniciar Sessão',
      icon: <Play size={18} />,
      color: 'green',
      onClick: (row) => handlePlayHistoria(row),
      show: (row) => !row.sessaoAtiva
    },
    {
      label: 'Ver',
      icon: <Eye size={18} />,
      color: 'purple',
      onClick: (row) => handleViewHistoria(row),
      show: (row) => isOwner(row)
    },
    {
      label: 'Convidar',
      icon: <Mail size={18} />,
      color: 'blue',
      onClick: (row) => handleConviteClick(row),
      show: (row) => isOwner(row)
    },
    {
      label: 'Resetar Sessão',
      icon: <RotateCcw size={18} />,
      color: 'orange',
      onClick: (row) => handleResetarSessao(row),
      show: (row) => isOwner(row) && row.sessaoAtiva === true
    },
    {
      label: 'Encerrar Sessão',
      icon: <StopCircle size={18} />,
      color: 'red',
      onClick: (row) => handleEncerrarSessao(row),
      show: (row) => row.sessaoAtiva === true
    },
    {
      label: 'Deletar',
      icon: <Trash2 size={18} />,
      color: 'red',
      onClick: (row) => handleDeleteClick(row),
      show: (row) => isOwner(row)
    }
  ]
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
      <PageHeader
        title="Histórias & Aventuras"
        subtitle="Gerencie suas campanhas e aventuras épicas"
        icon={BookOpen}
        actions={
          <Link to={ROUTES.NOVA_HISTORIA}>
            <button className="btn-rpg hover-lift flex items-center gap-2 cursor-pointer">
              <Plus size={18} />
              <span>Nova História</span>
            </button>
          </Link>
        }
      />

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total de Histórias"
          value={estatisticas?.total || 0}
          icon={BookOpen}
          variant="primary"
        />
        <StatCard
          title="Vagas Disponíveis"
          value={estatisticas?.totalParticipantes || 0}
          icon={Target}
          variant="secondary"
        />
      </div>

      {/* Busca */}
      <SearchBar
        placeholder="Buscar histórias por nome..."
        onChange={(texto) => aplicarFiltros({ busca: texto })}
        className="mb-4"
      />

      {/* Tabela de histórias */}
      <TabelaList
        header="Lista de Histórias"
        columns={columns}
        data={historiasFiltradasComTemas || historias}
        actions={actions}
        loading={loading}
        pagination={true}
        initialPageSize={10}
        pageSizeOptions={[5, 10, 25, 50]}
        emptyMessage="Nenhuma história encontrada"
        emptyIcon="📖"
        hoverable={true}
        selectable={true}
        bulkActions={[
          { label: 'Deletar Selecionados', icon: '🗑️', color: 'red', onClick: handleBulkDeleteClick }
        ]}
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

      {/* Modal de Convite */}
      <ConviteModal
        isOpen={showConviteModal}
        onClose={handleCancelConvite}
        onConfirm={handleEnviarConvite}
        historia={historiaParaConvite}
        loading={conviteLoading}
      />

      {/* Modal de Bulk Delete */}
      <ConfirmationModal
        isOpen={showBulkDeleteModal}
        title="Deletar Historias Selecionadas"
        message={`Tem certeza de que deseja deletar ${bulkDeleteIds.length} historia(s)? Esta acao nao pode ser desfeita.`}
        confirmText="Deletar Todos"
        cancelText="Cancelar"
        onConfirm={handleConfirmBulkDelete}
        onCancel={handleCancelBulkDelete}
        loading={bulkDeleteLoading}
        variant="danger"
      />

      {/* Modal de Resetar Sessão */}
      <ConfirmationModal
        isOpen={showResetModal}
        title="Resetar Sessão de Jogo"
        message={`Tem certeza de que deseja resetar a sessão da história "${historiaToReset?.nome}"? 

Esta ação irá:

• Apagar todos os turnos e rodadas
• Limpar todas as mensagens do chat
• Remover a ordem dos jogadores
• Desconectar todos os jogadores
• Permitir reiniciar do zero

Esta ação não pode ser desfeita.`}
        confirmText="Resetar Sessão"
        cancelText="Cancelar"
        onConfirm={handleConfirmReset}
        onCancel={handleCancelReset}
        loading={resetLoading}
        variant="danger"
      />

      {/* Modal de Encerrar Sessão */}
      <ConfirmationModal
        isOpen={showEncerrarModal}
        title="Encerrar Sessão de Jogo"
        message={`Deseja encerrar permanentemente a sessão da história "${historiaToEncerrar?.nome}"?

Esta ação irá:

• Encerrar a sessão e limpar todos os dados
• Desconectar todos os jogadores da sala
• Limpar cache do Mestre e dados em memória
• Finalizar o registro no banco de dados

Esta ação não pode ser desfeita.`}
        confirmText="Encerrar Sessão"
        cancelText="Cancelar"
        onConfirm={handleConfirmEncerrar}
        onCancel={handleCancelEncerrar}
        loading={encerrarLoading}
        variant="danger"
      />
    </div>
  );
};

export default HistoriaListaView;

