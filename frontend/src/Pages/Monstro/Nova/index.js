import { useMonstroNovaModel } from './monstro-nova.model';
import NovoMonstroView from './monstro-nova.view';

export default function MonstroNovaPage() {
  const props = useMonstroNovaModel();
  return <NovoMonstroView {...props} />;
}
