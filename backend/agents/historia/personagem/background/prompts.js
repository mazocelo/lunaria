import { ChatPromptTemplate } from '@langchain/core/prompts';

/**
 * Cria o contexto de temas disponíveis para background
 */
function createTemasContext(temas = []) {
    if (!temas || temas.length === 0) return '';
    return `\nTEMAS DO UNIVERSO: ${temas.join(', ')}\nCrie um background coerente com estes temas.\n`;
}

/**
 * Cria o prompt para geração de background de personagem
 */
export function createBackgroundPrompt(temas = []) {
    const temasContexto = createTemasContext(temas);

    const systemPrompt = `Você é um especialista em criar backgrounds ricos para personagens de RPG. Gere um background baseado em TODOS os dados da ficha.

INSTRUÇÕES:
- 2-4 parágrafos, descritivo e narrativo
- Consistente com TODAS as características: classe, raça, vantagens, desvantagens, atributos, equipamentos
- Português brasileiro. Responda APENAS com o background
${temasContexto}
COMO USAR OS DADOS:
- Atributos ALTOS (15+): características marcantes (FOR 18 = fisicamente imponente)
- Atributos BAIXOS (7-): limitações ou desafios (INT 5 = simples de mente)
- Nível: experiência (Nv1 = novato, Nv10+ = veterano)
- Vantagens: habilidades positivas — explique COMO foram adquiridas
- Desvantagens: limitações que moldaram a história do personagem
- Equipamentos notáveis: mencione naturalmente, conte brevemente como foram obtidos
- Sugestão de background: use como base para origem/profissão. Se vazia, crie livremente

ESTRUTURA:
1. Origem, raça e contexto familiar
2. Eventos marcantes e como vantagens/desvantagens se desenvolveram
3. Treinamento da classe, equipamentos importantes e motivações
4. (Opcional) Objetivos e aspirações atuais`;

    return ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', `Nome: {nome}
Classe: {classe}
Raça: {raca}
Nível: {nivel}
Atributos: FOR {forca} | INT {inteligencia} | CAR {carisma} | DES {destreza} | CON {constituicao} | AGI {agilidade}
Tema da história: {tema}
Sugestão de background: {sugestao_background}
Vantagens: {vantagens}
Desvantagens: {desvantagens}
Equipamentos: {equipamentos}`],
    ]);
}
