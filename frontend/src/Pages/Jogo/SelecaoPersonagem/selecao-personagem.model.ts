// Compat wrapper — delega para character-select.model.ts (features/gameSession)
// navigate is injected by the ViewModel (index.tsx)
import { useCharacterSelectModel } from '../../../features/gameSession/phases/character-select/character-select.model';

interface UseSelecaoPersonagemModelParams {
  navigate: (path: string) => void;
}

export const useSelecaoPersonagemModel = ({ navigate }: UseSelecaoPersonagemModelParams) => useCharacterSelectModel({ navigate });

export type SelecaoPersonagemModel = ReturnType<typeof useSelecaoPersonagemModel>;

export default useSelecaoPersonagemModel;
