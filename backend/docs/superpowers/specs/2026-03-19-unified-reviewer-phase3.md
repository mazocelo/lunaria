# Spec: Fase 3 — Revisor Único

**Data:** 2026-03-19
**Status:** Aprovado
**Versão:** 1.1
**Spec pai:** `docs/superpowers/specs/2026-03-19-game-engine-redesign.md` (seção 8)

---

## 1. Objetivo

Substituir os 3 revisores separados (ArbitroMecanico, Continuista, GanchoNarrativo) por um único revisor Flash Lite que avalia 3 critérios numa chamada. Rodar após toda narração do Mestre. Eliminar triggerLogic e narrativeHookGuard baseados em regex.

## 2. Arquitetura

```
Mestre IA narra
    ↓
Narrativa vazia ou feature flag off? → skip
    ↓ não
Revisor Único (1 chamada Flash Lite)
    ├─ MECÂNICA: narrativa bate com resultado mecânico?
    ├─ CONTINUIDADE: coerente com histórico?
    └─ GANCHO: termina com algo jogável?
    ↓
Se aprovado → narrativa original passa
Se reprovado com correcao → narrativa corrigida substitui
Se reprovado sem correcao → narrativa passa + log warning
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
  roteiroCondensado,    // resumo do roteiro (para detectar spoilers)
  acaoJogador,          // texto original do jogador
  claimFlags,           // claims detectados pelo claimDetector
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
- Claims já validados (marcados JA VALIDADO) não devem ser questionados
(Se não há resultado mecânico, ignorar este critério e marcar ok: true)

CONTINUIDADE: Coerente com o histórico da sessão?
- NPCs mantêm identidade e comportamento
- Cena não muda sem motivo
- Fatos não contraditos
- Não antecipa informações do roteiro que o jogador não sabe

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

[CLAIMS DETECTADOS]               ← só se claimFlags?.length > 0
Claims JA VALIDADOS (não questionar):
{claims com status 'ok'}
Claims PENDENTES (verificar na narrativa):
{claims com status != 'ok'}

[HISTÓRICO RECENTE]               ← últimas 5 mensagens (sempre)
{mensagens formatadas}

[NPCs PRESENTES]                  ← só se npcsPresentes.length > 0
{lista de NPCs com papel}

[MEMÓRIA SEMÂNTICA]               ← só se memoriaSemantica.length > 0
{primeiros 8 entries}

[ROTEIRO]                         ← só se roteiroCondensado != null
(jogador NÃO deve saber disso — verificar se narrativa antecipa)
{roteiroCondensado}
```

### Modelo

- `gemini-2.5-flash-lite` (barato, suficiente para validação — $0.10/$0.40 por M tokens)
- Temperature: 0.1
- MaxTokens: 2000 (precisa caber narrativa corrigida inteira)
- Timeout: 10000ms (10s), fail-open
- Provider detectado automaticamente do nome do modelo

### Quando roda

- Após **toda narração do Mestre** (player action response, turn start, etc.)
- Volume maior que antes (0-3 condicionais → 1 sempre), mas custo menor por chamada

### Quando NÃO roda

- Narrativa vazia (`!narracao?.trim()`)
- Feature flag `REVIEWER_ENABLED=false`

### Fail-open

- Timeout 10s → retorna `{ aprovado: true }` (narrativa passa)
- JSON parse falha → retorna `{ aprovado: true }`
- Erro de rede → retorna `{ aprovado: true }`
- `aprovado: false` mas `correcao: null` → narrativa passa + log warning
- Nunca bloqueia o fluxo do jogo

### Circuit breaker

Simplificado (1 reviewer em vez de 3):
- Após 5 falhas consecutivas → desabilita por 5 minutos
- Reset no sucesso
- In-memory (reseta no restart)

## 4. Integração

### executarRevisao (API pública preservada)

`agents/Revisores/index.js` continua exportando `executarRevisao(ctx)` com a mesma interface.

### Conversão unified → legacy shape

```js
function unifiedToLegacy(result) {
  if (!result) return { reviewed: false, passed: true, verdicts: null, corrections: null };

  const verdicts = ['mecanica', 'continuidade', 'gancho'].map(key => ({
    reviewer: key,
    veredicto: result[key].ok ? 'ok' : 'problema',
    severidade: result[key].ok ? 'info' : 'error',
    notas: result[key].problema || '',
  }));

  return {
    reviewed: true,
    passed: result.aprovado,
    verdicts,
    corrections: result.correcao ? { narrativa: result.correcao } : null,
  };
}
```

### masterNarrationEngine.js

Call sites **não mudam**. `executarRevisao` recebe e retorna mesma shape.

### Skip logic

```js
function shouldSkipReview(ctx) {
  if (!REVIEWER_CONFIG.enabled) return true;
  if (!ctx.respostaIA?.narracao?.trim()) return true;
  return false;
}
```

### Usage tracking

```js
usageService.track({
  provider,
  tipo: 'reviewer_unificado',
  modelo: REVIEWER_CONFIG.model.name,
  duracaoMs: latencyMs,
  userId
});
```

## 5. O que depreca

| Arquivo | Status |
|---------|--------|
| `agents/Revisores/ArbitroMecanico.js` | Deprecated — não deletar, manter referência |
| `agents/Revisores/Continuista.js` | Deprecated |
| `agents/Revisores/GanchoNarrativo.js` | Deprecated |
| `agents/Revisores/reviewOrchestrator.js` | Deprecated — substituído |
| `agents/Revisores/triggerLogic.js` | Deprecated — substituído por skip simples |
| `agents/Revisores/prompts/arbitroPrompt.js` | Deprecated |
| `agents/Revisores/prompts/continuistaPrompt.js` | Deprecated |
| `agents/Revisores/prompts/ganchoPrompt.js` | Deprecated |
| `helpers/narrativeHookGuard.js` | Deprecated |

## 6. Config atualizada

```js
export const REVIEWER_CONFIG = {
  enabled: process.env.REVIEWER_ENABLED !== 'false',
  model: {
    name: process.env.REVIEWER_MODEL || 'gemini-2.5-flash-lite',
    provider: detectProvider(process.env.REVIEWER_MODEL || 'gemini-2.5-flash-lite'),
    temperature: 0.1,
    maxTokens: 2000,
    timeout: Math.max(5000, parseInt(process.env.REVIEWER_TIMEOUT_MS) || 10000),
  },
  failOpen: true,
  circuitBreaker: {
    maxFailures: 5,
    cooldownMs: 300000,  // 5 min
  },
};
```

## 7. Custo

| | Antes (3× Flash Lite condicional) | Depois (1× Flash Lite sempre) |
|---|---|---|
| Chamadas/mensagem | 0-3 (condicional) | 0-1 (sempre que há narrativa) |
| Modelo | Flash Lite ($0.10/$0.40) | Flash Lite ($0.10/$0.40) |
| Input médio | ~1500 tokens × 0-3 | ~1500 tokens × 1 |
| Output médio | ~300 tokens × 0-3 | ~300 tokens × 1 |
| Custo/mensagem (quando roda) | ~R$0.003 (3 calls) | ~R$0.001 (1 call) |
| Custo/sessão (135 msgs, ~30% tinha review) | ~R$0.12 | ~R$0.13 |
| **Diferença** | — | **~neutro em custo, qualidade superior (3 critérios juntos)** |

**Nota:** Custo por sessão é similar ao atual. O ganho principal é **qualidade** (prompt unificado com contexto completo) e **simplicidade** (1 módulo vs 9 arquivos).

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
- `aprovado: false` com `correcao: null` → pass-through + warning
- Claims JA VALIDADO presentes no prompt

### tests/reviewPipeline.test.js (atualizar)
- `executarRevisao` retorna shape legacy compatível
- Conversão `unifiedToLegacy` mapeia corretamente
- Skip quando narrativa vazia
- Skip quando REVIEWER_ENABLED=false
- Circuit breaker abre após 5 falhas

## 9. Riscos

| Risco | Mitigação |
|-------|----------|
| Flash Lite não cobre edge cases que 3 especialistas cobriam | Prompt unificado com contexto completo de todos os 3 |
| Narrativa corrigida perde qualidade | Instrução: alterar APENAS trecho problemático |
| `aprovado: false` mas `correcao: null` | Pass-through + log warning (nunca bloqueia) |
| Timeout 10s adiciona latência | Fail-open — jogador nunca espera mais que 10s |
| Volume de chamadas aumenta (de condicional para sempre) | Custo por chamada é 1/3, total similar |
| Perda de circuit breaker granular (3→1) | Circuit breaker simplificado, fail-open preserva game flow |
