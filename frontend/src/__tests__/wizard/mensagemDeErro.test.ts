// src/__tests__/wizard/mensagemDeErro.test.ts
import { describe, it, expect } from 'vitest';
import { mensagemDeErro } from '../../Pages/Personagem/Wizard/stages/mensagemDeErro';

describe('mensagemDeErro', () => {
  it('traduz erros técnicos', () => {
    expect(mensagemDeErro(new Error('timeout of 25000ms exceeded'))).toBe('O Mestre demorou demais para responder. Tente de novo.');
    expect(mensagemDeErro(new Error('Timeout na requisição'))).toBe('O Mestre demorou demais para responder. Tente de novo.');
    expect(mensagemDeErro(new Error('[contract:MestreCriadorService.interagir] resposta da API nao trouxe { success, data }'))).toBe('O servidor respondeu algo inesperado. Tente de novo em instantes.');
    expect(mensagemDeErro(new Error('Erro de conexão com o servidor'))).toBe('Sem conexão com o servidor. Confira a internet e tente de novo.');
    expect(mensagemDeErro(new Error('Sessão expirada. Faça login novamente.'))).toBe('Sua sessão expirou. Entre de novo; o rascunho fica salvo.');
    expect(mensagemDeErro(42)).toBe('Algo deu errado. Tente de novo.');
  });
  it('mantém mensagens já escritas para o jogador', () => {
    expect(mensagemDeErro(new Error('Pontos de criação insuficientes. Disponível: 1, Custo: 3'))).toBe('Pontos de criação insuficientes. Disponível: 1, Custo: 3');
    expect(mensagemDeErro('Escolha uma raça primeiro.')).toBe('Escolha uma raça primeiro.');
  });
});
