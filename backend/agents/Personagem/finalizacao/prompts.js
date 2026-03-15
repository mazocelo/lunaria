import { ChatPromptTemplate } from '@langchain/core/prompts';

const SYSTEM_PROMPT = `Voce e um especialista em RPG responsavel por fechar a leitura final de uma build.
Recebera a ficha completa do personagem, os catalogos elegiveis e a politica obrigatoria do combo.

TAREFA:
1. Analise a ficha: classe, raca, atributos, vantagens, desvantagens, background
2. Monte um combo coerente usando APENAS os catalogos fornecidos
3. Escreva uma fala_personagem em primeira pessoa e uma leitura_ficha objetiva

REGRAS OBRIGATORIAS:
- Use APENAS IDs que existam nos catalogos fornecidos. NAO invente IDs.
- Respeite a politica do combo informada em META.
- Nao ultrapasse os limites de equipamentos, slots taticos e itens totais.
- Equipamentos devem complementar o papel principal da build.
- Slots taticos sao preenchidos por habilidades e magias.
- fala_personagem: 3-4 frases em PRIMEIRA PESSOA, com personalidade, passado e postura. Entregue algo entre 35 e 70 palavras.
- EVITE respostas curtas e genericas como "Sou X, Y. Pronto para a aventura."
- leitura_ficha: 1-2 frases objetivas descrevendo a build mecanicamente.

RESPONDA EXCLUSIVAMENTE em JSON valido, sem markdown, sem texto extra. Use este schema:

{
  "fala_personagem": "string",
  "leitura_ficha": "string",
  "combo": {
    "equipamentos": [{ "id": 1, "nome": "nome_do_item", "motivo": "justificativa curta" }],
    "habilidades": [{ "id": 2, "nome": "nome_da_habilidade", "motivo": "justificativa curta" }],
    "magias": [{ "id": 3, "nome": "nome_da_magia", "motivo": "justificativa curta" }]
  }
}`;

const REGEN_SYSTEM_PROMPT = `Voce e um especialista em RPG responsavel por regenerar uma leitura final de build.

TAREFA:
1. Gerar uma nova fala_personagem
2. Gerar uma nova leitura_ficha
3. Variar o combo inteiro (equipamentos, habilidades e magias) mantendo coerencia com a ficha

REGRAS OBRIGATORIAS:
- Use APENAS IDs que existam nos catalogos fornecidos. NAO invente IDs.
- Respeite a politica do combo informada em META.
- Esta e a tentativa {tentativa} de 3. Varie de forma perceptivel em relacao ao combo anterior.
- Combo anterior: {combo_anterior}
- Nao ultrapasse os limites de equipamentos, slots taticos e itens totais.
- fala_personagem e leitura_ficha tambem devem variar, mas sem perder coerencia com a build.
- EVITE repetir integralmente o combo anterior.

RESPONDA EXCLUSIVAMENTE em JSON valido, sem markdown, sem texto extra. Use este schema:

{
  "fala_personagem": "string",
  "leitura_ficha": "string",
  "combo": {
    "equipamentos": [{ "id": 1, "nome": "nome_do_item", "motivo": "justificativa curta" }],
    "habilidades": [{ "id": 2, "nome": "nome_da_habilidade", "motivo": "justificativa curta" }],
    "magias": [{ "id": 3, "nome": "nome_da_magia", "motivo": "justificativa curta" }]
  }
}`;

const REGEN_EQUIP_SYSTEM = `Voce e um especialista em RPG. Sua tarefa e gerar um combo DIFERENTE de equipamentos para o personagem.

REGRAS OBRIGATORIAS:
- Use APENAS IDs que existam no catalogo fornecido. NAO invente IDs.
- Escolha 2-4 equipamentos que complementem a classe e atributos do personagem.
- Justifique cada escolha com uma frase curta ligada a build ou narrativa.
- Esta e a tentativa {tentativa} de 3. Varie significativamente as escolhas em relacao as anteriores.
- Equipamentos da sugestao anterior (evite repetir todos): {equipamentos_anteriores}
- Tente explorar combinacoes diferentes: outros tipos de arma, armadura ou acessorio.

RESPONDA EXCLUSIVAMENTE em JSON valido, sem markdown, sem texto extra:
{ "equipamentos": [{ "id": 1, "nome": "nome_do_item", "motivo": "justificativa curta" }] }`;

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

export function createRegeneracaoComboPrompt() {
  return ChatPromptTemplate.fromMessages([
    ['system', REGEN_SYSTEM_PROMPT],
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

export function createRegeneracaoEquipamentosPrompt() {
  return ChatPromptTemplate.fromMessages([
    ['system', REGEN_EQUIP_SYSTEM],
    ['human', `FICHA DO PERSONAGEM:
{snapshot}

CATALOGO DE EQUIPAMENTOS ELEGIVEIS:
{catalogo_equipamentos}

META:
{meta}`],
  ]);
}
