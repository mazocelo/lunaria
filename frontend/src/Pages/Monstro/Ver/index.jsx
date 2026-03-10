import { useMonstroVerModel } from './monstro-ver.model';
import VerMonstroView from './monstro-ver.view';

export default function MonstroVerPage() {
  const props = useMonstroVerModel();
  return <VerMonstroView {...props} />;
}
