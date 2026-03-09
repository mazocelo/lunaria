import { usePersonagemVerModel } from './personagem-ver.model';
import VerPersonagemView from './personagem-ver.view';

export default function PersonagemVerPage() {
  const props = usePersonagemVerModel();
  return <VerPersonagemView {...props} />;
}
