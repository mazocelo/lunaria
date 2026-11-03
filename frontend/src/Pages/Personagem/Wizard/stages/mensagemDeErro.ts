// src/Pages/Personagem/Wizard/stages/mensagemDeErro.ts
/** Erro de API → frase para o jogador. O texto técnico vai para o console (A08). */
export function mensagemDeErro(err: unknown): string {
  const bruto = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  if (/timeout|ECONNABORTED|Timeout na requisi/i.test(bruto)) return 'O Mestre demorou demais para responder. Tente de novo.';
  if (bruto.startsWith('[contract:')) return 'O servidor respondeu algo inesperado. Tente de novo em instantes.';
  if (/Erro de conex/i.test(bruto)) return 'Sem conexão com o servidor. Confira a internet e tente de novo.';
  if (/Sess[aã]o expirada/i.test(bruto)) return 'Sua sessão expirou. Entre de novo; o rascunho fica salvo.';
  if (bruto && !bruto.includes('[') && bruto.length <= 160) return bruto;
  return 'Algo deu errado. Tente de novo.';
}
