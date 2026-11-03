import { describe, expect, it } from 'vitest';
import {
  formatarMensagemJogador,
  formatarRespostaMestre,
  extrairInfoPersonagem,
} from '../agents/Mestre/utils/formatacao.js';

describe('formatacao', () => {
  describe('formatarMensagemJogador', () => {
    it('retorna objeto com tipo jogador e campos corretos', () => {
      const result = formatarMensagemJogador('Carlos', 'Thorin', 'Eu ataco o goblin');
      expect(result.tipo).toBe('jogador');
      expect(result.jogador).toBe('Carlos');
      expect(result.personagem).toBe('Thorin');
      expect(result.mensagem).toBe('Eu ataco o goblin');
      expect(result.timestamp).toBeDefined();
    });

    it('inclui timestamp em formato ISO', () => {
      const before = new Date().toISOString();
      const result = formatarMensagemJogador('Ana', 'Elara', 'Olho ao redor');
      const after = new Date().toISOString();
      expect(result.timestamp >= before).toBe(true);
      expect(result.timestamp <= after).toBe(true);
    });

    it('aceita objetos como jogador e personagem', () => {
      const jogador = { id: 1, nome: 'Pedro' };
      const personagem = { nome: 'Aldaric', classe: 'Mago' };
      const result = formatarMensagemJogador(jogador, personagem, 'Lanço magia');
      expect(result.jogador).toEqual(jogador);
      expect(result.personagem).toEqual(personagem);
    });

    it('aceita null e undefined como parâmetros', () => {
      const result = formatarMensagemJogador(null, undefined, null);
      expect(result.tipo).toBe('jogador');
      expect(result.jogador).toBeNull();
      expect(result.personagem).toBeUndefined();
      expect(result.mensagem).toBeNull();
    });

    it('aceita mensagem vazia', () => {
      const result = formatarMensagemJogador('Carlos', 'Thorin', '');
      expect(result.mensagem).toBe('');
    });
  });

  describe('formatarRespostaMestre', () => {
    it('retorna objeto com tipo mestre e narracao', () => {
      const result = formatarRespostaMestre('O dragão aparece diante de vocês.');
      expect(result.tipo).toBe('mestre');
      expect(result.narracao).toBe('O dragão aparece diante de vocês.');
      expect(result.contexto).toEqual({});
      expect(result.timestamp).toBeDefined();
    });

    it('inclui contexto quando fornecido', () => {
      const contexto = { localizacao: 'caverna', inimigos: ['goblin', 'troll'] };
      const result = formatarRespostaMestre('Vocês entram na caverna.', contexto);
      expect(result.contexto).toEqual(contexto);
    });

    it('usa objeto vazio como contexto padrão', () => {
      const result = formatarRespostaMestre('Narração simples');
      expect(result.contexto).toEqual({});
    });

    it('inclui timestamp em formato ISO', () => {
      const result = formatarRespostaMestre('Texto');
      expect(typeof result.timestamp).toBe('string');
      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('aceita narracao null ou undefined', () => {
      const resultNull = formatarRespostaMestre(null);
      expect(resultNull.tipo).toBe('mestre');
      expect(resultNull.narracao).toBeNull();

      const resultUndef = formatarRespostaMestre(undefined);
      expect(resultUndef.narracao).toBeUndefined();
    });

    it('aceita narracao vazia', () => {
      const result = formatarRespostaMestre('');
      expect(result.narracao).toBe('');
    });
  });

  describe('extrairInfoPersonagem', () => {
    it('extrai todos os campos de um personagem completo', () => {
      const personagem = {
        nome: 'Thorin',
        classe: 'Guerreiro',
        raca: 'Anão',
        nivel: 5,
        atributos: { forca: 18, destreza: 12 },
        vantagens: [{ nome: 'Resistência' }],
        desvantagens: [{ nome: 'Ganância' }],
        equipamentos: [{ nome: 'Machado' }],
        habilidadesClasse: [{ nome: 'Investida' }],
        magias: [],
        background: 'Filho de rei exilado',
      };
      const result = extrairInfoPersonagem(personagem);
      expect(result.nome).toBe('Thorin');
      expect(result.classe).toBe('Guerreiro');
      expect(result.raca).toBe('Anão');
      expect(result.nivel).toBe(5);
      expect(result.atributos).toEqual({ forca: 18, destreza: 12 });
      expect(result.vantagens).toEqual([{ nome: 'Resistência' }]);
      expect(result.desvantagens).toEqual([{ nome: 'Ganância' }]);
      expect(result.equipamentos).toEqual([{ nome: 'Machado' }]);
      expect(result.habilidadesClasse).toEqual([{ nome: 'Investida' }]);
      expect(result.magias).toEqual([]);
      expect(result.background).toBe('Filho de rei exilado');
    });

    it('retorna { nome: string } quando personagem é string', () => {
      const result = extrairInfoPersonagem('Aldaric');
      expect(result).toEqual({ nome: 'Aldaric' });
    });

    it('usa personagemNome como fallback para nome', () => {
      const result = extrairInfoPersonagem({ personagemNome: 'Lyraeth' });
      expect(result.nome).toBe('Lyraeth');
    });

    it('usa classe_nome como fallback para classe', () => {
      const result = extrairInfoPersonagem({ nome: 'X', classe_nome: 'Arqueiro' });
      expect(result.classe).toBe('Arqueiro');
    });

    it('usa raca_nome como fallback para raca', () => {
      const result = extrairInfoPersonagem({ nome: 'X', raca_nome: 'Elfo' });
      expect(result.raca).toBe('Elfo');
    });

    it('usa valores padrão quando campos estão ausentes', () => {
      const result = extrairInfoPersonagem({});
      expect(result.nome).toBe('Aventureiro');
      expect(result.classe).toBe('');
      expect(result.raca).toBe('');
      expect(result.nivel).toBe(1);
      expect(result.atributos).toBeNull();
      expect(result.vantagens).toEqual([]);
      expect(result.desvantagens).toEqual([]);
      expect(result.equipamentos).toEqual([]);
      expect(result.habilidadesClasse).toEqual([]);
      expect(result.magias).toEqual([]);
      expect(result.background).toBe('');
    });

    it('prioriza campo direto sobre fallback', () => {
      const result = extrairInfoPersonagem({
        nome: 'Thorin',
        personagemNome: 'Fallback',
        classe: 'Guerreiro',
        classe_nome: 'FallbackClasse',
        raca: 'Anão',
        raca_nome: 'FallbackRaca',
      });
      expect(result.nome).toBe('Thorin');
      expect(result.classe).toBe('Guerreiro');
      expect(result.raca).toBe('Anão');
    });

    it('lida com string vazia como input (trata como string)', () => {
      const result = extrairInfoPersonagem('');
      expect(result).toEqual({ nome: '' });
    });
  });
});
