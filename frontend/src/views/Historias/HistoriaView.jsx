import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useViewModel } from '../../shared/hooks/useViewModel';
import { historiaViewModel } from '../../viewmodels';
import { StatCard, LoadingSpinner, Notification } from '../../components';
import Table from '../../components/Table/Table';

/**
 * View para exibição e gerenciamento de Histórias
 * Segue o padrão MVVM - apenas responsável pela apresentação
 */
export const HistoriaView = () => {
  const {
    historias,
    loading,
    error,
    estatisticas,
    loadHistorias,
    clearError
  } = useViewModel(historiaViewModel);

  // Carrega histórias ao montar o componente
  useEffect(() => {
    loadHistorias();
  }, []);

  // Limpa erro quando componente desmonta
  useEffect(() => {
    return () => {
      clearError();
    };
  }, []);

  if (loading && historias.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <LoadingSpinner 
            size="xl" 
            text="Carregando histórias..." 
            variant="primary"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Notificação de erro */}
      {error && (
        <Notification
          message={error}
          type="error"
          onClose={clearError}
        />
      )}

      {/* Header da página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-fantasy font-bold text-white mb-2">
            Histórias & Aventuras
          </h1>
          <p className="text-slate-400 font-modern">
            Gerencie suas campanhas e aventuras épicas
          </p>
        </div>
        
        <Link to="/nova-historia">
          <button className="btn-rpg hover-lift flex items-center space-x-2">
            <span>✨</span>
            <span>Nova História</span>
          </button>
        </Link>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total de Histórias"
          value={estatisticas.total}
          icon="📚"
          variant="primary"
        />

        <StatCard
          title="Vagas Disponíveis"
          value={estatisticas.totalParticipantes}
          icon="🎭"
          variant="secondary"
        />

        <StatCard
          title="Com Temas"
          value={estatisticas.comTemas}
          icon="⚡"
          variant="accent"
        />
      </div>

      {/* Tabela de histórias */}
      <div className="card-rpg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-fantasy font-semibold text-white">
            Lista de Histórias
          </h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse-slow" />
            <span className="text-sm text-slate-400 font-modern">
              {historias.length} histórias encontradas
            </span>
          </div>
        </div>

        {historias.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl">📖</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 font-modern">
              Nenhuma história encontrada
            </h3>
            <p className="text-slate-400 font-modern mb-6">
              Comece criando sua primeira aventura épica!
            </p>
            <Link to="/nova-historia">
              <button className="btn-rpg">
                Criar Primeira História
              </button>
            </Link>
          </div>
        ) : (
          <Table
            columns={[
              { key: 'id', label: 'ID', align: 'left', render: (row) => `#${row.id}` },
              { key: 'nome', label: 'Nome da História', align: 'left' },
              { key: 'temas', label: 'Temas', align: 'left', render: (row) => (
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(row.temas) && row.temas.length > 0
                    ? row.temas.map((tema, i) => (
                        <span key={i} className="px-2 py-1 text-xs rounded-full bg-slate-700/50 text-slate-300 font-modern">{tema}</span>
                      ))
                    : <span className="text-slate-500 text-xs">Sem tema</span>
                  }
                </div>
              ) },
              { key: 'maximo_de_participantes', label: 'Máximo de Participantes', align: 'left', render: (row) => (
                <div className="flex items-center space-x-2">
                  <span className="text-cyan-400 font-semibold">{row.maximo_de_participantes || 0}</span>
                  <span className="text-slate-400 text-sm">jogadores</span>
                </div>
              ) },
            ]}
            data={historias}
            keyField="id"
            actions={[
              { label: 'Ver', icon: '👁️', onClick: (row) => {/* ação de ver */}, color: 'purple' },
              { label: 'Editar', icon: '✏️', onClick: (row) => {/* ação de editar */}, color: 'cyan' },
              { label: 'Deletar', icon: '🗑️', onClick: (row) => {/* ação de deletar */}, color: 'red' },
            ]}
          />
        )}
      </div>
    </div>
  );
}; 