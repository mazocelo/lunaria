import { useTemaEditarModel } from './tema-editar.model';
import EditarTemaView from './tema-editar.view';

export default function TemaEditarPage() {
  const props = useTemaEditarModel();
  return <EditarTemaView {...props} />;
}
