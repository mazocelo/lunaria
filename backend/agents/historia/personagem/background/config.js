import dotenv from 'dotenv';

dotenv.config();

// Configurações padrão do modelo para background de personagens
export const DEFAULT_MODEL_SETTINGS = {
    model: 'gemma2-9b-it',
    temperature: 0.8, // Criativo para backgrounds
    maxTokens: 4000,
    topP: 0.99,
    language: 'pt-br',
};

// Configurações da API
export const API_CONFIG = {
    groqApiKey: process.env.GROQ_API_KEY,
};

// Configurações de geração de background
export const BACKGROUND_CONFIG = {
    maxBackgroundLength: 4000,
    defaultTemperature: 0.8,
    creativeTemperature: 0.9,
    minParagraphs: 2,
    maxParagraphs: 4,
}; 