import React from 'react';
import { useTheme } from '../../../../contexts/theme.jsx';

/**
 * Componente exibido quando a história não é encontrada
 */
const HistoriaNotFound = ({ onVoltarHistorias }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

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
        <button onClick={onVoltarHistorias} className="btn-rpg cursor-pointer px-8 py-3">
          ← Voltar para Histórias
        </button>
      </div>
    </div>
  );
};

export default HistoriaNotFound; 