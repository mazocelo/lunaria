import { ChatGroq } from '@langchain/groq'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { RunnableSequence } from '@langchain/core/runnables'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import dotenv from 'dotenv'
import logger from '../../helpers/logger.js'

const log = logger.child({ module: 'Criador' })
import { criarGeradorPrologo } from './prologo/index.js'
import criarMestreRPG from '../Mestre/index.js'
import { extrairNomesTemas } from '../../helpers/temasHelper.js'
import { trackLLMUsage } from '../../services/llmTracker.js'

dotenv.config();

// Constantes globais
const DEFAULT_MODEL_SETTINGS = {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 8000,
    topP: 0.99,
    language: 'pt-br',
};

// Gera o modelo com detecção automática de provider (Groq ou Gemini)
function generateModel(detalhes = {}) {
    const merged = { ...DEFAULT_MODEL_SETTINGS, ...detalhes };
    const modelName = merged.model;

    if (modelName.startsWith('gemini')) {
        return new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
            model: modelName,
            temperature: merged.temperature,
            maxOutputTokens: merged.maxTokens,
        });
    }

    return new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        ...merged,
    });
}

// Cria o prompt para análise de triagem (agente original)
function createPromptTriagem() {
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

// Cria o agente Groq original para triagem
async function criadorDeHistoria() {
    try {
        const prompt = createPromptTriagem();
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
            invoke: async ({ input, userId }) => {
                const startTime = Date.now();
                const response = await chain.invoke({ input });
                trackLLMUsage(response, { modelName: DEFAULT_MODEL_SETTINGS.model, userId, startTime, agent: 'CriadorTriagem' });
                log.info({ content: response.content }, 'Resposta do auxiliar question');
                return { response: response.content };
            },
        };
    } catch (error) {
        log.error({ err: error }, 'Erro ao criar agente');
        throw new Error(`Erro ao criar agente: ${error.message}`);
    }
}

// Função principal que combina todos os agentes
async function criadorCompleto(temas = [], personagens = []) {
    try {
        // Garantir que temas sejam sempre strings (nomes)
        // Se receber objetos {id, nome}, extrai os nomes
        // Se receber strings, mantém como está
        const nomesTemas = extrairNomesTemas(temas);
        
        log.info({ temasOriginais: temas, nomesTemas }, 'Convertendo temas para nomes');
        
        // Criar os agentes separados
        const agenteHistoria = await criadorDeHistoria();
        const agentePrologo = await criarGeradorPrologo(nomesTemas);
        const agenteMestre = await criarMestreRPG(nomesTemas, personagens);

        return {
            // Agente original para perguntas
            processarPergunta: agenteHistoria.invoke,

            // Agente para gerar prólogos
            gerarPrologo: agentePrologo.gerarPrologo,
            criarHistoriaCompleta: agentePrologo.criarHistoriaCompleta,

            // Agente mestre de RPG
            mestre: {
                narrarAcao: agenteMestre.narrarAcao,
                iniciarSessao: agenteMestre.iniciarSessao,
                processarResposta: agenteMestre.processarResposta
            },

            // Função combinada que gera história completa com mestre
            criarAventuraCompleta: async ({ tema, nome, descricao, personagens, userId }) => {
                try {
                    // Gerar prólogo (tracking happens inside agent)
                    const resultadoPrologo = await agentePrologo.gerarPrologo({ temas: tema, userId });

                    // Iniciar sessão com mestre
                    const sessaoIniciada = await agenteMestre.iniciarSessao({
                        tema: tema,
                        personagens: personagens || [],
                        cenaInicial: resultadoPrologo.prologo
                    });

                    // Estrutura da aventura completa
                    const aventuraCompleta = {
                        nome: nome || `Aventura em ${tema}`,
                        tema: tema,
                        descricao: descricao || '',
                        prologo: resultadoPrologo.prologo,
                        personagens: personagens || [],
                        sessao: sessaoIniciada,
                        elementos: {
                            cenaInicial: 'Baseada no prólogo gerado',
                            npcsSugeridos: [],
                            locaisSugeridos: [],
                            conflitosSugeridos: []
                        },
                        metadata: {
                            geradoEm: resultadoPrologo.timestamp,
                            modelo: DEFAULT_MODEL_SETTINGS.model,
                            versao: '2.0',
                            temasUtilizados: temas,
                            agentes: ['GeradorPrologo', 'MestreRPG']
                        }
                    };

                    log.info({ nome: aventuraCompleta.nome }, 'Aventura completa criada');
                    return aventuraCompleta;

                } catch (error) {
                    log.error({ err: error }, 'Erro ao criar aventura completa');
                    throw error;
                }
            }
        };
    } catch (error) {
        log.error({ err: error }, 'Erro ao criar criador completo');
        throw new Error(`Erro ao criar criador completo: ${error.message}`);
    }
}

export default criadorCompleto;
export { criarGeradorPrologo, criarMestreRPG };