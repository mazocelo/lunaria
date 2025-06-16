import { useEffect, useState } from 'react';
import { useHistoria } from '../../contexts/historias';
import { Link } from 'react-router-dom';
import Button from '../../components/form/button';
import Table from '../../components/Table';
import { useTemas } from '../../contexts/temas';

const Historias = () => {
  const { getHistorias } = useHistoria();
  const [historias, setHistorias] = useState([]);
  const { temas } = useTemas();

  useEffect(() => {
    getHistorias().then(data => {
      // console.log("Temas disponíveis:", temas);
      setHistorias(data.map(historia => {
        let hist = { ...historia };
        hist.temas = !historia.temas ? 'Sem tema' : temas.filter(tema => historia.temas.includes(tema.id)).map(tema => tema.nome).join(', ');
        return hist;
      }));
    }).catch(error => {
      console.error("Erro ao carregar histórias:", error);
    });
  }, []);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded shadow p-6">
      <Link to="/nova-historia">
        <Button
          type="primary"
          size="large"
          style={{ marginTop: '20px' }}
          title="Nova História"
        />
      </Link>
      <Table
        className="w-full mt-4"
        columns={[
          { title: 'ID', dataIndex: 'id', key: 'id' },
          { title: 'Nome', dataIndex: 'nome', key: 'nome' },
          { title: 'Temas', dataIndex: 'temas', key: 'temas' },
          { title: 'Máximo de Participantes', dataIndex: 'maximo_de_participantes', key: 'maximo_de_participantes' },
        ]}
        data={historias}
        rowKey="id"
      />
    </div>
  );
};

export default Historias;
