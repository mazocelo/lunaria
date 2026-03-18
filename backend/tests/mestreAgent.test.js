import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseIAJson,
  parseXMLLikeResponse,
  sanitizeNarrativa,
  fallbackSolicitaDados,
  fallbackGancho,
  extrairTeste,
  validateParseResult,
  NarrativaExtractor,
  KNOWN_ACAO_TIPOS,
  MestreAgent,
  criarMestreRPG,
} from '../agents/Mestre/MestreAgent.js';

// ═══════════════════════════════════════════════════════════════
//  parseIAJson — parser robusto de JSON da IA
// ═══════════════════════════════════════════════════════════════

describe('parseIAJson', () => {
  it('parseia JSON valido diretamente', () => {
    const input = JSON.stringify({ narrativa: 'Voce entra na caverna.', fimDeTurno: false });
    const result = parseIAJson(input);
    expect(result).toEqual({ narrativa: 'Voce entra na caverna.', fimDeTurno: false });
  });

  it('parseia JSON envolto em markdown code block', () => {
    const input = '```json\n{"narrativa": "A porta se abre.", "fimDeTurno": true}\n```';
    const result = parseIAJson(input);
    expect(result.narrativa).toBe('A porta se abre.');
    expect(result.fimDeTurno).toBe(true);
  });

  it('parseia JSON com trailing commas', () => {
    const input = '```json\n{"narrativa": "Teste",}\n```';
    const result = parseIAJson(input);
    expect(result.narrativa).toBe('Teste');
  });

  it('extrai JSON embutido em texto livre', () => {
    const input = 'Aqui esta minha resposta:\n{"narrativa": "O dragao ruge!", "fimDeTurno": false}\nFim.';
    const result = parseIAJson(input);
    expect(result.narrativa).toBe('O dragao ruge!');
  });

  it('retorna null para conteudo totalmente invalido', () => {
    const result = parseIAJson('Isso nao e JSON nenhum, apenas texto puro.');
    expect(result).toBeNull();
  });

  it('parseia JSON com arrays de segmentos', () => {
    const input = JSON.stringify({
      narrativa: 'O mago lanca uma bola de fogo.',
      segmentos: [
        { tipo: 'narracao', text: 'O mago lanca uma bola de fogo.' },
        { tipo: 'fala_npc', text: 'Sentira meu poder!', speaker_label: 'Mago Negro' }
      ],
      fimDeTurno: false,
      solicitaDados: { solicita: false }
    });
    const result = parseIAJson(input);
    expect(result.segmentos).toHaveLength(2);
    expect(result.segmentos[1].speaker_label).toBe('Mago Negro');
  });

  it('parseia JSON com acoes mecanicas', () => {
    const input = JSON.stringify({
      narrativa: 'Voce encontra uma espada.',
      acoes: [
        { tipo: 'dar_item', item: 'Espada Longa', jogadorId: 'u1' },
        { tipo: 'aplicar_dano', dano: 5, alvoId: 'm1' }
      ]
    });
    const result = parseIAJson(input);
    expect(result.acoes).toHaveLength(2);
    expect(result.acoes[0].tipo).toBe('dar_item');
  });

  it('parseia JSON sem code block mas com ``` parcial', () => {
    const input = '```\n{"narrativa": "Algo acontece."}\n```';
    const result = parseIAJson(input);
    expect(result.narrativa).toBe('Algo acontece.');
  });
});

// ═══════════════════════════════════════════════════════════════
//  parseXMLLikeResponse — conversao de XML-like para JSON
// ═══════════════════════════════════════════════════════════════

describe('parseXMLLikeResponse', () => {
  it('retorna null para entrada vazia', () => {
    expect(parseXMLLikeResponse(null)).toBeNull();
    expect(parseXMLLikeResponse('')).toBeNull();
    expect(parseXMLLikeResponse(undefined)).toBeNull();
  });

  it('retorna null se nao detectar tags de protocolo', () => {
    expect(parseXMLLikeResponse('Texto puro sem tags.')).toBeNull();
  });

  it('extrai narrativa de <text> tags', () => {
    const input = '<narracao><text>O heroi avanca.</text><fimDeTurno>false</fimDeTurno></narracao>';
    const result = parseXMLLikeResponse(input);
    expect(result).not.toBeNull();
    expect(result.narrativa).toContain('O heroi avanca.');
  });

  it('extrai fimDeTurno corretamente', () => {
    const input = '<text>Algo acontece.</text><fimDeTurno>true</fimDeTurno>';
    const result = parseXMLLikeResponse(input);
    expect(result.fimDeTurno).toBe(true);
  });

  it('extrai segmentos com tipo e speaker_label', () => {
    const input = `
      <segment tipo="narracao" speaker_label="">
        <text>A floresta esta escura.</text>
      </segment>
      <segment tipo="fala_npc" speaker_label="Aldaric">
        <text>Voce nao passara!</text>
      </segment>
    `;
    const result = parseXMLLikeResponse(input);
    expect(result).not.toBeNull();
    expect(result.segmentos).toHaveLength(2);
    expect(result.segmentos[1].tipo).toBe('fala_npc');
    expect(result.segmentos[1].speaker_label).toBe('Aldaric');
  });

  it('extrai solicitaDados de tag self-closing', () => {
    const input = '<text>Role os dados!</text><solicitaDados solicita="true"/>';
    const result = parseXMLLikeResponse(input);
    expect(result.solicitaDados.solicita).toBe(true);
  });

  it('extrai metadados com local_atual e npcs_presentes', () => {
    const input = `
      <text>Voce chega na taverna.</text>
      <metadados>
        <local_atual>Taverna do Poney Saltitante</local_atual>
        <hora_ficcional>Noite</hora_ficcional>
        <npcs_presentes>Barkeep, Guerreiro Misterioso</npcs_presentes>
      </metadados>
    `;
    const result = parseXMLLikeResponse(input);
    expect(result.metadados).not.toBeNull();
    expect(result.metadados.local_atual).toBe('Taverna do Poney Saltitante');
    expect(result.metadados.npcs_presentes).toEqual(['Barkeep', 'Guerreiro Misterioso']);
  });

  it('extrai acoes de tags <acao>', () => {
    const input = '<text>Voce recebe uma pocao.</text><acao tipo="dar_item" item="Pocao de Cura" jogadorId="u1"/>';
    const result = parseXMLLikeResponse(input);
    expect(result.acoes).toHaveLength(1);
    expect(result.acoes[0].tipo).toBe('dar_item');
    expect(result.acoes[0].item).toBe('Pocao de Cura');
  });

  it('extrai combate iniciado', () => {
    const input = '<text>Um goblin aparece!</text><combate iniciado="true"/>';
    const result = parseXMLLikeResponse(input);
    expect(result.combate).toEqual({ iniciado: true });
  });
});

// ═══════════════════════════════════════════════════════════════
//  sanitizeNarrativa — remove tags de protocolo da narrativa
// ═══════════════════════════════════════════════════════════════

describe('sanitizeNarrativa', () => {
  it('retorna string vazia para null/undefined', () => {
    expect(sanitizeNarrativa(null)).toBe('');
    expect(sanitizeNarrativa(undefined)).toBe('');
    expect(sanitizeNarrativa('')).toBe('');
  });

  it('texto limpo permanece inalterado', () => {
    const text = 'O guerreiro saca sua espada e avanca contra o inimigo.';
    expect(sanitizeNarrativa(text)).toBe(text);
  });

  it('remove tags de protocolo com conteudo', () => {
    const text = 'O heroi avanca. <metadados><local_atual>Floresta</local_atual></metadados>';
    const result = sanitizeNarrativa(text);
    expect(result).not.toContain('<metadados>');
    expect(result).not.toContain('Floresta');
    expect(result).toContain('O heroi avanca.');
  });

  it('remove self-closing protocol tags', () => {
    const text = 'Algo acontece. <solicitaDados solicita="true"/>';
    const result = sanitizeNarrativa(text);
    expect(result).not.toContain('<solicitaDados');
    expect(result).toContain('Algo acontece.');
  });

  it('remove tags de segmentos do texto', () => {
    const text = '<segmentos><segment tipo="narracao"><text>Teste</text></segment></segmentos> Texto livre.';
    const result = sanitizeNarrativa(text);
    expect(result).not.toContain('<segmentos>');
    expect(result).toContain('Texto livre.');
  });

  it('limpa linhas vazias excessivas', () => {
    const text = 'Linha 1.\n\n\n\n\nLinha 2.';
    const result = sanitizeNarrativa(text);
    expect(result).toBe('Linha 1.\n\nLinha 2.');
  });

  it('remove tags de combate e acoes', () => {
    const text = 'O monstro ataca. <combate>dados de combate</combate> <acoes>lista de acoes</acoes>';
    const result = sanitizeNarrativa(text);
    expect(result).not.toContain('<combate>');
    expect(result).not.toContain('<acoes>');
    expect(result).toContain('O monstro ataca.');
  });
});

// ═══════════════════════════════════════════════════════════════
//  fallbackSolicitaDados — deteccao de rolagem na narrativa
// ═══════════════════════════════════════════════════════════════

describe('fallbackSolicitaDados', () => {
  it('nao modifica se ja possui solicitaDados', () => {
    const resp = {
      narrativa: '🎲 Role 1d20 para Percepcao!',
      solicitaDados: { solicita: true, teste: 'Percepcao', dificuldade: 'Dificil' }
    };
    fallbackSolicitaDados(resp);
    expect(resp.solicitaDados.dificuldade).toBe('Dificil');
  });

  it('detecta padrao "🎲 Role 1d20 para X!"', () => {
    const resp = { narrativa: 'Voce ouve um barulho. 🎲 Role 1d20 para Percepcao!' };
    fallbackSolicitaDados(resp);
    expect(resp.solicitaDados.solicita).toBe(true);
    expect(resp.solicitaDados.teste).toBe('Percepcao');
  });

  it('detecta padrao com dificuldade', () => {
    const resp = { narrativa: '🎲 Role 1d20 para Furtividade! (Dificuldade: Alta)' };
    fallbackSolicitaDados(resp);
    expect(resp.solicitaDados.solicita).toBe(true);
    expect(resp.solicitaDados.teste).toBe('Furtividade');
    expect(resp.solicitaDados.dificuldade).toBe('Alta');
  });

  it('detecta padrao "Faca um teste de X"', () => {
    const resp = { narrativa: 'A porta esta trancada. Faca um teste de Forca!' };
    fallbackSolicitaDados(resp);
    expect(resp.solicitaDados.solicita).toBe(true);
    expect(resp.solicitaDados.teste).toBe('Forca');
  });

  it('detecta padrao "Teste de X"', () => {
    const resp = { narrativa: 'Teste de Sabedoria!' };
    fallbackSolicitaDados(resp);
    expect(resp.solicitaDados.solicita).toBe(true);
    expect(resp.solicitaDados.teste).toBe('Sabedoria');
  });

  it('nao detecta se nao tem padrao de rolagem', () => {
    const resp = { narrativa: 'Voce caminha pela estrada tranquilamente.' };
    fallbackSolicitaDados(resp);
    expect(resp.solicitaDados).toBeUndefined();
  });

  it('nao quebra com narrativa undefined', () => {
    const resp = {};
    expect(() => fallbackSolicitaDados(resp)).not.toThrow();
  });

  it('detecta diferentes tipos de dado', () => {
    const resp = { narrativa: '🎲 Role 2d6 para Dano!' };
    fallbackSolicitaDados(resp);
    expect(resp.solicitaDados.solicita).toBe(true);
    expect(resp.solicitaDados.tipo).toBe('2d6');
  });
});

// ═══════════════════════════════════════════════════════════════
//  fallbackGancho — extracao de gancho da ultima frase
// ═══════════════════════════════════════════════════════════════

describe('fallbackGancho', () => {
  it('nao sobrescreve gancho existente', () => {
    const resp = { narrativa: 'Algo acontece. O que voce faz?', gancho: 'Gancho original' };
    fallbackGancho(resp);
    expect(resp.gancho).toBe('Gancho original');
  });

  it('nao extrai se fimDeTurno=true', () => {
    const resp = { narrativa: 'O turno termina com uma explosao brilhante.', fimDeTurno: true };
    fallbackGancho(resp);
    expect(resp.gancho).toBeUndefined();
  });

  it('nao extrai se solicitaDados ativo', () => {
    const resp = { narrativa: 'Role os dados agora!', solicitaDados: { solicita: true } };
    fallbackGancho(resp);
    expect(resp.gancho).toBeUndefined();
  });

  it('extrai ultima frase como gancho', () => {
    const resp = {
      narrativa: 'Voce entra na sala escura. Uma sombra se move no canto. O que voce faz a seguir?'
    };
    fallbackGancho(resp);
    expect(resp.gancho).toBe('O que voce faz a seguir?');
  });

  it('nao extrai frase muito curta (<=10 chars)', () => {
    const resp = { narrativa: 'Vai.' };
    fallbackGancho(resp);
    expect(resp.gancho).toBeUndefined();
  });

  it('nao quebra com narrativa vazia', () => {
    const resp = { narrativa: '' };
    expect(() => fallbackGancho(resp)).not.toThrow();
    expect(resp.gancho).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════
//  extrairTeste — extrai dados de teste de solicitaDados
// ═══════════════════════════════════════════════════════════════

describe('extrairTeste', () => {
  it('retorna null se nao solicita dados', () => {
    expect(extrairTeste({})).toBeNull();
    expect(extrairTeste({ solicitaDados: { solicita: false } })).toBeNull();
  });

  it('extrai teste completo', () => {
    const resp = {
      solicitaDados: {
        solicita: true,
        teste: 'Percepcao',
        dificuldade: 'Dificil',
        atributo: 'sabedoria',
        tipo: 'd20'
      }
    };
    const result = extrairTeste(resp);
    expect(result.teste).toBe('Percepcao');
    expect(result.dificuldade).toBe('Dificil');
    expect(result.atributo).toBe('sabedoria');
    expect(result.tipoDado).toBe('d20');
    expect(result.origem).toBe('mestre');
  });

  it('preenche defaults para campos ausentes', () => {
    const resp = { solicitaDados: { solicita: true } };
    const result = extrairTeste(resp);
    expect(result.teste).toBe('');
    expect(result.tipoDado).toBe('d20');
    expect(result.atributo).toBeNull();
    expect(result.dificuldade).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════
//  validateParseResult — validacao e auto-reparo
// ═══════════════════════════════════════════════════════════════

describe('validateParseResult', () => {
  it('nao quebra com null', () => {
    expect(() => validateParseResult(null, 'test', 'test')).not.toThrow();
  });

  it('auto-repara segmentos sem tipo', () => {
    const resp = {
      segmentos: [{ text: 'Teste' }, { text: 'Outro', tipo: 'fala_npc' }]
    };
    validateParseResult(resp, 'test', 'test');
    expect(resp.segmentos[0].tipo).toBe('narracao');
    expect(resp.segmentos[1].tipo).toBe('fala_npc');
  });

  it('auto-repara acoes com espacos no tipo', () => {
    const resp = {
      acoes: [{ tipo: 'dar item' }, { tipo: 'aplicar dano' }]
    };
    validateParseResult(resp, 'test', 'test');
    expect(resp.acoes[0].tipo).toBe('dar_item');
    expect(resp.acoes[1].tipo).toBe('aplicar_dano');
  });

  it('mantem acoes com tipo valido intactas', () => {
    const resp = {
      acoes: [{ tipo: 'curar', quantidade: 10 }]
    };
    validateParseResult(resp, 'test', 'test');
    expect(resp.acoes[0].tipo).toBe('curar');
  });
});

// ═══════════════════════════════════════════════════════════════
//  NarrativaExtractor — extracao de narrativa em streaming
// ═══════════════════════════════════════════════════════════════

describe('NarrativaExtractor', () => {
  it('extrai campo narrativa de JSON completo', () => {
    const extractor = new NarrativaExtractor();
    const json = '{"narrativa": "O dragao aparece nas montanhas.", "fimDeTurno": false}';
    const delta = extractor.feed(json);
    expect(delta).toBe('O dragao aparece nas montanhas.');
    expect(extractor.isDone).toBe(true);
    expect(extractor.extracted).toBe('O dragao aparece nas montanhas.');
  });

  it('extrai token a token', () => {
    const extractor = new NarrativaExtractor();
    const json = '{"narrativa": "ABC"}';
    let accumulated = '';
    for (const char of json) {
      accumulated += extractor.feed(char);
    }
    expect(accumulated).toBe('ABC');
    expect(extractor.isDone).toBe(true);
  });

  it('lida com escape sequences (\\n, \\t)', () => {
    const extractor = new NarrativaExtractor();
    const json = '{"narrativa": "Linha 1\\nLinha 2\\tTabulacao"}';
    const delta = extractor.feed(json);
    expect(delta).toBe('Linha 1\nLinha 2\tTabulacao');
  });

  it('lida com aspas escapadas', () => {
    const extractor = new NarrativaExtractor();
    const json = '{"narrativa": "Ele disse \\"Ola\\""}';
    const delta = extractor.feed(json);
    expect(delta).toContain('Ele disse "Ola"');
    expect(extractor.isDone).toBe(true);
  });

  it('funciona com chunks parciais', () => {
    const extractor = new NarrativaExtractor();
    const chunks = ['{"narrat', 'iva": "Parte ', '1 e parte 2', '.","fim', 'DeTurno": false}'];
    let full = '';
    for (const chunk of chunks) {
      full += extractor.feed(chunk);
    }
    expect(full).toBe('Parte 1 e parte 2.');
    expect(extractor.isDone).toBe(true);
  });

  it('nao extrai apos campo fechar', () => {
    const extractor = new NarrativaExtractor();
    extractor.feed('{"narrativa": "Texto"}');
    expect(extractor.isDone).toBe(true);
    const extra = extractor.feed(', "outro": "ignorado"');
    expect(extra).toBe('');
    expect(extractor.extracted).toBe('Texto');
  });

  it('fullBuffer acumula tudo', () => {
    const extractor = new NarrativaExtractor();
    extractor.feed('{"narr');
    extractor.feed('ativa": "X"}');
    expect(extractor.fullBuffer).toBe('{"narrativa": "X"}');
  });
});

// ═══════════════════════════════════════════════════════════════
//  KNOWN_ACAO_TIPOS — constante de tipos de acao validos
// ═══════════════════════════════════════════════════════════════

describe('KNOWN_ACAO_TIPOS', () => {
  it('contem os tipos basicos de acao', () => {
    const expected = [
      'dar_item', 'remover_item', 'curar', 'aplicar_dano',
      'aplicar_status', 'remover_status', 'usar_habilidade',
      'conjurar_magia', 'dar_xp', 'iniciar_fase_boss'
    ];
    for (const tipo of expected) {
      expect(KNOWN_ACAO_TIPOS.has(tipo)).toBe(true);
    }
  });

  it('nao contem tipos inventados', () => {
    expect(KNOWN_ACAO_TIPOS.has('voar')).toBe(false);
    expect(KNOWN_ACAO_TIPOS.has('explodir_tudo')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
//  MestreAgent — construcao e configuracao
// ═══════════════════════════════════════════════════════════════

describe('MestreAgent', () => {
  it('cria instancia com parametros minimos', () => {
    const agent = new MestreAgent();
    expect(agent).toBeDefined();
    expect(agent.temas).toEqual([]);
    expect(agent.personagens).toEqual([]);
    expect(agent.historico).toEqual([]);
  });

  it('cria instancia com temas e personagens', () => {
    const temas = ['Fantasia Medieval', 'Terror'];
    const personagens = [
      { nome: 'Arthas', classe: 'Guerreiro', nivel: 5, raca: 'Humano' }
    ];
    const agent = new MestreAgent(temas, personagens);
    expect(agent.temas).toContain('Fantasia Medieval');
    expect(agent.temas).toContain('Terror');
    expect(agent.personagens.length).toBe(1);
  });

  it('cria instancia com config override', () => {
    const config = {
      modelo: 'gemini-2.5-flash',
      temperatura: 0.7,
      max_tokens: 4000
    };
    const agent = new MestreAgent([], [], config);
    expect(agent.configOverride).toEqual(config);
  });

  it('armazena roteiro e catalogo', () => {
    const agent = new MestreAgent(
      [], [], null,
      'Catalogo de monstros...',
      'Roteiro condensado...',
      'Contexto persistente...'
    );
    expect(agent.catalogo).toBe('Catalogo de monstros...');
    expect(agent.roteiroCondensado).toBe('Roteiro condensado...');
    expect(agent.contextoPersistenteFormatado).toBe('Contexto persistente...');
  });

  it('inicializa modelo na construcao', () => {
    const agent = new MestreAgent();
    expect(agent.model).not.toBeNull();
    expect(agent.chain).not.toBeNull();
    expect(agent.modelName).not.toBeNull();
  });

  it('atualiza temas reinicializa modelo', () => {
    const agent = new MestreAgent(['Fantasia']);
    const oldModel = agent.model;
    agent.atualizarTemas(['Sci-Fi', 'Cyberpunk']);
    expect(agent.temas).toContain('Sci-Fi');
    // Model is re-initialized
    expect(agent.model).toBeDefined();
  });

  it('atualiza personagens reinicializa modelo', () => {
    const agent = new MestreAgent([], [{ nome: 'A', classe: 'Guerreiro', nivel: 1, raca: 'Humano' }]);
    agent.atualizarPersonagens([
      { nome: 'B', classe: 'Mago', nivel: 3, raca: 'Elfo' }
    ]);
    expect(agent.personagens.length).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════
//  criarMestreRPG — factory function
// ═══════════════════════════════════════════════════════════════

describe('criarMestreRPG', () => {
  it('cria mestre com parametros minimos', async () => {
    const mestre = await criarMestreRPG();
    expect(mestre).toBeInstanceOf(MestreAgent);
  });

  it('cria mestre com parametros completos', async () => {
    const mestre = await criarMestreRPG(
      ['Fantasia Medieval'],
      [{ nome: 'Heroi', classe: 'Paladino', nivel: 3, raca: 'Humano' }],
      { modelo: 'gemini-2.5-flash', temperatura: 0.85 },
      'Catalogo...',
      'Roteiro...',
      'Contexto...',
      { historia: { config: {} } }
    );
    expect(mestre).toBeInstanceOf(MestreAgent);
    expect(mestre.temas).toContain('Fantasia Medieval');
  });
});

// ═══════════════════════════════════════════════════════════════
//  Cenarios integrados — fluxo completo parse + validate
// ═══════════════════════════════════════════════════════════════

describe('Cenarios integrados', () => {
  it('parse JSON + validate + fallbacks em resposta completa', () => {
    const llmOutput = JSON.stringify({
      narrativa: 'Voce empurra a porta pesada. O corredor revela tochas apagadas. O que voce faz agora?',
      segmentos: [
        { tipo: 'narracao', text: 'Voce empurra a porta pesada. O corredor revela tochas apagadas.' },
        { text: 'O que voce faz agora?' }
      ],
      fimDeTurno: false,
      solicitaDados: { solicita: false },
      acoes: [],
      metadados: { local_atual: 'Corredor Escuro' }
    });

    const parsed = parseIAJson(llmOutput);
    expect(parsed).not.toBeNull();

    validateParseResult(parsed, 'gemini-2.5-flash', 'narrarAcao');
    // Segmento sem tipo foi reparado
    expect(parsed.segmentos[1].tipo).toBe('narracao');

    // Fallbacks
    fallbackSolicitaDados(parsed);
    expect(parsed.solicitaDados.solicita).toBe(false);

    fallbackGancho(parsed);
    expect(parsed.gancho).toBe('O que voce faz agora?');
  });

  it('parse resposta com solicitacao de dados no texto', () => {
    const llmOutput = JSON.stringify({
      narrativa: 'A ponte parece fragil. 🎲 Role 1d20 para Agilidade! (Dificuldade: Alta)',
      segmentos: [{ tipo: 'narracao', text: 'A ponte parece fragil. Role 1d20 para Agilidade!' }],
      fimDeTurno: false,
      solicitaDados: { solicita: false },
      metadados: {}
    });

    const parsed = parseIAJson(llmOutput);
    fallbackSolicitaDados(parsed);
    expect(parsed.solicitaDados.solicita).toBe(true);
    expect(parsed.solicitaDados.teste).toBe('Agilidade');
    expect(parsed.solicitaDados.dificuldade).toBe('Alta');

    const teste = extrairTeste(parsed);
    expect(teste).not.toBeNull();
    expect(teste.teste).toBe('Agilidade');
    expect(teste.tipoDado).toBe('1d20');
  });

  it('parse resposta XML-like completa + validate', () => {
    const xmlOutput = `
      <segment tipo="narracao" speaker_label="">
        <text>O castelo se ergue diante de voces.</text>
      </segment>
      <segment tipo="fala_npc" speaker_label="Guardiao">
        <text>Quem ousa se aproximar?</text>
      </segment>
      <fimDeTurno>false</fimDeTurno>
      <metadados>
        <local_atual>Portao do Castelo</local_atual>
        <hora_ficcional>Crepusculo</hora_ficcional>
      </metadados>
      <acao tipo="aplicar_status" status="intimidado" jogadorId="u1"/>
    `;

    // parseIAJson deve tentar XML-like como fallback
    const parsed = parseIAJson(xmlOutput);
    expect(parsed).not.toBeNull();
    expect(parsed.narrativa).toContain('O castelo se ergue');
    expect(parsed.segmentos).toHaveLength(2);
    expect(parsed.acoes).toHaveLength(1);
    expect(parsed.acoes[0].tipo).toBe('aplicar_status');
    expect(parsed.metadados.local_atual).toBe('Portao do Castelo');
  });

  it('parse resposta com combate iniciado', () => {
    const llmOutput = JSON.stringify({
      narrativa: 'Um grupo de goblins embosca vocês!',
      segmentos: [{ tipo: 'narracao', text: 'Um grupo de goblins embosca vocês!' }],
      fimDeTurno: false,
      combate: {
        iniciado: true,
        inimigos: [
          { nome: 'Goblin Guerreiro', quantidade: 3, nivel: 2 },
          { nome: 'Goblin Arqueiro', quantidade: 1, nivel: 3 }
        ]
      },
      solicitaDados: { solicita: false },
      metadados: { tensao: 'alta' }
    });

    const parsed = parseIAJson(llmOutput);
    expect(parsed.combate).toBeDefined();
    expect(parsed.combate.iniciado).toBe(true);
    expect(parsed.combate.inimigos).toHaveLength(2);
  });

  it('streaming extractor funciona com resposta de combate', () => {
    const extractor = new NarrativaExtractor();
    const json = '{"narrativa": "O goblin ataca com sua adaga enferrujada!", "combate": {"iniciado": true}, "fimDeTurno": false}';

    // Simular chunks como viriam de uma LLM
    const chunkSize = 15;
    let fullNarrativa = '';
    for (let i = 0; i < json.length; i += chunkSize) {
      const chunk = json.slice(i, i + chunkSize);
      fullNarrativa += extractor.feed(chunk);
    }

    expect(fullNarrativa).toBe('O goblin ataca com sua adaga enferrujada!');
    expect(extractor.isDone).toBe(true);
  });
});
