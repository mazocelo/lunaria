# Spec: Fase 2 — Intent Resolver com Fallback LLM

**Data:** 2026-03-19
**Status:** Aprovado
**Versão:** 1.1
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
    → retornou intent? → usa
    → ambíguo (múltiplos candidatos)? → Flash Lite desambigua
    ↓ null (sem match)
[Camada 2] Flash Lite classifica (~200ms, novo)
    → JSON válido + ação existe? → usa
    ↓ null / timeout (3s, fail-open)
[Camada 3] Mestre IA narra + sugere intent (estendido)
    → intentSugerido no response? → engine converte em ação
    ↓ não
Turno narrativo puro (sem mecânica — ação criativa sem consequência mecânica)
```

**Nota sobre confidence:** O `resolveCombatIntent` atual retorna intent com confidence 0.82+ ou null. Não existe gradiente — Camada 2 dispara quando Camada 1 retorna `intent === null` ou `ambiguous === true`.

## 3. Mudanças na Interface

### prepararTurno — novo overload async

```js
// Phase 1 (mantido para compatibilidade — path síncrono):
prepararTurno(sessao, userId, intent)  // intent já resolvido, retorna sync

// Phase 2 (novo — path async quando tem mensagem):
await prepararTurno(sessao, userId, {
  mensagem: "vou usar aquele poder sagrado no demônio",
  explicitIntent: null  // opcional, se caller já tem intent
})
```

Quando recebe `mensagem` em vez de `tipo`, internamente:
1. Tenta Camada 1 (regex — `resolveCombatIntent` existente)
2. Se null ou ambíguo → tenta Camada 2 (Flash Lite — `intentClassifier`)
3. Se Camada 2 falha → retorna `{ requerIntentMestre: true }` para Camada 3

**`prepararTurno` vira async** — os 2 call sites de produção (`masterNarrationEngine.js`, `respostaDispatcher.js`) já são async.

**Cascata async:** `ensureCombatPreResolution` em `respostaDispatcher.js` deve virar `async function` e seu caller (`processarAcaoCombateHandler`) deve usar `await`.

### Detecção de overload

```js
export async function prepararTurno(sessao, userId, intentOrMessage) {
  const combate = sessao?.estadoJogo?.combate;
  if (!combate?.ativo) return null;

  // Se já tem tipo resolvido, usa direto (Phase 1 compat — sync path)
  if (intentOrMessage?.tipo) {
    return _prepararMecanica(sessao, userId, intentOrMessage);
  }

  // Se tem mensagem, resolve intent primeiro (async path)
  const mensagem = intentOrMessage?.mensagem;
  if (!mensagem) return null;

  const intent = await _resolveIntentPipeline(
    sessao, userId, mensagem, intentOrMessage?.explicitIntent
  );
  if (!intent) {
    return { requerIntentMestre: true, mensagem };
  }

  return _prepararMecanica(sessao, userId, intent);
}

// Extração do código síncrono atual de prepararTurno
function _prepararMecanica(sessao, userId, intent) {
  const combate = sessao?.estadoJogo?.combate;
  const personagem = _resolvePersonagem(sessao, userId);
  if (!personagem) return null;
  return resolverMecanicaCombate(combate, userId, sessao, personagem, intent);
}
```

**Nota:** `_prepararMecanica` é extraído do corpo atual de `prepararTurno` (Phase 1). Não é rename — é refactor do corpo existente para função interna.

## 4. Camada 1: Regex (sem mudança no módulo)

`resolveCombatIntent()` de `combatIntentResolver.js` passa a ser chamado internamente pelo gameEngine via `_resolveIntentPipeline`.

**Tratamento de ambiguidade:** Quando `resolveCombatIntent` retorna `{ ambiguous: true, candidates: [...] }`, a pipeline envia os candidatos para Flash Lite que escolhe o mais provável. Se Flash Lite falha, retorna erro ao jogador com a lista de candidatos (comportamento atual preservado).

**O que muda nos call sites:**
- `masterNarrationEngine.js` não chama mais `resolveCombatIntent` diretamente
- `respostaDispatcher.js` não chama mais `resolveCombatIntent` diretamente
- Ambos passam `{ mensagem, explicitIntent }` para `prepararTurno`

## 5. Camada 2: Flash Lite Classifier

### Novo módulo: `helpers/intentClassifier.js`

```js
export async function classificarIntent(mensagem, personagem, combate, options)
```

**Input:**
- `mensagem` — texto do jogador normalizado
- `personagem` — personagemCompleto (para lista de habilidades/magias)
- `combate` — estado de combate (para lista de monstros vivos)
- `options.candidates` — lista de candidatos ambíguos (da Camada 1, opcional)

**Output:**
```js
{
  intent: { tipo, habilidadeId?, magiaId?, alvoId? } | null,
  source: 'flash_lite',
  raw: string  // resposta bruta do LLM para debug
}
```

### Prompt (~200 tokens input)

Construído via template literals (consistente com o restante do codebase):

```
Classifique a ação de combate do jogador.

Habilidades disponíveis:
- Luz Divina (id: luz_divina, magia)
- Investida (id: investida, habilidade)

Monstros vivos:
- Dretch (id: dretch_0)

Tipos válidos: atacar, defender, fugir, usar_habilidade, conjurar_magia

Ação do jogador: "vou usar aquele poder sagrado no demônio"

Responda APENAS JSON, sem markdown:
{"tipo":"...","id":"...","alvo":"..."}
```

### Modelo

- `gemini-2.5-flash-lite` via `ChatGoogleGenerativeAI` direto (sem chain LangChain — one-shot simples)
- Temperature: 0.0 (determinístico)
- MaxTokens: 100
- Timeout: 3000ms (custom, não o default do modelo de 15s — classificação deve ser rápida)

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

**Exclusividade mútua:** Quando `intentSugerido` está presente, `solicitaDados.solicita` deve ser `false`. A engine trata `intentSugerido` como fonte de teste — não `solicitaDados`.

### Fluxo requerIntentMestre no masterNarrationEngine

Quando `prepararTurno` retorna `{ requerIntentMestre: true }`:

1. **`resultadosCombatePreResolvido` fica null** — nenhuma mecânica pré-resolvida
2. **`acaoComContexto`** recebe apenas o contexto de combate (HP, monstros, status) sem resultado mecânico — usa `formatarContexto(sessao, userId, null, { turnStateText })` que retorna `promptText: ''`, mais o combate state do `turnStateText`
3. **`_combatePreResolvido` NÃO é setado** — dispatcher sabe que mecânica não foi resolvida
4. **Mestre narra** sem saber resultado mecânico — narra a tentativa, não o resultado
5. **Após narração**, `despacharResposta` roda handlers — `intent_sugerido` handler processa

**Timing:** A IA narra ANTES da mecânica ser resolvida. Isso é intencional — para ações criativas, a IA descreve a tentativa ("você empurra o barril com toda força...") e depois a engine resolve o teste. O jogador rola dado e o resultado mecânico é narrado num segundo momento.

### processarIntentSugerido (novo handler)

```js
async function processarIntentSugerido(resposta, ctx) {
  const sugerido = resposta.intentSugerido;

  if (sugerido.tipo === 'teste') {
    // Cria teste pendente via pipeline existente
    const testeCriado = criarTestePendente(ctx.sessao, {
      origem: 'combate',
      jogadorAlvo: ctx.userId,
      personagemAlvo: ctx.personagem?.nome,
      teste: sugerido.teste,          // "Força", "Agilidade", etc
      dificuldade: obterDC(sugerido.dificuldade), // "Difícil" → 15
      tipoDado: 'd20',
      contexto: sugerido.justificativa,
      metadata: { source: 'intentSugerido' }
    }, ctx.userId);

    emitirSolicitacaoTeste(ctx.sm, ctx.roomId, ctx.sessao, {
      narrativa: resposta.narracao,
      tipoDado: 'd20',
      teste: sugerido.teste,
      dificuldade: sugerido.dificuldade,
      contexto: sugerido.justificativa,
      testePendente: testeCriado
    });
  } else if (sugerido.tipo === 'atacar') {
    // Resolve ataque básico via gameEngine
    const resultado = _prepararMecanica(ctx.sessao, ctx.userId, { tipo: 'atacar' });
    if (resultado && !resultado.requerTeste) {
      ctx.sessao._combatePreResolvido = resultado;
    }
    // Se requerTeste, cria pending test/action (mesmo flow do masterNarrationEngine)
  }
}
```

### Quando NÃO usar intentSugerido

- Jogador diz "ataco" → Camada 1 resolve
- Jogador diz "Luz Divina" → Camada 1 resolve
- Jogador diz "uso meu poder de luz" → Camada 2 resolve
- Jogador diz "empurro o barril" → Camada 3 (Mestre sugere teste)

### Fallback quando Mestre não inclui intentSugerido

Se Camada 3 é ativada mas o Mestre não inclui `intentSugerido`:
- O turno é **narrativo puro** — sem consequência mecânica
- Não faz fallback para "atacar" — a ação criativa do jogador é narrada sem mecânica
- Isso evita o problema de "jogador diz algo criativo e o engine faz ataque básico"
- O jogador pode agir novamente no próximo turno com ação mecânica

## 7. Fluxo nos Call Sites

### masterNarrationEngine.js

```
Antes:
  combatIntentResolution = resolveCombatIntent({...})
  if (!combatIntentResolution.intent) { erro ao jogador }
  resultados = prepararTurno(sessao, userId, intent)
  // ... monta contexto, chama IA

Depois:
  resultados = await prepararTurno(sessao, userId, { mensagem, explicitIntent })
  if (resultados?.requerIntentMestre) {
    // Monta contexto sem resultado mecânico
    // Chama IA normalmente — IA narra tentativa
    // Após narração, despacharResposta verifica intentSugerido
  } else {
    // Flow normal Phase 1 — mecânica pré-resolvida
  }
```

**Mudança importante:** O bloco de erro "não ficou claro se quer atacar/defender/fugir" é REMOVIDO. Em vez de erro, a pipeline tenta Flash Lite e depois Mestre.

### respostaDispatcher.js

```
Antes:
  ensureCombatPreResolution (sync): resolveCombatIntent → prepararTurno

Depois:
  ensureCombatPreResolution (async): await prepararTurno(sessao, userId, { mensagem })
  // Se retornou requerIntentMestre, pula pre-resolução
  // Handler intent_sugerido no RESPONSE_HANDLERS trata pós-narração
```

**Cascata async:** `ensureCombatPreResolution` → `async function`, caller `processarAcaoCombateHandler` já é async e já faz `await`.

### Tratamento de intentSugerido no despacho

Novo handler em RESPONSE_HANDLERS (entre `acao_combate` e `solicita_dados`):

```js
{
  nome: 'intent_sugerido',
  check: (r, ctx) => isCombatActive(ctx)
    && r.intentSugerido
    && !ctx.sessao._combatePreResolvido
    && !r.solicitaDados?.solicita,  // exclusividade mútua
  process: processarIntentSugerido
}
```

## 8. Observabilidade

Logging em cada camada para tuning pós-deploy:

```js
log.info({ camada: 1, resolvido: true, tipo: intent.tipo, confidence }, 'intent resolved by regex');
log.info({ camada: 2, resolvido: true, tipo: intent.tipo, latencyMs }, 'intent resolved by flash_lite');
log.info({ camada: 3, intentSugerido: !!r.intentSugerido }, 'intent delegated to mestre');
log.info({ camada: 'fallback', narrativoPuro: true }, 'no intent resolved, narrative-only turn');
```

## 9. Módulos

| Módulo | Tipo | Responsabilidade |
|--------|------|-----------------|
| `helpers/gameEngine.js` | Modificar | `prepararTurno` async + `_resolveIntentPipeline` + `_prepararMecanica` |
| `helpers/intentClassifier.js` | Criar | Flash Lite intent classification |
| `websocket/utils/combatIntentResolver.js` | Sem mudança | Continua como Camada 1 |
| `websocket/engines/masterNarrationEngine.js` | Modificar | Passa `{ mensagem }`, trata `requerIntentMestre` |
| `websocket/utils/respostaDispatcher.js` | Modificar | `ensureCombatPreResolution` async + handler `intent_sugerido` |
| `agents/Mestre/prompts/sistema.js` | Modificar | Adicionar campo `intentSugerido` ao schema |
| `tests/intentClassifier.test.js` | Criar | Testes unitários do classificador |
| `tests/gameEngine.test.js` | Modificar | Testes de pipeline async + Phase 1 compat |

## 10. Testes

### intentClassifier.test.js
- Parse JSON válido → retorna intent
- Parse JSON inválido → retorna null
- habilidadeId não existe → retorna null
- alvo morto → usa primeiro vivo
- Timeout → retorna null (fail-open)
- Candidatos ambíguos → desambigua

### gameEngine.test.js (adicionar)
- Camada 1 resolve → não chama Flash Lite
- Camada 1 ambíguo → chama Flash Lite com candidatos
- Camada 1 null → chama Flash Lite
- Flash Lite resolve → retorna mecânica
- Flash Lite falha → retorna `requerIntentMestre`
- Intent já resolvido com `tipo` (Phase 1 compat) → funciona igual (sync)
- Testes existentes migrados para async/await

### Testes de integração
- intentSugerido tipo "teste" → cria teste pendente
- intentSugerido tipo "atacar" → resolve ataque
- Sem intentSugerido → turno narrativo puro (sem mecânica)

## 11. Riscos

| Risco | Mitigação |
|-------|----------|
| Flash Lite retorna JSON malformado | Parse + validação rigorosa, fallback pra Camada 3 |
| Flash Lite hallucina habilidadeId | Validação contra lista real do personagem |
| Latência Flash Lite > 3s | Timeout 3s fail-open (não o default 15s do modelo) |
| Mestre não inclui intentSugerido | Turno narrativo puro — jogador age de novo no próximo |
| prepararTurno async quebra call sites | 2 call sites (masterNarration + dispatcher) já são async |
| ensureCombatPreResolution sync→async | Cascade documentada, caller já é async |
| IA narra ANTES da mecânica (Camada 3) | Intencional — narra tentativa, mecânica resolve depois |
| intentSugerido conflita com solicitaDados | Exclusividade mútua no check do handler |
| Custo escala | ~R$0.002/sessão, desprezível |
