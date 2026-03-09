import { useVantagemEditarModel } from './vantagem-editar.model';
import EditarVantagemView from './vantagem-editar.view';

export default function VantagemEditarPage() {
  const props = useVantagemEditarModel();
  return <EditarVantagemView {...props} />;
}
