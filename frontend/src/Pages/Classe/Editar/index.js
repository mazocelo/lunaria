import { useClasseEditarModel } from './classe-editar.model';
import EditarClasseView from './classe-editar.view';

export default function ClasseEditarPage() {
  const props = useClasseEditarModel();
  return <EditarClasseView {...props} />;
}
