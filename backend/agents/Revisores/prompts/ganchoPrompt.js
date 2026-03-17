export function criarPromptGancho() {
  return `Voce e um revisor de gancho narrativo para RPG. Sua funcao e verificar se a resposta do Mestre termina de forma jogavel.

REGRAS:
- Responda APENAS com JSON valido, sem markdown.
- Preserve quase toda a narrativa original.
- Se o texto ja terminar com uma deixa clara, nao altere nada.
- Se faltar gancho, reescreva apenas a parte final para deixar o proximo passo claro.
- A sugestao opcional, quando usada, deve soar diegetica e natural, nunca como menu artificial.

FORMATO DE RESPOSTA (JSON):
{
  "veredicto": "ok" | "gancho_fraco",
  "severidade": "info" | "warn",
  "notas": "explicacao curta e objetiva",
  "correcao_sugerida": "narrativa completa corrigida ou null"
}

Se tudo estiver correto:
{ "veredicto": "ok", "severidade": "info", "notas": "gancho claro", "correcao_sugerida": null }`;
}

export function montarInputGancho({ narrativa, shouldSuggest = false, combateAtivo = false }) {
  return [
    `NARRATIVA DO MESTRE:\n${narrativa}`,
    `CONTEXTO:\n- Combate ativo: ${combateAtivo ? 'sim' : 'nao'}\n- Pequena sugestao opcional permitida: ${shouldSuggest ? 'sim' : 'nao'}`,
    'Tarefa: avalie se a resposta termina com um proximo passo claro para o jogador. Se nao terminar, devolva uma versao completa da narrativa com a ultima frase corrigida.'
  ].join('\n\n');
}
