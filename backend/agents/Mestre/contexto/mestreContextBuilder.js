import crypto from 'crypto';
import { extrairNomesTemas } from '../../../helpers/temasHelper.js';
import { formatarPersonagensParaMestre } from '../../../helpers/personagensHelper.js';
import {
  describeNarrativeSpeed,
  getBeatBudget,
  getNarrativeSpeed,
  getTurnActionLimit
} from '../../../helpers/historiaConfigHelper.js';
import { condensarRoteiro } from '../prompts/roteiroCondenser.js';
import {
  normalizarTerrenoInput, getTerrenoLabel,
  getBossResumo, getBatalhaGrandeResumo, getMissaoTaticaResumo
} from '../../../helpers/estadoTatico.js';
import logger from '../../../helpers/logger.js';

const log = logger.child({ module: 'mestreContextBuilder' });

const MAX_BLOCK_CHARS = 1800;
const MAX_LIST_ITEMS = 8;

// ── Memória Semântica ─────────────────────────────────────────────
const TIPOS_MEMORIA_VALIDOS = ['promessa', 'segredo', 'decisao', 'relacao', 'ameaca', 'fato'];
const MAX_MEMORIA_POR_RESPOSTA = 3;
const MAX_NON_PERMANENTES = 30;
const MAX_PERMANENTES = 10;
const MAX_RENDER_ENTRIES = 12;

function truncateText(value, max = MAX_BLOCK_CHARS) {
  if (!value) return '';
  const text = String(value).trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

function uniqueList(values = []) {
  return [...new Set(
    (Array.isArray(values) ? values : [])
      .filter(Boolean)
      .map(value => String(value).trim())
      .filter(Boolean)
  )];
}

// ── Semantic Memory helpers ────────────────────────────────────────

function validarEntradaMemoria(item) {
  if (!item || typeof item !== 'object') return null;

  const tipo = String(item.tipo || '').toLowerCase().trim();
  if (!TIPOS_MEMORIA_VALIDOS.includes(tipo)) return null;

  const descricao = String(item.descricao || '').trim().slice(0, 200);
  if (!descricao) return null;

  const envolvidos = uniqueList(
    (Array.isArray(item.envolvidos) ? item.envolvidos : []).slice(0, 5)
  );

  const importancia = Math.max(1, Math.min(5, Math.round(Number(item.importancia) || 3)));
  const permanente = Boolean(item.permanente);

  return { tipo, descricao, envolvidos, importancia, permanente };
}

function memoriaDedupeKey(item) {
  return `${item.tipo}::${item.descricao.toLowerCase().trim()}`;
}

function calcMemoriaScore(item, rodadaAtual) {
  const age = Math.max(0, (rodadaAtual || 1) - (item.rodadaCriada || 1));
  return item.importancia * 10 - Math.min(8, Math.floor(age / 5));
}

function sortForEviction(a, b) {
  if (a.importancia !== b.importancia) return a.importancia - b.importancia;
  if (a.rodadaCriada !== b.rodadaCriada) return a.rodadaCriada - b.rodadaCriada;
  return (a.criadaEm || '').localeCompare(b.criadaEm || '');
}

export function extrairMemoriaSemantica(metadados = {}, sessao = {}) {
  const rodadaAtual = sessao.estadoJogo?.rodadaAtual || sessao.mestreContexto?.sessao?.rodadaAtual || 1;
  const existente = Array.isArray(sessao.mestreContexto?.sessao?.memoriaSemantica)
    ? [...sessao.mestreContexto.sessao.memoriaSemantica]
    : [];

  const novasRaw = Array.isArray(metadados.memoria_semantica) ? metadados.memoria_semantica : [];
  const novas = novasRaw.slice(0, MAX_MEMORIA_POR_RESPOSTA)
    .map(validarEntradaMemoria)
    .filter(Boolean);

  if (!novas.length && !existente.length) return [];

  // Dedup map keyed by tipo::descricao
  const mapa = new Map();
  for (const item of existente) {
    mapa.set(memoriaDedupeKey(item), item);
  }

  for (const item of novas) {
    const key = memoriaDedupeKey(item);
    const existenteItem = mapa.get(key);
    if (existenteItem) {
      // Merge: union envolvidos, max importancia, OR permanente
      existenteItem.envolvidos = uniqueList([...existenteItem.envolvidos, ...item.envolvidos]).slice(0, 5);
      existenteItem.importancia = Math.max(existenteItem.importancia, item.importancia);
      existenteItem.permanente = existenteItem.permanente || item.permanente;
    } else {
      mapa.set(key, {
        id: crypto.randomUUID(),
        ...item,
        rodadaCriada: rodadaAtual,
        criadaEm: new Date().toISOString()
      });
    }
  }

  let todos = Array.from(mapa.values());

  // Enforce permanentes hard cap (10)
  const permanentes = todos.filter(i => i.permanente);
  if (permanentes.length > MAX_PERMANENTES) {
    permanentes.sort(sortForEviction);
    const excesso = permanentes.length - MAX_PERMANENTES;
    for (let i = 0; i < excesso; i++) {
      permanentes[i].permanente = false;
    }
    if (novas.length > 0) {
      log.warn({ total: permanentes.length, demoted: excesso }, 'Demoted excess permanent memories');
    }
  }

  // Enforce non-permanentes soft cap (30)
  const nonPerm = todos.filter(i => !i.permanente);
  if (nonPerm.length > MAX_NON_PERMANENTES) {
    nonPerm.sort(sortForEviction);
    const remover = nonPerm.length - MAX_NON_PERMANENTES;
    const idsRemover = new Set(nonPerm.slice(0, remover).map(i => i.id));
    todos = todos.filter(i => !idsRemover.has(i.id));
    if (novas.length > 0) {
      log.info({ removed: remover }, 'Evicted low-score memories');
    }
  }

  return todos;
}

export function formatarBlocoMemoriaSemantica(memoriaSemantica = [], rodadaAtual = 1) {
  if (!memoriaSemantica.length) return '';

  // Score, sort, and take top entries
  const scored = memoriaSemantica.map(item => ({
    ...item,
    _score: calcMemoriaScore(item, rodadaAtual)
  }));

  scored.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    if (b.importancia !== a.importancia) return b.importancia - a.importancia;
    return (b.rodadaCriada || 0) - (a.rodadaCriada || 0);
  });

  const top = scored.slice(0, MAX_RENDER_ENTRIES);

  // Group by tipo
  const grupos = {};
  for (const item of top) {
    if (!grupos[item.tipo]) grupos[item.tipo] = [];
    grupos[item.tipo].push(item);
  }

  const labels = {
    promessa: 'Promessas',
    segredo: 'Segredos',
    decisao: 'Decisões',
    relacao: 'Relações',
    ameaca: 'Ameaças',
    fato: 'Fatos'
  };

  const linhas = [];
  for (const tipo of TIPOS_MEMORIA_VALIDOS) {
    const itens = grupos[tipo];
    if (!itens?.length) continue;
    linhas.push(`**${labels[tipo]}:**`);
    for (const item of itens) {
      const perm = item.permanente ? '[P]' : '';
      const envol = item.envolvidos.length ? ` (${item.envolvidos.join(', ')})` : '';
      linhas.push(`- [!${item.importancia}]${perm} ${item.descricao}${envol}`);
    }
  }

  return `### MEMORIA SEMANTICA DA CAMPANHA\n\n${linhas.join('\n')}`;
}

function mergeObjects(baseValue, nextValue) {
  if (Array.isArray(baseValue) || Array.isArray(nextValue)) {
    return Array.isArray(nextValue) ? nextValue : baseValue;
  }

  if (!baseValue || typeof baseValue !== 'object') {
    return nextValue;
  }

  if (!nextValue || typeof nextValue !== 'object') {
    return nextValue ?? baseValue;
  }

  const merged = { ...baseValue };
  for (const [key, value] of Object.entries(nextValue)) {
    if (value === undefined) {
      continue;
    }

    if (
      merged[key] &&
      typeof merged[key] === 'object' &&
      !Array.isArray(merged[key]) &&
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      merged[key] = mergeObjects(merged[key], value);
    } else {
      merged[key] = value;
    }
  }

  return merged;
}

export function mergeMestreContext(baseContext = {}, partialContext = {}) {
  return mergeObjects(baseContext || {}, partialContext || {});
}

export function buildJogadoresRuntimeList(sessao = {}) {
  const jogadoresMapa = Object.values(sessao.jogadores || {});
  const porId = new Map();

  jogadoresMapa.forEach(jogador => {
    const id = jogador?.id != null ? String(jogador.id) : null;
    if (!id) return;
    porId.set(id, {
      userId: id,
      username: jogador.nome || jogador.username || 'Jogador',
      nome: jogador.nome || jogador.username || 'Jogador',
      personagemId: jogador.personagemId || null,
      personagemNome: jogador.personagemNome || null
    });
  });

  const conectados = Array.isArray(sessao.jogadoresConectados) ? sessao.jogadoresConectados : [];
  conectados.forEach(entry => {
    if (!entry) return;

    if (typeof entry === 'string' || typeof entry === 'number') {
      const id = String(entry);
      if (porId.has(id)) return;
      porId.set(id, {
        userId: id,
        username: sessao.jogadores?.[id]?.nome || 'Jogador',
        nome: sessao.jogadores?.[id]?.nome || 'Jogador',
        personagemId: sessao.jogadores?.[id]?.personagemId || null,
        personagemNome: sessao.jogadores?.[id]?.personagemNome || null
      });
      return;
    }

    const id = entry.userId != null ? String(entry.userId) : entry.id != null ? String(entry.id) : null;
    if (!id) return;
    porId.set(id, {
      userId: id,
      username: entry.username || entry.nome || sessao.jogadores?.[id]?.nome || 'Jogador',
      nome: entry.username || entry.nome || sessao.jogadores?.[id]?.nome || 'Jogador',
      personagemId: entry.personagemId || sessao.jogadores?.[id]?.personagemId || null,
      personagemNome: entry.personagemNome || sessao.jogadores?.[id]?.personagemNome || null
    });
  });

  return Array.from(porId.values());
}

function inferMestreConfig(sessao = {}, historia = null) {
  return sessao.mestreConfig || historia?.mestres || null;
}

function inferTemas(sessao = {}, historia = null) {
  return extrairNomesTemas(sessao.historiaTemas || historia?.temas || []);
}

function inferRoteiro(sessao = {}, historia = null) {
  return sessao.historiaRoteiro || historia?.roteiro || null;
}

function inferNpcCanonicos(sessao = {}, historia = null) {
  const roteiro = inferRoteiro(sessao, historia);
  return uniqueList((roteiro?.npcs || []).map(npc => npc?.nome)).slice(0, 30);
}

function inferNpcComDetalhes(sessao = {}, historia = null) {
  const roteiro = inferRoteiro(sessao, historia);
  return Array.isArray(roteiro?.npcs) ? roteiro.npcs : [];
}

function buildNameCollisionMap(sessao = {}, historia = null) {
  const jogadoresRuntime = buildJogadoresRuntimeList(sessao);
  const personagens = formatarPersonagensParaMestre(
    jogadoresRuntime,
    sessao.personagensCompletos || {}
  );
  const npcs = inferNpcComDetalhes(sessao, historia);

  const personagensPorNome = new Map();
  personagens.forEach(personagem => {
    const nome = String(personagem?.nome || '').trim();
    if (!nome) return;
    const key = nome.toLowerCase();
    personagensPorNome.set(key, [
      ...(personagensPorNome.get(key) || []),
      `${nome}${personagem.jogador ? ` (PJ do jogador ${personagem.jogador})` : ' (PJ)'}`
    ]);
  });

  const conflitos = [];
  npcs.forEach(npc => {
    const nome = String(npc?.nome || '').trim();
    if (!nome) return;
    const key = nome.toLowerCase();
    if (!personagensPorNome.has(key)) return;
    conflitos.push({
      nome,
      personagens: personagensPorNome.get(key) || [],
      npcs: [`${nome}${npc?.papel ? ` (NPC ${npc.papel})` : ' (NPC)'}`]
    });
  });

  return conflitos;
}

function buildPartyResumo(personagens = []) {
  if (!personagens.length) return 'Nenhum personagem carregado.';
  return personagens
    .map(personagem => {
      const partes = [
        `[PJ] ${personagem.nome || 'Aventureiro'}`,
        personagem.raca || 'Humano',
        personagem.classe || 'Aventureiro',
        `Nv${personagem.nivel || 1}`
      ];
      if (personagem.jogador) {
        partes.push(`jogador: ${personagem.jogador}`);
      }
      if (personagem.background) {
        partes.push(truncateText(personagem.background, 120));
      }
      return partes.join(' | ');
    })
    .join('\n');
}

export function buildHistoriaContext(sessao = {}, historia = null, roteiroCondensado = '') {
  const temas = inferTemas(sessao, historia);
  const mestreConfig = inferMestreConfig(sessao, historia);
  const historiaConfig = sessao.historiaConfig || historia?.config || null;
  return {
    historiaId: historia?.id || sessao.historiaId || null,
    nome: historia?.nome || sessao.historiaNome || '',
    temas,
    prologo: historia?.prologo || sessao.historiaPrologo || '',
    config: historiaConfig,
    resumoRoteiro: truncateText(roteiroCondensado || '', MAX_BLOCK_CHARS),
    nomesConflitantes: buildNameCollisionMap(sessao, historia),
    mestreConfig: mestreConfig ? {
      nome: mestreConfig.nome || null,
      personalidade: mestreConfig.personalidade || null,
      tom_narrativo: mestreConfig.tom_narrativo || null,
      regras_especiais: mestreConfig.regras_especiais || null,
      modelo: mestreConfig.modelo || null
    } : null
  };
}

export function buildPersonagensContext(sessao = {}) {
  const jogadoresRuntime = buildJogadoresRuntimeList(sessao);
  const personagens = formatarPersonagensParaMestre(
    jogadoresRuntime,
    sessao.personagensCompletos || {}
  );

  return {
    partyResumo: buildPartyResumo(personagens),
    personagens: personagens.map(personagem => ({
      id: personagem.id || personagem.personagemId || personagem.nome,
      nome: personagem.nome,
      jogador: personagem.jogador || null,
      classe: personagem.classe || '',
      raca: personagem.raca || '',
      nivel: personagem.nivel || 1,
      background: truncateText(personagem.background || '', 240),
      atributos: personagem.atributos || null,
      vantagens: uniqueList((personagem.vantagens || []).map(v => v?.nome || v)).slice(0, MAX_LIST_ITEMS),
      desvantagens: uniqueList((personagem.desvantagens || []).map(d => d?.nome || d)).slice(0, MAX_LIST_ITEMS),
      habilidades: uniqueList((personagem.habilidadesClasse || []).map(h => h?.nome || h)).slice(0, MAX_LIST_ITEMS),
      equipamentos: uniqueList((personagem.equipamentos || []).map(e => e?.nome || e)).slice(0, MAX_LIST_ITEMS),
      objetivos: uniqueList(personagem.objetivos || []).slice(0, MAX_LIST_ITEMS),
      notasRelacionais: uniqueList(personagem.notasRelacionais || []).slice(0, MAX_LIST_ITEMS)
    }))
  };
}

export function getCompactacaoState(estadoJogo = {}, mensagens = []) {
  const mensagensCanonicas = Array.isArray(mensagens)
    ? mensagens.filter((mensagem) => {
        const canal = mensagem?.canal || 'formal';
        const tipo = mensagem?.tipo || mensagem?.type;
        return canal !== 'roleplay' && tipo !== 'roleplay';
      })
    : [];
  return {
    ultimaMensagemIndex: estadoJogo?.compactacao?.ultimaMensagemIndex || 0,
    ultimaRodadaCompactada: estadoJogo?.compactacao?.ultimaRodadaCompactada || 0,
    ultimaCompactacaoEm: estadoJogo?.compactacao?.ultimaCompactacaoEm || null,
    ultimaMensagemCompactadaId: estadoJogo?.compactacao?.ultimaMensagemCompactadaId || null,
    ultimoIndiceCanonicoCompactado: estadoJogo?.compactacao?.ultimoIndiceCanonicoCompactado || 0,
    totalMensagens: Array.isArray(mensagens) ? mensagens.length : 0,
    totalMensagensCanonicas: mensagensCanonicas.length
  };
}

export function buildSessionContext(sessao = {}, resumoRecente = null, progressao = null) {
  const estadoJogo = sessao.estadoJogo || {};
  const contextoExistente = sessao.mestreContexto?.sessao || {};
  const compactacao = getCompactacaoState(estadoJogo, sessao.mensagens || []);
  const terrenoAtual = getTerrenoLabel(normalizarTerrenoInput(estadoJogo.terreno));

  return {
    cenaAtual: estadoJogo.cenaAtual || contextoExistente.cenaAtual || '',
    ambiente: estadoJogo.ambiente || contextoExistente.ambiente || '',
    cenarioAtual: contextoExistente.cenarioAtual || estadoJogo.cenaAtual || '',
    terrenoAtual: contextoExistente.terrenoAtual || terrenoAtual || '',
    recursosConsumidos: uniqueList(contextoExistente.recursosConsumidos || []).slice(0, MAX_LIST_ITEMS),
    moralGrupo: contextoExistente.moralGrupo || '',
    ultimaAtualizacao: new Date().toISOString(),
    rodadaAtual: estadoJogo.rodadaAtual || contextoExistente.rodadaAtual || 1,
    fase: estadoJogo.fase || contextoExistente.fase || 'aguardando_inicio',
    resumoRecente: truncateText(
      resumoRecente?.resumo || contextoExistente.resumoRecente || '',
      MAX_BLOCK_CHARS
    ),
    fatosImportantes: uniqueList(contextoExistente.fatosImportantes || []).slice(0, MAX_LIST_ITEMS),
    pistasDescobertas: uniqueList(contextoExistente.pistasDescobertas || []).slice(0, MAX_LIST_ITEMS),
    itensRelevantes: uniqueList(contextoExistente.itensRelevantes || []).slice(0, MAX_LIST_ITEMS),
    npcsPresentes: uniqueList(estadoJogo.npcs || contextoExistente.npcsPresentes || []).slice(0, MAX_LIST_ITEMS),
    npcsEncontrados: uniqueList([
      ...(contextoExistente.npcsEncontrados || []),
      ...(progressao?.npcs_encontrados || []),
      ...(estadoJogo.npcs || [])
    ]).slice(0, MAX_LIST_ITEMS),
    npcsEmergentes: uniqueList(contextoExistente.npcsEmergentes || []).slice(0, MAX_LIST_ITEMS),
    locaisVisitados: uniqueList(contextoExistente.locaisVisitados || []).slice(0, MAX_LIST_ITEMS),
    objetivosAbertos: uniqueList(contextoExistente.objetivosAbertos || []).slice(0, MAX_LIST_ITEMS),
    memoriaSemantica: Array.isArray(contextoExistente.memoriaSemantica) ? contextoExistente.memoriaSemantica : [],
    relacoesNPC: Array.isArray(contextoExistente.relacoesNPC) ? contextoExistente.relacoesNPC.slice(0, MAX_LIST_ITEMS) : [],
    roleplayRecente: uniqueList(
      (sessao.roleplayRecente || []).map(item => `${item.username}: ${item.mensagem || item.message || ''}`)
    ).slice(-10),
    compactacao
  };
}

export function buildMestreContext(sessao = {}, historia = null, extras = {}) {
  const roteiro = extras.roteiroCondensado || condensarRoteiro(inferRoteiro(sessao, historia), buildBlueprintContext(sessao));
  const contextoBase = sessao.mestreContexto || {};
  const progressao = extras.progressao || sessao.estadoJogo?.progressao || null;
  const resumoRecente = extras.resumoRecente || null;

  return mergeMestreContext(contextoBase, {
    historia: buildHistoriaContext(sessao, historia, roteiro),
    personagens: buildPersonagensContext(sessao),
    sessao: buildSessionContext(sessao, resumoRecente, progressao)
  });
}

function formatList(title, values = []) {
  const lista = uniqueList(values).slice(0, MAX_LIST_ITEMS);
  if (!lista.length) return `${title}: nenhum`;
  return `${title}:\n- ${lista.join('\n- ')}`;
}

export function formatMestreContextBlocks(mestreContexto = {}) {
  const historia = mestreContexto.historia || {};
  const personagens = mestreContexto.personagens || {};
  const sessao = mestreContexto.sessao || {};
  const velocidadeNarrativa = getNarrativeSpeed(historia.config);
  const orcamentoDeBeats = getBeatBudget(historia.config);
  const maxAcoesPorTurno = getTurnActionLimit(historia.config);

  const personagensTexto = Array.isArray(personagens.personagens) && personagens.personagens.length > 0
    ? personagens.personagens.slice(0, MAX_LIST_ITEMS).map(personagem => {
        const partes = [
          `[PJ] ${personagem.nome} (${personagem.raca || 'Humano'} ${personagem.classe || 'Aventureiro'} Nv${personagem.nivel || 1})`
        ];
        if (personagem.jogador) partes.push(`jogador: ${personagem.jogador}`);
        if (personagem.background) partes.push(`background: ${personagem.background}`);
        if (personagem.objetivos?.length) partes.push(`objetivos: ${personagem.objetivos.join(', ')}`);
        if (personagem.notasRelacionais?.length) partes.push(`relacoes: ${personagem.notasRelacionais.join(', ')}`);
        return `- ${partes.join(' | ')}`;
      }).join('\n')
    : '- nenhum personagem carregado';

  const conflitosTexto = Array.isArray(historia.nomesConflitantes) && historia.nomesConflitantes.length > 0
    ? historia.nomesConflitantes.map(conflito =>
        `- Nome compartilhado: ${conflito.nome}\n  PJs: ${conflito.personagens.join(', ')}\n  NPCs: ${conflito.npcs.join(', ')}`
      ).join('\n')
    : '- nenhum conflito de nomes entre PJ e NPC';

  const blocos = [
    `### CONTEXTO_HISTORIA
Nome: ${historia.nome || 'Sem nome'}
Temas: ${(historia.temas || []).join(', ') || 'nenhum'}
Prologo: ${truncateText(historia.prologo || '', 500) || 'nenhum'}
Ritmo narrativo: ${velocidadeNarrativa} (${describeNarrativeSpeed(velocidadeNarrativa)})
Orcamento de beats: ${orcamentoDeBeats}
Maximo de acoes por turno: ${maxAcoesPorTurno}
Resumo do roteiro:
${truncateText(historia.resumoRoteiro || '', MAX_BLOCK_CHARS) || 'nenhum'}

Desambiguação de nomes:
${conflitosTexto}`,
    `### CONTEXTO_PERSONAGENS
Party:
${truncateText(personagens.partyResumo || '', MAX_BLOCK_CHARS) || 'nenhum'}

Personagens:
${personagensTexto}`,
    `### CONTEXTO_ESTADO_SESSAO
Cena atual: ${sessao.cenaAtual || 'não definida'}
Ambiente: ${sessao.ambiente || 'não definido'}
Rodada: ${sessao.rodadaAtual || 1}
Fase: ${sessao.fase || 'não definida'}
Resumo recente:
${truncateText(sessao.resumoRecente || '', 700) || 'nenhum'}

${formatList('NPCs presentes', sessao.npcsPresentes)}
${formatList('NPCs encontrados', sessao.npcsEncontrados)}
${formatList('NPCs emergentes', sessao.npcsEmergentes)}
${formatList('Locais visitados', sessao.locaisVisitados)}
${formatList('Objetivos em aberto', sessao.objetivosAbertos)}
${formatList('Pistas descobertas', sessao.pistasDescobertas)}
${formatList('Fatos importantes', sessao.fatosImportantes)}
${formatList('Itens relevantes', sessao.itensRelevantes)}
${formatList('Roleplay recente', sessao.roleplayRecente)}`
  ];

  if (blocos.length > 2) {
    const sessaoResumoExtra = [
      `Cenario atual (resumo): ${sessao.cenarioAtual || 'nenhum'}`,
      `Terreno atual (resumo): ${sessao.terrenoAtual || 'nenhum'}`,
      `Moral do grupo: ${sessao.moralGrupo || 'nenhuma'}`,
      formatList('Recursos consumidos', sessao.recursosConsumidos)
    ].join('\n');
    blocos[2] = `${blocos[2]}\n${sessaoResumoExtra}`;
  }

  // Append semantic memory block if available
  const blocoMemoria = formatarBlocoMemoriaSemantica(
    sessao.memoriaSemantica || [],
    sessao.rodadaAtual || 1
  );
  if (blocoMemoria) {
    blocos.push(blocoMemoria);
  }

  return blocos.join('\n\n');
}

function normalizeNpcName(rawName, canonicos = []) {
  const name = String(rawName || '').trim();
  if (!name) return null;
  const lower = name.toLowerCase();
  const exact = canonicos.find(npc => String(npc).toLowerCase() === lower);
  if (exact) return exact;
  const partial = canonicos.find(npc => String(npc).toLowerCase().includes(lower) || lower.includes(String(npc).toLowerCase()));
  return partial || name;
}

export function normalizeNpcList(rawNames = [], sessao = {}, historia = null) {
  const canonicos = inferNpcCanonicos(sessao, historia);
  const normalizados = [];
  const emergentes = [];

  uniqueList(rawNames).forEach(name => {
    const normalizado = normalizeNpcName(name, canonicos);
    if (!normalizado) return;
    normalizados.push(normalizado);
    if (!canonicos.includes(normalizado)) {
      emergentes.push(normalizado);
    }
  });

  return {
    presentes: uniqueList(normalizados),
    emergentes: uniqueList(emergentes)
  };
}

function parseStructuredSection(summary = '', title = '') {
  if (!summary || !title) return [];
  const pattern = new RegExp(`${title}:\\s*([\\s\\S]*?)(?:\\n[A-Z_ÇÕÁÉÍÓÚ]+:|$)`, 'i');
  const match = summary.match(pattern);
  if (!match) return [];
  return match[1]
    .split('\n')
    .map(line => line.replace(/^\s*-\s*/, '').trim())
    .filter(Boolean);
}

/**
 * Monta contexto enriquecido para condensarRoteiro.
 * Agrega estadoJogo + mestreContexto.sessao em objeto flat.
 * Leitura pura — não muta sessão.
 */
export function buildBlueprintContext(sessao) {
  const ej = sessao?.estadoJogo || {};
  const ctx = sessao?.mestreContexto?.sessao || {};
  const progressao = ej.progressao || null;

  return {
    arcoAtual: progressao?.arco_atual || null,
    cenaAtual: ej.cenaAtual || ctx.cenaAtual || null,
    ambiente: ej.ambiente || ctx.ambiente || null,
    terreno: ej.terreno || null,
    npcs: Array.isArray(ej.npcs) ? ej.npcs : (ctx.npcsPresentes || []),
    npcsEncontrados: ctx.npcsEncontrados || [],
    locaisVisitados: ctx.locaisVisitados || [],
    objetivosAbertos: ctx.objetivosAbertos || [],
    pistasDescobertas: ctx.pistasDescobertas || [],
    resumoRecente: ctx.resumoRecente || null,
    progressao
  };
}

/**
 * Monta objeto compacto de contexto runtime para injetar no prompt do ResumoAgent.
 * Leitura pura — não muta sessão.
 */
export function buildContextoResumo(sessao) {
  const ej = sessao?.estadoJogo || {};
  const ctx = {};

  if (ej.cenaAtual) ctx.cenaAtual = ej.cenaAtual;

  const terreno = normalizarTerrenoInput(ej.terreno);
  if (terreno) {
    const label = getTerrenoLabel(terreno);
    const tags = terreno.tags?.length > 0 ? ` [${terreno.tags.join(', ')}]` : '';
    ctx.terreno = `${label}${tags}`;
  }

  if (ej.tensao) ctx.tensao = ej.tensao;

  const boss = getBossResumo(sessao);
  if (boss) ctx.boss = `${boss.nome} (Fase ${boss.fase_atual})`;

  const bg = getBatalhaGrandeResumo(sessao);
  if (bg) ctx.batalha = bg.nome || 'Batalha em curso';

  const mt = getMissaoTaticaResumo(sessao);
  if (mt) ctx.missao = `${(mt.objetivo || mt.descricao || 'Missao').slice(0, 60)} [${mt.status}]`;

  // Recursos: snapshot compacto de HP/mana dos jogadores
  const pSessao = ej.personagemSessao || {};
  const pcCompletos = sessao?.personagensCompletos || {};
  const recursoParts = [];
  for (const [uid, bucket] of Object.entries(pSessao)) {
    const pc = pcCompletos[uid] || Object.values(pcCompletos).find(p => String(p.userId) === uid);
    const nome = pc?.nome || `J${uid}`;
    const hp = bucket.hp_atual != null ? `HP ${bucket.hp_atual}/${bucket.hp_max || '?'}` : null;
    const mana = bucket.mana_atual != null ? `Mana ${bucket.mana_atual}/${bucket.mana_max || '?'}` : null;
    const parts = [hp, mana].filter(Boolean);
    if (parts.length > 0) recursoParts.push(`${nome}: ${parts.join(', ')}`);
  }
  if (recursoParts.length > 0) ctx.recursos = recursoParts.join('; ');

  return Object.keys(ctx).length > 0 ? ctx : null;
}

export function extractSummarySignals(summary = '') {
  const fatosImportantes = parseStructuredSection(summary, 'FATOS');
  const pistasDescobertas = parseStructuredSection(summary, 'PISTAS');
  const itens = parseStructuredSection(summary, 'ITENS');
  const objetivos = parseStructuredSection(summary, 'DECISOES');
  const npcLines = parseStructuredSection(summary, 'NPCS');
  const npcsEncontrados = npcLines.map(line => line.split(':')[0]?.trim()).filter(Boolean);

  // F07: novas seções
  const cenarioAtual = parseStructuredSection(summary, 'CENARIO_ATUAL');
  const terrenoAtual = parseStructuredSection(summary, 'TERRENO_ATUAL');
  const recursosConsumidos = parseStructuredSection(summary, 'RECURSOS_CONSUMIDOS');
  const moralGrupo = parseStructuredSection(summary, 'MORAL_GRUPO');

  return {
    fatosImportantes: uniqueList(fatosImportantes).slice(0, MAX_LIST_ITEMS),
    pistasDescobertas: uniqueList(pistasDescobertas).slice(0, MAX_LIST_ITEMS),
    itensRelevantes: uniqueList(itens).slice(0, MAX_LIST_ITEMS),
    objetivosAbertos: uniqueList(objetivos).slice(0, MAX_LIST_ITEMS),
    npcsEncontrados: uniqueList(npcsEncontrados).slice(0, MAX_LIST_ITEMS),
    cenarioAtual: cenarioAtual[0] || null,
    terrenoAtual: terrenoAtual[0] || null,
    recursosConsumidos: uniqueList(recursosConsumidos).slice(0, MAX_LIST_ITEMS),
    moralGrupo: moralGrupo[0] || null
  };
}

export function applyMetadadosToSessao(sessao = {}, metadados = {}, historia = null) {
  const estadoJogo = { ...(sessao.estadoJogo || {}) };
  const contextoAtual = sessao.mestreContexto || buildMestreContext(sessao, historia);
  const { presentes, emergentes } = normalizeNpcList(
    metadados.npcs_presentes || metadados.npcsPresentes || [],
    sessao,
    historia
  );

  // Mudança de local → reset de terreno e ameaças (contexto antigo fica stale)
  const localMudou = presenteOrTruthy(metadados.local_atual) || presenteOrTruthy(metadados.local);

  if (presenteOrTruthy(metadados.local_atual)) {
    estadoJogo.cenaAtual = metadados.local_atual;
    estadoJogo.ambiente = metadados.local_atual;
  }
  if (presenteOrTruthy(metadados.local)) {
    estadoJogo.cenaAtual = metadados.local;
    estadoJogo.ambiente = metadados.local;
  }

  if (localMudou) {
    // Terreno, ameaças e efeitos de terreno do local anterior não se aplicam mais
    if (!presenteOrTruthy(metadados.terreno)) estadoJogo.terreno = null;
    if (!Array.isArray(metadados.ameacas)) estadoJogo.ameacas = [];
    estadoJogo.efeitos_terreno = [];
  }

  if (presenteOrTruthy(metadados.ambiente)) {
    estadoJogo.ambiente = metadados.ambiente;
  }

  if (presenteOrTruthy(metadados.hora_ficcional)) {
    estadoJogo.horaFiccional = metadados.hora_ficcional;
  }
  if (presenteOrTruthy(metadados.hora)) {
    estadoJogo.horaFiccional = metadados.hora;
  }

  if (presenteOrTruthy(metadados.terreno)) {
    const terrenoNorm = normalizarTerrenoInput(metadados.terreno);
    if (terrenoNorm) estadoJogo.terreno = terrenoNorm;
  }

  if (presenteOrTruthy(metadados.tensao) && typeof metadados.tensao === 'string') {
    estadoJogo.tensao = metadados.tensao;
  }

  // ameacas: presente → salvar (slice 5, só strings); vazio → limpar; ausente → manter
  if (Array.isArray(metadados.ameacas)) {
    estadoJogo.ameacas = metadados.ameacas.length > 0
      ? metadados.ameacas.filter(a => typeof a === 'string' && a.trim()).slice(0, 5)
      : [];
  }

  if (presentes.length > 0) {
    estadoJogo.npcs = presentes;
  }

  // Extrair e processar memória semântica
  const memoriaSemantica = extrairMemoriaSemantica(metadados, sessao);

  const mestreContexto = mergeMestreContext(contextoAtual, {
    sessao: {
      cenaAtual: estadoJogo.cenaAtual || contextoAtual?.sessao?.cenaAtual || '',
      ambiente: estadoJogo.ambiente || contextoAtual?.sessao?.ambiente || '',
      ultimaAtualizacao: new Date().toISOString(),
      rodadaAtual: estadoJogo.rodadaAtual || contextoAtual?.sessao?.rodadaAtual || 1,
      fase: estadoJogo.fase || contextoAtual?.sessao?.fase || 'aguardando_inicio',
      npcsPresentes: presentes.length > 0 ? presentes : (contextoAtual?.sessao?.npcsPresentes || []),
      npcsEncontrados: uniqueList([
        ...(contextoAtual?.sessao?.npcsEncontrados || []),
        ...presentes
      ]),
      npcsEmergentes: uniqueList([
        ...(contextoAtual?.sessao?.npcsEmergentes || []),
        ...emergentes
      ]),
      memoriaSemantica
    }
  });

  estadoJogo.mestreContexto = mestreContexto;
  sessao.estadoJogo = estadoJogo;
  sessao.mestreContexto = mestreContexto;
  return sessao;
}

function presenteOrTruthy(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

export function applyResumoToSessao(sessao = {}, resumo = null, historia = null, progressao = null) {
  const sinais = extractSummarySignals(resumo?.resumo || '');
  const contextoBase = buildMestreContext(sessao, historia, {
    resumoRecente: resumo,
    progressao
  });

  const mestreContexto = mergeMestreContext(contextoBase, {
    sessao: {
      resumoRecente: truncateText(resumo?.resumo || '', MAX_BLOCK_CHARS),
      fatosImportantes: uniqueList([
        ...(contextoBase?.sessao?.fatosImportantes || []),
        ...sinais.fatosImportantes
      ]),
      pistasDescobertas: uniqueList([
        ...(contextoBase?.sessao?.pistasDescobertas || []),
        ...sinais.pistasDescobertas
      ]),
      itensRelevantes: uniqueList([
        ...(contextoBase?.sessao?.itensRelevantes || []),
        ...sinais.itensRelevantes
      ]),
      objetivosAbertos: uniqueList([
        ...(contextoBase?.sessao?.objetivosAbertos || []),
        ...sinais.objetivosAbertos
      ]),
      npcsEncontrados: uniqueList([
        ...(contextoBase?.sessao?.npcsEncontrados || []),
        ...(progressao?.npcs_encontrados || []),
        ...sinais.npcsEncontrados
      ]),
      // F07: novos sinais do resumo (sobrescrevem com último valor, não acumulam)
      cenarioAtual: sinais.cenarioAtual || contextoBase?.sessao?.cenarioAtual || null,
      terrenoAtual: sinais.terrenoAtual || contextoBase?.sessao?.terrenoAtual || null,
      recursosConsumidos: sinais.recursosConsumidos.length > 0
        ? sinais.recursosConsumidos
        : (contextoBase?.sessao?.recursosConsumidos || []),
      moralGrupo: sinais.moralGrupo || contextoBase?.sessao?.moralGrupo || null,
      ultimaAtualizacao: new Date().toISOString()
    }
  });

  const estadoJogo = { ...(sessao.estadoJogo || {}) };
  estadoJogo.progressao = progressao || estadoJogo.progressao || null;
  estadoJogo.mestreContexto = mestreContexto;
  sessao.estadoJogo = estadoJogo;
  sessao.mestreContexto = mestreContexto;
  return sessao;
}

export async function prepareMestrePayload(sessao = {}, historia = null) {
  const jogadoresRuntime = buildJogadoresRuntimeList(sessao);
  const personagensFormatados = formatarPersonagensParaMestre(
    jogadoresRuntime,
    sessao.personagensCompletos || {}
  );
  const nomesTemas = inferTemas(sessao, historia);

  let catalogo = '';
  try {
    const { buildCatalogo } = await import('../catalogo/catalogoMestre.js');
    const niveisJogadores = personagensFormatados
      .map(personagem => personagem?.nivel || 1)
      .filter(nivel => typeof nivel === 'number');
    catalogo = await buildCatalogo({ niveisJogadores });
  } catch (error) {
    log.warn({ err: error }, 'Erro ao construir catalogo para Mestre');
  }

  const roteiroCondensado = condensarRoteiro(inferRoteiro(sessao, historia), buildBlueprintContext(sessao));
  const mestreContexto = buildMestreContext(sessao, historia, {
    roteiroCondensado
  });

  return {
    nomesTemas,
    personagensFormatados,
    catalogo,
    roteiroCondensado,
    mestreContexto,
    contextoPersistenteFormatado: formatMestreContextBlocks(mestreContexto)
  };
}
