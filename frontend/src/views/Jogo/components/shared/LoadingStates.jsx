import React from 'react';
import LoadingSpinner from '../../../../components/LoadingSpinner.jsx';

/**
 * Estados de loading para o jogo
 */
export const AuthLoading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-purple-600">Verificando autenticação...</h2>
      <p className="text-gray-600 mt-2">Aguarde um momento</p>
    </div>
  </div>
);

export const HistoriaLoading = () => (
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

export const AuthError = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="text-red-500 text-6xl mb-4">🔐</div>
      <h2 className="text-xl font-semibold text-red-600">Acesso não autorizado</h2>
      <p className="text-gray-600 mt-2">Redirecionando para login...</p>
    </div>
  </div>
); 