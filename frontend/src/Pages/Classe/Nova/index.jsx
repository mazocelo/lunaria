import { useClasseNovaModel } from './classe-nova.model';
import NovaClasseView from './classe-nova.view';

export default function ClasseNovaPage() {
  const props = useClasseNovaModel();
  return <NovaClasseView {...props} />;
}
