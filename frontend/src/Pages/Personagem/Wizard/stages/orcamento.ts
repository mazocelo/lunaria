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

const pts = (n: number) => `${n} ${n === 1 ? 'pt' : 'pts'}`;

/** Motivo de bloqueio por carta, com as mesmas regras do usePointSystem (saldo, teto, tier). Ausente = disponível. */
export function motivosDeBloqueio(
  tipo: 'vantagem' | 'desvantagem',
  itens: Array<{ id: number | string; custo?: number | null; nivel?: number | null }>,
  o: Orcamento & { tierMaximo: number },
): Record<string, string> {
  const motivos: Record<string, string> = {};
  for (const item of itens) {
    const custo = Number(item.custo) || 0;
    const nivel = item.nivel ?? 1;
    if (nivel > o.tierMaximo) motivos[String(item.id)] = `Requer tier ${nivel}`;
    else if (tipo === 'vantagem' && custo > o.pontosCriacaoRestantes) motivos[String(item.id)] = `Saldo insuficiente (faltam ${pts(custo - o.pontosCriacaoRestantes)})`;
    else if (tipo === 'desvantagem' && o.pontosDesvantagem + custo < -o.maxCustoDesvantagem)
      motivos[String(item.id)] = `Teto de desvantagens atingido (${Math.abs(o.pontosDesvantagem)}/${o.maxCustoDesvantagem})`;
  }
  return motivos;
}

/** Saldo se a escolha da categoria (raça ou classe) trocar de custoAtual para custoNovo. */
export function saldoAposTroca(saldoAtual: number, custoAtual: number, custoNovo: number): number {
  return saldoAtual + custoAtual - custoNovo;
}
