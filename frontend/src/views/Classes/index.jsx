import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useViewModel } from '../../shared/hooks/useViewModel';
import ClasseViewModel from '../../viewmodels/Classes/ClasseViewModel';
import { useTheme } from '../../contexts/theme.jsx';
import { RPGCard } from '../../components';
import Button from '../../components/form/button';
import InputSimples from '../../components/form/inputSimples';
import DataTable from '../../components/Table/DataTable.jsx';

const ClasseView = () => {
  const classeViewModel = useMemo(() => new ClasseViewModel(), []);
  const vm = useViewModel(classeViewModel);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    vm.init();
  }, []);

  const handleSearch = (e) => {
    vm.setSearchTerm(e.target.value);
  };

  const vmState = vm.getState();

  const handleDelete = async (classe) => {
    const result = await vm.deleteClasse(classe.id);
    if (result.success) {
      setDeleteConfirm(null);
    }
  };

  const handleView = (classe) => {
    navigate(`/ver-classe/${classe.id}`);
  };

  const handleEdit = (classe) => {
    navigate(`/editar-classe/${classe.id}`);
  };

  // Função para obter cor do custo
  const getCustoColor = (custo) => {
    if (custo > 0) return 'text-green-400';
    if (custo < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  // Renderizador para nome e descrição
  const renderNomeDescricao = (classe) => (
    <div>
      <div className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
        {classe.nome}
      </div>
      <div className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'} font-modern line-clamp-2`}>
        {classe.descricao}
      </div>
    </div>
  );

  // Renderizador para custo
  const renderCusto = (classe) => (
    <span className={`font-bold ${getCustoColor(classe.custo)}`}>
      {classe.custo > 0 ? `+${classe.custo}` : classe.custo} pts
    </span>
  );

  // Renderizador para bônus de atributos
  const renderBonusAtributos = (classe) => {
    let bonus = {};
    try {
      bonus = JSON.parse(classe.bonus);
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
  const renderVantagens = (classe) => {
    let bonus = {};
    try {
      bonus = JSON.parse(classe.bonus);
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
  const renderDesvantagens = (classe) => {
    let bonus = {};
    try {
      bonus = JSON.parse(classe.bonus);
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

  // Renderizador para data de criação
  const renderDataCriacao = (classe) => {
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('pt-BR');
    };
    return (
      <span className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'} font-modern`}>
        {formatDate(classe.created_at)}
      </span>
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
    },
    {
      key: 'created_at',
      label: 'Criado em',
      align: 'left',
      render: renderDataCriacao
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
          <span className="text-3xl">⚔️</span>
        </div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
          Visualizar Classes
        </h1>
        <p className="text-slate-400 font-modern">
          Visualize as classes disponíveis para personagens
        </p>
      </div>

      <RPGCard className="p-6">
        {/* Barra de ações */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <InputSimples
              placeholder="Buscar classes..."
              value={vmState.searchTerm}
              onChange={handleSearch}
              className="w-full"
            />
          </div>
        </div>

        {/* Mensagem de erro */}
        {vmState.error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className={`${isLight ? 'text-slate-800' : 'text-white'} text-sm`}>!</span>
              </div>
              <div>
                <div className="font-semibold text-red-400 font-modern">Erro</div>
                <p className="text-red-300 text-sm font-modern mt-1">{vmState.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabela de classes */}
        <DataTable
          columns={columns}
          data={vmState.classes}
          actions={actions}
          loading={vmState.loading}
          title="Lista de Classes"
          emptyMessage="Nenhuma classe encontrada"
          emptyIcon="⚔️"
          totalItems={vmState.classes.length}
        />
      </RPGCard>
    </div>
  );
};

export default ClasseView; 