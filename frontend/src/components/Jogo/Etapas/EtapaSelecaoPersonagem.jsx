import React, { useEffect, useState } from 'react';
import { useTheme } from '../../../contexts/theme.jsx';
import LoadingSpinner from '../../LoadingSpinner.jsx';
import { etapaSelecaoPersonagemViewModel } from '../../../viewmodels/Jogo';

/**
 * Componente para a etapa de seleção de personagem
 * 📍 Usado por: JogoView (etapa 'selecao-personagem')
 * 🎯 MIGRADO: Agora usa ViewModel específico para lógica de negócio
 */
const EtapaSelecaoPersonagem = ({
  historia,
  personagens,
  personagemSelecionado,
  loading,
  error,
  onSelecionarPersonagem,
  onVoltar
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // 🎯 VIEWMODEL - Estado reativo
  const [viewModelState, setViewModelState] = useState(etapaSelecaoPersonagemViewModel.getState());

  // 🔄 SUBSCRIBE AO VIEWMODEL
  useEffect(() => {
    const unsubscribe = etapaSelecaoPersonagemViewModel.subscribe(setViewModelState);
    return unsubscribe;
  }, []);

  // 📊 DESTRUCTURING DO ESTADO
  const { temasCarregados, temasLoading, temasError } = viewModelState;

  // 🚀 INICIALIZAÇÃO
  useEffect(() => {
    etapaSelecaoPersonagemViewModel.initialize();
  }, []);

  // 🎨 HELPER: Obter nomes dos temas da história
  const temasNomes = etapaSelecaoPersonagemViewModel.obterTemasNomes(historia);
  
  // 📋 HELPER: Formatar informações da história
  const infoHistoria = etapaSelecaoPersonagemViewModel.formatarInformacoesHistoria(historia);

  return (
    <div className="space-y-6">
      {/* Informações da História */}
      <div className="card-rpg p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h2 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-700' : 'text-white'} mb-4`}>
              {infoHistoria.nome}
            </h2>

            {/* 🎨 TEMAS POR NOME - Via ViewModel */}
            <div className="flex flex-wrap gap-2 mb-6">
              {temasLoading ? (
                <span className="text-slate-500 text-sm animate-pulse">Carregando temas...</span>
              ) : temasNomes.length > 0 ? (
                temasNomes.map((temaNome, i) => (
                  <span key={i} className="px-4 py-2 text-sm rounded-full bg-purple-600/20 text-purple-300 font-modern border border-purple-500/30">
                    {temaNome}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 text-sm">Sem temas definidos</span>
              )}
            </div>

            <div className="flex items-center space-x-4 text-sm">
              <span className={`flex items-center ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <span className="mr-1">👥</span>
                Máx. {infoHistoria.maximoParticipantes} participantes
              </span>

              {infoHistoria.descricao && (
                <span className={`flex items-center ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <span className="mr-1">📖</span>
                  {infoHistoria.descricao.length > 50
                    ? `${infoHistoria.descricao.substring(0, 50)}...`
                    : infoHistoria.descricao
                  }
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onVoltar}
            className="btn-rpg-secondary flex items-center space-x-2 cursor-pointer px-4 py-2"
          >
            <span>←</span>
            <span>Voltar</span>
          </button>
        </div>
      </div>

      {/* Seleção de Personagem */}
      <div className="card-rpg p-6">
        <h3 className={`text-2xl font-fantasy font-bold ${isLight ? 'text-slate-700' : 'text-white'} mb-6`}>
          👤 Escolha seu Personagem
        </h3>

        {loading && (
          <div className="text-center py-8">
            <LoadingSpinner size="lg" text="Carregando personagens..." />
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className={`text-xl ${isLight ? 'text-red-600' : 'text-red-400'} mb-4 font-modern`}>
              {error}
            </p>
          </div>
        )}

        {!loading && etapaSelecaoPersonagemViewModel.temPersonagensDisponiveis(personagens) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personagens.map((personagem) => (
              <PersonagemCard
                key={personagem.id}
                personagem={personagem}
                isSelected={etapaSelecaoPersonagemViewModel.isPersonagemSelecionado(personagem, personagemSelecionado)}
                onSelect={() => onSelecionarPersonagem(personagem)}
                isLight={isLight}
              />
            ))}
          </div>
        )}

        {!loading && !etapaSelecaoPersonagemViewModel.temPersonagensDisponiveis(personagens) && !error && (
          <div className="text-center py-8">
            <p className={`text-xl ${isLight ? 'text-slate-600' : 'text-slate-400'} mb-4 font-modern`}>
              Nenhum personagem encontrado para esta história
            </p>
            <p className="text-slate-500 text-sm mt-2">
              Você precisa criar um personagem para esta história primeiro
            </p>
            <div className="mt-4">
              <button
                onClick={() => window.location.href = '/personagens/novo'}
                className="btn-rpg px-6 py-2 text-sm"
              >
                ➕ Criar Personagem
              </button>
            </div>
          </div>
        )}

        {personagemSelecionado && (
          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">✨</span>
              <div>
                <p className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white'}`}>
                  {personagemSelecionado.nome} selecionado!
                </p>
                <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                  🏠 Abrindo sala de espera automaticamente...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Card individual de personagem
 */
const PersonagemCard = ({ personagem, isSelected, onSelect, isLight }) => {
  // 📋 HELPER: Formatar informações do personagem
  const infoPersonagem = etapaSelecaoPersonagemViewModel.formatarInformacoesPersonagem(personagem);
  
  return (
    <div
      onClick={onSelect}
      className={`
        card-rpg cursor-pointer transition-all duration-300 hover:scale-105 p-4 border-2
        ${isSelected
          ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/25'
          : 'border-transparent hover:border-purple-500/50'
        }
      `}
    >
      <div className="text-center">
        <div className="text-3xl mb-3">
          {isSelected ? '✨' : '👤'}
        </div>

        <h4 className={`text-lg font-bold mb-3 ${isLight ? 'text-slate-700' : 'text-white'}`}>
          {infoPersonagem.nome}
        </h4>

        <div className="space-y-2 text-sm">
          <div className={`flex justify-between ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            <span>Nível:</span>
            <span className="font-semibold">
              {infoPersonagem.nivel}
            </span>
          </div>

          <div className={`flex justify-between ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            <span>Classe:</span>
            <span className="font-semibold text-purple-400">
              {infoPersonagem.classe}
            </span>
          </div>

          <div className={`flex justify-between ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            <span>Raça:</span>
            <span className="font-semibold text-cyan-400">
              {infoPersonagem.raca}
            </span>
          </div>

          <div className={`flex justify-between ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            <span>HP:</span>
            <span className="font-semibold text-red-400">
              {infoPersonagem.hp}/{infoPersonagem.hpMaximo}
            </span>
          </div>
        </div>

        {isSelected && (
          <div className="mt-4 text-cyan-400 font-semibold text-sm">
            ✅ Selecionado
          </div>
        )}
      </div>
    </div>
  );
};

export default EtapaSelecaoPersonagem;