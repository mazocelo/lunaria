import { useEtapaJogoRPGModel } from './EtapaJogoRPG.model.js';
import EtapaJogoRPGView from './EtapaJogoRPG.view.jsx';

const EtapaJogoRPG = (props) => {
  const model = useEtapaJogoRPGModel(props);
  return <EtapaJogoRPGView {...model} />;
};

export default EtapaJogoRPG;
