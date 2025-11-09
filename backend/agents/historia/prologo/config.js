import dotenv from 'dotenv';

dotenv.config();

// Configurações padrão do modelo
export const DEFAULT_MODEL_SETTINGS = {
    model: 'openai/gpt-oss-120b',
    temperature: 0.8, // Mais criativo para prólogos
    maxTokens: 8000,
    topP: 0.99,
    language: 'pt-br',
};

// Configurações da API
export const API_CONFIG = {
    groqApiKey: process.env.GROQ_API_KEY,
};

// Configurações de geração
export const GENERATION_CONFIG = {
    maxPrologoLength: 8000,
    defaultTemperature: 0.8,
    creativeTemperature: 0.9,
}; 