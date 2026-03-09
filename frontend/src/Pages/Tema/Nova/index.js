import { useTemaNovaModel } from './tema-nova.model';
import NovoTemaView from './tema-nova.view';

export default function TemaNovaPage() {
  const props = useTemaNovaModel();
  return <NovoTemaView {...props} />;
}
