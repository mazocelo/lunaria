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
  console.log('ClasseView - Renderizando componente');
  const [force, setForce] = useState(0);
  const vm = useViewModel(useMemo(() => new ClasseViewModel(), []));
  console.log('ClasseView - ViewModel criado:', vm);
  console.log('ClasseView - Estado inicial:', vm.getState());
  console.log('[ClasseView] vm.state.classes:', vm.state.classes);
  console.log('[ClasseView] DataTable data:', vm.state.classes);
  
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    console.log('ClasseView - Chamando vm.init()');
    vm.init();
  }, []);

  const handleSearch = (e) => {
    vm.setSearchTerm(e.target.value);
  };

  const handleDelete = async (id) => {
    const result = await vm.deleteClasse(id);
    if (result.success) {
      setDeleteConfirm(null);
    } else {
      // Mostrar erro
      console.error(result.error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
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
    if (!classe.created_at) return null;
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
      onClick: (row) => navigate(`/ver-classe/${row.id}`)
    },
    {
      label: 'Editar',
      icon: '✏️',
      color: 'yellow',
      onClick: (row) => navigate(`/editar-classe/${row.id}`)
    },
    {
      label: 'Deletar',
      icon: '🗑️',
      color: 'red',
      onClick: (row) => handleDelete(row.id)
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
          Gerenciar Classes
        </h1>
        <p className="text-slate-400 font-modern">
          Crie e gerencie as classes disponíveis para personagens
        </p>
      </div>

      <RPGCard className="p-6">
        {/* Barra de ações */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <InputSimples
              placeholder="Buscar classes..."
              value={vm.state.searchTerm}
              onChange={handleSearch}
              className="w-full"
            />
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/criar-classe')}
            className="whitespace-nowrap"
          >
            ✨ Nova Classe
          </Button>
        </div>

        {/* Mensagem de erro */}
        {vm.state.error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className={`${isLight ? 'text-slate-800' : 'text-white'} text-sm`}>!</span>
              </div>
              <div>
                <div className="font-semibold text-red-400 font-modern">Erro</div>
                <p className="text-red-300 text-sm font-modern mt-1">{vm.state.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {vm.state.loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
            <span className="ml-3 text-slate-400 font-modern">Carregando classes...</span>
          </div>
        )}

        {/* Tabela de classes */}
        <DataTable
          keyField="id"
          columns={columns}
          data={vm.state.classes}
          actions={actions}
          loading={vm.state.loading}
          title="Lista de Classes"
          emptyMessage="Nenhuma classe encontrada"
          emptyIcon="⚔️"
          totalItems={vm.state.classes.length}
        />

        {/* Paginação */}
        {vm.state.totalPages > 1 && (
          <div className="flex items-center justify-center mt-6">
            <div className="flex space-x-2">
              {Array.from({ length: vm.state.totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === vm.state.currentPage ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => vm.setPage(page)}
                >
                  {page}
                </Button>
              ))}
            </div>
          </div>
        )}
      </RPGCard>

      {/* Modal de confirmação de exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-md w-full mx-4 ${isLight ? 'bg-white' : 'bg-slate-800'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
              Confirmar exclusão
            </h3>
            <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'} font-modern mb-6`}>
              Tem certeza que deseja excluir esta classe? Esta ação não pode ser desfeita.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="ghost"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClasseView; 