import { usePerfilModel } from './perfil.model';
import PerfilView from './perfil.view';

export default function PerfilPage() {
  const props = usePerfilModel();
  return <PerfilView {...props} />;
}
