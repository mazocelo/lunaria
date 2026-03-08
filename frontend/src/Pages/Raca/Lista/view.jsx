import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useViewModel } from '../../../shared/hooks/useViewModel.js';
import { racaViewModel } from '../../../viewmodels/Racas/RacaViewModel';
import StatCard from '../../../components/StatCard.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner.jsx';
import { TabelaList, PageHeader, SearchBar } from '../../../components/shared';
import { useTheme } from '../../../contexts/theme.jsx';
import { generateRoute } from '../../../routes.jsx';
import { Dna, Eye, Gift, Coins } from 'lucide-react';

const RacaListaView = () => {
  const vm = useViewModel(racaViewModel);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    vm.loadRacas();
  }, []);

  if (vm.loading && vm.racas.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <LoadingSpinner size="xl" text="Carregando raças..." variant="primary" />
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
      label: 'Descrição',
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

  const racas = vm.filteredRacas?.length > 0 ? vm.filteredRacas : vm.racas;
  const gratuitas = (vm.racas || []).filter(r => r.custo === 0).length;
  const pagas = (vm.racas || []).length - gratuitas;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Raças"
        subtitle="Raças disponíveis para personagens"
        icon={Dna}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total de Raças" value={vm.racas?.length || 0} icon={Dna} variant="primary" />
        <StatCard title="Gratuitas" value={gratuitas} icon={Gift} variant="secondary" />
        <StatCard title="Com Custo" value={pagas} icon={Coins} variant="accent" />
      </div>

      <SearchBar
        placeholder="Buscar raças..."
        onChange={(texto) => vm.buscarRacas?.(texto)}
      />

      <TabelaList
        header="Lista de Raças"
        columns={columns}
        data={racas}
        actions={actions}
        loading={vm.loading}
        pagination={true}
        initialPageSize={10}
        pageSizeOptions={[5, 10, 25, 50]}
        emptyMessage="Nenhuma raça encontrada"
        emptyIcon={<Dna size={32} />}
        hoverable={true}
      />
    </div>
  );
};

export default RacaListaView;
