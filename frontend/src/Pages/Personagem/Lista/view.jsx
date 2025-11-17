import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useViewModel } from '../../../shared/hooks/useViewModel';
import { personagemViewModel } from './viewmodel';
import { useTheme } from '../../../contexts/theme.jsx';
import { TabelaList } from '../../../views/components';
import StatCard from '../../../components/StatCard.jsx';

const PersonagemListaView = () => {
  const vm = useViewModel(personagemViewModel);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    vm.loadPersonagens();
    vm.clearError();
  }, []);

  const handleDeletePersonagem = async (id) => {
    try {
      await vm.deletePersonagem(id);
    } catch (error) {
      console.error("Erro ao deletar personagem:", error);
    }
  };

  if (vm.loading && vm.personagens.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse-slow">
                <span className="text-2xl">⚔️</span>
              </div>
              <div className="text-slate-300 font-modern">Carregando personagens...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizador para ícone da classe
  const renderClasseIcon = (personagem) => {
    const classe = personagem.classe || 'Aventureiro';
    const icon = classe === 'Guerreiro' ? '⚔️' : 
                 classe === 'Mago' ? '🔮' : 
                 classe === 'Arqueiro' ? '🏹' : '👤';
    return (
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
          <span className="text-sm">{icon}</span>
        </div>
        <div>
          <div className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
            {personagem.nome}
          </div>
        </div>
      </div>
    );
  };

  // Renderizador para nível
  const renderNivel = (personagem) => (
    <div className="flex items-center space-x-2">
      <span className="text-cyan-400 font-semibold">
        {personagem.nivel || 1}
      </span>
      <span className="text-slate-400 text-sm">nível</span>
    </div>
  );

  // Renderizador para HP
  const renderHP = (personagem) => (
    <div className="flex items-center space-x-2">
      <span className="text-red-400 font-semibold">
        {personagem.hp || 100}
      </span>
      <span className="text-slate-400 text-sm">HP</span>
    </div>
  );

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
      render: renderClasseIcon
    },
    { 
      key: 'classe', 
      label: 'Classe', 
      align: 'left', 
      render: (row) => (
        <span className={`${isLight ? 'text-slate-700' : 'text-white'} font-semibold font-modern`}>
          {row.classe || 'Aventureiro'}
        </span>
      )
    },
    { 
      key: 'raca', 
      label: 'Raça', 
      align: 'left', 
      render: (row) => (
        <span className="text-slate-300 font-modern">
          {row.raca || 'Humano'}
        </span>
      )
    },
    { 
      key: 'historias', 
      label: 'Histórias', 
      align: 'left', 
      render: (row) => {
        const historias = Array.isArray(row.historias) && row.historias.length > 0
          ? row.historias
          : row.historia_nome 
            ? [{ nome: row.historia_nome }] 
            : [];
        
        if (historias.length === 0) {
          return (
            <span className={`${isLight ? 'text-slate-500' : 'text-slate-400'} font-modern text-sm italic`}>
              Sem histórias
            </span>
          );
        }
        
        return (
          <div className="flex flex-wrap gap-1">
            {historias.map((historia, index) => (
              <span
                key={historia.id || index}
                className={`px-2 py-0.5 rounded-full text-xs font-modern font-semibold ${isLight
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-purple-500/20 text-purple-300'
                }`}
              >
                {historia.nome}
              </span>
            ))}
          </div>
        );
      }
    },
    { 
      key: 'nivel', 
      label: 'Nível', 
      align: 'left', 
      render: renderNivel
    },
    { 
      key: 'hp', 
      label: 'HP', 
      align: 'left', 
      render: renderHP
    }
  ];

  const actions = [
    {
      label: 'Ver',
      icon: '👁️',
      color: 'purple',
      onClick: (row) => navigate(`/ver-personagem/${row.id}`)
    },
    {
      label: 'Editar',
      icon: '✏️',
      color: 'cyan',
      onClick: (row) => navigate(`/editar-personagem/${row.id}`)
    },
    {
      label: 'Deletar',
      icon: '🗑️',
      color: 'red',
      onClick: (row) => handleDeletePersonagem(row.id)
    }
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header da página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
            Personagens & Heróis
          </h1>
          <p className="text-slate-400 font-modern">
            Gerencie seus personagens e heróis épicos
          </p>
        </div>
        
        <Link to="/novo-personagem">
          <button className="btn-rpg hover-lift flex items-center space-x-2 cursor-pointer">
            <span>✨</span>
            <span>Novo Personagem</span>
          </button>
        </Link>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total de Personagens"
          value={vm.estatisticas?.total || 0}
          icon="⚔️"
          variant="primary"
        />

        <StatCard
          title="Guerreiros"
          value={vm.estatisticas?.guerreiros || 0}
          icon="🛡️"
          variant="secondary"
        />

        <StatCard
          title="Magos"
          value={vm.estatisticas?.magos || 0}
          icon="🔮"
          variant="accent"
        />
      </div>

      {/* Tabela de personagens */}
      <TabelaList
        header="Lista de Personagens"
        columns={columns}
        data={vm.personagens}
        actions={actions}
        loading={vm.loading}
        pagination={true}
        initialPageSize={10}
        pageSizeOptions={[5, 10, 25, 50]}
        emptyMessage="Nenhum personagem encontrado"
        emptyIcon="⚔️"
        hoverable={true}
      />
    </div>
  );
};

export default PersonagemListaView;

