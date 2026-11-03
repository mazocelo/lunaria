// Compat wrapper — delega para active.model.ts (features/gameSession)
// navigate is injected by the ViewModel (index.tsx)
import { useActiveModel } from '../../../features/gameSession/phases/active/active.model';

interface UseJogoAtivoModelParams {
  navigate: (path: string) => void;
}

export const useJogoAtivoModel = ({ navigate }: UseJogoAtivoModelParams) => useActiveModel({ navigate });

export type JogoAtivoModel = ReturnType<typeof useJogoAtivoModel>;

export default useJogoAtivoModel;
