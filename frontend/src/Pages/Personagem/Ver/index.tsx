import { useNavigate } from 'react-router-dom';
import { usePersonagemVerModel } from './personagem-ver.model';
import VerPersonagemView from './personagem-ver.view';

export default function PersonagemVerPage() {
  const navigate = useNavigate();
  const props = usePersonagemVerModel({ navigate });
  return <VerPersonagemView {...props} />;
}
