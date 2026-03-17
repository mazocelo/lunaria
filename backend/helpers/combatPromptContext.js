import {
  formatarContextoCombate,
  formatarResultadoMecanico
} from './combateHelper.js';

export function buildCombatPromptContext({
  combate,
  userId,
  personagem,
  turnStateText = '',
  resultadoMecanico = null,
  pendingTest = false
} = {}) {
  const chunks = [];
  const safeTurnState = String(turnStateText || '').trim();
  const contextoCombate = formatarContextoCombate(combate, userId);
  const mechanicalSummary = resultadoMecanico
    ? formatarResultadoMecanico(resultadoMecanico, personagem?.nome || 'Aventureiro')
    : '';

  if (safeTurnState) chunks.push(safeTurnState);
  if (contextoCombate) chunks.push(contextoCombate);
  if (mechanicalSummary) chunks.push(mechanicalSummary);

  return {
    promptText: chunks.filter(Boolean).join('\n'),
    mechanicalSummary,
    requiresTest: pendingTest || Boolean(resultadoMecanico?.requerTeste)
  };
}

export default buildCombatPromptContext;
