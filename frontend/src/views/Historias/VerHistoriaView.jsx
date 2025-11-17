import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useViewModel } from '../../shared/hooks/useViewModel.js';
import { historiaViewModel } from '../../viewmodels/index.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Notification from '../../components/Notification.jsx';
import RPGCard from '../../components/RPGCard.jsx';
import { useTheme } from '../../contexts/theme.jsx';

/**
 * View para visualização detalhada de uma História
 * Segue o padrão MVVM - apenas responsável pela apresentação
 */
export const VerHistoriaView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const viewModel = useViewModel(historiaViewModel);
  const {
    historiaAtual,
    loading,
    error,
    loadHistoria,
    clearError
  } = viewModel;

  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Carrega a história ao montar o componente
  useEffect(() => {
    if (id) {
      loadHistoria(parseInt(id));
    }
  }, [id]);

  // Limpa erro quando componente desmonta
  useEffect(() => {
    return () => {
      clearError();
    };
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <LoadingSpinner 
            size="xl" 
            text="Carregando história..." 
            variant="primary"
          />
        </div>
      </div>
    );
  }

  if (!historiaAtual) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg text-center py-12">
          <div className="w-20 h-20 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">❌</span>
          </div>
          <h3 className={`text-lg font-semibold mb-2 font-modern ${isLight ? 'text-slate-700' : 'text-white'}`}>
            História não encontrada
          </h3>
          <p className="text-slate-400 font-modern mb-6">
            A história que você está procurando não existe ou foi removida.
          </p>
          <Link to="/historias">
            <button className="btn-rpg">
              Voltar às Histórias
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const nomesTemas = viewModel.getNomesTemas(historiaAtual);

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
          <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
            {historiaAtual.nome}
          </h1>
          <p className="text-slate-400 font-modern">
            Detalhes da aventura épica
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link to="/historias">
            <button className={`px-4 py-2 rounded-lg font-modern transition-all duration-200 cursor-pointer ${
              isLight 
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' 
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}>
              ← Voltar
            </button>
          </Link>
          <button 
            onClick={() => navigate(`/jogo/${historiaAtual.id}/selecao-personagem`)}
            className="btn-rpg hover-lift flex items-center space-x-2 cursor-pointer"
          >
            <span>🎮</span>
            <span>Iniciar Sessão</span>
          </button>
        </div>
      </div>

      {/* Informações principais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card principal */}
        <div className="lg:col-span-2">
          <RPGCard className="p-6">
            <div className="space-y-6">
              {/* Nome e ID */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-2xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-1`}>
                    {historiaAtual.nome}
                  </h2>
                  <p className="text-slate-400 font-modern text-sm">
                    ID: #{historiaAtual.id}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-modern ${
                  isLight 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-green-500/20 text-green-300'
                }`}>
                  Ativa
                </div>
              </div>

              {/* Prólogo */}
              <div>
                <h3 className={`text-lg font-semibold font-fantasy mb-3 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                  📖 Prólogo
                </h3>
                <div className={`p-4 rounded-lg ${
                  isLight 
                    ? 'bg-slate-50 border border-slate-200' 
                    : 'bg-slate-800/50 border border-slate-700'
                }`}>
                  {historiaAtual.prologo ? (
                    <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {historiaAtual.prologo}
                    </p>
                  ) : (
                    <p className={`font-modern italic ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      O prólogo desta história ainda não foi gerado pelo sistema.
                    </p>
                  )}
                </div>
              </div>

              {/* Temas */}
              <div>
                <h3 className={`text-lg font-semibold font-fantasy mb-3 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                  🎭 Temas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {nomesTemas.length > 0 ? (
                    nomesTemas.map((nomeTema, i) => (
                      <span 
                        key={i} 
                        className={`px-3 py-1 rounded-full text-sm font-modern ${
                          isLight 
                            ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {nomeTema}
                      </span>
                    ))
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-sm font-modern ${
                      isLight 
                        ? 'bg-slate-100 text-slate-500 border border-slate-200' 
                        : 'bg-slate-700/50 text-slate-400 border border-slate-600'
                    }`}>
                      Sem temas definidos
                    </span>
                  )}
                </div>
              </div>
            </div>
          </RPGCard>
        </div>

        {/* Sidebar com informações adicionais */}
        <div className="space-y-6">
          {/* Participantes */}
          <RPGCard className="p-6">
            <h3 className={`text-lg font-semibold font-fantasy mb-4 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              👥 Participantes
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Máximo de jogadores:
                </span>
                <span className={`font-semibold text-cyan-400 font-modern`}>
                  {historiaAtual.maximo_de_participantes}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Vagas disponíveis:
                </span>
                <span className={`font-semibold text-green-400 font-modern`}>
                  {historiaAtual.maximo_de_participantes}
                </span>
              </div>
            </div>
          </RPGCard>

          {/* Informações do sistema */}
          <RPGCard className="p-6">
            <h3 className={`text-lg font-semibold font-fantasy mb-4 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              ⚙️ Informações
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Criada em:
                </span>
                <span className={`font-modern text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {new Date(historiaAtual.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Última atualização:
                </span>
                <span className={`font-modern text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {new Date(historiaAtual.updated_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </RPGCard>

          {/* Ações */}
          <RPGCard className="p-6">
            <h3 className={`text-lg font-semibold font-fantasy mb-4 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              🎯 Ações
            </h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate(`/jogo/${historiaAtual.id}/selecao-personagem`)}
                className="w-full btn-rpg hover-lift flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>🎮</span>
                <span>Iniciar Sessão</span>
              </button>
              <button 
                onClick={() => navigate('/historias')}
                className={`w-full px-4 py-2 rounded-lg font-modern transition-all duration-200 cursor-pointer ${
                  isLight 
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' 
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                ← Voltar às Histórias
              </button>
            </div>
          </RPGCard>
        </div>
      </div>
    </div>
  );
}; 

export default VerHistoriaView; 