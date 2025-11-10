import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useViewModel } from '../../shared/hooks/useViewModel';
import RacaViewModel from '../../viewmodels/Racas/RacaViewModel';
import { useTheme } from '../../contexts/theme.jsx';
import RPGCard from '../../components/RPGCard.jsx';
import Button from '../../components/form/button';
import InputSimples from '../../components/form/inputSimples';
import { TabelaList } from '../components';

const RacaView = () => {
  const racaViewModel = useMemo(() => new RacaViewModel(), []);
  const vm = useViewModel(racaViewModel);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
   // somente carregar as raças
   vm.loadRacas();
  }, []);

  const handleSearch = (e) => {
    vm.setSearchTerm(e.target.value);
  };

  const handleDelete = async (raca) => {
    const result = await vm.deleteRaca(raca.id);
    if (result.success) {
      setDeleteConfirm(null);
    }
  };

  const handleView = (raca) => {
    navigate(`/ver-raca/${raca.id}`);
  };

  const handleEdit = (raca) => {
    navigate(`/editar-raca/${raca.id}`);
  };

  // Função para obter cor do custo
  const getCustoColor = (custo) => {
    if (custo > 0) return 'text-green-400';
    if (custo < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  // Renderizador para nome e descrição
  const renderNomeDescricao = (raca) => (
    <div>
      <div className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
        {raca.nome}
      </div>
      <div className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'} font-modern line-clamp-2`}>
        {raca.descricao}
      </div>
    </div>
  );

  // Renderizador para custo
  const renderCusto = (raca) => (
    <span className={`font-bold ${getCustoColor(raca.custo)}`}>
      {raca.custo > 0 ? `+${raca.custo}` : raca.custo} pts
    </span>
  );

  // Renderizador para bônus de atributos
  const renderBonusAtributos = (raca) => {
    let bonus = {};
    try {
      bonus = JSON.parse(raca.bonus);
    } catch (e) {
      bonus = {};
    }
    return (
      <div className="flex flex-wrap gap-1">
        {Object.entries(bonus).filter(([k]) => k !== 'vantagens' && k !== 'desvantagens').map(([attr, value]) => (
          <span key={attr} className={`text-xs px-2 py-1 rounded ${parseInt(value) > 0 ? (isLight ? 'bg-green-100 text-green-800' : 'bg-green-500/20 text-green-300') : (isLight ? 'bg-red-100 text-red-800' : 'bg-red-500/20 text-red-300')}`}>{attr.charAt(0).toUpperCase()}: {value}</span>
        ))}
      </div>
    );
  };

  // Renderizador para vantagens
  const renderVantagens = (raca) => {
    let bonus = {};
    try {
      bonus = JSON.parse(raca.bonus);
    } catch (e) {
      bonus = {};
    }
    return (
      <div className="flex flex-wrap gap-1">
        {(bonus.vantagens || []).map((vant, i) => (
          <span key={i} className={`text-xs px-2 py-1 rounded ${isLight ? 'bg-cyan-100 text-cyan-800' : 'bg-cyan-500/20 text-cyan-300'}`}>{vant.nome}</span>
        ))}
      </div>
    );
  };

  // Renderizador para desvantagens
  const renderDesvantagens = (raca) => {
    let bonus = {};
    try {
      bonus = JSON.parse(raca.bonus);
    } catch (e) {
      bonus = {};
    }
    return (
      <div className="flex flex-wrap gap-1">
        {(bonus.desvantagens || []).map((desv, i) => (
          <span key={i} className={`text-xs px-2 py-1 rounded ${isLight ? 'bg-red-100 text-red-800' : 'bg-red-500/20 text-red-300'}`}>{desv.nome}</span>
        ))}
      </div>
    );
  };

  const columns = [
    {
      key: 'nome',
      label: 'Nome',
      align: 'left',
      render: renderNomeDescricao
    },
    {
      key: 'custo',
      label: 'Custo',
      align: 'left',
      render: renderCusto
    },
    {
      key: 'bonus',
      label: 'Bônus',
      align: 'left',
      render: renderBonusAtributos
    },
    {
      key: 'vantagens',
      label: 'Vantagens',
      align: 'left',
      render: renderVantagens
    },
    {
      key: 'desvantagens',
      label: 'Desvantagens',
      align: 'left',
      render: renderDesvantagens
    }
  ];

  const actions = [
    {
      label: 'Ver',
      icon: '👁️',
      color: 'cyan',
      onClick: (row) => handleView(row)
    }
  ];

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-3xl">🏹</span>
        </div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
          Visualizar Raças
        </h1>
        <p className="text-slate-400 font-modern">
          Visualize as raças disponíveis para personagens
        </p>
      </div>

      <RPGCard className="p-6">
        {/* Barra de ações */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <InputSimples
              placeholder="Buscar raças..."
              value={vm.searchTerm}
              onChange={handleSearch}
              className="w-full"
            />
          </div>
        </div>

        {/* Mensagem de erro */}
        {vm.error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className={`${isLight ? 'text-slate-800' : 'text-white'} text-sm`}>!</span>
              </div>
              <div>
                <div className="font-semibold text-red-400 font-modern">Erro</div>
                <p className="text-red-300 text-sm font-modern mt-1">{vm.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabela de raças */}
        <TabelaList
          header="Lista de Raças"
          columns={columns}
          data={vm.getRacas()}
          actions={actions}
          loading={vm.loading}
          pagination={true}
          initialPageSize={10}
          pageSizeOptions={[5, 10, 25, 50]}
          emptyMessage="Nenhuma raça encontrada"
          emptyIcon="🏹"
          hoverable={true}
        />
      </RPGCard>
    </div>
  );
};

export default RacaView; 