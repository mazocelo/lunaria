import React, { useEffect, useState } from 'react';
import Selector from '../../../components/form/Selector';
import InputSimples from '../../../components/form/inputSimples';
import { useHistoria } from '../../../contexts/historias';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/form/button';
import { useTemas } from '../../../contexts/temas';

const NovaHistoria = () => {
  const [nomeHistoria, setNomeHistoria] = useState('');
  const [optionSelected, setOptionSelected] = useState([]);
  const [maximo_de_participantes, setMaximoDeParticipantes] = useState(3);
  const [error, setError] = useState(null);
  const { createHistoria } = useHistoria(); 
  const { temas } = useTemas();
  const navigate = useNavigate();

  const handleNomeChange = (event) => {
    setNomeHistoria(event.target.value);
  };

  const handleCreation = () => {
    let newOpts = optionSelected.map((option) => option.value);
    createHistoria({ nome: nomeHistoria, temas: newOpts, maximo_de_participantes })
      .then(() => navigate('/historia'))
      .catch((error) => {
        let msg = error.response?.data?.error || 'Erro ao criar história';
        setError(msg);
      });
  };


  return (
    <div className="mx-auto mt-10 p-8 bg-white dark:bg-zinc-900 rounded shadow">
      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded mb-4 flex  justify-center  gap-2">
          <svg
            className="w-6 h-6 mt-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <span className="font-semibold">Erro:</span>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6 text-center text-zinc-900 dark:text-zinc-100">Criar Nova História</h2>

      <div className="mb-4">
        <InputSimples
          label="Nome da História"
          onChange={handleNomeChange}
          value={nomeHistoria}
        />
      </div>

      <div>
        <Selector
          onChange={setOptionSelected}
          id="history-selector"
          selected={optionSelected}
          options={temas.map((tema) => ({
            value: tema.id,
            label: tema.nome,
          }))}
          type="multiple"
          max={3}
          label="Escolha os Temas"
        />
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 dark:text-zinc-200 font-medium mb-1">
          Máximo de Participantes
        </label>
        <input
          type="number"
          min={2}
          max={10}
          value={maximo_de_participantes}
          onChange={e => setMaximoDeParticipantes(Number(e.target.value))}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700"
        />
      </div>

      <Button
        className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
        onClick={handleCreation}
      >
        Criar História
      </Button>
    </div>
  );
};

export default NovaHistoria;