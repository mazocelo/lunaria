import { useWizardModel } from './wizard.model';
import WizardView from './wizard.view';

export default function PersonagemWizardPage() {
  const props = useWizardModel();
  return <WizardView {...props} />;
}
