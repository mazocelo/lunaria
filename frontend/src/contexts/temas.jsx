import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import gameApi from "../Services/gameApi"; // ajuste o caminho se necessário

const TemasContext = createContext();

export const TemasProvider = ({ children }) => {
    const [temas, setTemas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getTemas = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await gameApi.get("/temas");
            setTemas(response.data);
            return response.data;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        getTemas();
    }, [getTemas]);

    return (
        <TemasContext.Provider value={{ temas, loading, error, getTemas }}>
            {children}
        </TemasContext.Provider>
    );
};

export const useTemas = () => {
    const context = useContext(TemasContext);
    if (!context) {
        throw new Error("useTemas deve ser usado dentro de TemasProvider");
    }
    return context;
};