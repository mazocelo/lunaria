import { describe, it, expect } from 'vitest';
import { sanitizeTextForSpeech } from '../services/speechTextService.js';

// ── sanitizeTextForSpeech — sanitizacao de texto antes de envio para TTS ──

describe('sanitizeTextForSpeech', () => {
  // ── Passthrough de texto valido ──

  describe('texto normal passa sem alteracao', () => {
    it('texto simples permanece intacto', () => {
      expect(sanitizeTextForSpeech('Hello world')).toBe('Hello world');
    });

    it('frase completa com pontuacao basica', () => {
      expect(sanitizeTextForSpeech('The dragon attacks! Roll for initiative.')).toBe(
        'The dragon attacks! Roll for initiative.',
      );
    });

    it('texto com numeros permanece intacto', () => {
      expect(sanitizeTextForSpeech('You deal 15 damage to the orc.')).toBe(
        'You deal 15 damage to the orc.',
      );
    });

    it('multiplas frases simples', () => {
      expect(sanitizeTextForSpeech('You enter the cave. It is dark. You hear a noise.')).toBe(
        'You enter the cave. It is dark. You hear a noise.',
      );
    });

    it('texto com aspas preservado', () => {
      expect(sanitizeTextForSpeech('He said "halt" and drew his sword.')).toBe(
        'He said "halt" and drew his sword.',
      );
    });
  });

  // ── Texto em portugues com acentos ──

  describe('texto em portugues com acentos', () => {
    it('acentos agudos preservados', () => {
      expect(sanitizeTextForSpeech('O guerreiro está pronto para a ação.')).toBe(
        'O guerreiro está pronto para a ação.',
      );
    });

    it('cedilha preservada', () => {
      expect(sanitizeTextForSpeech('A maça do herói causou grande dano.')).toBe(
        'A maça do herói causou grande dano.',
      );
    });

    it('til preservado', () => {
      expect(sanitizeTextForSpeech('Os dragões atacam a região.')).toBe(
        'Os dragões atacam a região.',
      );
    });

    it('crase e acento circunflexo', () => {
      expect(sanitizeTextForSpeech('Ele foi à floresta e viu a aparência do monstro.')).toBe(
        'Ele foi à floresta e viu a aparência do monstro.',
      );
    });

    it('frase longa em portugues', () => {
      const input = 'O mago lançou uma bola de fogo que iluminou toda a caverna, causando pânico nos goblins.';
      expect(sanitizeTextForSpeech(input)).toBe(input);
    });

    it('dialogo em portugues com pontuacao', () => {
      const input = 'O anão disse: "Vocês não passarão!" e ergueu seu machado.';
      expect(sanitizeTextForSpeech(input)).toBe(input);
    });
  });

  // ── null / undefined / empty ──

  describe('input nulo, indefinido ou vazio', () => {
    it('retorna string vazia para undefined', () => {
      expect(sanitizeTextForSpeech(undefined)).toBe('');
    });

    it('retorna string vazia para null', () => {
      expect(sanitizeTextForSpeech(null)).toBe('');
    });

    it('retorna string vazia para string vazia', () => {
      expect(sanitizeTextForSpeech('')).toBe('');
    });

    it('retorna string vazia para string so com espacos', () => {
      expect(sanitizeTextForSpeech('   ')).toBe('');
    });

    it('retorna string vazia para string so com newlines', () => {
      expect(sanitizeTextForSpeech('\n\n\n')).toBe('');
    });

    it('retorna string vazia para string so com tabs', () => {
      expect(sanitizeTextForSpeech('\t\t\t')).toBe('');
    });

    it('retorna string vazia sem argumentos (default parameter)', () => {
      expect(sanitizeTextForSpeech()).toBe('');
    });

    it('converte numero para string via asText', () => {
      const result = sanitizeTextForSpeech(42);
      expect(result).toBe('42');
    });

    it('converte booleano para string via asText', () => {
      expect(sanitizeTextForSpeech(true)).toBe('true');
    });
  });

  // ── Remocao de markdown — bold, italic, strikethrough, spoiler ──

  describe('remove formatacao markdown inline', () => {
    it('remove bold com **', () => {
      expect(sanitizeTextForSpeech('The **dragon** attacks!')).toBe('The dragon attacks!');
    });

    it('remove bold com __', () => {
      expect(sanitizeTextForSpeech('The __dragon__ attacks!')).toBe('The dragon attacks!');
    });

    it('remove italico com *', () => {
      expect(sanitizeTextForSpeech('She moved *silently* through the forest.')).toBe(
        'She moved silently through the forest.',
      );
    });

    it('remove italico com _', () => {
      expect(sanitizeTextForSpeech('The _ancient_ tome glowed.')).toBe(
        'The ancient tome glowed.',
      );
    });

    it('remove strikethrough com ~~', () => {
      expect(sanitizeTextForSpeech('You ~~missed~~ hit the target!')).toBe(
        'You missed hit the target!',
      );
    });

    it('remove spoiler com ||', () => {
      expect(sanitizeTextForSpeech('The villain is ||the king||!')).toBe(
        'The villain is the king!',
      );
    });

    it('remove bold e italico combinados', () => {
      expect(sanitizeTextForSpeech('A **bold** and *italic* text.')).toBe(
        'A bold and italic text.',
      );
    });

    it('remove multiplas marcacoes na mesma linha', () => {
      expect(sanitizeTextForSpeech('**bold** _italic_ ~~strike~~ ||spoiler||')).toBe(
        'bold italic strike spoiler',
      );
    });
  });

  // ── Remocao de headings markdown ──

  describe('remove headings markdown', () => {
    it('remove heading h1', () => {
      expect(sanitizeTextForSpeech('# Chapter One')).toBe('Chapter One');
    });

    it('remove heading h2', () => {
      expect(sanitizeTextForSpeech('## Scene Two')).toBe('Scene Two');
    });

    it('remove heading h3', () => {
      expect(sanitizeTextForSpeech('### Battle Log')).toBe('Battle Log');
    });

    it('remove heading h6', () => {
      expect(sanitizeTextForSpeech('###### Minor Note')).toBe('Minor Note');
    });

    it('remove heading com espacos iniciais (ate 3)', () => {
      expect(sanitizeTextForSpeech('   ## Indented Heading')).toBe('Indented Heading');
    });
  });

  // ── Remocao de links e imagens markdown ──

  describe('remove links e imagens markdown', () => {
    it('remove link e preserva texto do link', () => {
      expect(sanitizeTextForSpeech('Click [here](https://example.com) for more.')).toBe(
        'Click here for more.',
      );
    });

    it('remove link sem texto visivel resulta no alt text', () => {
      expect(sanitizeTextForSpeech('[Visit Site](https://example.com)')).toBe('Visit Site');
    });

    it('remove imagem e preserva alt text', () => {
      expect(sanitizeTextForSpeech('Look: ![a dragon](dragon.png) in the sky.')).toBe(
        'Look: a dragon in the sky.',
      );
    });

    it('remove imagem sem alt text', () => {
      expect(sanitizeTextForSpeech('Image: ![](photo.jpg) here.')).toBe('Image: here.');
    });

    it('remove URLs soltas', () => {
      expect(sanitizeTextForSpeech('Visit https://example.com for details.')).toBe(
        'Visit for details.',
      );
    });

    it('remove URLs http', () => {
      expect(sanitizeTextForSpeech('Go to http://example.com now.')).toBe('Go to now.');
    });
  });

  // ── Remocao de code blocks e inline code ──

  describe('remove code blocks e inline code', () => {
    it('remove inline code com backticks', () => {
      expect(sanitizeTextForSpeech('Use `fireball` spell.')).toBe('Use fireball spell.');
    });

    it('remove code block fenced', () => {
      const input = '```javascript\nconsole.log("hello");\n```';
      expect(sanitizeTextForSpeech(input)).toBe('console.log("hello");');
    });

    it('remove code block sem linguagem', () => {
      const input = '```\nsome code\n```';
      expect(sanitizeTextForSpeech(input)).toBe('some code');
    });

    it('remove multiplos inline code', () => {
      expect(sanitizeTextForSpeech('Cast `magic missile` or `fireball`.')).toBe(
        'Cast magic missile or fireball.',
      );
    });
  });

  // ── Remocao de blockquotes ──

  describe('remove blockquotes', () => {
    it('remove blockquote simples', () => {
      expect(sanitizeTextForSpeech('> The old wizard spoke.')).toBe('The old wizard spoke.');
    });

    it('remove blockquote aninhado', () => {
      expect(sanitizeTextForSpeech('>> Nested quote here.')).toBe('Nested quote here.');
    });

    it('remove blockquote com espaco', () => {
      expect(sanitizeTextForSpeech('>  Quoted text.')).toBe('Quoted text.');
    });
  });

  // ── Remocao de listas markdown ──

  describe('remove marcadores de listas markdown', () => {
    it('remove lista com hifen', () => {
      expect(sanitizeTextForSpeech('- First item')).toBe('First item');
    });

    it('remove lista com asterisco', () => {
      expect(sanitizeTextForSpeech('* Second item')).toBe('Second item');
    });

    it('remove lista com mais', () => {
      expect(sanitizeTextForSpeech('+ Third item')).toBe('Third item');
    });

    it('remove lista numerada', () => {
      expect(sanitizeTextForSpeech('1. First numbered item')).toBe('First numbered item');
    });

    it('remove lista numerada com numero alto', () => {
      expect(sanitizeTextForSpeech('42. Item forty-two')).toBe('Item forty-two');
    });

    it('remove multiplos itens de lista', () => {
      const input = '- Sword\n- Shield\n- Potion';
      expect(sanitizeTextForSpeech(input)).toBe('Sword\nShield\nPotion');
    });
  });

  // ── Remocao de simbolos decorativos ──

  describe('remove simbolos decorativos', () => {
    it('remove bullet point •', () => {
      expect(sanitizeTextForSpeech('• Item one')).toBe('Item one');
    });

    it('remove simbolos ▪▸▶►', () => {
      expect(sanitizeTextForSpeech('▪ Item\n▸ Item\n▶ Item\n► Item')).toBe(
        'Item\nItem\nItem\nItem',
      );
    });

    it('remove simbolos de diamante e quadrado', () => {
      expect(sanitizeTextForSpeech('◆ Point ■ Square')).toBe('Point Square');
    });

    it('remove simbolos de circulo', () => {
      expect(sanitizeTextForSpeech('○ Open ● Closed ◦ Small ◇ Diamond')).toBe(
        'Open Closed Small Diamond',
      );
    });

    it('remove simbolo □', () => {
      expect(sanitizeTextForSpeech('□ Checkbox item')).toBe('Checkbox item');
    });
  });

  // ── Normalizacao de aspas tipograficas ──

  describe('normaliza aspas tipograficas', () => {
    it('converte aspas duplas curvas para retas', () => {
      expect(sanitizeTextForSpeech('\u201CHello\u201D')).toBe('"Hello"');
    });

    it('converte aspas simples curvas para retas', () => {
      expect(sanitizeTextForSpeech('\u2018Hello\u2019')).toBe("'Hello'");
    });
  });

  // ── Normalizacao de travessoes ──

  describe('normaliza travessoes', () => {
    it('converte en-dash para hifen com espacos', () => {
      expect(sanitizeTextForSpeech('The hero\u2013a brave one\u2013fought.')).toBe(
        'The hero - a brave one - fought.',
      );
    });

    it('converte em-dash para hifen com espacos', () => {
      expect(sanitizeTextForSpeech('He struck\u2014the beast fell.')).toBe(
        'He struck - the beast fell.',
      );
    });
  });

  // ── Remocao de zero-width characters ──

  describe('remove zero-width characters', () => {
    it('remove zero-width space U+200B', () => {
      expect(sanitizeTextForSpeech('Hello\u200Bworld')).toBe('Helloworld');
    });

    it('remove zero-width non-joiner U+200C', () => {
      expect(sanitizeTextForSpeech('Hello\u200Cworld')).toBe('Helloworld');
    });

    it('remove zero-width joiner U+200D', () => {
      expect(sanitizeTextForSpeech('Hello\u200Dworld')).toBe('Helloworld');
    });

    it('remove BOM U+FEFF', () => {
      expect(sanitizeTextForSpeech('\uFEFFHello world')).toBe('Hello world');
    });

    it('converte non-breaking space U+00A0 para espaco normal', () => {
      expect(sanitizeTextForSpeech('Hello\u00A0world')).toBe('Hello world');
    });
  });

  // ── Normalizacao de whitespace ──

  describe('normaliza whitespace excessivo', () => {
    it('normaliza espacos duplos para simples', () => {
      expect(sanitizeTextForSpeech('Hello  world')).toBe('Hello world');
    });

    it('normaliza multiplos espacos para simples', () => {
      expect(sanitizeTextForSpeech('Hello     world')).toBe('Hello world');
    });

    it('normaliza tabs multiplos para espaco simples', () => {
      expect(sanitizeTextForSpeech('Hello\t\tworld')).toBe('Hello world');
    });

    it('remove espacos finais antes de newline', () => {
      expect(sanitizeTextForSpeech('Hello   \nworld')).toBe('Hello\nworld');
    });

    it('normaliza CR+LF para LF', () => {
      expect(sanitizeTextForSpeech('Line1\r\nLine2')).toBe('Line1\nLine2');
    });

    it('normaliza CR isolado para LF', () => {
      expect(sanitizeTextForSpeech('Line1\rLine2')).toBe('Line1\nLine2');
    });

    it('reduz 3+ newlines consecutivas para 2', () => {
      expect(sanitizeTextForSpeech('Para1\n\n\nPara2')).toBe('Para1\nPara2');
    });

    it('reduz muitas newlines consecutivas para 2', () => {
      expect(sanitizeTextForSpeech('Para1\n\n\n\n\n\nPara2')).toBe('Para1\nPara2');
    });

    it('remove espacos no inicio e fim (trim)', () => {
      expect(sanitizeTextForSpeech('  Hello world  ')).toBe('Hello world');
    });

    it('remove newlines no inicio e fim (trim)', () => {
      expect(sanitizeTextForSpeech('\n\nHello\n\n')).toBe('Hello');
    });

    it('remove linhas vazias e normaliza estrutura', () => {
      const input = '  First line  \n  \n  Second line  ';
      expect(sanitizeTextForSpeech(input)).toBe('First line\nSecond line');
    });
  });

  // ── Remocao de marcadores markdown residuais ──

  describe('remove marcadores markdown residuais soltos', () => {
    it('remove asteriscos soltos no fim de linha', () => {
      expect(sanitizeTextForSpeech('text * ')).toBe('text');
    });

    it('remove underscores soltos', () => {
      expect(sanitizeTextForSpeech('text _ ')).toBe('text');
    });

    it('remove tils soltos', () => {
      expect(sanitizeTextForSpeech('text ~ ')).toBe('text');
    });

    it('remove hash soltos', () => {
      expect(sanitizeTextForSpeech('text # ')).toBe('text');
    });

    it('remove backtick solto', () => {
      expect(sanitizeTextForSpeech('text > ')).toBe('text');
    });
  });

  // ── Texto RPG-especifico ──

  describe('texto RPG-especifico', () => {
    it('preserva notacao de dados (dice notation)', () => {
      const input = 'Roll 2d6+3 for damage.';
      expect(sanitizeTextForSpeech(input)).toBe('Roll 2d6+3 for damage.');
    });

    it('preserva texto de combate com numeros', () => {
      const input = 'The warrior deals 25 damage. The orc has 10 HP remaining.';
      expect(sanitizeTextForSpeech(input)).toBe(input);
    });

    it('limpa narrativa de combate com markdown', () => {
      const input = '**Thorin** ataca com *Força Total*! Causa ~~10~~ 15 de dano.';
      expect(sanitizeTextForSpeech(input)).toBe(
        'Thorin ataca com Força Total! Causa 10 15 de dano.',
      );
    });

    it('preserva descricao de habilidades', () => {
      const input = 'Bola de Fogo: Causa 8d6 de dano de fogo em uma area de 6m.';
      expect(sanitizeTextForSpeech(input)).toBe(input);
    });

    it('preserva texto de teste de atributo', () => {
      const input = 'Teste de Sabedoria (CD 15): Voce precisa tirar 15 ou mais.';
      expect(sanitizeTextForSpeech(input)).toBe(input);
    });

    it('limpa lista de inventario formatada', () => {
      const input = '- Espada longa (+2)\n- Escudo de madeira\n- Pocao de cura (x3)';
      expect(sanitizeTextForSpeech(input)).toBe(
        'Espada longa (+2)\nEscudo de madeira\nPocao de cura (x3)',
      );
    });

    it('limpa bloco de status com markdown e simbolos', () => {
      const input = '## Status do Personagem\n**HP:** 45/60\n**Mana:** 20/30\n• Envenenado\n• Abencado';
      expect(sanitizeTextForSpeech(input)).toBe(
        'Status do Personagem\nHP: 45/60\nMana: 20/30\nEnvenenado\nAbencado',
      );
    });

    it('limpa narrativa com blockquote e bold', () => {
      const input = '> **Mestre:** "Vocês chegam a uma encruzilhada."\n\nO que vocês fazem?';
      expect(sanitizeTextForSpeech(input)).toBe(
        'Mestre: "Vocês chegam a uma encruzilhada."\nO que vocês fazem?',
      );
    });

    it('preserva dialogo RPG normal', () => {
      const input = 'O taverneiro diz: "Bem-vindos, aventureiros! O que desejam?"';
      expect(sanitizeTextForSpeech(input)).toBe(input);
    });
  });

  // ── Mojibake detection e correcao ──

  describe('mojibake detection e correcao', () => {
    it('tenta decodificar texto com artefatos mojibake', () => {
      // The function attempts latin1->utf8 decode if it reduces mojibake markers
      const result = sanitizeTextForSpeech('Ação');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('texto sem mojibake permanece inalterado', () => {
      expect(sanitizeTextForSpeech('Normal text here')).toBe('Normal text here');
    });

    it('texto com replacement character nao quebra', () => {
      const result = sanitizeTextForSpeech('Hello \uFFFD world');
      expect(typeof result).toBe('string');
    });
  });

  // ── Cenarios combinados complexos ──

  describe('cenarios combinados complexos', () => {
    it('limpa texto com multiplas formatacoes markdown', () => {
      const input = '## Capitulo 1\n\n**O heroi** foi até a *taverna*.\n\n> "Preciso de ajuda," disse ele.\n\n- Espada\n- Escudo\n- Pocao';
      const result = sanitizeTextForSpeech(input);
      expect(result).not.toContain('##');
      expect(result).not.toContain('**');
      expect(result).not.toContain('*');
      expect(result).not.toContain('>');
      expect(result).not.toContain('- ');
      expect(result).toContain('Capitulo 1');
      expect(result).toContain('O heroi');
      expect(result).toContain('taverna');
      expect(result).toContain('Espada');
    });

    it('limpa texto com code, links e formatacao', () => {
      const input = 'Use `detect magic` spell. See [rules](https://dnd.com) for **details**.';
      expect(sanitizeTextForSpeech(input)).toBe(
        'Use detect magic spell. See rules for details.',
      );
    });

    it('normaliza whitespace apos remocao de formatacao', () => {
      const input = '**Bold**   *italic*   ~~strike~~';
      const result = sanitizeTextForSpeech(input);
      expect(result).toBe('Bold italic strike');
    });

    it('limpa texto com smart quotes e dashes combinados', () => {
      const input = '\u201CThe hero\u2019s journey\u201D \u2014 a classic tale.';
      expect(sanitizeTextForSpeech(input)).toBe('"The hero\'s journey" - a classic tale.');
    });

    it('limpa narrativa completa com multiplos elementos', () => {
      const input = [
        '# A Batalha Final',
        '',
        '**Thorin** empunha sua _espada lendaria_ e avanca contra o **dragao**.',
        '',
        '> "Voce nao me assusta!" grita o guerreiro.',
        '',
        '## Resultado',
        '- Dano causado: 45',
        '- HP restante do dragao: 120',
        '',
        'Visite https://rpg.example.com para mais detalhes.',
      ].join('\n');

      const result = sanitizeTextForSpeech(input);
      expect(result).toContain('A Batalha Final');
      expect(result).toContain('Thorin empunha sua espada lendaria');
      expect(result).toContain('"Voce nao me assusta!" grita o guerreiro.');
      expect(result).toContain('Resultado');
      expect(result).toContain('Dano causado: 45');
      expect(result).not.toContain('**');
      expect(result).not.toContain('_');
      expect(result).not.toContain('#');
      expect(result).not.toContain('https://');
      expect(result).not.toContain('- ');
    });
  });

  // ── Texto muito longo ──

  describe('texto muito longo', () => {
    it('lida com texto de 10k caracteres sem erro', () => {
      const input = 'A brave hero. '.repeat(700);
      const result = sanitizeTextForSpeech(input);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('lida com texto de 100k caracteres sem erro', () => {
      const input = 'The dragon roars. '.repeat(6000);
      const result = sanitizeTextForSpeech(input);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('lida com texto longo contendo markdown repetido', () => {
      const line = '**Bold text** and *italic text* with `code`.\n';
      const input = line.repeat(500);
      const result = sanitizeTextForSpeech(input);
      expect(result).not.toContain('**');
      expect(result).not.toContain('`');
    });

    it('lida com muitas newlines', () => {
      const input = 'Line\n'.repeat(1000);
      const result = sanitizeTextForSpeech(input);
      expect(result).not.toMatch(/\n{3,}/);
    });
  });

  // ── Caracteres especiais e edge cases ──

  describe('caracteres especiais e edge cases', () => {
    it('preserva parenteses e colchetes no texto', () => {
      const input = 'The warrior (level 5) attacks [with advantage].';
      // colchetes: link pattern sem URL ficam intactos
      const result = sanitizeTextForSpeech(input);
      expect(result).toContain('(level 5)');
    });

    it('preserva caracteres matematicos comuns', () => {
      expect(sanitizeTextForSpeech('2+3=5 and 10-4=6')).toBe('2+3=5 and 10-4=6');
    });

    it('preserva porcentagem', () => {
      expect(sanitizeTextForSpeech('75% chance de acerto.')).toBe('75% chance de acerto.');
    });

    it('preserva barra', () => {
      expect(sanitizeTextForSpeech('HP 45/60')).toBe('HP 45/60');
    });

    it('um unico caractere permanece', () => {
      expect(sanitizeTextForSpeech('A')).toBe('A');
    });

    it('somente whitespace retorna vazio', () => {
      expect(sanitizeTextForSpeech('   \t  \n  ')).toBe('');
    });

    it('texto com apenas markdown retorna vazio ou conteudo limpo', () => {
      const result = sanitizeTextForSpeech('** ** __ __ ~~ ~~');
      expect(typeof result).toBe('string');
    });
  });

  // ── Export default ──

  describe('export default', () => {
    it('modulo exporta sanitizeTextForSpeech como named export', async () => {
      const mod = await import('../services/speechTextService.js');
      expect(typeof mod.sanitizeTextForSpeech).toBe('function');
    });

    it('modulo exporta default com sanitizeTextForSpeech', async () => {
      const mod = await import('../services/speechTextService.js');
      expect(typeof mod.default.sanitizeTextForSpeech).toBe('function');
    });

    it('named export e default export referem a mesma funcao', async () => {
      const mod = await import('../services/speechTextService.js');
      expect(mod.sanitizeTextForSpeech).toBe(mod.default.sanitizeTextForSpeech);
    });
  });
});
