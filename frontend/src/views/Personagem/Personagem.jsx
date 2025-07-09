import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useViewModel } from '../../shared/hooks/useViewModel';
import { personagemViewModel } from '../../viewmodels/Personagens/PersonagemViewModel';
import { useTheme } from '../../contexts/theme.jsx';

const PersonagemView = () => {
  const vm = useViewModel(personagemViewModel);
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

  if (vm.loading) {
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
          <button className="btn-rpg hover-lift flex items-center space-x-2">
            <span>⚔️</span>
            <span>Novo Personagem</span>
          </button>
        </Link>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card-rpg hover-lift">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 gradient-secondary rounded-lg flex items-center justify-center">
              <span className="text-xl">⚔️</span>
            </div>
            <div>
              <div className={`text-2xl font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{vm.estatisticas.total}</div>
              <div className="text-sm text-slate-400 font-modern">Total de Personagens</div>
            </div>
          </div>
        </div>

        <div className="card-rpg hover-lift">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-xl">🛡️</span>
            </div>
            <div>
              <div className={`text-2xl font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                {vm.estatisticas.guerreiros}
              </div>
              <div className="text-sm text-slate-400 font-modern">Guerreiros</div>
            </div>
          </div>
        </div>

        <div className="card-rpg hover-lift">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 gradient-accent rounded-lg flex items-center justify-center">
              <span className="text-xl">🔮</span>
            </div>
            <div>
              <div className={`text-2xl font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                {vm.estatisticas.magos}
              </div>
              <div className="text-sm text-slate-400 font-modern">Magos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de personagens */}
      <div className="card-rpg">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-fantasy font-semibold ${isLight ? 'text-slate-700' : 'text-white'}`}>
            Seus Personagens
          </h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse-slow" />
            <span className="text-sm text-slate-400 font-modern">
              {vm.personagens.length} personagens encontrados
            </span>
          </div>
        </div>

        {vm.personagens.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl">⚔️</span>
            </div>
            <h3 className={`text-lg font-semibold ${isLight ? 'text-slate-700' : 'text-white'} mb-2 font-modern`}>
              Nenhum personagem encontrado
            </h3>
            <p className="text-slate-400 font-modern mb-6">
              Comece criando seu primeiro herói épico!
            </p>
            <Link to="/novo-personagem">
              <button className="btn-rpg">
                Criar Primeiro Personagem
              </button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-rpg w-full min-w-[1100px]">
              <thead>
                <tr>
                  <th className="font-fantasy px-4 py-3 text-left">ID</th>
                  <th className="font-fantasy px-4 py-3 text-left">Nome</th>
                  <th className="font-fantasy px-4 py-3 text-left">Classe</th>
                  <th className="font-fantasy px-4 py-3 text-left">Raça</th>
                  <th className="font-fantasy px-4 py-3 text-left">Nível</th>
                  <th className="font-fantasy px-4 py-3 text-left">HP</th>
                  <th className="font-fantasy px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {vm.personagens.map((personagem) => (
                  <tr key={personagem.id} className="hover-lift">
                    <td className="px-4 py-3 font-mono text-purple-400 text-left">#{personagem.id}</td>
                    <td className="px-4 py-3 text-left">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                          <span className="text-sm">
                            {personagem.classe === 'Guerreiro' ? '⚔️' : 
                             personagem.classe === 'Mago' ? '🔮' : 
                             personagem.classe === 'Arqueiro' ? '🏹' : '👤'}
                          </span>
                        </div>
                        <div>
                          <div className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white'} font-modern`}>
                            {personagem.nome}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <span className={`${isLight ? 'text-slate-700' : 'text-white'} font-semibold font-modern`}>
                        {personagem.classe || 'Aventureiro'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <span className="text-slate-300 font-modern">
                        {personagem.raca || 'Humano'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <div className="flex items-center space-x-2">
                        <span className="text-cyan-400 font-semibold">
                          {personagem.nivel || 1}
                        </span>
                        <span className="text-slate-400 text-sm">nível</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <div className="flex items-center space-x-2">
                        <span className="text-red-400 font-semibold">
                          {personagem.hp || 100}
                        </span>
                        <span className="text-slate-400 text-sm">HP</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button className="p-2 rounded-lg bg-slate-700/50 hover:bg-purple-500/20 transition-colors">
                          <span className="text-sm">👁️</span>
                        </button>
                        <Link to={`/editar-personagem/${personagem.id}`}>
                          <button className="p-2 rounded-lg bg-slate-700/50 hover:bg-cyan-500/20 transition-colors">
                            <span className="text-sm">✏️</span>
                          </button>
                        </Link>
                        <button 
                          onClick={() => handleDeletePersonagem(personagem.id)}
                          className="p-2 rounded-lg bg-slate-700/50 hover:bg-red-500/20 transition-colors"
                        >
                          <span className="text-sm">🗑️</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonagemView; 