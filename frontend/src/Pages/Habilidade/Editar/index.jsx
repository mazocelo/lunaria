import { useHabilidadeEditarModel } from './habilidade-editar.model';
import EditarHabilidadeView from './habilidade-editar.view';

export default function HabilidadeEditarPage() {
  const props = useHabilidadeEditarModel();
  return <EditarHabilidadeView {...props} />;
}
