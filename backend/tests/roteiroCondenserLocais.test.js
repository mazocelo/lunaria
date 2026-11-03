import { describe, it, expect } from 'vitest';
import { condensarRoteiro } from '../agents/Mestre/prompts/roteiroCondenser.js';

/**
 * Regressao: os segredos dos locais nunca chegavam ao prompt do Mestre.
 *
 * `blueprintService.normalizeLocais` grava `segredos` (array), mas o condenser
 * lia `l.segredo` (singular) — campo que nunca existiu. O `if` nunca disparava.
 * O efeito era silencioso e grave: o motor de mapas desenha salas com
 * `papel: 'segredo'` a partir de `segredos[]`, ou seja, a planta conhecia
 * segredos que o narrador jamais viu.
 */

const roteiroBase = {
  sinopse: 'Uma aventura.',
  progressao: { arco_atual: 1 },
  locais: [
    {
      nome: 'Catacumbas de Aethelburg',
      tipo: 'dungeon',
      descricao: 'Labirinto subterraneo sob a Academia.',
      segredos: ['Diario de Elara detalhando a corrupcao', 'Portal menor ativo'],
      monstros_comuns: ['Dretch', 'Ghoul'],
      arco_relacionado: 1,
    },
  ],
};

describe('condensarRoteiro — segredos dos locais', () => {
  it('inclui o segredo vindo do array `segredos`', () => {
    const texto = condensarRoteiro(roteiroBase);
    expect(texto).toContain('Catacumbas de Aethelburg');
    expect(texto).toContain('Segredo: Diario de Elara');
  });

  it('aceita o campo legado `segredo` (singular) de roteiros antigos', () => {
    const antigo = {
      ...roteiroBase,
      locais: [{ nome: 'Cripta', tipo: 'dungeon', segredo: 'Alcapao oculto', arco_relacionado: 1 }],
    };
    expect(condensarRoteiro(antigo)).toContain('Segredo: Alcapao oculto');
  });

  it('nao vaza os placeholders que o blueprintService grava', () => {
    const comPlaceholder = {
      ...roteiroBase,
      locais: [
        {
          nome: 'Local Central',
          tipo: 'outro',
          descricao: 'Sem descricao',
          segredos: ['Nenhum segredo definido'],
          monstros_comuns: ['Nenhum'],
          arco_relacionado: 1,
        },
      ],
    };
    const texto = condensarRoteiro(comPlaceholder);
    expect(texto).toContain('Local Central');
    expect(texto).not.toContain('Nenhum segredo definido');
    expect(texto).not.toContain('Segredo:');
  });

  it('pula placeholders e usa o primeiro segredo real da lista', () => {
    const misto = {
      ...roteiroBase,
      locais: [
        {
          nome: 'Templo',
          tipo: 'templo',
          segredos: ['Nenhum segredo definido', '  ', 'Altar rachado esconde a chave'],
          arco_relacionado: 1,
        },
      ],
    };
    expect(condensarRoteiro(misto)).toContain('Segredo: Altar rachado esconde a chave');
  });

  it('nao quebra quando o local nao tem segredo algum', () => {
    const semSegredo = {
      ...roteiroBase,
      locais: [{ nome: 'Praca', tipo: 'cidade', arco_relacionado: 1 }],
    };
    const texto = condensarRoteiro(semSegredo);
    expect(texto).toContain('Praca');
    expect(texto).not.toContain('Segredo:');
  });
});
