import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useViewModel } from '../../../shared/hooks/useViewModel';
import { temaViewModel } from '../../../viewmodels/Temas';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES, generateRoute } from '../../../routes.jsx';
import { TabelaList, PageHeader } from '../../../components/shared';
import StatCard from '../../../components/StatCard.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner.jsx';
import { Palette, Plus, Pencil, Trash2 } from 'lucide-react';

const TemaListaView = () => {
  const vm = useViewModel(temaViewModel);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => { vm.loadTemas(); }, []);

  if (vm.loading && vm.temas.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <LoadingSpinner size="xl" text="Carregando temas..." variant="primary" />
        </div>
      </div>
    );
  }

  const handleDelete = async (row) => {
    if (window.confirm(`Tem certeza que deseja excluir o tema "${row.nome}"?`)) {
      await vm.deleteTema(row.id);
    }
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
      key: 'descricao',
      label: 'Descrição',
      align: 'left',
      render: (row) => (
        <span className={`${isLight ? 'text-slate-600' : 'text-slate-300'} font-modern text-sm`}>
          {row.descricao ? (row.descricao.length > 100 ? row.descricao.slice(0, 100) + '...' : row.descricao) : '-'}
        </span>
      )
    }
  ];

  const actions = [
    {
      label: 'Editar',
      icon: <Pencil size={18} />,
      color: 'cyan',
      onClick: (row) => navigate(generateRoute.editarTema(row.id))
    },
    {
      label: 'Excluir',
      icon: <Trash2 size={18} />,
      color: 'red',
      onClick: handleDelete
    }
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {vm.error && (
        <div className={`mb-4 p-4 rounded-lg border ${isLight ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-500/20 border-red-500/30 text-red-300'}`}>
          {vm.error}
        </div>
      )}

      <PageHeader
        title="Temas"
        subtitle="Temas de ambientação para histórias"
        icon={Palette}
        actions={
          <button className="btn-rpg hover-lift flex items-center gap-2 cursor-pointer" onClick={() => navigate(ROUTES.NOVO_TEMA)}>
            <Plus size={18} />
            <span>Novo Tema</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total de Temas" value={vm.temas?.length || 0} icon={Palette} variant="primary" />
      </div>

      <TabelaList
        header="Lista de Temas"
        columns={columns}
        data={vm.temas}
        actions={actions}
        loading={vm.loading}
        pagination={true}
        initialPageSize={10}
        pageSizeOptions={[5, 10, 25, 50]}
        emptyMessage="Nenhum tema encontrado"
        emptyIcon={<Palette size={32} />}
        hoverable={true}
      />
    </div>
  );
};

export default TemaListaView;
