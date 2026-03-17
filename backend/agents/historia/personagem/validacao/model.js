import { ChatGroq } from '@langchain/groq';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatAnthropic } from '@langchain/anthropic';
import { DEFAULT_MODEL_SETTINGS, API_CONFIG } from './config.js';
import { DEPRECATED_MODELS, detectProvider } from '../../../Mestre/config.js';

/**
 * Cria modelo para validação de coerência de personagem
 * @param {Object} params - Parâmetros adicionais
 * @returns {Object} Instância do modelo configurado
 */
export function createValidacaoModel(params = {}) {
    const merged = { ...DEFAULT_MODEL_SETTINGS, ...params };
    let modelName = merged.model;
    if (DEPRECATED_MODELS[modelName]) modelName = DEPRECATED_MODELS[modelName];

    const provider = detectProvider(modelName);
    if (provider === 'gemini') {
        return new ChatGoogleGenerativeAI({
            apiKey: API_CONFIG.googleApiKey,
            model: modelName,
            temperature: merged.temperature,
            maxOutputTokens: merged.maxTokens,
        });
    }
    if (provider === 'anthropic') {
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
        model: modelName,
    });
}
