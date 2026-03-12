import React from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../../components/StatCard.jsx';
import Notification from '../../../components/Notification.jsx';
import ConfirmationModal from '../../../components/ConfirmationModal.jsx';
import ConviteModal from '../../../components/ConviteModal.jsx';
import { TabelaList, SearchBar, PageHeader, Badge, TableSkeleton } from '../../../components/shared';
import { BookOpen, Plus, Eye, Mail, Play, Target, RotateCcw, StopCircle, Trash2 } from 'lucide-react';

const HistoriaListaView = ({
  // Data
  historias,
  historiasFiltradasComTemas,
  estatisticas,
  loading,
  error,
  isLight,

  // Filtros
  aplicarFiltros,
  getNomesTemas,
  isOwner,

  // Delete
  showDeleteModal,
  historiaToDelete,
  deleteLoading,
  handleDeleteClick,
  handleConfirmDelete,
  handleCancelDelete,

  // Convite
  showConviteModal,
  historiaParaConvite,
  conviteLoading,
  handleConviteClick,
  handleEnviarConvite,
  handleCancelConvite,

  // Reset sessao
  showResetModal,
  historiaToReset,
  resetLoading,
  handleConfirmReset,
  handleCancelReset,

  // Encerrar sessao
  showEncerrarModal,
  historiaToEncerrar,
  encerrarLoading,
  handleConfirmEncerrar,
  handleCancelEncerrar,

  // Bulk delete
  showBulkDeleteModal,
  bulkDeleteIds,
  bulkDeleteIgnoredCount,
  bulkDeleteLoading,
  handleBulkDeleteClick,
  handleConfirmBulkDelete,
  handleCancelBulkDelete,

  // Navegacao
  handleViewHistoria,
  handlePlayHistoria,
  handleEntrarPartida,
  handleResetarSessao,
  handleEncerrarSessao,

  // Utils
  clearError,
  ROUTES,
}) => {
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

  // Renderizador para maximo de participantes
  const renderMaxParticipantes = (historia) => (
    <div className="flex items-center space-x-2">
      <span className="text-cyan-400 font-semibold">
        {historia.maximo_de_participantes || 0}
      </span>
      <span className="text-slate-400 text-sm">jogadores</span>
    </div>
  );

  // Renderizador para status de sessao
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
      label: 'Nome da Historia',
      align: 'left',
      render: (row) => (
        <div className="flex items-center space-x-3">
          {row.imagem ? (
            <img src={row.imagem} alt={row.nome} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen size={16} className="text-white" />
            </div>
          )}
          <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
            {row.nome}
          </span>
        </div>
      )
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
      label: 'Maximo de Participantes',
      align: 'left',
      render: renderMaxParticipantes
    }
  ];

  const actions = [
    {
      label: 'Entrar na Partida',
      icon: <Target size={18} />,
      color: 'orange',
      onClick: (row) => handleEntrarPartida(row),
      show: (row) => row.sessaoAtiva === true
    },
    {
      label: 'Iniciar Sessao',
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
      label: 'Resetar Sessao',
      icon: <RotateCcw size={18} />,
      color: 'orange',
      onClick: (row) => handleResetarSessao(row),
      show: (row) => isOwner(row) && row.sessaoAtiva === true
    },
    {
      label: 'Encerrar Sessao',
      icon: <StopCircle size={18} />,
      color: 'red',
      onClick: (row) => handleEncerrarSessao(row),
      show: (row) => isOwner(row) && row.sessaoAtiva === true
    },
    {
      label: 'Deletar',
      icon: <Trash2 size={18} />,
      color: 'red',
      onClick: (row) => handleDeleteClick(row),
      show: (row) => isOwner(row)
    }
  ];

  if (loading && historias.length === 0) {
    return <TableSkeleton cols={5} />;
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Notificacao de erro */}
      {error && (
        <Notification
          message={error}
          type="error"
          onClose={clearError}
        />
      )}

      {/* Header da pagina */}
      <PageHeader
        title="Historias & Aventuras"
        subtitle="Gerencie suas campanhas e aventuras epicas"
        icon={BookOpen}
        actions={
          <Link to={ROUTES.NOVA_HISTORIA}>
            <button className="btn-rpg hover-lift flex items-center gap-2 cursor-pointer">
              <Plus size={18} />
              <span>Nova Historia</span>
            </button>
          </Link>
        }
      />

      {/* Cards de estatisticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total de Historias"
          value={estatisticas?.total || 0}
          icon={BookOpen}
          variant="primary"
        />
        <StatCard
          title="Vagas Disponiveis"
          value={estatisticas?.totalParticipantes || 0}
          icon={Target}
          variant="secondary"
        />
      </div>

      {/* Busca */}
      <SearchBar
        placeholder="Buscar historias por nome..."
        onChange={(texto) => aplicarFiltros({ busca: texto })}
        className="mb-4"
      />

      {/* Tabela de historias */}
      <TabelaList
        header="Lista de Historias"
        columns={columns}
        data={historiasFiltradasComTemas || historias}
        actions={actions}
        loading={loading}
        pagination={true}
        initialPageSize={10}
        pageSizeOptions={[5, 10, 25, 50]}
        emptyMessage="Nenhuma historia encontrada"
        emptyIcon={<BookOpen size={32} />}
        hoverable={true}
        selectable={true}
        bulkActions={[
          { label: 'Deletar Selecionados', icon: <Trash2 size={14} />, color: 'red', onClick: handleBulkDeleteClick }
        ]}
      />

      {/* Modal de Confirmacao */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Deletar Historia"
        message={`Tem certeza de que deseja deletar a historia "${historiaToDelete?.nome}"? Esta acao nao pode ser desfeita.`}
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
        message={`Tem certeza de que deseja deletar ${bulkDeleteIds.length} historia(s)? Esta acao nao pode ser desfeita.${bulkDeleteIgnoredCount > 0 ? ` ${bulkDeleteIgnoredCount} selecionada(s) foram ignoradas por falta de permissao.` : ''}`}
        confirmText="Deletar Todos"
        cancelText="Cancelar"
        onConfirm={handleConfirmBulkDelete}
        onCancel={handleCancelBulkDelete}
        loading={bulkDeleteLoading}
        variant="danger"
      />

      {/* Modal de Resetar Sessao */}
      <ConfirmationModal
        isOpen={showResetModal}
        title="Resetar Sessao de Jogo"
        message={`Tem certeza de que deseja resetar a sessao da historia "${historiaToReset?.nome}"?

Esta acao ira:

• Apagar todos os turnos e rodadas
• Limpar todas as mensagens do chat
• Remover a ordem dos jogadores
• Desconectar todos os jogadores
• Permitir reiniciar do zero

Esta acao nao pode ser desfeita.`}
        confirmText="Resetar Sessao"
        cancelText="Cancelar"
        onConfirm={handleConfirmReset}
        onCancel={handleCancelReset}
        loading={resetLoading}
        variant="danger"
      />

      {/* Modal de Encerrar Sessao */}
      <ConfirmationModal
        isOpen={showEncerrarModal}
        title="Encerrar Sessao de Jogo"
        message={`Deseja encerrar permanentemente a sessao da historia "${historiaToEncerrar?.nome}"?

Esta acao ira:

• Encerrar a sessao e limpar todos os dados
• Desconectar todos os jogadores da sala
• Limpar cache do Mestre e dados em memoria
• Finalizar o registro no banco de dados

Esta acao nao pode ser desfeita.`}
        confirmText="Encerrar Sessao"
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
