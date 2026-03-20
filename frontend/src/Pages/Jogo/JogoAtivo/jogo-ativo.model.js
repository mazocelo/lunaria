// Compat wrapper — delega para active.model.js (features/gameSession)
// navigate is injected by the ViewModel (index.jsx)
import { useActiveModel } from '../../../features/gameSession/phases/active/active.model.js';

export const useJogoAtivoModel = ({ navigate }) => useActiveModel({ navigate });

export default useJogoAtivoModel;
