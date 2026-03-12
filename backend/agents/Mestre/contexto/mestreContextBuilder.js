import { extrairNomesTemas } from '../../../helpers/temasHelper.js';
import { formatarPersonagensParaMestre } from '../../../helpers/personagensHelper.js';
import { condensarRoteiro } from '../prompts/roteiroCondenser.js';

const MAX_BLOCK_CHARS = 1800;
const MAX_LIST_ITEMS = 8;

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
  return {
    historiaId: historia?.id || sessao.historiaId || null,
    nome: historia?.nome || sessao.historiaNome || '',
    temas,
    prologo: historia?.prologo || sessao.historiaPrologo || '',
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
  return {
    ultimaMensagemIndex: estadoJogo?.compactacao?.ultimaMensagemIndex || 0,
    ultimaRodadaCompactada: estadoJogo?.compactacao?.ultimaRodadaCompactada || 0,
    ultimaCompactacaoEm: estadoJogo?.compactacao?.ultimaCompactacaoEm || null,
    totalMensagens: Array.isArray(mensagens) ? mensagens.length : 0
  };
}

export function buildSessionContext(sessao = {}, resumoRecente = null, progressao = null) {
  const estadoJogo = sessao.estadoJogo || {};
  const contextoExistente = sessao.mestreContexto?.sessao || {};
  const compactacao = getCompactacaoState(estadoJogo, sessao.mensagens || []);

  return {
    cenaAtual: estadoJogo.cenaAtual || contextoExistente.cenaAtual || '',
    ambiente: estadoJogo.ambiente || contextoExistente.ambiente || '',
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
    relacoesNPC: Array.isArray(contextoExistente.relacoesNPC) ? contextoExistente.relacoesNPC.slice(0, MAX_LIST_ITEMS) : [],
    roleplayRecente: uniqueList(
      (sessao.roleplayRecente || []).map(item => `${item.username}: ${item.mensagem || item.message || ''}`)
    ).slice(-10),
    compactacao
  };
}

export function buildMestreContext(sessao = {}, historia = null, extras = {}) {
  const roteiro = extras.roteiroCondensado || condensarRoteiro(inferRoteiro(sessao, historia), sessao.estadoJogo || null);
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

export function extractSummarySignals(summary = '') {
  const fatosImportantes = parseStructuredSection(summary, 'FATOS');
  const pistasDescobertas = parseStructuredSection(summary, 'PISTAS');
  const itens = parseStructuredSection(summary, 'ITENS');
  const objetivos = parseStructuredSection(summary, 'DECISOES');
  const npcLines = parseStructuredSection(summary, 'NPCS');
  const npcsEncontrados = npcLines.map(line => line.split(':')[0]?.trim()).filter(Boolean);

  return {
    fatosImportantes: uniqueList(fatosImportantes).slice(0, MAX_LIST_ITEMS),
    pistasDescobertas: uniqueList(pistasDescobertas).slice(0, MAX_LIST_ITEMS),
    itensRelevantes: uniqueList(itens).slice(0, MAX_LIST_ITEMS),
    objetivosAbertos: uniqueList(objetivos).slice(0, MAX_LIST_ITEMS),
    npcsEncontrados: uniqueList(npcsEncontrados).slice(0, MAX_LIST_ITEMS)
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

  if (presenteOrTruthy(metadados.local_atual)) {
    estadoJogo.cenaAtual = metadados.local_atual;
    estadoJogo.ambiente = metadados.local_atual;
  }
  if (presenteOrTruthy(metadados.local)) {
    estadoJogo.cenaAtual = metadados.local;
    estadoJogo.ambiente = metadados.local;
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

  if (presentes.length > 0) {
    estadoJogo.npcs = presentes;
  }

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
      ])
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
    console.warn('⚠️ Erro ao construir catálogo para Mestre:', error.message);
  }

  const roteiroCondensado = condensarRoteiro(inferRoteiro(sessao, historia), sessao.estadoJogo || null);
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
