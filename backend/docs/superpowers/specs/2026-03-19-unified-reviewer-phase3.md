# Spec: Fase 3 — Revisor Único

**Data:** 2026-03-19
**Status:** Aprovado
**Versão:** 1.0
**Spec pai:** `docs/superpowers/specs/2026-03-19-game-engine-redesign.md` (seção 8)

---

## 1. Objetivo

Substituir os 3 revisores separados (ArbitroMecanico, Continuista, GanchoNarrativo) por um único revisor Flash que avalia 3 critérios numa chamada. Rodar após toda narração do Mestre. Eliminar triggerLogic e narrativeHookGuard baseados em regex.

## 2. Arquitetura

```
Mestre IA narra
    ↓
É mensagem de sistema ou dado puro? → skip
    ↓ não
Revisor Único (1 chamada Flash)
    ├─ MECÂNICA: narrativa bate com resultado mecânico?
    ├─ CONTINUIDADE: coerente com histórico?
    └─ GANCHO: termina com algo jogável?
    ↓
Se aprovado → narrativa original passa
Se reprovado → narrativa corrigida substitui
```

## 3. Módulo: `agents/Revisores/unifiedReviewer.js`

### Interface

```js
export async function revisarNarrativa({
  narrativa,
  resultadoMecanico,    // CombatRoundResult ou null (fora de combate)
  personagemSnapshot,   // { nome, hp, mana, status, habilidades }
  historicoRecente,     // últimas 5 mensagens
  npcsPresentes,        // array de NPCs na cena
  memoriaSemantica,     // primeiros 8 entries
  acaoJogador,          // texto original do jogador
  combateAtivo,         // boolean
  userId
})
```

### Output

```js
{
  aprovado: boolean,
  mecanica: { ok: boolean, problema: string | null },
  continuidade: { ok: boolean, problema: string | null },
  gancho: { ok: boolean, problema: string | null },
  correcao: string | null,  // narrativa corrigida inteira (ou null se aprovado)
  latencyMs: number
}
```

### Prompt

```
Avalie a narrativa do Mestre de RPG contra 3 critérios:

MECÂNICA: A narrativa respeita o resultado mecânico fornecido?
- Dano narrado proporcional ao dano real
- Acerto narrado = acerto mecânico
- HP do alvo coerente com o estado
- Efeitos/status narrados existem no resultado
(Se não há resultado mecânico, ignorar este critério e marcar ok: true)

CONTINUIDADE: Coerente com o histórico da sessão?
- NPCs mantêm identidade e comportamento
- Cena não muda sem motivo
- Fatos não contraditos
- Não antecipa informações que o jogador não sabe

GANCHO: Termina com algo jogável?
- Oferece próximo passo concreto (objeto, escolha, NPC, perigo)
- Evita ganchos vagos ("o que faremos?", "a aventura continua")
- Se turno continua → deixa ação concreta disponível
- Se turno encerra (combate finalizado, teste resolvido) → fecha limpo, ok

Retorne APENAS JSON:
{
  "aprovado": true,
  "mecanica": { "ok": true, "problema": null },
  "continuidade": { "ok": true, "problema": null },
  "gancho": { "ok": true, "problema": null },
  "correcao": null
}

Se algum critério falha:
- "aprovado": false
- No critério que falhou: "ok": false, "problema": "descrição curta"
- "correcao": narrativa inteira corrigida (copie o original e altere APENAS o trecho problemático)
```

### Input contextual (seções opcionais no prompt)

```
[NARRATIVA DO MESTRE]
{narrativa}

[AÇÃO DO JOGADOR]
{acaoJogador}

[RESULTADO MECÂNICO]              ← só se resultadoMecanico != null
{formatarResultadoMecanico(resultadoMecanico, personagemSnapshot.nome)}

[PERSONAGEM]                      ← só se personagemSnapshot != null
{nome} — HP: {hp}/{hpMax}, Mana: {mana}/{manaMax}

[HISTÓRICO RECENTE]               ← últimas 5 mensagens (sempre)
{mensagens formatadas}

[NPCs PRESENTES]                  ← só se npcsPresentes.length > 0
{lista de NPCs com papel}

[MEMÓRIA SEMÂNTICA]               ← só se memoriaSemantica.length > 0
{primeiros 8 entries}
```

### Modelo

- `gemini-2.5-flash` (não Lite — modelo melhor, custo ainda baixo)
- Temperature: 0.1
- MaxTokens: 2000 (precisa caber narrativa corrigida inteira)
- Timeout: 8000ms, fail-open

### Quando roda

- Após **toda narração do Mestre** (player action response, turn start, etc.)

### Quando NÃO roda

- Mensagens de sistema (XP, cenário mudou, level up)
- Rolagens de dado puras (resultado de teste sem narração)
- Feature flag `REVIEWER_ENABLED=false`

### Fail-open

- Timeout 8s → retorna `{ aprovado: true }` (narrativa passa)
- JSON parse falha → retorna `{ aprovado: true }`
- Erro de rede → retorna `{ aprovado: true }`
- Nunca bloqueia o fluxo do jogo

## 4. Integração

### executarRevisao (API pública preservada)

`agents/Revisores/index.js` continua exportando `executarRevisao(ctx)` com a mesma interface. Internamente troca de orchestrator para `unifiedReviewer`.

```js
// Antes:
// triggerLogic → orchestrator → 3 reviewers em paralelo → aplicarCorrecoes

// Depois:
// skip check simples → unifiedReviewer.revisarNarrativa → aplicar correcao
```

### masterNarrationEngine.js

Call sites (~linhas 562 e 1148) **não mudam**. `executarRevisao` continua recebendo o mesmo contexto e retornando o mesmo shape:

```js
{
  reviewed: boolean,
  passed: boolean,
  verdicts: array | null,
  corrections: { narrativa } | null
}
```

A conversão interna (unified → legacy shape) fica dentro de `executarRevisao`.

### Skip logic

Dentro de `executarRevisao`, substituir `shouldTriggerReview` complexo por:

```js
function shouldSkipReview(ctx) {
  if (!REVIEWER_CONFIG.enabled) return true;
  // Mensagem de sistema ou dado puro → skip
  const resposta = ctx.respostaIA;
  if (!resposta?.narracao?.trim()) return true;
  return false;
}
```

## 5. O que depreca

| Arquivo | Status |
|---------|--------|
| `agents/Revisores/ArbitroMecanico.js` | Deprecated — não deletar ainda, manter como referência |
| `agents/Revisores/Continuista.js` | Deprecated |
| `agents/Revisores/GanchoNarrativo.js` | Deprecated |
| `agents/Revisores/reviewOrchestrator.js` | Deprecated — substituído por unifiedReviewer |
| `agents/Revisores/triggerLogic.js` | Deprecated — substituído por skip simples |
| `agents/Revisores/prompts/arbitroPrompt.js` | Deprecated |
| `agents/Revisores/prompts/continuistaPrompt.js` | Deprecated |
| `agents/Revisores/prompts/ganchoPrompt.js` | Deprecated |
| `helpers/narrativeHookGuard.js` | Deprecated |

**Nota:** Arquivos deprecated não são deletados nesta fase — são mantidos como referência. Podem ser removidos numa limpeza futura.

## 6. Config atualizada

```js
export const REVIEWER_CONFIG = {
  enabled: process.env.REVIEWER_ENABLED !== 'false',
  model: {
    name: process.env.REVIEWER_MODEL || 'gemini-2.5-flash',  // Flash, não Lite
    temperature: 0.1,
    maxTokens: 2000,
    timeout: 8000,  // 8s
  },
  failOpen: true,
};
```

## 7. Custo

| | Antes (3× Flash Lite) | Depois (1× Flash) |
|---|---|---|
| Chamadas/mensagem | 1-3 (condicional) | 1 (sempre) |
| Modelo | Flash Lite ($0.10/$0.40) | Flash ($0.15/$0.60) |
| Input médio | ~1500 tokens × 3 | ~1500 tokens × 1 |
| Output médio | ~300 tokens × 3 | ~300 tokens × 1 |
| Custo/mensagem | ~R$0.003 | ~R$0.001 |
| Custo/sessão (135 msgs) | ~R$0.46 | ~R$0.15 |
| **Economia** | — | **-R$0.31/sessão (67% menos)** |

## 8. Testes

### tests/unifiedReviewer.test.js (novo)
- Narrativa aprovada → `{ aprovado: true }` com 3 critérios ok
- Mecânica falha (dano narrado != real) → `{ aprovado: false, mecanica.ok: false }`
- Continuidade falha (NPC inconsistente) → `{ aprovado: false, continuidade.ok: false }`
- Gancho fraco → `{ aprovado: false, gancho.ok: false, correcao: "..." }`
- Sem resultado mecânico → mecânica.ok: true automaticamente
- JSON inválido do LLM → fail-open `{ aprovado: true }`
- Timeout → fail-open `{ aprovado: true }`
- Narrativa vazia → skip, não chama LLM

### tests/reviewPipeline.test.js (atualizar)
- `executarRevisao` retorna shape compatível
- Skip em mensagem de sistema
- Skip quando REVIEWER_ENABLED=false

## 9. Riscos

| Risco | Mitigação |
|-------|----------|
| Flash não cobre edge cases que 3 especialistas cobriam | Prompt mais rico, modelo melhor (Flash vs Lite) |
| Narrativa corrigida perde qualidade | Instrução: alterar APENAS trecho problemático |
| Custo sobe se Flash fica mais caro | Pode trocar para Flash Lite se necessário (config) |
| Timeout 8s adiciona latência perceptível | Fail-open — jogador nunca espera mais que 8s |
| Revisores antigos tinham lógica específica | Prompt unificado absorve as regras relevantes |
