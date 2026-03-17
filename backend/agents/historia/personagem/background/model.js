import { ChatGroq } from '@langchain/groq';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatAnthropic } from '@langchain/anthropic';
import { DEFAULT_MODEL_SETTINGS, API_CONFIG } from './config.js';
import { DEPRECATED_MODELS } from '../../../Mestre/config.js';

/**
 * Gera o modelo de IA com detecção automática de provider (Groq, Gemini ou Anthropic)
 */
export function generateModel(detalhes = {}) {
    const merged = { ...DEFAULT_MODEL_SETTINGS, ...detalhes };
    let modelName = merged.model;
    if (DEPRECATED_MODELS[modelName]) modelName = DEPRECATED_MODELS[modelName];

    if (modelName.startsWith('gemini')) {
        return new ChatGoogleGenerativeAI({
            apiKey: API_CONFIG.googleApiKey,
            model: modelName,
            temperature: merged.temperature,
            maxOutputTokens: merged.maxTokens,
        });
    }

    if (modelName.startsWith('claude')) {
        return new ChatAnthropic({
            apiKey: API_CONFIG.anthropicApiKey,
            model: modelName,
            temperature: merged.temperature,
            maxTokens: merged.maxTokens,
        });
    }

    return new ChatGroq({
        apiKey: API_CONFIG.groqApiKey,
        ...merged,
    });
}

export function createBackgroundModel(params) {
    return generateModel({ temperature: 0.8, maxTokens: 4000, ...params });
}

export function createBackgroundDetalhadoModel() {
    return generateModel({ temperature: 0.9, maxTokens: 6000 });
}
