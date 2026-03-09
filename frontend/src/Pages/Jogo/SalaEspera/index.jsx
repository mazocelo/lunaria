import { useSalaEsperaModel } from './sala-espera.model';
import SalaEsperaView from './sala-espera.view';

export default function SalaEsperaPage() {
  const props = useSalaEsperaModel();
  return <SalaEsperaView {...props} />;
}
