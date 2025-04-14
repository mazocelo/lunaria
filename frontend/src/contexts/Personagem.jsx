import React, { createContext, useState, useContext } from "react";

const PersonagemContext = createContext();

export const PersonagemProvider = ({ children }) => {
  const [personagem, setPersonagem] = useState(null);

  const setarPersonagem = (novoPersonagem) => {
    setPersonagem(novoPersonagem);
  };

  return (
    <PersonagemContext.Provider value={{ personagem, setarPersonagem }}>
      {children}
    </PersonagemContext.Provider>
  );
}

export const usePersonagem = () => {
    const context = useContext(PersonagemContext);
    if (!context) {
        throw new Error("usePersonagem deve ser usado dentro de um PersonagemProvider");
    }
    return context;
    }