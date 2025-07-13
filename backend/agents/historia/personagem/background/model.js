import { ChatGroq } from '@langchain/groq';
import { DEFAULT_MODEL_SETTINGS, API_CONFIG } from './config.js';

/**
 * Gera o modelo da Groq com configurações personalizadas
 * @param {Object} detalhes - Configurações adicionais para o modelo
 * @returns {ChatGroq} Instância do modelo configurado
 */
export function generateModel(detalhes = {}) {
    return new ChatGroq({
        apiKey: API_CONFIG.groqApiKey,
        ...DEFAULT_MODEL_SETTINGS,
        ...detalhes,
    });
}

/**
 * Cria um modelo otimizado para geração de background de personagens
 * @returns {ChatGroq} Modelo configurado para backgrounds
 */
export function createBackgroundModel() {
    return generateModel({ 
        temperature: 0.8, // Criativo para backgrounds
        maxTokens: 4000 
    });
}

/**
 * Cria um modelo para geração de background detalhado
 * @returns {ChatGroq} Modelo configurado para backgrounds detalhados
 */
export function createBackgroundDetalhadoModel() {
    return generateModel({ 
        temperature: 0.9, // Mais criativo para backgrounds detalhados
        maxTokens: 6000 
    });
} 