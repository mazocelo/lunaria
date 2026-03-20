// Compat wrapper — delega para lobby.model.js (features/gameSession)
// navigate is injected by the ViewModel (index.jsx)
import { useLobbyModel } from '../../../features/gameSession/phases/lobby/lobby.model.js';

export const useSalaEsperaModel = ({ navigate }) => useLobbyModel({ navigate });

export default useSalaEsperaModel;
