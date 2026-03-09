import { useMestreVerModel } from './mestre-ver.model';
import VerMestreView from './mestre-ver.view';

export default function MestreVerPage() {
  const props = useMestreVerModel();
  return <VerMestreView {...props} />;
}
