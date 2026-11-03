import dotenv from 'dotenv';

dotenv.config();

// Configurações padrão do modelo para títulos
export const DEFAULT_MODEL_SETTINGS = {
    model: 'gemini-2.5-flash-lite',
    temperature: 0.9,
    maxTokens: 2000,
    topP: 0.99,
    language: 'pt-br',
};

export const API_CONFIG = {
    groqApiKey: process.env.GROQ_API_KEY,
    googleApiKey: process.env.GOOGLE_API_KEY,
};

// Configurações de geração de títulos
export const TITULO_CONFIG = {
    maxTituloLength: 100,
    defaultTemperature: 0.9,
    creativeTemperature: 1.0,
    minWords: 2,
    maxWords: 8,
}; 