import dotenv from 'dotenv';

dotenv.config();

// Configurações padrão do modelo
export const DEFAULT_MODEL_SETTINGS = {
    model: 'gemini-2.5-flash',
    temperature: 0.8,
    maxTokens: 8000,
    topP: 0.99,
    language: 'pt-br',
};

// Configurações da API
export const API_CONFIG = {
    groqApiKey: process.env.GROQ_API_KEY,
    googleApiKey: process.env.GOOGLE_API_KEY,
};

// Configurações de geração
export const GENERATION_CONFIG = {
    maxPrologoLength: 8000,
    defaultTemperature: 0.8,
    creativeTemperature: 0.9,
}; 