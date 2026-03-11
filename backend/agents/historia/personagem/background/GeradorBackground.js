import { RunnableSequence } from '@langchain/core/runnables';
import { createBackgroundModel } from './model.js';
import { createBackgroundPrompt } from './prompts.js';
import { trackLLMUsage } from '../../../../services/llmTracker.js';

const BACKGROUND_MODEL_NAME = 'meta-llama/llama-4-scout-17b-16e-instruct';

/**
 * Cria o agente para geração de background de personagens
 * @param {Array} temas - Lista de temas disponíveis para inspiração
 * @returns {Object} Objeto com método para gerar background
 */
async function criarGeradorBackground(temas = []) {
    try {
        const prompt = createBackgroundPrompt(temas);
        const model = createBackgroundModel({ model: BACKGROUND_MODEL_NAME });

        const chain = RunnableSequence.from([
            prompt,
            model,
        ]);

        return {
            gerarBackground: async ({
                nome, classe, raca, tema, sugestao_background = '',
                vantagens = [], desvantagens = [],
                nivel = 1, forca = 10, inteligencia = 10, carisma = 10,
                destreza = 10, constituicao = 10, agilidade = 10,
                equipamentos = 'Nenhum',
                userId
            }) => {
                try {
                    const startTime = Date.now();
                    const response = await chain.invoke({
                        nome, classe, raca, tema, sugestao_background,
                        vantagens, desvantagens,
                        nivel: String(nivel),
                        forca: String(forca),
                        inteligencia: String(inteligencia),
                        carisma: String(carisma),
                        destreza: String(destreza),
                        constituicao: String(constituicao),
                        agilidade: String(agilidade),
                        equipamentos
                    });
                    trackLLMUsage(response, { modelName: BACKGROUND_MODEL_NAME, userId, startTime, agent: 'GeradorBackground' });

                    console.log('👤 Background gerado para personagem:', nome);

                    return {
                        background: response.content.trim(),
                        nome, classe, raca, tema, sugestao_background,
                        timestamp: new Date().toISOString(),
                        temasUtilizados: temas
                    };
                } catch (error) {
                    console.error('❌ Erro ao gerar background:', error);
                    throw error;
                }
            }
        };
    } catch (error) {
        console.error('❌ Erro ao criar gerador de background:', error.message);
        throw new Error(`Erro ao criar gerador de background: ${error.message}`);
    }
}

export default criarGeradorBackground;
