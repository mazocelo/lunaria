import { useNavigate } from 'react-router-dom';
import { useWizardModel } from './wizard.model';
import WizardView from './wizard.view';

export default function PersonagemWizardPage() {
  const navigate = useNavigate();
  const props = useWizardModel({ navigate });
  return (
    <div className="-m-6 h-[calc(100vh-3.5rem)] overflow-hidden">
      <WizardView {...props} />
    </div>
  );
}
