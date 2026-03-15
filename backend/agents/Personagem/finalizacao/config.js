import dotenv from 'dotenv';

dotenv.config();

export const DEFAULT_MODEL_SETTINGS = {
  model: process.env.AI_MODEL || 'gemini-2.5-flash',
  temperature: 0.7,
  maxTokens: 4000,
};

export const API_CONFIG = {
  groqApiKey: process.env.GROQ_API_KEY,
  googleApiKey: process.env.GOOGLE_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
};
