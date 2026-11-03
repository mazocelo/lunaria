import { useAmigosModel } from './amigos.model';
import AmigosView from './amigos.view';

export default function AmigosPage() {
  const props = useAmigosModel();
  return <AmigosView {...props} />;
}
