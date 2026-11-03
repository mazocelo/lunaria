import { ChatPromptTemplate } from '@langchain/core/prompts';

/**
 * Cria o prompt para validação de coerência do personagem
 * @returns {ChatPromptTemplate} Template do prompt
 */
export function createValidacaoPrompt() {
    const systemPrompt = `Você é um especialista em RPG que analisa fichas de personagens para verificar coerência narrativa e temática. Sua tarefa é identificar inconsistências e sugerir melhorias.

REGRAS:
- Analise se os atributos fazem sentido para a classe escolhida
- Verifique se vantagens e desvantagens são coerentes entre si
- Avalie se o background (se fornecido) combina com raça, classe e características
- Verifique se equipamentos fazem sentido para a classe/raça
- NÃO valide regras mecânicas (pontos, custos) - isso já é feito pelo sistema
- Foque APENAS em coerência narrativa e temática

CLASSIFICAÇÃO:
- avisos: problemas que tornam o personagem incoerente ou contraditório
- sugestoes: dicas para tornar o personagem mais interessante ou coerente

RESPONDA APENAS com JSON válido no formato:
{
  "valido": true/false,
  "avisos": ["aviso 1", "aviso 2"],
  "sugestoes": ["sugestao 1", "sugestao 2"]
}

- "valido" = false apenas se houver contradições graves (ex: cego com "Visão Aguçada")
- Máximo 3 avisos e 3 sugestões
- Use português brasileiro
- Seja conciso nas mensagens`;

    return ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', `FICHA DO PERSONAGEM:
Nome: {nome}
Raça: {raca}
Classe: {classe}
Nível: {nivel}

Atributos:
- Força: {forca}
- Inteligência: {inteligencia}
- Carisma: {carisma}
- Destreza: {destreza}
- Constituição: {constituicao}
- Agilidade: {agilidade}

Vantagens: {vantagens}
Desvantagens: {desvantagens}
Equipamentos: {equipamentos}
Background: {background}`],
    ]);
}
