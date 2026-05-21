/**
 * Configuracao da suite E2E lida de variaveis de ambiente.
 *
 * As credenciais NAO sao hardcoded no codigo de teste: vem de E2E_EMAIL /
 * E2E_SENHA. Nao ha default: defina E2E_EMAIL e E2E_SENHA (conta de QA do seu ambiente)
 * antes de rodar a suite.
 */
export const CREDENCIAIS = {
  email: process.env.E2E_EMAIL || '',
  senha: process.env.E2E_SENHA || '',
};

/** Senha propositalmente invalida para o teste de login negado. */
export const SENHA_INVALIDA = 'senha-errada-de-proposito-123';
