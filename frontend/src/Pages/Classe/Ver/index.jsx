import { useClasseVerModel } from './classe-ver.model';
import VerClasseView from './classe-ver.view';

export default function ClasseVerPage() {
  const props = useClasseVerModel();
  return <VerClasseView {...props} />;
}
