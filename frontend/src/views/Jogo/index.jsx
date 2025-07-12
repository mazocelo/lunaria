import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useViewModel } from '../../shared/hooks/useViewModel.js';
import { historiaViewModel } from '../../viewmodels/index.js';
import { LoadingSpinner, Notification } from '../../components/index.js';
import { useTheme } from '../../contexts/theme.jsx';

/**
 * View para o início do jogo
 * Interface para iniciar uma sessão de RPG
 */
export const JogoView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  
  const {
    historiaAtual,
    loading,
    error,
    loadHistoria,
    clearError
  } = useViewModel(historiaViewModel);

  const [sessaoIniciada, setSessaoIniciada] = useState(false);
  const [participantes, setParticipantes] = useState([]);

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

  const iniciarSessao = () => {
    setSessaoIniciada(true);
    // Aqui você pode adicionar lógica para conectar com o backend
    // e iniciar a sessão de jogo
  };

  const voltarParaHistorias = () => {
    navigate('/historias');
  };

  if (loading && !historiaAtual) {
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
          <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">❌</span>
          </div>
          <h3 className={`text-lg font-semibold mb-2 font-modern ${isLight ? 'text-slate-700' : 'text-white'}`}>
            História não encontrada
          </h3>
          <p className="text-slate-400 font-modern mb-6">
            A história que você está procurando não existe.
          </p>
          <button onClick={voltarParaHistorias} className="btn-rpg">
            Voltar para Histórias
          </button>
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
          <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
            🎲 Sessão de Jogo
          </h1>
          <p className="text-slate-400 font-modern">
            Prepare-se para uma aventura épica!
          </p>
        </div>
        
        <button onClick={voltarParaHistorias} className="btn-rpg-secondary hover-lift flex items-center space-x-2">
          <span>←</span>
          <span>Voltar</span>
        </button>
      </div>

      {/* Informações da História */}
      <div className="card-rpg">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className={`text-2xl font-fantasy font-semibold ${isLight ? 'text-slate-700' : 'text-white'} mb-2`}>
              {historiaAtual.nome}
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {Array.isArray(historiaAtual.temas) && historiaAtual.temas.length > 0
                ? historiaAtual.temas.map((tema, i) => (
                    <span key={i} className="px-3 py-1 text-sm rounded-full bg-purple-600/20 text-purple-300 font-modern border border-purple-500/30">
                      {tema}
                    </span>
                  ))
                : <span className="text-slate-500 text-sm">Sem tema definido</span>
              }
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-cyan-400">
              {historiaAtual.maximo_de_participantes || 0}
            </div>
            <div className="text-sm text-slate-400 font-modern">
              Máximo de jogadores
            </div>
          </div>
        </div>

        {/* Status da Sessão */}
        <div className="mb-6">
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-modern ${
            sessaoIniciada 
              ? 'bg-green-600/20 text-green-300 border border-green-500/30' 
              : 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/30'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              sessaoIniciada ? 'bg-green-400' : 'bg-yellow-400'
            }`} />
            {sessaoIniciada ? 'Sessão Ativa' : 'Aguardando Início'}
          </div>
        </div>

        {/* Botão de Iniciar Sessão */}
        {!sessaoIniciada && (
          <div className="text-center py-8">
            <button 
              onClick={iniciarSessao}
              className="btn-rpg-lg hover-lift flex items-center space-x-3 mx-auto"
            >
              <span className="text-2xl">🎮</span>
              <span className="text-lg font-fantasy">Iniciar Sessão de Jogo</span>
            </button>
            <p className="text-slate-400 font-modern mt-4 text-sm">
              Clique para começar a aventura e conectar com outros jogadores
            </p>
          </div>
        )}

        {/* Área do Jogo (quando sessão iniciada) */}
        {sessaoIniciada && (
          <div className="space-y-6">
            <div className="border-t border-slate-700/50 pt-6">
              <h3 className={`text-lg font-fantasy font-semibold mb-4 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                🎭 Área de Jogo
              </h3>
              
              {/* Chat do Jogo */}
              <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white'}`}>
                    💬 Chat da Sessão
                  </h4>
                  <span className="text-xs text-slate-400 font-modern">
                    {participantes.length} participantes
                  </span>
                </div>
                
                <div className="bg-slate-900/50 rounded p-3 min-h-[200px] mb-3">
                  <div className="text-center text-slate-500 font-modern text-sm py-8">
                    <div className="w-12 h-12 bg-slate-700/50 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-xl">💬</span>
                    </div>
                    <p>Chat da sessão aparecerá aqui</p>
                    <p className="text-xs mt-1">Aguarde a conexão com outros jogadores...</p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="Digite sua mensagem..."
                    className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50"
                  />
                  <button className="btn-rpg-secondary px-4">
                    Enviar
                  </button>
                </div>
              </div>

              {/* Controles do Jogo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="btn-rpg-secondary flex items-center justify-center space-x-2">
                  <span>🎲</span>
                  <span>Rolar Dados</span>
                </button>
                <button className="btn-rpg-secondary flex items-center justify-center space-x-2">
                  <span>📋</span>
                  <span>Ficha</span>
                </button>
                <button className="btn-rpg-secondary flex items-center justify-center space-x-2">
                  <span>⚙️</span>
                  <span>Configurações</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 