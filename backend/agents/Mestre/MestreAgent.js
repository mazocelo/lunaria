import { ChatGroq } from '@langchain/groq';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatAnthropic } from '@langchain/anthropic';
import { RunnableSequence, RunnableLambda } from '@langchain/core/runnables';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import dotenv from 'dotenv';

import { MESTRE_CONFIG, DEPRECATED_MODELS, detectProvider, getModelParams } from './config.js';
import analyticsService from '../../services/analyticsService.js';
import usageService from '../../services/usageService.js';
import { normalizeNarrationSegments, aggregateNarrationFromSegments } from '../../services/narrationSegmentsService.js';
import { buildHistoriaConfigPrompt, getTurnActionLimit } from '../../helpers/historiaConfigHelper.js';
import { criarPromptTurnoPrimeira, criarPromptTurnoSeguinte, criarPromptTurnoFinal } from './prompts/turno.js';
import logger from '../../helpers/logger.js';

const log = logger.child({ module: 'MestreAgent' });

/**
 * Invoca a chain, usando .stream() para Anthropic (que rejeita .invoke() em requests longos)
 * e .invoke() para os demais providers. Retorna o mesmo formato de response.
 */
async function invokeOrStream(chain, input, provider) {
  if (provider === 'anthropic') {
    // Anthropic SDK v4+ requer streaming para requests com timeout > 10min calculado pelo SDK.
    // Coletamos o stream completo e retornamos como se fosse .invoke().
    const stream = await chain.stream(input);
    let fullContent = '';
    let lastResponse = null;
    for await (const chunk of stream) {
      const text = typeof chunk.content === 'string' ? chunk.content : '';
      fullContent += text;
      lastResponse = chunk;
    }
    // Montar response compatível com formato de .invoke()
    return {
      content: fullContent,
      response_metadata: lastResponse?.response_metadata || {},
      usage_metadata: lastResponse?.usage_metadata || {},
    };
  }
  return chain.invoke(input);
}

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
  const sanitized = cleaned.replace(/,\s*([}\]])/g, '$1');
  try {
    return JSON.parse(sanitized);
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

  // Extrair acoes de tags <acao .../>  ou <acao ...>...</acao>
  const acoes = [];
  const acaoRx = /<acao\s+([^>]*?)\s*\/?>/gi;
  let acaoTagMatch;
  while ((acaoTagMatch = acaoRx.exec(content)) !== null) {
    const attrsStr = acaoTagMatch[1];
    const attrs = {};
    const attrRx = /(\w+)="([^"]*)"/g;
    let attrMatch;
    while ((attrMatch = attrRx.exec(attrsStr)) !== null) {
      attrs[attrMatch[1]] = attrMatch[2];
    }
    if (attrs.tipo) {
      acoes.push(attrs);
    }
  }

  // Extrair metadados
  let metadados = null;
  const localMatch = content.match(/<local_atual>([\s\S]*?)<\/local_atual>/i);
  const horaMatch = content.match(/<hora_ficcional>([\s\S]*?)<\/hora_ficcional>/i);
  const npcsMatch = content.match(/<npcs_presentes>([\s\S]*?)<\/npcs_presentes>/i);
  if (localMatch || horaMatch || npcsMatch) {
    metadados = {};
    if (localMatch) metadados.local_atual = localMatch[1].trim();
    if (horaMatch) metadados.hora_ficcional = horaMatch[1].trim();
    if (npcsMatch) {
      metadados.npcs_presentes = npcsMatch[1].trim()
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }
  }
  // Also check for <metadados> wrapper block
  if (!metadados) {
    const metaBlock = content.match(/<metadados>([\s\S]*?)<\/metadados>/i);
    if (metaBlock) {
      metadados = {};
      const innerLocal = metaBlock[1].match(/<local_atual>([\s\S]*?)<\/local_atual>/i);
      const innerHora = metaBlock[1].match(/<hora_ficcional>([\s\S]*?)<\/hora_ficcional>/i);
      const innerNpcs = metaBlock[1].match(/<npcs_presentes>([\s\S]*?)<\/npcs_presentes>/i);
      if (innerLocal) metadados.local_atual = innerLocal[1].trim();
      if (innerHora) metadados.hora_ficcional = innerHora[1].trim();
      if (innerNpcs) {
        metadados.npcs_presentes = innerNpcs[1].trim()
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
    }
  }

  // Extrair combate
  let combate = null;
  const combateInitMatch = content.match(/<combate\s+iniciado="(true|false)"[^>]*\/?>/i);
  const combateBlock = content.match(/<combate>([\s\S]*?)<\/combate>/i);
  if (combateInitMatch) {
    combate = { iniciado: combateInitMatch[1].toLowerCase() === 'true' };
  } else if (combateBlock) {
    combate = { iniciado: true };
  }

  return {
    narrativa,
    segmentos: segmentos.length > 0 ? segmentos : undefined,
    fimDeTurno,
    solicitaDados: { solicita },
    acaoCompleta,
    combate,
    acoes,
    metadados
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
  // Remover tags HTML comuns que a IA pode injetar
  clean = clean.replace(/<br\s*\/?>/gi, '\n');
  clean = clean.replace(/<\/?(?:p|div|span|b|i|em|strong|ul|ol|li|h[1-6])[^>]*>/gi, '');
  // Remover blocos JSON soltos que a IA pode incluir (ex: segmentos, metadados)
  clean = clean.replace(/^\s*\{[\s\S]*?"(?:segmentos|narrativa|metadados|gancho|solicitaDados|combate|arcoStatus)"[\s\S]*\}\s*$/gm, '');
  clean = clean.replace(/^\s*\{[\s\S]{0,50}"(?:id|tipo)"[\s\S]*?\}\s*,?\s*$/gm, '');
  // Limpar linhas que sao apenas JSON fragments (linhas comecando com " ou {)
  clean = clean.replace(/^\s*"[a-zA-Z_]+"\s*:.*$/gm, '');
  clean = clean.replace(/^\s*[{}\[\],]+\s*$/gm, '');
  // Limpar linhas vazias excessivas
  clean = clean.replace(/\n{3,}/g, '\n\n').trim();

  return clean;
}

/**
 * Known action types for validation.
 */
const KNOWN_ACAO_TIPOS = new Set([
  'dar_item', 'remover_item', 'curar', 'aplicar_dano', 'aplicar_status',
  'remover_status', 'usar_habilidade', 'conjurar_magia', 'ativar_desvantagem',
  'aplicar_vantagem', 'aplicar_efeito', 'remover_efeito', 'dar_xp',
  'concentracao_quebrada', 'dano_ambiental', 'alterar_terreno', 'mudar_cenario',
  'estabilizar_personagem', 'danificar_equipamento', 'iniciar_fase_boss',
  'missao_batalha'
]);

/**
 * Post-parse validation with logging and minor auto-repairs.
 * Mutates respostaJSON in-place and returns void.
 */
function validateParseResult(respostaJSON, modelName, method) {
  if (!respostaJSON) return;

  // Auto-repair: normalize segmentos items missing tipo
  if (Array.isArray(respostaJSON.segmentos)) {
    for (const seg of respostaJSON.segmentos) {
      if (!seg.tipo) {
        seg.tipo = 'narracao';
      }
    }
  }

  // Auto-repair: normalize acao tipo with spaces to underscores
  if (Array.isArray(respostaJSON.acoes)) {
    for (const acao of respostaJSON.acoes) {
      if (acao.tipo && typeof acao.tipo === 'string') {
        acao.tipo = acao.tipo.replace(/\s+/g, '_');
      }
    }
  }

  // Warn: segmentos empty/missing
  if (!respostaJSON.segmentos || (Array.isArray(respostaJSON.segmentos) && respostaJSON.segmentos.length === 0)) {
    log.warn({ modelName, method }, 'Parse result: segmentos is empty or missing');
  }

  // Warn: acoes with unknown tipo
  if (Array.isArray(respostaJSON.acoes)) {
    for (const acao of respostaJSON.acoes) {
      if (acao.tipo && !KNOWN_ACAO_TIPOS.has(acao.tipo)) {
        log.warn({ modelName, method, tipo: acao.tipo }, 'Parse result: unknown acao tipo');
      }
    }
  }

  // Warn: metadados completely missing
  if (!respostaJSON.metadados) {
    log.warn({ modelName, method }, 'Parse result: metadados is missing');
  }

  // Validate arcoStatus format
  if (respostaJSON.arcoStatus) {
    if (typeof respostaJSON.arcoStatus !== 'object' || typeof respostaJSON.arcoStatus.concluido !== 'boolean') {
      log.warn({ modelName, method, arcoStatus: respostaJSON.arcoStatus }, 'Parse result: arcoStatus has invalid format, discarding');
      respostaJSON.arcoStatus = null;
    }
  }

  // Warn: solicitaDados.solicita true but teste or dificuldade empty
  if (respostaJSON.solicitaDados?.solicita === true) {
    if (!respostaJSON.solicitaDados.teste) {
      log.warn({ modelName, method }, 'Parse result: solicitaDados.solicita=true but teste is empty');
    }
    if (!respostaJSON.solicitaDados.dificuldade) {
      log.warn({ modelName, method }, 'Parse result: solicitaDados.solicita=true but dificuldade is empty');
    }
  }
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
  // Padrão expandido: com ou sem emoji 🎲, suporta d20, d12, d8, d6, 2d6, d100
  const match = narrativa.match(/(?:🎲\s*)?[Rr]ole\s+(\d*d\d+)\s+para\s+([^!(.]+?)(?:\s*!\s*\((?:[Dd]ificuldade:\s*)([^)]+)\)|\s*!)/);
  if (match) {
    const diceType = match[1] || 'd20';
    const teste = match[2].trim();
    const dificuldade = match[3]?.trim() || 'Média';
    log.info({ teste, dificuldade, diceType }, 'Fallback solicitaDados detectado na narrativa');
    respostaJSON.solicitaDados = {
      solicita: true,
      tipo: diceType,
      teste,
      dificuldade
    };
  }

  if (!respostaJSON.solicitaDados?.solicita) {
    const match2 = narrativa.match(/(?:[Ff]a[çc]a|[Rr]ealiz[ea])\s+um\s+teste\s+de\s+([A-Za-zÀ-ÿ\s]+?)(?:\s*[!.]|\s*\()/);
    if (match2) {
      const teste = match2[1].trim();
      log.info({ teste, dificuldade: 'Média' }, 'Fallback2 solicitaDados detectado');
      respostaJSON.solicitaDados = { solicita: true, tipo: 'd20', teste, dificuldade: 'Média' };
    }
  }

  if (!respostaJSON.solicitaDados?.solicita) {
    const match3 = narrativa.match(/[Tt]este\s+de\s+([A-Z][a-zà-ÿ]+)(?:\s*[!.,])/);
    if (match3) {
      const teste = match3[1].trim();
      log.info({ teste, dificuldade: 'Média' }, 'Fallback3 solicitaDados detectado');
      respostaJSON.solicitaDados = { solicita: true, tipo: 'd20', teste, dificuldade: 'Média' };
    }
  }
}

/**
 * Fallback: extrai gancho da última frase da narrativa quando o LLM não forneceu.
 * Só aplica quando fimDeTurno é false e não há solicitação de dados (o teste já é o gancho).
 */
function fallbackGancho(respostaJSON) {
  if (respostaJSON?.gancho) return;
  if (respostaJSON?.fimDeTurno) return;
  if (respostaJSON?.solicitaDados?.solicita) return;

  const narrativa = respostaJSON?.narrativa || '';
  if (!narrativa) return;

  const sentences = narrativa.split(/(?<=[.!?])\s+/).filter(s => s.trim());
  if (sentences.length > 0) {
    const lastSentence = sentences[sentences.length - 1].trim();
    if (lastSentence.length > 10 && lastSentence.length < 300) {
      respostaJSON.gancho = lastSentence;
      log.info({ ganchoLength: lastSentence.length }, 'Fallback gancho extraido da narrativa');
    }
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

  let segmentos = normalizeNarrationSegments(respostaJSON?.segmentos, {
    fallbackText: narrativaBase
  });

  const narrativa = narrativaBase || aggregateNarrationFromSegments(segmentos);

  // Guard: if segments cover significantly less text than narrativa,
  // replace with a single fallback segment containing the full narrativa.
  // This prevents the frontend from showing truncated content.
  if (narrativa && segmentos.length > 0) {
    const segTexto = segmentos.map(s => s.text || '').join('').length;
    if (segTexto < narrativa.length * 0.7) {
      segmentos = normalizeNarrationSegments([], { fallbackText: narrativa });
    }
  }

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

function resolveHistoriaConfig(agent, runtimeOptions = {}) {
  return runtimeOptions?.historiaConfig || agent?.mestreContexto?.historia?.config || null;
}

function normalizePromptSignal(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function analyzePlayerMessageForPromptHints(mensagem) {
  const normalized = normalizePromptSignal(mensagem);

  return {
    acceptedMission: /\b(pode contar comigo|conte comigo|conta comigo|eu vou|farei isso|eu cuido disso|deixe comigo|pode deixar comigo|vou resolver|aceito)\b/.test(normalized),
    askedAboutObject: /\b(o que e|o que pe|que e isso|que pergaminho|este pergaminho|essa nota|esse mapa|essa chave|essa porta|esse selo)\b/.test(normalized),
    objectMentioned: /\b(pergaminho|nota|mapa|porta|selo|chave|livro|altar|corredor|escada)\b/.test(normalized)
  };
}

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
      const rawTokens = this.configOverride?.max_tokens ?? MESTRE_CONFIG.model.maxTokens;
      const maxTokens = Math.min(32000, Math.max(100, rawTokens));

      // Fallback de modelos deprecados
      if (DEPRECATED_MODELS[modelName]) {
        const newModel = DEPRECATED_MODELS[modelName];
        log.warn({ from: modelName, to: newModel }, 'Modelo deprecado, migrando');
        modelName = newModel;
      }

      this.modelName = modelName;

      // Per-model temperature/topP (configOverride still wins)
      const modelParams = getModelParams(modelName);
      const rawTemp = this.configOverride?.temperatura ?? modelParams.temperature;
      const temperature = Math.min(2, Math.max(0, rawTemp));
      const topP = modelParams.topP;

      log.debug({ modelName, temperature, topP }, 'Resolved model params');

      // Detectar provider pelo prefixo do modelo
      const provider = detectProvider(modelName);
      if (provider === 'gemini') {
        this.model = new ChatGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_API_KEY,
          model: modelName,
          temperature,
          maxOutputTokens: maxTokens,
          responseMimeType: 'application/json',
        });
        log.info({ provider: 'gemini', modelName, temperature }, 'Modelo inicializado');
      } else if (provider === 'anthropic') {
        this.model = new ChatAnthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: modelName,
          temperature,
          maxTokens,
        });
        // LangChain sets topP=-1 by default which Anthropic rejects;
        // also Claude 4.x doesn't allow temperature+top_p together
        this.model.topP = undefined;
        log.info({ provider: 'anthropic', modelName, temperature }, 'Modelo inicializado');
      } else {
        this.model = new ChatGroq({
          apiKey: process.env.GROQ_API_KEY,
          model: modelName,
          temperature,
          maxTokens,
          topP
        });
        log.info({ provider: 'groq', modelName, temperature, topP }, 'Modelo inicializado');
      }

      // Choose schema variant based on provider (compact for Groq to save context)
      const schemaVariant = provider === 'groq' ? 'compact' : 'full';

      // Build system prompt with plain braces (not escaped for LangChain templates).
      // We inject the system message directly to avoid ChatPromptTemplate
      // interpreting JSON braces as template variables.
      const promptSistema = criarPromptSistema(
        this.temas,
        this.personagens,
        this.configOverride,
        this.catalogo,
        this.roteiroCondensado,
        this.contextoPersistenteFormatado,
        { schemaVariant }
      );
      const systemMessage = new SystemMessage(promptSistema);

      // Store provider info for downstream use
      this.provider = provider;

      // Build the chain using direct message construction to avoid
      // LangChain template parser misinterpreting JSON braces in schema
      const model = this.model;
      this.chain = RunnableSequence.from([
        new RunnableLambda({
          func: (input) => {
            const messages = [
              systemMessage,
              ...(input.chat_history || []),
              new HumanMessage(input.input)
            ];
            return messages;
          }
        }),
        model
      ]);

      log.info({ provider, schemaVariant }, 'Chain criada com sucesso');
    } catch (error) {
      log.error({ err: error.message }, 'Erro ao inicializar modelo');
      this.model = null;
      this.chain = null;
    }
  }

  /**
   * Narra uma ação do jogador
   */
  async narrarAcao({
    jogador,
    personagem,
    acao,
    chatHistory = [],
    resumo = null,
    contextoLateralRoleplay = '',
    lockContinuidade = '',
    runtimeOptions = {}
  }) {
    const startTime = Date.now();
    try {
      const retryAttempts = runtimeOptions.retryOnTimeout === false ? 0 : MESTRE_CONFIG.model.retryAttempts;
      const timeoutMs = runtimeOptions.timeoutMs ?? MESTRE_CONFIG.model.timeout;
      const historiaConfig = resolveHistoriaConfig(this, runtimeOptions);
      log.info({ personagem }, 'Narrando acao');

      // Formatar input
      const input = criarPromptNarracao(jogador, personagem, acao);

      // Converter histórico
      const promptBlocks = [];
      const historiaConfigPrompt = buildHistoriaConfigPrompt(historiaConfig);
      if (historiaConfigPrompt) promptBlocks.push(historiaConfigPrompt);
      if (lockContinuidade) promptBlocks.push(lockContinuidade);
      if (contextoLateralRoleplay) promptBlocks.push(contextoLateralRoleplay);
      promptBlocks.push(input);
      const inputCompleto = promptBlocks.join('\n\n');

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
      const response = await withRetry(() => withTimeout(invokeOrStream(this.chain, {
        input: inputCompleto,
        chat_history: historico
      }, this.provider), timeoutMs), retryAttempts);

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
      validateParseResult(respostaJSON, this.modelName, 'narrarAcao');

      // Fallback: detectar solicitação de dados na narrativa se JSON não incluiu
      fallbackSolicitaDados(respostaJSON);
      fallbackGancho(respostaJSON);
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
        gancho: respostaJSON.gancho || null,
        arcoStatus: respostaJSON.arcoStatus || null,
        jogador,
        personagem,
        acao,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      log.error({ err: error.message }, 'Erro ao narrar acao');
      if (runtimeOptions.throwOnFailure) {
        throw error;
      }
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
  async narrarAcaoStream({
    jogador,
    personagem,
    acao,
    chatHistory = [],
    resumo = null,
    contextoLateralRoleplay = '',
    lockContinuidade = '',
    runtimeOptions = {}
  }, callbacks = {}) {
    const { onStreamStart, onChunk, onStreamEnd, onError } = callbacks;
    const startTime = Date.now();

    try {
      log.info({ personagem }, 'Narrando acao (stream)');
      const timeoutMs = runtimeOptions.timeoutMs ?? MESTRE_CONFIG.model.timeout;
      const historiaConfig = resolveHistoriaConfig(this, runtimeOptions);

      const input = criarPromptNarracao(jogador, personagem, acao);
      const promptBlocks = [];
      const historiaConfigPrompt = buildHistoriaConfigPrompt(historiaConfig);
      if (historiaConfigPrompt) promptBlocks.push(historiaConfigPrompt);
      if (lockContinuidade) promptBlocks.push(lockContinuidade);
      if (contextoLateralRoleplay) promptBlocks.push(contextoLateralRoleplay);
      promptBlocks.push(input);
      const inputCompleto = promptBlocks.join('\n\n');
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
      const streamTimeout = timeoutMs * 2;

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
      validateParseResult(respostaJSON, this.modelName, 'narrarAcaoStream');

      fallbackSolicitaDados(respostaJSON);
      fallbackGancho(respostaJSON);
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
        gancho: respostaJSON.gancho || null,
        arcoStatus: respostaJSON.arcoStatus || null,
        jogador, personagem, acao,
        timestamp: new Date().toISOString()
      };

      onStreamEnd?.(result);

      log.info({ duracao: Date.now() - startTime, narracaoLength: narrativa?.length || 0 }, 'Narracao stream concluida');
      return result;
    } catch (error) {
      log.error({ err: error.message }, 'Erro ao narrar acao (stream), fallback para invoke');
      onError?.(error);
      if (runtimeOptions.throwOnFailure) {
        throw error;
      }
      return this.narrarAcao({
        jogador,
        personagem,
        acao,
        chatHistory,
        resumo,
        contextoLateralRoleplay,
        lockContinuidade,
        runtimeOptions
      });
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
      const response = await withRetry(() => withTimeout(invokeOrStream(this.chain, {
        input,
        chat_history: []
      }, this.provider)));

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
      validateParseResult(respostaJSON, this.modelName, 'iniciarSessao');

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

      const response = await withTimeout(invokeOrStream(this.chain, {
        input,
        chat_history: historico
      }, this.provider));

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
    contextoLateralRoleplay = '',
    runtimeOptions = {}
  }) {
    const startTime = Date.now();
    try {
      const retryAttempts = runtimeOptions.retryOnTimeout === false ? 0 : MESTRE_CONFIG.model.retryAttempts;
      const timeoutMs = runtimeOptions.timeoutMs ?? MESTRE_CONFIG.model.timeout;
      const historiaConfig = resolveHistoriaConfig(this, runtimeOptions);
      const maxAcoesPorTurno = getTurnActionLimit(historiaConfig);
      log.info({ turno, personagem, rodada }, 'Narrando turno');

      // Criar prompt específico para turno usando funções extraídas
      let input;
      if (contadorMensagens >= maxAcoesPorTurno - 1) {
        input = criarPromptTurnoFinal(jogador, personagem, mensagem, rodada, turno);
      } else if (contadorMensagens === 0) {
        input = criarPromptTurnoPrimeira(jogador, personagem, mensagem, rodada, turno, maxAcoesPorTurno, contadorMensagens);
      } else {
        input = criarPromptTurnoSeguinte(jogador, personagem, mensagem, rodada, turno, maxAcoesPorTurno, contadorMensagens);
      }

      // Converter histórico
      const promptHints = analyzePlayerMessageForPromptHints(mensagem);

      input += `\n${buildHistoriaConfigPrompt(historiaConfig)}\n`;

      if (promptHints.acceptedMission) {
        input += `\nGUIA ESPECIFICO PARA ESTA MENSAGEM:\n- O jogador JA aceitou ajudar. Nao repita o briefing, nao tente convence-lo de novo e nao reembale a mesma missao.\n- Faca o NPC avancar para o proximo passo imediato: entregar um item, abrir caminho, apontar uma porta, revelar um detalhe pratico, chamar para segui-lo ou oferecer uma escolha localizada.\n- Se houver um objeto importante em cena, coloque esse objeto fisicamente na mao, mesa ou campo de visao do jogador.\n`;
      }

      if (promptHints.askedAboutObject || promptHints.objectMentioned) {
        input += `\nGUIA ESPECIFICO PARA OBJETO/PISTA:\n- O jogador esta focando um objeto, pista ou detalhe concreto da cena.\n- Responda ao objeto de forma tangivel: mostre, entregue, leia um trecho curto, descreva a marca, aponte a origem ou faca o NPC estender isso ao jogador.\n- Depois da resposta, feche com um encaixe imediato ligado a esse mesmo foco, sem voltar ao briefing geral da missao.\n`;
      }

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
      const response = await withRetry(() => withTimeout(invokeOrStream(this.chain, {
        input,
        chat_history: historico
      }, this.provider), timeoutMs), retryAttempts);

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
      validateParseResult(respostaJSON, this.modelName, 'narrarTurnoJogador');

      // Fallback: detectar solicitação de dados na narrativa se JSON não incluiu
      fallbackSolicitaDados(respostaJSON);
      fallbackGancho(respostaJSON);
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
        gancho: respostaJSON.gancho || null,
        rodada,
        turno,
        jogador,
        personagem,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      log.error({ err: error.message }, 'Erro ao narrar turno');
      if (runtimeOptions.throwOnFailure) {
        throw error;
      }
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

      const response = await withRetry(() => withTimeout(invokeOrStream(this.chain, {
        input,
        chat_history: historico
      }, this.provider)));

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
      validateParseResult(respostaJSON, this.modelName, 'narrarEntreRodadas');

      fallbackGancho(respostaJSON);
      const { narrativa: rawNarrativa, segmentos } = normalizeRespostaSegmentos(respostaJSON);
      const narrativa = sanitizeNarrativa(rawNarrativa);

      return {
        narrativa,
        segmentos,
        combate: respostaJSON.combate || null,
        acoes: respostaJSON.acoes || [],
        metadados: respostaJSON.metadados || {},
        gancho: respostaJSON.gancho || null,
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
      const response = await withRetry(() => withTimeout(invokeOrStream(this.chain, {
        input: inputCompleto,
        chat_history: historico.slice(-HISTORY_LIMIT)
      }, this.provider)));
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

// ── Exports internos para testes ──
export {
  parseIAJson,
  parseXMLLikeResponse,
  sanitizeNarrativa,
  fallbackSolicitaDados,
  fallbackGancho,
  extrairTeste,
  normalizeRespostaSegmentos,
  validateParseResult,
  NarrativaExtractor,
  KNOWN_ACAO_TIPOS,
};

