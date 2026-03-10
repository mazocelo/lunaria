import React from 'react';
import StatCard from '../../../components/StatCard.jsx';
import { TabelaList, PageHeader, Badge, SearchBar, TableSkeleton } from '../../../components/shared';
import Notification from '../../../components/Notification.jsx';
import { Wand2, Eye, Swords, Heart, Shield, Flame } from 'lucide-react';

const categoriaLabels = {
  combate_fisico: 'Combate Físico',
  magia_ofensiva: 'Magia Ofensiva',
  magia_defensiva: 'Magia Defensiva',
  cura: 'Cura',
  suporte: 'Suporte',
  controle: 'Controle',
  utilidade: 'Utilidade',
  social: 'Social',
  crafting: 'Crafting',
};

const categoriaVariant = {
  combate_fisico: 'red',
  magia_ofensiva: 'purple',
  magia_defensiva: 'blue',
  cura: 'green',
  suporte: 'cyan',
  controle: 'amber',
  utilidade: 'slate',
  social: 'pink',
  crafting: 'orange',
};

const HabilidadeListaView = ({
  habilidades,
  filteredHabilidades,
  loading,
  error,
  isLight,
  total,
  stats,
  buscarHabilidades,
  filtroCategoria,
  setFiltroCategoria,
  clearError,
  navigate,
  generateRoute,
}) => {
  if (loading && habilidades.length === 0) {
    return <TableSkeleton cols={7} />;
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
      key: 'categoria',
      label: 'Categoria',
      align: 'left',
      render: (row) => (
        <Badge variant={categoriaVariant[row.categoria] || 'slate'}>
          {categoriaLabels[row.categoria] || row.categoria}
        </Badge>
      )
    },
    {
      key: 'tipo',
      label: 'Tipo',
      align: 'left',
      render: (row) => {
        const variantMap = { dano: 'red', cura: 'green', buff: 'cyan', debuff: 'amber', controle: 'purple' };
        return <Badge variant={variantMap[row.tipo] || 'slate'}>{row.tipo}</Badge>;
      }
    },
    {
      key: 'nivel_requerido',
      label: 'Nivel',
      align: 'left',
      render: (row) => <span className="text-cyan-400 font-semibold">{row.nivel_requerido}</span>
    },
    {
      key: 'custo_mana',
      label: 'Mana',
      align: 'left',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          isLight ? 'bg-blue-100 text-blue-800' : 'bg-blue-500/20 text-blue-400'
        }`}>
          {row.custo_mana}
        </span>
      )
    },
    {
      key: 'elemento',
      label: 'Elemento',
      align: 'left',
      render: (row) => row.elemento
        ? <Badge variant="purple">{row.elemento}</Badge>
        : <span className="text-slate-500 text-xs">-</span>
    },
    {
      key: 'classe',
      label: 'Classe',
      align: 'left',
      render: (row) => row.classe
        ? <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{row.classe.nome}</span>
        : <span className="text-slate-500 text-xs">Genérica</span>
    }
  ];

  const actions = [
    {
      label: 'Ver',
      icon: <Eye size={18} />,
      color: 'purple',
      onClick: (row) => navigate(generateRoute.verHabilidade(row.id))
    }
  ];

  const displayData = filteredHabilidades?.length > 0 || filteredHabilidades?.length === 0
    ? filteredHabilidades
    : habilidades;

  const categoriaOptions = Object.entries(categoriaLabels);

  return (
    <div className="animate-fade-in space-y-6">
      {error && <Notification message={error} type="error" onClose={clearError} />}

      <PageHeader
        title="Habilidades"
        subtitle={`${total} habilidades no sistema de RPG`}
        icon={Wand2}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total" value={total} icon={Wand2} variant="primary" />
        <StatCard title="Combate" value={(stats.categorias?.combate_fisico || 0) + (stats.categorias?.magia_ofensiva || 0)} icon={Swords} variant="accent" />
        <StatCard title="Cura/Suporte" value={(stats.categorias?.cura || 0) + (stats.categorias?.suporte || 0)} icon={Heart} variant="secondary" />
        <StatCard title="Crafting" value={stats.categorias?.crafting || 0} icon={Flame} variant="warning" />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            placeholder="Buscar habilidades por nome ou descricao..."
            onChange={(texto) => buscarHabilidades(texto)}
          />
        </div>
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className={`px-4 py-2 rounded-lg font-modern text-sm ${
            isLight
              ? 'bg-white border border-slate-300 text-slate-800'
              : 'bg-slate-800 border border-slate-600 text-white'
          }`}
        >
          <option value="">Todas as categorias</option>
          {categoriaOptions.map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <TabelaList
        header="Lista de Habilidades"
        columns={columns}
        data={displayData}
        actions={actions}
        loading={loading}
        pagination={true}
        initialPageSize={15}
        pageSizeOptions={[10, 15, 25, 50, 100]}
        emptyMessage="Nenhuma habilidade encontrada"
        emptyIcon={<Wand2 size={32} />}
        hoverable={true}
      />
    </div>
  );
};

export default HabilidadeListaView;
