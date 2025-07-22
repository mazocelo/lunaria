import React from 'react';
import { useTheme } from '../../../contexts/theme.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner.jsx';

/**
 * Componente para a etapa de seleção de personagem
 * 📍 Usado por: JogoView (etapa 'selecao-personagem')
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

  return (
    <div className="space-y-6">
      {/* Informações da História */}
      <div className="card-rpg p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h2 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-700' : 'text-white'} mb-4`}>
              {historia?.nome || 'História sem nome'}
            </h2>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {Array.isArray(historia?.temas) && historia?.temas.length > 0
                ? historia?.temas.map((tema, i) => (
                    <span key={i} className="px-4 py-2 text-sm rounded-full bg-purple-600/20 text-purple-300 font-modern border border-purple-500/30">
                      {tema}
                    </span>
                  ))
                : <span className="text-slate-500 text-sm">Sem tema definido</span>
              }
            </div>
            
            {historia?.descricao && (
              <div className={`p-4 rounded-xl mb-4 ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/50 border border-slate-700'}`}>
                <h3 className={`text-lg font-semibold mb-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                  📖 Descrição
                </h3>
                <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'} text-sm`}>
                  {historia?.descricao}
                </p>
              </div>
            )}
          </div>
          
          <div className="text-center ml-8">
            <div className="text-4xl font-bold text-cyan-400 mb-2">
              {historia?.maximo_de_participantes || 0}
            </div>
            <div className="text-sm text-slate-400 font-modern">
              Máximo de jogadores
            </div>
          </div>
        </div>
      </div>

      {/* Seleção de Personagem */}
      <div className="card-rpg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-fantasy font-bold ${isLight ? 'text-slate-700' : 'text-white'}`}>
            👥 Escolha seu Personagem
          </h2>
          <button 
            onClick={onVoltar}
            className="btn-rpg-secondary cursor-pointer px-4 py-2"
          >
            ← Voltar
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300 font-modern">{error}</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <LoadingSpinner />
            <p className={`mt-4 ${isLight ? 'text-slate-600' : 'text-slate-300'} font-modern`}>
              Carregando personagens disponíveis...
            </p>
          </div>
        )}

        {!loading && personagens?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personagens.map((personagem) => (
              <PersonagemCard
                key={personagem.id}
                personagem={personagem}
                isSelected={personagemSelecionado?.id === personagem.id}
                onSelect={() => onSelecionarPersonagem(personagem)}
                isLight={isLight}
              />
            ))}
          </div>
        )}

        {!loading && personagens?.length === 0 && !error && (
          <div className="text-center py-8">
            <p className={`text-xl ${isLight ? 'text-slate-600' : 'text-slate-400'} mb-4 font-modern`}>
              Nenhum personagem encontrado para esta história
            </p>
            <p className="text-slate-500 text-sm mt-2">
              Você precisa criar um personagem para esta história primeiro
            </p>
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
  return (
    <div 
      onClick={onSelect}
      className={`cursor-pointer rounded-xl p-6 border-2 transition-all duration-200 hover:scale-105 ${
        isSelected
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

      {isSelected && (
        <div className="mt-4 flex items-center justify-center">
          <span className="text-cyan-400 text-sm font-semibold">✓ Selecionado</span>
        </div>
      )}
    </div>
  );
};

export default EtapaSelecaoPersonagem;