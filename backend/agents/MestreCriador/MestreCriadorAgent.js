/**
 * MestreCriadorAgent — Agente de IA para o wizard de criação de personagem
 *
 * Design stateless: recebe estado completo a cada request, sem sessão no servidor.
 * Segue o padrão do MestreAgent (LangChain + Groq/Gemini/Anthropic).
 */
import { ChatGroq } from '@langchain/groq';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatAnthropic } from '@langchain/anthropic';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import dotenv from 'dotenv';

import { CRIADOR_CONFIG, detectProvider, ETAPAS, TRANSICOES } from './config.js';
import { DEPRECATED_MODELS } from '../Mestre/config.js';
import { isEnabled } from '../../config/featureFlags.js';
import usageService from '../../services/usageService.js';
import { criarPromptSistemaCriador } from './prompts/sistema.js';
import { buildCatalogoCriacao } from './catalogo/catalogoCriacao.js';

dotenv.config();

// Timeout wrapper
function withTimeout(promise, ms = CRIADOR_CONFIG.model.timeout) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT')), ms))
  ]);
}

// Retry controlado por feature flag
async function withRetry(fn, retries) {
  if (retries === undefined) retries = isEnabled('AI_RETRY') ? 1 : 0;
  try {
    return await fn();
  } catch (error) {
    if (error.message === 'AI_TIMEOUT' && retries > 0) {
      console.warn('⚠️ MestreCriador: AI timeout, retrying...');
      return withRetry(fn, retries - 1);
    }
    throw error;
  }
}

/** Parse robusto de JSON da IA */
function parseIAJson(content) {
  try { return JSON.parse(content); } catch (_) { /* continue */ }
  const cleaned = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  try { return JSON.parse(cleaned); } catch (_) { /* continue */ }
  const match = content.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch (_) { /* failed */ }
  }
  return null;
}

/** Track token usage */
function trackUsage(response, modelName, userId, startTime) {
  if (!userId) return;
  try {
    const tokenUsage = response?.response_metadata?.token_usage || response?.usage_metadata || {};
    const input_tokens = tokenUsage.prompt_tokens || tokenUsage.input_tokens || 0;
    const output_tokens = tokenUsage.completion_tokens || tokenUsage.output_tokens || 0;
    const provider = detectProvider(modelName);
    usageService.track({
      userId,
      provider,
      tipo: 'text',
      modelo: modelName,
      input_tokens,
      output_tokens,
      duracao_ms: startTime ? Date.now() - startTime : null,
    });
  } catch (_) { /* silent */ }
}

/**
 * Converte histórico de chat do frontend para mensagens LangChain
 */
function converterHistorico(historico) {
  if (!Array.isArray(historico)) return [];
  return historico.map(msg => {
    if (msg.role === 'user' || msg.tipo === 'jogador') {
      return new HumanMessage(msg.content || msg.texto || '');
    }
    return new AIMessage(msg.content || msg.texto || '');
  });
}

/**
 * Constrói o input contextual para a IA baseado na etapa e estado do wizard
 */
function construirInput(etapa, estado, mensagemJogador) {
  const parts = [`[ETAPA ATUAL: ${etapa}]`];

  // Contexto do personagem construído até agora
  if (estado.nome) parts.push(`Nome do personagem: ${estado.nome}`);
  if (estado.raca_nome) parts.push(`Raça escolhida: ${estado.raca_nome} (ID:${estado.raca_id})`);
  if (estado.classe_nome) parts.push(`Classe escolhida: ${estado.classe_nome} (ID:${estado.classe_id})`);
  if (estado.background) parts.push(`Background: ${estado.background}`);
  if (estado.vantagens_nomes?.length) parts.push(`Vantagens: ${estado.vantagens_nomes.join(', ')}`);
  if (estado.desvantagens_nomes?.length) parts.push(`Desvantagens: ${estado.desvantagens_nomes.join(', ')}`);
  if (estado.atributos) {
    const attrs = estado.atributos;
    parts.push(`Atributos: FOR:${attrs.forca} DES:${attrs.destreza} CON:${attrs.constituicao} INT:${attrs.inteligencia} AGI:${attrs.agilidade} CAR:${attrs.carisma}`);
  }

  parts.push(`\nMensagem do jogador: ${mensagemJogador}`);
  return parts.join('\n');
}

// Singleton: modelo + chain (reutilizado entre requests)
let _chain = null;
let _modelName = null;

async function getChain() {
  if (_chain) return { chain: _chain, modelName: _modelName };

  const catalogo = await buildCatalogoCriacao();
  let modelName = CRIADOR_CONFIG.model.name;
  const temperature = Math.min(2, Math.max(0, CRIADOR_CONFIG.model.temperature));
  const maxTokens = Math.min(32000, Math.max(100, CRIADOR_CONFIG.model.maxTokens));

  // Fallback de modelos deprecados
  if (DEPRECATED_MODELS[modelName]) {
    modelName = DEPRECATED_MODELS[modelName];
  }

  _modelName = modelName;

  // Criar modelo baseado no provider
  const provider = detectProvider(modelName);
  let model;
  if (provider === 'gemini') {
    model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: modelName,
      temperature,
      maxOutputTokens: maxTokens,
    });
  } else if (provider === 'anthropic') {
    model = new ChatAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: modelName,
      temperature,
      maxTokens,
    });
  } else {
    model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: modelName,
      temperature,
      maxTokens,
    });
  }

  const promptSistema = criarPromptSistemaCriador(catalogo);
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', promptSistema],
    new MessagesPlaceholder('chat_history'),
    ['human', '{input}'],
  ]);

  _chain = RunnableSequence.from([
    {
      input: (input) => input.input,
      chat_history: (input) => input.chat_history || [],
    },
    prompt,
    model,
  ]);

  console.log(`✅ MestreCriador: Chain inicializada (${provider}/${modelName})`);
  return { chain: _chain, modelName: _modelName };
}

/** Invalida chain cached (ex: se catálogo mudou) */
export function invalidarChain() {
  _chain = null;
  _modelName = null;
}

/**
 * Processa uma interação do wizard
 *
 * @param {Object} params
 * @param {string} params.etapa - Etapa atual do wizard
 * @param {Object} params.estado - Estado completo do personagem em construção
 * @param {string} params.mensagemJogador - Mensagem enviada pelo jogador
 * @param {Array} params.historico - Histórico de mensagens do chat
 * @param {number} params.userId - ID do usuário (para tracking)
 * @returns {Object} { mensagem, sugestoes, etapa_proxima, atributos_sugeridos }
 */
export async function interagir({ etapa, estado, mensagemJogador, historico = [], userId }) {
  const startTime = Date.now();

  // Validar etapa
  if (!ETAPAS.includes(etapa) && etapa !== 'confirmado') {
    throw new Error(`Etapa inválida: ${etapa}`);
  }

  try {
    const { chain, modelName } = await getChain();

    const input = construirInput(etapa, estado, mensagemJogador);
    const chatHistory = converterHistorico(historico).slice(-20); // limitar histórico

    const response = await withRetry(() => withTimeout(chain.invoke({
      input,
      chat_history: chatHistory,
    })));

    trackUsage(response, modelName, userId, startTime);

    // Parse da resposta
    let resultado = parseIAJson(response.content);
    if (!resultado) {
      // Fallback: usar texto bruto como mensagem
      resultado = {
        mensagem: response.content,
        sugestoes: [],
        etapa_proxima: TRANSICOES[etapa]?.[0] || etapa,
        atributos_sugeridos: null,
      };
    }

    // Validar etapa_proxima
    const transicoesValidas = TRANSICOES[etapa] || [];
    if (!transicoesValidas.includes(resultado.etapa_proxima) && resultado.etapa_proxima !== 'confirmado') {
      resultado.etapa_proxima = transicoesValidas[0] || etapa;
    }

    return {
      mensagem: resultado.mensagem || '',
      sugestoes: Array.isArray(resultado.sugestoes) ? resultado.sugestoes : [],
      etapa_proxima: resultado.etapa_proxima,
      atributos_sugeridos: resultado.atributos_sugeridos || null,
    };
  } catch (error) {
    console.error('MestreCriador: Erro na interação:', error.message);

    // Fallback graceful
    const fallbacks = {
      boas_vindas: 'Bem-vindo, aventureiro! Como deseja ser chamado neste mundo?',
      raca: 'Agora, qual será sua raça? Escolha entre as opções disponíveis.',
      classe: 'E qual será sua vocação? Escolha uma classe que combine com seu espírito.',
      background: 'Conte-me sobre sua história. De onde você vem? O que o trouxe até aqui?',
      vantagens: 'Quais talentos especiais marcam sua jornada? Escolha suas vantagens.',
      desvantagens: 'Todo herói tem suas fraquezas. Quais são as suas?',
      atributos: 'Distribua seus 75 pontos entre os atributos.',
      resumo: 'Seu personagem está quase pronto! Revise os detalhes.',
      refinamento: 'Deseja ajustar algo antes de finalizar?',
    };

    return {
      mensagem: fallbacks[etapa] || 'Ocorreu um erro. Tente novamente.',
      sugestoes: [],
      etapa_proxima: TRANSICOES[etapa]?.[0] || etapa,
      atributos_sugeridos: null,
    };
  }
}
