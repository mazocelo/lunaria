// Compat wrapper — delega para lobby.model.ts (features/gameSession)
// navigate is injected by the ViewModel (index.tsx)
import { useLobbyModel } from '../../../features/gameSession/phases/lobby/lobby.model';

interface UseSalaEsperaModelParams {
  navigate: (path: string) => void;
}

export const useSalaEsperaModel = ({ navigate }: UseSalaEsperaModelParams) => useLobbyModel({ navigate });

export type SalaEsperaModel = ReturnType<typeof useSalaEsperaModel>;

export default useSalaEsperaModel;
