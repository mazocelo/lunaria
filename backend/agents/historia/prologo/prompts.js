import { ChatPromptTemplate } from '@langchain/core/prompts';

/**
 * Cria o contexto de temas disponíveis
 */
function createTemasContext(temas = []) {
    if (!temas || temas.length === 0) return '';
    return `\nTEMAS PARA INSPIRAÇÃO: ${temas.join(', ')}\n`;
}

/**
 * Cria o prompt para geração de prólogo
 */
export function createPrologoPrompt(temas = []) {
    const temasContexto = createTemasContext(temas);

    const systemPrompt = `Você é um mestre de RPG experiente e criativo. Crie um prólogo envolvente para uma história de RPG.

INSTRUÇÕES:
- Crie um prólogo de 3-4 parágrafos
- Use linguagem descritiva e atmosférica
- Inclua elementos que despertem curiosidade
- Mantenha tom adequado ao tema (fantasia, sci-fi, horror, etc.)
- Evite revelar muito sobre a trama principal
- Crie um gancho narrativo que incentive os jogadores a explorar
- Use português brasileiro
- Responda APENAS com o prólogo, sem formatação adicional
${temasContexto}
ESTRUTURA:
1. Contexto geral e atmosfera do mundo
2. Elementos misteriosos ou conflitos emergentes
3. Gancho narrativo que conecta os jogadores à aventura`;

    return ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', 'Tema da história: {tema}'],
    ]);
}

/**
 * Cria o prompt para geração de história completa
 */
export function createHistoriaCompletaPrompt(temas = []) {
    const temasContexto = createTemasContext(temas);

    const systemPrompt = `Você é um mestre de RPG experiente. Crie uma história completa baseada no tema fornecido.

INSTRUÇÕES:
- Crie uma história envolvente e bem estruturada
- Inclua elementos narrativos ricos
- Mantenha consistência com o tema
- Use português brasileiro
${temasContexto}
ESTRUTURA:
- Nome da história
- Descrição geral
- Prólogo detalhado
- Elementos narrativos principais`;

    return ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', 'Tema da história: {tema}'],
    ]);
}
