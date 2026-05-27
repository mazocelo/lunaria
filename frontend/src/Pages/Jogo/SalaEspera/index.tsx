import { useNavigate } from 'react-router-dom';
import { useSalaEsperaModel } from './sala-espera.model';
import SalaEsperaView from './sala-espera.view';

export default function SalaEsperaPage() {
  const navigate = useNavigate();
  const props = useSalaEsperaModel({ navigate });
  return <SalaEsperaView {...props} />;
}
