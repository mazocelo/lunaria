import { ChatPromptTemplate } from '@langchain/core/prompts';

/**
 * Cria o contexto de temas disponíveis
 * @param {Array} temas - Lista de temas disponíveis
 * @returns {string} Contexto formatado dos temas
 */
function createTemasContext(temas = []) {
    if (!temas || temas.length === 0) {
        return '';
    }

    return `
    TEMAS DISPONÍVEIS PARA INSPIRAÇÃO:
    ${temas.map((tema, index) => `${index + 1}. ${tema}`).join('\n')}
    
    Use estes temas como referência para criar um prólogo rico e diversificado.
    `;
}

/**
 * Cria o prompt para geração de prólogo
 * @param {Array} temas - Lista de temas disponíveis
 * @returns {ChatPromptTemplate} Template do prompt
 */
export function createPrologoPrompt(temas = []) {
    const temasContexto = createTemasContext(temas);

    const systemPrompt = `
        Você é um mestre de RPG experiente e criativo. Sua tarefa é criar um prólogo envolvente para uma história de RPG baseada no tema fornecido.

        INSTRUÇÕES:
        - Crie um prólogo de 3-4 parágrafos
        - Use linguagem descritiva e atmosférica
        - Inclua elementos que despertem a curiosidade dos jogadores
        - Mantenha um tom adequado ao tema (fantasia, sci-fi, horror, etc.)
        - Evite revelar muito sobre a trama principal
        - Crie um gancho narrativo que incentive os jogadores a explorar
        - Use português brasileiro
        - Responda APENAS com o prólogo, sem formatação adicional
        ${temasContexto}

        ESTRUTURA SUGERIDA:
        1. Primeiro parágrafo: Contexto geral e atmosfera
        2. Segundo parágrafo: Introdução de elementos misteriosos ou conflitos
        3. Terceiro parágrafo: Gancho narrativo para os jogadores
        4. Quarto parágrafo (opcional): Dica sobre o que os jogadores podem esperar

        EXEMPLO DE TEMA: "Fantasia Medieval - Uma cidade portuária amaldiçoada"
        EXEMPLO DE PRÓLOGO:
        "Nas margens do Mar de Esmeraldas, ergue-se a antiga cidade de Porto Negro, suas torres de pedra negra se estendendo contra o horizonte como dedos ossudos apontando para o céu. Fundada há séculos pelos navegadores do Império de Valyria, a cidade já foi o centro do comércio marítimo, suas docas repletas de navios carregados de especiarias, sedas e ouro. Mas aqueles dias de glória se foram, substituídos por uma maldição que assombra as ruas estreitas e os becos escuros.

        Dizem que a maldição começou quando o último rei de Porto Negro, o orgulhoso Alaric o Conquistador, desafiou os deuses do mar ao construir sua fortaleza sobre as ruínas de um templo antigo. Os pescadores juram que ainda podem ouvir os lamentos dos marinheiros perdidos ecoando pelas noites de lua cheia, e os comerciantes evitam as docas ao anoitecer, temendo o que pode emergir das águas escuras.

        Agora, uma nova ameaça se aproxima. Navios mercantes desaparecem sem deixar rastro, e os poucos sobreviventes que retornam falam de criaturas que se movem nas sombras e de uma névoa que não se dissipa. O Conselho dos Mercadores, desesperado por uma solução, oferece uma recompensa generosa para qualquer grupo de aventureiros corajosos o suficiente para investigar os mistérios de Porto Negro.

        Como heróis destemidos, vocês foram convocados para desvendar os segredos da cidade amaldiçoada. Mas cuidado, pois nem tudo é o que parece em Porto Negro, e alguns segredos são melhor deixados no fundo do mar..."
        `;

    return ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', 'Tema da história: {tema}'],
    ]);
}

/**
 * Cria o prompt para geração de história completa
 * @param {Array} temas - Lista de temas disponíveis
 * @returns {ChatPromptTemplate} Template do prompt
 */
export function createHistoriaCompletaPrompt(temas = []) {
    const temasContexto = createTemasContext(temas);

    const systemPrompt = `
        Você é um mestre de RPG experiente. Sua tarefa é criar uma história completa baseada no tema fornecido.

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
        - Elementos narrativos principais
        `;

    return ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', 'Tema da história: {tema}'],
    ]);
} 