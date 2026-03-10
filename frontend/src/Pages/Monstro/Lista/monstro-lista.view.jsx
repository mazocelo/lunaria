import React from 'react';
import StatCard from '../../../components/StatCard.jsx';
import { TabelaList, PageHeader, Badge, SearchBar, TableSkeleton } from '../../../components/shared';
import Notification from '../../../components/Notification.jsx';
import { Skull, Circle, Gem, Leaf, Eye } from 'lucide-react';

const raridadeVariant = {
  'Comum': 'slate',
  'Incomum': 'green',
  'Raro': 'blue',
  'Muito Raro': 'purple',
  'Epico': 'pink',
  'Lendario': 'amber',
  'Artefato': 'red',
};

const MonstroListaView = ({
  monstros,
  filteredMonstros,
  loading,
  error,
  searchTerm,
  totalCount,
  currentPage,
  pageSize,
  isLight,
  raridades,
  handlePageChange,
  handlePageSizeChange,
  buscarMonstros,
  clearError,
  navigate,
  generateRoute,
}) => {
  if (loading && monstros.length === 0) {
    return <TableSkeleton cols={10} />;
  }

  const renderTipo = (row) => {
    const tipos = Array.isArray(row.tipo) ? row.tipo : [];
    return (
      <div className="flex flex-wrap gap-1">
        {tipos.length > 0 ? tipos.map((t, i) => (
          <Badge key={i} variant="amber">{t}</Badge>
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
      key: 'categoria',
      label: 'Categoria',
      align: 'left',
      render: (row) => {
        const nome = row.categoria_rel?.nome;
        if (!nome) return <span className="text-slate-500 text-xs">-</span>;
        return <Badge variant="indigo">{nome}</Badge>;
      }
    },
    {
      key: 'raridade',
      label: 'Raridade',
      align: 'left',
      render: (row) => {
        const nome = row.raridade_rel?.nome || 'Comum';
        return <Badge variant={raridadeVariant[nome] || 'slate'}>{nome}</Badge>;
      }
    },
    {
      key: 'nivel',
      label: 'Nivel',
      align: 'left',
      render: (row) => (
        <span className="text-cyan-400 font-semibold">
          {row.nivel_min}-{row.nivel_max}
        </span>
      )
    },
    {
      key: 'hp_base',
      label: 'HP',
      align: 'left',
      render: (row) => (
        <span className="text-red-400 font-semibold">{row.hp_base}</span>
      )
    },
    {
      key: 'dano_base',
      label: 'Dano',
      align: 'left',
      render: (row) => (
        <span className={`${isLight ? 'text-slate-700' : 'text-slate-300'} font-mono text-sm`}>
          {row.dano_base || '-'}
        </span>
      )
    },
    {
      key: 'elemento',
      label: 'Elemento',
      align: 'left',
      render: renderElemento
    },
    {
      key: 'xp_base',
      label: 'XP',
      align: 'left',
      render: (row) => (
        <span className="text-amber-400 font-semibold">{row.xp_base}</span>
      )
    }
  ];

  const displayMonstros = filteredMonstros?.length > 0 || searchTerm
    ? filteredMonstros
    : monstros;

  return (
    <div className="animate-fade-in space-y-6">
      {error && (
        <Notification message={error} type="error" onClose={clearError} />
      )}

      <PageHeader
        title="Monstros"
        subtitle="Bestiario do mundo de Lunaria"
        icon={Skull}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total" value={totalCount || monstros?.length || 0} icon={Skull} variant="primary" />
        <StatCard title="Comuns" value={raridades['Comum'] || 0} icon={Circle} variant="secondary" />
        <StatCard title="Raros+" value={(raridades['Raro'] || 0) + (raridades['Epico'] || 0) + (raridades['Lendario'] || 0)} icon={Gem} variant="accent" />
        <StatCard title="Incomuns" value={raridades['Incomum'] || 0} icon={Leaf} variant="secondary" />
      </div>

      <SearchBar
        placeholder="Buscar monstros..."
        onChange={(texto) => buscarMonstros(texto)}
      />

      <TabelaList
        header="Bestiario"
        columns={columns}
        data={displayMonstros}
        actions={[
          {
            label: 'Ver',
            icon: <Eye size={18} />,
            color: 'purple',
            onClick: (row) => navigate(generateRoute.verMonstro(row.id))
          }
        ]}
        loading={loading}
        pagination={true}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        initialPageSize={25}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage="Nenhum monstro encontrado"
        emptyIcon={<Skull size={32} />}
        hoverable={true}
      />
    </div>
  );
};

export default MonstroListaView;
