import { RunnableSequence } from '@langchain/core/runnables';
import { createTituloModel, createTituloCriativoModel } from './model.js';
import { createTituloPrompt, createTituloGeneroPrompt } from './prompts.js';
import { DEFAULT_MODEL_SETTINGS } from './config.js';
import { trackLLMUsage } from '../../../../services/llmTracker.js';

/**
 * Cria o agente para geração de títulos aleatórios
 * @param {Array} temas - Lista de temas disponíveis para inspiração
 * @returns {Object} Objeto com métodos para gerar títulos
 */
async function criarGeradorTitulo(temas = []) {
    try {
        const prompt = createTituloPrompt(temas);
        const model = createTituloModel();
        const modelName = DEFAULT_MODEL_SETTINGS.model;

        const chain = RunnableSequence.from([
            prompt,
            model,
        ]);

        return {
            gerarTitulo: async ({ tema, userId }) => {
                const startTime = Date.now();
                const response = await chain.invoke({ tema });
                trackLLMUsage(response, { modelName, userId, startTime, agent: 'GeradorTitulo' });
                console.log('📝 Título gerado para tema:', tema);
                return {
                    titulo: response.content.trim(),
                    tema: tema,
                    timestamp: new Date().toISOString(),
                    temasUtilizados: temas
                };
            },

            gerarTituloGenero: async ({ tema, genero, userId }) => {
                try {
                    const promptGenero = createTituloGeneroPrompt(temas, genero);
                    const modelGenero = createTituloCriativoModel();

                    const chainGenero = RunnableSequence.from([
                        promptGenero,
                        modelGenero,
                    ]);

                    const startTime = Date.now();
                    const response = await chainGenero.invoke({ tema });
                    trackLLMUsage(response, { modelName, userId, startTime, agent: 'GeradorTitulo' });
                    console.log('📝 Título com gênero gerado:', { tema, genero });

                    return {
                        titulo: response.content.trim(),
                        tema: tema,
                        genero: genero,
                        timestamp: new Date().toISOString(),
                        temasUtilizados: temas
                    };
                } catch (error) {
                    console.error('❌ Erro ao gerar título com gênero:', error);
                    throw error;
                }
            },

            gerarMultiplosTitulos: async ({ tema, quantidade = 3, userId }) => {
                try {
                    const titulos = [];

                    for (let i = 0; i < quantidade; i++) {
                        const startTime = Date.now();
                        const resultado = await chain.invoke({ tema });
                        trackLLMUsage(resultado, { modelName, userId, startTime, agent: 'GeradorTitulo' });
                        titulos.push(resultado.content.trim());
                    }

                    console.log(`📝 ${quantidade} títulos gerados para tema:`, tema);

                    return {
                        titulos: titulos,
                        tema: tema,
                        quantidade: quantidade,
                        timestamp: new Date().toISOString(),
                        temasUtilizados: temas
                    };
                } catch (error) {
                    console.error('❌ Erro ao gerar múltiplos títulos:', error);
                    throw error;
                }
            }
        };
    } catch (error) {
        console.error('❌ Erro ao criar gerador de títulos:', error.message);
        throw new Error(`Erro ao criar gerador de títulos: ${error.message}`);
    }
}

export default criarGeradorTitulo;
