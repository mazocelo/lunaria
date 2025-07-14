import { useState, useEffect } from 'react';

/**
 * Hook personalizado para usar ViewModels com React
 * Garante reatividade e mantém métodos de classe disponíveis
 * @param {Object} viewModel - Instância do ViewModel
 * @returns {Object} O próprio ViewModel (reativo)
 */
export function useViewModel(viewModel) {
  const [, setVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = viewModel.subscribe(() => {
      setVersion(v => v + 1);
    });
    return unsubscribe;
  }, [viewModel]);

  return viewModel;
} 