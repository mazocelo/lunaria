import React, { useState } from 'react';
import ThemeSelector from './Personagem/components/Select';
const Home = () => {
  const [nomePersonagem, setNomePersonagem] = useState('');
  
  const handleNomeChange = (event) => {
    setNomePersonagem(event.target.value);
  };

  return (
    <div>
      <ThemeSelector
        onChange={(value) => console.log(value)}
      />
    </div>
  );
};

export default Home;
