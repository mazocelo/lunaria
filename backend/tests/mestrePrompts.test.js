import { describe, it, expect } from 'vitest';
import { criarPromptSistema, montarSchemaCompacto } from '../agents/Mestre/prompts/sistema.js';
import { criarPromptNarracao, criarPromptReacao } from '../agents/Mestre/prompts/narracao.js';
import { criarPromptInicio, criarPromptBoasVindas } from '../agents/Mestre/prompts/inicio.js';
import {
  criarPromptTurno,
  criarPromptInicioTurno,
  criarPromptTurnoPrimeira,
  criarPromptTurnoSeguinte,
  criarPromptTurnoFinal,
} from '../agents/Mestre/prompts/turno.js';

// ── Fixtures reutilizaveis ──

const personagemCompleto = {
  nome: 'Thorin',
  classe: 'Guerreiro',
  raca: 'Anão',
  nivel: 5,
  jogador: 'Carlos',
  atributos: {
    forca: 16,
    inteligencia: 10,
    agilidade: 12,
    constituicao: 14,
    destreza: 11,
    carisma: 8,
  },
  background: 'Filho de um rei exilado, busca recuperar seu trono.',
  equipamentos: [{ nome: 'Machado de Guerra' }, { nome: 'Escudo de Ferro' }],
  vantagens: [
    { nome: 'Resistência Anã', usar: 0, descricao: 'Resistente a venenos', bonus: [{ atributo: 'constituicao', valor: 2 }] },
    { nome: 'Golpe Brutal', usar: 1, descricao: 'Um golpe devastador', dano_base: '2d8' },
  ],
  desvantagens: [
    { nome: 'Ganancioso', descricao: 'Fascinado por ouro e joias', efeito: { dc: 12, atributo_teste: 'carisma', descricao: 'Compelido a pegar tesouros' } },
  ],
  habilidadesClasse: [
    {
      id: 1,
      nome: 'Investida',
      tipo: 'tecnica',
      escola: null,
      custo: 3,
      origem: 'criacao',
    },
  ],
  magias: [
    {
      id: 2,
      nome: 'Cura Menor',
      tipo: 'magia',
      escola: 'restauracao',
      custo: 2,
      origem: 'criacao',
    },
  ],
};

const personagemMinimo = {
  nome: 'Aventureiro Genérico',
};

const mestreConfig = {
  personalidade: 'Sombrio e misterioso, com um humor negro sutil.',
  tom_narrativo: 'Dark fantasy',
  regras_especiais: 'Mortes permanentes. Sem ressurreição fácil.',
};

const temas = ['fantasia medieval', 'horror cósmico', 'política'];
const catalogo = 'Monstros: Goblin Nv1, Troll Nv3, Dragão Nv10\nEquipamentos: Espada Longa, Arco Curto, Poção de Cura';
const roteiroCondensado = 'Arco 1: Os heróis partem da vila de Pedraverde rumo às Montanhas Sombrias.';
const contextoPersistente = 'Sessão anterior: O grupo derrotou os goblins e encontrou um mapa misterioso.';

// ══════════════════════════════════════════════════════════════════════════
// criarPromptSistema — prompt base do sistema
// ══════════════════════════════════════════════════════════════════════════

describe('criarPromptSistema', () => {
  // ── Retorno basico ──

  describe('retorno basico', () => {
    it('retorna string nao vazia sem argumentos', () => {
      const result = criarPromptSistema();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('retorna string nao vazia com todos os argumentos', () => {
      const result = criarPromptSistema(
        temas,
        [personagemCompleto],
        mestreConfig,
        catalogo,
        roteiroCondensado,
        contextoPersistente,
      );
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // ── Secoes esperadas — identidade ──

  describe('secao de identidade', () => {
    it('contem role de Mestre RPG', () => {
      const result = criarPromptSistema();
      expect(result).toContain('Mestre RPG');
    });

    it('contem idioma Português Brasileiro', () => {
      const result = criarPromptSistema();
      expect(result).toContain('Português Brasileiro');
    });

    it('contem saída JSON', () => {
      const result = criarPromptSistema();
      expect(result).toContain('JSON');
    });

    it('contem regras invioláveis', () => {
      const result = criarPromptSistema();
      expect(result).toContain('REGRAS INVIOLAVEIS');
    });
  });

  // ── Secoes esperadas — regras de comportamento ──

  describe('secao de regras de comportamento', () => {
    it('contem REGRAS DE COMPORTAMENTO', () => {
      const result = criarPromptSistema();
      expect(result).toContain('REGRAS DE COMPORTAMENTO');
    });

    it('contem instrucao sobre segmentos', () => {
      const result = criarPromptSistema();
      expect(result).toContain('segmentos');
    });
  });

  // ── Secoes esperadas — schema ──

  describe('secao de schema', () => {
    it('contem FORMATO DE RESPOSTA', () => {
      const result = criarPromptSistema();
      expect(result).toContain('FORMATO DE RESPOSTA');
    });

    it('contem campo narrativa no schema', () => {
      const result = criarPromptSistema();
      expect(result).toContain('"narrativa"');
    });

    it('contem campo segmentos no schema', () => {
      const result = criarPromptSistema();
      expect(result).toContain('"segmentos"');
    });

    it('contem campo fimDeTurno no schema', () => {
      const result = criarPromptSistema();
      expect(result).toContain('"fimDeTurno"');
    });

    it('contem campo solicitaDados no schema', () => {
      const result = criarPromptSistema();
      expect(result).toContain('"solicitaDados"');
    });

    it('contem LEMBRE-SE (recency position)', () => {
      const result = criarPromptSistema();
      expect(result).toContain('LEMBRE-SE');
    });
  });

  // ── Secoes esperadas — sistema mecanico ──

  describe('secao de sistema mecanico', () => {
    it('contem SISTEMA DE ATRIBUTOS', () => {
      const result = criarPromptSistema();
      expect(result).toContain('SISTEMA DE ATRIBUTOS');
    });

    it('contem ROLAGEM DE DADOS', () => {
      const result = criarPromptSistema();
      expect(result).toContain('ROLAGEM DE DADOS');
    });

    it('contem COMBATE', () => {
      const result = criarPromptSistema();
      expect(result).toContain('COMBATE');
    });

    it('contem AÇÕES MECÂNICAS', () => {
      const result = criarPromptSistema();
      expect(result).toContain('AÇÕES MECÂNICAS');
    });
  });

  // ── Personagens ──

  describe('inclusao de personagens', () => {
    it('inclui nome do personagem quando fornecido', () => {
      const result = criarPromptSistema([], [personagemCompleto]);
      expect(result).toContain('Thorin');
    });

    it('inclui classe do personagem', () => {
      const result = criarPromptSistema([], [personagemCompleto]);
      expect(result).toContain('Guerreiro');
    });

    it('inclui raca do personagem', () => {
      const result = criarPromptSistema([], [personagemCompleto]);
      expect(result).toContain('Anão');
    });

    it('inclui nivel do personagem', () => {
      const result = criarPromptSistema([], [personagemCompleto]);
      expect(result).toContain('Nv5');
    });

    it('inclui nome do jogador', () => {
      const result = criarPromptSistema([], [personagemCompleto]);
      expect(result).toContain('Carlos');
    });

    it('inclui atributos do personagem', () => {
      const result = criarPromptSistema([], [personagemCompleto]);
      expect(result).toContain('FOR 16');
      expect(result).toContain('INT 10');
      expect(result).toContain('AGI 12');
    });

    it('inclui background do personagem', () => {
      const result = criarPromptSistema([], [personagemCompleto]);
      expect(result).toContain('rei exilado');
    });

    it('inclui equipamentos do personagem', () => {
      const result = criarPromptSistema([], [personagemCompleto]);
      expect(result).toContain('Machado de Guerra');
      expect(result).toContain('Escudo de Ferro');
    });

    it('inclui vantagens passivas do personagem', () => {
      const result = criarPromptSistema([], [personagemCompleto]);
      expect(result).toContain('Resistência Anã');
      expect(result).toContain('passiva');
    });

    it('inclui vantagens ativas do personagem', () => {
      const result = criarPromptSistema([], [personagemCompleto]);
      expect(result).toContain('Golpe Brutal');
      expect(result).toContain('ativa');
    });

    it('inclui desvantagens do personagem', () => {
      const result = criarPromptSistema([], [personagemCompleto]);
      expect(result).toContain('Ganancioso');
      expect(result).toContain('DC 12');
    });

    it('inclui habilidades de classe', () => {
      const result = criarPromptSistema([], [personagemCompleto]);
      expect(result).toContain('Investida');
      expect(result).toContain('Custo: 3');
    });

    it('inclui magias conhecidas', () => {
      const result = criarPromptSistema([], [personagemCompleto]);
      expect(result).toContain('Cura Menor');
      expect(result).toContain('restauracao');
    });

    it('inclui header PERSONAGENS JOGANDO', () => {
      const result = criarPromptSistema([], [personagemCompleto]);
      expect(result).toContain('PERSONAGENS JOGANDO');
    });

    it('inclui marcador [PJ]', () => {
      const result = criarPromptSistema([], [personagemCompleto]);
      expect(result).toContain('[PJ]');
    });

    it('lida com personagem minimo (apenas nome)', () => {
      const result = criarPromptSistema([], [personagemMinimo]);
      expect(result).toContain('Aventureiro Genérico');
    });

    it('inclui multiplos personagens', () => {
      const segundo = { nome: 'Elara', classe: 'Maga', raca: 'Elfa', nivel: 3 };
      const result = criarPromptSistema([], [personagemCompleto, segundo]);
      expect(result).toContain('Thorin');
      expect(result).toContain('Elara');
    });

    it('omite secao de personagens quando array vazio', () => {
      const result = criarPromptSistema([], []);
      expect(result).not.toContain('PERSONAGENS JOGANDO');
    });
  });

  // ── Temas ──

  describe('inclusao de temas', () => {
    it('inclui temas quando fornecidos', () => {
      const result = criarPromptSistema(temas);
      expect(result).toContain('fantasia medieval');
      expect(result).toContain('horror cósmico');
      expect(result).toContain('política');
    });

    it('inclui TEMAS DA CAMPANHA', () => {
      const result = criarPromptSistema(temas);
      expect(result).toContain('TEMAS DA CAMPANHA');
    });

    it('omite temas quando array vazio', () => {
      const result = criarPromptSistema([]);
      expect(result).not.toContain('TEMAS DA CAMPANHA');
    });

    it('omite temas quando nao fornecido', () => {
      const result = criarPromptSistema();
      expect(result).not.toContain('TEMAS DA CAMPANHA');
    });
  });

  // ── Mestre Config ──

  describe('inclusao de mestreConfig', () => {
    it('inclui personalidade do mestre', () => {
      const result = criarPromptSistema([], [], mestreConfig);
      expect(result).toContain('PERSONALIDADE');
      expect(result).toContain('misterioso');
    });

    it('inclui tom narrativo do mestre', () => {
      const result = criarPromptSistema([], [], mestreConfig);
      expect(result).toContain('TOM NARRATIVO');
      expect(result).toContain('Dark fantasy');
    });

    it('inclui regras especiais do mestre', () => {
      const result = criarPromptSistema([], [], mestreConfig);
      expect(result).toContain('REGRAS ESPECIAIS');
      expect(result).toContain('Mortes permanentes');
    });

    it('funciona sem mestreConfig (null)', () => {
      const result = criarPromptSistema([], [], null);
      expect(result).not.toContain('PERSONALIDADE');
      expect(result).not.toContain('TOM NARRATIVO');
    });
  });

  // ── Catalogo ──

  describe('inclusao de catalogo', () => {
    it('inclui catalogo quando fornecido', () => {
      const result = criarPromptSistema([], [], null, catalogo);
      expect(result).toContain('CATÁLOGO DO MUNDO');
      expect(result).toContain('Goblin');
    });

    it('omite catalogo quando vazio', () => {
      const result = criarPromptSistema([], [], null, '');
      expect(result).not.toContain('CATÁLOGO DO MUNDO');
    });
  });

  // ── Roteiro ──

  describe('inclusao de roteiro', () => {
    it('inclui roteiro quando fornecido', () => {
      const result = criarPromptSistema([], [], null, '', roteiroCondensado);
      expect(result).toContain('ROTEIRO DA AVENTURA');
      expect(result).toContain('Pedraverde');
    });

    it('inclui regras do roteiro', () => {
      const result = criarPromptSistema([], [], null, '', roteiroCondensado);
      expect(result).toContain('REGRAS DO ROTEIRO');
    });

    it('omite roteiro quando vazio', () => {
      const result = criarPromptSistema([], [], null, '', '');
      expect(result).not.toContain('ROTEIRO DA AVENTURA');
    });
  });

  // ── Contexto persistente ──

  describe('inclusao de contexto persistente', () => {
    it('inclui contexto persistente quando fornecido', () => {
      const result = criarPromptSistema([], [], null, '', '', contextoPersistente);
      expect(result).toContain('CONTEXTO PERSISTENTE DO MESTRE');
      expect(result).toContain('mapa misterioso');
    });

    it('omite contexto persistente quando vazio', () => {
      const result = criarPromptSistema([], [], null, '', '', '');
      expect(result).not.toContain('CONTEXTO PERSISTENTE DO MESTRE');
    });
  });

  // ── Schema variants ──

  describe('schema variant', () => {
    it('usa schema expandido por padrao (full)', () => {
      const result = criarPromptSistema([], [], null, '', '', '', { schemaVariant: 'full' });
      // Schema expandido contem campo narracao dentro de segmentos
      expect(result).toContain('"narracao"');
      expect(result).toContain('"emocao"');
      expect(result).toContain('"ritmo"');
      expect(result).toContain('"intensidade"');
    });

    it('usa schema compacto quando solicitado', () => {
      const result = criarPromptSistema([], [], null, '', '', '', { schemaVariant: 'compact' });
      // Schema compacto nao contem campo narracao dentro de segmentos
      expect(result).not.toContain('"emocao"');
      expect(result).not.toContain('"ritmo": "medio"');
    });

    it('schema compact produz output menor que full', () => {
      const full = criarPromptSistema([], [], null, '', '', '', { schemaVariant: 'full' });
      const compact = criarPromptSistema([], [], null, '', '', '', { schemaVariant: 'compact' });
      expect(compact.length).toBeLessThan(full.length);
    });

    it('ambos schemas contem campos obrigatorios', () => {
      const full = criarPromptSistema([], [], null, '', '', '', { schemaVariant: 'full' });
      const compact = criarPromptSistema([], [], null, '', '', '', { schemaVariant: 'compact' });
      for (const schema of [full, compact]) {
        expect(schema).toContain('"narrativa"');
        expect(schema).toContain('"segmentos"');
        expect(schema).toContain('"fimDeTurno"');
        expect(schema).toContain('"solicitaDados"');
        expect(schema).toContain('FORMATO DE RESPOSTA');
      }
    });

    it('default (sem options) usa schema full', () => {
      const semOptions = criarPromptSistema();
      const comFull = criarPromptSistema([], [], null, '', '', '', { schemaVariant: 'full' });
      // Ambos devem ter o schema expandido (com emocao/ritmo/intensidade)
      expect(semOptions).toContain('"emocao"');
      expect(comFull).toContain('"emocao"');
    });
  });

  // ── Conteudo em portugues ──

  describe('conteudo em portugues', () => {
    it('contem termos em portugues no prompt', () => {
      const result = criarPromptSistema();
      expect(result).toContain('Mestre');
      expect(result).toContain('narrativa');
      expect(result).toContain('jogador');
      expect(result).toContain('cenário');
    });
  });

  // ── Dados do mundo (zona de referencia) ──

  describe('zona de dados do mundo', () => {
    it('contem delimitador de dados do mundo', () => {
      const result = criarPromptSistema();
      expect(result).toContain('Dados do Mundo');
    });

    it('contem FIM dos dados do mundo', () => {
      const result = criarPromptSistema();
      expect(result).toContain('FIM — Dados do Mundo');
    });
  });

  // ── Graceful com parametros vazios/nulos ──

  describe('parametros vazios e nulos', () => {
    it('nao lanca erro com undefined em todos os campos', () => {
      expect(() => criarPromptSistema(undefined, undefined, undefined, undefined, undefined, undefined)).not.toThrow();
    });

    it('nao lanca erro com null em campos que aceitam null', () => {
      expect(() => criarPromptSistema(null, null, null, null, null, null)).not.toThrow();
    });

    it('retorna string valida mesmo com arrays nulos', () => {
      const result = criarPromptSistema(null, null, null, null, null, null);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(100);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// montarSchemaCompacto — export nomeado separado
// ══════════════════════════════════════════════════════════════════════════

describe('montarSchemaCompacto', () => {
  it('retorna string nao vazia', () => {
    const result = montarSchemaCompacto();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('contem FORMATO DE RESPOSTA', () => {
    const result = montarSchemaCompacto();
    expect(result).toContain('FORMATO DE RESPOSTA');
  });

  it('contem campos obrigatorios do JSON', () => {
    const result = montarSchemaCompacto();
    expect(result).toContain('"narrativa"');
    expect(result).toContain('"segmentos"');
    expect(result).toContain('"fimDeTurno"');
    expect(result).toContain('"solicitaDados"');
  });

  it('contem memoria_semantica', () => {
    const result = montarSchemaCompacto();
    expect(result).toContain('memoria_semantica');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// criarPromptNarracao — prompts de narracao
// ══════════════════════════════════════════════════════════════════════════

describe('criarPromptNarracao', () => {
  // ── Retorno basico ──

  describe('retorno basico', () => {
    it('retorna string nao vazia', () => {
      const result = criarPromptNarracao('Carlos', 'Thorin', 'Eu ataco o goblin');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // ── Conteudo ──

  describe('conteudo do prompt', () => {
    it('inclui nome do jogador', () => {
      const result = criarPromptNarracao('Carlos', 'Thorin', 'Eu ataco o goblin');
      expect(result).toContain('Carlos');
    });

    it('inclui nome do personagem', () => {
      const result = criarPromptNarracao('Carlos', 'Thorin', 'Eu ataco o goblin');
      expect(result).toContain('Thorin');
    });

    it('inclui acao do jogador', () => {
      const result = criarPromptNarracao('Carlos', 'Thorin', 'Eu ataco o goblin com minha espada');
      expect(result).toContain('Eu ataco o goblin com minha espada');
    });

    it('inclui instrucoes de narracao', () => {
      const result = criarPromptNarracao('Carlos', 'Thorin', 'Olho ao redor');
      expect(result).toContain('INSTRUCOES');
    });

    it('inclui referencia a solicitaDados', () => {
      const result = criarPromptNarracao('Carlos', 'Thorin', 'Pulo o abismo');
      expect(result).toContain('solicitaDados');
    });

    it('inclui referencia a JSON', () => {
      const result = criarPromptNarracao('Carlos', 'Thorin', 'Acao');
      expect(result).toContain('JSON');
    });

    it('contem termos em portugues', () => {
      const result = criarPromptNarracao('Ana', 'Elara', 'Examino a porta');
      expect(result).toContain('Narre');
      expect(result).toContain('turno');
    });
  });

  // ── Parametros especiais ──

  describe('parametros especiais', () => {
    it('aceita acao vazia', () => {
      const result = criarPromptNarracao('Carlos', 'Thorin', '');
      expect(typeof result).toBe('string');
      expect(result).toContain('Carlos');
    });

    it('aceita undefined como acao', () => {
      const result = criarPromptNarracao('Carlos', 'Thorin', undefined);
      expect(typeof result).toBe('string');
    });

    it('aceita null como jogador', () => {
      const result = criarPromptNarracao(null, 'Thorin', 'acao');
      expect(typeof result).toBe('string');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// criarPromptReacao — prompts de reacao a eventos
// ══════════════════════════════════════════════════════════════════════════

describe('criarPromptReacao', () => {
  it('retorna string nao vazia', () => {
    const result = criarPromptReacao('Na taverna com NPCs', 'Terremoto abala a cidade');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('inclui o evento', () => {
    const result = criarPromptReacao('contexto', 'Dragão ataca a cidade');
    expect(result).toContain('Dragão ataca a cidade');
  });

  it('inclui o contexto', () => {
    const result = criarPromptReacao('Os heróis estão na taverna', 'evento');
    expect(result).toContain('Os heróis estão na taverna');
  });

  it('contem EVENTO e CONTEXTO ATUAL', () => {
    const result = criarPromptReacao('ctx', 'evt');
    expect(result).toContain('EVENTO');
    expect(result).toContain('CONTEXTO ATUAL');
  });

  it('menciona Mestre', () => {
    const result = criarPromptReacao('ctx', 'evt');
    expect(result).toContain('Mestre');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// criarPromptInicio — prompt de inicio de sessao
// ══════════════════════════════════════════════════════════════════════════

describe('criarPromptInicio', () => {
  // ── Retorno basico ──

  describe('retorno basico', () => {
    it('retorna string nao vazia', () => {
      const result = criarPromptInicio('fantasia medieval', [], null);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // ── Conteudo ──

  describe('conteudo do prompt', () => {
    it('inclui INÍCIO DE SESSÃO', () => {
      const result = criarPromptInicio('fantasia', [], null);
      expect(result).toContain('INÍCIO DE SESSÃO');
    });

    it('inclui tema na cena inicial fallback', () => {
      const result = criarPromptInicio('dragões e magia', [], null);
      expect(result).toContain('dragões e magia');
    });

    it('usa cena inicial personalizada quando fornecida', () => {
      const cena = 'A névoa cobre as ruínas de um templo esquecido.';
      const result = criarPromptInicio('tema', [], cena);
      expect(result).toContain('névoa cobre as ruínas');
    });

    it('inclui nomes dos personagens quando fornecidos como objetos', () => {
      const personagens = [{ nome: 'Thorin' }, { nome: 'Elara' }];
      const result = criarPromptInicio('fantasia', personagens, null);
      expect(result).toContain('Thorin');
      expect(result).toContain('Elara');
    });

    it('inclui nomes dos personagens quando fornecidos como strings', () => {
      const result = criarPromptInicio('fantasia', ['Thorin', 'Elara'], null);
      expect(result).toContain('Thorin');
      expect(result).toContain('Elara');
    });

    it('inclui instrucoes para formato JSON', () => {
      const result = criarPromptInicio('tema', [], null);
      expect(result).toContain('JSON');
      expect(result).toContain('fimDeTurno');
    });

    it('inclui instrucoes em portugues', () => {
      const result = criarPromptInicio('tema', [], null);
      expect(result).toContain('cenário');
      expect(result).toContain('atmosfera');
    });
  });

  // ── Parametros especiais ──

  describe('parametros especiais', () => {
    it('funciona com array vazio de personagens', () => {
      const result = criarPromptInicio('tema', [], null);
      expect(result).not.toContain('Personagens presentes');
    });

    it('funciona com null para personagens', () => {
      const result = criarPromptInicio('tema', null, null);
      expect(result).not.toContain('Personagens presentes');
    });

    it('funciona com undefined para cenaInicial', () => {
      const result = criarPromptInicio('tema', [], undefined);
      expect(result).toContain('tema');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// criarPromptBoasVindas — prompt de boas vindas a aventura
// ══════════════════════════════════════════════════════════════════════════

describe('criarPromptBoasVindas', () => {
  // ── Retorno basico ──

  describe('retorno basico', () => {
    it('retorna string nao vazia', () => {
      const result = criarPromptBoasVindas('A Maldição do Dragão', temas, [personagemCompleto]);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // ── Conteudo ──

  describe('conteudo do prompt', () => {
    it('inclui nome da historia', () => {
      const result = criarPromptBoasVindas('A Maldição do Dragão', temas, []);
      expect(result).toContain('A Maldição do Dragão');
    });

    it('inclui BOAS-VINDAS', () => {
      const result = criarPromptBoasVindas('Historia', temas, []);
      expect(result).toContain('BOAS-VINDAS');
    });

    it('inclui temas como texto', () => {
      const result = criarPromptBoasVindas('Historia', temas, []);
      expect(result).toContain('fantasia medieval');
      expect(result).toContain('horror cósmico');
    });

    it('inclui nomes de personagens', () => {
      const personagens = [{ nome: 'Thorin' }, { nome: 'Elara' }];
      const result = criarPromptBoasVindas('Historia', temas, personagens);
      expect(result).toContain('Thorin');
      expect(result).toContain('Elara');
    });

    it('aceita temas como string unica', () => {
      const result = criarPromptBoasVindas('Historia', 'fantasia', []);
      expect(result).toContain('fantasia');
    });

    it('inclui instrucoes para formato JSON', () => {
      const result = criarPromptBoasVindas('Historia', temas, []);
      expect(result).toContain('JSON');
      expect(result).toContain('fimDeTurno');
    });

    it('inclui instrucoes em portugues', () => {
      const result = criarPromptBoasVindas('Historia', temas, []);
      expect(result).toContain('abertura narrativa');
      expect(result).toContain('jornada');
    });
  });

  // ── Parametros especiais ──

  describe('parametros especiais', () => {
    it('funciona com array vazio de personagens', () => {
      const result = criarPromptBoasVindas('Historia', temas, []);
      expect(result).not.toContain('Personagens:');
    });

    it('funciona com personagens como strings', () => {
      const result = criarPromptBoasVindas('Historia', temas, ['Thorin', 'Elara']);
      expect(result).toContain('Thorin');
      expect(result).toContain('Elara');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// criarPromptTurno — prompt generico de turno
// ══════════════════════════════════════════════════════════════════════════

describe('criarPromptTurno', () => {
  // ── Retorno basico ──

  describe('retorno basico', () => {
    it('retorna string nao vazia', () => {
      const result = criarPromptTurno('Carlos', 'Thorin', 'Eu ataco', 1, 1, 0);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // ── Conteudo ──

  describe('conteudo do prompt', () => {
    it('inclui nome do jogador e personagem', () => {
      const result = criarPromptTurno('Carlos', 'Thorin', 'Eu ataco', 1, 1, 0);
      expect(result).toContain('Carlos');
      expect(result).toContain('Thorin');
    });

    it('inclui mensagem do jogador', () => {
      const result = criarPromptTurno('Carlos', 'Thorin', 'Eu ataco o goblin com força total', 1, 1, 0);
      expect(result).toContain('Eu ataco o goblin com força total');
    });

    it('inclui informacoes de rodada e turno', () => {
      const result = criarPromptTurno('Carlos', 'Thorin', 'Acao', 3, 2, 0);
      expect(result).toContain('Rodada: 3');
      expect(result).toContain('Turno: 2');
    });

    it('inclui contador de mensagens', () => {
      const result = criarPromptTurno('Carlos', 'Thorin', 'Acao', 1, 1, 1, 4);
      expect(result).toContain('Mensagem 2/4');
    });

    it('inclui respostas restantes', () => {
      const result = criarPromptTurno('Carlos', 'Thorin', 'Acao', 1, 1, 0, 4);
      expect(result).toContain('3 resposta(s)');
    });
  });

  // ── Limite de interacoes ──

  describe('limite de interacoes', () => {
    it('inclui aviso de limite quando atingido', () => {
      const result = criarPromptTurno('Carlos', 'Thorin', 'Acao', 1, 1, 3, 4);
      expect(result).toContain('limite de interacoes');
      expect(result).toContain('fimDeTurno: true');
    });

    it('nao inclui aviso de limite quando nao atingido', () => {
      const result = criarPromptTurno('Carlos', 'Thorin', 'Acao', 1, 1, 0, 4);
      expect(result).not.toContain('limite de interacoes');
    });

    it('usa maxAcoesPorTurno padrao de 4', () => {
      const result = criarPromptTurno('Carlos', 'Thorin', 'Acao', 1, 1, 3);
      expect(result).toContain('limite de interacoes');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// criarPromptInicioTurno — prompt de inicio de turno
// ══════════════════════════════════════════════════════════════════════════

describe('criarPromptInicioTurno', () => {
  it('retorna string nao vazia', () => {
    const result = criarPromptInicioTurno('Carlos', 'Thorin', 1, 0);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('inclui nome do personagem e jogador', () => {
    const result = criarPromptInicioTurno('Carlos', 'Thorin', 1, 0);
    expect(result).toContain('Carlos');
    expect(result).toContain('Thorin');
  });

  it('inclui informacoes de rodada', () => {
    const result = criarPromptInicioTurno('Carlos', 'Thorin', 3, 1);
    expect(result).toContain('Rodada: 3');
    expect(result).toContain('Turno: 2'); // turno + 1
  });

  it('inclui INICIO DO TURNO', () => {
    const result = criarPromptInicioTurno('Carlos', 'Thorin', 1, 0);
    expect(result).toContain('INICIO DO TURNO');
  });

  it('contem instrucoes em portugues', () => {
    const result = criarPromptInicioTurno('Ana', 'Elara', 1, 0);
    expect(result).toContain('situacao');
    expect(result).toContain('personagem');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// criarPromptTurnoPrimeira — primeira mensagem do turno
// ══════════════════════════════════════════════════════════════════════════

describe('criarPromptTurnoPrimeira', () => {
  // ── Retorno basico ──

  describe('retorno basico', () => {
    it('retorna string nao vazia', () => {
      const result = criarPromptTurnoPrimeira('Carlos', 'Thorin', 'Eu ataco', 1, 1, 4, 0);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // ── Conteudo ──

  describe('conteudo do prompt', () => {
    it('inclui nome do jogador e personagem', () => {
      const result = criarPromptTurnoPrimeira('Carlos', 'Thorin', 'Eu ataco', 1, 1, 4, 0);
      expect(result).toContain('Carlos');
      expect(result).toContain('Thorin');
    });

    it('inclui mensagem do jogador', () => {
      const result = criarPromptTurnoPrimeira('Carlos', 'Thorin', 'Examino a porta secreta', 1, 1, 4, 0);
      expect(result).toContain('Examino a porta secreta');
    });

    it('inclui informacoes de rodada e turno', () => {
      const result = criarPromptTurnoPrimeira('Carlos', 'Thorin', 'Acao', 2, 3, 4, 0);
      expect(result).toContain('Rodada: 2');
      expect(result).toContain('Turno: 3');
    });

    it('inclui contador de mensagens correto', () => {
      const result = criarPromptTurnoPrimeira('Carlos', 'Thorin', 'Acao', 1, 1, 4, 0);
      expect(result).toContain('Mensagem 1/4');
    });

    it('inclui bloco de continuidade', () => {
      const result = criarPromptTurnoPrimeira('Carlos', 'Thorin', 'Acao', 1, 1, 4, 0);
      expect(result).toContain('PRIORIDADE DE CONTINUIDADE');
    });

    it('inclui guia da primeira mensagem', () => {
      const result = criarPromptTurnoPrimeira('Carlos', 'Thorin', 'Acao', 1, 1, 4, 0);
      expect(result).toContain('GUIA DA PRIMEIRA MENSAGEM DO TURNO');
    });

    it('inclui respostas restantes', () => {
      const result = criarPromptTurnoPrimeira('Carlos', 'Thorin', 'Acao', 1, 1, 4, 0);
      expect(result).toContain('3 resposta(s)');
    });
  });

  // ── Limite de interacoes ──

  describe('limite de interacoes', () => {
    it('inclui aviso de limite quando atingido', () => {
      const result = criarPromptTurnoPrimeira('Carlos', 'Thorin', 'Acao', 1, 1, 4, 3);
      expect(result).toContain('limite de interações');
      expect(result).toContain('fimDeTurno: true');
    });

    it('nao inclui aviso quando nao atingido', () => {
      const result = criarPromptTurnoPrimeira('Carlos', 'Thorin', 'Acao', 1, 1, 4, 0);
      expect(result).not.toContain('limite de interações');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// criarPromptTurnoSeguinte — mensagens seguintes do turno
// ══════════════════════════════════════════════════════════════════════════

describe('criarPromptTurnoSeguinte', () => {
  // ── Retorno basico ──

  describe('retorno basico', () => {
    it('retorna string nao vazia', () => {
      const result = criarPromptTurnoSeguinte('Carlos', 'Thorin', 'Ataco de novo', 1, 1, 4, 1);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // ── Conteudo ──

  describe('conteudo do prompt', () => {
    it('inclui nome do jogador e personagem', () => {
      const result = criarPromptTurnoSeguinte('Carlos', 'Thorin', 'Acao', 1, 1, 4, 1);
      expect(result).toContain('Carlos');
      expect(result).toContain('Thorin');
    });

    it('inclui mensagem do jogador', () => {
      const result = criarPromptTurnoSeguinte('Carlos', 'Thorin', 'Pego o item do chão', 1, 1, 4, 1);
      expect(result).toContain('Pego o item do chão');
    });

    it('inclui contador de mensagens correto', () => {
      const result = criarPromptTurnoSeguinte('Carlos', 'Thorin', 'Acao', 1, 1, 4, 2);
      expect(result).toContain('Mensagem 3/4');
    });

    it('inclui bloco de continuidade', () => {
      const result = criarPromptTurnoSeguinte('Carlos', 'Thorin', 'Acao', 1, 1, 4, 1);
      expect(result).toContain('PRIORIDADE DE CONTINUIDADE');
    });

    it('inclui guia de mensagens seguintes', () => {
      const result = criarPromptTurnoSeguinte('Carlos', 'Thorin', 'Acao', 1, 1, 4, 1);
      expect(result).toContain('GUIA DAS MENSAGENS SEGUINTES');
    });

    it('nao inclui guia da primeira mensagem', () => {
      const result = criarPromptTurnoSeguinte('Carlos', 'Thorin', 'Acao', 1, 1, 4, 1);
      expect(result).not.toContain('GUIA DA PRIMEIRA MENSAGEM DO TURNO');
    });
  });

  // ── Limite de interacoes ──

  describe('limite de interacoes', () => {
    it('inclui aviso de limite quando atingido', () => {
      const result = criarPromptTurnoSeguinte('Carlos', 'Thorin', 'Acao', 1, 1, 4, 3);
      expect(result).toContain('limite de interações');
      expect(result).toContain('fimDeTurno: true');
    });

    it('nao inclui aviso quando nao atingido', () => {
      const result = criarPromptTurnoSeguinte('Carlos', 'Thorin', 'Acao', 1, 1, 4, 1);
      expect(result).not.toContain('limite de interações');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// criarPromptTurnoFinal — ultima mensagem do turno
// ══════════════════════════════════════════════════════════════════════════

describe('criarPromptTurnoFinal', () => {
  // ── Retorno basico ──

  describe('retorno basico', () => {
    it('retorna string nao vazia', () => {
      const result = criarPromptTurnoFinal('Carlos', 'Thorin', 'Minha última ação', 2, 3);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // ── Conteudo ──

  describe('conteudo do prompt', () => {
    it('inclui nome do jogador e personagem', () => {
      const result = criarPromptTurnoFinal('Carlos', 'Thorin', 'Acao', 1, 1);
      expect(result).toContain('Carlos');
      expect(result).toContain('Thorin');
    });

    it('inclui mensagem do jogador', () => {
      const result = criarPromptTurnoFinal('Carlos', 'Thorin', 'Fujo do combate', 1, 1);
      expect(result).toContain('Fujo do combate');
    });

    it('inclui informacoes de rodada e turno', () => {
      const result = criarPromptTurnoFinal('Carlos', 'Thorin', 'Acao', 5, 2);
      expect(result).toContain('Rodada: 5');
      expect(result).toContain('Turno: 2');
    });

    it('sempre inclui aviso de limite', () => {
      const result = criarPromptTurnoFinal('Carlos', 'Thorin', 'Acao', 1, 1);
      expect(result).toContain('limite de interações');
      expect(result).toContain('fimDeTurno: true');
    });

    it('inclui prioridade de continuidade', () => {
      const result = criarPromptTurnoFinal('Carlos', 'Thorin', 'Acao', 1, 1);
      expect(result).toContain('PRIORIDADE DE CONTINUIDADE');
    });

    it('contem instrucao de conclusao limpa', () => {
      const result = criarPromptTurnoFinal('Carlos', 'Thorin', 'Acao', 1, 1);
      expect(result).toContain('limpa');
    });

    it('nao inclui guia da primeira mensagem', () => {
      const result = criarPromptTurnoFinal('Carlos', 'Thorin', 'Acao', 1, 1);
      expect(result).not.toContain('GUIA DA PRIMEIRA MENSAGEM DO TURNO');
    });

    it('nao inclui guia de mensagens seguintes', () => {
      const result = criarPromptTurnoFinal('Carlos', 'Thorin', 'Acao', 1, 1);
      expect(result).not.toContain('GUIA DAS MENSAGENS SEGUINTES');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Comparacoes entre variantes de turno
// ══════════════════════════════════════════════════════════════════════════

describe('comparacao entre prompts de turno', () => {
  const args = ['Carlos', 'Thorin', 'Eu ataco', 1, 1, 4, 0];

  it('TurnoPrimeira contem GUIA DA PRIMEIRA MENSAGEM que TurnoSeguinte nao contem', () => {
    const primeira = criarPromptTurnoPrimeira(...args);
    const seguinte = criarPromptTurnoSeguinte('Carlos', 'Thorin', 'Eu ataco', 1, 1, 4, 1);
    expect(primeira).toContain('GUIA DA PRIMEIRA MENSAGEM DO TURNO');
    expect(seguinte).not.toContain('GUIA DA PRIMEIRA MENSAGEM DO TURNO');
  });

  it('TurnoSeguinte contem GUIA DAS MENSAGENS SEGUINTES que TurnoPrimeira nao contem', () => {
    const primeira = criarPromptTurnoPrimeira(...args);
    const seguinte = criarPromptTurnoSeguinte('Carlos', 'Thorin', 'Eu ataco', 1, 1, 4, 1);
    expect(seguinte).toContain('GUIA DAS MENSAGENS SEGUINTES');
    expect(primeira).not.toContain('GUIA DAS MENSAGENS SEGUINTES');
  });

  it('TurnoFinal nao contem nenhum dos guias especificos', () => {
    const final = criarPromptTurnoFinal('Carlos', 'Thorin', 'Eu ataco', 1, 1);
    expect(final).not.toContain('GUIA DA PRIMEIRA MENSAGEM DO TURNO');
    expect(final).not.toContain('GUIA DAS MENSAGENS SEGUINTES');
  });

  it('todos os prompts de turno contem info de jogador e personagem', () => {
    const primeira = criarPromptTurnoPrimeira(...args);
    const seguinte = criarPromptTurnoSeguinte('Carlos', 'Thorin', 'Eu ataco', 1, 1, 4, 1);
    const final = criarPromptTurnoFinal('Carlos', 'Thorin', 'Eu ataco', 1, 1);
    for (const prompt of [primeira, seguinte, final]) {
      expect(prompt).toContain('Carlos');
      expect(prompt).toContain('Thorin');
    }
  });

  it('TurnoPrimeira e TurnoSeguinte compartilham bloco de continuidade', () => {
    const primeira = criarPromptTurnoPrimeira(...args);
    const seguinte = criarPromptTurnoSeguinte('Carlos', 'Thorin', 'Eu ataco', 1, 1, 4, 1);
    expect(primeira).toContain('PRIORIDADE DE CONTINUIDADE');
    expect(seguinte).toContain('PRIORIDADE DE CONTINUIDADE');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Robustez — edge cases comuns a varios prompts
// ══════════════════════════════════════════════════════════════════════════

describe('robustez geral', () => {
  it('criarPromptSistema com personagem sem vantagens nem desvantagens', () => {
    const p = { nome: 'Simples', classe: 'Ladino', raca: 'Humano', nivel: 1 };
    const result = criarPromptSistema([], [p]);
    expect(result).toContain('Simples');
    expect(result).not.toContain('VANTAGENS PASSIVAS DE Simples');
    expect(result).not.toContain('DESVANTAGENS DE Simples');
  });

  it('criarPromptSistema com personagem com vantagens vazias', () => {
    const p = { nome: 'Teste', vantagens: [], desvantagens: [], habilidadesClasse: [], magias: [] };
    expect(() => criarPromptSistema([], [p])).not.toThrow();
  });

  it('criarPromptSistema com personagem sem atributos', () => {
    const p = { nome: 'SemStats' };
    const result = criarPromptSistema([], [p]);
    expect(result).toContain('SemStats');
    expect(result).not.toContain('Atributos: FOR');
  });

  it('criarPromptSistema com bonus em formato objeto', () => {
    const p = {
      nome: 'BonusObj',
      vantagens: [{
        nome: 'Aura',
        usar: 0,
        descricao: 'Aura de poder',
        bonus: { ataque: 2, dano: 1, armadura: 0 },
      }],
    };
    const result = criarPromptSistema([], [p]);
    expect(result).toContain('Aura');
    expect(result).toContain('+2 ataque');
    expect(result).toContain('+1 dano');
  });

  it('criarPromptNarracao com acao muito longa', () => {
    const acaoLonga = 'Eu corro '.repeat(500);
    const result = criarPromptNarracao('Carlos', 'Thorin', acaoLonga);
    expect(result).toContain('Eu corro');
  });

  it('criarPromptBoasVindas com temas nulos', () => {
    expect(() => criarPromptBoasVindas('Historia', null, [])).not.toThrow();
  });

  it('criarPromptTurnoFinal com valores numericos extremos', () => {
    const result = criarPromptTurnoFinal('Carlos', 'Thorin', 'Acao', 9999, 9999);
    expect(result).toContain('Rodada: 9999');
    expect(result).toContain('Turno: 9999');
  });

  it('criarPromptTurno com respostas restantes nunca negativas', () => {
    // contadorMensagens > maxAcoesPorTurno
    const result = criarPromptTurno('Carlos', 'Thorin', 'Acao', 1, 1, 10, 4);
    // Deve conter aviso de limite, nao numero negativo
    expect(result).toContain('limite de interacoes');
    expect(result).not.toMatch(/-\d+ resposta/);
  });
});
