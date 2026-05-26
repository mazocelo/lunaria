import { useNavigate } from 'react-router-dom';
import { usePersonagemNovoModel } from './personagem-novo.model';
import NovoPersonagemView from './personagem-novo.view';

export default function PersonagemNovoPage() {
  const navigate = useNavigate();
  const props = usePersonagemNovoModel({ navigate });
  return <NovoPersonagemView {...props} />;
}
