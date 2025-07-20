import React from 'react';
import { useTheme } from '../../../contexts/theme.jsx';

/**
 * Componente para a etapa de informações da história
 */
export const EtapaInformacoes = ({ 
  historiaAtual, 
  onProximaEtapa 
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
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
              <h3 className={`text-lg font-semibold mb-3 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                📖 Descrição
              </h3>
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
          onClick={onProximaEtapa}
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
  );
}; 