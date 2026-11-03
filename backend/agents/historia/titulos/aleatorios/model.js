import { ChatGroq } from '@langchain/groq';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatAnthropic } from '@langchain/anthropic';
import { DEFAULT_MODEL_SETTINGS, API_CONFIG } from './config.js';
import { DEPRECATED_MODELS, detectProvider } from '../../../Mestre/config.js';

/**
 * Gera o modelo de IA com detecção automática de provider
 * @param {Object} detalhes - Configurações adicionais para o modelo
 * @returns {Object} Instância do modelo configurado
 */
export function generateModel(detalhes = {}) {
    const merged = { ...DEFAULT_MODEL_SETTINGS, ...detalhes };
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

/**
 * Cria um modelo otimizado para geração de títulos
 * @returns {ChatGroq} Modelo configurado para títulos
 */
export function createTituloModel() {
    return generateModel({ 
        temperature: 0.9, // Mais criativo para títulos
        maxTokens: 2000 
    });
}

/**
 * Cria um modelo para geração de títulos com alta criatividade
 * @returns {ChatGroq} Modelo configurado para títulos muito criativos
 */
export function createTituloCriativoModel() {
    return generateModel({ 
        temperature: 1.0, // Máxima criatividade
        maxTokens: 2000 
    });
} 