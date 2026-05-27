import { useEtapaJogoRPGModel } from './EtapaJogoRPG.model';
import EtapaJogoRPGView from './EtapaJogoRPG.view';

type EtapaJogoRPGProps = Parameters<typeof useEtapaJogoRPGModel>[0];

const EtapaJogoRPG = (props: EtapaJogoRPGProps) => {
  const model = useEtapaJogoRPGModel(props);
  return <EtapaJogoRPGView {...model} />;
};

export default EtapaJogoRPG;
