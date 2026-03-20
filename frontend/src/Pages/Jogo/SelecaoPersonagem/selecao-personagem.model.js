// Compat wrapper — delega para character-select.model.js (features/gameSession)
// navigate is injected by the ViewModel (index.jsx)
import { useCharacterSelectModel } from '../../../features/gameSession/phases/character-select/character-select.model.js';

export const useSelecaoPersonagemModel = ({ navigate }) => useCharacterSelectModel({ navigate });

export default useSelecaoPersonagemModel;
