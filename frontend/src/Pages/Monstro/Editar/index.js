import { useMonstroEditarModel } from './monstro-editar.model';
import EditarMonstroView from './monstro-editar.view';

export default function MonstroEditarPage() {
  const props = useMonstroEditarModel();
  return <EditarMonstroView {...props} />;
}
