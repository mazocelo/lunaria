# Combat Engine

Documentação técnica do ciclo de vida do combate.

**Fontes principais:**
- `websocket/engines/combatEngine.js` — ciclo de vida e eventos
- `helpers/combateHelper.js` — mecânica, fórmulas, avanço de turno

---

## Diagrama de Estados

```
                     [Narrativa do Mestre detecta monstro]
                                     │
                                     ▼
                            ┌────────────────┐
                            │  INATIVO       │
                            │  combate.ativo │
                            │  = false       │
                            └───────┬────────┘
                                    │  iniciarCombate()
                                    ▼
                            ┌────────────────┐
                            │  INICIATIVA    │
                            │  fase:         │
                            │  'iniciativa'  │◄── jogadores rolam d20 + modAGI
                            └───────┬────────┘
                                    │  todos os jogadores rolaram
                                    │  processarIniciativaCombate()
                                    ▼
                            ┌────────────────┐
                            │  COMBATE       │
                            │  fase:         │
                            │  'combate'     │◄── turnos por ordem de iniciativa
                            └───────┬────────┘
               ┌────────────────────┼────────────────────┐
               ▼                    ▼                     ▼
      [todos monstros HP=0]  [todos jogadores HP=0]   [jogador foge]
               │                    │                     │
               ▼                    ▼                     ▼
         VITORIA              DERROTA                 FUGA
               └────────────────────┴────────────────────┘
                                    │  finalizarCombate()
                                    ▼
                            ┌────────────────┐
                            │  INATIVO       │
                            │  combate.ativo │
                            │  = false       │
                            └────────────────┘
```

---

## Fase de Iniciativa

### `iniciarCombate(roomId, combateData, sessao, userId)`

1. Resolve jogadores da sessão e calcula nível médio do grupo.
2. Busca monstros no banco por `Monstro.buscarPorNomeSimilar()`.
3. Gera instâncias de combate via `gerarInstanciasCombate()`:
   - Monstros encontrados: stats escalados por `calcularStatsEfetivos(monstro, nivelEfetivo)`.
   - Monstros não encontrados: stats genéricos por tipo (`dragao`/`demonio`/outros).
4. Calcula HP/Mana/Esquiva/Armadura de cada jogador.
5. Rola iniciativa dos monstros server-side: `d20 + modAGI`.
6. Monta `combateState` com `fase: 'iniciativa'`, `rodadaCombate: 0`.
7. Emite `combate_iniciado` e `combate_solicita_iniciativa` para cada jogador.

### `processarIniciativaCombate(roomId, userId, valorDado, sessao)`

1. Registra a rolagem do jogador: `iniciativa = d20 + modAGI`.
2. Aguarda todos os jogadores rolarem.
3. Quando completo: ordena `[jogadores, monstros]` por iniciativa decrescente (empate favorece jogador).
4. Define `fase: 'combate'`, `rodadaCombate: 1`, `turnoAtualIdx: 0`.
5. Se o primeiro da ordem for monstro, executa `executarTurnoMonstro()` imediatamente.

---

## Fase de Combate — Turnos por Iniciativa

### `avancarTurno(combate)`

Fonte: `helpers/combateHelper.js`.

```
nextIdx = (turnoAtualIdx + 1) % ordem.length
passedZero = (nextIdx === 0)

enquanto entry[nextIdx] está morto:
    nextIdx = (nextIdx + 1) % ordem.length
    se nextIdx === 0: passedZero = true

se passedZero:
    rodadaCombate++

combate.turnoAtualIdx = nextIdx
combate.aguardandoAcao = ordem[nextIdx].id
retorna { ...ordem[nextIdx], rodadaAvancou: passedZero, rodada }
```

- Pula combatentes mortos automaticamente.
- `passedZero = true` ao cruzar o índice 0 da ordem → nova rodada.
- Retorna `null` se todos estiverem mortos.

### Turno do Jogador

```
1. Jogador envia mensagem
2. prepararTurno() resolve intent (pipeline 3 camadas)
3. resolverMecanicaCombate() pré-resolve a mecânica
         │
   ┌─────┴────────────────────────────────────┐
   │ requerTeste = true                        │
   │ (atacar/habilidade/fuga)                  │
   │ → acaoPendenteCombate = { stage: 'attack_roll', ... }
   │ → frontend exibe dado                     │
   │   jogador rola → resolverTurno()          │
   └─────┬────────────────────────────────────┘
         │
4. CombatRoundResult final
5. Mestre IA narra (com contexto mecânico)
6. emitCombatActionResults() → WebSocket events
7. verificarFimCombate()
8. avancarTurno() → próximo na ordem
```

### Turno do Monstro — `executarTurnoMonstro(roomId, monstroId, sessao)`

Totalmente server-side, sem interação do jogador.

```
1. Seleciona alvo: jogador vivo aleatório
2. Seleciona ação: selecionarHabilidadeMonstro() ou ataque básico
         Habilidade: verificação de cooldown por rodada + chance%

3. Rola ataque:
   rolagem      = d20 (Math.random * 20 + 1)
   bonusAtaque  = modDEX + floor(nivel / 2)
   totalAtaque  = rolagem + bonusAtaque
   dcEsquiva    = 10 + modAGI_alvo + dcBonus_defesa

4. verificarAcerto(rolagem, totalAtaque, dcEsquiva):
   nat 20 → acertou=true, critico=true
   nat 1  → acertou=false
   outros → acertou = (totalAtaque >= dcEsquiva)

5. Se acertou:
   danoBase  = habilidade.dano || monstro.dano_base || '1d6'
   modForca  = floor((forca - 10) / 2)
   dano      = calcularDano(danoBase, modForca, critico)

   Se não crítico:
     absorcao  = calcularAbsorcao(conAlvo, armaduraAlvo)
     dano      = max(0, dano - absorcao)

   Se defesaTemporaria ativa:
     dano      = max(1, floor(dano × 0.5))

   alvoStats.hp_atual -= dano
   se hp_atual <= 0: alvoStats.status = 'inconsciente'

6. Emite combat_monster_action → frontend
```

---

## Fluxo Detalhado: Attack Roll → HP Update

```
attack_roll (stage 1)
    d20 + modDEX + bonusNivel vs DC (10 + modAGI)
         │
    nat 20? → critico = true
    nat 1?  → miss, fim
    total >= DC? → acerto
         │
damage_roll (stage 2 — se acerto)
    dado_arma + modFOR (melee) | modDEX (ranged)
    critico → dado rolado 2×
         │
absorption
    se não crítico: max(0, modCON-1)d4 + armadura
    dano_final = max(0, dano_bruto - absorcao)
         │
defense reduction
    se defesaTemporaria ativa: dano_final = max(1, floor(dano_final × 0.5))
         │
HP update
    alvo.hp_atual = max(0, alvo.hp_atual - dano_final)
    se hp_atual <= 0: status = 'inconsciente' | 'derrotado'
         │
concentration check (se jogador mantinha concentração)
    DC = max(10, dano_final / 2)
    d20 + modCON vs DC
    falha → quebrarConcentracao()
```

---

## Condições de Fim de Combate

Verificadas por `verificarFimCombate(combateState)` após cada ação relevante.

| Condição | Resultado |
|----------|-----------|
| Todos os monstros com `status !== 'vivo'` | `VITORIA` |
| Todos os jogadores com `status !== 'vivo'` | `DERROTA` |
| Jogador passa no teste de fuga (AGI vs DC) | `FUGA` |

### `finalizarCombate(roomId, resultado)`

1. Calcula XP total dos monstros derrotados.
2. Desativa combate: `combate.ativo = false`.
3. Em derrota: marca jogadores inconscientes como `derrotado`, emite `jogador_derrotado`.
4. Em vitória: distribui XP, verifica level up, rola loot.
5. Emite `combate_finalizado` com resultado e XP.

---

## Status Effects por Rodada

**Jogadores** — decrementados uma vez por turno do jogador pelo `effectManager` no `masterNarrationEngine`.

**Monstros** — processados em `_controlarRodada()` quando todos os jogadores vivos agiram:

```
Para cada monstro vivo com status_efeitos:
  Para cada efeito:
    se STATUS_DANO_POR_TURNO[efeito.nome] → rola dado, aplica dano
    efeito.duracao -= 1
    se duracao <= 0 → remove efeito
```

---

## Controle de Rodada

```
_controlarRodada():
  adiciona userId a jogadoresQueAgiram
  se jogadoresQueAgiram.length >= totalJogadoresVivos:
    limpa defesas temporárias expiradas
    tick de efeitos em monstros (DOT + decremento)
    reseta jogadoresQueAgiram = []
    resultados.rodadaAvancou = true
```

O avanço de rodada via `rodadaCombate++` é feito por `avancarTurno()` ao cruzar o índice 0 da ordem de iniciativa (sistema passedZero).

---

## Habilidades e Magias em Combate

### Resolução de Ações Disponíveis

`_getPersonagemHabilidades(personagemCompleto)` chama `getOwnedCombatActionList()` que agrega:
- Habilidades da classe (automáticas)
- Habilidades próprias via `hm_personagem` (grimório, level-up, loot)
- Vantagens com `usos >= 1`

### Uso de Habilidade/Magia

```
1. Jogador seleciona habilidade/magia
2. Verifica custo_mana <= mp_atual
3. Verifica cooldown_turnos (se em cooldown → bloqueado)
4. Verifica nivel_requerido <= nivel_personagem
5. Deduz mana: mp_atual -= custo_mana
6. Resolve escalamento: resolverEscalamento(habilidade, nivel)
7. Aplica dano/efeito com modificadores de escalamento
8. Se usa_concentracao: registra concentração ativa
9. Se efeito: aplica status effect no alvo (DOT, stun, etc.)
```

### Escalamento em Combate

Quando uma habilidade tem campo `escalamento`:
- `resolverEscalamento()` retorna `{ dano_bonus, multiplicador }`
- Dano final = `rolar(dano_base) + dano_bonus`, multiplicado por `multiplicador` se presente
- Aplicado tanto para jogadores quanto para monstros (via `selecionarHabilidadeMonstro`)

### Seleção de Habilidade do Monstro

```
selecionarHabilidadeMonstro(monstro, rodada):
  filtra habilidades com cooldown expirado
  chance% de usar habilidade vs ataque básico
  se selecionada: usa dano da habilidade + escalamento
  senão: usa dano_base do monstro
```
