import React, { useState } from 'react';
import Selector from './Personagem/components/Selector';
import InputSimples from './Personagem/components/inputSimples';
import { historyOptions } from '../Services/data';
const Home = () => {
  const [nomePersonagem, setNomePersonagem] = useState('');
  const [optionSelected, setOptionSelected] = useState([]);

  const handleNomeChange = (event) => {
    setNomePersonagem(event.target.value);
  };


  return (
    <div>
      <InputSimples label="Nome do Personagem" onChange={handleNomeChange} value={nomePersonagem} />

      <Selector
        onChange={vls=>{
          console.log(vls)
          setOptionSelected(vls)}
        }
        id="history-selector"
        selected={optionSelected}
        options={historyOptions}
        type="multiple"
        max={3}
        label="Escolha suas opções"
      />



    </div>
  );
};


export default Home;
