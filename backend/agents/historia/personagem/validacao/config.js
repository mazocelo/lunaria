import dotenv from 'dotenv';

dotenv.config();

export const DEFAULT_MODEL_SETTINGS = {
    model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    temperature: 0.3,
    maxTokens: 2000,
    topP: 0.95,
    language: 'pt-br',
};

export const API_CONFIG = {
    groqApiKey: process.env.GROQ_API_KEY,
};
