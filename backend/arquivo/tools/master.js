import { ChatGroq } from '@langchain/groq';
import { ConversationChain } from 'langchain/chains';
import { BufferMemory } from 'langchain/memory';
import {
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate
} from '@langchain/core/prompts';
import dotenv from 'dotenv';
dotenv.config();


async function createExecutor() {
    let master = null;
    const model = new ChatGroq({
        model: 'llama3-70b-8192',
        temperature: 0.7,
        apiKey: process.env.GROQ_API_KEY,
    });

    const memory = new BufferMemory({
        returnMessages: true,
        memoryKey: 'history',
    });

    const prompt = await ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(
            `Você é um mestre de RPG. Narre a aventura, descreva cenários com riqueza de detalhes, 
      interprete NPCs, proponha desafios e reaja às ações dos jogadores com criatividade e emoção.
      Sempre observe o histórico de mensagens para manter a continuidade da narrativa.
      Responda apenas com a narrativa, sem incluir informações adicionais ou perguntas.`
        ),
        HumanMessagePromptTemplate.fromTemplate(`{input}`),
    ]);

    master = new ConversationChain({
        llm: model,
        prompt,
        memory,
        verbose: true,
    });
    return master;
}



export { createExecutor }