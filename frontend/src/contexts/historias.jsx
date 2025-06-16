import React, { createContext, useState, useContext } from "react";
import gameApi from "../Services/gameApi";

const HistoriaContext = createContext();

export const HistoriaProvider = ({ children }) => {
  const [historia, setHistoria] = useState(null);
  const [temas, setTemas] = useState([]);

  const setarHistoria = (novaHistoria) => {
    setHistoria(novaHistoria);
  };
  const createHistoria = async (options) => {
    return new Promise((resolve, reject) => {
      gameApi.post("/historia/nova", options)
        .then(response => {
          resolve(response.data);
        })
        .catch(error => {
          reject(error);
        });
    });
  }


  const getHistorias = async () => {
    return new Promise((resolve, reject) => {
      gameApi.get("/historia")
        .then(response => {
          resolve(response.data);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  return (
    <HistoriaContext.Provider value={{ historia, setarHistoria, createHistoria, getHistorias }}>
      {children}
    </HistoriaContext.Provider>
  );
}

export const useHistoria = () => {
  const context = useContext(HistoriaContext);
  if (!context) {
    throw new Error("useHistoria deve ser usado dentro de um HistoriaProvider");
  }
  return context;
}