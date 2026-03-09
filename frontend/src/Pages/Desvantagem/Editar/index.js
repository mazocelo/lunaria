import { useDesvantagemEditarModel } from './desvantagem-editar.model';
import EditarDesvantagemView from './desvantagem-editar.view';

export default function DesvantagemEditarPage() {
  const props = useDesvantagemEditarModel();
  return <EditarDesvantagemView {...props} />;
}
