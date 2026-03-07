import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useViewModel } from '../../../shared/hooks/useViewModel.js';
import { equipamentoViewModel } from '../../../viewmodels/Equipamentos/EquipamentoViewModel';
import StatCard from '../../../components/StatCard.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner.jsx';
import { TabelaList } from '../../../components/shared';
import { useTheme } from '../../../contexts/theme.jsx';
import { generateRoute } from '../../../routes.jsx';

const CATEGORIAS = [
  'Espadas e Laminas', 'Machados, Martelos e Contundentes', 'Lancas, Alabardas e Armas de Haste',
  'Armas de Alcance', 'Armaduras e Escudos', 'Aneis Magicos', 'Amuletos e Colares',
  'Cajados, Varinhas e Orbes', 'Pocoes e Elixires', 'Itens de Uso e Ferramentas Magicas',
  'Artefatos Lendarios', 'Miscelanea Magica'
];

const RARIDADES = ['Comum', 'Incomum', 'Raro', 'Muito Raro', 'Lendario', 'Artefato', 'Variavel'];

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

  useEffect(() => {
    vm.loadEquipamentos();
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

  const countByRaridade = (raridade) => (vm.equipamentos || []).filter(e => e.raridade === raridade).length;

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
          {row.categoria || '-'}
        </span>
      )
    },
    {
      key: 'raridade',
      label: 'Raridade',
      align: 'left',
      render: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${raridadeColors(row.raridade, isLight)}`}>
          {row.raridade || 'Comum'}
        </span>
      )
    },
    {
      key: 'sintonizacao',
      label: 'Vinculo',
      align: 'center',
      render: (row) => row.sintonizacao ? (
        <span className={`px-2 py-0.5 rounded-full text-xs font-modern ${
          isLight ? 'bg-yellow-100 text-yellow-800' : 'bg-yellow-500/20 text-yellow-400'
        }`} title="Requer sintonizacao magica (max. 3 por personagem)">
          ✨ Vinculo
        </span>
      ) : (
        <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>—</span>
      )
    }
  ];

  const actions = [
    {
      label: 'Ver',
      icon: '👁️',
      color: 'purple',
      onClick: (row) => navigate(generateRoute.verEquipamento(row.id))
    },
    {
      label: 'Editar',
      icon: '✏️',
      color: 'blue',
      onClick: (row) => navigate(generateRoute.editarEquipamento(row.id))
    },
    {
      label: 'Deletar',
      icon: '🗑️',
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
            Equipamentos
          </h1>
          <p className="text-slate-400 font-modern">
            Armas, armaduras e itens magicos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total de Equipamentos" value={vm.equipamentos?.length || 0} icon="⚔️" variant="primary" />
        <StatCard title="Raros" value={countByRaridade('Raro')} icon="💎" variant="secondary" />
        <StatCard title="Lendarios" value={countByRaridade('Lendario')} icon="🏆" variant="accent" />
        <StatCard title="Artefatos" value={countByRaridade('Artefato')} icon="🔥" variant="primary" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-4">
        <select
          value={vm.categoriaFilter}
          onChange={(e) => vm.setCategoriaFilter(e.target.value)}
          className={selectCls}
        >
          <option value="">Todas as Categorias</option>
          {CATEGORIAS.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={vm.raridadeFilter}
          onChange={(e) => vm.setRaridadeFilter(e.target.value)}
          className={selectCls}
        >
          <option value="">Todas as Raridades</option>
          {RARIDADES.map(rar => (
            <option key={rar} value={rar}>{rar}</option>
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
        initialPageSize={10}
        pageSizeOptions={[5, 10, 25, 50]}
        emptyMessage="Nenhum equipamento encontrado"
        emptyIcon="⚔️"
        hoverable={true}
      />
    </div>
  );
};

export default EquipamentoListaView;
