import dotenv from 'dotenv';

dotenv.config();

// Configurações padrão do modelo para títulos
export const DEFAULT_MODEL_SETTINGS = {
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    temperature: 0.9, // Mais criativo para títulos
    maxTokens: 2000,
    topP: 0.99,
    language: 'pt-br',
};

// Configurações da API
export const API_CONFIG = {
    groqApiKey: process.env.GROQ_API_KEY,
};

// Configurações de geração de títulos
export const TITULO_CONFIG = {
    maxTituloLength: 100,
    defaultTemperature: 0.9,
    creativeTemperature: 1.0,
    minWords: 2,
    maxWords: 8,
}; 