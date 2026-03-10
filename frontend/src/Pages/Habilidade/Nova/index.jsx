import { useHabilidadeNovaModel } from './habilidade-nova.model';
import NovaHabilidadeView from './habilidade-nova.view';

export default function HabilidadeNovaPage() {
  const props = useHabilidadeNovaModel();
  return <NovaHabilidadeView {...props} />;
}
