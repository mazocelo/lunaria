import React, { createContext, useContext, useState } from 'react';
import gameApi from "../Services/gameApi";

const PersonagensContext = createContext();

export const usePersonagens = () => useContext(PersonagensContext);

export const PersonagensProvider = ({ children }) => {
    const [personagens, setPersonagens] = useState([]);

    const setarPersonagens = (novosPersonagens) => {
        setPersonagens(novosPersonagens);
    };

    const getPersonagens = async () => {
        return new Promise((resolve, reject) => {
            gameApi.get("/personagens")
                .then(response => {
                    setPersonagens(response.data);
                    resolve(response.data);
                })
                .catch(error => reject(error));
        });
    };

    const criarPersonagem = async (personagem) => {
        return new Promise((resolve, reject) => {
            gameApi.post("/personagens", personagem)
                .then(response => {
                    setPersonagens(prev => [...prev, response.data]);
                    resolve(response.data);
                })
                .catch(error => reject(error));
        });
    };

    const atualizarPersonagemApi = async (id, novosDados) => {
        return new Promise((resolve, reject) => {
            gameApi.put(`/personagens/${id}`, novosDados)
                .then(response => {
                    setPersonagens(prev =>
                        prev.map(p => (p.id === id ? { ...p, ...response.data } : p))
                    );
                    resolve(response.data);
                })
                .catch(error => reject(error));
        });
    };

    const removerPersonagemApi = async (id) => {
        return new Promise((resolve, reject) => {
            gameApi.delete(`/personagens/${id}`)
                .then(() => {
                    setPersonagens(prev => prev.filter(p => p.id !== id));
                    resolve();
                })
                .catch(error => reject(error));
        });
    };

    return (
        <PersonagensContext.Provider
            value={{
                personagens,
                setarPersonagens,
                getPersonagens,
                criarPersonagem,
                atualizarPersonagemApi,
                removerPersonagemApi,
            }}
        >
            {children}
        </PersonagensContext.Provider>
    );
};