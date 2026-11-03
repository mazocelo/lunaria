# Fórmulas do Sistema de Combate

Referência técnica de todas as fórmulas por sistema de RPG. As fórmulas do Lunaria espelham o código em `helpers/combateHelper.js`. As fórmulas de 3D&T e D&D espelham os engines em `game-systems/tresdet/` e `game-systems/dnd5e/`.

---

# Sistema Lunaria

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

---

## Habilidades e Magias

### Modelo de Dados

Tabela unificada `habilidades_magias` com junction tables:
- `hm_classe` — vincula habilidades a classes (many-to-many)
- `hm_raca` — vincula habilidades a raças (many-to-many)
- `hm_personagem` — registra quais habilidades/magias o personagem possui, com origem (`criacao`, `level-up`, `loot`, `racial`)
- `hm_slots_classe` — define slots de magia por classe + nível

### Campos Relevantes

```
custo_mana         — custo em MP para usar
dano_base          — dado de dano (ex: "2d6", "1d8+2")
tipo               — "dano", "suporte", "controle", etc.
escola_magia       — evocacao, abjuracao, conjuracao, transmutacao,
                     adivinhacao, encantamento, ilusao, necromancia
elemento           — fire, ice, lightning, etc.
nivel_requerido    — nível mínimo para usar
cooldown_turnos    — turnos de espera entre usos
alvo               — inimigo, aliado, auto
alcance            — proximo, medio, distante
tempo_conjuracao   — acao, bonus, reacao
usa_concentracao   — boolean
escalamento        — JSON com tiers de escala por nível
efeito             — JSON com status effects aplicados
saving_throw       — tipo de teste de resistência
usos_por_descanso  — limite de usos por descanso longo
```

### Escalamento (Damage Scaling)

`resolverEscalamento(habilidade, nivelPersonagem)` em `combateHelper.js`.

**Formato novo (tiers):**

```json
{
  "upgrades": [
    { "nivel": 5, "dano_bonus": 10, "multiplicador": 1.2 },
    { "nivel": 10, "dano_bonus": 15, "multiplicador": 1.5 }
  ]
}
```

Aplica o tier mais alto onde `upgrade.nivel <= nivelPersonagem`.

**Formato legado (linear):**

```json
{ "por_nivel": 5, "a_cada": 3 }
```

Aplica: `vezes = floor((nivelPersonagem - 1) / a_cada)`, dano_bonus = `por_nivel × vezes`.

### Slots de Magia

```
GET /habilidades-magias/slots?classe_id=X&nivel=Y → { slots: N }
```

Fonte: `HmSlotsClasse.getSlots(classeId, nivel)`.

Define quantas magias o personagem pode selecionar no Grimório durante criação. Classes sem magia retornam 0 slots.

### Ownership (hm_personagem)

Fontes de habilidades em combate (`getOwnedCombatActionList`):
- `habilidadesClasse` — automáticas pela classe
- `habilidadesProprias` — owned via `hm_personagem` (grimório + level-up + loot)
- `vantagens` — vantagens com `usos >= 1`

Distinção magia vs habilidade: `isSpellAction(item)` checa `escola_magia && escola_magia !== 'nenhuma'`.

---

# Sistema 3D&T Alpha

Referência: `game-systems/tresdet/combatEngine.js` e `game-systems/tresdet/characterEngine.js`.

---

## Características

Cinco características com range 0-5: F, H, R, A, PdF. Sem modificadores — valores usados diretamente.

---

## Estatísticas Derivadas

### PV (Pontos de Vida)

```
PV = R × 5 (mínimo 1)
```

### PM (Pontos de Magia)

```
PM = R × 5 (somente se tiver vantagem Magia; senão 0)
```

---

## Combate

### Força de Ataque (FA)

```
FA (melee)  = F + H + 1d6
FA (ranged) = PdF + H + 1d6
```

### Força de Defesa (FD)

```
FD = A + H + 1d6
```

### Dano

```
Dano = max(0, FA - FD)
```

Se FA <= FD, o ataque falha (dano 0). Não existe crítico no 3D&T.

### Iniciativa

```
Iniciativa = 1d6 + H
```

---

## Testes de Habilidade

```
Teste simples: 1d6 <= valor da característica → sucesso
Teste difícil:  1d6 <= característica - N → sucesso
Teste oposto:  ambos rolam 1d6 + característica, maior vence
```

Fonte: `game-systems/tresdet/testEngine.js`.

---

## Sistema de Pontos (Criação)

```
Tier     | Pontos | Max Desvantagens
---------|--------|------------------
Novato   |   6    |     5
Lutador  |   7    |     5
Campeão  |   8    |     6
Lenda    |  10    |     7
Herói    |  15    |     8
```

Pontos distribuídos entre F, H, R, A, PdF (0-5 cada). Vantagens custam pontos; desvantagens devolvem pontos (limitado pelo tier).

---

## Progressão

```
+1 ponto por nível após o primeiro (máximo nível 10)
Sem tabela fixa de XP — progressão narrativa a critério do Mestre
```

---

# Sistema D&D 5e (SRD)

Referência: `game-systems/dnd5e/combatEngine.js` e `game-systems/dnd5e/characterEngine.js`.

---

## Ability Modifier

```
modifier = floor((score - 10) / 2)
```

Exemplos: 10 → 0, 14 → +2, 8 → -1, 16 → +3, 20 → +5.

---

## Proficiency Bonus

```
Nível 1-4:   +2
Nível 5-8:   +3
Nível 9-12:  +4
Nível 13-16: +5
Nível 17-20: +6
```

Fonte: `PROFICIENCY_BONUS` em `game-systems/dnd5e/constants.js`.

---

## Estatísticas Derivadas

### HP (Hit Points)

```
HP nível 1     = hitDie + modCON
HP níveis 2+   = avg(hitDie) + 1 + modCON por nível adicional
HP total       = HP_nv1 + (avg(hitDie) + 1 + modCON) × (nível - 1)
Mínimo: 1
```

Hit dice por classe:

| Classe | Hit Die | Classe | Hit Die |
|--------|---------|--------|---------|
| Barbarian | d12 | Fighter / Paladin / Ranger | d10 |
| Bard / Cleric / Druid / Monk / Rogue / Warlock | d8 | Sorcerer / Wizard | d6 |

Fonte: `calcularHP()` em `game-systems/dnd5e/characterEngine.js`.

### AC (Armor Class)

```
AC = stats_sistema.ac ou 10 + modDEX (sem armadura)
```

### Mana

D&D **não usa mana**. Usa spell slots. `calcularMP()` retorna 0.

---

## Combate

### Rolagem de Ataque

```
Total = d20 + ability_modifier + proficiency_bonus
DC    = AC do defensor

Total >= AC → Acerto
Total <  AC → Erro
d20 = 20    → Critical Hit (acerto automático, dados de dano dobrados)
d20 = 1     → Fumble (erro automático)
```

**Ability usada:**
- Melee: STR modifier
- Ranged: DEX modifier
- Spell: casting ability modifier (INT, WIS ou CHA conforme a classe)

### Advantage / Disadvantage

```
Advantage:    rola 2d20, usa o MAIOR
Disadvantage: rola 2d20, usa o MENOR
Ambos:        se cancelam, rola normalmente
```

Fonte: `resolverAtaque()` em `game-systems/dnd5e/combatEngine.js`.

### Iniciativa

```
Iniciativa = d20 + modDEX
```

---

## Saving Throws

```
d20 + ability_modifier + proficiency (se proficiente) vs DC
```

Cada classe é proficiente em 2 saving throws.

---

## Skill Checks

```
d20 + ability_modifier + proficiency (se proficiente) vs DC

DCs: Muito Fácil (5) | Fácil (10) | Média (15) | Difícil (20) | Muito Difícil (25) | Quase Impossível (30)
```

18 skills mapeadas para as 6 abilities.

---

## Death Saving Throws

```
d20 >= 10 → sucesso
d20 <  10 → falha
d20 =  20 → volta com 1 HP (nat 20)
d20 =  1  → conta como 2 falhas (nat 1)

3 sucessos → estabiliza
3 falhas   → morre
```

Fonte: `resolverDeathSave()` em `game-systems/dnd5e/combatEngine.js`.

---

## Spell Slots

Full casters (Wizard, Cleric, Druid, Bard, Sorcerer): slots de nível 1-9.
Half casters (Paladin, Ranger): slots de nível 1-5.
Warlock: pact magic (slots limitados, recuperam em short rest).
Cantrips: nível 0, uso ilimitado.

Slots recuperam em long rest (exceto Warlock: short rest).

Fonte: `FULL_CASTER_SLOTS`, `HALF_CASTER_SLOTS` em `game-systems/dnd5e/constants.js`.

---

## ASI (Ability Score Improvement)

```
Níveis 4, 8, 12, 16, 19: +2 em uma ability OU +1 em duas abilities (ou um feat)
```

---

## Economia

### Dinheiro Inicial (3D&T)

```
base = 1d6 × 100
```

Modificadores aplicados por vantagens/desvantagens do personagem (case-insensitive match no nome):

| Vantagem | Modificador | Desvantagem | Modificador |
|----------|-------------|-------------|-------------|
| Aparência Inofensiva | +1d6×50 | Assombrado | -1d6×10 |
| Boa Fama | +1d6×50 | Maldição | -1d6×10 |
| Genialidade | +2d6×100 | Código de Honra | -1d6×10 |
| Patrono | +2d6×100 | Clericato | -1d6×10 |
| Torcida | +1d6×10 | Paladino | -1d6×10 |
| Perícia (tipo) | +2d6×100 | Inculto | -1d6×100 |
| Especialização (tipo) | +1d6×50 | Insano | -1d6×50 |
| | | Má Fama | -1d6×100 |
| | | Monstruoso | -1d6×10 |

Riqueza: ignora tudo, `1d6 × 100_000_000`.
Negativo = dívida. Personagem em dívida não pode comprar.

Fonte: `helpers/economiaHelper.js` → `calcularDinheiroInicial()`.

### Preço de Venda

```
valorVenda = Math.floor(preco * 0.5)
```

### Limites de Equipamento (3D&T)

| Tipo | Max Equipados |
|------|--------------|
| arma | 1 |
| armadura | 1 |
| acessorio | 2 |
| consumivel | N/A (usa e descarta) |
| pergaminho | N/A (usa e descarta) |

Fonte: `LIMITES_EQUIP` em `helpers/economiaHelper.js`.

### Tabelas

- `itens_tresdet` — catálogo de itens 3D&T (90 itens: armas, armaduras, acessórios, consumíveis, pergaminhos)
- `personagem_item_tresdet` — inventário do personagem 3D&T (quantidade + equipado)
- `personagem_equipamento` — inventário Lunaria/D&D (expandido com quantidade + equipado)

### Rotas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/personagens/:id/saldo` | Moedas atuais |
| GET | `/personagens/:id/inventario` | Inventário com status equipado |
| POST | `/personagens/:id/comprar` | `{ itemId, quantidade, sistema }` |
| POST | `/personagens/:id/vender` | `{ itemId, quantidade, sistema }` |
| POST | `/personagens/:id/equipar` | `{ itemId, sistema }` |
| POST | `/personagens/:id/desequipar` | `{ itemId, sistema }` |
