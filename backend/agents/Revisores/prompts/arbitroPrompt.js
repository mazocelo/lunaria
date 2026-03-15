/**
 * System prompt para o Árbitro Mecânico.
 * Valida se a narrativa do Mestre é consistente com a mecânica resolvida.
 */

export function criarPromptArbitro() {
  return `Voce e um arbitro mecanico de RPG. Sua unica funcao e comparar a narrativa do Mestre com o resultado mecanico ja resolvido pelo sistema.

REGRAS:
- Responda APENAS com JSON valido, sem markdown.
- Nunca invente regras. Valide apenas contra os dados fornecidos.
- Se nao houver resultado mecanico para comparar, responda "ok".

VERIFICACOES:
1. Dano narrado bate com o dano calculado?
2. Acerto/erro narrado bate com o resultado mecanico (acertou/esquivou)?
3. Habilidades ou magias mencionadas existem na ficha do personagem?
4. Items referenciados existem no inventario?
5. Mana ou recursos gastos sao coerentes com o custo real?
6. Critico narrado bate com critico mecanico?
7. Efeitos de status aplicados batem com o resultado?

FORMATO DE RESPOSTA (JSON):
{
  "veredicto": "ok" | "contradicao" | "regra_invalida" | "faltou_resultado" | "alegacao_inexistente",
  "severidade": "info" | "warn" | "error",
  "notas": "explicacao curta e objetiva",
  "correcao_sugerida": "texto corrigido ou null"
}

Se tudo estiver correto:
{ "veredicto": "ok", "severidade": "info", "notas": "sem divergencias", "correcao_sugerida": null }`;
}

/**
 * Monta a mensagem do usuário com os dados a validar.
 */
export function montarInputArbitro({ narrativa, resultadoMecanico, personagem, acaoJogador, claimFlags }) {
  const parts = [];

  parts.push(`NARRATIVA DO MESTRE:\n${narrativa}`);
  parts.push(`ACAO DO JOGADOR:\n${acaoJogador}`);

  if (resultadoMecanico) {
    const rm = resultadoMecanico;
    const resumo = [];
    if (rm.ataqueJogador) {
      resumo.push(`Ataque: rolagem=${rm.ataqueJogador.rolagem}, acertou=${rm.ataqueJogador.acertou}, esquivou=${rm.ataqueJogador.esquivou}, critico=${rm.ataqueJogador.critico}, dano=${rm.ataqueJogador.dano}`);
      if (rm.ataqueJogador.derrotado) resumo.push('Monstro derrotado');
    }
    if (rm.habilidade) {
      resumo.push(`Habilidade: valido=${rm.habilidade.valido}, dano=${rm.habilidade.dano}, custoMana=${rm.habilidade.custoMana}`);
    }
    if (rm.contraAtaques?.length > 0) {
      resumo.push(`Contra-ataques: ${rm.contraAtaques.length}`);
    }
    if (rm.combateFinalizado) {
      resumo.push(`Combate finalizado: ${rm.resultadoCombate}`);
    }
    if (rm.statusEfeitos?.length > 0) {
      resumo.push(`Efeitos aplicados: ${rm.statusEfeitos.map(e => e.tipo || e).join(', ')}`);
    }
    parts.push(`RESULTADO MECANICO:\n${resumo.join('\n')}`);
  } else {
    parts.push('RESULTADO MECANICO: nenhum (acao nao-mecanica)');
  }

  if (personagem) {
    const inv = personagem.inventario || personagem.equipamentos || [];
    const hab = personagem.habilidadesClasse || personagem.magias || [];
    const itemNames = Array.isArray(inv) ? inv.map(i => i.nome || i.name || i).slice(0, 15).join(', ') : '';
    const habNames = Array.isArray(hab) ? hab.map(h => h.nome || h.name || h).slice(0, 15).join(', ') : '';
    parts.push(`PERSONAGEM: ${personagem.nome || 'desconhecido'}, HP=${personagem.hp_atual ?? '?'}/${personagem.hp_max ?? '?'}, Mana=${personagem.mana_atual ?? '?'}/${personagem.mana_max ?? '?'}`);
    if (itemNames) parts.push(`INVENTARIO: ${itemNames}`);
    if (habNames) parts.push(`HABILIDADES: ${habNames}`);
  }

  if (claimFlags?.length > 0) {
    const flagTexts = claimFlags.map(f =>
      `- "${f.claim}" (${f.tipo}): ${f.status} — ${f.motivo || 'ok'}`
    );
    parts.push(`ALEGACOES DETECTADAS:\n${flagTexts.join('\n')}`);
  }

  return parts.join('\n\n');
}
