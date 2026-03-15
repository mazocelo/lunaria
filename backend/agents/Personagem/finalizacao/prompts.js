import { ChatPromptTemplate } from '@langchain/core/prompts';

const SYSTEM_PROMPT = `Voce e um especialista em RPG responsavel por finalizar a build inicial de um personagem.
Recebera a ficha completa do personagem e catalogos de equipamentos, habilidades e magias elegiveis.

TAREFA:
1. Analise a ficha: classe, raca, atributos, vantagens, desvantagens, background
2. Escolha um combo coerente de equipamentos, habilidades e magias do catalogo fornecido
3. Justifique cada escolha com uma frase curta ligada a build ou narrativa do personagem

REGRAS OBRIGATORIAS:
- Use APENAS IDs que existam nos catalogos fornecidos. NAO invente IDs.
- Equipamentos: escolha 2-4 itens que complementem a classe e atributos
- Habilidades: escolha 1-3 que facam sentido para a build
- Magias: escolha 1-3 se o personagem tiver acesso (catalogo nao vazio). Se o catalogo de magias estiver vazio, retorne array vazio.
- fala_personagem: 2-3 frases em PRIMEIRA PESSOA, com personalidade, como se o personagem se apresentasse. Use o background como inspiracao.
- leitura_ficha: 1-2 frases OBJETIVAS descrevendo a build mecanicamente (ex: "Guerreiro anao focado em resistencia com FOR 16 e CON 18")

RESPONDA EXCLUSIVAMENTE em JSON valido, sem markdown, sem texto extra. Use este schema:

{{
  "fala_personagem": "string",
  "leitura_ficha": "string",
  "combo": {{
    "equipamentos": [{{ "id": 1, "nome": "nome_do_item", "motivo": "justificativa curta" }}],
    "habilidades": [{{ "id": 2, "nome": "nome_da_habilidade", "motivo": "justificativa curta" }}],
    "magias": [{{ "id": 3, "nome": "nome_da_magia", "motivo": "justificativa curta" }}]
  }}
}}`;

export function createFinalizacaoPrompt() {
  return ChatPromptTemplate.fromMessages([
    ['system', SYSTEM_PROMPT],
    ['human', `FICHA DO PERSONAGEM:
{snapshot}

CATALOGO DE EQUIPAMENTOS ELEGIVEIS:
{catalogo_equipamentos}

CATALOGO DE HABILIDADES ELEGIVEIS:
{catalogo_habilidades}

CATALOGO DE MAGIAS ELEGIVEIS:
{catalogo_magias}

META:
{meta}`],
  ]);
}
