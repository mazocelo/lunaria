import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personalizado para usar ViewModels com React
 * Gerencia o estado e sincronização entre ViewModel e componente React
 * @param {Object} viewModel - Instância do ViewModel
 * @returns {Object} Estado e métodos do ViewModel
 */
export function useViewModel(viewModel) {
  const [state, setState] = useState(viewModel.getState());

  // Sincroniza mudanças do ViewModel com o estado do React
  useEffect(() => {
    const unsubscribe = viewModel.subscribe((newState) => {
      setState(newState);
    });

    // Retorna função de limpeza
    return unsubscribe;
  }, [viewModel]);

  // Cria um proxy que retorna o estado e métodos do ViewModel
  return new Proxy(viewModel, {
    get(target, prop) {
      // Se a propriedade existe no ViewModel, retorna ela
      if (prop in target) {
        return target[prop];
      }
      // Se não existe, tenta pegar do estado
      if (prop in state) {
        return state[prop];
      }
      // Se não existe em nenhum lugar, retorna undefined
      return undefined;
    }
  });
} 