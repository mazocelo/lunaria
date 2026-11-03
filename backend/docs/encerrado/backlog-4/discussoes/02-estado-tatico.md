# B4-D01 — Arquitetura de Estado Tatico

## Criterio de canonicidade

So vira estado canonico o que:
- Afeta decisao futura (IA ou mecanica)
- Dura mais de um turno
- Precisa sobreviver ao turno atual

---

## Campos canonicos — schema e ciclo de vida

### 1. `terreno` (hibrido — tipo + label + tags)

```jsonc
// estadoJogo.terreno
{
  "tipo": "floresta",           // enum curto para logica mecanica
  "label": "Floresta em chamas", // texto livre para prompt/narrativa
  "tags": ["fogo", "dificil"]   // array de tags para regras condicionais
}
```

- **Escrita**: `alterar_terreno` (B4-F04), `applyMetadadosToSessao` (B4-F03)
- **Leitura**: `buildTurnState` -> `formatTurnStateText` -> prompt
- **Limpeza**: reset a `null` quando `local_atual`/`local` muda (via `localMudou` em `applyMetadadosToSessao`)
- **Migracao v1->v2**: campo atual e string livre. B4-F05 migra para objeto. `buildTurnState` deve aceitar ambos (string ou objeto) durante transicao.

### 2. `efeitos_terreno[]` (separado de terreno)

```jsonc
// estadoJogo.efeitos_terreno
[
  {
    "descricao": "Pocas de lava causam 1d6 de dano de fogo",
    "elemento": "fogo",
    "dano_por_turno": 6,
    "duracao": 5,
    "aplicado_em": 12,       // rodadaAtual quando criado
    "fonte": "alterar_terreno" // rastreabilidade
  }
]
```

- **Escrita**: `alterar_terreno` (quando `efeito` presente)
- **Leitura**: B4-F05 runtime tatico (consumo futuro)
- **Limpeza**: expiram por `duracao` (rodadaAtual - aplicado_em >= duracao). Limpos quando terreno muda.
- **Relacao com terreno**: efeitos sao limpos junto com terreno (mesmo trigger: `localMudou`).
- **v1 atual**: `terrenoEfeito` (objeto singular). B4-F05 migra para array `efeitos_terreno`.

### 3. `boss` / `fase` — dentro de `combate`

```jsonc
// estadoJogo.combate.boss (quando aplicavel)
{
  "nome": "Dragao Anciao",
  "fase_atual": 1,
  "fases": [
    { "fase": 1, "nome": "Forma Integra", "hp_threshold": 0.5, "habilidades": ["sopro_fogo"] },  // 0..1 (50% HP)
    { "fase": 2, "nome": "Furia Draconica", "hp_threshold": 0, "habilidades": ["sopro_fogo", "terremoto"] } // 0 = ultima fase
  ]
}
```

- **Nunca** solto em `estadoJogo` raiz — sempre dentro de `combate`
- **Escrita**: `iniciar_fase_boss` (deferido, futuro)
- **Leitura**: combat engine (futuro)
- **Limpeza**: limpo quando `combate` termina
- **Justificativa**: boss sem combate ativo nao faz sentido mecanico

### 4. `batalha_grande` — subestado proprio

```jsonc
// estadoJogo.batalha_grande (separado de combate)
{
  "ativa": true,
  "nome": "Cerco ao Castelo",
  "frentes": [
    { "id": "portao", "nome": "Portao Principal", "status": "sob_ataque", "progresso": 40 },
    { "id": "muralha", "nome": "Muralha Leste", "status": "segura", "progresso": 80 }
  ],
  "objetivo": "Defender o castelo ate o amanhecer",
  "turno_inicio": 15
}
```

- **Separado** de `combate` — combate individual pode existir dentro de uma frente
- **Escrita**: acao futura `iniciar_batalha_grande` (B4-F05+)
- **Leitura**: state block, prompt, decisoes de IA
- **Limpeza**: explicita via acao `encerrar_batalha_grande` ou narrativa
- **Justificativa**: batalha grande orquestra multiplos combates; nao e um combate em si

### 5. `frentes[]` e `missao_tatica`

```jsonc
// estadoJogo.frentes — NAO EXISTE como campo raiz.
// Frentes vivem EXCLUSIVAMENTE dentro de batalha_grande.frentes (ver 4).

// estadoJogo.missao_tatica — sempre em estadoJogo raiz, nunca dentro de batalha_grande.
// Se houver batalha_grande ativa, missao_tatica e batalha_grande coexistem como irmaos.
{
  "descricao": "Infiltrar o acampamento inimigo",
  "objetivo": "Recuperar o artefato",
  "status": "em_andamento",  // em_andamento | concluida | falhada
  "progresso": 60
}
```

- **Local canonico**: sempre `estadoJogo.missao_tatica` (raiz). Nunca dentro de `batalha_grande`.
- **Minimos v1**: sem sub-objetivos, sem timer, sem reward tracking
- **Escrita**: acao futura (B4-F05+)
- **Leitura**: state block -> prompt
- **Limpeza**: explicita (IA marca `concluida`/`falhada`) ou reset em mudanca de cenario major

### 6. `tensao` e `ameacas[]` — ja canonicos (B4-F03)

```jsonc
// estadoJogo.tensao — string livre
"alta"

// estadoJogo.ameacas — array de strings (max 5)
["Patrulha orc se aproximando", "Armadilha de urso no caminho"]
```

- **Escrita**: `applyMetadadosToSessao` (B4-F03)
- **Leitura**: `buildTurnState` (B4-F03)
- **Limpeza**: `tensao` sticky (persiste entre turnos, como `cenaAtual`). `ameacas` resetam quando `localMudou`.
- **Tri-state (ameacas)**: array presente -> salva; array vazio -> limpa; ausente -> mantem atual

---

## Regras de transicao e limpeza

| Evento | Campos limpos | Campos preservados / atualizados |
|--------|--------------|----------------------------------|
| `localMudou` (troca de local) | `terreno` -> null, `ameacas` -> [], `efeitos_terreno` -> [] | `tensao` (sticky). `cenaAtual` e `ambiente` sao **atualizados** pelo novo local. |
| `combate` termina | `combate.boss` (se existia) | `terreno`, `ameacas`, `tensao` |
| `batalha_grande` encerra | `batalha_grande` -> null | tudo fora de batalha_grande |
| `missao_tatica` completa | `missao_tatica` -> null | tudo |
| `terreno` muda (sem local mudar) | `efeitos_terreno` -> [] | `ameacas`, `tensao` |

**Regra fundamental**: limpeza e sempre **explicita por campo, nunca implicita**. Cada campo tem triggers de limpeza documentados. Sem "limpa tudo".

---

## Campos existentes (nao-tatico) — referencia

Campos em `estadoJogo` que nao sao tatico-canonicos (nao afetados por este documento):

| Campo | Tipo | Escopo |
|-------|------|--------|
| `rodadaAtual` | number | global |
| `cenaAtual` | string | narrativo |
| `ambiente` | string | narrativo |
| `fase` | string | game phase |
| `npcs` | array | narrativo |
| `horaFiccional` | string | narrativo |
| `mestreContexto` | object | IA context |
| `personagemSessao` | object | per-player |
| `cooldowns` | object | per-player |
| `concentracao` | object | per-player |
| `ultimoTeste` | object | per-player |
| `combate` | object | combat engine |
| `manaState` | object | per-player |
| `compactacao` | object | internal |
| `progressao` | object | internal |

---

## Diagrama de dependencia B4

```
B4-F01 (state block v2) ---+
B4-F02 (prompt v2) --------+
B4-F03 (schema JSON v2) ---+-- B4-D01 (este doc) -- B4-F05 (runtime tatico)
B4-F04 (acoes cenario) ----+                         +-- B4-F07 (resumo v2)
                                                      +-- B4-F06 (blueprint v2)
                                                      +-- B4-D02 (E2E validation)
```

---

## Riscos residuais

- `effectManager` continua usando `alvoId` (personagemId) em vez de `userId` — alinhamento com bucket per-player deferido
- `batalha_grande` e `combate.boss` sao scaffolding minimo, sem simulacao completa

---

## Nota de implementacao (B4-F05 concluido)

- `terreno` canonico (objeto `{ tipo, label, tags }`) ativo desde F05-A. Migracao oportunista de string legado via `migrarEstadoTaticoLegado()`.
- `efeitos_terreno[]` substituiu `terrenoEfeito` desde F05-B. Legado migrado em memoria e removido.
- Bucket per-player `estadoJogo.personagemSessao[userId]` consolidado para XP e inventario (F05-B).
- State block expandido com selectors de boss, batalha grande e missao tatica (F05-C).
- Scaffolding de `combate.boss`, `batalha_grande`, `missao_tatica` com acoes `iniciar_fase_boss` e `missao_batalha` (F05-D).
- Expiracao de `efeitos_terreno[]` integrada ao inicio do turno em `masterNarrationEngine` (F05-C).
