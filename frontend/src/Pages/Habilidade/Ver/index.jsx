import { useHabilidadeVerModel } from './habilidade-ver.model';
import VerHabilidadeView from './habilidade-ver.view';

export default function HabilidadeVerPage() {
  const props = useHabilidadeVerModel();
  return <VerHabilidadeView {...props} />;
}
