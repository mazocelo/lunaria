import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWizardModel } from './wizard.model';
import WizardView from './wizard.view';
import WizardSystemPicker from './components/WizardSystemPicker';
import TresDetFichaLivre from './TresDetFichaLivre/index';

function WizardWithSystem({ sistema }: { sistema: string }) {
  const navigate = useNavigate();
  const props = useWizardModel({ navigate, sistema });
  return (
    <div className="-m-6 h-[calc(100vh-3.5rem)] overflow-hidden">
      <WizardView {...props} />
    </div>
  );
}

export default function PersonagemWizardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sistemaParam = searchParams.get('sistema');

  if (!sistemaParam) {
    return (
      <WizardSystemPicker
        onSelect={(id) => setSearchParams({ sistema: id })}
        onBack={() => navigate('/personagens')}
      />
    );
  }

  if (sistemaParam === 'tresdet') {
    return (
      <div className="-m-6 h-[calc(100vh-3.5rem)] overflow-hidden">
        <TresDetFichaLivre />
      </div>
    );
  }

  return <WizardWithSystem sistema={sistemaParam} />;
}
