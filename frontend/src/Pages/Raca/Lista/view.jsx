import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useViewModel } from '../../../shared/hooks/useViewModel.js';
import { racaViewModel } from '../../../viewmodels/Racas/RacaViewModel';
import StatCard from '../../../components/StatCard.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner.jsx';
import { TabelaList } from '../../../components/shared';
import { useTheme } from '../../../contexts/theme.jsx';
import { generateRoute } from '../../../routes.jsx';

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
      icon: '👁️',
      color: 'purple',
      onClick: (row) => navigate(generateRoute.verRaca(row.id))
    }
  ];

  const racas = vm.filteredRacas?.length > 0 ? vm.filteredRacas : vm.racas;
  const gratuitas = (vm.racas || []).filter(r => r.custo === 0).length;
  const pagas = (vm.racas || []).length - gratuitas;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
            Racas
          </h1>
          <p className="text-slate-400 font-modern">
            Racas disponiveis para personagens
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total de Racas" value={vm.racas?.length || 0} icon="🧬" variant="primary" />
        <StatCard title="Gratuitas" value={gratuitas} icon="🆓" variant="secondary" />
        <StatCard title="Com Custo" value={pagas} icon="💰" variant="accent" />
      </div>

      <TabelaList
        header="Lista de Racas"
        columns={columns}
        data={racas}
        actions={actions}
        loading={vm.loading}
        pagination={true}
        initialPageSize={10}
        pageSizeOptions={[5, 10, 25, 50]}
        emptyMessage="Nenhuma raca encontrada"
        emptyIcon="🧬"
        hoverable={true}
      />
    </div>
  );
};

export default RacaListaView;
