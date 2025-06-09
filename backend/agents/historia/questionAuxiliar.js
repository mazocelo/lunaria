const { ChatGroq } = require('@langchain/groq');
const { RunnableSequence } = require('@langchain/core/runnables');
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');
const dotenv = require('dotenv');

dotenv.config();

// Constantes globais
const DEFAULT_MODEL_SETTINGS = {
    model: 'gemma2-9b-it',
    temperature: 0.0,
    maxTokens: 8000,
    topP: 0.99,
    language: 'pt-br',
};

// Gera o modelo da Groq
function generateModel(detalhes = {}) {
    return new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        ...DEFAULT_MODEL_SETTINGS,
        ...detalhes,
    });
}

// Cria o prompt para análise de triagem
function createPrompt() {
    const systemPrompt = `
        O usuários esta fazendo uma pergunta, 
        re-formule com base na tentativa de pergunta.
        Responda em Plain Text, sem formatação, sem HTML, Markdown ou qualquer outra formatação.
        APENAS TEXTO PLANO.
        Devolva somente uma pergunta.
        `;

    return ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        new MessagesPlaceholder('chat_history'),
        ['human', '{input}'],
    ]);
}

// Cria o agente Groq
async function questionAuxiliarCreate() {
    try {
        const prompt = createPrompt();
        const model = generateModel();

        const chain = RunnableSequence.from([
            {
                input: (input) => input.input,
                chat_history: async () => {
                    return [];
                },
            },
            prompt,
            model,
        ]);
        return {
            invoke: async ({ input }) => {
                const response = await chain.invoke({ input });
                console.log('Resposta do auxiliar question', response.content);
                return { response: response.content };
            },
        };
    } catch (error) {
        console.error('Erro ao criar agente:', error.message);
        throw new Error(`Erro ao criar agente: ${error.message}`);
    }
}

module.exports = { questionAuxiliarCreate };