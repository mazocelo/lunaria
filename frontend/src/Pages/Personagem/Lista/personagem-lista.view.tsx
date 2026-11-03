import { Link } from 'react-router-dom';
import { ROUTES, generateRoute } from '../../../constants/routes';
import { TabelaList, SearchBar, PageHeader, Badge, TableSkeleton } from '../../../components/shared';
import type { TabelaColumn, TabelaAction } from '../../../components/shared/TabelaList';
import StatCard from '../../../components/StatCard';
import ConfirmationModal from '../../../components/ConfirmationModal';
import Notification from '../../../components/Notification';
import { Users, Plus, Eye, Trash2, Shield, Sparkles } from 'lucide-react';
import { useTheme } from '../../../contexts/theme';
import type { Personagem } from '../../../models/Personagem';

interface PersonagemListaEstatisticas {
  total: number;
  guerreiros: number;
  magos: number;
}

interface PersonagemListaViewProps {
  personagens: Personagem[];
  loading: boolean;
  error: string | null;
  estatisticas: PersonagemListaEstatisticas;
  buscarPersonagens: (term: string) => void;
  clearError: () => void;
  navigate?: (path: string) => void;
  // Delete individual
  showDeleteModal: boolean;
  personagemToDelete: Personagem | null;
  deleteLoading: boolean;
  handleDeleteClick: (row: Personagem) => void;
  handleConfirmDelete: () => void;
  handleCancelDelete: () => void;
  // Bulk delete
  showBulkDeleteModal: boolean;
  bulkDeleteIds: Array<number | string>;
  bulkDeleteLoading: boolean;
  handleBulkDeleteClick: (ids: Array<number | string>) => void;
  handleConfirmBulkDelete: () => void;
  handleCancelBulkDelete: () => void;
}

interface HistoriaVinculo {
  id?: number | string;
  nome?: string;
}

const PersonagemListaView = ({
  personagens,
  loading,
  error,
  estatisticas,
  buscarPersonagens,
  clearError,
  navigate,
  // Delete individual
  showDeleteModal,
  personagemToDelete,
  deleteLoading,
  handleDeleteClick,
  handleConfirmDelete,
  handleCancelDelete,
  // Bulk delete
  showBulkDeleteModal,
  bulkDeleteIds,
  bulkDeleteLoading,
  handleBulkDeleteClick,
  handleConfirmBulkDelete,
  handleCancelBulkDelete,
}: PersonagemListaViewProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (loading && personagens.length === 0) {
    return <TableSkeleton cols={7} />;
  }

  const renderClasseIcon = (personagem: Personagem) => (
    <div className="flex items-center space-x-3">
      {personagem.imagem ? (
        <img src={personagem.imagem} alt={personagem.nome} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield size={16} className="text-white" />
        </div>
      )}
      <div>
        <div className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
          {personagem.nome}
        </div>
      </div>
    </div>
  );

  const renderNivel = (personagem: Personagem) => (
    <div className="flex items-center space-x-2">
      <span className="text-cyan-400 font-semibold">
        {personagem.nivel || 1}
      </span>
      <span className={`${isLight ? 'text-slate-500' : 'text-slate-400'} text-sm`}>nivel</span>
    </div>
  );

  const renderHP = (personagem: Personagem) => (
    <div className="flex items-center space-x-2">
      <span className="text-red-400 font-semibold">
        {personagem.hp || 100}
      </span>
      <span className={`${isLight ? 'text-slate-500' : 'text-slate-400'} text-sm`}>HP</span>
    </div>
  );

  const columns = [
    {
      key: 'id',
      label: 'ID',
      align: 'left' as const,
      render: (row: Personagem) => <span className="font-mono text-purple-400">#{row.id}</span>
    },
    {
      key: 'nome',
      label: 'Nome',
      align: 'left' as const,
      render: renderClasseIcon
    },
    {
      key: 'classe',
      label: 'Classe',
      align: 'left' as const,
      render: (row: Personagem) => (
        <span className={`${isLight ? 'text-slate-700' : 'text-white'} font-semibold font-modern`}>
          {row.classe || 'Aventureiro'}
        </span>
      )
    },
    {
      key: 'raca',
      label: 'Raca',
      align: 'left' as const,
      render: (row: Personagem) => (
        <span className={`${isLight ? 'text-slate-600' : 'text-slate-300'} font-modern`}>
          {row.raca || 'Humano'}
        </span>
      )
    },
    {
      key: 'historias',
      label: 'Historias',
      align: 'left' as const,
      render: (row: Personagem) => {
        const rawHistorias = (row.historias ?? []) as HistoriaVinculo[];
        const historias = Array.isArray(rawHistorias) && rawHistorias.length > 0
          ? rawHistorias
          : row.historia_nome
            ? [{ nome: row.historia_nome }]
            : [];

        if (historias.length === 0) {
          return (
            <span className={`${isLight ? 'text-slate-500' : 'text-slate-400'} font-modern text-sm italic`}>
              Sem historias
            </span>
          );
        }

        return (
          <div className="flex flex-wrap gap-1">
            {historias.map((historia, index) => (
              <Badge key={historia.id || index} variant="purple">{historia.nome}</Badge>
            ))}
          </div>
        );
      }
    },
    {
      key: 'nivel',
      label: 'Nivel',
      align: 'left' as const,
      render: renderNivel
    },
    {
      key: 'hp',
      label: 'HP',
      align: 'left' as const,
      render: renderHP
    }
  ];

  const actions = [
    {
      label: 'Ver',
      icon: <Eye size={18} />,
      color: 'purple',
      onClick: (row: Personagem) => {
        if (row.id != null) navigate?.(generateRoute.verPersonagem(row.id));
      },
    },
    {
      label: 'Deletar',
      icon: <Trash2 size={18} />,
      color: 'red',
      onClick: (row: Personagem) => handleDeleteClick(row),
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {error && (
        <Notification message={error} type="error" onClose={clearError} />
      )}

      <PageHeader
        title="Personagens & Herois"
        subtitle="Gerencie seus personagens e herois epicos"
        icon={Users}
        actions={
          <Link to={ROUTES.NOVO_PERSONAGEM}>
            <button className="btn-rpg hover-lift flex items-center gap-2 cursor-pointer">
              <Plus size={18} />
              <span>Novo Personagem</span>
            </button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total de Personagens" value={estatisticas?.total || 0} icon={Users} variant="primary" />
        <StatCard title="Guerreiros" value={estatisticas?.guerreiros || 0} icon={Shield} variant="secondary" />
        <StatCard title="Magos" value={estatisticas?.magos || 0} icon={Sparkles} variant="accent" />
      </div>

      <SearchBar
        placeholder="Buscar personagens por nome..."
        onChange={(texto: string) => buscarPersonagens(texto)}
      />

      <TabelaList
        header="Lista de Personagens"
        columns={columns as unknown as TabelaColumn<Record<string, unknown>>[]}
        data={personagens as unknown as Record<string, unknown>[]}
        actions={actions as unknown as TabelaAction<Record<string, unknown>>[]}
        loading={loading}
        pagination={true}
        initialPageSize={10}
        pageSizeOptions={[5, 10, 25, 50]}
        emptyMessage="Nenhum personagem encontrado"
        emptyIcon={<Users size={32} />}
        hoverable={true}
        selectable={true}
        bulkActions={[
          { label: 'Deletar Selecionados', icon: <Trash2 size={14} />, color: 'red', onClick: handleBulkDeleteClick }
        ]}
      />

      {/* Modal de Delete Individual */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Deletar Personagem"
        message={`Tem certeza de que deseja deletar "${personagemToDelete?.nome}"? Esta acao nao pode ser desfeita.`}
        confirmText="Deletar"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={deleteLoading}
        variant="danger"
      />

      {/* Modal de Bulk Delete */}
      <ConfirmationModal
        isOpen={showBulkDeleteModal}
        title="Deletar Personagens Selecionados"
        message={`Tem certeza de que deseja deletar ${bulkDeleteIds.length} personagem(ns)? Esta acao nao pode ser desfeita.`}
        confirmText="Deletar Todos"
        cancelText="Cancelar"
        onConfirm={handleConfirmBulkDelete}
        onCancel={handleCancelBulkDelete}
        loading={bulkDeleteLoading}
        variant="danger"
      />
    </div>
  );
};

export default PersonagemListaView;
