import { describe, it, expect } from 'vitest';
import {
  analyzeNarrativeHook,
  buildFallbackHookLine,
  applyFallbackHook,
} from '../helpers/narrativeHookGuard.js';

// ── analyzeNarrativeHook — narrativa vazia / nula ──

describe('analyzeNarrativeHook — narrativa vazia ou nula', () => {
  it('retorna narrativa_vazia para string vazia', () => {
    const result = analyzeNarrativeHook({ narrativa: '' });
    expect(result.hasActionableHook).toBe(false);
    expect(result.reason).toBe('narrativa_vazia');
    expect(result.shouldSuggest).toBe(true);
    expect(result.lastUnit).toBe('');
  });

  it('retorna narrativa_vazia para null', () => {
    const result = analyzeNarrativeHook({ narrativa: null });
    expect(result.hasActionableHook).toBe(false);
    expect(result.reason).toBe('narrativa_vazia');
    expect(result.shouldSuggest).toBe(true);
  });

  it('retorna narrativa_vazia para undefined', () => {
    const result = analyzeNarrativeHook({ narrativa: undefined });
    expect(result.hasActionableHook).toBe(false);
    expect(result.reason).toBe('narrativa_vazia');
  });

  it('retorna narrativa_vazia quando chamada sem argumentos', () => {
    const result = analyzeNarrativeHook();
    expect(result.hasActionableHook).toBe(false);
    expect(result.reason).toBe('narrativa_vazia');
  });

  it('retorna narrativa_vazia para string so com espacos', () => {
    const result = analyzeNarrativeHook({ narrativa: '   ' });
    expect(result.hasActionableHook).toBe(false);
    expect(result.reason).toBe('narrativa_vazia');
  });
});

// ── analyzeNarrativeHook — fim de turno ──

describe('analyzeNarrativeHook — fim de turno', () => {
  const narrativa = 'O guerreiro avanca pela estrada escura.';

  it('marca hasActionableHook quando fimDeTurno e true', () => {
    const result = analyzeNarrativeHook({ narrativa, fimDeTurno: true });
    expect(result.hasActionableHook).toBe(true);
    expect(result.reason).toBeNull();
    expect(result.shouldSuggest).toBe(false);
  });

  it('marca hasActionableHook quando respostaIA.fimDeTurno e true', () => {
    const result = analyzeNarrativeHook({
      narrativa,
      respostaIA: { fimDeTurno: true },
    });
    expect(result.hasActionableHook).toBe(true);
    expect(result.shouldSuggest).toBe(false);
  });

  it('marca hasActionableHook quando respostaIA.acaoCompleta e true', () => {
    const result = analyzeNarrativeHook({
      narrativa,
      respostaIA: { acaoCompleta: true },
    });
    expect(result.hasActionableHook).toBe(true);
  });

  it('marca hasActionableHook quando respostaIA.solicitaDados.solicita e true', () => {
    const result = analyzeNarrativeHook({
      narrativa,
      respostaIA: { solicitaDados: { solicita: true } },
    });
    expect(result.hasActionableHook).toBe(true);
  });

  it('marca hasActionableHook quando respostaIA.teste e truthy', () => {
    const result = analyzeNarrativeHook({
      narrativa,
      respostaIA: { teste: { tipo: 'ataque' } },
    });
    expect(result.hasActionableHook).toBe(true);
  });

  it('retorna lastUnit correto mesmo em fim de turno', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'Primeira frase.\n\nSegunda frase final.',
      fimDeTurno: true,
    });
    expect(result.lastUnit).toBe('Segunda frase final.');
  });
});

// ── analyzeNarrativeHook — gancho com pergunta ──

describe('analyzeNarrativeHook — narrativa com pergunta acionavel', () => {
  it('detecta pergunta direta com interrogacao no final', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'A porta se abre. Voce entra ou recua?',
    });
    expect(result.hasActionableHook).toBe(true);
    expect(result.reason).toBeNull();
    expect(result.shouldSuggest).toBe(false);
  });

  it('detecta pergunta no meio da ultima unidade', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'O salao esta vazio. O que voce faz?',
    });
    expect(result.hasActionableHook).toBe(true);
  });

  it('detecta verbo acionavel "voce" sem interrogacao', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'Diante de voce, a escuridao se adensa. Voce avanca pela trilha.',
    });
    expect(result.hasActionableHook).toBe(true);
  });

  it('detecta verbo acionavel "ataca"', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'O goblin rosna. O guerreiro ataca com furia.',
    });
    expect(result.hasActionableHook).toBe(true);
  });

  it('detecta verbo acionavel "examina"', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'Uma inscricao brilha na parede. O mago examina os simbolos.',
    });
    expect(result.hasActionableHook).toBe(true);
  });
});

// ── analyzeNarrativeHook — escolha acionavel ──

describe('analyzeNarrativeHook — escolha acionavel no corpo', () => {
  it('detecta "voce pode" no corpo da narrativa', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'O corredor se bifurca. Voce pode seguir pela esquerda ou pela direita.',
    });
    expect(result.hasActionableHook).toBe(true);
  });

  it('detecta "pode escolher"', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'Ao chegar na encruzilhada, pode escolher entre os dois caminhos disponiveis.',
    });
    expect(result.hasActionableHook).toBe(true);
  });

  it('detecta "ou pode" como escolha', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'Voce descansa junto a fogueira. Ou pode investigar o barulho vindo da floresta.',
    });
    expect(result.hasActionableHook).toBe(true);
  });
});

// ── analyzeNarrativeHook — affordance imediata ──

describe('analyzeNarrativeHook — affordance imediata na ultima unidade', () => {
  it('detecta "abre" como affordance', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'O anao abre o bau de madeira antiga.',
    });
    expect(result.hasActionableHook).toBe(true);
  });

  it('detecta "segue" como affordance', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'Voce segue o rastro de sangue pelo corredor.',
    });
    expect(result.hasActionableHook).toBe(true);
  });

  it('detecta "pega" como affordance', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'A elfa pega a chave dourada sobre a mesa.',
    });
    expect(result.hasActionableHook).toBe(true);
  });

  it('detecta "observa" como affordance', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'O ladino observa a guarda noturna da fortaleza.',
    });
    expect(result.hasActionableHook).toBe(true);
  });
});

// ── analyzeNarrativeHook — gancho generico ──

describe('analyzeNarrativeHook — gancho generico sem affordance', () => {
  it('detecta "o que faremos agora" como gancho generico', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'A vila foi destruida. O que faremos agora.',
    });
    expect(result.hasActionableHook).toBe(false);
    expect(result.reason).toBe('gancho_generico');
    expect(result.shouldSuggest).toBe(true);
  });

  it('detecta "nao temos tempo a perder" como gancho generico', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'As tropas do inimigo se aproximam. Nao temos tempo a perder.',
    });
    expect(result.hasActionableHook).toBe(false);
    expect(result.reason).toBe('gancho_generico');
  });

  it('gancho generico com affordance no corpo nao e marcado como gancho_generico', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'Voce entra na caverna sombria. O que faremos agora.',
    });
    // "entra" is an affordance in the full text, so it bypasses the gancho_generico check
    // but the last unit still has no actionable hook, so it falls to deixa_final_vaga
    expect(result.hasActionableHook).toBe(false);
    expect(result.reason).not.toBe('gancho_generico');
    expect(result.reason).toBe('deixa_final_vaga');
  });
});

// ── analyzeNarrativeHook — briefing repetitivo ──

describe('analyzeNarrativeHook — briefing repetitivo', () => {
  it('detecta "voce precisa" como briefing abstrato', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'O rei explica a situacao. O reino esta em perigo e voce precisa salvar todos.',
    });
    expect(result.hasActionableHook).toBe(false);
    expect(result.reason).toBe('briefing_repetido_sem_encaixe');
    expect(result.shouldSuggest).toBe(true);
  });

  it('detecta "a aventura continua" como meta-narracao', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'Muitas coisas aconteceram nessa noite. A aventura continua.',
    });
    expect(result.hasActionableHook).toBe(false);
    expect(result.reason).toBe('briefing_repetido_sem_encaixe');
  });

  it('detecta "silencio paira" como atmosfera pura', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'Nada se move na sala do trono abandonada. O silencio paira.',
    });
    expect(result.hasActionableHook).toBe(false);
    expect(result.reason).toBe('briefing_repetido_sem_encaixe');
  });

  it('briefing repetitivo com affordance no corpo nao e marcado como briefing_repetido', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'Voce abre a porta e entra no salao. O destino aguarda.',
    });
    // "abre" and "entra" are affordances in the full text, so it bypasses the briefing check
    // but the last unit still has no actionable hook, so it falls to deixa_final_vaga
    expect(result.hasActionableHook).toBe(false);
    expect(result.reason).not.toBe('briefing_repetido_sem_encaixe');
    expect(result.reason).toBe('deixa_final_vaga');
  });
});

// ── analyzeNarrativeHook — deixa final vaga ──

describe('analyzeNarrativeHook — deixa final vaga (fallback)', () => {
  it('narrativa descritiva pura sem gancho', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'O sol se poe atras das montanhas. Cores alaranjadas pintam o ceu.',
    });
    expect(result.hasActionableHook).toBe(false);
    expect(result.reason).toBe('deixa_final_vaga');
    expect(result.shouldSuggest).toBe(true);
  });

  it('shouldSuggest e false em combate ativo sem objetos na cena', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'O sol se poe atras das montanhas. Cores alaranjadas pintam o ceu.',
      combateAtivo: true,
    });
    expect(result.hasActionableHook).toBe(false);
    expect(result.reason).toBe('deixa_final_vaga');
    expect(result.shouldSuggest).toBe(false);
  });

  it('shouldSuggest e true em combate ativo com objetosVisiveis no sceneContext', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'O sol se poe atras das montanhas. Cores alaranjadas pintam o ceu.',
      combateAtivo: true,
      sceneContext: { objetosVisiveis: ['espada'] },
    });
    expect(result.hasActionableHook).toBe(false);
    expect(result.shouldSuggest).toBe(true);
  });

  it('shouldSuggest e true em combate ativo com objetos narrativos extraidos', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'Ha uma porta de ferro no fundo do corredor. O vento assobia pelas frestas.',
      combateAtivo: true,
    });
    // "porta" e detectada como objeto narrativo
    expect(result.hasActionableHook).toBe(false);
    expect(result.shouldSuggest).toBe(true);
  });
});

// ── analyzeNarrativeHook — contexto de combate ──

describe('analyzeNarrativeHook — comportamento em combate', () => {
  it('combateAtivo nao muda deteccao de pergunta', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'O orc avanca. Voce contra-ataca ou recua?',
      combateAtivo: true,
    });
    expect(result.hasActionableHook).toBe(true);
  });

  it('combateAtivo com fimDeTurno prevalece', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'O orc cai derrotado.',
      combateAtivo: true,
      fimDeTurno: true,
    });
    expect(result.hasActionableHook).toBe(true);
    expect(result.shouldSuggest).toBe(false);
  });
});

// ── analyzeNarrativeHook — texto em portugues com acentos ──

describe('analyzeNarrativeHook — texto PT-BR com acentos', () => {
  it('normaliza acentos ao avaliar verbos acionaveis', () => {
    // "você" normalizado vira "voce", que casa com o regex
    const result = analyzeNarrativeHook({
      narrativa: 'O caminho se abre. Você avança pela floresta.',
    });
    expect(result.hasActionableHook).toBe(true);
  });

  it('normaliza acentos em gancho generico', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'A missão é clara. Não temos tempo a perder.',
    });
    expect(result.hasActionableHook).toBe(false);
    expect(result.reason).toBe('gancho_generico');
  });
});

// ── analyzeNarrativeHook — dialogo vs descricao ──

describe('analyzeNarrativeHook — dialogo vs descricao pura', () => {
  it('dialogo com pergunta direta tem gancho', () => {
    const result = analyzeNarrativeHook({
      narrativa: '"Voce esta pronto para a jornada?" pergunta o velho mago.',
    });
    expect(result.hasActionableHook).toBe(true);
  });

  it('dialogo sem pergunta mas com verbo acionavel tem gancho', () => {
    const result = analyzeNarrativeHook({
      narrativa: '"Siga-me", diz o guia. O grupo segue pelo corredor escuro.',
    });
    expect(result.hasActionableHook).toBe(true);
  });

  it('descricao pura sem acao e vaga', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'As paredes de pedra cinzenta se erguem altas. Musgo cobre as fendas.',
    });
    expect(result.hasActionableHook).toBe(false);
    expect(result.reason).toBe('deixa_final_vaga');
  });
});

// ── analyzeNarrativeHook — multiplos paragrafos ──

describe('analyzeNarrativeHook — multiplos paragrafos', () => {
  it('avalia a ultima unidade narrativa (ultimo paragrafo, ultima frase)', () => {
    const narrativa = [
      'O grupo chega a taverna.',
      '',
      'O taberneiro limpa um copo atras do balcao. Ninguem diz nada.',
    ].join('\n');
    const result = analyzeNarrativeHook({ narrativa });
    // "Ninguem diz nada." nao tem gancho
    expect(result.hasActionableHook).toBe(false);
    expect(result.lastUnit).toBe('Ninguem diz nada.');
  });

  it('detecta pergunta apenas no ultimo paragrafo', () => {
    const narrativa = [
      'O grupo chega a taverna.',
      '',
      'O taberneiro olha para voce. O que deseja?',
    ].join('\n');
    const result = analyzeNarrativeHook({ narrativa });
    expect(result.hasActionableHook).toBe(true);
    expect(result.lastUnit).toBe('O que deseja?');
  });
});

// ── buildFallbackHookLine — combate ativo ──

describe('buildFallbackHookLine — combate ativo', () => {
  it('retorna frase de combate fixa', () => {
    const line = buildFallbackHookLine('qualquer narrativa', { combateAtivo: true });
    expect(line).toBe(
      'O inimigo ainda pressiona a cena. Voce avanca de novo, muda de posicao ou se fecha em defesa?'
    );
  });

  it('ignora sceneContext em combate ativo', () => {
    const line = buildFallbackHookLine('qualquer narrativa', {
      combateAtivo: true,
      sceneContext: { npcsPresentes: ['Aldaric'] },
    });
    expect(line).toContain('O inimigo ainda pressiona');
  });
});

// ── buildFallbackHookLine — com NPC no sceneContext ──

describe('buildFallbackHookLine — NPC presente', () => {
  it('usa o nome do NPC string', () => {
    const line = buildFallbackHookLine('O salao esta vazio.', {
      sceneContext: { npcsPresentes: ['Eldara'] },
    });
    expect(line).toBe('Eldara se volta para voce, expectante.');
  });

  it('usa o campo .nome do NPC objeto', () => {
    const line = buildFallbackHookLine('O salao esta vazio.', {
      sceneContext: { npcsPresentes: [{ nome: 'Thorin' }] },
    });
    expect(line).toBe('Thorin se volta para voce, expectante.');
  });

  it('com shouldSuggest usa "aguarda sua resposta"', () => {
    const line = buildFallbackHookLine('O salao esta vazio.', {
      shouldSuggest: true,
      sceneContext: { npcsPresentes: ['Liara'] },
    });
    expect(line).toBe('Liara aguarda sua resposta.');
  });
});

// ── buildFallbackHookLine — com cenaAtual ──

describe('buildFallbackHookLine — cenaAtual presente', () => {
  it('sem shouldSuggest gera pergunta', () => {
    const line = buildFallbackHookLine('narrativa', {
      sceneContext: { cenaAtual: 'a cripta' },
    });
    expect(line).toBe('Voce examina mais de perto a cripta ou segue adiante?');
  });

  it('com shouldSuggest gera sugestao', () => {
    const line = buildFallbackHookLine('narrativa', {
      shouldSuggest: true,
      sceneContext: { cenaAtual: 'a cripta' },
    });
    expect(line).toBe('Voce pode examinar mais de perto a cripta ou seguir adiante.');
  });

  it('npcsPresentes tem prioridade sobre cenaAtual', () => {
    const line = buildFallbackHookLine('narrativa', {
      sceneContext: { npcsPresentes: ['Bardo'], cenaAtual: 'a taverna' },
    });
    expect(line).toContain('Bardo');
    expect(line).not.toContain('taverna');
  });
});

// ── buildFallbackHookLine — com ameacas ──

describe('buildFallbackHookLine — ameacas', () => {
  it('usa nome da ameaca string', () => {
    const line = buildFallbackHookLine('narrativa', {
      sceneContext: { ameacas: ['O Dragao Negro'] },
    });
    expect(line).toBe('O Dragao Negro ainda ronda. Voce investiga ou se prepara?');
  });

  it('usa campo .nome de ameaca objeto', () => {
    const line = buildFallbackHookLine('narrativa', {
      sceneContext: { ameacas: [{ nome: 'Esqueleto' }] },
    });
    expect(line).toContain('Esqueleto');
  });

  it('com shouldSuggest gera sugestao em vez de pergunta', () => {
    const line = buildFallbackHookLine('narrativa', {
      shouldSuggest: true,
      sceneContext: { ameacas: ['Lobo Fantasma'] },
    });
    expect(line).toBe('Lobo Fantasma ainda ronda. Voce pode investigar ou se preparar.');
  });
});

// ── buildFallbackHookLine — objetos narrativos extraidos ──

describe('buildFallbackHookLine — objetos narrativos extraidos', () => {
  it('detecta "porta" na narrativa e gera hook', () => {
    const line = buildFallbackHookLine('Uma porta de carvalho bloqueia o caminho.', {});
    expect(line).toContain('porta');
    expect(line).toContain('examina');
  });

  it('detecta "bau" e usa artigo "o"', () => {
    const line = buildFallbackHookLine('No canto ha um bau empoeirado.', {});
    expect(line).toContain('o bau');
  });

  it('detecta "escada" e usa artigo "a"', () => {
    const line = buildFallbackHookLine('Uma escada desce para a escuridao.', {});
    expect(line).toContain('a escada');
  });

  it('detecta "altar" e usa artigo "a"', () => {
    const line = buildFallbackHookLine('Um altar de pedra repousa no centro.', {});
    expect(line).toContain('a altar');
  });

  it('detecta "inscricao" para runa/selo/marca', () => {
    const line = buildFallbackHookLine('Uma runa brilha na parede.', {});
    expect(line).toContain('inscricao');
  });

  it('detecta "objeto mistico" para cristal/espelho', () => {
    const line = buildFallbackHookLine('Um cristal pulsa com luz interior.', {});
    expect(line).toContain('objeto mistico');
  });

  it('detecta "mecanismo" para alavanca/engrenagem', () => {
    const line = buildFallbackHookLine('Uma alavanca enferrujada se projeta da parede.', {});
    expect(line).toContain('mecanismo');
  });

  it('com shouldSuggest gera sugestao em vez de pergunta', () => {
    const line = buildFallbackHookLine('Uma porta de carvalho bloqueia o caminho.', {
      shouldSuggest: true,
    });
    expect(line).toContain('pode examinar');
    expect(line).toContain('antes de seguir');
  });

  it('sem shouldSuggest gera pergunta', () => {
    const line = buildFallbackHookLine('Uma porta de carvalho bloqueia o caminho.', {
      shouldSuggest: false,
    });
    expect(line).toContain('examina');
    expect(line).toContain('ou segue em frente?');
  });
});

// ── buildFallbackHookLine — fallback generico ──

describe('buildFallbackHookLine — fallback generico (sem contexto)', () => {
  it('sem shouldSuggest retorna "O que voce faz?"', () => {
    const line = buildFallbackHookLine('O sol brilha forte.', {});
    expect(line).toBe('O que voce faz?');
  });

  it('com shouldSuggest retorna sugestao longa generica', () => {
    const line = buildFallbackHookLine('O sol brilha forte.', { shouldSuggest: true });
    expect(line).toContain('proximo passo seguro');
    expect(line).toContain('examinando');
  });
});

// ── buildFallbackHookLine — prioridade de contexto ──

describe('buildFallbackHookLine — prioridade de fallback', () => {
  it('combate > NPC > cena > ameaca > objeto', () => {
    // combate tem prioridade sobre tudo
    const line = buildFallbackHookLine('Ha uma porta.', {
      combateAtivo: true,
      sceneContext: {
        npcsPresentes: ['Aldaric'],
        cenaAtual: 'caverna',
        ameacas: ['Troll'],
      },
    });
    expect(line).toContain('O inimigo ainda pressiona');
  });

  it('NPC > cena', () => {
    const line = buildFallbackHookLine('Nada aqui.', {
      sceneContext: {
        npcsPresentes: ['Aldaric'],
        cenaAtual: 'caverna',
      },
    });
    expect(line).toContain('Aldaric');
  });

  it('cena > ameaca', () => {
    const line = buildFallbackHookLine('Nada aqui.', {
      sceneContext: {
        cenaAtual: 'caverna',
        ameacas: ['Troll'],
      },
    });
    expect(line).toContain('caverna');
  });

  it('ameaca > objetos narrativos', () => {
    const line = buildFallbackHookLine('Ha uma porta neste lugar.', {
      sceneContext: {
        ameacas: ['Troll'],
      },
    });
    expect(line).toContain('Troll');
    expect(line).not.toContain('porta');
  });
});

// ── applyFallbackHook ──

describe('applyFallbackHook', () => {
  it('com narrativa vazia retorna apenas o hook', () => {
    const result = applyFallbackHook('', {});
    expect(result).toBe('O que voce faz?');
  });

  it('com narrativa null retorna apenas o hook', () => {
    const result = applyFallbackHook(null, {});
    expect(result).toBe('O que voce faz?');
  });

  it('concatena narrativa + hookLine com dupla quebra de linha', () => {
    const result = applyFallbackHook('O salao esta vazio.', {});
    expect(result).toBe('O salao esta vazio.\n\nO que voce faz?');
  });

  it('usa hook de combate quando combateAtivo', () => {
    const result = applyFallbackHook('O orc rosna.', { combateAtivo: true });
    expect(result).toContain('O orc rosna.');
    expect(result).toContain('O inimigo ainda pressiona');
  });

  it('usa NPC do sceneContext', () => {
    const result = applyFallbackHook('O mago espera.', {
      sceneContext: { npcsPresentes: ['Merlin'] },
    });
    expect(result).toContain('O mago espera.');
    expect(result).toContain('Merlin');
  });

  it('preserva narrativa com multiplos paragrafos', () => {
    const narrativa = 'Primeiro paragrafo.\n\nSegundo paragrafo.';
    const result = applyFallbackHook(narrativa, {});
    expect(result.startsWith('Primeiro paragrafo.')).toBe(true);
    expect(result).toContain('Segundo paragrafo.');
    expect(result).toContain('O que voce faz?');
  });

  it('faz trim da narrativa antes de concatenar', () => {
    const result = applyFallbackHook('  Espacos extras.  ', {});
    expect(result.startsWith('Espacos extras.')).toBe(true);
    expect(result).toContain('O que voce faz?');
  });

  it('detecta objetos na narrativa para gerar hook contextual', () => {
    const result = applyFallbackHook('Um pergaminho antigo repousa sobre a mesa.', {});
    expect(result).toContain('pergaminho');
    expect(result).toContain('examina');
  });
});

// ── buildFallbackHookLine — npcsPresentes com lista vazia ──

describe('buildFallbackHookLine — edge cases de sceneContext', () => {
  it('npcsPresentes vazio cai para cenaAtual', () => {
    const line = buildFallbackHookLine('Nada.', {
      sceneContext: { npcsPresentes: [], cenaAtual: 'a floresta' },
    });
    expect(line).toContain('a floresta');
  });

  it('ameacas vazia cai para objetos narrativos', () => {
    const line = buildFallbackHookLine('Ha uma fonte de agua cristalina.', {
      sceneContext: { ameacas: [] },
    });
    expect(line).toContain('fonte');
  });

  it('sceneContext null cai para objetos ou generico', () => {
    const line = buildFallbackHookLine('Nada de especial.', {
      sceneContext: null,
    });
    expect(line).toBe('O que voce faz?');
  });

  it('sceneContext undefined usa fallback generico', () => {
    const line = buildFallbackHookLine('Nada de especial.');
    expect(line).toBe('O que voce faz?');
  });
});

// ── analyzeNarrativeHook — integracao com objetos extraidos ──

describe('analyzeNarrativeHook — objetos narrativos em deixa vaga', () => {
  it('narrativa descritiva com porta em combate sugere por ter objetos', () => {
    const result = analyzeNarrativeHook({
      narrativa: 'Uma porta grossa de ferro bloqueia a passagem. O chao treme.',
      combateAtivo: true,
    });
    expect(result.hasActionableHook).toBe(false);
    expect(result.reason).toBe('deixa_final_vaga');
    // porta e passagem sao objetos narrativos, shouldSuggest true mesmo em combate
    expect(result.shouldSuggest).toBe(true);
  });
});
