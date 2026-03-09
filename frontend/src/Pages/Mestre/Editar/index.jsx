import { useMestreEditarModel } from './mestre-editar.model';
import EditarMestreView from './mestre-editar.view';

export default function MestreEditarPage() {
  const props = useMestreEditarModel();
  return <EditarMestreView {...props} />;
}
