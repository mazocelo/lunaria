import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useViewModel } from '../../../shared/hooks/useViewModel.js';
import { equipamentoViewModel } from '../../../viewmodels/Equipamentos/EquipamentoViewModel';
import { catalogoService } from '../../../services/index.js';
import StatCard from '../../../components/StatCard.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner.jsx';
import { TabelaList, PageHeader, Badge } from '../../../components/shared';
import { useTheme } from '../../../contexts/theme.jsx';
import { generateRoute } from '../../../routes.jsx';
import { Sword, Eye, Pencil, Trash2, Gem, Trophy, Flame, Sparkles } from 'lucide-react';

const raridadeColors = (raridade, isLight) => {
  const map = {
    'Comum': isLight ? 'bg-gray-100 text-gray-800' : 'bg-gray-500/20 text-gray-400',
    'Incomum': isLight ? 'bg-green-100 text-green-800' : 'bg-green-500/20 text-green-400',
    'Raro': isLight ? 'bg-blue-100 text-blue-800' : 'bg-blue-500/20 text-blue-400',
    'Muito Raro': isLight ? 'bg-purple-100 text-purple-800' : 'bg-purple-500/20 text-purple-400',
    'Lendario': isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-400',
    'Artefato': isLight ? 'bg-red-100 text-red-800' : 'bg-red-500/20 text-red-400',
  };
  return map[raridade] || (isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-700/50 text-slate-300');
};

const EquipamentoListaView = () => {
  const vm = useViewModel(equipamentoViewModel);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [raridades, setRaridades] = useState([]);
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    vm.loadEquipamentos();
    catalogoService.getRaridades().then(r => setRaridades(r.data || [])).catch(() => {});
    catalogoService.getCategoriasEquipamento().then(r => setCategorias(r.data || [])).catch(() => {});
  }, []);

  if (vm.loading && vm.equipamentos.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <LoadingSpinner size="xl" text="Carregando equipamentos..." variant="primary" />
        </div>
      </div>
    );
  }

  const countByRaridade = (nome) => (vm.equipamentos || []).filter(e => e.raridade_rel?.nome === nome).length;

  const columns = [
    {
      key: 'numero',
      label: '#',
      align: 'left',
      render: (row) => <span className="font-mono text-purple-400">#{row.numero || row.id}</span>
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
        <span className={`px-2 py-0.5 rounded-full text-xs font-modern ${
          isLight ? 'bg-indigo-100 text-indigo-800' : 'bg-indigo-500/20 text-indigo-400'
        }`}>
          {row.categoria_rel?.nome || '-'}
        </span>
      )
    },
    {
      key: 'raridade',
      label: 'Raridade',
      align: 'left',
      render: (row) => {
        const nome = row.raridade_rel?.nome || 'Comum';
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${raridadeColors(nome, isLight)}`}>
            {nome}
          </span>
        );
      }
    },
    {
      key: 'vinculo',
      label: 'Vinculo',
      align: 'center',
      render: (row) => row.vinculo?.requer ? (
        <span className={`px-2 py-0.5 rounded-full text-xs font-modern ${
          isLight ? 'bg-yellow-100 text-yellow-800' : 'bg-yellow-500/20 text-yellow-400'
        }`} title={row.vinculo.restricao_tipo ? `Tipo: ${row.vinculo.restricao_tipo}${row.vinculo.restricao ? ' \u2014 ' + row.vinculo.restricao.join(', ') : ''}` : 'Requer vinculo magico (max. 3 por personagem)'}>
          <Sparkles size={12} className="inline" /> {row.vinculo.restricao_tipo || 'Livre'}
        </span>
      ) : (
        <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>{"\u2014"}</span>
      )
    }
  ];

  const actions = [
    {
      label: 'Ver',
      icon: <Eye size={18} />,
      color: 'purple',
      onClick: (row) => navigate(generateRoute.verEquipamento(row.id))
    },
    {
      label: 'Editar',
      icon: <Pencil size={18} />,
      color: 'blue',
      onClick: (row) => navigate(generateRoute.editarEquipamento(row.id))
    },
    {
      label: 'Deletar',
      icon: <Trash2 size={18} />,
      color: 'red',
      onClick: async (row) => {
        if (window.confirm(`Deseja realmente excluir "${row.nome}"?`)) {
          const result = await vm.deleteEquipamento(row.id);
          if (!result.success) alert(result.error);
        }
      }
    }
  ];

  const equipamentos = vm.filteredEquipamentos?.length > 0 || vm.searchTerm || vm.categoriaFilter || vm.raridadeFilter
    ? vm.filteredEquipamentos
    : vm.equipamentos;

  const selectCls = `px-3 py-2 rounded-lg text-sm font-modern transition-all duration-200 ${
    isLight
      ? 'bg-slate-100 border border-slate-300 text-slate-800 focus:border-purple-500'
      : 'bg-slate-800/50 border border-slate-600 text-white focus:border-purple-500'
  } focus:outline-none focus:ring-2 focus:ring-purple-500/20`;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Equipamentos"
        subtitle="Armas, armaduras e itens magicos"
        icon={Sword}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total de Equipamentos" value={vm.totalCount || vm.equipamentos?.length || 0} icon={Sword} variant="primary" />
        <StatCard title="Raros" value={countByRaridade('Raro')} icon={Gem} variant="secondary" />
        <StatCard title="Lendarios" value={countByRaridade('Lendario')} icon={Trophy} variant="accent" />
        <StatCard title="Artefatos" value={countByRaridade('Artefato')} icon={Flame} variant="primary" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-4">
        <select
          value={vm.categoriaFilter}
          onChange={(e) => vm.setCategoriaFilter(e.target.value)}
          className={selectCls}
        >
          <option value="">Todas as Categorias</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.nome}>{cat.nome}</option>
          ))}
        </select>

        <select
          value={vm.raridadeFilter}
          onChange={(e) => vm.setRaridadeFilter(e.target.value)}
          className={selectCls}
        >
          <option value="">Todas as Raridades</option>
          {raridades.map(rar => (
            <option key={rar.id} value={rar.nome}>{rar.nome}</option>
          ))}
        </select>
      </div>

      <TabelaList
        header="Lista de Equipamentos"
        columns={columns}
        data={equipamentos}
        actions={actions}
        loading={vm.loading}
        pagination={true}
        totalCount={vm.totalCount}
        currentPage={vm.currentPage}
        pageSize={vm.pageSize}
        onPageChange={vm.handlePageChange}
        onPageSizeChange={vm.handlePageSizeChange}
        initialPageSize={25}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage="Nenhum equipamento encontrado"
        emptyIcon={<Sword size={32} />}
        hoverable={true}
      />
    </div>
  );
};

export default EquipamentoListaView;
