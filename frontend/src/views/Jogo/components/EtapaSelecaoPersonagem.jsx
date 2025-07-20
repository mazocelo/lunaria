import React from 'react';
import { useTheme } from '../../../contexts/theme.jsx';
import { LoadingSpinner } from '../../../components/index.js';

/**
 * Componente para a etapa de seleção de personagem
 */
export const EtapaSelecaoPersonagem = ({
  personagensDaHistoria,
  personagemSelecionado,
  loadingPersonagens,
  errorPersonagens,
  buscaPersonagem,
  onBuscaChange,
  onSelecionarPersonagem,
  onIniciarSessao,
  onVoltarEtapa
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="space-y-6">
      {/* Barra de busca */}
      <div className="card-rpg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-2xl font-fantasy font-bold ${isLight ? 'text-slate-700' : 'text-white'}`}>
            👥 Escolha seu Personagem
          </h2>
          <button 
            onClick={onVoltarEtapa}
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
            onChange={onBuscaChange}
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
              <PersonagemCard
                key={personagem.id}
                personagem={personagem}
                isSelected={personagemSelecionado?.id === personagem.id}
                onSelect={() => onSelecionarPersonagem(personagem)}
                isLight={isLight}
              />
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
              onClick={onIniciarSessao}
              className="btn-rpg-lg hover-lift flex items-center space-x-3 mx-auto cursor-pointer px-12 py-4"
            >
              <span className="text-2xl">🎮</span>
              <span className="text-xl font-fantasy">Iniciar Aventura</span>
            </button>
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