import dotenv from 'dotenv';

dotenv.config();

export const DEFAULT_MODEL_SETTINGS = {
    model: 'gemini-2.5-flash-lite',
    temperature: 0.3,
    maxTokens: 2000,
    topP: 0.95,
    language: 'pt-br',
};

export const API_CONFIG = {
    groqApiKey: process.env.GROQ_API_KEY,
    googleApiKey: process.env.GOOGLE_API_KEY,
};
