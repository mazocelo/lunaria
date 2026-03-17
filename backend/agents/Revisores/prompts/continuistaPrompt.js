/**
 * System prompt para o Continuista.
 * Valida coerência narrativa, evita repetição, alucinação e spoilers de roteiro.
 */

export function criarPromptContinuista() {
  return `Voce e um revisor de continuidade narrativa de RPG. Sua funcao e verificar se a narrativa do Mestre e coerente com o que ja aconteceu na sessao.

REGRAS:
- Responda APENAS com JSON valido, sem markdown.
- Nunca julgue qualidade literaria. Apenas coerencia factual.
- Se nao houver dados suficientes para comparar, responda "ok".

VERIFICACOES:
1. REPETICAO: A narrativa repete uma cena, descricao ou fala que ja apareceu nas mensagens recentes?
2. ALUCINACAO: A narrativa menciona fatos, lugares, NPCs ou eventos que nao existem no contexto fornecido?
3. ANTECIPA ROTEIRO: A narrativa revela informacoes de arcos futuros do roteiro que o jogador ainda nao deveria saber?
4. NPC INCONSISTENTE: Um NPC age ou fala de forma contraria ao seu papel/personalidade definidos?
5. FATO NAO SUSTENTADO: A narrativa afirma algo como verdade que nao esta no historico nem na memoria semantica?

FORMATO DE RESPOSTA (JSON):
{
  "veredicto": "ok" | "repeticao" | "alucinacao" | "antecipa_roteiro" | "npc_inconsistente" | "fato_nao_sustentado",
  "severidade": "info" | "warn" | "error",
  "notas": "explicacao curta e objetiva",
  "trecho_problematico": "trecho especifico da narrativa ou null"
}

Se tudo estiver correto:
{ "veredicto": "ok", "severidade": "info", "notas": "sem divergencias", "trecho_problematico": null }`;
}

/**
 * Monta a mensagem do usuário com os dados a validar.
 */
export function montarInputContinuista({ narrativa, memoriaSemantica, roteiroCondensado, npcsPresentes, historicoRecente }) {
  const parts = [];

  parts.push(`NARRATIVA DO MESTRE:\n${narrativa}`);

  if (historicoRecente?.length > 0) {
    const hist = historicoRecente
      .slice(-5)
      .map(m => `[${m.tipo || m.canal || 'msg'}] ${(m.conteudo || m.message || '').substring(0, 200)}`)
      .join('\n');
    parts.push(`HISTORICO RECENTE (ultimas mensagens):\n${hist}`);
  }

  if (memoriaSemantica?.length > 0) {
    const mem = memoriaSemantica
      .slice(0, 8)
      .map(m => `- [${m.tipo}] ${m.conteudo}`)
      .join('\n');
    parts.push(`MEMORIA SEMANTICA:\n${mem}`);
  }

  if (roteiroCondensado) {
    parts.push(`ROTEIRO (resumo condensado — jogador NAO deve saber disso):\n${String(roteiroCondensado).substring(0, 800)}`);
  }

  if (npcsPresentes?.length > 0) {
    const npcs = npcsPresentes
      .slice(0, 10)
      .map(n => `- ${n.nome || n.name || n}: ${n.papel || n.role || 'sem papel definido'}`)
      .join('\n');
    parts.push(`NPCS PRESENTES:\n${npcs}`);
  }

  return parts.join('\n\n');
}
