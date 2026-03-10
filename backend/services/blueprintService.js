/**
 * BlueprintService - Gera roteiros narrativos (Story Blueprints) usando Claude Sonnet 4.5
 * via API da Anthropic. O roteiro é um JSON massivo com 12 seções que guia o Mestre IA.
 */
import Anthropic from '@anthropic-ai/sdk';
import usageService from './usageService.js';

const MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = 16000;

function buildBlueprintPrompt(historia, catalogo, temasNomes) {
  const temas = temasNomes.join(', ');

  return `Você é um roteirista mestre de RPG. Crie um roteiro narrativo (Story Blueprint) COMPLETO e DETALHADO para a seguinte aventura de RPG.

## DADOS DA AVENTURA
- **Nome**: ${historia.nome}
- **Temas**: ${temas}
- **Descrição**: ${historia.descricao || 'Não fornecida'}
- **Prólogo**: ${historia.prologo || 'Não fornecido'}
- **Máximo de Participantes**: ${historia.maximo_de_participantes || 5}

## CATÁLOGO DO MUNDO (monstros, equipamentos e elementos disponíveis)
${catalogo || 'Catálogo não disponível - crie monstros e itens originais coerentes com os temas.'}

## INSTRUÇÕES
Gere um JSON com EXATAMENTE esta estrutura. Seja EXTREMAMENTE detalhado e criativo. Cada seção deve ser rica em conteúdo narrativo.

Responda APENAS com o JSON, sem markdown ou texto adicional:

{
  "sinopse": "Resumo completo da aventura em 3-5 parágrafos. Inclua o conflito central, as stakes, e o tom geral.",

  "antagonista": {
    "nome": "Nome do vilão principal",
    "titulo": "Título ou epíteto",
    "descricao": "Descrição física e psicológica detalhada",
    "motivacao": "O que o move e por quê",
    "poderes": ["lista de poderes/habilidades"],
    "fraquezas": ["vulnerabilidades que os jogadores podem explorar"],
    "conexao_com_historia": "Como ele se conecta aos temas e ao prólogo"
  },

  "arcos": [
    {
      "numero": 1,
      "titulo": "Título do arco",
      "descricao": "Descrição detalhada do arco narrativo",
      "objetivos": ["objetivos que os jogadores devem cumprir"],
      "nivel_sugerido": "1-3",
      "duracao_estimada": "2-4 sessões"
    }
  ],

  "mapaMundi": {
    "descricao_geral": "Descrição do mundo/região onde a aventura se passa",
    "regioes": [
      {
        "nome": "Nome da região",
        "descricao": "Descrição geográfica e cultural",
        "perigo": "baixo|medio|alto|extremo",
        "temas_predominantes": ["temas desta região"]
      }
    ]
  },

  "locais": [
    {
      "nome": "Nome do local",
      "tipo": "cidade|dungeon|floresta|montanha|ruina|templo|outro",
      "descricao": "Descrição atmosférica detalhada do local",
      "segredos": ["segredos escondidos neste local"],
      "monstros_comuns": ["monstros que habitam este local"],
      "arco_relacionado": 1
    }
  ],

  "npcs": [
    {
      "nome": "Nome do NPC",
      "papel": "aliado|neutro|antagonista|quest_giver|mercador|informante",
      "descricao": "Descrição física e personalidade",
      "motivacao": "O que o NPC quer",
      "local": "Onde encontrá-lo",
      "dialogo_exemplo": "Uma fala característica deste NPC",
      "segredo": "Algo que o NPC esconde"
    }
  ],

  "tesourosSegretos": [
    {
      "nome": "Nome do tesouro ou segredo",
      "tipo": "equipamento|informacao|aliado|poder|artefato",
      "descricao": "O que é e por que é valioso",
      "localizacao": "Onde está escondido",
      "condicao": "Como obtê-lo",
      "relevancia_narrativa": "Como impacta a história"
    }
  ],

  "plotTwists": [
    {
      "momento": "Quando revelar (ex: 'após completar arco 2')",
      "revelacao": "O que é revelado",
      "impacto": "Como muda a dinâmica da aventura",
      "pistas_anteriores": ["pistas sutis para semear antes da revelação"]
    }
  ],

  "encontrosChave": [
    {
      "nome": "Nome do encontro",
      "tipo": "combate|social|exploracao|puzzle|boss",
      "descricao": "Descrição detalhada do encontro",
      "monstros": ["monstros envolvidos (se combate)"],
      "dificuldade": "facil|media|dificil|letal",
      "recompensas": ["recompensas possíveis"],
      "arco_relacionado": 1
    }
  ],

  "desfechosPossiveis": [
    {
      "tipo": "vitoria_total|vitoria_parcial|derrota|agridoce|outro",
      "condicao": "Como os jogadores chegam a este desfecho",
      "descricao": "Narrativa do desfecho",
      "consequencias": "O que muda no mundo após este desfecho"
    }
  ],

  "instrucoesGeraisParaOMestre": {
    "tom_narrativo": "Orientações sobre o tom da narração",
    "ritmo": "Como gerenciar o ritmo da aventura",
    "adaptacao": "Como adaptar quando jogadores saem do roteiro",
    "temas_sensiveis": "Cuidados com temas delicados",
    "dicas_imersao": ["dicas para aumentar imersão"]
  },

  "progressao": {
    "marcos": [
      {
        "id": "marco_1",
        "descricao": "Descrição do marco narrativo",
        "arco": 1,
        "concluido": false
      }
    ],
    "arco_atual": 1,
    "porcentagem_estimada": 0
  }
}

REGRAS:
- Crie pelo menos 3 arcos narrativos
- Crie pelo menos 5 locais detalhados
- Crie pelo menos 8 NPCs variados
- Crie pelo menos 3 plot twists
- Crie pelo menos 5 encontros-chave
- Use monstros e equipamentos do catálogo quando possível (nomes EXATOS)
- Todos os elementos devem ser coerentes com os temas: ${temas}
- O roteiro deve suportar ${historia.maximo_de_participantes || 5} jogadores
- Seja criativo, surpreendente e envolvente`;
}

class BlueprintService {
  constructor() {
    this.client = null;
  }

  _getClient() {
    if (!this.client) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY não configurada. Defina a variável de ambiente.');
      }
      this.client = new Anthropic({ apiKey });
    }
    return this.client;
  }

  /**
   * Gera um roteiro narrativo completo para uma história
   * @param {Object} historia - Dados da história (nome, descricao, prologo, temas, maximo_de_participantes)
   * @param {string} catalogo - Catálogo completo de monstros/equipamentos/elementos
   * @param {string[]} temasNomes - Nomes dos temas
   * @param {number} userId - ID do usuário para tracking de usage
   * @returns {Object} JSON do roteiro com 12 seções
   */
  async gerarRoteiro(historia, catalogo, temasNomes, userId = null) {
    const client = this._getClient();
    const prompt = buildBlueprintPrompt(historia, catalogo, temasNomes);
    const startTime = Date.now();

    console.log(`📜 BlueprintService: Gerando roteiro para "${historia.nome}" com Claude Sonnet 4.5...`);

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 1,
      messages: [
        { role: 'user', content: prompt }
      ]
    });

    const content = response.content[0]?.text || '';
    const duracao = Date.now() - startTime;

    console.log(`📜 BlueprintService: Resposta recebida em ${duracao}ms (${content.length} chars)`);

    // Track usage
    if (userId) {
      try {
        usageService.track({
          userId,
          provider: 'anthropic',
          tipo: 'blueprint',
          modelo: MODEL,
          input_tokens: response.usage?.input_tokens || 0,
          output_tokens: response.usage?.output_tokens || 0,
          duracao_ms: duracao,
        });
      } catch (e) {
        // silent
      }
    }

    // Parse JSON from response
    const roteiro = this._parseRoteiro(content);
    if (!roteiro) {
      throw new Error('Falha ao parsear roteiro da IA. Resposta não é JSON válido.');
    }

    return roteiro;
  }

  _parseRoteiro(content) {
    // Try direct parse
    try {
      return JSON.parse(content);
    } catch (_) { /* continue */ }

    // Remove markdown wrappers
    const cleaned = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch (_) { /* continue */ }

    // Extract first JSON block
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (_) { /* failed */ }
    }

    return null;
  }
}

export default new BlueprintService();
