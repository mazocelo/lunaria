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
import { buildCatalogoCriacao, fetchData as fetchCatalogo } from './catalogo/catalogoCriacao.js';

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
  console.warn('⚠️ MestreCriador: JSON parse falhou. Conteúdo bruto:', content.substring(0, 300));
  return null;
}

// Etapas que DEVEM ter sugestões
const ETAPAS_COM_SUGESTOES = ['boas_vindas', 'raca', 'classe', 'background', 'vantagens', 'desvantagens'];

/** Gera sugestões fallback do catálogo quando IA retorna vazio */
async function gerarFallbackSugestoes(etapa, estado) {
  try {
    const { racas, classes, vantagens, desvantagens } = await fetchCatalogo();

    if (etapa === 'raca') {
      const shuffled = [...racas].sort(() => Math.random() - 0.5).slice(0, 5);
      return shuffled.map(r => ({
        tipo: 'raca', id: r.id, nome: r.nome,
        descricao: r.descricao?.slice(0, 80) || '', custo: r.custo ?? 0,
      }));
    }

    if (etapa === 'classe') {
      const shuffled = [...classes].sort(() => Math.random() - 0.5).slice(0, 4);
      return shuffled.map(c => ({
        tipo: 'classe', id: c.id, nome: c.nome,
        descricao: c.descricao?.slice(0, 80) || '', custo: c.custo ?? 0,
      }));
    }

    if (etapa === 'vantagens') {
      const compraveis = vantagens.filter(v => v.custo > 0 || v.compravel !== false);
      const shuffled = [...compraveis].sort(() => Math.random() - 0.5).slice(0, 4);
      return shuffled.map(v => ({
        tipo: 'vantagem', id: v.id, nome: v.nome,
        descricao: v.descricao?.slice(0, 60) || '', custo: v.custo ?? 0,
      }));
    }

    if (etapa === 'desvantagens') {
      const shuffled = [...desvantagens].sort(() => Math.random() - 0.5).slice(0, 4);
      return shuffled.map(d => ({
        tipo: 'desvantagem', id: d.id, nome: d.nome,
        descricao: d.descricao?.slice(0, 60) || '', custo: d.custo ?? 0,
      }));
    }

    if (etapa === 'background') {
      return [
        { tipo: 'background', id: null, nome: 'Órfão de guerra criado por monges', descricao: 'Uma infância marcada pela perda, mas moldada pela disciplina.' },
        { tipo: 'background', id: null, nome: 'Nobre exilado em busca de redenção', descricao: 'Nascido na nobreza, agora busca provar seu valor longe dos privilégios.' },
        { tipo: 'background', id: null, nome: 'Mercenário aposentado que ouviu um chamado', descricao: 'Anos de batalha, agora um propósito maior o guia.' },
        { tipo: 'background', id: null, nome: 'Aprendiz que fugiu após descobrir um segredo proibido', descricao: 'O conhecimento pode ser tão perigoso quanto uma espada.' },
      ];
    }

    if (etapa === 'boas_vindas') {
      const nomes = ['Kaelen', 'Zephyra', 'Thorne', 'Mirael', 'Ashwin', 'Selene', 'Darius', 'Yuki'];
      return nomes.map(n => ({ tipo: 'nome', id: null, nome: n, descricao: '' }));
    }

    return [];
  } catch (err) {
    console.warn('⚠️ MestreCriador: Falha ao gerar fallback de sugestões:', err.message);
    return [];
  }
}

/** Gera distribuição de atributos fallback baseada na classe */
function gerarAtributosFallback(estado) {
  // Distribuições temáticas por classe (soma = 60, min 5, max 16)
  const DISTRIBUICOES = {
    guerreiro:   { forca: 14, destreza: 10, constituicao: 13, inteligencia: 7, agilidade: 9, carisma: 7 },
    mago:        { forca: 6, destreza: 8, constituicao: 8, inteligencia: 16, agilidade: 10, carisma: 12 },
    ladino:      { forca: 8, destreza: 14, constituicao: 8, inteligencia: 10, agilidade: 14, carisma: 6 },
    clerigo:     { forca: 10, destreza: 8, constituicao: 12, inteligencia: 12, agilidade: 8, carisma: 10 },
    ranger:      { forca: 10, destreza: 13, constituicao: 10, inteligencia: 8, agilidade: 13, carisma: 6 },
    bardo:       { forca: 6, destreza: 10, constituicao: 8, inteligencia: 12, agilidade: 10, carisma: 14 },
    paladino:    { forca: 13, destreza: 8, constituicao: 12, inteligencia: 8, agilidade: 8, carisma: 11 },
    druida:      { forca: 8, destreza: 10, constituicao: 10, inteligencia: 14, agilidade: 10, carisma: 8 },
    barbaro:     { forca: 16, destreza: 8, constituicao: 14, inteligencia: 5, agilidade: 10, carisma: 7 },
    monge:       { forca: 10, destreza: 12, constituicao: 10, inteligencia: 8, agilidade: 14, carisma: 6 },
    feiticeiro:  { forca: 6, destreza: 10, constituicao: 8, inteligencia: 14, agilidade: 8, carisma: 14 },
    bruxo:       { forca: 7, destreza: 8, constituicao: 10, inteligencia: 13, agilidade: 8, carisma: 14 },
  };

  const classeNome = (estado.classe_nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const dist = Object.entries(DISTRIBUICOES).find(([k]) => classeNome.includes(k));
  return dist ? dist[1] : { forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, agilidade: 10, carisma: 10 };
}

// Tipo esperado de sugestão por etapa
const TIPO_ESPERADO = {
  boas_vindas: 'nome',
  raca: 'raca',
  classe: 'classe',
  background: 'background',
  vantagens: 'vantagem',
  desvantagens: 'desvantagem',
};

/** Valida e sanitiza sugestões da IA */
function sanitizarSugestoes(sugestoes, etapa) {
  if (!Array.isArray(sugestoes)) return [];
  const tipoEsperado = TIPO_ESPERADO[etapa] || null;

  return sugestoes.filter(s => {
    // Toda sugestão precisa ter tipo e nome
    if (!s.tipo || !s.nome) {
      console.warn('⚠️ MestreCriador: Sugestão sem tipo/nome descartada:', JSON.stringify(s));
      return false;
    }
    // Validar que o tipo corresponde à etapa (ex: etapa "classe" só aceita tipo "classe")
    if (tipoEsperado && s.tipo !== tipoEsperado) {
      console.warn(`⚠️ MestreCriador [${etapa}]: Sugestão com tipo errado "${s.tipo}" descartada (esperado: "${tipoEsperado}"): "${s.nome}"`);
      return false;
    }
    // Sugestões de catálogo (raça, classe, vantagem, desvantagem) precisam de ID
    if (['raca', 'classe', 'vantagem', 'desvantagem'].includes(s.tipo) && !s.id) {
      console.warn(`⚠️ MestreCriador: Sugestão de ${s.tipo} sem ID descartada: "${s.nome}"`);
      return false;
    }
    return true;
  });
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
// Seed de mitologias para variar nomes a cada sessão
const MITOLOGIAS = ['celta', 'japonesa', 'africana', 'eslava', 'árabe', 'grega', 'indiana', 'nórdica', 'latina', 'persa', 'polinésia', 'tupi', 'asteca', 'egípcia', 'tibetana', 'gaélica', 'suméria', 'finlandesa', 'maori', 'iorubá'];

function construirInput(etapa, estado, mensagemJogador) {
  const parts = [`[ETAPA ATUAL: ${etapa}]`];

  // Seed aleatório para variar sugestões de nomes
  if (etapa === 'boas_vindas') {
    const shuffled = MITOLOGIAS.sort(() => Math.random() - 0.5).slice(0, 5);
    parts.push(`[SEED DE VARIAÇÃO: use inspiração primária em mitologia ${shuffled.join(', ')}. Semente aleatória: ${Math.random().toString(36).substring(2, 8)}]`);
  }

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

  // Lembrete de contextualização para sugestões
  if (['classe', 'vantagens', 'desvantagens', 'background'].includes(etapa)) {
    parts.push(`[LEMBRETE: Suas sugestões DEVEM ser coerentes com as escolhas anteriores do personagem. Sugira opções que combinem narrativamente.]`);
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
      responseMimeType: 'application/json',
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
      responseFormat: { type: 'json_object' },
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
      console.warn(`⚠️ MestreCriador [${etapa}]: Fallback — IA não retornou JSON válido`);
      // Fallback: usar texto bruto como mensagem
      resultado = {
        mensagem: response.content,
        sugestoes: [],
        etapa_proxima: TRANSICOES[etapa]?.[0] || etapa,
        atributos_sugeridos: null,
      };
    }

    // Validar etapa_proxima PRIMEIRO (sugestões dependem dela)
    const transicoesValidas = TRANSICOES[etapa] || [];
    if (!transicoesValidas.includes(resultado.etapa_proxima) && resultado.etapa_proxima !== 'confirmado') {
      resultado.etapa_proxima = transicoesValidas[0] || etapa;
    }

    // As sugestões são para a PRÓXIMA etapa (etapa_proxima), não a etapa atual
    const etapaDestino = resultado.etapa_proxima || etapa;

    // Sanitizar sugestões usando etapa destino
    const sugestoes = sanitizarSugestoes(
      Array.isArray(resultado.sugestoes) ? resultado.sugestoes : [],
      etapaDestino
    );

    // Fallback: se sugestões vazias em etapa que deveria ter, buscar do catálogo
    let sugestoesFinal = sugestoes;
    if (sugestoes.length === 0 && ETAPAS_COM_SUGESTOES.includes(etapaDestino)) {
      console.warn(`⚠️ MestreCriador [${etapa}→${etapaDestino}]: IA retornou 0 sugestões válidas (original: ${resultado.sugestoes?.length || 0}). Gerando fallback do catálogo.`);
      sugestoesFinal = await gerarFallbackSugestoes(etapaDestino, estado);
    }

    // Fallback: se atributos_sugeridos ausente na etapa de atributos, gerar distribuição padrão
    let atributosSugeridos = resultado.atributos_sugeridos || null;
    if (etapaDestino === 'atributos' && !atributosSugeridos) {
      console.warn('⚠️ MestreCriador [atributos]: IA não retornou atributos_sugeridos. Gerando fallback.');
      atributosSugeridos = gerarAtributosFallback(estado);
    }

    return {
      mensagem: resultado.mensagem || '',
      sugestoes: sugestoesFinal,
      etapa_proxima: resultado.etapa_proxima,
      atributos_sugeridos: atributosSugeridos,
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
      atributos: 'Distribua seus 60 pontos entre os atributos (mín 5, máx 16 cada).',
      resumo: 'Seu personagem está quase pronto! Revise os detalhes.',
      refinamento: 'Deseja ajustar algo antes de finalizar?',
    };

    // No catch, a próxima etapa é a transição padrão
    const catchEtapaDestino = TRANSICOES[etapa]?.[0] || etapa;

    // Mesmo em erro, tentar gerar sugestões do catálogo para a etapa destino
    const fallbackSugestoes = ETAPAS_COM_SUGESTOES.includes(catchEtapaDestino)
      ? await gerarFallbackSugestoes(catchEtapaDestino, estado).catch(() => [])
      : [];

    return {
      mensagem: fallbacks[catchEtapaDestino] || fallbacks[etapa] || 'Ocorreu um erro. Tente novamente.',
      sugestoes: fallbackSugestoes,
      etapa_proxima: catchEtapaDestino,
      atributos_sugeridos: catchEtapaDestino === 'atributos' ? gerarAtributosFallback(estado) : null,
    };
  }
}
