/**
 * BlueprintService - Gera roteiros narrativos (Story Blueprints) usando Claude Sonnet 4.5
 * via API da Anthropic. O roteiro e um JSON com secoes estruturadas que guia o Mestre IA.
 */
import Anthropic from '@anthropic-ai/sdk';
import usageService from './usageService.js';
import { ensureNpcIds } from './narrationSegmentsService.js';
import { getDefaultProviderName } from './ttsService.js';
import { MODE_TEMPERATURES } from '../config/blueprintModes.js';

const MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = 8000;
const TIMEOUT_MS = 180000;
const REPAIR_TEMPERATURE = 0.1;
const DEFAULT_TTS_PROVIDER = getDefaultProviderName();

function asTrimmedString(value, fallback = '') {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function asStringArray(value, fallback = ['']) {
  const source = Array.isArray(value) ? value : [];
  const items = source
    .map(item => asTrimmedString(item, ''))
    .filter(Boolean);
  return items.length > 0 ? items : fallback;
}

function asInteger(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function asPercent(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(Math.max(parsed, 0), 100);
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeForComparison(value) {
  return asTrimmedString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function uniqueStrings(values = []) {
  return [...new Set(
    ensureArray(values)
      .map(item => asTrimmedString(item, ''))
      .filter(Boolean)
  )];
}

function buildSourceStoryText(historia = {}) {
  return normalizeForComparison([
    historia?.nome,
    historia?.descricao,
    historia?.prologo
  ].filter(Boolean).join('\n'));
}

function wasExplicitlyProvidedByStory(historia, value) {
  const candidate = normalizeForComparison(value);
  if (!candidate) return false;
  return buildSourceStoryText(historia).includes(candidate);
}

function formatAvoidList(label, values, maxItems = 8) {
  const items = uniqueStrings(values).slice(0, maxItems);
  if (items.length === 0) return '';
  return `- ${label}: ${items.join(', ')}`;
}

function buildRegenerationBlock(historia, previousBlueprint) {
  if (!previousBlueprint || typeof previousBlueprint !== 'object') {
    return '';
  }

  const itensParaEvitar = [
    formatAvoidList(
      'Titulos de arco ja usados',
      ensureArray(previousBlueprint.arcos)
        .map(arco => arco?.titulo)
        .filter(titulo => !wasExplicitlyProvidedByStory(historia, titulo))
    ),
    formatAvoidList(
      'Locais gerados anteriormente',
      ensureArray(previousBlueprint.locais)
        .map(local => local?.nome)
        .filter(nome => !wasExplicitlyProvidedByStory(historia, nome))
    ),
    formatAvoidList(
      'NPCs gerados anteriormente',
      ensureArray(previousBlueprint.npcs)
        .map(npc => npc?.nome)
        .filter(nome => !wasExplicitlyProvidedByStory(historia, nome))
    ),
    formatAvoidList(
      'Tesouros gerados anteriormente',
      ensureArray(previousBlueprint.tesourosSegretos)
        .map(tesouro => tesouro?.nome)
        .filter(nome => !wasExplicitlyProvidedByStory(historia, nome))
    ),
    formatAvoidList(
      'Encontros gerados anteriormente',
      ensureArray(previousBlueprint.encontrosChave)
        .map(encontro => encontro?.nome)
        .filter(nome => !wasExplicitlyProvidedByStory(historia, nome))
    ),
    formatAvoidList(
      'Titulos/variantes do antagonista anterior',
      [
        previousBlueprint.antagonista?.nome,
        previousBlueprint.antagonista?.titulo
      ].filter(nome => !wasExplicitlyProvidedByStory(historia, nome))
    )
  ].filter(Boolean);

  if (itensParaEvitar.length === 0) {
    return `
## REGENERACAO ALTERNATIVA
Voce esta criando UMA NOVA PROPOSTA DE ROTEIRO para a mesma premissa.
Mantenha apenas o nucleo canonico explicitamente citado na aventura base.
Todo o resto deve ser uma proposta nova: arcos, encontros, locais, NPCs secundarios, titulos, segredos e desfechos.
`;
  }

  return `
## REGENERACAO ALTERNATIVA
Voce esta criando UMA NOVA PROPOSTA DE ROTEIRO para a mesma premissa.
Mantenha apenas o nucleo canonico explicitamente citado na aventura base.
Nao reutilize nomes, titulos, arcos, NPCs secundarios, locais, encontros, tesouros e variacoes do antagonista do roteiro anterior, exceto quando esse nome ja estiver explicitamente citado na aventura base.

EVITE REUTILIZAR:
${itensParaEvitar.join('\n')}
`;
}

function normalizeArcos(arcos = []) {
  const normalized = ensureArray(arcos).map((arco, index) => ({
    numero: asInteger(arco?.numero, index + 1),
    titulo: asTrimmedString(arco?.titulo, `Arco ${index + 1}`),
    descricao: asTrimmedString(arco?.descricao, 'Sem descricao'),
    objetivos: asStringArray(arco?.objetivos, ['Objetivo nao definido']),
    nivel_sugerido: asTrimmedString(arco?.nivel_sugerido, `${index + 1}-${index + 3}`)
  }));

  return normalized.length > 0 ? normalized : [{
    numero: 1,
    titulo: 'Arco 1',
    descricao: 'Sem descricao',
    objetivos: ['Objetivo nao definido'],
    nivel_sugerido: '1-3'
  }];
}

function normalizeRegioes(regioes = []) {
  const normalized = ensureArray(regioes).map((regiao, index) => ({
    nome: asTrimmedString(regiao?.nome, `Regiao ${index + 1}`),
    descricao: asTrimmedString(regiao?.descricao, 'Sem descricao'),
    perigo: asTrimmedString(regiao?.perigo, 'medio')
  }));

  return normalized.length > 0 ? normalized : [{
    nome: 'Regiao Central',
    descricao: 'Sem descricao',
    perigo: 'medio'
  }];
}

function normalizeLocais(locais = []) {
  const normalized = ensureArray(locais).map((local, index) => ({
    ...local,
    nome: asTrimmedString(local?.nome, `Local ${index + 1}`),
    tipo: asTrimmedString(local?.tipo, 'outro'),
    descricao: asTrimmedString(local?.descricao, 'Sem descricao'),
    segredos: asStringArray(local?.segredos, ['Nenhum segredo definido']),
    monstros_comuns: asStringArray(local?.monstros_comuns, ['Nenhum']),
    arco_relacionado: asInteger(local?.arco_relacionado, 1),
    imagem: asTrimmedString(local?.imagem, '') || null
  }));

  return normalized.length > 0 ? normalized : [{
    nome: 'Local Central',
    tipo: 'outro',
    descricao: 'Sem descricao',
    segredos: ['Nenhum segredo definido'],
    monstros_comuns: ['Nenhum'],
    arco_relacionado: 1
  }];
}

function normalizeNpcs(npcs = []) {
  const normalized = ensureArray(npcs).map((npc, index) => {
    const voiceId = asTrimmedString(npc?.voice_id, '') || null;

    return {
      ...npc,
      id: asTrimmedString(npc?.id, '') || null,
      nome: asTrimmedString(npc?.nome, `NPC ${index + 1}`),
      papel: asTrimmedString(npc?.papel, 'neutro'),
      descricao: asTrimmedString(npc?.descricao, 'Sem descricao'),
      motivacao: asTrimmedString(npc?.motivacao, 'Nao definida'),
      local: asTrimmedString(npc?.local, 'Desconhecido'),
      segredo: asTrimmedString(npc?.segredo, 'Nenhum'),
      dialogo_exemplo: asTrimmedString(npc?.dialogo_exemplo, '') || null,
      imagem: asTrimmedString(npc?.imagem, '') || null,
      voice_id: voiceId,
      voice_provider: voiceId
        ? (asTrimmedString(npc?.voice_provider, DEFAULT_TTS_PROVIDER) || DEFAULT_TTS_PROVIDER)
        : null
    };
  });

  return normalized.length > 0 ? ensureNpcIds(normalized) : ensureNpcIds([{
    nome: 'NPC Central',
    papel: 'neutro',
    descricao: 'Sem descricao',
    motivacao: 'Nao definida',
    local: 'Desconhecido',
    segredo: 'Nenhum'
  }]);
}

function normalizeSimpleObjects(items = [], defaults = {}) {
  return ensureArray(items).map(item => {
    const normalized = {};

    for (const [key, fallback] of Object.entries(defaults)) {
      if (Array.isArray(fallback)) {
        normalized[key] = asStringArray(item?.[key], fallback);
      } else if (typeof fallback === 'number') {
        normalized[key] = asInteger(item?.[key], fallback);
      } else if (typeof fallback === 'boolean') {
        normalized[key] = typeof item?.[key] === 'boolean' ? item[key] : fallback;
      } else {
        normalized[key] = asTrimmedString(item?.[key], fallback);
      }
    }

    return normalized;
  });
}

function normalizeProgressao(progressao = {}) {
  const marcosBrutos = ensureArray(progressao?.marcos);
  const marcos = marcosBrutos.map((marco, index) => ({
    id: asTrimmedString(marco?.id, `marco_${index + 1}`),
    descricao: asTrimmedString(marco?.descricao, 'Marco nao definido'),
    arco: asInteger(marco?.arco, 1),
    concluido: typeof marco?.concluido === 'boolean' ? marco.concluido : false
  }));

  return {
    marcos: marcos.length > 0 ? marcos : [{
      id: 'marco_1',
      descricao: 'Marco nao definido',
      arco: 1,
      concluido: false
    }],
    arco_atual: asInteger(progressao?.arco_atual, 1),
    porcentagem_estimada: asPercent(progressao?.porcentagem_estimada)
  };
}

function normalizeBlueprintStructure(roteiro) {
  if (!roteiro || typeof roteiro !== 'object' || Array.isArray(roteiro)) {
    return null;
  }

  return {
    sinopse: asTrimmedString(roteiro.sinopse, 'Sinopse nao definida'),
    antagonista: {
      nome: asTrimmedString(roteiro.antagonista?.nome, 'Antagonista desconhecido'),
      titulo: asTrimmedString(roteiro.antagonista?.titulo, ''),
      descricao: asTrimmedString(roteiro.antagonista?.descricao, 'Sem descricao'),
      motivacao: asTrimmedString(roteiro.antagonista?.motivacao, 'Nao definida'),
      poderes: asStringArray(roteiro.antagonista?.poderes, ['Poder desconhecido']),
      fraquezas: asStringArray(roteiro.antagonista?.fraquezas, ['Fraqueza desconhecida']),
      conexao_com_historia: asTrimmedString(roteiro.antagonista?.conexao_com_historia, 'Nao definida')
    },
    arcos: normalizeArcos(roteiro.arcos),
    mapaMundi: {
      descricao_geral: asTrimmedString(roteiro.mapaMundi?.descricao_geral, 'Sem descricao'),
      regioes: normalizeRegioes(roteiro.mapaMundi?.regioes)
    },
    locais: normalizeLocais(roteiro.locais),
    npcs: normalizeNpcs(roteiro.npcs),
    tesourosSegretos: normalizeSimpleObjects(roteiro.tesourosSegretos, {
      nome: 'Tesouro desconhecido',
      tipo: 'informacao',
      descricao: 'Sem descricao',
      localizacao: 'Desconhecida',
      condicao: 'Nao definida'
    }),
    plotTwists: normalizeSimpleObjects(roteiro.plotTwists, {
      momento: 'Momento indefinido',
      revelacao: 'Revelacao nao definida',
      impacto: 'Impacto nao definido'
    }),
    encontrosChave: normalizeSimpleObjects(roteiro.encontrosChave, {
      nome: 'Encontro desconhecido',
      tipo: 'exploracao',
      descricao: 'Sem descricao',
      monstros: ['Nenhum'],
      dificuldade: 'media',
      recompensas: ['Nenhuma'],
      arco_relacionado: 1
    }).map(encontro => ({
      ...encontro,
      monstros: asStringArray(encontro.monstros, ['Nenhum']),
      recompensas: asStringArray(encontro.recompensas, ['Nenhuma']),
      arco_relacionado: asInteger(encontro.arco_relacionado, 1)
    })),
    desfechosPossiveis: normalizeSimpleObjects(roteiro.desfechosPossiveis, {
      tipo: 'vitoria_parcial',
      condicao: 'Condicao nao definida',
      descricao: 'Sem descricao'
    }),
    instrucoesGeraisParaOMestre: {
      tom_narrativo: asTrimmedString(roteiro.instrucoesGeraisParaOMestre?.tom_narrativo, 'aventuresco'),
      ritmo: asTrimmedString(roteiro.instrucoesGeraisParaOMestre?.ritmo, 'equilibrado'),
      adaptacao: asTrimmedString(
        roteiro.instrucoesGeraisParaOMestre?.adaptacao,
        'Adapte conforme as decisoes dos jogadores'
      ),
      dicas_imersao: asStringArray(
        roteiro.instrucoesGeraisParaOMestre?.dicas_imersao,
        ['Use detalhes sensoriais e consequencias']
      )
    },
    progressao: normalizeProgressao(roteiro.progressao)
  };
}

const MODE_DIRECTIVES = {
  initial: '',
  regenerate: '',
  darker: 'DIRETIVA DE MODO: Tom sombrio. Enfatize dilemas morais, consequencias tragicas, ambiguidade etica, atmosfera opressiva. Antagonista com motivacao compreensivel. NPCs com segredos perturbadores. Pelo menos 1 desfecho agridoce.',
  exploration: 'DIRETIVA DE MODO: Foco em exploracao. Priorize locais detalhados com segredos ocultos, tesouros escondidos, dungeons com multiplas salas, mapas com regioes inexploradas. Menos combate, mais descoberta e puzzles.',
  intrigue: 'DIRETIVA DE MODO: Foco em intriga. NPCs com agendas ocultas, traicoes planejadas, espionagem, informacoes falsas. Plot twists envolvendo aliados. Antagonista operando nas sombras. Encontros sociais mais que combate.',
  political: 'DIRETIVA DE MODO: Foco politico. Faccoes em conflito, disputas de poder, aliancas frageis, diplomacia. NPCs representam interesses de grupos. Decisoes dos jogadores afetam equilibrio de poder. Mapa com territorios disputados.'
};

function buildBlueprintPrompt(historia, catalogo, temasNomes, options = {}) {
  const temas = temasNomes.join(', ');
  const regenerationBlock = (options.mode !== 'initial' && options.previousBlueprint)
    ? buildRegenerationBlock(historia, options.previousBlueprint)
    : '';
  const variationRule = options.mode === 'regenerate'
    ? 'REGRAS EXTRAS DE REGENERACAO: entregue uma proposta claramente diferente do roteiro anterior. Preserve apenas a premissa-base e nomes explicitamente canonicos do texto da aventura. Todo o restante deve ser novo e nao apenas reescrito.'
    : '';
  const modeDirective = MODE_DIRECTIVES[options.mode] || '';

  return `Voce e um roteirista de RPG. Crie um roteiro narrativo (Story Blueprint) para esta aventura.

## AVENTURA
Nome: ${historia.nome} | Temas: ${temas} | Jogadores: ${historia.maximo_de_participantes || 5}
Descricao: ${historia.descricao || 'Nao fornecida'}
Prologo: ${historia.prologo || 'Nao fornecido'}
${regenerationBlock}

## CATALOGO (monstros e equipamentos disponiveis)
${catalogo || 'Crie monstros e itens originais coerentes com os temas.'}

## INSTRUCOES
Responda APENAS com JSON valido (sem markdown). Seja conciso mas criativo. Estrutura EXATA:

{"sinopse":"Resumo da aventura (2-3 paragrafos)","antagonista":{"nome":"","titulo":"","descricao":"descricao breve","motivacao":"","poderes":[""],"fraquezas":[""],"conexao_com_historia":""},"arcos":[{"numero":1,"titulo":"","descricao":"breve","objetivos":[""],"nivel_sugerido":"1-3"}],"mapaMundi":{"descricao_geral":"descricao do mundo","regioes":[{"nome":"","descricao":"breve","perigo":"baixo|medio|alto|extremo"}]},"locais":[{"nome":"","tipo":"cidade|dungeon|floresta|montanha|ruina|templo|outro","descricao":"1-2 frases","segredos":[""],"monstros_comuns":[""],"arco_relacionado":1}],"npcs":[{"nome":"","papel":"aliado|neutro|antagonista|quest_giver|mercador|informante","descricao":"1 frase","motivacao":"","local":"","segredo":""}],"tesourosSegretos":[{"nome":"","tipo":"equipamento|informacao|artefato","descricao":"","localizacao":"","condicao":""}],"plotTwists":[{"momento":"","revelacao":"","impacto":""}],"encontrosChave":[{"nome":"","tipo":"combate|social|exploracao|puzzle|boss","descricao":"1-2 frases","monstros":[""],"dificuldade":"facil|media|dificil|letal","recompensas":[""],"arco_relacionado":1}],"desfechosPossiveis":[{"tipo":"vitoria_total|vitoria_parcial|derrota|agridoce","condicao":"","descricao":"1-2 frases"}],"instrucoesGeraisParaOMestre":{"tom_narrativo":"","ritmo":"","adaptacao":"","dicas_imersao":[""]},"progressao":{"marcos":[{"id":"marco_1","descricao":"","arco":1,"concluido":false}],"arco_atual":1,"porcentagem_estimada":0}}

${modeDirective}
REGRAS: Crie 3 arcos, 4 locais, 5 NPCs, 2 plot twists, 4 encontros-chave. Use nomes do catalogo quando possivel. Seja coerente com os temas: ${temas}. ${variationRule}`.trim();
}

class BlueprintService {
  constructor() {
    this.client = null;
  }

  normalizarRoteiro(roteiro) {
    return normalizeBlueprintStructure(roteiro);
  }

  _getClient() {
    if (!this.client) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY nao configurada. Defina a variavel de ambiente.');
      }
      this.client = new Anthropic({ apiKey });
    }
    return this.client;
  }

  async gerarRoteiro(historia, catalogo, temasNomes, userId = null, options = {}) {
    const mode = options.mode || 'initial';
    const prompt = buildBlueprintPrompt(historia, catalogo, temasNomes, {
      mode,
      previousBlueprint: options.previousBlueprint || historia?.roteiro || null
    });
    const temperature = MODE_TEMPERATURES[mode] || 0.3;
    console.log(
      `BlueprintService: Gerando roteiro para "${historia.nome}" com Claude Sonnet 4.5... modo=${mode}`
    );

    const content = await this._createMessage(prompt, userId, 'blueprint', temperature);
    let roteiro = this._parseRoteiro(content);

    if (!roteiro) {
      console.warn('BlueprintService: primeira resposta invalida, tentando repair...');
      roteiro = await this._repairRoteiro(content, userId);
    }

    const roteiroNormalizado = this.normalizarRoteiro(roteiro);
    if (!roteiroNormalizado) {
      throw new Error('Falha ao parsear roteiro da IA. Resposta nao e JSON valido.');
    }

    return roteiroNormalizado;
  }

  async _createMessage(prompt, userId = null, tipo = 'blueprint', temperature = 0.3) {
    const client = this._getClient();
    const startTime = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response;
    try {
      response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature,
        messages: [{ role: 'user', content: prompt }]
      }, { signal: controller.signal });
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError' || controller.signal.aborted) {
        throw new Error(`Timeout: geracao de roteiro excedeu ${TIMEOUT_MS / 1000}s`);
      }
      throw err;
    }
    clearTimeout(timeout);

    const content = response.content[0]?.text || '';
    const duracao = Date.now() - startTime;
    console.log(`BlueprintService: Resposta recebida em ${duracao}ms (${content.length} chars)`);

    if (userId) {
      try {
        usageService.track({
          userId,
          provider: 'anthropic',
          tipo,
          modelo: MODEL,
          input_tokens: response.usage?.input_tokens || 0,
          output_tokens: response.usage?.output_tokens || 0,
          duracao_ms: duracao,
        });
      } catch (_) {
        // silent
      }
    }

    return content;
  }

  async _repairRoteiro(content, userId = null) {
    const repairPrompt = `O texto abaixo deveria ser um JSON valido de roteiro de RPG, mas esta malformado ou incompleto.
Corrija APENAS a estrutura para a forma exigida e responda APENAS com JSON valido.
Nao envolva em markdown. Nao adicione explicacoes fora do JSON.

TEXTO ORIGINAL:
${content}`;

    const repairedContent = await this._createMessage(
      repairPrompt,
      userId,
      'blueprint_repair',
      REPAIR_TEMPERATURE
    );

    return this._parseRoteiro(repairedContent);
  }

  _parseRoteiro(content) {
    try {
      return JSON.parse(content);
    } catch (_) {
      // continue
    }

    const cleaned = String(content || '')
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch (_) {
      // continue
    }

    const match = String(content || '').match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (_) {
        // continue
      }
    }

    return null;
  }
}

export default new BlueprintService();
