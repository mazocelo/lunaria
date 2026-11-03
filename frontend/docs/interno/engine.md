# Game Engine

Documentação técnica da facade `gameEngine.js` e do pipeline de intent resolution.

---

## Visão Geral

O `gameEngine` é uma facade sobre a mecânica de combate. Centraliza toda a resolução mecânica para uma rodada de combate. **Não** chama IA, não emite eventos WebSocket e não persiste no Redis — essas responsabilidades pertencem às camadas acima (`masterNarrationEngine`, `combatEngine`).

---

## API Principal

### `prepararTurno(sessao, userId, intentOrMessage)`

Prepara a mecânica de uma ação do jogador **antes** da IA narrar.

- Aceita `{ tipo, ... }` (intent já resolvido) ou `{ mensagem, explicitIntent?, _skipFlashLite? }`.
- Executa o pipeline de intent resolution (3 camadas) se receber mensagem de texto.
- Retorna `CombatRoundResult` com o resultado mecânico, ou `{ requerIntentMestre: true }` se o intent precisar ser decidido pelo Mestre IA.

### `resolverTurno(sessao, acaoPendente, resultadoTeste)`

Resolve a mecânica de combate **depois** que o jogador rola os dados.

- Chamado quando um teste pendente (`acaoPendenteCombate`) é concluído.
- Delega para `finalizarAcaoCombatePosTeste` em `combateHelper.js`.
- Retorna `CombatRoundResult` atualizado com o resultado final.

### `formatarContexto(sessao, userId, resultado, options)`

Constrói o contexto de prompt para a IA narrar o resultado.

- Recebe o `CombatRoundResult` e monta o texto mecânico (`mechanicalSummary`) e o bloco de contexto para o prompt (`promptText`).
- Delega para `buildCombatPromptContext` em `combatPromptContext.js`.

---

## Pipeline de Intent Resolution

Quando o jogador envia texto livre em combate, o engine executa três camadas em sequência até obter um intent resolvido:

```
Mensagem do Jogador
       │
       ▼
┌──────────────────────────────────────────────────────┐
│  Camada 1 — Regex + Name Match (sem custo, < 1ms)    │
│  resolveCombatIntent()  em  websocket/utils/          │
│  Detecta padrões: "ataco", "defendo", "fujo",        │
│  nomes de habilidades/magias por regex ou match       │
│  → se não ambíguo: retorna intent imediatamente       │
└──────────────────────────────────────────────────────┘
       │  (ambíguo ou não detectado)
       ▼
┌──────────────────────────────────────────────────────┐
│  Camada 2 — Flash Lite Classifier (LLM barato)       │
│  classificarIntent()  em  helpers/intentClassifier.js│
│  Modelo: gemini-2.5-flash-lite  |  Timeout: 3s       │
│  Prompt com habilidades/magias reais do personagem   │
│  Valida retorno contra lista real de ações            │
│  → se válido: retorna intent com source: 'flash_lite' │
│  → se falha (timeout/erro): fail-open, vai camada 3   │
└──────────────────────────────────────────────────────┘
       │  (não classificado)
       ▼
┌──────────────────────────────────────────────────────┐
│  Camada 3 — Mestre IA (intentSugerido)               │
│  Delega ao Mestre para decidir criativamente         │
│  Retorna { requerIntentMestre: true }                 │
│  O Mestre inclui intentSugerido no JSON de resposta  │
└──────────────────────────────────────────────────────┘
```

**Tipos de intent válidos:** `atacar`, `defender`, `fugir`, `usar_habilidade`, `conjurar_magia`.

---

## Fluxo Completo de um Turno

```
1. Jogador envia mensagem via WebSocket
         │
2. masterNarrationEngine chama prepararTurno(sessao, userId, { mensagem })
         │
3. gameEngine executa pipeline de intent (Camadas 1→2→3)
         │
   ┌─────┴──────────────────────────────────────────┐
   │                                                  │
   │ Intent resolvido (Camada 1 ou 2)                 │
   │         │                                        │
   │ resolverMecanicaCombate() → CombatRoundResult    │
   │         │                                        │
   │   ┌─────┴─────────────────────────────────┐      │
   │   │ requerTeste = true                    │      │
   │   │ (atacar, habilidade, fuga)            │      │
   │   │ → acaoPendenteCombate salva na sessão │      │
   │   │ → frontend exibe dado para rolar      │      │
   │   └─────┬─────────────────────────────────┘      │
   │         │ Jogador rola dado                       │
   │         ▼                                         │
   │   resolverTurno(sessao, acaoPendente, resultado)  │
   │         │                                         │
   │   CombatRoundResult final                         │
   └─────────┬──────────────────────────────────────┘
             │
4. formatarContexto() → promptText + mechanicalSummary
             │
5. Mestre IA narra o resultado (com contexto mecânico injetado)
             │
6. unifiedReviewer valida narrativa (mecânica + continuidade + gancho)
             │
7. Resultado emitido via WebSocket → frontend atualiza estado
```

---

## Unified Reviewer

Executado após cada narrativa do Mestre IA. Usa Gemini Flash Lite em chamada única.

**3 critérios avaliados:**

| Critério | O que valida |
|----------|-------------|
| **Mecânica** | Narrativa coerente com resultado mecânico (dano, acerto, HP, status) |
| **Continuidade** | NPCs mantêm identidade; cena não muda sem motivo; fatos não contraditos |
| **Gancho** | Termina com próximo passo concreto (objeto, escolha, NPC, perigo) |

**Comportamento em falha:**
- `aprovado: false` + campo `correcao` com narrativa corrigida
- Circuit breaker: após 5 falhas consecutivas, desativa por 5 minutos (fail-open)
- Qualquer erro/timeout: fail-open (`aprovado: true`)

**Fonte:** `agents/Revisores/unifiedReviewer.js`
