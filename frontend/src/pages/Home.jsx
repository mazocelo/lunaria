import React, { useState } from 'react';
import InputSimples from './Personagem/Criar';

const Home = () => {
  const [nomePersonagem, setNomePersonagem] = useState('');
  
  const handleNomeChange = (event) => {
    setNomePersonagem(event.target.value);
  };

  return (
    <div>
      <h1>Bem-vindo à Página Inicial!</h1>
      
      <InputSimples label="Nome Personagem" type="text" value={nomePersonagem} onChange={handleNomeChange} />

    </div>
  );
};

export default Home;
