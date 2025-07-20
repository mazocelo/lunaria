import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useViewModel } from '../../shared/hooks/useViewModel.js';
import { historiaViewModel } from '../../viewmodels/index.js';
import { LoadingSpinner, Notification } from '../../components/index.js';
import { useTheme } from '../../contexts/theme.jsx';
import { PersonagemService } from '../../services/PersonagemService.js';
import { apiClient } from '../../services/ApiClient.js';

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

  const [etapaAtual, setEtapaAtual] = useState('info'); // 'info', 'selecao-personagem', 'jogo'
  const [personagensDaHistoria, setPersonagensDaHistoria] = useState([]);
  const [personagemSelecionado, setPersonagemSelecionado] = useState(null);
  const [loadingPersonagens, setLoadingPersonagens] = useState(false);
  const [errorPersonagens, setErrorPersonagens] = useState(null);
  const [buscaPersonagem, setBuscaPersonagem] = useState('');
  const [participantes, setParticipantes] = useState([]);

  const personagemService = new PersonagemService(apiClient);

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

  // Carrega personagens quando entra na etapa de seleção
  useEffect(() => {
    if (etapaAtual === 'selecao-personagem' && historiaAtual) {
      carregarPersonagensDaHistoria();
    }
  }, [etapaAtual, historiaAtual]);

  const carregarPersonagensDaHistoria = async (opcoesBusca = {}) => {
    setLoadingPersonagens(true);
    setErrorPersonagens(null);
    
    try {
      const personagens = await personagemService.getByHistoria(historiaAtual.id, {
        search: buscaPersonagem,
        status: 'ativo',
        limit: 20,
        ...opcoesBusca
      });
      setPersonagensDaHistoria(personagens);
    } catch (error) {
      setErrorPersonagens(error.message);
    } finally {
      setLoadingPersonagens(false);
    }
  };

  const handleBuscaPersonagem = (e) => {
    const valor = e.target.value;
    setBuscaPersonagem(valor);
    
    // Debounce da busca
    const timeoutId = setTimeout(() => {
      carregarPersonagensDaHistoria({ search: valor });
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };

  const selecionarPersonagem = (personagem) => {
    setPersonagemSelecionado(personagem);
  };

  const iniciarSessaoComPersonagem = () => {
    if (!personagemSelecionado) {
      setErrorPersonagens('Selecione um personagem para continuar');
      return;
    }
    setEtapaAtual('jogo');
  };

  const voltarParaSelecaoPersonagem = () => {
    setEtapaAtual('selecao-personagem');
    setPersonagemSelecionado(null);
  };

  const voltarParaInfo = () => {
    setEtapaAtual('info');
    setPersonagemSelecionado(null);
  };

  const voltarParaHistorias = () => {
    navigate('/historias');
  };

  if (loading && !historiaAtual) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-fade-in">
        <div className="card-rpg max-w-md w-full">
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
      <div className="min-h-screen flex items-center justify-center animate-fade-in">
        <div className="card-rpg max-w-md w-full text-center py-16">
          <div className="w-24 h-24 gradient-primary rounded-full mx-auto mb-6 flex items-center justify-center">
            <span className="text-4xl">❌</span>
          </div>
          <h3 className={`text-xl font-semibold mb-3 font-modern ${isLight ? 'text-slate-700' : 'text-white'}`}>
            História não encontrada
          </h3>
          <p className="text-slate-400 font-modern mb-8 leading-relaxed">
            A história que você está procurando não existe ou foi removida.
          </p>
          <button onClick={voltarParaHistorias} className="btn-rpg cursor-pointer px-8 py-3">
            ← Voltar para Histórias
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Notificação de erro */}
      {error && (
        <Notification
          message={error}
          type="error"
          onClose={clearError}
        />
      )}

      {/* Header com navegação por etapas */}
      <div className={`relative overflow-hidden rounded-2xl mb-8 ${isLight ? 'bg-gradient-to-br from-slate-50 to-slate-100' : 'bg-gradient-to-br from-slate-800 to-slate-900'}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={`text-4xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
                🎲 Sessão de Jogo
              </h1>
              <p className={`text-lg font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                {etapaAtual === 'info' && 'Prepare-se para uma aventura épica!'}
                {etapaAtual === 'selecao-personagem' && 'Escolha seu personagem para a aventura'}
                {etapaAtual === 'jogo' && 'Aventura em andamento!'}
              </p>
            </div>
            
            <button onClick={voltarParaHistorias} className="btn-rpg-secondary hover-lift flex items-center space-x-2 cursor-pointer px-6 py-3">
              <span>←</span>
              <span>Voltar</span>
            </button>
          </div>

          {/* Indicador de progresso */}
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${etapaAtual === 'info' ? 'text-cyan-400' : 'text-slate-500'}`}>
              <div className={`w-3 h-3 rounded-full ${etapaAtual === 'info' ? 'bg-cyan-400' : 'bg-slate-500'}`}></div>
              <span className="text-sm font-modern">Informações</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-600"></div>
            <div className={`flex items-center space-x-2 ${etapaAtual === 'selecao-personagem' ? 'text-cyan-400' : 'text-slate-500'}`}>
              <div className={`w-3 h-3 rounded-full ${etapaAtual === 'selecao-personagem' ? 'bg-cyan-400' : 'bg-slate-500'}`}></div>
              <span className="text-sm font-modern">Personagem</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-600"></div>
            <div className={`flex items-center space-x-2 ${etapaAtual === 'jogo' ? 'text-cyan-400' : 'text-slate-500'}`}>
              <div className={`w-3 h-3 rounded-full ${etapaAtual === 'jogo' ? 'bg-cyan-400' : 'bg-slate-500'}`}></div>
              <span className="text-sm font-modern">Jogo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Etapa 1: Informações da História */}
      {etapaAtual === 'info' && (
        <div className="card-rpg p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-700' : 'text-white'} mb-4`}>
                {historiaAtual.nome}
              </h2>
              <div className="flex flex-wrap gap-2 mb-6">
                {Array.isArray(historiaAtual.temas) && historiaAtual.temas.length > 0
                  ? historiaAtual.temas.map((tema, i) => (
                      <span key={i} className="px-4 py-2 text-sm rounded-full bg-purple-600/20 text-purple-300 font-modern border border-purple-500/30">
                        {tema}
                      </span>
                    ))
                  : <span className="text-slate-500 text-sm">Sem tema definido</span>
                }
              </div>
              
              {historiaAtual.descricao && (
                <div className={`p-6 rounded-xl mb-6 ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/50 border border-slate-700'}`}>
                  <h3 className={`text-lg font-semibold mb-3 ${isLight ? 'text-slate-700' : 'text-white'}`}>📖 Descrição</h3>
                  <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {historiaAtual.descricao}
                  </p>
                </div>
              )}
            </div>
            
            <div className="text-center ml-8">
              <div className="text-4xl font-bold text-cyan-400 mb-2">
                {historiaAtual.maximo_de_participantes || 0}
              </div>
              <div className="text-sm text-slate-400 font-modern">
                Máximo de jogadores
              </div>
            </div>
          </div>

          <div className="text-center py-8">
            <button 
              onClick={() => setEtapaAtual('selecao-personagem')}
              className="btn-rpg-lg hover-lift flex items-center space-x-3 mx-auto cursor-pointer px-12 py-4"
            >
              <span className="text-2xl">👤</span>
              <span className="text-xl font-fantasy">Escolher Personagem</span>
            </button>
            <p className="text-slate-400 font-modern mt-4 text-sm">
              Selecione um personagem para começar a aventura
            </p>
          </div>
        </div>
      )}

      {/* Etapa 2: Seleção de Personagem */}
      {etapaAtual === 'selecao-personagem' && (
        <div className="space-y-6">
          {/* Barra de busca */}
          <div className="card-rpg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-2xl font-fantasy font-bold ${isLight ? 'text-slate-700' : 'text-white'}`}>
                👥 Escolha seu Personagem
              </h2>
              <button 
                onClick={voltarParaInfo}
                className="btn-rpg-secondary cursor-pointer px-4 py-2"
              >
                ← Voltar
              </button>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar personagem por nome..."
                value={buscaPersonagem}
                onChange={handleBuscaPersonagem}
                className={`w-full px-4 py-3 pl-12 rounded-xl border ${
                  isLight 
                    ? 'bg-white border-slate-300 text-slate-900' 
                    : 'bg-slate-800 border-slate-600 text-white'
                } placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <span className="text-slate-400">🔍</span>
              </div>
            </div>
          </div>

          {/* Lista de personagens */}
          <div className="card-rpg p-6">
            {errorPersonagens && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-300 font-modern">{errorPersonagens}</p>
              </div>
            )}

            {loadingPersonagens ? (
              <div className="text-center py-12">
                <LoadingSpinner size="lg" text="Carregando personagens..." />
              </div>
            ) : personagensDaHistoria.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {personagensDaHistoria.map((personagem) => (
                  <div 
                    key={personagem.id}
                    onClick={() => selecionarPersonagem(personagem)}
                    className={`cursor-pointer rounded-xl p-6 border-2 transition-all duration-200 hover:scale-105 ${
                      personagemSelecionado?.id === personagem.id
                        ? isLight
                          ? 'border-cyan-500 bg-cyan-50 shadow-lg'
                          : 'border-cyan-400 bg-cyan-500/10 shadow-cyan-500/20 shadow-lg'
                        : isLight
                          ? 'border-slate-200 bg-white hover:border-slate-300'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                        {personagem.nome}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-modern ${
                        isLight ? 'bg-green-100 text-green-800' : 'bg-green-500/20 text-green-300'
                      }`}>
                        Nv. {personagem.nivel || 1}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className={`${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Classe:</span>
                        <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white'}`}>
                          {personagem.classe || 'Aventureiro'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className={`${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Raça:</span>
                        <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white'}`}>
                          {personagem.raca || 'Humano'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className={`${isLight ? 'text-slate-600' : 'text-slate-400'}`}>HP:</span>
                        <span className="font-semibold text-red-400">
                          {personagem.hp || 100}/{personagem.hp_maximo || 100}
                        </span>
                      </div>
                    </div>

                    {personagemSelecionado?.id === personagem.id && (
                      <div className="mt-4 flex items-center justify-center">
                        <span className="text-cyan-400 text-sm font-semibold">✓ Selecionado</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-700/50 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <p className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {buscaPersonagem ? 'Nenhum personagem encontrado com esse nome' : 'Nenhum personagem encontrado para esta história'}
                </p>
                <p className="text-slate-500 text-sm mt-2">
                  Você precisa criar um personagem para esta história primeiro
                </p>
              </div>
            )}

            {personagemSelecionado && (
              <div className="mt-8 text-center">
                <button 
                  onClick={iniciarSessaoComPersonagem}
                  className="btn-rpg-lg hover-lift flex items-center space-x-3 mx-auto cursor-pointer px-12 py-4"
                >
                  <span className="text-2xl">🎮</span>
                  <span className="text-xl font-fantasy">Iniciar Aventura</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Etapa 3: Jogo Ativo */}
      {etapaAtual === 'jogo' && personagemSelecionado && (
        <div className="space-y-6">
          {/* Info do personagem selecionado */}
          <div className="card-rpg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isLight ? 'bg-cyan-100' : 'bg-cyan-500/20'}`}>
                  <span className="text-xl">👤</span>
                </div>
                <div>
                  <h3 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                    {personagemSelecionado.nome}
                  </h3>
                  <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {personagemSelecionado.classe} • {personagemSelecionado.raca} • Nível {personagemSelecionado.nivel}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-red-400">{personagemSelecionado.hp}</div>
                  <div className="text-xs text-slate-400">HP</div>
                </div>
                <button 
                  onClick={voltarParaSelecaoPersonagem}
                  className="btn-rpg-secondary cursor-pointer px-4 py-2"
                >
                  Trocar Personagem
                </button>
              </div>
            </div>

            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-modern bg-green-600/20 text-green-300 border border-green-500/30`}>
              <div className="w-2 h-2 rounded-full mr-2 bg-green-400" />
              Sessão Ativa
            </div>
          </div>

          {/* Área do Jogo */}
          <div className="card-rpg p-6">
            <h3 className={`text-2xl font-fantasy font-bold mb-6 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              🎭 Área de Jogo
            </h3>
            
            {/* Chat do Jogo */}
            <div className={`rounded-xl p-6 mb-6 ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/50 border border-slate-700'}`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white'}`}>
                  💬 Chat da Sessão
                </h4>
                <span className="text-xs text-slate-400 font-modern">
                  {participantes.length} participantes
                </span>
              </div>
              
              <div className={`rounded-lg p-4 min-h-[200px] mb-4 ${isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-700'}`}>
                <div className="text-center text-slate-500 font-modern text-sm py-8">
                  <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${isLight ? 'bg-slate-200' : 'bg-slate-700/50'}`}>
                    <span className="text-xl">💬</span>
                  </div>
                  <p>Chat da sessão aparecerá aqui</p>
                  <p className="text-xs mt-1">Aguarde a conexão com outros jogadores...</p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <input 
                  type="text" 
                  placeholder="Digite sua mensagem..."
                  className={`flex-1 px-4 py-3 rounded-lg border ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-900' 
                      : 'bg-slate-700 border-slate-600 text-white'
                  } placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                />
                <button className="btn-rpg-secondary px-6 cursor-pointer">
                  Enviar
                </button>
              </div>
            </div>

            {/* Controles do Jogo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="btn-rpg-secondary flex items-center justify-center space-x-2 cursor-pointer py-4">
                <span>🎲</span>
                <span>Rolar Dados</span>
              </button>
              <button className="btn-rpg-secondary flex items-center justify-center space-x-2 cursor-pointer py-4">
                <span>📋</span>
                <span>Ver Ficha</span>
              </button>
              <button className="btn-rpg-secondary flex items-center justify-center space-x-2 cursor-pointer py-4">
                <span>⚙️</span>
                <span>Configurações</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 