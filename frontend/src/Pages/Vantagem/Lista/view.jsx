import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useViewModel } from '../../../shared/hooks/useViewModel.js';
import { vantagemViewModel } from '../../../viewmodels/Vantagens/VantagemViewModel';
import StatCard from '../../../components/StatCard.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner.jsx';
import { TabelaList } from '../../../components/shared';
import { useTheme } from '../../../contexts/theme.jsx';
import { generateRoute } from '../../../routes.jsx';

const VantagemListaView = () => {
  const vm = useViewModel(vantagemViewModel);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    vm.loadVantagens();
  }, []);

  if (vm.loading && vm.vantagens.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <LoadingSpinner size="xl" text="Carregando vantagens..." variant="primary" />
        </div>
      </div>
    );
  }

  const renderTipo = (row) => {
    const tipos = Array.isArray(row.tipo) ? row.tipo : [];
    return (
      <div className="flex flex-wrap gap-1">
        {tipos.length > 0 ? tipos.map((t, i) => (
          <span key={i} className={`px-2 py-0.5 rounded-full text-xs font-modern ${
            t === 'ativa'
              ? (isLight ? 'bg-blue-100 text-blue-800' : 'bg-blue-500/20 text-blue-400')
              : t === 'passiva'
              ? (isLight ? 'bg-green-100 text-green-800' : 'bg-green-500/20 text-green-400')
              : t === 'reacao'
              ? (isLight ? 'bg-orange-100 text-orange-800' : 'bg-orange-500/20 text-orange-400')
              : (isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-700/50 text-slate-300')
          }`}>
            {t}
          </span>
        )) : <span className="text-slate-500 text-xs">-</span>}
      </div>
    );
  };

  const renderElemento = (row) => {
    const elementos = Array.isArray(row.elemento) ? row.elemento : [];
    if (elementos.length === 0) return <span className="text-slate-500 text-xs">-</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {elementos.map((e, i) => (
          <span key={i} className={`px-2 py-0.5 rounded-full text-xs font-modern ${
            isLight ? 'bg-purple-100 text-purple-800' : 'bg-purple-500/20 text-purple-400'
          }`}>
            {e}
          </span>
        ))}
      </div>
    );
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
      label: 'Nome',
      align: 'left',
      render: (row) => (
        <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
          {row.nome}
        </span>
      )
    },
    {
      key: 'tipo',
      label: 'Tipo',
      align: 'left',
      render: renderTipo
    },
    {
      key: 'nivel',
      label: 'Nivel',
      align: 'left',
      render: (row) => (
        <span className="text-cyan-400 font-semibold">{row.nivel || 1}</span>
      )
    },
    {
      key: 'custo',
      label: 'Custo',
      align: 'left',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          row.custo > 0
            ? (isLight ? 'bg-green-100 text-green-800' : 'bg-green-500/20 text-green-400')
            : row.custo < 0
            ? (isLight ? 'bg-red-100 text-red-800' : 'bg-red-500/20 text-red-400')
            : (isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-700/50 text-slate-300')
        }`}>
          {row.custo > 0 ? `+${row.custo}` : row.custo} pts
        </span>
      )
    },
    {
      key: 'elemento',
      label: 'Elemento',
      align: 'left',
      render: renderElemento
    }
  ];

  const actions = [
    {
      label: 'Ver',
      icon: '👁️',
      color: 'purple',
      onClick: (row) => navigate(generateRoute.verVantagem(row.id))
    }
  ];

  const vantagens = vm.filteredVantagens?.length > 0 ? vm.filteredVantagens : vm.vantagens;
  const positivas = (vm.vantagens || []).filter(v => v.custo > 0).length;
  const negativas = (vm.vantagens || []).filter(v => v.custo < 0).length;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
            Vantagens
          </h1>
          <p className="text-slate-400 font-modern">
            Habilidades e poderes para personagens
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total de Vantagens" value={vm.vantagens?.length || 0} icon="✨" variant="primary" />
        <StatCard title="Positivas" value={positivas} icon="⬆️" variant="secondary" />
        <StatCard title="Negativas" value={negativas} icon="⬇️" variant="accent" />
      </div>

      <TabelaList
        header="Lista de Vantagens"
        columns={columns}
        data={vantagens}
        actions={actions}
        loading={vm.loading}
        pagination={true}
        initialPageSize={10}
        pageSizeOptions={[5, 10, 25, 50]}
        emptyMessage="Nenhuma vantagem encontrada"
        emptyIcon="✨"
        hoverable={true}
      />
    </div>
  );
};

export default VantagemListaView;
