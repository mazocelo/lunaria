import { RunnableSequence } from '@langchain/core/runnables';
import { createBackgroundModel } from './model.js';
import { createBackgroundPrompt } from './prompts.js';

/**
 * Cria o agente para geração de background de personagens
 * @param {Array} temas - Lista de temas disponíveis para inspiração
 * @returns {Object} Objeto com método para gerar background
 */
async function criarGeradorBackground(temas = []) {
    try {
        const prompt = createBackgroundPrompt(temas);
        const model = createBackgroundModel({ model: "meta-llama/llama-4-maverick-17b-128e-instruct" });

        const chain = RunnableSequence.from([
            prompt,
            model,
        ]);

        return {
            /**
             * Gerar background para um personagem
             * @param {Object} params - Parâmetros de geração
             * @param {string} params.nome - Nome do personagem
             * @param {string} params.classe - Classe do personagem
             * @param {string} params.raca - Raça do personagem
             * @param {string} params.tema - Tema da história
             * @param {string} params.sugestao_background - Sugestão de background (ex: nobre, carpinteiro, aventureiro)
             * @param {Array} params.vantagens - Lista de vantagens do personagem
             * @param {Array} params.desvantagens - Lista de desvantagens do personagem
             * @returns {Object} Resultado da geração
             */
            gerarBackground: async ({ nome, classe, raca, tema, sugestao_background = '', vantagens = [], desvantagens = [] }) => {
                try {
                    const response = await chain.invoke({
                        nome,
                        classe,
                        raca,
                        tema,
                        sugestao_background,
                        vantagens,
                        desvantagens
                    });

                    console.log('👤 Background gerado para personagem:', nome);

                    return {
                        background: response.content.trim(),
                        nome: nome,
                        classe: classe,
                        raca: raca,
                        tema: tema,
                        sugestao_background: sugestao_background,
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