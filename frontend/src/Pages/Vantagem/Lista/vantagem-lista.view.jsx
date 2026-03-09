import React from 'react';
import StatCard from '../../../components/StatCard.jsx';
import { TabelaList, PageHeader, Badge, SearchBar, TableSkeleton } from '../../../components/shared';
import Notification from '../../../components/Notification.jsx';
import { Sparkles, Eye, TrendingUp, TrendingDown } from 'lucide-react';

const VantagemListaView = ({
  vantagens,
  filteredVantagens,
  loading,
  error,
  isLight,
  positivas,
  negativas,
  buscarVantagens,
  clearError,
  navigate,
  generateRoute,
}) => {
  if (loading && vantagens.length === 0) {
    return <TableSkeleton cols={6} />;
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
          <Badge key={i} variant="purple">{e}</Badge>
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
      icon: <Eye size={18} />,
      color: 'purple',
      onClick: (row) => navigate(generateRoute.verVantagem(row.id))
    }
  ];

  const displayVantagens = filteredVantagens?.length > 0 ? filteredVantagens : vantagens;

  return (
    <div className="animate-fade-in space-y-6">
      {error && (
        <Notification message={error} type="error" onClose={clearError} />
      )}

      <PageHeader
        title="Vantagens"
        subtitle="Habilidades e poderes para personagens"
        icon={Sparkles}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total de Vantagens" value={vantagens?.length || 0} icon={Sparkles} variant="primary" />
        <StatCard title="Positivas" value={positivas} icon={TrendingUp} variant="secondary" />
        <StatCard title="Negativas" value={negativas} icon={TrendingDown} variant="accent" />
      </div>

      <SearchBar
        placeholder="Buscar vantagens..."
        onChange={(texto) => buscarVantagens(texto)}
      />

      <TabelaList
        header="Lista de Vantagens"
        columns={columns}
        data={displayVantagens}
        actions={actions}
        loading={loading}
        pagination={true}
        initialPageSize={10}
        pageSizeOptions={[5, 10, 25, 50]}
        emptyMessage="Nenhuma vantagem encontrada"
        emptyIcon={<Sparkles size={32} />}
        hoverable={true}
      />
    </div>
  );
};

export default VantagemListaView;
