import { RunnableSequence } from '@langchain/core/runnables';
import { createTituloModel, createTituloCriativoModel } from './model.js';
import { createTituloPrompt, createTituloGeneroPrompt } from './prompts.js';

/**
 * Cria o agente para geração de títulos aleatórios
 * @param {Array} temas - Lista de temas disponíveis para inspiração
 * @returns {Object} Objeto com métodos para gerar títulos
 */
async function criarGeradorTitulo(temas = []) {
    try {
        const prompt = createTituloPrompt(temas);
        const model = createTituloModel();

        const chain = RunnableSequence.from([
            prompt,
            model,
        ]);

        return {
            /**
             * Gerar título aleatório para um tema específico
             * @param {Object} params - Parâmetros de geração
             * @param {string} params.tema - Tema da história
             * @returns {Object} Resultado da geração
             */
            gerarTitulo: async ({ tema }) => {
                const response = await chain.invoke({ tema });
                console.log('📝 Título gerado para tema:', tema);
                return {
                    titulo: response.content.trim(),
                    tema: tema,
                    timestamp: new Date().toISOString(),
                    temasUtilizados: temas
                };
            },

            /**
             * Gerar título com gênero específico
             * @param {Object} params - Parâmetros de geração
             * @param {string} params.tema - Tema da história
             * @param {string} params.genero - Gênero específico
             * @returns {Object} Resultado da geração
             */
            gerarTituloGenero: async ({ tema, genero }) => {
                try {
                    const promptGenero = createTituloGeneroPrompt(temas, genero);
                    const modelGenero = createTituloCriativoModel();

                    const chainGenero = RunnableSequence.from([
                        promptGenero,
                        modelGenero,
                    ]);

                    const response = await chainGenero.invoke({ tema });
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

            /**
             * Gerar múltiplos títulos para um tema
             * @param {Object} params - Parâmetros de geração
             * @param {string} params.tema - Tema da história
             * @param {number} params.quantidade - Quantidade de títulos (padrão: 3)
             * @returns {Object} Resultado da geração
             */
            gerarMultiplosTitulos: async ({ tema, quantidade = 3 }) => {
                try {
                    const titulos = [];
                    
                    for (let i = 0; i < quantidade; i++) {
                        const resultado = await chain.invoke({ tema });
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