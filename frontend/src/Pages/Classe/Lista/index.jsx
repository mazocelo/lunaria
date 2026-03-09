import { useClasseListaModel } from './classe-lista.model';
import ClasseListaView from './classe-lista.view';

export default function ClasseListaPage() {
  const props = useClasseListaModel();
  return <ClasseListaView {...props} />;
}
