# Spec: Fase 2 — Intent Resolver com Fallback LLM

**Data:** 2026-03-19
**Status:** Aprovado
**Versão:** 1.0
**Spec pai:** `docs/superpowers/specs/2026-03-19-game-engine-redesign.md` (seção 5)

---

## 1. Objetivo

Mover resolução de intent para dentro do `gameEngine` e adicionar 2 camadas de fallback:
- **Camada 2:** Flash Lite classifica quando regex falha
- **Camada 3:** Mestre IA sugere intent para ações criativas

## 2. Arquitetura: 3 Camadas

```
Texto do jogador
    ↓
[Camada 1] Regex + Name Match (<5ms, existente)
    → confidence ≥ 0.8? → usa
    ↓ não
[Camada 2] Flash Lite classifica (~200ms, novo)
    → JSON válido + ação existe? → usa
    ↓ não / timeout
[Camada 3] Mestre IA narra + sugere intent (estendido)
    → intentSugerido no response? → engine converte em ação
    ↓ não
Fallback final: { tipo: "atacar", alvo: primeiro_monstro_vivo }
```

## 3. Mudanças na Interface

### prepararTurno — novo overload async

```js
// Phase 1 (mantido para compatibilidade):
prepararTurno(sessao, userId, intent)  // intent já resolvido

// Phase 2 (novo):
await prepararTurno(sessao, userId, {
  mensagem: "vou usar aquele poder sagrado no demônio",
  explicitIntent: null  // opcional, se caller já tem intent
})
```

Quando recebe `mensagem` em vez de `tipo`, internamente:
1. Tenta Camada 1 (regex — `resolveCombatIntent` existente)
2. Se confidence < 0.8 ou null → tenta Camada 2 (Flash Lite — `intentClassifier`)
3. Se Camada 2 falha → retorna `{ requerIntentMestre: true }` para Camada 3

**`prepararTurno` vira async** — os 3 call sites já usam contexto async.

### Detecção de overload

```js
export async function prepararTurno(sessao, userId, intentOrMessage) {
  // Se já tem tipo resolvido, usa direto (Phase 1 compat)
  if (intentOrMessage?.tipo) {
    return _resolverMecanica(sessao, userId, intentOrMessage);
  }

  // Se tem mensagem, resolve intent primeiro
  const mensagem = intentOrMessage?.mensagem;
  if (!mensagem) return null;

  const intent = await _resolveIntentPipeline(sessao, userId, mensagem, intentOrMessage?.explicitIntent);
  if (!intent) {
    return { requerIntentMestre: true, mensagem };
  }

  return _resolverMecanica(sessao, userId, intent);
}
```

## 4. Camada 1: Regex (sem mudança)

`resolveCombatIntent()` de `combatIntentResolver.js` move para ser chamado internamente pelo gameEngine.

**O que muda nos call sites:**
- `masterNarrationEngine.js` não chama mais `resolveCombatIntent` diretamente
- `respostaDispatcher.js` não chama mais `resolveCombatIntent` diretamente
- Ambos passam `{ mensagem, explicitIntent }` para `prepararTurno`

## 5. Camada 2: Flash Lite Classifier

### Novo módulo: `helpers/intentClassifier.js`

```js
export async function classificarIntent(mensagem, personagem, combate)
```

**Input:**
- `mensagem` — texto do jogador normalizado
- `personagem` — personagemCompleto (para lista de habilidades/magias)
- `combate` — estado de combate (para lista de monstros vivos)

**Output:**
```js
{
  intent: { tipo, habilidadeId?, magiaId?, alvoId? } | null,
  source: 'flash_lite',
  confidence: 0.9,
  raw: '{"tipo":"conjurar_magia","id":"luz_divina","alvo":"dretch_0"}'
}
```

### Prompt (~200 tokens input)

```
Classifique a ação de combate do jogador.

Habilidades disponíveis:
{{#each habilidades}}
- {{nome}} (id: {{id}}, {{tipo}})
{{/each}}

Monstros vivos:
{{#each monstrosVivos}}
- {{nome}} (id: {{id}})
{{/each}}

Tipos válidos: atacar, defender, fugir, usar_habilidade, conjurar_magia

Ação do jogador: "{{mensagem}}"

Responda APENAS JSON, sem markdown:
{"tipo":"...","id":"...","alvo":"..."}
```

### Modelo

- `gemini-2.5-flash-lite` via LangChain (já configurado em `agents/Mestre/config.js`)
- Temperature: 0.0 (determinístico)
- MaxTokens: 100
- Timeout: 3000ms

### Validação do retorno

1. Parse JSON (se falha → retorna null)
2. `tipo` deve ser um dos 5 tipos válidos
3. Se `tipo` é `usar_habilidade` ou `conjurar_magia`:
   - `id` deve existir na lista de habilidades/magias do personagem
   - Se `id` não existe → tenta match fuzzy por nome
   - Se match fuzzy falha → retorna null
4. Se `alvo` informado:
   - Deve existir na lista de monstros vivos
   - Se não existe → usa primeiro monstro vivo
5. Se validação falha completamente → retorna null (cai pra Camada 3)

### Custo

- Input: ~200 tokens × $0.10/M = $0.00002
- Output: ~30 tokens × $0.40/M = $0.000012
- Por chamada: ~R$0.0002
- Por sessão (~10 fallbacks): ~R$0.002
- Desprezível.

## 6. Camada 3: Mestre sugere intentSugerido

### Mudança no prompt do Mestre

Adicionar ao schema de resposta em `agents/Mestre/prompts/sistema.js`:

```json
"intentSugerido": {
  "tipo": "teste",
  "teste": "Força",
  "dificuldade": "Difícil",
  "justificativa": "empurrar barril pesado exige força bruta"
}
```

**Campo opcional.** O Mestre só inclui quando:
- A ação do jogador é criativa/incomum (não é ataque/defesa/fuga direto)
- A ação tem consequência mecânica que pode ser resolvida como teste
- Exemplo: "empurro o barril de pólvora" → teste de Força, DC Difícil

### Processamento pelo engine

Quando `prepararTurno` retorna `{ requerIntentMestre: true }`:
1. Mestre IA narra normalmente
2. Se resposta contém `intentSugerido`:
   - `tipo: "teste"` → cria teste via `mapearTesteParaAtributo()` + `obterDC()`
   - `tipo: "atacar"` → ataque básico
   - `tipo: "usar_habilidade"` → busca habilidade por nome
3. Se resposta NÃO contém `intentSugerido`:
   - Fallback final: `{ tipo: "atacar", alvo: primeiro_monstro_vivo }`

### Quando NÃO usar intentSugerido

- Jogador diz "ataco" → Camada 1 resolve
- Jogador diz "Luz Divina" → Camada 1 resolve
- Jogador diz "uso meu poder de luz" → Camada 2 resolve
- Jogador diz "empurro o barril" → Camada 3 (Mestre sugere teste)

## 7. Fluxo nos Call Sites

### masterNarrationEngine.js

```
Antes:
  combatIntentResolution = resolveCombatIntent({...})
  if (!combatIntentResolution.intent) { erro }
  resultados = prepararTurno(sessao, userId, intent)

Depois:
  resultados = await prepararTurno(sessao, userId, { mensagem, explicitIntent })
  if (resultados?.requerIntentMestre) {
    // Não resolve mecânica ainda — deixa Mestre narrar
    // Após narração, verifica intentSugerido na resposta
    // Se existe, resolve mecânica com intent sugerido
  }
```

### respostaDispatcher.js

```
Antes:
  ensureCombatPreResolution: resolveCombatIntent → resolverMecanicaCombate

Depois:
  ensureCombatPreResolution: await prepararTurno(sessao, userId, { mensagem })
  // Se retornou requerIntentMestre, verifica intentSugerido na resposta da IA
```

### Tratamento de intentSugerido no despacho

Novo handler em RESPONSE_HANDLERS (entre `acao_combate` e `solicita_dados`):

```js
{
  nome: 'intent_sugerido',
  check: (r, ctx) => isCombatActive(ctx)
    && r.intentSugerido
    && !ctx.sessao._combatePreResolvido,
  process: processarIntentSugerido
}
```

## 8. Módulos

| Módulo | Tipo | Responsabilidade |
|--------|------|-----------------|
| `helpers/gameEngine.js` | Modificar | `prepararTurno` async + pipeline interno |
| `helpers/intentClassifier.js` | Criar | Flash Lite intent classification |
| `websocket/utils/combatIntentResolver.js` | Sem mudança | Continua como Camada 1 |
| `websocket/engines/masterNarrationEngine.js` | Modificar | Passa mensagem em vez de intent |
| `websocket/utils/respostaDispatcher.js` | Modificar | Handler intentSugerido |
| `agents/Mestre/prompts/sistema.js` | Modificar | Adicionar campo intentSugerido |
| `tests/intentClassifier.test.js` | Criar | Testes unitários |
| `tests/gameEngine.test.js` | Modificar | Testes de pipeline |

## 9. Testes

### intentClassifier.test.js
- Parse JSON válido → retorna intent
- Parse JSON inválido → retorna null
- habilidadeId não existe → retorna null
- alvo morto → usa primeiro vivo
- Timeout → retorna null (fail-open)

### gameEngine.test.js (adicionar)
- Camada 1 resolve → não chama Flash Lite
- Camada 1 falha → chama Flash Lite
- Flash Lite resolve → retorna mecânica
- Flash Lite falha → retorna `requerIntentMestre`
- Intent já resolvido (Phase 1 compat) → funciona igual

### Testes de integração
- intentSugerido tipo "teste" → cria teste pendente
- intentSugerido tipo "atacar" → resolve ataque
- Sem intentSugerido → fallback atacar

## 10. Riscos

| Risco | Mitigação |
|-------|----------|
| Flash Lite retorna JSON malformado | Parse + validação rigorosa, fallback pra Camada 3 |
| Flash Lite hallucina habilidadeId | Validação contra lista real do personagem |
| Latência Flash Lite > 3s | Timeout fail-open, cai pra Camada 3 |
| Mestre não inclui intentSugerido | Fallback final: atacar primeiro monstro |
| prepararTurno async quebra call sites | Todos já são async (await em outras funções) |
| Custo escala | ~R$0.002/sessão, desprezível |
