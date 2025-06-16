import React, { useState } from 'react';
import { Link } from 'react-router-dom';
const Personagens = () => {


  return (
    <div>
      <Link to="/novo-personagem">
        <button
          className="bg-blue-500 text-white font-bold py-2 px-4 rounded"
          style={{ marginTop: '20px' }}
        >
          Novo Personagem
        </button>
      </Link>
    </div>
  );
};


export default Personagens;
