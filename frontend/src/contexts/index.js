// 🎮 Contexts do Sistema de Jogo
export { GameLoadingProvider, useGameLoading } from './GameLoadingContext';
export { GameProvider, useGame } from './GameContext';

// 🔐 Contexts de Autenticação e Layout
export { AuthProvider, useAuth } from './AuthContext';
export { LayoutProvider, useLayout } from './LayoutContext';
export { ThemeProvider, useTheme } from './theme';

// 🎯 Context combinado para facilitar uso
import React from 'react';
import { AuthProvider } from './AuthContext';
import { LayoutProvider } from './LayoutContext';
import { ThemeProvider } from './theme';
import { GameLoadingProvider } from './GameLoadingContext';
import { GameProvider } from './GameContext';

/**
 * 🎮 Provider Combinado - Agrupa todos os contexts do jogo
 * 
 * Uso:
 * <GameProvidersWrapper>
 *   <App />
 * </GameProvidersWrapper>
 */
export const GameProvidersWrapper = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LayoutProvider>
          <GameLoadingProvider>
            <GameProvider>
              {children}
            </GameProvider>
          </GameLoadingProvider>
        </LayoutProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default GameProvidersWrapper;
