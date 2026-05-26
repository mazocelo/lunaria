import { Link } from 'react-router-dom';
import StatCard from '../../../components/StatCard';
import Notification from '../../../components/Notification';
import ConfirmationModal from '../../../components/ConfirmationModal';
import ConviteModal from '../../../components/ConviteModal';
import { TabelaList, SearchBar, PageHeader, Badge, TableSkeleton } from '../../../components/shared';
import { BookOpen, Plus, Eye, Mail, Play, Target, RotateCcw, StopCircle, Trash2 } from 'lucide-react';
import { useTheme } from '../../../contexts/theme';
import { ROUTES } from '../../../constants/routes';
import type { Historia } from '../../../types/api';
import type { HistoriaComTemas } from './historia-lista.model';

interface HistoriaListaViewProps {
  historias: HistoriaComTemas[];
  historiasFiltradasComTemas: HistoriaComTemas[];
  estatisticas: { total: number; comTemas: number; totalParticipantes: number; mediaParticipantes: number };
  loading: boolean;
  error: string | null;
  aplicarFiltros: (filtros: { busca?: string; tema?: number | null; participantes?: number | null }) => void;
  getNomesTemas: (historia: Historia | null | undefined) => unknown[];
  isOwner: (historia: Historia | null | undefined) => boolean;
  showDeleteModal: boolean;
  historiaToDelete: Historia | null;
  deleteLoading: boolean;
  handleDeleteClick: (historia: Historia) => void;
  handleConfirmDelete: () => void;
  handleCancelDelete: () => void;
  showConviteModal: boolean;
  historiaParaConvite: Historia | null;
  conviteLoading: boolean;
  handleConviteClick: (historia: Historia) => void;
  handleEnviarConvite: (email: string) => void;
  handleCancelConvite: () => void;
  showResetModal: boolean;
  historiaToReset: Historia | null;
  resetLoading: boolean;
  handleResetarSessao: (historia: Historia) => void;
  handleConfirmReset: () => void;
  handleCancelReset: () => void;
  showEncerrarModal: boolean;
  historiaToEncerrar: Historia | null;
  encerrarLoading: boolean;
  handleEncerrarSessao: (historia: Historia) => void;
  handleConfirmEncerrar: () => void;
  handleCancelEncerrar: () => void;
  showBulkDeleteModal: boolean;
  bulkDeleteIds: Array<number | string>;
  bulkDeleteIgnoredCount: number;
  bulkDeleteLoading: boolean;
  handleBulkDeleteClick: (ids: Array<number | string>) => void;
  handleConfirmBulkDelete: () => void;
  handleCancelBulkDelete: () => void;
  handleViewHistoria: (historia: Historia) => void;
  handlePlayHistoria: (historia: Historia) => void;
  handleEntrarPartida: (historia: Historia) => void;
  clearError: () => void;
}

const HistoriaListaView = ({
  historias,
  historiasFiltradasComTemas,
  estatisticas,
  loading,
  error,
  aplicarFiltros,
  getNomesTemas,
  isOwner,
  showDeleteModal,
  historiaToDelete,
  deleteLoading,
  handleDeleteClick,
  handleConfirmDelete,
  handleCancelDelete,
  showConviteModal,
  historiaParaConvite,
  conviteLoading,
  handleConviteClick,
  handleEnviarConvite,
  handleCancelConvite,
  showResetModal,
  historiaToReset,
  resetLoading,
  handleConfirmReset,
  handleCancelReset,
  showEncerrarModal,
  historiaToEncerrar,
  encerrarLoading,
  handleConfirmEncerrar,
  handleCancelEncerrar,
  showBulkDeleteModal,
  bulkDeleteIds,
  bulkDeleteIgnoredCount,
  bulkDeleteLoading,
  handleBulkDeleteClick,
  handleConfirmBulkDelete,
  handleCancelBulkDelete,
  handleViewHistoria,
  handlePlayHistoria,
  handleEntrarPartida,
  handleResetarSessao,
  handleEncerrarSessao,
  clearError,
}: HistoriaListaViewProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const renderTemas = (historia: HistoriaComTemas) => {
    const nomesTemas = (getNomesTemas ? getNomesTemas(historia) : []) as string[];
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

  const renderMaxParticipantes = (historia: HistoriaComTemas) => (
    <div className="flex items-center space-x-2">
      <span className="text-cyan-400 font-semibold">
        {historia.maximo_de_participantes || 0}
      </span>
      <span className="text-slate-400 text-sm">jogadores</span>
    </div>
  );

  const renderStatusSessao = (historia: HistoriaComTemas) => {
    if (historia.sessaoAtiva) {
      return (
        <Badge variant="green" dot>
          Em Andamento {(historia.totalJogadores ?? 0) > 0 ? `(${historia.totalJogadores})` : ''}
        </Badge>
      );
    }
    return <Badge variant="slate" dot>Aguardando</Badge>;
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      align: 'left' as const,
      render: (row: HistoriaComTemas) => <span className="font-mono text-purple-400">#{row.id}</span>
    },
    {
      key: 'nome',
      label: 'Nome da Historia',
      align: 'left' as const,
      render: (row: HistoriaComTemas) => (
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
    { key: 'temas', label: 'Temas', align: 'left' as const, render: renderTemas },
    { key: 'status_sessao', label: 'Status', align: 'left' as const, render: renderStatusSessao },
    { key: 'maximo_de_participantes', label: 'Maximo de Participantes', align: 'left' as const, render: renderMaxParticipantes }
  ];

  const actions = [
    { label: 'Entrar na Partida', icon: <Target size={18} />, color: 'orange', onClick: (row: HistoriaComTemas) => handleEntrarPartida(row), show: (row: HistoriaComTemas) => row.sessaoAtiva === true },
    { label: 'Iniciar Sessao', icon: <Play size={18} />, color: 'green', onClick: (row: HistoriaComTemas) => handlePlayHistoria(row), show: (row: HistoriaComTemas) => !row.sessaoAtiva },
    { label: 'Ver', icon: <Eye size={18} />, color: 'purple', onClick: (row: HistoriaComTemas) => handleViewHistoria(row), show: (row: HistoriaComTemas) => isOwner(row) },
    { label: 'Convidar', icon: <Mail size={18} />, color: 'blue', onClick: (row: HistoriaComTemas) => handleConviteClick(row), show: (row: HistoriaComTemas) => isOwner(row) },
    { label: 'Resetar Sessao', icon: <RotateCcw size={18} />, color: 'orange', onClick: (row: HistoriaComTemas) => handleResetarSessao(row), show: (row: HistoriaComTemas) => isOwner(row) && row.sessaoAtiva === true },
    { label: 'Encerrar Sessao', icon: <StopCircle size={18} />, color: 'red', onClick: (row: HistoriaComTemas) => handleEncerrarSessao(row), show: (row: HistoriaComTemas) => isOwner(row) && row.sessaoAtiva === true },
    { label: 'Deletar', icon: <Trash2 size={18} />, color: 'red', onClick: (row: HistoriaComTemas) => handleDeleteClick(row), show: (row: HistoriaComTemas) => isOwner(row) }
  ];

  if (loading && historias.length === 0) {
    return <TableSkeleton cols={5} />;
  }

  return (
    <div className="animate-fade-in space-y-6">
      {error && (
        <Notification message={error} type="error" onClose={clearError} />
      )}

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total de Historias" value={estatisticas?.total || 0} icon={BookOpen} variant="primary" />
        <StatCard title="Vagas Disponiveis" value={estatisticas?.totalParticipantes || 0} icon={Target} variant="secondary" />
      </div>

      <SearchBar
        placeholder="Buscar historias por nome..."
        onChange={(texto) => aplicarFiltros({ busca: texto })}
        className="mb-4"
      />

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

      <ConviteModal
        isOpen={showConviteModal}
        onClose={handleCancelConvite}
        onConfirm={handleEnviarConvite}
        historia={historiaParaConvite}
        loading={conviteLoading}
      />

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
