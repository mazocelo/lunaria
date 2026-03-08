import { RunnableSequence } from '@langchain/core/runnables';
import { createValidacaoModel } from './model.js';
import { createValidacaoPrompt } from './prompts.js';

/**
 * Cria o agente para validação de coerência de personagens
 * @returns {Object} Objeto com método para validar personagem
 */
async function criarValidadorPersonagem() {
    try {
        const prompt = createValidacaoPrompt();
        const model = createValidacaoModel();

        const chain = RunnableSequence.from([prompt, model]);

        return {
            /**
             * Valida coerência narrativa de um personagem
             * @param {Object} params - Dados completos do personagem
             * @returns {{ valido: boolean, avisos: string[], sugestoes: string[] }}
             */
            validar: async ({
                nome, classe, raca, nivel = 1,
                forca = 10, inteligencia = 10, carisma = 10,
                destreza = 10, constituicao = 10, agilidade = 10,
                vantagens = '', desvantagens = '', equipamentos = '',
                background = ''
            }) => {
                try {
                    const response = await chain.invoke({
                        nome,
                        classe,
                        raca,
                        nivel: String(nivel),
                        forca: String(forca),
                        inteligencia: String(inteligencia),
                        carisma: String(carisma),
                        destreza: String(destreza),
                        constituicao: String(constituicao),
                        agilidade: String(agilidade),
                        vantagens,
                        desvantagens,
                        equipamentos,
                        background: background || 'Ainda não definido'
                    });

                    // Parsear JSON da resposta
                    const content = response.content.trim();
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (!jsonMatch) {
                        console.warn('⚠️ Resposta da IA não é JSON válido:', content);
                        return { valido: true, avisos: [], sugestoes: [] };
                    }

                    const resultado = JSON.parse(jsonMatch[0]);
                    console.log('🔍 Validação de coerência concluída para:', nome);

                    return {
                        valido: resultado.valido !== false,
                        avisos: Array.isArray(resultado.avisos) ? resultado.avisos.slice(0, 3) : [],
                        sugestoes: Array.isArray(resultado.sugestoes) ? resultado.sugestoes.slice(0, 3) : []
                    };
                } catch (error) {
                    console.error('❌ Erro ao validar personagem:', error);
                    // Em caso de erro, não bloqueia - retorna válido
                    return { valido: true, avisos: [], sugestoes: ['Não foi possível validar coerência no momento.'] };
                }
            }
        };
    } catch (error) {
        console.error('❌ Erro ao criar validador de personagem:', error.message);
        throw new Error(`Erro ao criar validador de personagem: ${error.message}`);
    }
}

export default criarValidadorPersonagem;
