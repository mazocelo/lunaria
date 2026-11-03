import { describe, expect, it } from 'vitest';
import {
  converterHistoricoParaLangChain,
  limitarHistorico,
  adicionarMensagem,
} from '../agents/Mestre/utils/historico.js';

describe('historico', () => {
  describe('converterHistoricoParaLangChain', () => {
    it('converte mensagem do jogador para role user', () => {
      const mensagens = [
        { tipo: 'jogador', jogador: 'Carlos', personagem: 'Thorin', mensagem: 'Eu ataco' },
      ];
      const result = converterHistoricoParaLangChain(mensagens);
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('user');
      expect(result[0].content).toContain('Jogador: Carlos');
      expect(result[0].content).toContain('Personagem: Thorin');
      expect(result[0].content).toContain('Ação: Eu ataco');
    });

    it('usa username como fallback para jogador', () => {
      const mensagens = [
        { tipo: 'jogador', username: 'Ana', personagem: 'Elara', acao: 'Olho ao redor' },
      ];
      const result = converterHistoricoParaLangChain(mensagens);
      expect(result[0].content).toContain('Jogador: Ana');
      expect(result[0].content).toContain('Ação: Olho ao redor');
    });

    it('converte mensagem do mestre para role assistant', () => {
      const mensagens = [
        { tipo: 'mestre', narracao: 'O dragão aparece.' },
      ];
      const result = converterHistoricoParaLangChain(mensagens);
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('assistant');
      expect(result[0].content).toBe('O dragão aparece.');
    });

    it('usa mensagem como fallback para narracao do mestre', () => {
      const mensagens = [
        { tipo: 'mestre', mensagem: 'Texto alternativo' },
      ];
      const result = converterHistoricoParaLangChain(mensagens);
      expect(result[0].content).toBe('Texto alternativo');
    });

    it('parseia JSON com campo narrativa na mensagem do mestre', () => {
      const jsonContent = JSON.stringify({ narrativa: 'A caverna escura se revela.' });
      const mensagens = [
        { tipo: 'mestre', narracao: jsonContent },
      ];
      const result = converterHistoricoParaLangChain(mensagens);
      expect(result[0].content).toBe('A caverna escura se revela.');
    });

    it('parseia JSON com segmentos na mensagem do mestre', () => {
      const jsonContent = JSON.stringify({
        segmentos: [
          { text: 'Parte um.' },
          { text: 'Parte dois.' },
        ],
      });
      const mensagens = [
        { tipo: 'mestre', narracao: jsonContent },
      ];
      const result = converterHistoricoParaLangChain(mensagens);
      expect(result[0].content).toBe('Parte um.\nParte dois.');
    });

    it('prioriza narrativa sobre segmentos em JSON', () => {
      const jsonContent = JSON.stringify({
        narrativa: 'Texto prioritário',
        segmentos: [{ text: 'Ignorado' }],
      });
      const mensagens = [
        { tipo: 'mestre', narracao: jsonContent },
      ];
      const result = converterHistoricoParaLangChain(mensagens);
      expect(result[0].content).toBe('Texto prioritário');
    });

    it('mantém texto original se JSON for inválido', () => {
      const mensagens = [
        { tipo: 'mestre', narracao: '{invalid json here' },
      ];
      const result = converterHistoricoParaLangChain(mensagens);
      expect(result[0].content).toBe('{invalid json here');
    });

    it('trunca conteúdo do mestre com mais de 1500 caracteres', () => {
      const longText = 'A'.repeat(2000);
      const mensagens = [
        { tipo: 'mestre', narracao: longText },
      ];
      const result = converterHistoricoParaLangChain(mensagens);
      expect(result[0].content).toHaveLength(1503); // 1500 + '...'
      expect(result[0].content.endsWith('...')).toBe(true);
    });

    it('não trunca conteúdo do mestre com exatamente 1500 caracteres', () => {
      const exactText = 'B'.repeat(1500);
      const mensagens = [
        { tipo: 'mestre', narracao: exactText },
      ];
      const result = converterHistoricoParaLangChain(mensagens);
      expect(result[0].content).toHaveLength(1500);
      expect(result[0].content.endsWith('...')).toBe(false);
    });

    it('converte mensagem tipo resultado_teste para role user', () => {
      const mensagens = [
        {
          tipo: 'resultado_teste',
          username: 'Carlos',
          payload: {
            descricaoResultado: 'Sucesso crítico!',
            dice: 'd20',
            rolagemBruta: 18,
            totalModificador: 3,
            atributoNome: 'Força',
            total: 21,
            dc: 15,
          },
        },
      ];
      const result = converterHistoricoParaLangChain(mensagens);
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('user');
      expect(result[0].content).toContain('[Resultado de teste]');
      expect(result[0].content).toContain('Carlos');
      expect(result[0].content).toContain('d20');
      expect(result[0].content).toContain('18');
      expect(result[0].content).toContain('Força');
      expect(result[0].content).toContain('21');
      expect(result[0].content).toContain('15');
      expect(result[0].content).toContain('Sucesso crítico!');
    });

    it('usa defaults para campos ausentes em resultado_teste', () => {
      const mensagens = [
        { tipo: 'resultado_teste', payload: { sucesso: true } },
      ];
      const result = converterHistoricoParaLangChain(mensagens);
      expect(result[0].content).toContain('Jogador');
      expect(result[0].content).toContain('d20');
      expect(result[0].content).toContain('Sucesso');
    });

    it('mostra Falha quando sucesso é false em resultado_teste', () => {
      const mensagens = [
        { tipo: 'resultado_teste', payload: { sucesso: false } },
      ];
      const result = converterHistoricoParaLangChain(mensagens);
      expect(result[0].content).toContain('Falha');
    });

    it('mostra Resultado inconclusivo quando sucesso é undefined', () => {
      const mensagens = [
        { tipo: 'resultado_teste', payload: {} },
      ];
      const result = converterHistoricoParaLangChain(mensagens);
      expect(result[0].content).toContain('Resultado inconclusivo');
    });

    it('filtra tipos desconhecidos retornando null', () => {
      const mensagens = [
        { tipo: 'sistema', conteudo: 'Mensagem de sistema' },
        { tipo: 'jogador', jogador: 'Ana', personagem: 'Elara', mensagem: 'Olá' },
      ];
      const result = converterHistoricoParaLangChain(mensagens);
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('user');
    });

    it('retorna array vazio para histórico vazio', () => {
      expect(converterHistoricoParaLangChain([])).toEqual([]);
    });

    it('retorna array vazio quando input não é array', () => {
      expect(converterHistoricoParaLangChain(null)).toEqual([]);
      expect(converterHistoricoParaLangChain(undefined)).toEqual([]);
      expect(converterHistoricoParaLangChain('texto')).toEqual([]);
      expect(converterHistoricoParaLangChain(42)).toEqual([]);
    });

    it('converte múltiplas mensagens misturadas', () => {
      const mensagens = [
        { tipo: 'jogador', jogador: 'Carlos', personagem: 'Thorin', mensagem: 'Eu ataco' },
        { tipo: 'mestre', narracao: 'O goblin esquiva.' },
        { tipo: 'jogador', jogador: 'Ana', personagem: 'Elara', mensagem: 'Lanço magia' },
        { tipo: 'mestre', narracao: 'A magia atinge o alvo.' },
      ];
      const result = converterHistoricoParaLangChain(mensagens);
      expect(result).toHaveLength(4);
      expect(result[0].role).toBe('user');
      expect(result[1].role).toBe('assistant');
      expect(result[2].role).toBe('user');
      expect(result[3].role).toBe('assistant');
    });

    it('lida com payload ausente em resultado_teste', () => {
      const mensagens = [
        { tipo: 'resultado_teste' },
      ];
      const result = converterHistoricoParaLangChain(mensagens);
      expect(result).toHaveLength(1);
      expect(result[0].content).toContain('[Resultado de teste]');
    });

    it('filtra segmentos nulos dentro de JSON do mestre', () => {
      const jsonContent = JSON.stringify({
        segmentos: [
          { text: 'Válido' },
          null,
          { other: 'sem text' },
          { text: 'Também válido' },
        ],
      });
      const mensagens = [
        { tipo: 'mestre', narracao: jsonContent },
      ];
      const result = converterHistoricoParaLangChain(mensagens);
      expect(result[0].content).toBe('Válido\nTambém válido');
    });
  });

  describe('limitarHistorico', () => {
    it('retorna mensagens inalteradas quando dentro do limite', () => {
      const mensagens = [{ id: 1 }, { id: 2 }, { id: 3 }];
      expect(limitarHistorico(mensagens, 5)).toEqual(mensagens);
    });

    it('retorna mensagens inalteradas quando exatamente no limite', () => {
      const mensagens = [{ id: 1 }, { id: 2 }, { id: 3 }];
      expect(limitarHistorico(mensagens, 3)).toEqual(mensagens);
    });

    it('remove mensagens mais antigas quando excede o limite', () => {
      const mensagens = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
      const result = limitarHistorico(mensagens, 3);
      expect(result).toEqual([{ id: 3 }, { id: 4 }, { id: 5 }]);
    });

    it('usa limite padrão de 20', () => {
      const mensagens = Array.from({ length: 25 }, (_, i) => ({ id: i }));
      const result = limitarHistorico(mensagens);
      expect(result).toHaveLength(20);
      expect(result[0].id).toBe(5);
      expect(result[19].id).toBe(24);
    });

    it('retorna input inalterado para array vazio', () => {
      expect(limitarHistorico([])).toEqual([]);
    });

    it('retorna input inalterado quando não é array', () => {
      expect(limitarHistorico(null)).toBeNull();
      expect(limitarHistorico(undefined)).toBeUndefined();
    });

    it('limita a 1 mensagem', () => {
      const mensagens = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = limitarHistorico(mensagens, 1);
      expect(result).toEqual([{ id: 3 }]);
    });
  });

  describe('adicionarMensagem', () => {
    it('adiciona mensagem ao final do histórico', () => {
      const historico = [{ id: 1 }, { id: 2 }];
      const novaMensagem = { id: 3, tipo: 'jogador' };
      const result = adicionarMensagem(historico, novaMensagem);
      expect(result).toHaveLength(3);
      expect(result[2]).toEqual(novaMensagem);
    });

    it('não muta o array original', () => {
      const historico = [{ id: 1 }];
      const result = adicionarMensagem(historico, { id: 2 });
      expect(historico).toHaveLength(1);
      expect(result).toHaveLength(2);
    });

    it('cria novo array quando histórico é null', () => {
      const result = adicionarMensagem(null, { id: 1 });
      expect(result).toEqual([{ id: 1 }]);
    });

    it('cria novo array quando histórico é undefined', () => {
      const result = adicionarMensagem(undefined, { id: 1 });
      expect(result).toEqual([{ id: 1 }]);
    });

    it('aplica limitação padrão de 20 mensagens', () => {
      const historico = Array.from({ length: 20 }, (_, i) => ({ id: i }));
      const result = adicionarMensagem(historico, { id: 20 });
      expect(result).toHaveLength(20);
      expect(result[0].id).toBe(1);
      expect(result[19].id).toBe(20);
    });

    it('adiciona mensagem ao histórico vazio', () => {
      const result = adicionarMensagem([], { tipo: 'mestre', narracao: 'Início' });
      expect(result).toHaveLength(1);
      expect(result[0].tipo).toBe('mestre');
    });
  });
});
