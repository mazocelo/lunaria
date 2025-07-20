import React from 'react';
import { useTheme } from '../../../contexts/theme.jsx';
import { WebSocketStatus } from '../../../components/WebSocketStatus.jsx';

/**
 * Componente do header do jogo com navegação por etapas
 */
export const HeaderJogo = ({
  etapaAtual,
  webSocket,
  tentativaConexaoIniciada,
  onVoltarHistorias
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const getTituloEtapa = () => {
    switch (etapaAtual) {
      case 'info':
        return 'Prepare-se para uma aventura épica!';
      case 'selecao-personagem':
        return 'Escolha seu personagem para a aventura';
      case 'jogo':
        return 'Aventura em andamento!';
      default:
        return 'Sessão de Jogo';
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl mb-8 ${isLight ? 'bg-gradient-to-br from-slate-50 to-slate-100' : 'bg-gradient-to-br from-slate-800 to-slate-900'}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10"></div>
      <div className="relative p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="mb-6 lg:mb-0">
            <h1 className={`text-4xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
              🎲 Sessão de Jogo
            </h1>
            <p className={`text-lg font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              {getTituloEtapa()}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Status WebSocket - só exibe após tentativa de conexão */}
            {tentativaConexaoIniciada && (
              <WebSocketStatus
                isConnected={webSocket.isConnected}
                isAuthenticated={webSocket.isAuthenticated}
                isConnecting={webSocket.isConnecting}
                error={webSocket.error}
                currentUser={webSocket.currentUser}
                currentRoom={webSocket.currentRoom}
                currentSession={webSocket.currentSession}
                onReconnect={() => webSocket.connect()}
                className="mr-4"
              />
            )}
            
            <button 
              onClick={onVoltarHistorias} 
              className="btn-rpg-secondary hover-lift flex items-center space-x-2 cursor-pointer px-6 py-3"
            >
              <span>←</span>
              <span>Voltar</span>
            </button>
          </div>
        </div>

        {/* Indicador de progresso */}
        <IndicadorProgresso etapaAtual={etapaAtual} />
      </div>
    </div>
  );
};

/**
 * Componente do indicador de progresso
 */
const IndicadorProgresso = ({ etapaAtual }) => {
  const etapas = [
    { id: 'info', label: 'Informações' },
    { id: 'selecao-personagem', label: 'Personagem' },
    { id: 'jogo', label: 'Jogo' }
  ];

  return (
    <div className="flex items-center space-x-4">
      {etapas.map((etapa, index) => (
        <React.Fragment key={etapa.id}>
          <div className={`flex items-center space-x-2 ${
            etapaAtual === etapa.id ? 'text-cyan-400' : 'text-slate-500'
          }`}>
            <div className={`w-3 h-3 rounded-full ${
              etapaAtual === etapa.id ? 'bg-cyan-400' : 'bg-slate-500'
            }`}></div>
            <span className="text-sm font-modern">{etapa.label}</span>
          </div>
          
          {index < etapas.length - 1 && (
            <div className="w-8 h-0.5 bg-slate-600"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}; 