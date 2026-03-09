import React from 'react';
import StatCard from '../../../components/StatCard.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner.jsx';
import { TabelaList, PageHeader, SearchBar } from '../../../components/shared';
import Notification from '../../../components/Notification.jsx';
import { Dna, Eye, Gift, Coins } from 'lucide-react';

const RacaListaView = ({
  racas,
  filteredRacas,
  loading,
  error,
  isLight,
  gratuitas,
  pagas,
  buscarRacas,
  clearError,
  navigate,
  generateRoute,
}) => {
  if (loading && racas.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <LoadingSpinner size="xl" text="Carregando racas..." variant="primary" />
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
          {row.descricao ? (row.descricao.length > 80 ? row.descricao.slice(0, 80) + '...' : row.descricao) : '-'}
        </span>
      )
    },
    {
      key: 'custo',
      label: 'Custo',
      align: 'left',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          row.custo === 0
            ? (isLight ? 'bg-green-100 text-green-800' : 'bg-green-500/20 text-green-400')
            : (isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-400')
        }`}>
          {row.custo === 0 ? 'Gratuita' : `${row.custo} pts`}
        </span>
      )
    }
  ];

  const actions = [
    {
      label: 'Ver',
      icon: <Eye size={18} />,
      color: 'purple',
      onClick: (row) => navigate(generateRoute.verRaca(row.id))
    }
  ];

  const displayRacas = filteredRacas?.length > 0 ? filteredRacas : racas;

  return (
    <div className="animate-fade-in space-y-6">
      {error && (
        <Notification message={error} type="error" onClose={clearError} />
      )}

      <PageHeader
        title="Racas"
        subtitle="Racas disponiveis para personagens"
        icon={Dna}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total de Racas" value={racas?.length || 0} icon={Dna} variant="primary" />
        <StatCard title="Gratuitas" value={gratuitas} icon={Gift} variant="secondary" />
        <StatCard title="Com Custo" value={pagas} icon={Coins} variant="accent" />
      </div>

      <SearchBar
        placeholder="Buscar racas..."
        onChange={(texto) => buscarRacas(texto)}
      />

      <TabelaList
        header="Lista de Racas"
        columns={columns}
        data={displayRacas}
        actions={actions}
        loading={loading}
        pagination={true}
        initialPageSize={10}
        pageSizeOptions={[5, 10, 25, 50]}
        emptyMessage="Nenhuma raca encontrada"
        emptyIcon={<Dna size={32} />}
        hoverable={true}
      />
    </div>
  );
};

export default RacaListaView;
