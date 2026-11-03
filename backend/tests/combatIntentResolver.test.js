import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * combatIntentResolver — contrato novo (Fase 3.4).
 *
 * resolveCombatIntent é async e resolve o loadout do personagem pelo VÍNCULO REAL
 * (via getOwnedCombatActionList → engine getMagiasConhecidas). Aqui o Model é
 * mockado: cada personagem de teste carrega `_vinculo` (linhas de hm_personagem)
 * que o db fake devolve. Não há mais 11 campos JSON soltos — UMA fonte de verdade.
 */

// db fake — devolve o vínculo que o personagem em teste declarar em `_vinculo`.
const fakeVinculoStore = { rows: [] };
vi.mock('../Model/index.js', () => ({
  default: {
    HmPersonagem: {
      findByPersonagem: async () => fakeVinculoStore.rows,
    },
    Personagem: {
      listarMagiasTresDet: async () => [],
    },
  },
}));

const { resolveCombatIntent } = await import('../websocket/utils/combatIntentResolver.js');

// ── Helpers de fabrica ──

function makeActiveCombat(overrides = {}) {
  return {
    ativo: true,
    turnoAtual: 1,
    monstros: [{ id: 'm1', nome: 'Goblin', hp: 10, hpMax: 10 }],
    ...overrides,
  };
}

/**
 * Personagem de teste. `acoes` é a lista de magias/habilidades que o personagem
 * realmente aprendeu — vira o vínculo hm_personagem que o db fake devolve.
 */
function makePersonagem(overrides = {}) {
  const { acoes = [], vantagens = [], ...rest } = overrides;
  return {
    id: 10,
    nome: 'Elara',
    nivel: 3,
    sistema: 'lunaria',
    classe: 'Guerreiro',
    vantagens,
    _vinculo: acoes.map((a) => ({
      habilidade_id: a.id,
      origem: 'criacao',
      habilidades_magias: {
        id: a.id,
        nome: a.nome,
        escola_magia: a.escola_magia ?? null,
        custo_mana: a.custo_mana ?? 0,
        sistema: 'lunaria',
        nivel_requerido: 1,
      },
    })),
    ...rest,
  };
}

function makeSpell(overrides = {}) {
  return { id: 'spell1', nome: 'Bola de Fogo', escola_magia: 'evocacao', ...overrides };
}

function makeSkill(overrides = {}) {
  return { id: 'skill1', nome: 'Investida Brutal', escola_magia: 'nenhuma', ...overrides };
}

const DEFAULT_USER_ID = 'user-123';

function resolve(overrides = {}) {
  const personagem = overrides.personagemCompleto ?? makePersonagem();
  fakeVinculoStore.rows = personagem?._vinculo ?? [];
  return resolveCombatIntent({
    mensagem: overrides.mensagem ?? '',
    explicitIntent: overrides.explicitIntent ?? null,
    personagemCompleto: personagem,
    combate: 'combate' in overrides ? overrides.combate : makeActiveCombat(),
    userId: 'userId' in overrides ? overrides.userId : DEFAULT_USER_ID,
  });
}

beforeEach(() => {
  fakeVinculoStore.rows = [];
});

// ── resolveCombatIntent — intencao explicita ──

describe('resolveCombatIntent — intencao explicita', () => {
  it('usa intent explicito do tipo atacar sem interpretar mensagem', async () => {
    const result = await resolve({
      mensagem: 'qualquer coisa irrelevante',
      explicitIntent: { tipo: 'atacar' },
    });
    expect(result.intent).toBeTruthy();
    expect(result.intent.tipo).toBe('atacar');
    expect(result.intent.source).toBe('explicit');
    expect(result.confidence).toBe(1);
    expect(result.ambiguous).toBe(false);
  });

  it('usa intent explicito do tipo defender', async () => {
    const result = await resolve({ explicitIntent: { tipo: 'defender' } });
    expect(result.intent.tipo).toBe('defender');
    expect(result.intent.source).toBe('explicit');
    expect(result.confidence).toBe(1);
  });

  it('usa intent explicito do tipo fugir', async () => {
    const result = await resolve({ explicitIntent: { tipo: 'fugir' } });
    expect(result.intent.tipo).toBe('fugir');
    expect(result.confidence).toBe(1);
  });

  it('usa intent explicito do tipo usar_habilidade', async () => {
    const result = await resolve({
      explicitIntent: { tipo: 'usar_habilidade', habilidadeId: 'h1' },
    });
    expect(result.intent.tipo).toBe('usar_habilidade');
    expect(result.intent.habilidadeId).toBe('h1');
    expect(result.confidence).toBe(1);
  });

  it('usa intent explicito do tipo conjurar_magia', async () => {
    const result = await resolve({
      explicitIntent: { tipo: 'conjurar_magia', magiaId: 's1' },
    });
    expect(result.intent.tipo).toBe('conjurar_magia');
    expect(result.intent.magiaId).toBe('s1');
    expect(result.confidence).toBe(1);
  });

  it('preserva source customizado do intent explicito', async () => {
    const result = await resolve({ explicitIntent: { tipo: 'atacar', source: 'ui-button' } });
    expect(result.intent.source).toBe('ui-button');
  });

  it('rejeita intent explicito com tipo invalido', async () => {
    const result = await resolve({
      mensagem: 'eu ataco o goblin',
      explicitIntent: { tipo: 'dançar' },
    });
    expect(result.intent).toBeTruthy();
    expect(result.intent.tipo).toBe('atacar');
    expect(result.intent.source).toBe('inferred');
  });

  it('rejeita intent explicito sem propriedade tipo', async () => {
    const result = await resolve({ mensagem: 'eu ataco', explicitIntent: { alvo: 'goblin' } });
    expect(result.intent.tipo).toBe('atacar');
    expect(result.intent.source).toBe('inferred');
  });

  it('rejeita intent explicito null', async () => {
    const result = await resolve({ mensagem: 'eu ataco', explicitIntent: null });
    expect(result.intent.tipo).toBe('atacar');
  });
});

// ── resolveCombatIntent — sem contexto de combate ──

describe('resolveCombatIntent — sem contexto de combate', () => {
  it('retorna intent null quando combate nao esta ativo', async () => {
    const result = await resolve({ mensagem: 'eu ataco o goblin', combate: { ativo: false } });
    expect(result.intent).toBeNull();
    expect(result.confidence).toBe(0);
    expect(result.ambiguous).toBe(false);
  });

  it('retorna intent null quando combate e null', async () => {
    const result = await resolve({ mensagem: 'eu ataco o goblin', combate: null });
    expect(result.intent).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('retorna intent null quando combate e undefined', async () => {
    const result = await resolve({ mensagem: 'eu ataco o goblin', combate: undefined });
    expect(result.intent).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('retorna intent null quando userId esta ausente', async () => {
    const result = await resolve({ mensagem: 'eu ataco o goblin', userId: null });
    expect(result.intent).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('retorna intent null quando userId e string vazia', async () => {
    const result = await resolve({ mensagem: 'eu ataco o goblin', userId: '' });
    expect(result.intent).toBeNull();
    expect(result.confidence).toBe(0);
  });
});

// ── resolveCombatIntent — mensagem vazia / null ──

describe('resolveCombatIntent — mensagem vazia ou null', () => {
  it('retorna ambiguous quando mensagem e string vazia', async () => {
    const result = await resolve({ mensagem: '' });
    expect(result.intent).toBeNull();
    expect(result.confidence).toBe(0);
    expect(result.ambiguous).toBe(true);
    expect(result.reason).toBeTruthy();
  });

  it('retorna ambiguous quando mensagem e null', async () => {
    const result = await resolve({ mensagem: null });
    expect(result.intent).toBeNull();
    expect(result.ambiguous).toBe(true);
  });

  it('retorna ambiguous quando mensagem e undefined', async () => {
    const result = await resolve({ mensagem: undefined });
    expect(result.intent).toBeNull();
    expect(result.ambiguous).toBe(true);
  });

  it('retorna ambiguous quando mensagem e somente espacos', async () => {
    const result = await resolve({ mensagem: '   ' });
    expect(result.intent).toBeNull();
    expect(result.ambiguous).toBe(true);
  });
});

// ── resolveCombatIntent — ataque generico (PT-BR) ──

describe('resolveCombatIntent — ataque generico', () => {
  it('"eu ataco o goblin" resolve como atacar', async () => {
    const result = await resolve({ mensagem: 'eu ataco o goblin' });
    expect(result.intent).toBeTruthy();
    expect(result.intent.tipo).toBe('atacar');
    expect(result.intent.source).toBe('inferred');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.ambiguous).toBe(false);
  });

  it('"ataco com minha espada" resolve como atacar', async () => {
    const result = await resolve({ mensagem: 'ataco com minha espada' });
    expect(result.intent.tipo).toBe('atacar');
  });

  it('"dou um golpe no inimigo" resolve como atacar', async () => {
    const result = await resolve({ mensagem: 'dou um golpe no inimigo' });
    expect(result.intent.tipo).toBe('atacar');
  });

  it('"investo contra o orc" resolve como atacar', async () => {
    const result = await resolve({ mensagem: 'investo contra o orc' });
    expect(result.intent.tipo).toBe('atacar');
  });

  it('"vou pra cima do dragao" resolve como atacar', async () => {
    const result = await resolve({ mensagem: 'vou pra cima do dragao' });
    expect(result.intent.tipo).toBe('atacar');
  });

  it('"parto pra cima" resolve como atacar', async () => {
    const result = await resolve({ mensagem: 'parto pra cima' });
    expect(result.intent.tipo).toBe('atacar');
  });
});

// ── resolveCombatIntent — defesa (PT-BR) ──

describe('resolveCombatIntent — defesa', () => {
  it('"eu me defendo" resolve como defender', async () => {
    const result = await resolve({ mensagem: 'eu me defendo' });
    expect(result.intent.tipo).toBe('defender');
  });

  it('"assumo postura defensiva" resolve como defender', async () => {
    const result = await resolve({ mensagem: 'assumo postura defensiva' });
    expect(result.intent.tipo).toBe('defender');
  });

  it('"ergo o escudo" resolve como defender', async () => {
    const result = await resolve({ mensagem: 'ergo o escudo' });
    expect(result.intent.tipo).toBe('defender');
  });

  it('"me protejo do ataque" resolve como defender', async () => {
    const result = await resolve({ mensagem: 'me protejo do ataque' });
    expect(result.intent.tipo).toBe('defender');
  });
});

// ── resolveCombatIntent — fuga (PT-BR) ──

describe('resolveCombatIntent — fuga', () => {
  it('"eu fujo" resolve como fugir', async () => {
    const result = await resolve({ mensagem: 'eu fujo' });
    expect(result.intent.tipo).toBe('fugir');
  });

  it('"bato em retirada" resolve como fugir', async () => {
    const result = await resolve({ mensagem: 'bato em retirada' });
    expect(result.intent.tipo).toBe('fugir');
  });

  it('"saio correndo" resolve como fugir', async () => {
    const result = await resolve({ mensagem: 'saio correndo' });
    expect(result.intent.tipo).toBe('fugir');
  });

  it('"recuo do combate" resolve como fugir', async () => {
    const result = await resolve({ mensagem: 'recuo do combate' });
    expect(result.intent.tipo).toBe('fugir');
  });
});

// ── resolveCombatIntent — prioridade de fuga sobre ataque ──

describe('resolveCombatIntent — prioridade fuga > defesa > ataque', () => {
  it('mensagem com fuga e ataque resolve como fugir', async () => {
    const result = await resolve({ mensagem: 'eu fujo do ataque' });
    expect(result.intent.tipo).toBe('fugir');
  });

  it('mensagem com defesa e ataque resolve como defender', async () => {
    const result = await resolve({ mensagem: 'me defendo do golpe' });
    expect(result.intent.tipo).toBe('defender');
  });
});

// ── resolveCombatIntent — magia por nome (named match) ──

describe('resolveCombatIntent — magia por nome', () => {
  it('"uso bola de fogo no dragao" resolve como conjurar_magia', async () => {
    const personagem = makePersonagem({ acoes: [makeSpell({ nome: 'Bola de Fogo' })] });
    const result = await resolve({ mensagem: 'uso bola de fogo no dragao', personagemCompleto: personagem });
    expect(result.intent).toBeTruthy();
    expect(result.intent.tipo).toBe('conjurar_magia');
    expect(result.intent.magiaId).toBe('spell1');
    expect(result.intent.magiaNome).toBe('Bola de Fogo');
    expect(result.intent.source).toBe('inferred');
    expect(result.confidence).toBe(0.95);
    expect(result.ambiguous).toBe(false);
  });

  it('"lanço misseis magicos" resolve como conjurar_magia', async () => {
    const personagem = makePersonagem({
      acoes: [makeSpell({ id: 'mm1', nome: 'Misseis Magicos', escola_magia: 'evocacao' })],
    });
    const result = await resolve({ mensagem: 'lanco misseis magicos no inimigo', personagemCompleto: personagem });
    expect(result.intent.tipo).toBe('conjurar_magia');
    expect(result.intent.magiaId).toBe('mm1');
  });

  it('reconhece magia mesmo com acentos na mensagem', async () => {
    const personagem = makePersonagem({ acoes: [makeSpell({ id: 's2', nome: 'Cura Leve' })] });
    const result = await resolve({ mensagem: 'eu lanço cúra léve em mim', personagemCompleto: personagem });
    expect(result.intent.tipo).toBe('conjurar_magia');
    expect(result.intent.magiaId).toBe('s2');
  });

  it('reconhece magia com case diferente', async () => {
    const personagem = makePersonagem({ acoes: [makeSpell({ id: 's3', nome: 'Raio de Gelo' })] });
    const result = await resolve({ mensagem: 'RAIO DE GELO no dragao', personagemCompleto: personagem });
    expect(result.intent.tipo).toBe('conjurar_magia');
    expect(result.intent.magiaId).toBe('s3');
  });
});

// ── resolveCombatIntent — habilidade por nome (named match) ──

describe('resolveCombatIntent — habilidade por nome', () => {
  it('"uso investida brutal" resolve como usar_habilidade', async () => {
    const personagem = makePersonagem({ acoes: [makeSkill({ id: 'h1', nome: 'Investida Brutal' })] });
    const result = await resolve({ mensagem: 'uso investida brutal no orc', personagemCompleto: personagem });
    expect(result.intent).toBeTruthy();
    expect(result.intent.tipo).toBe('usar_habilidade');
    expect(result.intent.habilidadeId).toBe('h1');
    expect(result.intent.habilidadeNome).toBe('Investida Brutal');
    expect(result.intent.source).toBe('inferred');
    expect(result.confidence).toBe(0.95);
  });

  it('habilidade sem escola_magia resolve como usar_habilidade', async () => {
    const personagem = makePersonagem({ acoes: [makeSkill({ id: 'h2', nome: 'Golpe Giratório' })] });
    const result = await resolve({ mensagem: 'uso golpe giratorio no esqueleto', personagemCompleto: personagem });
    expect(result.intent.tipo).toBe('usar_habilidade');
    expect(result.intent.habilidadeId).toBe('h2');
  });

  it('vantagem ativavel e encontrada como acao', async () => {
    const personagem = makePersonagem({
      vantagens: [{ id: 'v1', nome: 'Furia Berserker', usar: 1 }],
    });
    const result = await resolve({ mensagem: 'ativo furia berserker', personagemCompleto: personagem });
    expect(result.intent.tipo).toBe('usar_habilidade');
    expect(result.intent.habilidadeId).toBe('v1');
  });
});

// ── resolveCombatIntent — match parcial (tokens) ──

describe('resolveCombatIntent — match parcial por tokens', () => {
  it('encontra habilidade por tokens individuais quando nao ha match exato', async () => {
    const personagem = makePersonagem({ acoes: [makeSkill({ id: 'h3', nome: 'Golpe Devastador' })] });
    const result = await resolve({ mensagem: 'eu dou um devastador golpe no monstro', personagemCompleto: personagem });
    expect(result.intent).toBeTruthy();
    expect(result.intent.tipo).toBe('usar_habilidade');
    expect(result.intent.habilidadeId).toBe('h3');
  });
});

// ── resolveCombatIntent — ambiguidade de nomes ──

describe('resolveCombatIntent — ambiguidade', () => {
  it('retorna ambiguous quando duas habilidades fazem match exato', async () => {
    const personagem = makePersonagem({
      acoes: [
        makeSkill({ id: 'h1', nome: 'Golpe' }),
        makeSkill({ id: 'h2', nome: 'Golpe Forte' }),
      ],
    });
    const result = await resolve({ mensagem: 'uso golpe forte', personagemCompleto: personagem });
    expect(result.ambiguous).toBe(true);
    expect(result.intent).toBeNull();
    expect(result.candidates.length).toBeGreaterThanOrEqual(2);
  });

  it('retorna ambiguous quando duas magias nao fazem match parcial (tokens intermediarios ausentes)', async () => {
    const personagem = makePersonagem({
      acoes: [
        makeSpell({ id: 's1', nome: 'Raio Solar Ardente' }),
        makeSpell({ id: 's2', nome: 'Raio Lunar Ardente' }),
      ],
    });
    const result = await resolve({ mensagem: 'uso raio ardente', personagemCompleto: personagem });
    expect(result.ambiguous).toBe(true);
    expect(result.intent).toBeNull();
    expect(result.candidates).toEqual([]);
  });

  it('mensagem que nao bate com nenhuma acao ou intent generico retorna ambiguous', async () => {
    const result = await resolve({ mensagem: 'eu olho em volta calmamente' });
    expect(result.intent).toBeNull();
    expect(result.ambiguous).toBe(true);
    expect(result.reason).toBeTruthy();
  });
});

// ── resolveCombatIntent — named match tem prioridade sobre generico ──

describe('resolveCombatIntent — prioridade named match sobre inferencia generica', () => {
  it('habilidade nomeada vence o pattern generico de ataque', async () => {
    const personagem = makePersonagem({ acoes: [makeSkill({ id: 'h5', nome: 'Ataque Furioso' })] });
    const result = await resolve({ mensagem: 'uso ataque furioso', personagemCompleto: personagem });
    expect(result.intent.tipo).toBe('usar_habilidade');
    expect(result.intent.habilidadeId).toBe('h5');
    expect(result.confidence).toBe(0.95);
  });
});

// ── resolveCombatIntent — chamada sem argumentos / defaults ──

describe('resolveCombatIntent — chamada sem argumentos', () => {
  it('resolveCombatIntent() sem argumentos nao lanca erro', async () => {
    const result = await resolveCombatIntent();
    expect(result).toBeTruthy();
    expect(result.intent).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('resolveCombatIntent({}) com objeto vazio nao lanca erro', async () => {
    const result = await resolveCombatIntent({});
    expect(result).toBeTruthy();
    expect(result.intent).toBeNull();
  });
});

// ── resolveCombatIntent — multiplos monstros no combate ──

describe('resolveCombatIntent — multiplos monstros', () => {
  it('resolve ataque mesmo com multiplos monstros no combate', async () => {
    const combate = makeActiveCombat({
      monstros: [
        { id: 'm1', nome: 'Goblin', hp: 10, hpMax: 10 },
        { id: 'm2', nome: 'Dragao', hp: 100, hpMax: 100 },
        { id: 'm3', nome: 'Esqueleto', hp: 15, hpMax: 15 },
      ],
    });
    const result = await resolve({ mensagem: 'eu ataco o dragao', combate });
    expect(result.intent).toBeTruthy();
    expect(result.intent.tipo).toBe('atacar');
    expect(result.intent.source).toBe('inferred');
  });

  it('resolve magia quando alvo esta entre multiplos monstros', async () => {
    const combate = makeActiveCombat({
      monstros: [
        { id: 'm1', nome: 'Goblin', hp: 10, hpMax: 10 },
        { id: 'm2', nome: 'Dragao', hp: 100, hpMax: 100 },
      ],
    });
    const personagem = makePersonagem({ acoes: [makeSpell({ nome: 'Bola de Fogo' })] });
    const result = await resolve({ mensagem: 'uso bola de fogo no dragao', combate, personagemCompleto: personagem });
    expect(result.intent.tipo).toBe('conjurar_magia');
    expect(result.intent.magiaNome).toBe('Bola de Fogo');
  });
});

// ── resolveCombatIntent — nomes de acoes curtas sao ignorados ──

describe('resolveCombatIntent — nomes curtos ignorados', () => {
  it('habilidade com nome menor que 3 caracteres nao faz match', async () => {
    const personagem = makePersonagem({ acoes: [makeSkill({ id: 'h9', nome: 'Ar' })] });
    const result = await resolve({ mensagem: 'uso ar', personagemCompleto: personagem });
    expect(result.intent === null || result.intent.tipo !== 'usar_habilidade').toBe(true);
  });
});

// ── resolveCombatIntent — confianca (confidence) ──

describe('resolveCombatIntent — niveis de confianca', () => {
  it('intent explicito tem confianca 1', async () => {
    const result = await resolve({ explicitIntent: { tipo: 'atacar' } });
    expect(result.confidence).toBe(1);
  });

  it('named match tem confianca 0.95', async () => {
    const personagem = makePersonagem({ acoes: [makeSpell({ nome: 'Bola de Fogo' })] });
    const result = await resolve({ mensagem: 'bola de fogo', personagemCompleto: personagem });
    expect(result.confidence).toBe(0.95);
  });

  it('ataque generico tem confianca 0.82', async () => {
    const result = await resolve({ mensagem: 'eu ataco' });
    expect(result.confidence).toBe(0.82);
  });

  it('defesa generica tem confianca 0.87', async () => {
    const result = await resolve({ mensagem: 'me defendo' });
    expect(result.confidence).toBe(0.87);
  });

  it('fuga generica tem confianca 0.86', async () => {
    const result = await resolve({ mensagem: 'eu fujo' });
    expect(result.confidence).toBe(0.86);
  });

  it('mensagem ambigua tem confianca 0', async () => {
    const result = await resolve({ mensagem: 'eu canto uma musica' });
    expect(result.confidence).toBe(0);
  });
});

// ── resolveCombatIntent — formato de retorno ──

describe('resolveCombatIntent — formato de retorno', () => {
  it('sempre retorna objeto com campos intent, confidence, ambiguous, reason, candidates', async () => {
    const scenarios = await Promise.all([
      resolve({ explicitIntent: { tipo: 'atacar' } }),
      resolve({ mensagem: 'eu ataco' }),
      resolve({ mensagem: 'me defendo' }),
      resolve({ mensagem: 'eu fujo' }),
      resolve({ mensagem: '' }),
      resolve({ combate: null }),
      resolve({ mensagem: 'qualquer coisa' }),
    ]);
    for (const result of scenarios) {
      expect(result).toHaveProperty('intent');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('ambiguous');
      expect(result).toHaveProperty('reason');
      expect(result).toHaveProperty('candidates');
      expect(typeof result.confidence).toBe('number');
      expect(typeof result.ambiguous).toBe('boolean');
      expect(Array.isArray(result.candidates)).toBe(true);
    }
  });
});

// ── resolveCombatIntent — normalizacao de texto (testada indiretamente) ──

describe('resolveCombatIntent — normalizacao de texto', () => {
  it('remove acentos para matching', async () => {
    const result = await resolve({ mensagem: 'eu atáco o mónstro' });
    expect(result.intent.tipo).toBe('atacar');
  });

  it('remove pontuacao para matching', async () => {
    const result = await resolve({ mensagem: 'eu ataco!!! o goblin???' });
    expect(result.intent.tipo).toBe('atacar');
  });

  it('normaliza caixa alta para matching', async () => {
    const result = await resolve({ mensagem: 'DEFENDO!' });
    expect(result.intent.tipo).toBe('defender');
  });

  it('trata multiplos espacos como um so', async () => {
    const result = await resolve({ mensagem: 'eu    ataco     o     goblin' });
    expect(result.intent.tipo).toBe('atacar');
  });

  it('remove caracteres especiais para matching', async () => {
    const result = await resolve({ mensagem: 'eu @#$ataco%^& o goblin' });
    expect(result.intent.tipo).toBe('atacar');
  });
});

// ── resolveCombatIntent — loadout vem do vínculo real (fonte única) ──

describe('resolveCombatIntent — loadout pelo vínculo real', () => {
  it('encontra magia aprendida pelo personagem (hm_personagem)', async () => {
    const personagem = makePersonagem({ acoes: [makeSpell({ id: 'cura1', nome: 'Cura Sagrada' })] });
    const result = await resolve({ mensagem: 'uso cura sagrada', personagemCompleto: personagem });
    expect(result.intent.tipo).toBe('conjurar_magia');
    expect(result.intent.magiaId).toBe('cura1');
  });

  it('encontra habilidade aprendida pelo personagem (hm_personagem)', async () => {
    const personagem = makePersonagem({ acoes: [makeSkill({ id: 'sk1', nome: 'Provocar Inimigo' })] });
    const result = await resolve({ mensagem: 'uso provocar inimigo', personagemCompleto: personagem });
    expect(result.intent.tipo).toBe('usar_habilidade');
    expect(result.intent.habilidadeId).toBe('sk1');
  });

  it('magia que o personagem NAO aprendeu nao e encontrada', async () => {
    // vínculo vazio: o personagem não conhece "Meteoro" — não há named match
    const personagem = makePersonagem({ acoes: [] });
    const result = await resolve({ mensagem: 'lanco meteoro devastador', personagemCompleto: personagem });
    expect(result.intent).toBeNull();
  });
});

// ── resolveCombatIntent — personagem sem acoes ──

describe('resolveCombatIntent — personagem sem acoes', () => {
  it('mensagem com acao generica ainda resolve sem loadout', async () => {
    const personagem = makePersonagem({ acoes: [] });
    const result = await resolve({ mensagem: 'eu ataco o goblin', personagemCompleto: personagem });
    expect(result.intent.tipo).toBe('atacar');
  });
});
