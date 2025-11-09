import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useViewModel } from '../../shared/hooks/useViewModel';
import VantagemViewModel from '../../viewmodels/Vantagens/VantagemViewModel';
import { useTheme } from '../../contexts/theme.jsx';
import RPGCard from '../../components/RPGCard.jsx';
import Button from '../../components/form/button';
import InputSimples from '../../components/form/inputSimples';
import { TabelaList } from '../components';

const VantagemView = () => {
  const vm = useViewModel(useMemo(() => new VantagemViewModel(), []));
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    // somente carregar as vantagens
    vm.loadVantagens();
  }, []);

  const handleSearch = (e) => {
    vm.setSearchTerm(e.target.value);
  };

  const handleDelete = async (id) => {
    const result = await vm.deleteVantagem(id);
    if (result.success) {
      setDeleteConfirm(null);
    } else {
      console.error(result.error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Função para obter cor do custo
  const getCustoColor = (custo) => {
    if (custo > 0) return 'text-green-400';
    return 'text-slate-400';
  };

  // Renderizador para nome e descrição
  const renderNomeDescricao = (vantagem) => (
    <div>
      <div className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
        {vantagem.nome}
      </div>
      <div className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'} font-modern line-clamp-2`}>
        {vantagem.descricao}
      </div>
    </div>
  );

  // Renderizador para custo
  const renderCusto = (vantagem) => (
    <span className={`font-bold ${getCustoColor(vantagem.custo)}`}>
      +{vantagem.custo} pts
    </span>
  );

  // Renderizador para nível
  const renderNivel = (vantagem) => (
    <span className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'} font-modern`}>
      Nível {vantagem.nivel}
    </span>
  );

  // Renderizador para categorias
  const renderCategorias = (vantagem) => (
    <div className="flex flex-wrap gap-1">
      {vantagem.tipo?.map((tipo, i) => (
        <span
          key={i}
          className={`text-xs px-2 py-1 rounded ${
            isLight
              ? 'bg-cyan-100 text-cyan-800'
              : 'bg-cyan-500/20 text-cyan-300'
          }`}
        >
          {tipo}
        </span>
      ))}
      {vantagem.elemento?.map((elem, i) => (
        <span
          key={i}
          className={`text-xs px-2 py-1 rounded ${
            isLight
              ? 'bg-purple-100 text-purple-800'
              : 'bg-purple-500/20 text-purple-300'
          }`}
        >
          {elem}
        </span>
      ))}
    </div>
  );

  // Renderizador para restrição e requisitos
  const renderRestricaoRequisitos = (vantagem) => {
    const restricao = vantagem.restricao && Object.keys(vantagem.restricao).length > 0
      ? Object.entries(vantagem.restricao).map(([k, v]) => `${k}: ${v}`).join(', ')
      : null;
    const requisitos = vantagem.requisitos && Object.keys(vantagem.requisitos).length > 0
      ? Object.entries(vantagem.requisitos).map(([k, v]) => `${k}: ${v}`).join(', ')
      : null;
    if (!restricao && !requisitos) return <span className="text-slate-400 text-xs">-</span>;
    return (
      <div className="text-xs text-slate-600 dark:text-slate-400 font-modern">
        {restricao && <div><b>Restrição:</b> {restricao}</div>}
        {requisitos && <div><b>Requisitos:</b> {requisitos}</div>}
      </div>
    );
  };

  // Renderizador para dano base
  const renderDanoBase = (vantagem) => (
    <span className="text-xs text-purple-600 dark:text-purple-300 font-mono">{vantagem.dano_base || '-'}</span>
  );

  // Renderizador para elemento
  const renderElemento = (vantagem) => (
    <div className="flex flex-wrap gap-1">
      {Array.isArray(vantagem.elemento) && vantagem.elemento.length > 0
        ? vantagem.elemento.map((elem, i) => (
            <span key={i} className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300">{elem}</span>
          ))
        : <span className="text-slate-400 text-xs">-</span>
      }
    </div>
  );

  // Renderizador para efeito
  const renderEfeito = (vantagem) => {
    if (!vantagem.efeito || Object.keys(vantagem.efeito).length === 0) {
      return <span className="text-slate-400 text-xs">-</span>;
    }
    return (
      <ul className="text-xs text-slate-600 dark:text-slate-400 font-modern list-disc pl-4">
        {Object.entries(vantagem.efeito).map(([k, v], i) => (
          <li key={i}><b>{k}:</b> {typeof v === 'object' ? JSON.stringify(v) : String(v)}</li>
        ))}
      </ul>
    );
  };

  // Renderizador para data de criação
  const renderDataCriacao = (vantagem) => (
    <span className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'} font-modern`}>
      {formatDate(vantagem.created_at)}
    </span>
  );

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
      key: 'nivel',
      label: 'Nível',
      align: 'left',
      render: renderNivel
    },
    {
      key: 'tipo',
      label: 'Categorias',
      align: 'left',
      render: renderCategorias
    },
    {
      key: 'restricao_requisitos',
      label: 'Restrição / Requisitos',
      align: 'left',
      render: renderRestricaoRequisitos
    },
    {
      key: 'dano_base',
      label: 'Dano Base',
      align: 'left',
      render: renderDanoBase
    },
    {
      key: 'elemento',
      label: 'Elemento',
      align: 'left',
      render: renderElemento
    },
    {
      key: 'efeito',
      label: 'Efeito',
      align: 'left',
      render: renderEfeito
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
      onClick: (row) => navigate(`/ver-vantagem/${row.id}`)
    }
  ];

  // Usar diretamente o array de vantagens
  const vantagens = vm.vantagens || [];

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-3xl">⭐</span>
        </div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
          Visualizar Vantagens
        </h1>
        <p className="text-slate-400 font-modern">
          Visualize as vantagens disponíveis para personagens
        </p>
      </div>

      <RPGCard className="p-6">
        {/* Barra de ações */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <InputSimples
              placeholder="Buscar vantagens..."
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

        {/* Loading */}
        {vm.loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
            <span className="ml-3 text-slate-400 font-modern">Carregando vantagens...</span>
          </div>
        )}

        {/* Tabela de vantagens */}
        <TabelaList
          header="Lista de Vantagens"
          columns={columns}
          data={vantagens}
          actions={actions}
          loading={vm.loading}
          pagination={true}
          initialPageSize={10}
          pageSizeOptions={[5, 10, 25, 50]}
          emptyMessage="Nenhuma vantagem encontrada"
          emptyIcon="⭐"
          hoverable={true}
        />

        {/* Paginação */}
        {!vm.loading && vantagens.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <div className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'} font-modern`}>
              Mostrando {vantagens.length} vantagens
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                onClick={() => vm.setPage(vm.currentPage - 1)}
                disabled={vm.currentPage <= 1}
                className="px-3 py-1"
              >
                ← Anterior
              </Button>
              <span className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'} font-modern`}>
                Página {vm.currentPage} de {vm.totalPages}
              </span>
              <Button
                variant="ghost"
                onClick={() => vm.setPage(vm.currentPage + 1)}
                disabled={vm.currentPage >= vm.totalPages}
                className="px-3 py-1"
              >
                Próxima →
              </Button>
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
              Tem certeza que deseja excluir esta vantagem? Esta ação não pode ser desfeita.
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

export default VantagemView; 