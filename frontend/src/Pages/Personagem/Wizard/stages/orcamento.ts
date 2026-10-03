// src/Pages/Personagem/Wizard/stages/orcamento.ts
export interface Orcamento {
  pontosCriacaoRestantes: number;
  pontosDesvantagem: number;
  maxCustoDesvantagem: number;
}

/**
 * Mesma regra do usePointSystem.selecionarVantagemDesvantagem: o que o modelo recusaria, a carta já mostra bloqueado.
 * As já escolhidas ficam de fora: clicar nelas remove, e o modelo não confere orçamento para remover.
 */
export function idsAcimaDoOrcamento(
  tipo: 'vantagem' | 'desvantagem',
  itens: Array<{ id: number | string; custo?: number | null }>,
  o: Orcamento,
  jaEscolhidas: Array<number | string> = [],
): Array<number | string> {
  const escolhidas = new Set(jaEscolhidas.map(String));
  return itens
    .filter((item) => {
      if (escolhidas.has(String(item.id))) return false;
      const custo = Number(item.custo) || 0;
      return tipo === 'vantagem'
        ? custo > o.pontosCriacaoRestantes
        : o.pontosDesvantagem + custo < -o.maxCustoDesvantagem;
    })
    .map((item) => item.id);
}

/** Pontos que as desvantagens devolvem ao orçamento (mesma conta do usePointSystem). */
export function pontosDevolvidos(pontosDesvantagem: number, maxCustoDesvantagem: number): number {
  return Math.min(Math.abs(maxCustoDesvantagem), Math.abs(pontosDesvantagem));
}
