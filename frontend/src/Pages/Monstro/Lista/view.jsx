import React, { useEffect } from 'react';
import { useViewModel } from '../../../shared/hooks/useViewModel.js';
import { monstroViewModel } from '../../../viewmodels/Monstros/MonstroViewModel';
import StatCard from '../../../components/StatCard.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner.jsx';
import { TabelaList } from '../../../components/shared';
import { useTheme } from '../../../contexts/theme.jsx';

const MonstroListaView = () => {
  const vm = useViewModel(monstroViewModel);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    vm.loadMonstros();
  }, []);

  if (vm.loading && vm.monstros.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <LoadingSpinner size="xl" text="Carregando monstros..." variant="primary" />
        </div>
      </div>
    );
  }

  const raridadeColors = {
    'Comum': isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-700/50 text-slate-300',
    'Incomum': isLight ? 'bg-green-100 text-green-800' : 'bg-green-500/20 text-green-400',
    'Raro': isLight ? 'bg-blue-100 text-blue-800' : 'bg-blue-500/20 text-blue-400',
    'Muito Raro': isLight ? 'bg-purple-100 text-purple-800' : 'bg-purple-500/20 text-purple-400',
    'Epico': isLight ? 'bg-pink-100 text-pink-800' : 'bg-pink-500/20 text-pink-400',
    'Lendario': isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-400',
    'Artefato': isLight ? 'bg-red-100 text-red-800' : 'bg-red-500/20 text-red-400',
  };

  const renderTipo = (row) => {
    const tipos = Array.isArray(row.tipo) ? row.tipo : [];
    return (
      <div className="flex flex-wrap gap-1">
        {tipos.length > 0 ? tipos.map((t, i) => (
          <span key={i} className={`px-2 py-0.5 rounded-full text-xs font-modern ${
            isLight ? 'bg-orange-100 text-orange-800' : 'bg-orange-500/20 text-orange-400'
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
            isLight ? 'bg-red-100 text-red-800' : 'bg-red-500/20 text-red-400'
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
      key: 'categoria',
      label: 'Categoria',
      align: 'left',
      render: (row) => {
        const nome = row.categoria_rel?.nome;
        if (!nome) return <span className="text-slate-500 text-xs">-</span>;
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-modern ${
            isLight ? 'bg-indigo-100 text-indigo-800' : 'bg-indigo-500/20 text-indigo-400'
          }`}>{nome}</span>
        );
      }
    },
    {
      key: 'raridade',
      label: 'Raridade',
      align: 'left',
      render: (row) => {
        const nome = row.raridade_rel?.nome || 'Comum';
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            raridadeColors[nome] || raridadeColors['Comum']
          }`}>{nome}</span>
        );
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

  const monstros = vm.filteredMonstros?.length > 0 || vm.searchTerm
    ? vm.filteredMonstros
    : vm.monstros;

  const raridades = (vm.monstros || []).reduce((acc, m) => {
    const r = m.raridade_rel?.nome || 'Comum';
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
            Monstros
          </h1>
          <p className="text-slate-400 font-modern">
            Bestiario do mundo de Lunaria
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total" value={vm.monstros?.length || 0} icon="👹" variant="primary" />
        <StatCard title="Comuns" value={raridades['Comum'] || 0} icon="⚪" variant="secondary" />
        <StatCard title="Raros+" value={(raridades['Raro'] || 0) + (raridades['Epico'] || 0) + (raridades['Lendario'] || 0)} icon="💎" variant="accent" />
        <StatCard title="Incomuns" value={raridades['Incomum'] || 0} icon="🟢" variant="secondary" />
      </div>

      <TabelaList
        header="Bestiario"
        columns={columns}
        data={monstros}
        actions={[]}
        loading={vm.loading}
        pagination={true}
        initialPageSize={10}
        pageSizeOptions={[5, 10, 25, 50]}
        emptyMessage="Nenhum monstro encontrado"
        emptyIcon="👹"
        hoverable={true}
      />
    </div>
  );
};

export default MonstroListaView;
