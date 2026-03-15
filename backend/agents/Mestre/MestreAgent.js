import { ChatGroq } from '@langchain/groq';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatAnthropic } from '@langchain/anthropic';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import dotenv from 'dotenv';

import { MESTRE_CONFIG, DEPRECATED_MODELS, detectProvider } from './config.js';
import analyticsService from '../../services/analyticsService.js';
import usageService from '../../services/usageService.js';
import { normalizeNarrationSegments, aggregateNarrationFromSegments } from '../../services/narrationSegmentsService.js';
import logger from '../../helpers/logger.js';

const log = logger.child({ module: 'MestreAgent' });

// Timeout wrapper for AI calls
function withTimeout(promise, ms = MESTRE_CONFIG.model.timeout) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT')), ms))
  ]);
}

async function withRetry(fn, retries) {
  if (retries === undefined) retries = 1;
  try {
    return await fn();
  } catch (error) {
    if (error.message === 'AI_TIMEOUT' && retries > 0) {
      log.warn('AI timeout, retrying...');
      return withRetry(fn, retries - 1);
    }
    throw error;
  }
}

/**
 * Tags de protocolo que NUNCA devem aparecer no texto narrativo.
 * Usadas para detectar respostas XML-like e para sanitizar narrativa.
 */
const PROTOCOL_TAGS = [
  'segmentos', 'segment', 'segments',
  'metadados', 'metadata',
  'fimDeTurno', 'fim_de_turno',
  'solicitaDados', 'solicita_dados',
  'acaoCompleta', 'acao_completa',
  'combate', 'acoes',
  'narracao', 'text',
  'memoria_semantica', 'terreno', 'tensao', 'ameacas',
  'npcs_presentes', 'npc_id',
  'local_atual', 'hora_ficcional',
  'entry'
];

// Global — só para .replace() em sanitizeNarrativa
const PROTOCOL_TAG_REGEX = new RegExp(
  `</?(?:${PROTOCOL_TAGS.join('|')})[^>]*>`, 'gi'
);
// Non-global — para detecção stateless via .test()
const PROTOCOL_TAG_DETECT = new RegExp(
  `</?(?:${PROTOCOL_TAGS.join('|')})[^>]*>`, 'i'
);

/**
 * Parse robusto de JSON da IA - remove markdown wrappers (```json ... ```)
 */
function parseIAJson(content) {
  // Tentar parse direto
  try {
    return JSON.parse(content);
  } catch (_) { /* continuar */ }

  // Remover markdown code blocks (```json ... ``` ou ``` ... ```)
  const cleaned = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (_) { /* continuar */ }

  // Tentar extrair primeiro bloco JSON { ... } do texto
  const match = content.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (_) { /* falhou */ }
  }

  // Tentar converter resposta XML-like para JSON
  const xmlParsed = parseXMLLikeResponse(content);
  if (xmlParsed) return xmlParsed;

  return null; // Parse impossível
}

/**
 * Tenta extrair dados estruturados de uma resposta XML-like do modelo.
 * Modelos às vezes devolvem pseudo-XML em vez de JSON.
 * Extrai narrativa dos <text> tags e controle dos tags de protocolo.
 */
function parseXMLLikeResponse(content) {
  if (!content || typeof content !== 'string') return null;
  // Só tenta se detectar tags de protocolo (non-global para evitar lastIndex stateful)
  if (!PROTOCOL_TAG_DETECT.test(content)) return null;

  log.warn('Resposta da IA em formato XML-like detectada, convertendo para JSON');

  // Extrair texto de tags <text>...</text> para montar segmentos
  const textBlocks = [];
  const textRx = /<text>([\s\S]*?)<\/text>/gi;
  let textMatch;
  while ((textMatch = textRx.exec(content)) !== null) {
    const text = textMatch[1].trim();
    if (text) textBlocks.push(text);
  }

  // Extrair narrativa: texto antes dos tags de protocolo ou dos <text> blocks
  let narrativa = '';
  if (textBlocks.length > 0) {
    narrativa = textBlocks.join('\n\n');
  } else {
    // Fallback: pegar texto livre removendo todas as tags de protocolo
    narrativa = sanitizeNarrativa(content);
  }

  if (!narrativa.trim()) return null;

  // Extrair fimDeTurno
  const fimMatch = content.match(/<fimDeTurno>(.*?)<\/fimDeTurno>/i);
  const fimDeTurno = fimMatch ? fimMatch[1].trim().toLowerCase() === 'true' : false;

  // Extrair solicitaDados
  const solicitaMatch = content.match(/<solicitaDados\s+solicita="(.*?)"[^/]*\/>/i)
    || content.match(/<solicitaDados>(.*?)<\/solicitaDados>/i);
  const solicita = solicitaMatch
    ? !['false', 'no', '0'].includes(solicitaMatch[1].trim().toLowerCase())
    : false;

  // Extrair acaoCompleta
  const acaoMatch = content.match(/<acaoCompleta>(.*?)<\/acaoCompleta>/i);
  const acaoCompleta = acaoMatch ? acaoMatch[1].trim().toLowerCase() === 'true' : false;

  // Extrair segmentos com metadados de narração
  const segmentos = [];
  const segRx = /<segment[^>]*?tipo="([^"]*)"[^>]*?speaker_label="([^"]*)"[^>]*?>[\s\S]*?<text>([\s\S]*?)<\/text>[\s\S]*?<\/segment>/gi;
  let segMatch;
  while ((segMatch = segRx.exec(content)) !== null) {
    segmentos.push({
      tipo: segMatch[1] || 'narracao',
      speaker_label: segMatch[2] || null,
      text: segMatch[3].trim()
    });
  }
  // Se não extraiu segmentos com regex detalhado, montar dos textBlocks
  if (segmentos.length === 0 && textBlocks.length > 0) {
    for (const text of textBlocks) {
      segmentos.push({ tipo: 'narracao', text });
    }
  }

  return {
    narrativa,
    segmentos: segmentos.length > 0 ? segmentos : undefined,
    fimDeTurno,
    solicitaDados: { solicita },
    acaoCompleta,
    combate: null,
    acoes: []
  };
}

/**
 * Remove tags de protocolo do texto narrativo.
 * Garante que metadados, flags de engine e tags XML nunca cheguem ao chat.
 */
function sanitizeNarrativa(text) {
  if (!text || typeof text !== 'string') return '';

  let clean = text;
  // Remover pares completos de TODAS as tags de protocolo (tag + conteúdo interno)
  for (const tag of PROTOCOL_TAGS) {
    const blockRx = new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag}>`, 'gi');
    clean = clean.replace(blockRx, '');
  }
  // Remover self-closing protocol tags (<solicitaDados ... />, <combate ... />)
  clean = clean.replace(/<(?:solicitaDados|combate|acaoCompleta|fimDeTurno|acoes)[^>]*\/>/gi, '');
  // Remover remaining opening/closing protocol tags (orphaned)
  clean = clean.replace(PROTOCOL_TAG_REGEX, '');
  // Limpar linhas vazias excessivas
  clean = clean.replace(/\n{3,}/g, '\n\n').trim();

  return clean;
}

/**
 * Fallback: detecta solicitação de dados na narrativa quando o JSON não incluiu.
 * Extrai teste e dificuldade do padrão "🎲 Role 1d20 para X! (Dificuldade: Y)"
 * ou "🎲 Role 1d20 para X!" sem dificuldade explícita.
 */
function fallbackSolicitaDados(respostaJSON) {
  if (!respostaJSON?.narrativa) return;
  if (respostaJSON.solicitaDados?.solicita) return; // Já está correto

  const narrativa = respostaJSON.narrativa;
  // Padrão: 🎲 Role 1d20 para Teste! (Dificuldade: X) ou 🎲 Role 1d20 para Teste!
  const match = narrativa.match(/🎲\s*[Rr]ole\s+1?d20\s+para\s+([^!(.]+?)(?:\s*!\s*\((?:[Dd]ificuldade:\s*)([^)]+)\)|\s*!)/);
  if (match) {
    const teste = match[1].trim();
    const dificuldade = match[2]?.trim() || 'Média';
    log.info({ teste, dificuldade }, 'Fallback solicitaDados detectado na narrativa');
    respostaJSON.solicitaDados = {
      solicita: true,
      tipo: 'd20',
      teste,
      dificuldade
    };
  }
}

function extrairTeste(respostaJSON = {}) {
  if (!respostaJSON?.solicitaDados?.solicita) return null;

  return {
    teste: respostaJSON.solicitaDados.teste || '',
    atributo: respostaJSON.solicitaDados.atributo || null,
    pericia: respostaJSON.solicitaDados.pericia || null,
    dificuldade: respostaJSON.solicitaDados.dificuldade || null,
    contexto: respostaJSON.solicitaDados.contexto || null,
    jogadorAlvo: respostaJSON.solicitaDados.jogadorAlvo || null,
    tipoDado: respostaJSON.solicitaDados.tipo || 'd20',
    origem: respostaJSON.solicitaDados.origem || 'mestre'
  };
}

function normalizeRespostaSegmentos(respostaJSON = {}) {
  const narrativaBase = typeof respostaJSON?.narrativa === 'string'
    ? respostaJSON.narrativa.trim()
    : '';

  const segmentos = normalizeNarrationSegments(respostaJSON?.segmentos, {
    fallbackText: narrativaBase
  });

  const narrativa = narrativaBase || aggregateNarrationFromSegments(segmentos);

  return {
    narrativa,
    segmentos
  };
}

/**
 * Extract token usage from LangChain response and track via usageService
 */
function trackLLMUsage(response, modelName, userId, startTime) {
  if (!userId) return;
  try {
    // Groq: response.response_metadata.token_usage
    // Gemini: response.usage_metadata
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
  } catch (e) {
    // silent — don't break game flow
  }
}

import { criarPromptSistema } from './prompts/sistema.js';
import { criarPromptNarracao } from './prompts/narracao.js';
import { criarPromptInicio, criarPromptBoasVindas } from './prompts/inicio.js';
import { formatarMensagemJogador, formatarRespostaMestre, extrairInfoPersonagem } from './utils/formatacao.js';
import { converterHistoricoParaLangChain, adicionarMensagem } from './utils/historico.js';
import { extrairNomesTemas } from '../../helpers/temasHelper.js';

dotenv.config();

const HISTORY_LIMIT = MESTRE_CONFIG.behavior.maxHistoryLength;
const RESUMO_MAX_CHARS = MESTRE_CONFIG.behavior.resumoMaxChars;

/**
 * Extrai o texto do campo "narrativa" de um JSON em streaming, token a token.
 * State machine: SEARCHING → FOUND_KEY → IN_VALUE → DONE
 */
class NarrativaExtractor {
  constructor() {
    this.state = 'SEARCHING';
    this.extracted = '';
    this.buffer = '';
    this.escaping = false;
    this._target = '"narrativa"';
    this._idx = 0;
    this._colonSeen = false;
  }

  /** Alimenta novos tokens. Retorna o delta (texto novo da narrativa). */
  feed(chunk) {
    this.buffer += chunk;
    let delta = '';
    for (const ch of chunk) {
      switch (this.state) {
        case 'SEARCHING':
          if (ch === this._target[this._idx]) {
            this._idx++;
            if (this._idx === this._target.length) this.state = 'FOUND_KEY';
          } else {
            this._idx = 0;
          }
          break;
        case 'FOUND_KEY':
          if (ch === ':') this._colonSeen = true;
          else if (this._colonSeen && ch === '"') this.state = 'IN_VALUE';
          break;
        case 'IN_VALUE':
          if (this.escaping) {
            const u = ch === 'n' ? '\n' : ch === 't' ? '\t' : ch;
            this.extracted += u;
            delta += u;
            this.escaping = false;
          } else if (ch === '\\') {
            this.escaping = true;
          } else if (ch === '"') {
            this.state = 'DONE';
          } else {
            this.extracted += ch;
            delta += ch;
          }
          break;
        case 'DONE':
          break;
      }
    }
    return delta;
  }

  get isDone() { return this.state === 'DONE'; }
  get fullBuffer() { return this.buffer; }
}

/**
 * Classe principal do Mestre de RPG
 * Gerencia toda a interação com o modelo de IA e o contexto da aventura
 */
export class MestreAgent {
  constructor(
    temas = [],
    personagens = [],
    configOverride = null,
    catalogo = '',
    roteiroCondensado = '',
    contextoPersistenteFormatado = '',
    mestreContexto = null
  ) {
    // Garantir que temas sejam sempre strings (nomes)
    // Validação de segurança caso alguém passe IDs ou objetos por engano
    this.temas = extrairNomesTemas(temas);

    // Log de validação se necessário
    if (Array.isArray(temas) && temas.length > 0 && typeof temas[0] === 'number') {
      log.warn('Recebidos temas como IDs numericos, convertendo para nomes');
    }

    this.personagens = personagens.map(p => extrairInfoPersonagem(p));
    this.configOverride = configOverride;
    this.catalogo = catalogo;
    this.roteiroCondensado = roteiroCondensado;
    this.contextoPersistenteFormatado = contextoPersistenteFormatado;
    this.mestreContexto = mestreContexto;
    this.historico = [];
    this.model = null;
    this.chain = null;
    this.modelName = null;
    this.userId = null;

    this._inicializarModelo();
  }

  /**
   * Inicializa o modelo de IA e a chain
   */
  _inicializarModelo() {
    try {
      // Merge config customizada com defaults + clamp values
      let modelName = this.configOverride?.modelo || MESTRE_CONFIG.model.name;
      const rawTemp = this.configOverride?.temperatura ?? MESTRE_CONFIG.model.temperature;
      const rawTokens = this.configOverride?.max_tokens ?? MESTRE_CONFIG.model.maxTokens;
      const temperature = Math.min(2, Math.max(0, rawTemp));
      const maxTokens = Math.min(32000, Math.max(100, rawTokens));

      // Fallback de modelos deprecados
      if (DEPRECATED_MODELS[modelName]) {
        const newModel = DEPRECATED_MODELS[modelName];
        log.warn({ from: modelName, to: newModel }, 'Modelo deprecado, migrando');
        modelName = newModel;
      }

      this.modelName = modelName;

      // Detectar provider pelo prefixo do modelo
      const provider = detectProvider(modelName);
      if (provider === 'gemini') {
        this.model = new ChatGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_API_KEY,
          model: modelName,
          temperature,
          maxOutputTokens: maxTokens
        });
        log.info({ provider: 'gemini', modelName }, 'Modelo inicializado');
      } else if (provider === 'anthropic') {
        this.model = new ChatAnthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: modelName,
          temperature,
          maxTokens,
        });
        log.info({ provider: 'anthropic', modelName }, 'Modelo inicializado');
      } else {
        this.model = new ChatGroq({
          apiKey: process.env.GROQ_API_KEY,
          model: modelName,
          temperature,
          maxTokens,
          topP: MESTRE_CONFIG.model.topP
        });
        log.info({ provider: 'groq', modelName }, 'Modelo inicializado');
      }

      // Criar prompt template (com personalidade custom se houver)
      const promptSistema = criarPromptSistema(
        this.temas,
        this.personagens,
        this.configOverride,
        this.catalogo,
        this.roteiroCondensado,
        this.contextoPersistenteFormatado
      );
      const prompt = ChatPromptTemplate.fromMessages([
        ['system', promptSistema],
        new MessagesPlaceholder('chat_history'),
        ['human', '{input}']
      ]);

      // Criar chain
      this.chain = RunnableSequence.from([
        {
          input: (input) => input.input,
          chat_history: (input) => input.chat_history || []
        },
        prompt,
        this.model
      ]);

      log.info('Chain criada com sucesso');
    } catch (error) {
      log.error({ err: error.message }, 'Erro ao inicializar modelo');
      this.model = null;
      this.chain = null;
    }
  }

  /**
   * Narra uma ação do jogador
   */
  async narrarAcao({ jogador, personagem, acao, chatHistory = [], resumo = null, contextoLateralRoleplay = '' }) {
    const startTime = Date.now();
    try {
      log.info({ personagem }, 'Narrando acao');

      // Formatar input
      const input = criarPromptNarracao(jogador, personagem, acao);

      // Converter histórico
      const inputCompleto = contextoLateralRoleplay
        ? `${contextoLateralRoleplay}\n\n${input}`
        : input;
      let historico = converterHistoricoParaLangChain(chatHistory);

      // ✅ Se houver resumo, adicionar como contexto do sistema
      if (resumo) {
        log.debug('Usando resumo da aventura no contexto');
        const resumoTruncado = resumo.length > RESUMO_MAX_CHARS ? resumo.slice(-RESUMO_MAX_CHARS) : resumo;
        historico = [
          {
            role: 'system',
            content: `RESUMO DA AVENTURA ATÉ AGORA:\n${resumoTruncado}\n\nContinue a aventura considerando este contexto.`
          },
          ...historico.slice(-HISTORY_LIMIT)
        ];
      }

      if (!this.chain) {
        throw new Error('Modelo de IA nao inicializado');
      }

      // Invocar chain with timeout + retry
      const response = await withRetry(() => withTimeout(this.chain.invoke({
        input: inputCompleto,
        chat_history: historico
      })));

      trackLLMUsage(response, this.modelName, this.userId, startTime);

      // Parsear JSON da resposta
      let respostaJSON = parseIAJson(response.content);
      if (!respostaJSON) {
        respostaJSON = {
          narrativa: sanitizeNarrativa(response.content),
          fimDeTurno: false,
          solicitaDados: { solicita: false },
          acaoCompleta: false
        };
      }

      // Fallback: detectar solicitação de dados na narrativa se JSON não incluiu
      fallbackSolicitaDados(respostaJSON);
      const { narrativa: rawNarrativa, segmentos } = normalizeRespostaSegmentos(respostaJSON);
      const narrativa = sanitizeNarrativa(rawNarrativa);

      // Adicionar ao historico local
      const mensagemJogador = formatarMensagemJogador(jogador, personagem, acao);
      this.historico = adicionarMensagem(this.historico, mensagemJogador);

      const respostaMestre = formatarRespostaMestre(narrativa);
      if (respostaJSON.metadados) {
        respostaMestre.contexto = {
          ...(respostaMestre.contexto || {}),
          metadados: respostaJSON.metadados
        };
      }
      this.historico = adicionarMensagem(this.historico, respostaMestre);

      return {
        narracao: narrativa,
        segmentos,
        fimDeTurno: respostaJSON.fimDeTurno || false,
        solicitaDados: respostaJSON.solicitaDados || { solicita: false },
        teste: extrairTeste(respostaJSON),
        acaoCompleta: respostaJSON.acaoCompleta || false,
        combate: respostaJSON.combate || null,
        acoes: respostaJSON.acoes || [],
        metadados: respostaJSON.metadados || {},
        jogador,
        personagem,
        acao,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      log.error({ err: error.message }, 'Erro ao narrar acao');
      // Fallback narrative instead of crashing the game
      const narrativaFallback = '*O Mestre faz uma pausa dramatica...* A magia que conecta os mundos vacila por um instante. (Erro temporario no servico de IA - tente novamente)';
      return {
        narracao: narrativaFallback,
        segmentos: normalizeNarrationSegments(null, { fallbackText: narrativaFallback }),
        fimDeTurno: false,
        solicitaDados: { solicita: false },
        teste: null,
        acaoCompleta: false,
        metadados: {},
        jogador,
        personagem,
        acao,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Narra uma ação do jogador com streaming de tokens.
   * Emite chunks da narrativa progressivamente via callbacks.
   * Fallback: chama narrarAcao() (non-streaming) em caso de erro.
   */
  async narrarAcaoStream({ jogador, personagem, acao, chatHistory = [], resumo = null, contextoLateralRoleplay = '' }, callbacks = {}) {
    const { onStreamStart, onChunk, onStreamEnd, onError } = callbacks;
    const startTime = Date.now();

    try {
      log.info({ personagem }, 'Narrando acao (stream)');

      const input = criarPromptNarracao(jogador, personagem, acao);
      const inputCompleto = contextoLateralRoleplay
        ? `${contextoLateralRoleplay}\n\n${input}`
        : input;
      let historico = converterHistoricoParaLangChain(chatHistory);

      if (resumo) {
        const resumoTruncado = resumo.length > RESUMO_MAX_CHARS ? resumo.slice(-RESUMO_MAX_CHARS) : resumo;
        historico = [
          { role: 'system', content: `RESUMO DA AVENTURA ATÉ AGORA:\n${resumoTruncado}\n\nContinue a aventura considerando este contexto.` },
          ...historico.slice(-HISTORY_LIMIT)
        ];
      }

      if (!this.chain) throw new Error('Modelo de IA nao inicializado');

      onStreamStart?.();

      const extractor = new NarrativaExtractor();
      let lastChunkTime = Date.now();
      const streamTimeout = (MESTRE_CONFIG.model.timeout || 12000) * 2;

      const stream = await this.chain.stream({
        input: inputCompleto,
        chat_history: historico
      });

      for await (const chunk of stream) {
        if (Date.now() - lastChunkTime > streamTimeout) {
          throw new Error('AI_STREAM_TIMEOUT');
        }
        lastChunkTime = Date.now();

        const text = typeof chunk.content === 'string' ? chunk.content : '';
        if (!text) continue;

        const delta = extractor.feed(text);
        if (delta) {
          onChunk?.(delta, extractor.extracted);
        }
      }

      let respostaJSON = parseIAJson(extractor.fullBuffer);
      if (!respostaJSON) {
        respostaJSON = {
          narrativa: sanitizeNarrativa(extractor.extracted || extractor.fullBuffer),
          fimDeTurno: false,
          solicitaDados: { solicita: false },
          acaoCompleta: false
        };
      }

      fallbackSolicitaDados(respostaJSON);
      const { narrativa: rawNarrativa, segmentos } = normalizeRespostaSegmentos(respostaJSON);
      const narrativa = sanitizeNarrativa(rawNarrativa);

      const mensagemJogador = formatarMensagemJogador(jogador, personagem, acao);
      this.historico = adicionarMensagem(this.historico, mensagemJogador);
      const respostaMestre = formatarRespostaMestre(narrativa);
      if (respostaJSON.metadados) {
        respostaMestre.contexto = { ...(respostaMestre.contexto || {}), metadados: respostaJSON.metadados };
      }
      this.historico = adicionarMensagem(this.historico, respostaMestre);

      const result = {
        narracao: narrativa,
        segmentos,
        fimDeTurno: respostaJSON.fimDeTurno || false,
        solicitaDados: respostaJSON.solicitaDados || { solicita: false },
        teste: extrairTeste(respostaJSON),
        acaoCompleta: respostaJSON.acaoCompleta || false,
        combate: respostaJSON.combate || null,
        acoes: respostaJSON.acoes || [],
        metadados: respostaJSON.metadados || {},
        jogador, personagem, acao,
        timestamp: new Date().toISOString()
      };

      onStreamEnd?.(result);

      log.info({ duracao: Date.now() - startTime, narracaoLength: narrativa?.length || 0 }, 'Narracao stream concluida');
      return result;
    } catch (error) {
      log.error({ err: error.message }, 'Erro ao narrar acao (stream), fallback para invoke');
      onError?.(error);
      return this.narrarAcao({ jogador, personagem, acao, chatHistory, resumo, contextoLateralRoleplay });
    }
  }

  /**
   * Inicia uma nova sessão com mensagem de boas-vindas
   */
  async iniciarSessao({ tema, personagens: personagensCustom, cenaInicial, historiaNome }) {
    const startTime = Date.now();
    try {
      log.info('Iniciando nova sessao');

      let input;
      
      if (historiaNome) {
        // Usar prompt de boas-vindas personalizado
        input = criarPromptBoasVindas(
          historiaNome,
          this.temas,
          personagensCustom || this.personagens
        );
      } else {
        // Usar prompt padrão de início
        input = criarPromptInicio(
          tema || this.temas.join(', '),
          personagensCustom || this.personagens,
          cenaInicial
        );
      }

      if (!this.chain) {
        throw new Error('Modelo de IA nao inicializado');
      }

      // Invocar chain with timeout + retry
      const response = await withRetry(() => withTimeout(this.chain.invoke({
        input,
        chat_history: []
      })));

      trackLLMUsage(response, this.modelName, this.userId, startTime);

      // Parsear JSON
      let respostaJSON = parseIAJson(response.content);
      if (!respostaJSON) {
        log.warn('Resposta iniciarSessao nao e JSON, usando fallback');
        respostaJSON = {
          narrativa: sanitizeNarrativa(response.content),
          fimDeTurno: false,
          solicitaDados: { solicita: false },
          acaoCompleta: false
        };
      }

      const { narrativa: rawNarrativa, segmentos } = normalizeRespostaSegmentos(respostaJSON);
      const narrativa = sanitizeNarrativa(rawNarrativa);

      // Adicionar ao hist??rico
      const respostaMestre = formatarRespostaMestre(narrativa, {
        tipo: 'inicio_sessao',
        tema: tema || this.temas.join(', ')
      });
      this.historico = [respostaMestre];

      log.info('Sessao iniciada com sucesso');

      return {
        introducao: narrativa,
        segmentos,
        tema: tema || this.temas.join(', '),
        personagens: personagensCustom || this.personagens,
        metadados: respostaJSON.metadados || {},
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      log.error({ err: error.message }, 'Erro ao iniciar sessao');
      // Fallback intro
      const introducaoFallback = '*Uma nevoa mistica se dissipa lentamente...* A aventura esta prestes a comecar! (Erro temporario no servico de IA)';
      return {
        introducao: introducaoFallback,
        segmentos: normalizeNarrationSegments(null, { fallbackText: introducaoFallback }),
        tema: tema || this.temas.join(', '),
        personagens: personagensCustom || this.personagens,
        metadados: {},
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Processa uma resposta genérica do mestre
   */
  async processarResposta({ input, chatHistory = [] }) {
    const startTime = Date.now();
    try {
      if (!this.chain) {
        throw new Error('Modelo de IA nao inicializado');
      }

      const historico = converterHistoricoParaLangChain(chatHistory);

      const response = await withTimeout(this.chain.invoke({
        input,
        chat_history: historico
      }));

      analyticsService.track('ai_response', {
        duration_ms: Date.now() - startTime,
        fallback: false,
        input_length: input?.length || 0,
      });
      trackLLMUsage(response, this.modelName, this.userId, startTime);

      return {
        resposta: sanitizeNarrativa(response.content),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      log.error({ err: error.message }, 'Erro ao processar resposta');
      analyticsService.track('ai_response', {
        duration_ms: Date.now() - startTime,
        fallback: true,
        error: error.message,
      });
      return {
        resposta: '*O Mestre pondera em silencio...* (Erro temporario no servico de IA)',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Narrar turno do jogador (controla interação durante o turno)
   */
  async narrarTurnoJogador({
    jogador,
    personagem,
    mensagem,
    rodada,
    turno,
    contadorMensagens = 0,
    chatHistory = [],
    resumo = null,
    contextoLateralRoleplay = ''
  }) {
    const startTime = Date.now();
    try {
      log.info({ turno, personagem, rodada }, 'Narrando turno');

      // Criar prompt específico para turno
      let input = `TURNO DO JOGADOR ${personagem} (Jogador: ${jogador})
Rodada: ${rodada} | Turno: ${turno} | Mensagem ${contadorMensagens + 1}/4

Mensagem do Jogador:
"${mensagem}"

`;

      // Se já houve 3 mensagens, avisar que é hora de finalizar
      if (contadorMensagens >= 3) {
        input += `\n⚠️ IMPORTANTE: Este é o limite de interações deste turno. Finalize a ação do jogador de forma conclusiva e use fimDeTurno: true no JSON.\n`;
      } else {
        input += `\nResponda à ação do jogador de forma dinâmica e envolvente. Você ainda tem ${4 - contadorMensagens - 1} resposta(s) disponíveis.\n\nSe a ação estiver completamente resolvida, use fimDeTurno: true no JSON.\n`;
      }

      // Converter histórico
      let historico = converterHistoricoParaLangChain(chatHistory);

      // ✅ Se houver resumo, adicionar como contexto do sistema
      if (resumo) {
        log.debug('Usando resumo no turno');
        const resumoTruncado = resumo.length > RESUMO_MAX_CHARS ? resumo.slice(-RESUMO_MAX_CHARS) : resumo;
        historico = [
          {
            role: 'system',
            content: `RESUMO DA AVENTURA:\n${resumoTruncado}`
          },
          ...historico.slice(-HISTORY_LIMIT)
        ];
      }

      if (!this.chain) {
        throw new Error('Modelo de IA nao inicializado');
      }

      // Invocar chain with timeout + retry
      const response = await withRetry(() => withTimeout(this.chain.invoke({
        input,
        chat_history: historico
      })));

      trackLLMUsage(response, this.modelName, this.userId, startTime);

      let respostaJSON = parseIAJson(response.content);
      if (!respostaJSON) {
        respostaJSON = {
          narrativa: sanitizeNarrativa(response.content),
          fimDeTurno: false,
          solicitaDados: { solicita: false },
          acaoCompleta: false
        };
      }

      // Fallback: detectar solicitação de dados na narrativa se JSON não incluiu
      fallbackSolicitaDados(respostaJSON);
      const { narrativa: rawNarrativa, segmentos } = normalizeRespostaSegmentos(respostaJSON);
      const narrativa = sanitizeNarrativa(rawNarrativa);

      return {
        resposta: narrativa,
        segmentos,
        fimDeTurno: respostaJSON.fimDeTurno || false,
        solicitaDados: respostaJSON.solicitaDados || { solicita: false },
        teste: extrairTeste(respostaJSON),
        acaoCompleta: respostaJSON.acaoCompleta || false,
        combate: respostaJSON.combate || null,
        acoes: respostaJSON.acoes || [],
        metadados: respostaJSON.metadados || {},
        rodada,
        turno,
        jogador,
        personagem,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      log.error({ err: error.message }, 'Erro ao narrar turno');
      const respostaFallback = '*O Mestre faz uma pausa...* (Erro temporario no servico de IA - tente novamente)';
      return {
        resposta: respostaFallback,
        segmentos: normalizeNarrationSegments(null, { fallbackText: respostaFallback }),
        fimDeTurno: false,
        solicitaDados: { solicita: false },
        teste: null,
        acaoCompleta: false,
        metadados: {},
        rodada,
        turno,
        jogador,
        personagem,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Narrar entre rodadas (gerar novo desafio após todos jogarem)
   */
  async narrarEntreRodadas({
    rodadaAnterior,
    proximaRodada,
    resumoAcoes = [],
    chatHistory = [],
    resumo = null
  }) {
    const startTime = Date.now();
    try {
      log.info({ rodadaAnterior, proximaRodada }, 'Narrando transicao entre rodadas');

      // Criar resumo das ações da rodada anterior
      const resumoTexto = resumoAcoes.length > 0 
        ? `Resumo da Rodada ${rodadaAnterior}:\n${resumoAcoes.map((acao, idx) => `${idx + 1}. ${acao}`).join('\n')}`
        : `A rodada ${rodadaAnterior} foi concluída.`;

      // Criar prompt para entre rodadas
      const input = `FIM DA RODADA ${rodadaAnterior} - INÍCIO DA RODADA ${proximaRodada}

${resumoTexto}

Como Mestre, você deve:
1. Criar um NOVO DESAFIO ou situação interessante para a Rodada ${proximaRodada}
2. Manter a narrativa empolgante e dinâmica
3. Dar aos jogadores novos objetivos ou obstáculos
4. Conectar a nova situação com as ações da rodada anterior

Narre a transição e apresente o novo desafio:`;

      // Converter histórico
      let historico = converterHistoricoParaLangChain(chatHistory);

      // ✅ Se houver resumo, adicionar como contexto do sistema
      if (resumo) {
        log.debug('Usando resumo entre rodadas');
        const resumoTruncado = resumo.length > RESUMO_MAX_CHARS ? resumo.slice(-RESUMO_MAX_CHARS) : resumo;
        historico = [
          {
            role: 'system',
            content: `RESUMO DA AVENTURA:\n${resumoTruncado}`
          },
          ...historico.slice(-HISTORY_LIMIT)
        ];
      }

      if (!this.chain) {
        throw new Error('Modelo de IA nao inicializado');
      }

      const response = await withRetry(() => withTimeout(this.chain.invoke({
        input,
        chat_history: historico
      })));

      trackLLMUsage(response, this.modelName, this.userId, startTime);

      let respostaJSON = parseIAJson(response.content);
      if (!respostaJSON) {
        respostaJSON = {
          narrativa: sanitizeNarrativa(response.content),
          fimDeTurno: false,
          solicitaDados: { solicita: false },
          acaoCompleta: false
        };
      }

      const { narrativa: rawNarrativa, segmentos } = normalizeRespostaSegmentos(respostaJSON);
      const narrativa = sanitizeNarrativa(rawNarrativa);

      return {
        narrativa,
        segmentos,
        combate: respostaJSON.combate || null,
        acoes: respostaJSON.acoes || [],
        metadados: respostaJSON.metadados || {},
        rodadaAnterior,
        proximaRodada,
        novoDesafio: narrativa,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      log.error({ err: error.message }, 'Erro ao narrar entre rodadas');
      const narrativaFallbackEntreRodadas = '*O mundo estremece brevemente...* Uma nova rodada se inicia! (Erro temporario no servico de IA)';
      return {
        narrativa: narrativaFallbackEntreRodadas,
        segmentos: normalizeNarrationSegments(null, { fallbackText: narrativaFallbackEntreRodadas }),
        metadados: {},
        rodadaAnterior,
        proximaRodada,
        novoDesafio: 'Nova rodada iniciada',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Solicitar rolagem de dados dos jogadores
   */
  async solicitarRolagemDados({ 
    motivo, 
    tipoTeste = 'd20', 
    dificuldade = 'Média',
    jogadores = [],
    chatHistory = [],
    resumo = null,
    contextoLateralRoleplay = ''
  }) {
    try {
      log.info({ tipoTeste }, 'Solicitando rolagem');

      const jogadoresTexto = jogadores.length > 0 
        ? jogadores
            .map((jogador) => {
              if (typeof jogador === 'string') return jogador;
              return jogador?.username
                || jogador?.nome
                || jogador?.personagemNome
                || jogador?.userId
                || jogador?.id
                || 'Jogador';
            })
            .join(', ')
        : 'todos os jogadores';

      const input = `SOLICITAÇÃO DE ROLAGEM DE DADOS

Motivo: ${motivo}
Tipo de Dado: ${tipoTeste}
Dificuldade: ${dificuldade}
Jogadores: ${jogadoresTexto}

Como Mestre, explique de forma BREVE e DRAMÁTICA:
- Por que essa rolagem é necessária agora
- O que está em jogo (sucesso vs falha)
- Como os jogadores devem proceder

Termine com "🎲 Rolem seus dados!"

Seja conciso (máximo 100 palavras).`;

      const inputCompleto = contextoLateralRoleplay
        ? `${input}\n\n${contextoLateralRoleplay}`
        : input;

      if (!this.chain) {
        throw new Error('Modelo de IA nao inicializado');
      }

      let historico = converterHistoricoParaLangChain(chatHistory);
      if (resumo) {
        const resumoTruncado = resumo.length > RESUMO_MAX_CHARS ? resumo.slice(-RESUMO_MAX_CHARS) : resumo;
        historico = [
          {
            role: 'system',
            content: `RESUMO DA AVENTURA:\n${resumoTruncado}`
          },
          ...historico.slice(-HISTORY_LIMIT)
        ];
      }

      const startTime = Date.now();
      const response = await withRetry(() => withTimeout(this.chain.invoke({
        input: inputCompleto,
        chat_history: historico.slice(-HISTORY_LIMIT)
      })));
      trackLLMUsage(response, this.modelName, this.userId, startTime);

      return {
        narrativa: sanitizeNarrativa(response.content),
        tipoTeste,
        dificuldade,
        jogadores,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      log.error({ err: error.message }, 'Erro ao solicitar dados');
      return {
        narrativa: 'O destino aguarda sua rolagem de dados!',
        tipoTeste,
        dificuldade,
        jogadores,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Obtém o histórico atual
   */
  getHistorico() {
    return this.historico;
  }

  /**
   * Limpa o histórico
   */
  limparHistorico() {
    this.historico = [];
  }

  /**
   * Atualiza os temas da aventura
   */
  atualizarTemas(novosTemas) {
    this.temas = novosTemas;
    this._inicializarModelo(); // Reinicializar com novos temas
  }

  /**
   * Atualiza os personagens da aventura
   */
  atualizarPersonagens(novosPersonagens) {
    this.personagens = novosPersonagens.map(p => extrairInfoPersonagem(p));
    this._inicializarModelo(); // Reinicializar com novos personagens
  }
}

/**
 * Factory function para criar instância do Mestre
 */
export async function criarMestreRPG(
  temas = [],
  personagens = [],
  configOverride = null,
  catalogo = '',
  roteiroCondensado = '',
  contextoPersistenteFormatado = '',
  mestreContexto = null
) {
  try {
    const mestre = new MestreAgent(
      temas,
      personagens,
      configOverride,
      catalogo,
      roteiroCondensado,
      contextoPersistenteFormatado,
      mestreContexto
    );
    return mestre;
  } catch (error) {
    log.error({ err: error }, 'Erro ao criar mestre de RPG');
    throw new Error(`Erro ao criar mestre de RPG: ${error.message}`);
  }
}

export default criarMestreRPG;

