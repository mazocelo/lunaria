import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useViewModel } from '../../../shared/hooks/useViewModel.js';
import { desvantagemViewModel } from '../../../viewmodels/Desvantagens/DesvantagemViewModel';
import StatCard from '../../../components/StatCard.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner.jsx';
import { TabelaList, PageHeader, Badge, SearchBar } from '../../../components/shared';
import { useTheme } from '../../../contexts/theme.jsx';
import { generateRoute } from '../../../routes.jsx';
import { AlertTriangle, Eye, BarChart3, Tag } from 'lucide-react';

const DesvantagemListaView = () => {
  const vm = useViewModel(desvantagemViewModel);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    vm.loadDesvantagens();
  }, []);

  if (vm.loading && vm.desvantagens.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <LoadingSpinner size="xl" text="Carregando desvantagens..." variant="primary" />
        </div>
      </div>
    );
  }

  const renderTipo = (row) => {
    const tipos = Array.isArray(row.tipo) ? row.tipo : [];
    const variantMap = { 'ativa': 'blue', 'passiva': 'green', 'reacao': 'amber' };
    return (
      <div className="flex flex-wrap gap-1">
        {tipos.length > 0 ? tipos.map((t, i) => (
          <Badge key={i} variant={variantMap[t] || 'slate'}>{t}</Badge>
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
          <Badge key={i} variant="red">{e}</Badge>
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
          isLight ? 'bg-red-100 text-red-800' : 'bg-red-500/20 text-red-400'
        }`}>
          {row.custo} pts
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
      icon: <Eye size={18} />,
      color: 'purple',
      onClick: (row) => navigate(generateRoute.verDesvantagem(row.id))
    }
  ];

  const desvantagens = vm.filteredDesvantagens?.length > 0 ? vm.filteredDesvantagens : vm.desvantagens;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Desvantagens"
        subtitle="Fraquezas e desvantagens para personagens"
        icon={AlertTriangle}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total" value={vm.desvantagens?.length || 0} icon={AlertTriangle} variant="primary" />
        <StatCard title="Nivel Mais Comum" value={vm.nivelMaisComum || 1} icon={BarChart3} variant="secondary" />
        <StatCard title="Tipo Mais Comum" value={vm.tipoMaisComum || '-'} icon={Tag} variant="accent" />
      </div>

      <SearchBar
        placeholder="Buscar desvantagens..."
        onChange={(texto) => vm.buscarDesvantagens?.(texto)}
      />

      <TabelaList
        header="Lista de Desvantagens"
        columns={columns}
        data={desvantagens}
        actions={actions}
        loading={vm.loading}
        pagination={true}
        initialPageSize={10}
        pageSizeOptions={[5, 10, 25, 50]}
        emptyMessage="Nenhuma desvantagem encontrada"
        emptyIcon={<AlertTriangle size={32} />}
        hoverable={true}
      />
    </div>
  );
};

export default DesvantagemListaView;
