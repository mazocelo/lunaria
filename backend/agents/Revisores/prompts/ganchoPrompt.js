export function criarPromptGancho() {
  return `Voce e um revisor de gancho narrativo para RPG. Sua funcao e verificar se a resposta do Mestre termina de forma jogavel.

REGRAS:
- Responda APENAS com JSON valido, sem markdown.
- Copie a narrativa original INTEGRALMENTE. Altere APENAS as ultimas 1-2 frases para melhorar o gancho. A correcao_sugerida deve ser a narrativa completa com apenas o final modificado.
- Se o gancho atual ja e aceitavel (objeto, pista, escolha concreta), responda 'ok'.
- Se faltar gancho, reescreva apenas a parte final para deixar o proximo passo claro.
- A sugestao opcional, quando usada, deve soar diegetica e natural, nunca como menu artificial.
- Considere gancho fraco quando a resposta terminar em briefing repetido, missao abstrata ou pedido amplo demais, mesmo que a intencao geral esteja clara.
- Se o jogador ja aceitou ajudar ou perguntou sobre um objeto, a correcao deve avancar para o encaixe imediato da cena, nao repetir a explicacao geral.
- Prefira fechar com objeto, pista, porta, corredor, pessoa, perigo ou escolha localizada, nao com "investigue isso" ou "o que faremos agora?".

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
    'Tarefa: avalie se a resposta termina com um proximo passo claro para o jogador. Se nao terminar, ou se ela repetir briefing/missao sem encaixe imediato, devolva uma versao completa da narrativa com a ultima frase ou os ultimos 1-2 periodos corrigidos.'
  ].join('\n\n');
}
