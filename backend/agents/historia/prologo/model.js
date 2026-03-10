import { ChatGroq } from '@langchain/groq';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatAnthropic } from '@langchain/anthropic';
import { DEFAULT_MODEL_SETTINGS, API_CONFIG } from './config.js';

/**
 * Gera o modelo de IA com detecção automática de provider (Groq, Gemini ou Anthropic)
 */
export function generateModel(detalhes = {}) {
    const merged = { ...DEFAULT_MODEL_SETTINGS, ...detalhes };
    const modelName = merged.model;

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

export function createPrologoModel() {
    return generateModel({ temperature: 0.8, maxTokens: 8000 });
}

export function createHistoriaModel() {
    return generateModel({ temperature: 0.7, maxTokens: 12000 });
}
