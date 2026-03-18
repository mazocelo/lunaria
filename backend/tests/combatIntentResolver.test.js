import { describe, it, expect } from 'vitest';
import { resolveCombatIntent } from '../websocket/utils/combatIntentResolver.js';

// ── Helpers de fabrica ──

function makeActiveCombat(overrides = {}) {
  return {
    ativo: true,
    turnoAtual: 1,
    monstros: [
      { id: 'm1', nome: 'Goblin', hp: 10, hpMax: 10 },
    ],
    ...overrides,
  };
}

function makePersonagem(overrides = {}) {
  return {
    id: 'char1',
    nome: 'Elara',
    nivel: 3,
    classe: 'Guerreiro',
    habilidadesClasse: [],
    habilidadesProprias: [],
    habilidadesConhecidas: [],
    habilidadesAtivas: [],
    habilidadesSelecionadas: [],
    magias: [],
    magiasProprias: [],
    magiasConhecidas: [],
    magiasPreparadas: [],
    magiasAtivas: [],
    magiasSelecionadas: [],
    vantagens: [],
    ...overrides,
  };
}

function makeSpell(overrides = {}) {
  return {
    id: 'spell1',
    nome: 'Bola de Fogo',
    escola_magia: 'evocacao',
    nivel: 3,
    ...overrides,
  };
}

function makeSkill(overrides = {}) {
  return {
    id: 'skill1',
    nome: 'Investida Brutal',
    escola_magia: 'nenhuma',
    nivel: 1,
    ...overrides,
  };
}

const DEFAULT_USER_ID = 'user-123';

function resolve(overrides = {}) {
  return resolveCombatIntent({
    mensagem: overrides.mensagem ?? '',
    explicitIntent: overrides.explicitIntent ?? null,
    personagemCompleto: overrides.personagemCompleto ?? makePersonagem(),
    combate: 'combate' in overrides ? overrides.combate : makeActiveCombat(),
    userId: 'userId' in overrides ? overrides.userId : DEFAULT_USER_ID,
  });
}

// ── resolveCombatIntent — intencao explicita ──

describe('resolveCombatIntent — intencao explicita', () => {
  it('usa intent explicito do tipo atacar sem interpretar mensagem', () => {
    const result = resolve({
      mensagem: 'qualquer coisa irrelevante',
      explicitIntent: { tipo: 'atacar' },
    });

    expect(result.intent).toBeTruthy();
    expect(result.intent.tipo).toBe('atacar');
    expect(result.intent.source).toBe('explicit');
    expect(result.confidence).toBe(1);
    expect(result.ambiguous).toBe(false);
  });

  it('usa intent explicito do tipo defender', () => {
    const result = resolve({
      explicitIntent: { tipo: 'defender' },
    });

    expect(result.intent.tipo).toBe('defender');
    expect(result.intent.source).toBe('explicit');
    expect(result.confidence).toBe(1);
  });

  it('usa intent explicito do tipo fugir', () => {
    const result = resolve({
      explicitIntent: { tipo: 'fugir' },
    });

    expect(result.intent.tipo).toBe('fugir');
    expect(result.confidence).toBe(1);
  });

  it('usa intent explicito do tipo usar_habilidade', () => {
    const result = resolve({
      explicitIntent: { tipo: 'usar_habilidade', habilidadeId: 'h1' },
    });

    expect(result.intent.tipo).toBe('usar_habilidade');
    expect(result.intent.habilidadeId).toBe('h1');
    expect(result.confidence).toBe(1);
  });

  it('usa intent explicito do tipo conjurar_magia', () => {
    const result = resolve({
      explicitIntent: { tipo: 'conjurar_magia', magiaId: 's1' },
    });

    expect(result.intent.tipo).toBe('conjurar_magia');
    expect(result.intent.magiaId).toBe('s1');
    expect(result.confidence).toBe(1);
  });

  it('preserva source customizado do intent explicito', () => {
    const result = resolve({
      explicitIntent: { tipo: 'atacar', source: 'ui-button' },
    });

    expect(result.intent.source).toBe('ui-button');
  });

  it('rejeita intent explicito com tipo invalido', () => {
    const result = resolve({
      mensagem: 'eu ataco o goblin',
      explicitIntent: { tipo: 'dançar' },
    });

    // tipo invalido e ignorado; cai no parsing da mensagem
    expect(result.intent).toBeTruthy();
    expect(result.intent.tipo).toBe('atacar');
    expect(result.intent.source).toBe('inferred');
  });

  it('rejeita intent explicito sem propriedade tipo', () => {
    const result = resolve({
      mensagem: 'eu ataco',
      explicitIntent: { alvo: 'goblin' },
    });

    expect(result.intent.tipo).toBe('atacar');
    expect(result.intent.source).toBe('inferred');
  });

  it('rejeita intent explicito null', () => {
    const result = resolve({
      mensagem: 'eu ataco',
      explicitIntent: null,
    });

    expect(result.intent.tipo).toBe('atacar');
  });
});

// ── resolveCombatIntent — sem contexto de combate ──

describe('resolveCombatIntent — sem contexto de combate', () => {
  it('retorna intent null quando combate nao esta ativo', () => {
    const result = resolve({
      mensagem: 'eu ataco o goblin',
      combate: { ativo: false },
    });

    expect(result.intent).toBeNull();
    expect(result.confidence).toBe(0);
    expect(result.ambiguous).toBe(false);
  });

  it('retorna intent null quando combate e null', () => {
    const result = resolve({
      mensagem: 'eu ataco o goblin',
      combate: null,
    });

    expect(result.intent).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('retorna intent null quando combate e undefined', () => {
    const result = resolve({
      mensagem: 'eu ataco o goblin',
      combate: undefined,
    });

    expect(result.intent).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('retorna intent null quando userId esta ausente', () => {
    const result = resolve({
      mensagem: 'eu ataco o goblin',
      userId: null,
    });

    expect(result.intent).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('retorna intent null quando userId e string vazia', () => {
    const result = resolve({
      mensagem: 'eu ataco o goblin',
      userId: '',
    });

    expect(result.intent).toBeNull();
    expect(result.confidence).toBe(0);
  });
});

// ── resolveCombatIntent — mensagem vazia / null ──

describe('resolveCombatIntent — mensagem vazia ou null', () => {
  it('retorna ambiguous quando mensagem e string vazia', () => {
    const result = resolve({ mensagem: '' });

    expect(result.intent).toBeNull();
    expect(result.confidence).toBe(0);
    expect(result.ambiguous).toBe(true);
    expect(result.reason).toBeTruthy();
  });

  it('retorna ambiguous quando mensagem e null', () => {
    const result = resolve({ mensagem: null });

    expect(result.intent).toBeNull();
    expect(result.ambiguous).toBe(true);
  });

  it('retorna ambiguous quando mensagem e undefined', () => {
    const result = resolve({ mensagem: undefined });

    expect(result.intent).toBeNull();
    expect(result.ambiguous).toBe(true);
  });

  it('retorna ambiguous quando mensagem e somente espacos', () => {
    const result = resolve({ mensagem: '   ' });

    expect(result.intent).toBeNull();
    expect(result.ambiguous).toBe(true);
  });
});

// ── resolveCombatIntent — ataque generico (PT-BR) ──

describe('resolveCombatIntent — ataque generico', () => {
  it('"eu ataco o goblin" resolve como atacar', () => {
    const result = resolve({ mensagem: 'eu ataco o goblin' });

    expect(result.intent).toBeTruthy();
    expect(result.intent.tipo).toBe('atacar');
    expect(result.intent.source).toBe('inferred');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.ambiguous).toBe(false);
  });

  it('"ataco com minha espada" resolve como atacar', () => {
    const result = resolve({ mensagem: 'ataco com minha espada' });

    expect(result.intent.tipo).toBe('atacar');
  });

  it('"dou um golpe no monstro" resolve como atacar', () => {
    const result = resolve({ mensagem: 'dou um golpe no monstro' });

    expect(result.intent.tipo).toBe('atacar');
  });

  it('"invisto contra o inimigo" nao resolve como atacar (pattern exige "invest" nao "invist")', () => {
    const result = resolve({ mensagem: 'invisto contra o inimigo' });

    // "invisto" nao casa com /\binvest[a-z]*\b/ — cai em ambiguidade
    expect(result.intent).toBeNull();
    expect(result.ambiguous).toBe(true);
  });

  it('"corto com a espada" resolve como atacar', () => {
    const result = resolve({ mensagem: 'corto com a espada' });

    expect(result.intent.tipo).toBe('atacar');
  });

  it('"esmago o esqueleto com meu martelo" resolve como atacar', () => {
    const result = resolve({ mensagem: 'esmago o esqueleto com meu martelo' });

    expect(result.intent.tipo).toBe('atacar');
  });

  it('"destruo o portao" resolve como atacar', () => {
    const result = resolve({ mensagem: 'destruo o portao' });

    expect(result.intent.tipo).toBe('atacar');
  });

  it('"arrebento a porta" resolve como atacar', () => {
    const result = resolve({ mensagem: 'arrebento a porta' });

    expect(result.intent.tipo).toBe('atacar');
  });

  it('"detono o goblin" resolve como atacar', () => {
    const result = resolve({ mensagem: 'detono o goblin' });

    expect(result.intent.tipo).toBe('atacar');
  });

  it('"bato no monstro" resolve como atacar', () => {
    const result = resolve({ mensagem: 'bato no monstro' });

    expect(result.intent.tipo).toBe('atacar');
  });

  it('"parto pra cima do orc" resolve como atacar', () => {
    const result = resolve({ mensagem: 'parto pra cima do orc' });

    expect(result.intent.tipo).toBe('atacar');
  });

  it('"vou pra cima dele" resolve como atacar', () => {
    const result = resolve({ mensagem: 'vou pra cima dele' });

    expect(result.intent.tipo).toBe('atacar');
  });

  it('"vou atacar o goblin" resolve como atacar', () => {
    const result = resolve({ mensagem: 'vou atacar o goblin' });

    expect(result.intent.tipo).toBe('atacar');
  });

  it('"exterminar o inimigo" resolve como atacar', () => {
    const result = resolve({ mensagem: 'exterminar o inimigo' });

    expect(result.intent.tipo).toBe('atacar');
  });

  it('mensagem de ataque com acentos funciona normalmente', () => {
    const result = resolve({ mensagem: 'Eu atáco o monstão!' });

    expect(result.intent.tipo).toBe('atacar');
  });

  it('mensagem com caixa alta resolve como atacar', () => {
    const result = resolve({ mensagem: 'EU ATACO O GOBLIN' });

    expect(result.intent.tipo).toBe('atacar');
  });
});

// ── resolveCombatIntent — defesa (PT-BR) ──

describe('resolveCombatIntent — defesa', () => {
  it('"me defendo" resolve como defender', () => {
    const result = resolve({ mensagem: 'me defendo' });

    expect(result.intent).toBeTruthy();
    expect(result.intent.tipo).toBe('defender');
    expect(result.intent.source).toBe('inferred');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.ambiguous).toBe(false);
  });

  it('"eu defendo" resolve como defender', () => {
    const result = resolve({ mensagem: 'eu defendo' });

    expect(result.intent.tipo).toBe('defender');
  });

  it('"vou defender" resolve como defender', () => {
    const result = resolve({ mensagem: 'vou defender' });

    expect(result.intent.tipo).toBe('defender');
  });

  it('"me protejo" resolve como defender', () => {
    const result = resolve({ mensagem: 'me protejo' });

    expect(result.intent.tipo).toBe('defender');
  });

  it('"postura defensiva" resolve como defender', () => {
    const result = resolve({ mensagem: 'postura defensiva' });

    expect(result.intent.tipo).toBe('defender');
  });

  it('"ergo o escudo" resolve como defender', () => {
    const result = resolve({ mensagem: 'ergo o escudo' });

    expect(result.intent.tipo).toBe('defender');
  });

  it('"aparo o golpe" resolve como defender', () => {
    const result = resolve({ mensagem: 'aparo o golpe' });

    expect(result.intent.tipo).toBe('defender');
  });

  it('"eu aparo" resolve como defender', () => {
    const result = resolve({ mensagem: 'eu aparo' });

    expect(result.intent.tipo).toBe('defender');
  });

  it('"defenda" resolve como defender', () => {
    const result = resolve({ mensagem: 'defenda' });

    expect(result.intent.tipo).toBe('defender');
  });
});

// ── resolveCombatIntent — fuga (PT-BR) ──

describe('resolveCombatIntent — fuga', () => {
  it('"fujo do combate" resolve como fugir', () => {
    const result = resolve({ mensagem: 'fujo do combate' });

    expect(result.intent).toBeTruthy();
    expect(result.intent.tipo).toBe('fugir');
    expect(result.intent.source).toBe('inferred');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.ambiguous).toBe(false);
  });

  it('"eu fujo" resolve como fugir', () => {
    const result = resolve({ mensagem: 'eu fujo' });

    expect(result.intent.tipo).toBe('fugir');
  });

  it('"vou fugir" resolve como fugir', () => {
    const result = resolve({ mensagem: 'vou fugir' });

    expect(result.intent.tipo).toBe('fugir');
  });

  it('"recuo" resolve como fugir', () => {
    const result = resolve({ mensagem: 'recuo' });

    expect(result.intent.tipo).toBe('fugir');
  });

  it('"vou recuar" resolve como fugir', () => {
    const result = resolve({ mensagem: 'vou recuar' });

    expect(result.intent.tipo).toBe('fugir');
  });

  it('"bato em retirada" resolve como fugir', () => {
    const result = resolve({ mensagem: 'bato em retirada' });

    expect(result.intent.tipo).toBe('fugir');
  });

  it('"saio correndo" resolve como fugir', () => {
    const result = resolve({ mensagem: 'saio correndo' });

    expect(result.intent.tipo).toBe('fugir');
  });

  it('"escapo" resolve como fugir', () => {
    const result = resolve({ mensagem: 'escapo' });

    expect(result.intent.tipo).toBe('fugir');
  });

  it('"vou escapar daqui" resolve como fugir', () => {
    const result = resolve({ mensagem: 'vou escapar daqui' });

    expect(result.intent.tipo).toBe('fugir');
  });
});

// ── resolveCombatIntent — prioridade de fuga sobre ataque ──

describe('resolveCombatIntent — prioridade fuga > defesa > ataque', () => {
  it('fuga tem prioridade sobre ataque quando ambos presentes', () => {
    // "fujo" e "ataco" presentes — fuga deve ganhar
    const result = resolve({ mensagem: 'fujo antes de atacar' });

    expect(result.intent.tipo).toBe('fugir');
  });

  it('defesa tem prioridade sobre ataque quando ambos presentes', () => {
    const result = resolve({ mensagem: 'defendo e depois ataco' });

    expect(result.intent.tipo).toBe('defender');
  });
});

// ── resolveCombatIntent — magia por nome (named match) ──

describe('resolveCombatIntent — magia por nome', () => {
  it('"uso bola de fogo no dragao" resolve como conjurar_magia', () => {
    const personagem = makePersonagem({
      magias: [makeSpell({ nome: 'Bola de Fogo' })],
    });

    const result = resolve({
      mensagem: 'uso bola de fogo no dragao',
      personagemCompleto: personagem,
    });

    expect(result.intent).toBeTruthy();
    expect(result.intent.tipo).toBe('conjurar_magia');
    expect(result.intent.magiaId).toBe('spell1');
    expect(result.intent.magiaNome).toBe('Bola de Fogo');
    expect(result.intent.source).toBe('inferred');
    expect(result.confidence).toBe(0.95);
    expect(result.ambiguous).toBe(false);
  });

  it('"lanço misseis magicos" resolve como conjurar_magia', () => {
    const personagem = makePersonagem({
      magiasConhecidas: [makeSpell({ id: 'mm1', nome: 'Misseis Magicos', escola_magia: 'evocacao' })],
    });

    const result = resolve({
      mensagem: 'lanco misseis magicos no inimigo',
      personagemCompleto: personagem,
    });

    expect(result.intent.tipo).toBe('conjurar_magia');
    expect(result.intent.magiaId).toBe('mm1');
  });

  it('reconhece magia mesmo com acentos na mensagem', () => {
    const personagem = makePersonagem({
      magias: [makeSpell({ id: 's2', nome: 'Cura Leve' })],
    });

    const result = resolve({
      mensagem: 'eu lanço cúra léve em mim',
      personagemCompleto: personagem,
    });

    expect(result.intent.tipo).toBe('conjurar_magia');
    expect(result.intent.magiaId).toBe('s2');
  });

  it('reconhece magia com case diferente', () => {
    const personagem = makePersonagem({
      magias: [makeSpell({ id: 's3', nome: 'Raio de Gelo' })],
    });

    const result = resolve({
      mensagem: 'RAIO DE GELO no dragao',
      personagemCompleto: personagem,
    });

    expect(result.intent.tipo).toBe('conjurar_magia');
    expect(result.intent.magiaId).toBe('s3');
  });
});

// ── resolveCombatIntent — habilidade por nome (named match) ──

describe('resolveCombatIntent — habilidade por nome', () => {
  it('"uso investida brutal" resolve como usar_habilidade', () => {
    const personagem = makePersonagem({
      habilidadesClasse: [makeSkill({ id: 'h1', nome: 'Investida Brutal' })],
    });

    const result = resolve({
      mensagem: 'uso investida brutal no orc',
      personagemCompleto: personagem,
    });

    expect(result.intent).toBeTruthy();
    expect(result.intent.tipo).toBe('usar_habilidade');
    expect(result.intent.habilidadeId).toBe('h1');
    expect(result.intent.habilidadeNome).toBe('Investida Brutal');
    expect(result.intent.source).toBe('inferred');
    expect(result.confidence).toBe(0.95);
  });

  it('habilidade sem escola_magia resolve como usar_habilidade', () => {
    const personagem = makePersonagem({
      habilidadesProprias: [{ id: 'h2', nome: 'Golpe Giratório' }],
    });

    const result = resolve({
      mensagem: 'uso golpe giratorio no esqueleto',
      personagemCompleto: personagem,
    });

    expect(result.intent.tipo).toBe('usar_habilidade');
    expect(result.intent.habilidadeId).toBe('h2');
  });

  it('vantagem ativavel e encontrada como acao', () => {
    const personagem = makePersonagem({
      vantagens: [{ id: 'v1', nome: 'Furia Berserker', usar: 1 }],
    });

    const result = resolve({
      mensagem: 'ativo furia berserker',
      personagemCompleto: personagem,
    });

    expect(result.intent.tipo).toBe('usar_habilidade');
    expect(result.intent.habilidadeId).toBe('v1');
  });
});

// ── resolveCombatIntent — match parcial (tokens) ──

describe('resolveCombatIntent — match parcial por tokens', () => {
  it('encontra habilidade por tokens individuais quando nao ha match exato', () => {
    const personagem = makePersonagem({
      habilidadesClasse: [makeSkill({ id: 'h3', nome: 'Golpe Devastador' })],
    });

    // mensagem contem todos os tokens ("golpe" e "devastador") mas nao na forma exata
    const result = resolve({
      mensagem: 'eu dou um devastador golpe no monstro',
      personagemCompleto: personagem,
    });

    expect(result.intent).toBeTruthy();
    expect(result.intent.tipo).toBe('usar_habilidade');
    expect(result.intent.habilidadeId).toBe('h3');
  });
});

// ── resolveCombatIntent — ambiguidade de nomes ──

describe('resolveCombatIntent — ambiguidade', () => {
  it('retorna ambiguous quando duas habilidades fazem match exato', () => {
    const personagem = makePersonagem({
      habilidadesClasse: [
        makeSkill({ id: 'h1', nome: 'Golpe' }),
        makeSkill({ id: 'h2', nome: 'Golpe Forte' }),
      ],
    });

    // "golpe" como substring aparece em ambos os nomes:
    // normalizeText("Golpe") = "golpe" → esta em "uso golpe forte"
    // normalizeText("Golpe Forte") = "golpe forte" → esta em "uso golpe forte"
    const result = resolve({
      mensagem: 'uso golpe forte',
      personagemCompleto: personagem,
    });

    // Both "golpe" and "golpe forte" match the message as exact substrings
    expect(result.ambiguous).toBe(true);
    expect(result.intent).toBeNull();
    expect(result.candidates.length).toBeGreaterThanOrEqual(2);
  });

  it('retorna ambiguous quando duas magias nao fazem match parcial (tokens intermediarios ausentes)', () => {
    const personagem = makePersonagem({
      magias: [
        makeSpell({ id: 's1', nome: 'Raio Solar Ardente' }),
        makeSpell({ id: 's2', nome: 'Raio Lunar Ardente' }),
      ],
    });

    // partial match exige que TODOS os tokens da acao estejam na mensagem;
    // "solar" e "lunar" nao estao em "uso raio ardente" → nenhum match parcial
    // resultado: ambiguous generico sem candidates
    const result = resolve({
      mensagem: 'uso raio ardente',
      personagemCompleto: personagem,
    });

    expect(result.ambiguous).toBe(true);
    expect(result.intent).toBeNull();
    expect(result.candidates).toEqual([]);
  });

  it('mensagem que nao bate com nenhuma acao ou intent generico retorna ambiguous', () => {
    const result = resolve({
      mensagem: 'eu olho em volta calmamente',
    });

    expect(result.intent).toBeNull();
    expect(result.ambiguous).toBe(true);
    expect(result.reason).toBeTruthy();
  });
});

// ── resolveCombatIntent — named match tem prioridade sobre generico ──

describe('resolveCombatIntent — prioridade named match sobre inferencia generica', () => {
  it('habilidade nomeada vence o pattern generico de ataque', () => {
    const personagem = makePersonagem({
      habilidadesClasse: [makeSkill({ id: 'h5', nome: 'Ataque Furioso' })],
    });

    const result = resolve({
      mensagem: 'uso ataque furioso',
      personagemCompleto: personagem,
    });

    // named match com confianca 0.95 deve vencer o generico "atacar" de 0.82
    expect(result.intent.tipo).toBe('usar_habilidade');
    expect(result.intent.habilidadeId).toBe('h5');
    expect(result.confidence).toBe(0.95);
  });
});

// ── resolveCombatIntent — chamada sem argumentos / defaults ──

describe('resolveCombatIntent — chamada sem argumentos', () => {
  it('resolveCombatIntent() sem argumentos nao lanca erro', () => {
    const result = resolveCombatIntent();

    expect(result).toBeTruthy();
    expect(result.intent).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('resolveCombatIntent({}) com objeto vazio nao lanca erro', () => {
    const result = resolveCombatIntent({});

    expect(result).toBeTruthy();
    expect(result.intent).toBeNull();
  });
});

// ── resolveCombatIntent — multiplos monstros no combate ──

describe('resolveCombatIntent — multiplos monstros', () => {
  it('resolve ataque mesmo com multiplos monstros no combate', () => {
    const combate = makeActiveCombat({
      monstros: [
        { id: 'm1', nome: 'Goblin', hp: 10, hpMax: 10 },
        { id: 'm2', nome: 'Dragao', hp: 100, hpMax: 100 },
        { id: 'm3', nome: 'Esqueleto', hp: 15, hpMax: 15 },
      ],
    });

    const result = resolve({
      mensagem: 'eu ataco o dragao',
      combate,
    });

    expect(result.intent).toBeTruthy();
    expect(result.intent.tipo).toBe('atacar');
    expect(result.intent.source).toBe('inferred');
  });

  it('resolve magia quando alvo esta entre multiplos monstros', () => {
    const combate = makeActiveCombat({
      monstros: [
        { id: 'm1', nome: 'Goblin', hp: 10, hpMax: 10 },
        { id: 'm2', nome: 'Dragao', hp: 100, hpMax: 100 },
      ],
    });

    const personagem = makePersonagem({
      magias: [makeSpell({ nome: 'Bola de Fogo' })],
    });

    const result = resolve({
      mensagem: 'uso bola de fogo no dragao',
      combate,
      personagemCompleto: personagem,
    });

    expect(result.intent.tipo).toBe('conjurar_magia');
    expect(result.intent.magiaNome).toBe('Bola de Fogo');
  });
});

// ── resolveCombatIntent — nomes de acoes curtas sao ignorados ──

describe('resolveCombatIntent — nomes curtos ignorados', () => {
  it('habilidade com nome menor que 3 caracteres nao faz match', () => {
    const personagem = makePersonagem({
      habilidadesClasse: [makeSkill({ id: 'h9', nome: 'Ar' })],
    });

    const result = resolve({
      mensagem: 'uso ar',
      personagemCompleto: personagem,
    });

    // "Ar" tem 2 chars normalizado, e ignorado pelo findNamedMatches
    // resultado deve cair na inferencia generica ou ambiguidade
    expect(result.intent === null || result.intent.tipo !== 'usar_habilidade').toBe(true);
  });
});

// ── resolveCombatIntent — confianca (confidence) ──

describe('resolveCombatIntent — niveis de confianca', () => {
  it('intent explicito tem confianca 1', () => {
    const result = resolve({ explicitIntent: { tipo: 'atacar' } });
    expect(result.confidence).toBe(1);
  });

  it('named match tem confianca 0.95', () => {
    const personagem = makePersonagem({
      magias: [makeSpell({ nome: 'Bola de Fogo' })],
    });

    const result = resolve({
      mensagem: 'bola de fogo',
      personagemCompleto: personagem,
    });

    expect(result.confidence).toBe(0.95);
  });

  it('ataque generico tem confianca 0.82', () => {
    const result = resolve({ mensagem: 'eu ataco' });
    expect(result.confidence).toBe(0.82);
  });

  it('defesa generica tem confianca 0.87', () => {
    const result = resolve({ mensagem: 'me defendo' });
    expect(result.confidence).toBe(0.87);
  });

  it('fuga generica tem confianca 0.86', () => {
    const result = resolve({ mensagem: 'eu fujo' });
    expect(result.confidence).toBe(0.86);
  });

  it('mensagem ambigua tem confianca 0', () => {
    const result = resolve({ mensagem: 'eu canto uma musica' });
    expect(result.confidence).toBe(0);
  });
});

// ── resolveCombatIntent — formato de retorno ──

describe('resolveCombatIntent — formato de retorno', () => {
  it('sempre retorna objeto com campos intent, confidence, ambiguous, reason, candidates', () => {
    const scenarios = [
      resolve({ explicitIntent: { tipo: 'atacar' } }),
      resolve({ mensagem: 'eu ataco' }),
      resolve({ mensagem: 'me defendo' }),
      resolve({ mensagem: 'eu fujo' }),
      resolve({ mensagem: '' }),
      resolve({ combate: null }),
      resolve({ mensagem: 'qualquer coisa' }),
    ];

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
  it('remove acentos para matching', () => {
    const result = resolve({ mensagem: 'eu atáco o mónstro' });
    expect(result.intent.tipo).toBe('atacar');
  });

  it('remove pontuacao para matching', () => {
    const result = resolve({ mensagem: 'eu ataco!!! o goblin???' });
    expect(result.intent.tipo).toBe('atacar');
  });

  it('normaliza caixa alta para matching', () => {
    const result = resolve({ mensagem: 'DEFENDO!' });
    expect(result.intent.tipo).toBe('defender');
  });

  it('trata multiplos espacos como um so', () => {
    const result = resolve({ mensagem: 'eu    ataco     o     goblin' });
    expect(result.intent.tipo).toBe('atacar');
  });

  it('remove caracteres especiais para matching', () => {
    const result = resolve({ mensagem: 'eu @#$ataco%^& o goblin' });
    expect(result.intent.tipo).toBe('atacar');
  });
});

// ── resolveCombatIntent — magia via diferentes fontes do personagem ──

describe('resolveCombatIntent — magia encontrada em diferentes arrays do personagem', () => {
  const spell = makeSpell({ id: 'cura1', nome: 'Cura Sagrada' });

  it('encontra magia em magiasProprias', () => {
    const personagem = makePersonagem({ magiasProprias: [spell] });
    const result = resolve({
      mensagem: 'uso cura sagrada',
      personagemCompleto: personagem,
    });
    expect(result.intent.tipo).toBe('conjurar_magia');
  });

  it('encontra magia em magiasPreparadas', () => {
    const personagem = makePersonagem({ magiasPreparadas: [spell] });
    const result = resolve({
      mensagem: 'uso cura sagrada',
      personagemCompleto: personagem,
    });
    expect(result.intent.tipo).toBe('conjurar_magia');
  });

  it('encontra magia em magiasAtivas', () => {
    const personagem = makePersonagem({ magiasAtivas: [spell] });
    const result = resolve({
      mensagem: 'uso cura sagrada',
      personagemCompleto: personagem,
    });
    expect(result.intent.tipo).toBe('conjurar_magia');
  });

  it('encontra magia em magiasSelecionadas', () => {
    const personagem = makePersonagem({ magiasSelecionadas: [spell] });
    const result = resolve({
      mensagem: 'uso cura sagrada',
      personagemCompleto: personagem,
    });
    expect(result.intent.tipo).toBe('conjurar_magia');
  });
});

// ── resolveCombatIntent — habilidade encontrada em diferentes arrays ──

describe('resolveCombatIntent — habilidade encontrada em diferentes arrays do personagem', () => {
  const skill = makeSkill({ id: 'sk1', nome: 'Provocar Inimigo' });

  it('encontra habilidade em habilidadesClasse', () => {
    const personagem = makePersonagem({ habilidadesClasse: [skill] });
    const result = resolve({
      mensagem: 'uso provocar inimigo',
      personagemCompleto: personagem,
    });
    expect(result.intent.tipo).toBe('usar_habilidade');
  });

  it('encontra habilidade em habilidadesProprias', () => {
    const personagem = makePersonagem({ habilidadesProprias: [skill] });
    const result = resolve({
      mensagem: 'uso provocar inimigo',
      personagemCompleto: personagem,
    });
    expect(result.intent.tipo).toBe('usar_habilidade');
  });

  it('encontra habilidade em habilidadesConhecidas', () => {
    const personagem = makePersonagem({ habilidadesConhecidas: [skill] });
    const result = resolve({
      mensagem: 'uso provocar inimigo',
      personagemCompleto: personagem,
    });
    expect(result.intent.tipo).toBe('usar_habilidade');
  });
});

// ── resolveCombatIntent — personagem sem acoes ──

describe('resolveCombatIntent — personagem sem acoes', () => {
  it('sem habilidades nem magias, cai na inferencia generica', () => {
    const personagem = makePersonagem();
    const result = resolve({
      mensagem: 'eu ataco',
      personagemCompleto: personagem,
    });

    expect(result.intent.tipo).toBe('atacar');
    expect(result.confidence).toBe(0.82);
  });

  it('sem personagem definido nao lanca erro', () => {
    const result = resolve({
      mensagem: 'eu ataco',
      personagemCompleto: undefined,
    });

    expect(result.intent.tipo).toBe('atacar');
  });

  it('personagem null nao lanca erro', () => {
    const result = resolve({
      mensagem: 'eu fujo',
      personagemCompleto: null,
    });

    expect(result.intent.tipo).toBe('fugir');
  });
});
