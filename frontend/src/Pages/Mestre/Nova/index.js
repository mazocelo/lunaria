import { useMestreNovaModel } from './mestre-nova.model';
import NovaMestreView from './mestre-nova.view';

export default function MestreNovaPage() {
  const props = useMestreNovaModel();
  return <NovaMestreView {...props} />;
}
