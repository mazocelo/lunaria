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

import logger from '../../helpers/logger.js';
import { sanitizeCharacterName, sanitizePromptInput } from '../../helpers/sanitize.js';
import { CRIADOR_CONFIG, detectProvider, ETAPAS, TRANSICOES } from './config.js';
import { sanitizeEtapaProxima, shouldLockStage, resolveContinueStage, getPolicy, getStagePolicy } from './stages/stagePolicy.js';
import { tierDesbloqueado } from '../../helpers/evolucaoHelper.js';
import { getFallbackMessage, gerarAtributosFallback as gerarAtributosFallbackPolicy } from './stages/stageFallbacks.js';

const log = logger.child({ module: 'MestreCriadorAgent' });
import { DEPRECATED_MODELS } from '../Mestre/config.js';
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

async function withRetry(fn, retries) {
  if (retries === undefined) retries = 1;
  try {
    return await fn();
  } catch (error) {
    if (error.message === 'AI_TIMEOUT' && retries > 0) {
      log.warn('AI timeout, retrying');
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
  log.warn({ rawContent: content.substring(0, 300) }, 'JSON parse falhou');
  return null;
}

// Etapas que DEVEM ter sugestões (por sistema)
const ETAPAS_COM_SUGESTOES_LUNARIA = ['boas_vindas', 'raca', 'classe', 'background', 'vantagens', 'desvantagens'];
const ETAPAS_COM_SUGESTOES_TRESDET = ['boas_vindas', 'conceito', 'vantagens', 'desvantagens'];
const ETAPAS_COM_SUGESTOES_DND5E = ['boas_vindas', 'raca', 'classe', 'background', 'skills'];

function getEtapasComSugestoes(sistema) {
  if (sistema === 'tresdet') return ETAPAS_COM_SUGESTOES_TRESDET;
  if (sistema === 'dnd5e') return ETAPAS_COM_SUGESTOES_DND5E;
  return ETAPAS_COM_SUGESTOES_LUNARIA;
}

const NOME_INICIOS = ['Aer', 'Bel', 'Cael', 'Dar', 'Ela', 'Fen', 'Gal', 'Ily', 'Kae', 'Lun', 'Mor', 'Nyr', 'Or', 'Rae', 'Syl', 'Tha', 'Val', 'Ysa', 'Zer'];
const NOME_MEIOS = ['a', 'ae', 'ai', 'e', 'ei', 'ia', 'io', 'o', 'oa', 'u', 'ya'];
const NOME_FINAIS = ['dan', 'dris', 'eth', 'ian', 'ira', 'is', 'or', 'orin', 'ra', 'ran', 'ria', 'rys', 'th', 'ther', 'vor', 'wyn', 'xis', 'ya'];

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

function capitalizar(valor) {
  return valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase();
}

function gerarNomesFallback(quantidade = 8) {
  const usados = new Set();
  const nomes = [];
  let tentativas = 0;

  while (nomes.length < quantidade && tentativas < quantidade * 20) {
    tentativas += 1;
    const inicio = NOME_INICIOS[Math.floor(Math.random() * NOME_INICIOS.length)];
    const meio = NOME_MEIOS[Math.floor(Math.random() * NOME_MEIOS.length)];
    const final = NOME_FINAIS[Math.floor(Math.random() * NOME_FINAIS.length)];
    const nome = capitalizar(`${inicio}${meio}${final}`);

    if (usados.has(nome)) continue;
    usados.add(nome);
    nomes.push({ tipo: 'nome', id: null, nome, descricao: '' });
  }

  if (nomes.length < quantidade) {
    return shuffle([
      { tipo: 'nome', id: null, nome: 'Caelor', descricao: '' },
      { tipo: 'nome', id: null, nome: 'Zephira', descricao: '' },
      { tipo: 'nome', id: null, nome: 'Mireth', descricao: '' },
      { tipo: 'nome', id: null, nome: 'Ashara', descricao: '' },
      { tipo: 'nome', id: null, nome: 'Thalor', descricao: '' },
      { tipo: 'nome', id: null, nome: 'Selka', descricao: '' },
      { tipo: 'nome', id: null, nome: 'Darian', descricao: '' },
      { tipo: 'nome', id: null, nome: 'Ysora', descricao: '' },
    ]).slice(0, quantidade);
  }

  return nomes;
}


/** Gera sugestões fallback do catálogo quando IA retorna vazio */
async function gerarFallbackSugestoes(etapa, estado, excluirIds = new Set(), sistema) {
  try {
    const { racas, classes, vantagens: vantagensRaw, desvantagens: desvantagensRaw } = await fetchCatalogo(sistema);
    const tier = tierDesbloqueado(estado.nivel || 1);
    const vantagens = vantagensRaw.filter(v => (v.nivel || 1) <= tier);
    const desvantagens = desvantagensRaw.filter(d => (d.nivel || 1) <= tier);

    if (etapa === 'raca') {
      const disponiveis = racas.filter(r => !excluirIds.has(String(r.id)));
      const shuffled = [...disponiveis].sort(() => Math.random() - 0.5).slice(0, 5);
      return shuffled.map(r => ({
        tipo: 'raca', id: r.id, nome: r.nome,
        descricao: r.descricao || '', custo: r.custo ?? 0,
        imagem: r.imagem || null,
      }));
    }

    if (etapa === 'classe') {
      const disponiveis = classes.filter(c => !excluirIds.has(String(c.id)));
      const shuffled = [...disponiveis].sort(() => Math.random() - 0.5).slice(0, 4);
      return shuffled.map(c => ({
        tipo: 'classe', id: c.id, nome: c.nome,
        descricao: c.descricao || '', custo: c.custo ?? 0,
        imagem: c.imagem || null,
      }));
    }

    if (etapa === 'vantagens') {
      const jaSelecionados = new Set((estado.vantagens_ids || []).map(String));
      const compraveis = vantagens.filter(v => (v.custo > 0 || v.compravel !== false) && !jaSelecionados.has(String(v.id)) && !excluirIds.has(String(v.id)));
      const shuffled = [...compraveis].sort(() => Math.random() - 0.5).slice(0, 4);
      return shuffled.map(v => ({
        tipo: 'vantagem', id: v.id, nome: v.nome,
        descricao: v.descricao || '', custo: v.custo ?? 0,
      }));
    }

    if (etapa === 'desvantagens') {
      const jaSelecionados = new Set((estado.desvantagens_ids || []).map(String));
      const disponiveis = desvantagens.filter(d => !jaSelecionados.has(String(d.id)) && !excluirIds.has(String(d.id)));
      const shuffled = [...disponiveis].sort(() => Math.random() - 0.5).slice(0, 4);
      return shuffled.map(d => ({
        tipo: 'desvantagem', id: d.id, nome: d.nome,
        descricao: d.descricao || '', custo: d.custo ?? 0,
      }));
    }

    if (etapa === 'background') {
      const raca = estado.raca_nome || 'aventureiro';
      const classe = estado.classe_nome || 'guerreiro';
      return [
        { tipo: 'background', id: null, nome: `${raca} orfao criado em terras selvagens`, descricao: `Cresceu sem pais, aprendendo a sobreviver pela forca de vontade e determinacao.` },
        { tipo: 'background', id: null, nome: `Ex-soldado ${classe} que desertou por principios`, descricao: `Serviu fielmente ate testemunhar algo que mudou tudo.` },
        { tipo: 'background', id: null, nome: `Aprendiz de ${classe} que fugiu de seu mestre`, descricao: `Descobriu um segredo sombrio e agora busca seu proprio caminho.` },
        { tipo: 'background', id: null, nome: `${raca} nobre exilado em busca de redencao`, descricao: `Nascido com privilegios, agora deve provar seu valor sem eles.` },
      ];
    }

    if (etapa === 'conceito') {
      const nome = estado.nome || 'heroi';
      return [
        { tipo: 'conceito', id: null, nome: `Guerreiro honrado`, descricao: `Um combatente leal que segue um codigo de honra rigido.` },
        { tipo: 'conceito', id: null, nome: `Mago errante`, descricao: `Um estudioso das artes arcanas que viaja em busca de conhecimento proibido.` },
        { tipo: 'conceito', id: null, nome: `Ladino das sombras`, descricao: `Especialista em furtividade que usa astucia para sobreviver.` },
        { tipo: 'conceito', id: null, nome: `Protetor da natureza`, descricao: `Um guardiao que defende o equilibrio natural contra ameacas.` },
      ];
    }

    if (etapa === 'skills') {
      // Fallback generico de skills D&D 5e
      const allSkills = [
        'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
        'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
        'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
        'Sleight of Hand', 'Stealth', 'Survival',
      ];
      const jaEscolhidas = new Set(estado.skills || []);
      const disponiveis = allSkills.filter(s => !jaEscolhidas.has(s));
      return disponiveis.slice(0, 6).map(s => ({
        tipo: 'skill', id: null, nome: s, descricao: '', custo: 0,
      }));
    }

    if (etapa === 'boas_vindas') {
      return gerarNomesFallback(8);
    }

    return [];
  } catch (err) {
    log.warn({ err }, 'Falha ao gerar fallback de sugestoes');
    return [];
  }
}

// gerarAtributosFallback agora vem de stageFallbacks.js
const gerarAtributosFallback = gerarAtributosFallbackPolicy;

// Tipo esperado de sugestao — derivado da policy
function getTipoEsperado(etapa, sistema) {
  return getPolicy(etapa, sistema).suggestionType || null;
}

/**
 * Valida e sanitiza sugestões da IA.
 * @param {Array} sugestoes
 * @param {string} etapaAtual
 * @param {string} etapaDestino
 * @param {Object} [idsPermitidos] - Sets de IDs permitidos por tipo: { raca, classe, vantagem, desvantagem }
 * @param {string} [sistema]
 */
function sanitizarSugestoes(sugestoes, etapaAtual, etapaDestino, idsPermitidos, sistema) {
  if (!Array.isArray(sugestoes)) return [];
  // Aceitar tipo da etapa atual OU da etapa destino
  const tiposAceitos = new Set();
  const tipoAtual = getTipoEsperado(etapaAtual, sistema);
  const tipoDestino = getTipoEsperado(etapaDestino, sistema);
  if (tipoAtual) tiposAceitos.add(tipoAtual);
  if (tipoDestino) tiposAceitos.add(tipoDestino);

  return sugestoes.filter(s => {
    // Toda sugestão precisa ter tipo e nome
    if (!s.tipo || !s.nome) {
      log.warn({ sugestao: s }, 'Sugestao sem tipo/nome descartada');
      return false;
    }
    // Validar que o tipo corresponde à etapa atual ou destino
    if (tiposAceitos.size > 0 && !tiposAceitos.has(s.tipo)) {
      log.warn({ etapaAtual, etapaDestino, tipo: s.tipo, nome: s.nome, aceitos: [...tiposAceitos] }, 'Sugestao com tipo invalido descartada');
      return false;
    }
    // Sugestões de catálogo (raça, classe, vantagem, desvantagem) precisam de ID
    if (['raca', 'classe', 'vantagem', 'desvantagem'].includes(s.tipo) && !s.id) {
      log.warn({ tipo: s.tipo, nome: s.nome }, 'Sugestao de catalogo sem ID descartada');
      return false;
    }
    // Validar ID contra catálogo permitido para o nível atual
    if (idsPermitidos && s.id && idsPermitidos[s.tipo]) {
      if (!idsPermitidos[s.tipo].has(String(s.id))) {
        log.warn({ tipo: s.tipo, id: s.id, nome: s.nome }, 'Sugestao com ID fora do catalogo permitido descartada');
        return false;
      }
    }
    return true;
  }).map(s => {
    if (s.tipo === 'nome') {
      return { ...s, nome: sanitizeCharacterName(s.nome) };
    }
    return s;
  });
}

/** Constrói sets de IDs permitidos por tipo para o nível atual */
async function buildIdsPermitidos(nivel, sistema) {
  const { racas, classes, vantagens, desvantagens } = await fetchCatalogo(sistema);
  const tier = tierDesbloqueado(nivel);
  return {
    raca: new Set(racas.map(r => String(r.id))),
    classe: new Set(classes.map(c => String(c.id))),
    vantagem: new Set(vantagens.filter(v => (v.nivel || 1) <= tier).map(v => String(v.id))),
    desvantagem: new Set(desvantagens.filter(d => (d.nivel || 1) <= tier).map(d => String(d.id))),
  };
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

/**
 * Extrai nomes/IDs de sugestões já mostradas do histórico de chat.
 * Percorre as mensagens da IA buscando JSONs com campo "sugestoes".
 */
function extrairSugestoesAnteriores(historico, etapa) {
  const nomes = new Set();
  const ids = new Set();
  if (!Array.isArray(historico)) return { nomes, ids };

  for (const msg of historico) {
    if (msg.role === 'user' || msg.tipo === 'jogador') continue;
    const content = msg.content || msg.texto || '';
    const parsed = parseIAJson(content);
    if (parsed?.sugestoes && Array.isArray(parsed.sugestoes)) {
      for (const s of parsed.sugestoes) {
        if (s.nome) nomes.add(s.nome);
        if (s.id) ids.add(String(s.id));
      }
    }
  }
  return { nomes, ids };
}

function construirInput(etapa, estado, mensagemJogador, { historico, actionMode, sistema } = {}) {
  const isTresDet = sistema === 'tresdet';
  const isDnd5e = sistema === 'dnd5e';
  const etapasComSugestoes = getEtapasComSugestoes(sistema);
  const parts = [`[ETAPA ATUAL: ${etapa}]`];

  // Seed aleatório para variar sugestões de nomes
  if (etapa === 'boas_vindas') {
    const shuffled = [...MITOLOGIAS].sort(() => Math.random() - 0.5).slice(0, 5);
    parts.push(`[SEED DE VARIAÇÃO: use inspiração primária em mitologia ${shuffled.join(', ')}. Semente aleatória: ${Math.random().toString(36).substring(2, 8)}]`);
  }

  // Contexto do personagem construído até agora
  if (estado.nome) parts.push(`Nome do personagem: ${sanitizeCharacterName(estado.nome)}`);

  if (isTresDet) {
    // 3D&T: conceito em vez de raca/classe
    if (estado.conceito) parts.push(`Conceito: ${estado.conceito}`);
    if (estado.caracteristicas) {
      const c = estado.caracteristicas;
      parts.push(`Características: F:${c.forca} H:${c.habilidade} R:${c.resistencia} A:${c.armadura} PdF:${c.poder_de_fogo}`);
    }
  } else if (isDnd5e) {
    // D&D 5e: race/class/background/ability scores/skills
    if (estado.raca_nome) parts.push(`Race: ${estado.raca_nome} (ID:${estado.raca_id})`);
    if (estado.classe_nome) parts.push(`Class: ${estado.classe_nome} (ID:${estado.classe_id})`);
    if (estado.background) parts.push(`Background: ${estado.background}`);
    if (estado.atributos) {
      const a = estado.atributos;
      parts.push(`Ability Scores: STR:${a.forca} DEX:${a.destreza} CON:${a.constituicao} INT:${a.inteligencia} WIS:${a.sabedoria} CHA:${a.carisma}`);
    }
    if (estado.skills?.length) parts.push(`Skill Proficiencies: ${estado.skills.join(', ')}`);
  } else {
    // Lunaria: raca/classe/background/atributos
    if (estado.raca_nome) parts.push(`Raça escolhida: ${estado.raca_nome} (ID:${estado.raca_id})`);
    if (estado.classe_nome) parts.push(`Classe escolhida: ${estado.classe_nome} (ID:${estado.classe_id})`);
    if (estado.background) parts.push(`Background: ${estado.background}`);
    if (estado.atributos) {
      const attrs = estado.atributos;
      parts.push(`Atributos: FOR:${attrs.forca} DES:${attrs.destreza} CON:${attrs.constituicao} INT:${attrs.inteligencia} AGI:${attrs.agilidade} CAR:${attrs.carisma}`);
    }
  }

  if (estado.vantagens_nomes?.length) parts.push(`Vantagens: ${estado.vantagens_nomes.join(', ')}`);
  if (estado.desvantagens_nomes?.length) parts.push(`Desvantagens: ${estado.desvantagens_nomes.join(', ')}`);

  // Lembrete de contextualização para sugestões
  const etapasContextuais = isTresDet
    ? ['vantagens', 'desvantagens']
    : isDnd5e
      ? ['classe', 'background', 'skills']
      : ['classe', 'vantagens', 'desvantagens', 'background'];
  if (etapasContextuais.includes(etapa)) {
    parts.push(`[LEMBRETE: Suas sugestões DEVEM ser coerentes com as escolhas anteriores do personagem. Sugira opções que combinem narrativamente.]`);
  }

  // Anti-repetição: listar sugestões já mostradas, já selecionadas, e ganhas por raça/classe
  const excluir = new Set();

  // Itens já selecionados pelo jogador
  if (!isTresDet) {
    if (estado.raca_nome) excluir.add(estado.raca_nome);
    if (estado.classe_nome) excluir.add(estado.classe_nome);
  }
  if (estado.vantagens_nomes?.length) estado.vantagens_nomes.forEach(n => excluir.add(n));
  if (estado.desvantagens_nomes?.length) estado.desvantagens_nomes.forEach(n => excluir.add(n));
  if (isDnd5e && estado.skills?.length) estado.skills.forEach(n => excluir.add(n));

  // Vantagens/desvantagens concedidas automaticamente pela raça/classe (apenas Lunaria)
  if (!isTresDet && !isDnd5e) {
    if (estado.vantagens_da_raca?.length) estado.vantagens_da_raca.forEach(n => excluir.add(n));
    if (estado.desvantagens_da_raca?.length) estado.desvantagens_da_raca.forEach(n => excluir.add(n));
    if (estado.vantagens_da_classe?.length) estado.vantagens_da_classe.forEach(n => excluir.add(n));
    if (estado.desvantagens_da_classe?.length) estado.desvantagens_da_classe.forEach(n => excluir.add(n));
  }

  // Sugestões já mostradas no histórico
  if (historico) {
    const { nomes } = extrairSugestoesAnteriores(historico, etapa);
    nomes.forEach(n => excluir.add(n));
  }

  if (excluir.size > 0 && etapasComSugestoes.includes(etapa)) {
    parts.push(`[IMPORTANTE: NÃO sugira nenhum destes itens já mostrados, selecionados ou concedidos: ${[...excluir].join(', ')}. Sugira APENAS opções novas e diferentes.]`);
  }

  // Restrições de raça/classe (Lunaria)
  if (!isTresDet && !isDnd5e && ['vantagens', 'desvantagens'].includes(etapa) && (estado.raca_nome || estado.classe_nome)) {
    parts.push(`[RESTRIÇÕES: Considere que o personagem é ${estado.raca_nome || '?'} / ${estado.classe_nome || '?'}. Sugira apenas vantagens/desvantagens compatíveis com essa combinação. Se um item tiver restrição de raça ou classe que não corresponda, NÃO o sugira.]`);
  }

  // Restrições de conceito (3D&T)
  if (isTresDet && ['vantagens', 'desvantagens'].includes(etapa) && estado.conceito) {
    parts.push(`[RESTRIÇÕES: O conceito do personagem é "${estado.conceito}". Sugira apenas vantagens/desvantagens coerentes com esse conceito.]`);
  }

  // Restrições de classe (D&D 5e skills)
  if (isDnd5e && etapa === 'skills' && estado.classe_nome) {
    parts.push(`[RESTRIÇÕES: Liste APENAS as skill proficiencies disponíveis para a classe ${estado.classe_nome}. Indique quantas o jogador pode escolher.]`);
  }

  parts.push(`\nMensagem do jogador: ${mensagemJogador}`);
  parts.push(`\n[FORMATO OBRIGATÓRIO: Responda APENAS com JSON válido. Nenhum texto antes ou depois do JSON. Comece com { e termine com }]`);
  return parts.join('\n');
}

// Singleton: modelo (reutilizado entre requests)
// Prompt é construído por request com catálogo filtrado por tier
let _model = null;
let _modelName = null;

function getModel() {
  if (_model) return { model: _model, modelName: _modelName };

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

  _model = model;
  log.info({ provider, modelName }, 'Modelo inicializado');
  return { model: _model, modelName: _modelName };
}

/** Constrói chain por request com catálogo filtrado pelo nível e sistema do estado */
async function buildChainForRequest(estado, sistema) {
  const { model, modelName } = getModel();
  const nivelEfetivo = estado.nivel || 1;
  const catalogo = await buildCatalogoCriacao(nivelEfetivo, sistema);
  const promptSistema = criarPromptSistemaCriador(catalogo, sistema);

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', promptSistema],
    new MessagesPlaceholder('chat_history'),
    ['human', '{input}'],
  ]);

  const chain = RunnableSequence.from([
    {
      input: (input) => input.input,
      chat_history: (input) => input.chat_history || [],
    },
    prompt,
    model,
  ]);

  return { chain, modelName };
}

/** Invalida modelo cached (ex: se config mudou) */
export function invalidarChain() {
  _model = null;
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
 * @param {string} params.sistema - Sistema de jogo ('lunaria' | 'tresdet' | 'dnd5e')
 * @returns {Object} { mensagem, sugestoes, etapa_proxima, atributos_sugeridos }
 */
export async function interagir({ etapa, estado, mensagemJogador, historico = [], userId, actionMode = 'reply', sistema }) {
  const startTime = Date.now();
  // Resolver sistema: parametro explicito > estado > default
  const sistemaEfetivo = sistema || estado?.sistema || 'lunaria';
  log.debug({ sistema: sistemaEfetivo, etapa, actionMode }, 'MestreCriador: sistema resolvido');
  const { stageOrder } = getStagePolicy(sistemaEfetivo);
  const etapasComSugestoes = getEtapasComSugestoes(sistemaEfetivo);

  // Validar etapa
  if (!stageOrder.includes(etapa)) {
    throw new Error(`Etapa inválida para sistema ${sistemaEfetivo}: ${etapa}`);
  }

  // Etapas que NÃO usam cards de sugestão (usam UI própria)
  const ETAPAS_SEM_CARDS_LUNARIA = ['atributos', 'equipamentos', 'grimorio', 'resumo'];
  const ETAPAS_SEM_CARDS_TRESDET = ['caracteristicas', 'equipamentos', 'magias', 'resumo'];
  const ETAPAS_SEM_CARDS_DND5E = ['atributos', 'equipamentos', 'spells', 'resumo'];
  const etapasSemCards = sistemaEfetivo === 'tresdet'
    ? ETAPAS_SEM_CARDS_TRESDET
    : sistemaEfetivo === 'dnd5e'
      ? ETAPAS_SEM_CARDS_DND5E
      : ETAPAS_SEM_CARDS_LUNARIA;

  try {
    const { chain, modelName } = await buildChainForRequest(estado, sistemaEfetivo);

    const input = construirInput(etapa, estado, mensagemJogador, { historico, actionMode, sistema: sistemaEfetivo });
    const chatHistory = converterHistorico(historico).slice(-20);

    const response = await withRetry(() => withTimeout(chain.invoke({
      input,
      chat_history: chatHistory,
    })));

    trackUsage(response, modelName, userId, startTime);

    // Parse da resposta
    let resultado = parseIAJson(response.content);
    if (!resultado) {
      const policy = getPolicy(etapa, sistemaEfetivo);
      log.warn({ etapa, rawContent: String(response.content).slice(0, 400) }, 'Fallback - IA nao retornou JSON valido');
      resultado = {
        mensagem: getFallbackMessage(etapa) || 'Ocorreu um erro. Tente novamente.',
        sugestoes: [],
        etapa_proxima: policy.defaultNext || etapa,
        atributos_sugeridos: null,
      };
    }

    // Validar etapa_proxima via policy
    resultado.etapa_proxima = sanitizeEtapaProxima(etapa, resultado.etapa_proxima, sistemaEfetivo);

    // Travar etapa se actionMode exigir (refresh, progressao manual sem continue)
    if (shouldLockStage(etapa, actionMode, sistemaEfetivo)) {
      resultado.etapa_proxima = etapa;
    }

    // continue_stage e ordem de avanco deterministico: a policy decide, nao a IA.
    const destinoForcado = resolveContinueStage(etapa, actionMode, sistemaEfetivo);
    if (destinoForcado) {
      resultado.etapa_proxima = destinoForcado;
    }

    const etapaDestino = resultado.etapa_proxima || etapa;

    // Sanitizar sugestões (aceita tipo da etapa atual OU destino) + filtro de tier
    const idsPermitidos = await buildIdsPermitidos(estado.nivel || 1, sistemaEfetivo);
    const sugestoes = sanitizarSugestoes(
      Array.isArray(resultado.sugestoes) ? resultado.sugestoes : [],
      etapa,
      etapaDestino,
      idsPermitidos,
      sistemaEfetivo
    );

    // Se destino não usa cards, limpar sugestões
    let sugestoesFinal = etapasSemCards.includes(etapaDestino) ? [] : sugestoes;

    // Extrair IDs já sugeridos + já selecionados para evitar repetição nos fallbacks
    const { ids: idsJaSugeridos } = extrairSugestoesAnteriores(historico, etapa);
    if (estado.raca_id) idsJaSugeridos.add(String(estado.raca_id));
    if (estado.classe_id) idsJaSugeridos.add(String(estado.classe_id));
    if (estado.vantagens_ids?.length) estado.vantagens_ids.forEach(id => idsJaSugeridos.add(String(id)));
    if (estado.desvantagens_ids?.length) estado.desvantagens_ids.forEach(id => idsJaSugeridos.add(String(id)));

    // Fallback: se sugestões vazias em etapa que deveria ter, buscar do catálogo
    if (sugestoesFinal.length === 0 && etapasComSugestoes.includes(etapaDestino)) {
      log.warn({ etapa, etapaDestino, originalCount: resultado.sugestoes?.length || 0 }, 'IA retornou 0 sugestoes validas, gerando fallback');
      sugestoesFinal = await gerarFallbackSugestoes(etapaDestino, estado, idsJaSugeridos, sistemaEfetivo);
    } else if (sugestoesFinal.length === 0 && etapasComSugestoes.includes(etapa) && !etapasSemCards.includes(etapaDestino)) {
      log.warn({ etapa, etapaDestino }, 'Sem sugestoes, gerando fallback');
      sugestoesFinal = await gerarFallbackSugestoes(etapa, estado, idsJaSugeridos, sistemaEfetivo);
    }

    // Fallback: se atributos_sugeridos ausente na etapa de atributos/caracteristicas, gerar distribuição padrão
    let atributosSugeridos = resultado.atributos_sugeridos || null;
    const etapaAtributos = sistemaEfetivo === 'tresdet' ? 'caracteristicas' : 'atributos';
    if (etapaDestino === etapaAtributos && !atributosSugeridos) {
      log.warn('IA nao retornou atributos_sugeridos, gerando fallback');
      atributosSugeridos = gerarAtributosFallback(estado, sistemaEfetivo);
    }

    return {
      mensagem: resultado.mensagem || '',
      sugestoes: sugestoesFinal,
      etapa_proxima: resultado.etapa_proxima,
      atributos_sugeridos: atributosSugeridos,
    };
  } catch (error) {
    log.error({ err: error }, 'Erro na interacao');

    // Fallback graceful — respeitar policy e actionMode mesmo em erro
    const policy = getPolicy(etapa, sistemaEfetivo);
    let catchEtapaDestino = sanitizeEtapaProxima(etapa, policy.defaultNext || etapa, sistemaEfetivo);
    if (shouldLockStage(etapa, actionMode, sistemaEfetivo)) {
      catchEtapaDestino = etapa;
    }

    // Mesmo em erro, tentar gerar sugestões do catálogo para a etapa destino
    const { ids: idsJaSugeridos } = extrairSugestoesAnteriores(historico, etapa);
    if (estado.raca_id) idsJaSugeridos.add(String(estado.raca_id));
    if (estado.classe_id) idsJaSugeridos.add(String(estado.classe_id));
    if (estado.vantagens_ids?.length) estado.vantagens_ids.forEach(id => idsJaSugeridos.add(String(id)));
    if (estado.desvantagens_ids?.length) estado.desvantagens_ids.forEach(id => idsJaSugeridos.add(String(id)));
    const fallbackSugestoes = etapasComSugestoes.includes(catchEtapaDestino)
      ? await gerarFallbackSugestoes(catchEtapaDestino, estado, idsJaSugeridos, sistemaEfetivo).catch(() => [])
      : [];

    const etapaAtributos = sistemaEfetivo === 'tresdet' ? 'caracteristicas' : 'atributos';
    return {
      mensagem: getFallbackMessage(catchEtapaDestino) || getFallbackMessage(etapa) || 'Ocorreu um erro. Tente novamente.',
      sugestoes: fallbackSugestoes,
      etapa_proxima: catchEtapaDestino,
      atributos_sugeridos: catchEtapaDestino === etapaAtributos ? gerarAtributosFallback(estado, sistemaEfetivo) : null,
    };
  }
}

