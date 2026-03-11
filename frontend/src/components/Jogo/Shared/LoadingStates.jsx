import React from 'react';
import LoadingSpinner from '../../LoadingSpinner.jsx';

/**
 * Estados de loading para o jogo
 */
export const AuthLoading = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-purple-600">Verificando autenticação...</h2>
      <p className="text-gray-600 mt-2">Aguarde um momento</p>
    </div>
  </div>
);

export const HistoriaLoading = () => (
  <div className="h-full flex items-center justify-center animate-fade-in">
    <div className="card-rpg max-w-md w-full">
      <LoadingSpinner 
        size="xl" 
        text="Carregando história..." 
        variant="primary"
      />
    </div>
  </div>
);

export const AuthError = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <div className="text-red-500 text-6xl mb-4">🔐</div>
      <h2 className="text-xl font-semibold text-red-600">Acesso não autorizado</h2>
      <p className="text-gray-600 mt-2">Redirecionando para login...</p>
    </div>
  </div>
);

/**
 * Tela de transicao tematica para retomar sessao ativa.
 * Fullscreen com particulas, glass card e mensagem animada.
 */
export const GameTransitionLoading = ({ historiaNome, message }) => {
  const particles = React.useMemo(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 2}s`,
    })),
  []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      {/* Particulas de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: p.left,
              top: p.top,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 glass p-8 rounded-2xl border border-purple-500/20 text-center max-w-md w-full">
        {/* Spinner */}
        <div className="mb-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-purple-400 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-4 border-t-transparent border-r-cyan-400 border-b-transparent border-l-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">&#9876;</span>
            </div>
          </div>
        </div>

        {/* Titulo */}
        <h2 className="text-2xl font-fantasy font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
          Retomando Aventura
        </h2>

        {/* Nome da historia */}
        {historiaNome && (
          <div className="glass p-4 rounded-lg border border-cyan-500/20 mb-5">
            <h3 className="text-lg font-bold text-white">{historiaNome}</h3>
          </div>
        )}

        {/* Mensagem de status */}
        <p className="text-purple-300 animate-pulse">
          {message || 'Reconectando...'}
        </p>

        {/* Barra de progresso sutil */}
        <div className="mt-6 h-1 bg-purple-900/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
            style={{
              animation: 'progressIndeterminate 2s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes progressIndeterminate {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
};