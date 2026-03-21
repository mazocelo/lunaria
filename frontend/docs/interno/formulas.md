# Fórmulas do Sistema de Combate

Referência técnica de todas as fórmulas. Os valores aqui espelham exatamente o código em `helpers/combateHelper.js`.

---

## Modificador de Atributo

```
mod = floor((atributo - 10) / 2)
```

Exemplos: 10 → 0, 14 → +2, 8 → -1, 18 → +4.

---

## Estatísticas Derivadas

### HP (Pontos de Vida)

```
HP = mult_raca × (nivel + max(1, modCON))
```

Fonte: `calcularHP(personagem, multRaca)` em `combateHelper.js`.

#### Tabela mult_raca por raça

| Raça | mult | Raça | mult |
|------|------|------|------|
| Kobold / Goblin / Fada | 3 | Humano / Meio-Elfo / Tiefling / Aasimar / Primordiano / Anfíbio / Kythari / Kemono / Hobgoblin | 5 |
| Elfo / Elfo Negro / Halfling / Gnomo / Pardalino | 4 | Anão / Bugbear / Meio-Orc / Anjo / Demônio / Meio-Abissal / Meio-Celestial / Deva / Androide | 6 |
| Orc / Draconato / Centauro / Minotauro / Silvagante / Licantropo / Meio-Dragão / Meio-Ogro | 7 | Ogro / Golem | 8–9 |

Fallback padrão: **5** (Humano) quando a raça não é encontrada no mapa.

### Mana (Pontos de Magia)

```
MP = max(5, 10 + nivel + max(modINT, modCHA) × 2)
```

Fonte: `calcularMana(personagem)`. Usa o maior entre INT e CHA, permitindo que Bardos e Paladinos usem Carisma.

### DC de Esquiva

```
DC Esquiva = 10 + modAGI
```

Fonte: `calcularDCEsquiva(agilidade)`. Define a dificuldade para o atacante acertar o alvo.

### Taxa de Absorção (TA)

```
TA = max(0, modCON - 1)d4 + armadura_equipada
```

Fonte: `calcularAbsorcao(constituicao, armadura)`.

- CON 10 (mod 0) → 0d4 → sem absorção natural
- CON 14 (mod +2) → 1d4 absorção natural
- CON 18 (mod +4) → 3d4 absorção natural
- Críticos ignoram a TA completamente.

---

## Combate

### Bônus de Ataque

```
bonusAtaque = modDEX + bonusNivel
bonusNivel  = floor(nivel / 2)
```

Fonte: `calcularBonusNivelCombate(nivel)` e `buildAttackBonus()`.

DEX é o atributo de precisão para **todos** os tipos de ataque (melee e ranged).

### Rolagem de Ataque

```
Total = d20 + modDEX + bonusNivel
DC    = 10 + modAGI do alvo

Total >= DC → Acerto
Total <  DC → Erro
d20 = 20    → Crítico (dano 2×, ignora TA)
d20 = 1     → Falha crítica (sem dano)
```

### Dano Melee

```
Dano = rolar(dado_arma) + modFOR
```

### Dano Ranged

```
Dano = rolar(dado_arma) + modDEX
```

Fonte: `calcularDano(dano_base, modForca, critico)`. A distinção melee/ranged é feita por `buildAttackBonus({ isRanged })`.

### Crítico

```
Dano crítico = dado_arma rolado 2× + modificador
TA ignorada completamente
```

### Stats Efetivos de Monstro

```
hp_max     = mult_raca × (nivel + max(1, modCON))
dc_esquiva = 10 + modAGI
ataque     = modDEX + floor(nivel / 2)
xp         = xp_base × nivel
```

Fonte: `calcularStatsEfetivos(monstro, nivelEfetivo)`.

---

## Iniciativa

```
Iniciativa = d20 + modAGI
```

Jogadores rolam via UI; monstros rolam server-side. Empate: jogador tem prioridade.

---

## Ação Defender

```
DC temporária = 10 + modAGI + 2     (+2 até próximo turno do jogador)
Dano recebido = floor(dano × 0.5)   (mínimo 1, caso o ataque passe pelo DC)
```

A `defesaTemporaria` expira quando `ativaAteRodada < rodadaCombate`.

---

## Fuga

```
Teste: d20 + modAGI
DC:    10 + (monstros_vivos × 2)
```

Fonte: `_prepararTesteFuga()` em `combateHelper.js`.

---

## DC de Magia (Resistência)

```
DC resistência = 8 + custo_mana + floor(max(modINT, modCHA) / 2)
Teste monstro  = d20 + modCON

Monstro >= DC → resiste, dano reduzido pela metade (mínimo 1)
Monstro <  DC → dano total aplicado
```

Fonte: `calcularDCMagia(personagem, custoMana)`.

---

## Concentração

```
DC = max(10, dano_recebido / 2)
Teste = d20 + modCON

Teste < DC → concentração quebrada, magia encerra imediatamente
```

Fonte: `checkDanoConcentracao()` em `concentrationManager.js`.

---

## Status Effects

| Status | Efeito |
|--------|--------|
| **Atordoado** | Impede ação no turno |
| **Paralisado** | Impede ação no turno |
| **Congelado** | Impede ação no turno |
| **Envenenado** | 1d4 dano por turno (DOT) |
| **Queimando** | 1d6 dano por turno (DOT) |
| **Cego** | -5 no total de ataque |

Fonte: `STATUS_IMPEDE_ACAO`, `STATUS_DANO_POR_TURNO`, `STATUS_PENALIDADE_ATAQUE` em `config/domainConstants.js`.

**Decremento de duração:**
- Efeitos em jogadores: gerenciados pelo `effectManager` no `masterNarrationEngine` (uma vez por turno do jogador).
- Efeitos em monstros: decrementados por `_controlarRodada` em `combateHelper.js` (uma vez por rodada).

---

## XP

```
xp_monstro = xp_base × nivel_efetivo
```

XP total distribuído ao fim do combate = soma do `xp` de todos os monstros derrotados.
