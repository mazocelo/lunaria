# Spec: Redesign da Arquitetura de Mecânicas — Lunaria RPG

**Data:** 2026-03-19
**Status:** Aprovado
**Versão:** 1.1

---

## 1. Princípio Central

**Mecânica primeiro, narração depois. Código decide, LLM narra. Quando código não sabe, LLM barata decide.**

- A IA é narradora, não juíza. Ela nunca inventa números.
- A engine resolve toda mecânica e entrega resultado como fato.
- Quando código não consegue resolver (intent ambíguo, DC incerto), uma LLM barata (Flash Lite) decide.
- Combate ativo → toda ação do jogador passa pela engine, sem exceção.
- NPCs e monstros seguem as mesmas regras mecânicas dos jogadores.

## 2. Arquitetura

```
JOGADOR
   ↓
INTENT (regex → fallback Flash Lite)
   ↓
GAME ENGINE (código puro)
   ├─ resolve ação jogador
   ├─ resolve ação monstros (automático)
   ├─ atualiza estado (HP/mana/cooldowns/status)
   └─ gera contextoParaIA
   ↓
MESTRE IA (Sonnet/Gemini/Groq)
   ├─ balão 1: narração ação jogador
   └─ balão 2: narração reação monstros
   ↓
REVISOR ÚNICO (Flash)
   └─ valida mecânica + continuidade + gancho
   ↓
FRONTEND
   ├─ chat: balões separados por entidade
   └─ painel: HP, mana, status, log mecânico
```

## 3. Componentes

| Componente | Tipo | Modelo | Responsabilidade |
|-----------|------|--------|-----------------|
| Intent Resolver | Código + LLM fallback | Flash Lite | Inferir intent do texto livre |
| GameEngine | Código puro | — | Resolver toda mecânica |
| Mestre | LLM | Configurável (Sonnet/Gemini/Groq) | Narrar resultados mecânicos |
| Revisor Único | LLM | Flash | Validar coerência mecânica + narrativa + gancho |

## 4. GameEngine (`helpers/gameEngine.js`)

Módulo local que centraliza TODA resolução mecânica. Não é micro-serviço.

### Interface principal

```js
gameEngine.resolverTurno(sessao, userId, intent)
```

**Input:**
```js
{
  sessao,     // estado atual (combate, jogadores, monstros, personagensCompletos)
  userId,     // quem agiu
  intent      // { tipo: "conjurar_magia", magiaId: "luz_divina", alvo: "dretch_0" }
}
```

**Nota:** `personagem` (com habilidades/magias/stats) é resolvido internamente via `sessao.personagensCompletos[userId]`.

**Output (multi-jogador):**
```js
{
  jogadores: {
    "user_1": {
      nome: "Moruxis",
      acaoNarrada: "Moruxis conjura Luz Divina",
      dado: 17,
      acertou: true,
      critico: false,
      dano: 8,
      alvo: "dretch_0"
    }
  },
  monstros: [
    {
      id: "dretch_0",
      nome: "Dretch",
      acao: "ataca com garras",
      dado: 12,
      acertou: false,
      critico: false,
      dano: 0,
      alvo: "user_1"
    }
  ],
  estado: {
    jogadores: {
      "user_1": { hp: 14, maxHp: 20, mana: 9, maxMana: 15, status: [] }
    },
    monstros: {
      "dretch_0": { hp: 17, maxHp: 25, status: [] }
    },
    combateAtivo: true,
    monstrosDerrotados: [],
    rodada: 2
  },
  contextoParaIA: {
    jogador: "Moruxis acerta Luz Divina no Dretch (8 dano, HP 17/25).",
    monstros: "Dretch erra garras em Moruxis."
  },
  // quando intent inválido (mana insuficiente, cooldown, alvo morto)
  erro: null  // ou { tipo: "mana_insuficiente", mensagem: "Mana insuficiente para Luz Divina (custo: 5, atual: 3)" }
}
```

### Fluxo de dados com dice roll do jogador

O sistema atual usa dice roll via UI (jogador rola dado). O GameEngine opera em 2 fases:

```
Fase 1: gameEngine.prepararTurno(sessao, userId, intent)
  → retorna: { teste necessário, atributo, DC, modificador }
  → frontend mostra dice roll UI

Fase 2: gameEngine.resolverTurno(sessao, userId, intent, dadoRolado)
  → recebe o valor do dado rolado pelo jogador
  → resolve acerto/dano/contra-ataque com base no dado real
  → retorna output completo acima
```

Na Fase 1 o jogador é livre para abortar (cancelar ação). Na Fase 1 single-player, auto-roll server-side é permitido como opção futura.
```

### O que faz
- Recebe ação com intent resolvido
- Resolve mecânica do jogador (dado, acerto, crítico, dano, mana)
- Resolve ação automática dos monstros (contra-ataque após ação de cada jogador)
- Atualiza HP/mana/cooldowns/status/concentração de todos
- Aplica DOT (dano por turno) de efeitos ativos
- Verifica concentração (quebra em dano recebido)
- Valida ação antes de executar (mana, cooldown, alvo vivo) — retorna `erro` se inválida
- Verifica fim de combate (monstros HP=0, jogador HP=0/inconsciente)
- Gera `contextoParaIA` separado por entidade (jogador + monstros)

### O que NÃO faz
- Não chama IA
- Não emite eventos websocket
- Não persiste no Redis
- Não toma decisões narrativas

### Usa funções existentes
- `resolverMecanicaCombate()` de `combateHelper.js`
- `resolverTeste()` de `testeHelper.js`
- `calcularHP()`, `calcularMana()`, `calcularEsquiva()`, `calcularArmadura()`
- `rolarDado()`, `calcularDano()`, `verificarAcerto()`
- `verificarFimCombate()`
- `selecionarHabilidadeMonstro()` (preservado: seleção probabilística com cooldowns)
- `concentrationManager` (preservado: track + quebra em dano)
- `effectManager` (preservado: DOT, buffs, debuffs)
- `cooldownManager` (preservado: cooldowns por habilidade)

### Mecânicas preservadas (sem redesign)
| Mecânica | Módulo atual | Status |
|----------|-------------|--------|
| Concentração (quebra em dano) | `concentrationManager.js` | Preservado |
| DOT (dano por turno) | `effectManager.js` | Preservado |
| Cooldowns | `cooldownManager.js` | Preservado |
| Resistência elemental | `combateHelper.js` | Preservado |
| Rolagem aberta (crítico) | `combateHelper.js` | Preservado |
| Equipamentos/bônus | `bonusHelper.js` | Preservado |
| Fuga (teste vs DC baseado em monstros) | `combateHelper.js` | Preservado |
| Seleção de habilidade monstro | `combateHelper.js` | Preservado |

## 5. Intent Resolver

### Regra: código primeiro, LLM é fallback

```
Texto do jogador
   ↓
Regex + match fuzzy com personagem.magias/habilidades/vantagens
   ↓
Resultado positivo? → usa (confidence > 0.8)
Resultado negativo/vazio/ambíguo? → Flash Lite decide
```

### Regex (já existe em `combatIntentResolver.js`)
- Match exato com nomes de magias/habilidades do personagem
- Match parcial por tokens
- Patterns genéricos: "ataco" → atacar, "defendo" → defender, "fujo" → fugir

### Fallback LLM (Flash Lite)
- Prompt curto com: texto do jogador + lista de magias/habilidades disponíveis + inimigos em cena
- Output: JSON com `{ tipo, magiaId/habilidadeId, alvo }`
- Custo: ~$0.00005 por chamada (~R$0.03/sessão)
- Latência: 100-300ms

### Validação do retorno LLM
- Resposta deve ser JSON válido com `{ tipo, magiaId/habilidadeId, alvo }`
- `magiaId` deve existir na lista de magias/habilidades do personagem
- `alvo` deve existir na lista de inimigos vivos
- Se validação falha → fallback para `{ tipo: "atacar", alvo: primeiro_monstro_vivo }`

### Quando NÃO usar LLM
- Regex resolveu com confidence > 0.8
- Ação é genérica (atacar/defender/fugir) sem habilidade específica

## 6. Fluxo de Combate Completo

Quando combate está ativo, toda ação do jogador:

```
[1] INTENT RESOLVER
    Texto → intent estruturado
    Regex primeiro, Flash Lite se ambíguo

[2] GAME ENGINE
    intent → resolverTurno(sessao, userId, intent)
    → resolve dado/acerto/dano do jogador
    → resolve ação automática do monstro
    → atualiza estado completo
    → gera contextoParaIA

[3] MESTRE IA
    Recebe contextoParaIA como fato mecânico
    Narra em 2 partes:
    → balão 1: ação do jogador (resultado do ataque, efeito visual)
    → balão 2: reação do monstro (contra-ataque, esquiva, grito)

[4] REVISOR ÚNICO (Flash)
    Valida: narrativa bate com mecânica?
    3 critérios: mecânica + continuidade + gancho
    Fail-open: timeout → narrativa original passa

[5] EMISSÃO
    → mensagens pro chat (balões separados por entidade)
    → atualização do painel de combate (HP, mana, status)
    → persistência no Redis
```

## 7. Fluxo Fora de Combate — Testes

```
[1] JOGADOR: "Examino o tomo"

[2] MESTRE IA narra + sinaliza teste:
    {
      solicitaDados: {
        solicita: true,
        tipo: "Investigação",        ← tipo estruturado (não texto livre)
        dificuldade: "difícil",       ← label de dificuldade
        justificativa: "tomo corrompido resiste à leitura"
      }
    }

[3] GAME ENGINE resolve teste via código:
    mapearTesteParaAtributo("Investigação") → INT     (testeHelper.js existente)
    obterDC("difícil") → DC 15                        (testesConfig.js existente)
    Se tipo não mapeado → Flash Lite decide atributo e DC

[4] JOGADOR rola dado

[5] GAME ENGINE resolve:
    d20 + modificador INT vs DC 15 → sucesso/falha

[6] MESTRE IA narra resultado baseado no fato mecânico
```

**Diferença do combate:** fora de combate, a IA pode narrar ANTES do teste (passo 2) porque a ação não tem consequência mecânica imediata.

**Nota:** A IA envia tipo estruturado ("Investigação", "Percepção", "Atletismo") e dificuldade em label ("fácil", "médio", "difícil", "muito difícil"). O Engine usa `mapearTesteParaAtributo()` e `obterDC()` existentes. LLM fallback só quando tipo não está no mapeamento — mantendo o princípio "código decide primeiro".

## 8. Revisor Único

Funde ArbitroMecanico + Continuista + GanchoNarrativo.

### Modelo
- Flash (não Lite) — custo equivalente a 1 dos 3 atuais, qualidade superior

### Prompt
```
Avalie a narrativa contra 3 critérios:

MECÂNICA: Respeita o resultado mecânico fornecido?
- Dano narrado proporcional ao dano real
- Acerto narrado = acerto mecânico
- HP do alvo coerente com o estado

CONTINUIDADE: Coerente com o histórico?
- NPCs mantêm identidade
- Cena não muda sem motivo
- Fatos não contraditos

GANCHO: Termina com algo jogável?
- Se turno continua → deixa concreta
- Se turno encerra → fecha limpo

Retorne:
{
  "aprovado": true/false,
  "mecanica": { "ok": true, "problema": null },
  "continuidade": { "ok": true, "problema": null },
  "gancho": { "ok": true, "problema": null },
  "correcao": null ou "narrativa corrigida"
}
```

### Quando roda
- Após toda narração do mestre
- Timeout: 8s, fail-open

### Quando NÃO roda
- Mensagens de sistema (XP, cenário mudou)
- Rolagens de dado puras

## 9. Frontend — Combate UI

### Balões separados por entidade
- Ação do jogador: balão com cor/ícone do personagem
- Reação do monstro: balão com cor/ícone do monstro
- Resultado mecânico: badge inline ("+8 dano", "ERROU", "Sucesso!")

### Painel de combate
- Barras de HP de todos (jogadores + monstros)
- Indicadores de mana
- Status ativos (buff/debuff/cooldown)
- Log mecânico compacto ("Moruxis → Dretch: 8 dano | Dretch → Moruxis: ERROU")

### Evento `combate_iniciado`
- Renderiza painel imediatamente
- Mostra monstros com HP/stats
- Ativa botões de ação (Atacar/Defender/Fugir/Habilidades)

## 10. Regras de Ouro

1. **IA nunca inventa números** — recebe resultado mecânico como fato
2. **Engine nunca depende da IA pra mecânica** — resolve antes de chamar IA
3. **Código decide primeiro** — LLM é fallback pra ambiguidade
4. **Combate ativo → toda ação passa pela engine** — sem exceção
5. **NPCs/monstros seguem mesmas regras** — não são narrativa pura
6. **Monstros agem automaticamente** — engine decide ação do monstro após ação do jogador
7. **Estado mecânico é verdade** — se HP=0, monstro morreu. IA narra a morte, não decide.

## 11. Custo por Sessão (~135 msgs, 4-5 combates)

| Componente | Antes | Depois |
|-----------|-------|--------|
| Mestre (narração) | Igual | Igual |
| Revisores | 3× Flash Lite (~R$0.46) | 1× Flash (~R$0.15) |
| Intent Resolver | — | +R$0.03 (Flash Lite, só combate) |
| GameEngine | — | R$0 (código puro) |
| **Total diferença** | — | **-R$0.28/sessão** |

Custo MENOR que hoje com qualidade MAIOR.

## 12. Fases de Implementação

```
Fase 1 (1 semana):    GameEngine básico — HP/dano funciona
Fase 2 (3-4 dias):    Intent com fallback LLM
Fase 3 (2-3 dias):    Revisor único
Fase 4 (3-4 dias):    Testes fora de combate com engine
Fase 5 (1 semana):    Frontend combate UI + balões separados
```

Cada fase é independente, testável, e deployável.

## 13. Riscos

| Risco | Mitigação |
|-------|----------|
| GameEngine introduz bugs em combateHelper | Testes canônicos existentes validam invariantes |
| Flash Lite resolve intent errado | Regex resolve 90%, LLM só entra em ambiguidade |
| Revisor único não cobre todos os casos dos 3 antigos | Prompt mais rico + modelo melhor (Flash vs Lite) |
| Frontend UI de combate complexa | Incremental — painel básico primeiro, polish depois |
| Migração quebra fluxo existente | Cada fase preserva fallback pro comportamento antigo |
| Fluxo 2-fases (prepararTurno→resolverTurno) complicar interface | Fase 1 pode usar auto-roll server-side; dice UI evolui incrementalmente |
| Jogador desconecta mid-turno | cleanupStalePendingCombatAction existente (timeout 5min) preservado |
