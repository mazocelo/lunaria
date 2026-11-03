# Mestre IA

Documentação técnica dos tiers do Mestre, geração de roteiro e composição do prompt.

---

## Tiers do Mestre

Cada história tem um tier que determina qual modelo de IA é usado como Mestre. Configurado em `agents/Mestre/config.js`.

| Tier | Modelo | Badge | Preço input/output (por 1M tokens) |
|------|--------|-------|-------------------------------------|
| **pescador** | `gemini-2.5-flash-lite` | Gratis | $0.10 / $0.40 |
| **poeta** | `gemini-2.5-flash` | Basico | $0.30 / $2.50 |
| **bardo** | `gemini-3-flash-preview` | Premium | $0.50 / $3.00 |
| **profeta** | `gemini-3.1-pro-preview` | Top | $2.00 / $12.00 |
| **profetisa** | `claude-sonnet-4-6` | Top | $3.00 / $15.00 |

**Tier padrão:** `poeta` (`gemini-2.5-flash`).

### Timeouts por tier e tipo de operação

| Tier | player_action | turn_start |
|------|---------------|------------|
| pescador / poeta / bardo | 15s | 30s |
| profeta | 30s | 60s |
| profetisa (Claude) | 60s | 120s |

Claude Sonnet usa `.stream()` em vez de `.invoke()` por limitação do SDK Anthropic com timeouts longos.

---

## Geração de Roteiro (Blueprint)

O roteiro é um JSON estruturado com arcos, locais, NPCs, encontros e segredos. Guia o Mestre IA durante toda a sessão.

**Fonte:** `services/blueprintService.js`

### Cadeia de Fallback

```
1. Gemini 3.1 Pro (gemini-3.1-pro-preview)   — modelo primário
         │ falha (timeout / JSON inválido)
         ▼
2. Claude Sonnet 4.6 (claude-sonnet-4-6)     — fallback 1
         │ falha
         ▼
3. Gemini 2.5 Pro                            — fallback 2
```

O loop percorre todos os providers até obter JSON válido. Não aborta na primeira exceção.

### Tamanhos de Roteiro

| Tamanho | maxTokens | Timeout |
|---------|-----------|---------|
| `aventura` (padrão) | 8.000 | 2 min |
| `historia` | 16.000 | 3 min |
| `epico` | 32.000 | 4 min |
| `mito` | 64.000 | 6 min |

### Regeneração

Ao regenerar um roteiro existente, o serviço constrói um bloco `REGENERACAO ALTERNATIVA` que lista títulos, NPCs, locais, encontros e tesouros já usados — para evitar repetição. Preserva apenas o núcleo canônico explicitamente citado na aventura base.

---

## Composição do Prompt do Mestre

O prompt é montado em camadas ordenadas para aproveitar primacy/recency dos LLMs:

```
┌─────────────────────────────────────────────────┐
│  POSIÇÃO 1 — Identidade (topo, primacy)         │
│  - Role: Mestre RPG, idioma PT-BR               │
│  - Personalidade / tom narrativo / regras       │
│    especiais (da história)                      │
│  - Regras invioláveis (5 regras críticas)       │
├─────────────────────────────────────────────────┤
│  POSIÇÃO 2 — Regras de Comportamento            │
│  - Criatividade, coerência, imersão             │
│  - Regras de NPC vs PJ com mesmo nome           │
│  - Schema de segmentos JSON                     │
├─────────────────────────────────────────────────┤
│  POSIÇÃO 3 — Dados do Mundo (meio)              │
│  - Roteiro condensado (arcos, NPCs, segredos)   │
│  - Personagem atual (atributos, equipamentos)   │
│  - Estado do combate (se ativo)                 │
├─────────────────────────────────────────────────┤
│  POSIÇÃO 4 — Histórico da Sessão                │
│  - Últimas N mensagens (padrão: 15)             │
│  - Memória semântica (fatos relevantes)         │
├─────────────────────────────────────────────────┤
│  POSIÇÃO 5 — Contexto Mecânico (base, recency) │
│  - Resultado mecânico pré-resolvido             │
│  - Estado atual de HP/mana/status               │
│  - Instruções de turno (primeira/seguinte/final)│
└─────────────────────────────────────────────────┘
```

**Schema de saída esperado (JSON):**

```json
{
  "segmentos": [
    { "tipo": "narracao", "texto": "..." },
    { "tipo": "fala_npc", "speaker": "npc", "npc_id": "...", "texto": "..." }
  ],
  "fimDeTurno": false,
  "combate": { "iniciar": true, "monstros": [...], "motivo": "..." },
  "acoes": { "aplicar_dano": ..., "curar": ..., "dar_item": ... },
  "intentSugerido": { "tipo": "atacar", "alvoId": "..." }
}
```

---

## Revisores

O `unifiedReviewer` roda após cada narrativa do Mestre. Ver [Game Engine → Unified Reviewer](engine#unified-reviewer) para detalhes completos.

**Modelo usado para revisão:** Gemini Flash Lite (configurado em `agents/Revisores/config.js`).

**Critérios:** Mecânica | Continuidade | Gancho.
