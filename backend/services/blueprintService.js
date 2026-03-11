/**
 * BlueprintService - Gera roteiros narrativos (Story Blueprints) usando Claude Sonnet 4.5
 * via API da Anthropic. O roteiro é um JSON massivo com 12 seções que guia o Mestre IA.
 */
import Anthropic from '@anthropic-ai/sdk';
import usageService from './usageService.js';

const MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = 8000;
const TIMEOUT_MS = 180000; // 180s timeout para geração de roteiro

function buildBlueprintPrompt(historia, catalogo, temasNomes) {
  const temas = temasNomes.join(', ');

  return `Você é um roteirista de RPG. Crie um roteiro narrativo (Story Blueprint) para esta aventura.

## AVENTURA
Nome: ${historia.nome} | Temas: ${temas} | Jogadores: ${historia.maximo_de_participantes || 5}
Descrição: ${historia.descricao || 'Não fornecida'}
Prólogo: ${historia.prologo || 'Não fornecido'}

## CATÁLOGO (monstros e equipamentos disponíveis)
${catalogo || 'Crie monstros e itens originais coerentes com os temas.'}

## INSTRUÇÕES
Responda APENAS com JSON válido (sem markdown). Seja conciso mas criativo. Estrutura EXATA:

{"sinopse":"Resumo da aventura (2-3 parágrafos)","antagonista":{"nome":"","titulo":"","descricao":"descrição breve","motivacao":"","poderes":[""],"fraquezas":[""],"conexao_com_historia":""},"arcos":[{"numero":1,"titulo":"","descricao":"breve","objetivos":[""],"nivel_sugerido":"1-3"}],"mapaMundi":{"descricao_geral":"descrição do mundo","regioes":[{"nome":"","descricao":"breve","perigo":"baixo|medio|alto|extremo"}]},"locais":[{"nome":"","tipo":"cidade|dungeon|floresta|montanha|ruina|templo|outro","descricao":"1-2 frases","segredos":[""],"monstros_comuns":[""],"arco_relacionado":1}],"npcs":[{"nome":"","papel":"aliado|neutro|antagonista|quest_giver|mercador|informante","descricao":"1 frase","motivacao":"","local":"","segredo":""}],"tesourosSegretos":[{"nome":"","tipo":"equipamento|informacao|artefato","descricao":"","localizacao":"","condicao":""}],"plotTwists":[{"momento":"","revelacao":"","impacto":""}],"encontrosChave":[{"nome":"","tipo":"combate|social|exploracao|puzzle|boss","descricao":"1-2 frases","monstros":[""],"dificuldade":"facil|media|dificil|letal","recompensas":[""],"arco_relacionado":1}],"desfechosPossiveis":[{"tipo":"vitoria_total|vitoria_parcial|derrota|agridoce","condicao":"","descricao":"1-2 frases"}],"instrucoesGeraisParaOMestre":{"tom_narrativo":"","ritmo":"","adaptacao":"","dicas_imersao":[""]},"progressao":{"marcos":[{"id":"marco_1","descricao":"","arco":1,"concluido":false}],"arco_atual":1,"porcentagem_estimada":0}}

REGRAS: Crie 3 arcos, 4 locais, 5 NPCs, 2 plot twists, 4 encontros-chave. Use nomes do catálogo quando possível. Seja coerente com os temas: ${temas}.`;
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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response;
    try {
      response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: 1,
        messages: [
          { role: 'user', content: prompt }
        ]
      }, { signal: controller.signal });
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError' || controller.signal.aborted) {
        throw new Error(`Timeout: geração de roteiro excedeu ${TIMEOUT_MS / 1000}s`);
      }
      throw err;
    }
    clearTimeout(timeout);

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
