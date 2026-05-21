# Multi-Sistema RPG — Design Spec

**Data:** 2026-03-21
**Status:** Aprovado
**Escopo:** Adicionar suporte a múltiplos sistemas de RPG (Lunaria, 3D&T Alpha, D&D 5e, Daemon futuro) com engines isoladas por sistema.

---

## 1. Problema

O Lunaria usa um sistema de RPG homebrew próprio. Jogadores que conhecem D&D, 3D&T ou Daemon precisam aprender um sistema novo, o que aumenta barreira de entrada. A familiaridade com sistemas existentes aumentaria adesão.

---

## 2. Decisões de Design

| Decisão | Escolha |
|---|---|
| Quantos sistemas? | 4: Lunaria (existente), 3D&T Alpha, D&D 5e, Daemon (futuro) |
| Onde o sistema é definido? | `historia.sistema` (fonte de verdade) + `personagem.sistema` (herdado da história na criação) |
| Arquitetura | Abordagem Multi-Engine: interface compartilhada, engine isolada por sistema |
| Catálogos | Mesma tabela com coluna `sistema` + unique constraint `[nome, sistema]` |
| Prioridade | 3D&T primeiro (mais simples, valida arquitetura), D&D depois, Daemon por último |
| Wizard | Shell compartilhada, etapas específicas por sistema |
| Combate | Engine separada por sistema. MVP: todos os personagens de uma história usam o mesmo sistema |
| Mestre IA | Prompt de regras injetado dinamicamente baseado no sistema da história |
| Personagens existentes | Ficam como sistema "lunaria", sem migração |
| Atributos de personagem | Dropar 6 colunas hardcoded (forca, destreza, etc.), criar tabela `atributos_personagem` flexível. Idem para monstros (`atributos_monstro`). |
| Sistema válido | Enum Prisma `Sistema { lunaria tresdet dnd5e daemon }` |
| Licenças | D&D 5e SRD CC-BY-4.0 (livre com atribuição), Daemon Licença Daemon (livre com atribuição), 3D&T (licença aberta pendente da Jambô — usar regras genéricas inspiradas, não copiar texto) |

---

## 3. Modelo de Dados

### 3.1 Nova coluna `sistema` em tabelas existentes

Tipo do campo: `sistema Sistema @default(lunaria)` (enum Prisma).

```prisma
enum Sistema {
  lunaria
  tresdet
  dnd5e
  daemon
}
```

Tabelas que ganham coluna `sistema`:

- `historias` — fonte de verdade para a história (NÃO `sessoes_jogo` — sessões herdam via `historia_id` FK)
- `personagens` — herdado de `historia.sistema` na criação
- `habilidades_magias` — catálogo filtrado por sistema
- `classes` — catálogo filtrado por sistema
- `racas` — catálogo filtrado por sistema
- `equipamentos` — catálogo filtrado por sistema
- `vantagens` — catálogo filtrado por sistema
- `desvantagens` — catálogo filtrado por sistema
- `monstros` — catálogo filtrado por sistema

### 3.2 Unique constraints atualizadas

Tabelas de catálogo mudam unique para incluir `sistema`:

| Tabela | Unique atual | Novo unique |
|---|---|---|
| `habilidades_magias` | `@@unique([nome])` | `@@unique([nome, sistema])` |
| `classes` | `@unique` em `nome` | `@@unique([nome, sistema])` |
| `racas` | `@unique` em `nome` | `@@unique([nome, sistema])` |
| `vantagens` | `@unique` em `nome` | `@@unique([nome, sistema])` |
| `desvantagens` | `@unique` em `nome` | `@@unique([nome, sistema])` |
| `monstros` | `@unique` em `nome` | `@@unique([nome, sistema])` |
| `equipamentos` | **sem unique em nome** | `@@unique([nome, sistema])` (novo) |

Exemplo: pode existir "Guerreiro" no Lunaria E "Guerreiro" no D&D 5e.

**Migração de seeds:** Todos os seeds que usam `upsert({ where: { nome } })` devem ser atualizados para `upsert({ where: { nome_sistema: { nome, sistema } } })`. Ordem: (1) adicionar coluna `sistema` com default `'lunaria'`, (2) alterar unique constraints, (3) atualizar seeds.

### 3.3 Tabelas de vínculo (hm_classe, hm_raca, hm_personagem)

Não precisam de coluna `sistema` — herdam via FK. Se a habilidade é do sistema 3D&T, o vínculo é implicitamente 3D&T.

**`hm_slots_classe` é Lunaria-only.** 3D&T e D&D lidam com magia de formas diferentes:
- **3D&T:** PM = R × 5 se tem vantagem Magia. Não usa slots.
- **D&D 5e:** Spell slots por nível por classe (tabela 9 colunas no SRD). Armazenados em `stats_sistema` JSON ou na engine `constants.js`.
- **Lunaria:** Usa `hm_slots_classe` como hoje.

**3D&T: personagens sem classe/raça.** 3D&T é classless/raceless. Personagens 3D&T terão `classe_id = null` e `raca_id = null`. Suas habilidades/vantagens são gerenciadas pela engine 3D&T, não via `hm_classe`/`hm_raca`.

### 3.4 Tabela `atributos_personagem` (nova — substitui colunas hardcoded)

Dropar as 6 colunas de atributo (`forca`, `destreza`, `constituicao`, `inteligencia`, `agilidade`, `carisma`) da tabela `personagens`. Substituir por tabela flexível:

```prisma
model atributos_personagem {
  id              Int         @id @default(autoincrement())
  personagem_id   Int
  nome            String      // "forca", "F", "STR", etc.
  valor           Int

  personagens personagens @relation(fields: [personagem_id], references: [id], onDelete: Cascade)

  @@unique([personagem_id, nome])
  @@index([personagem_id])
}
```

Exemplos:

| personagem_id | nome | valor |
|---|---|---|
| 1 (Lunaria) | forca | 14 |
| 1 (Lunaria) | destreza | 12 |
| 1 (Lunaria) | constituicao | 10 |
| 2 (3D&T) | F | 3 |
| 2 (3D&T) | H | 4 |
| 2 (3D&T) | R | 2 |
| 3 (D&D) | STR | 16 |
| 3 (D&D) | DEX | 14 |

Cada engine define quais atributos existem via `getAtributosBase()` e busca via `getAtributo(personagem, 'forca')`.

**Migração:** Script para mover valores das 6 colunas para `atributos_personagem` dos personagens existentes, depois dropar as colunas.

### 3.5 Tabela `atributos_monstro` (nova — idem para monstros)

Mesma estrutura que `atributos_personagem`, aplicada a monstros:

```prisma
model atributos_monstro {
  id          Int     @id @default(autoincrement())
  monstro_id  Int
  nome        String
  valor       Int

  monstros monstros @relation(fields: [monstro_id], references: [id], onDelete: Cascade)

  @@unique([monstro_id, nome])
  @@index([monstro_id])
}
```

**Migração:** Script para mover valores das 6 colunas (`forca`, `destreza`, `constituicao`, `inteligencia`, `agilidade`, `carisma`) para `atributos_monstro` dos monstros existentes, depois dropar as colunas.
```

### 3.6 Campo `stats_sistema` no personagem

```
stats_sistema JSON — dados adicionais específicos do sistema (não atributos)
```

Exemplos:

- **Lunaria:** `{ "esquiva_percent": 15, "mult_raca": 5 }`
- **3D&T:** `{ "tier": "lutador", "pontos_totais": 7 }`
- **D&D 5e:** `{ "spell_slots": { "1st": 2 }, "proficiency_bonus": 2, "hit_dice": "1d8", "subclass": "Champion" }`

### 3.7 Definição de `personagem.sistema`

- Na criação de personagem dentro de uma história: `personagem.sistema = historia.sistema` (automático)
- Na criação de personagem standalone (sem história): jogador escolhe o sistema
- Campo não editável após criação

### 3.8 Tabelas Lunaria-only (sem coluna `sistema`)

`receitas`, `ferramentas`, `ingredientes` são Lunaria-only no MVP. Não ganham coluna `sistema` — referenciam apenas entradas Lunaria nos catálogos.

---

## 4. Arquitetura das Game Engines

### 4.1 Estrutura de pastas

```
backend/game-systems/
  index.js              — registry: getEngine(sistema) -> engine
  interface.js          — contrato que toda engine deve seguir
  lunaria/
    combatEngine.js     — resolução de combate Lunaria
    characterEngine.js  — criação, progressão, level up
    testEngine.js       — testes/skill checks
    constants.js        — atributos, fórmulas, limites
    prompts/regras.js   — prompt de regras para Mestre IA
  tresdet/
    combatEngine.js     — FA vs FD, d6
    characterEngine.js  — pontos, características 0-5
    testEngine.js       — H + d6 vs dificuldade
    constants.js
    prompts/regras.js
  dnd5e/
    combatEngine.js     — d20+prof+mod vs AC, spell slots
    characterEngine.js  — classe+raça+background, ASI
    testEngine.js       — d20+mod+prof vs DC, advantage
    constants.js
    prompts/regras.js
```

### 4.2 Interface comum (contrato)

```javascript
// Combate
resolverAtaque(atacante, defensor, acao)    -> { acertou, dano, critico, detalhes }
resolverDefesa(defensor, acao)              -> { danoReduzido, detalhes }
calcularIniciativa(personagem)              -> number
resolverTeste(personagem, atributo, dc)     -> { sucesso, rolagem, detalhes }

// Personagem
calcularHP(personagem)                      -> number
calcularMP(personagem)                      -> number
calcularAtaque(personagem)                  -> number
calcularDefesa(personagem)                  -> number
getAtributosBase()                          -> [{ id, nome, sigla, min, max }]
getAtributo(personagem, nome)               -> number  // busca em atributos_personagem
getModificador(personagem, nome)            -> number  // calcula mod (ex: floor((val-10)/2) para D&D)
getProgressaoNivel(nivel)                   -> { bonuses }

// Wizard
getWizardStages()                           -> [{ id, titulo, component }]
validarCriacao(dados)                       -> { valido, erros }

// Mestre IA
getRegrasMestrePrompt()                     -> string
```

### 4.3 Registry

```javascript
import lunariaEngine from './lunaria/index.js';
import tresdetEngine from './tresdet/index.js';
import dnd5eEngine from './dnd5e/index.js';

const engines = { lunaria: lunariaEngine, tresdet: tresdetEngine, dnd5e: dnd5eEngine };

export function getEngine(sistema) {
  const engine = engines[sistema];
  if (!engine) throw new Error(`Sistema desconhecido: ${sistema}`);
  return engine;
}
```

### 4.4 Integração com código existente

O `combateHelper.js` atual é refatorado:

- Lógica específica Lunaria vai para `game-systems/lunaria/combatEngine.js`
- O combateHelper vira um dispatcher: `const engine = getEngine(personagem.sistema); engine.resolverAtaque(...)`

Idem para `personagensHelper.js`, `testeHelper.js`, `ownedActionsHelper.js`, `turnStateBuilder.js`.

---

## 5. 3D&T Alpha — Mecânicas

### 5.1 Atributos (Características)

| Característica | Sigla | Range | Função |
|---|---|---|---|
| Força | F | 0-5 | Dano corpo a corpo, carregar peso |
| Habilidade | H | 0-5 | Acerto, esquiva, iniciativa, perícias |
| Resistência | R | 0-5 | HP (R×5), PM (R×5) |
| Armadura | A | 0-5 | Defesa, absorção de dano |
| Poder de Fogo | PdF | 0-5 | Dano à distância, ataques mágicos |

### 5.2 Criação

- Pontos por tier: Novato=6, Lutador=7, Campeão=8, Lenda=10, Herói=15
- 1 ponto = 1 rank em característica OU 1 vantagem de custo 1
- Desvantagens devolvem pontos (limite por tier)
- Sem classes — tudo point-buy
- Magia é vantagem comprada (Branca, Negra ou Elemental)

### 5.3 Combate

```
FA (melee)  = F + H + 1d6
FA (ranged) = PdF + H + 1d6
FD          = A + H + 1d6
Dano        = FA - FD (se positivo)
HP          = R × 5
PM          = R × 5 (se tem Magia)
Iniciativa  = 1d6 + H
```

### 5.4 Testes

```
Simples:    1d6 ≤ característica -> sucesso
Difícil:    1d6 ≤ característica - 1
Fácil:      automático se característica ≥ 1
Oposto:     ambos rolam 1d6 + característica, maior vence
```

### 5.5 Vantagens base

Magia Branca (1pt), Magia Negra (1pt), Magia Elemental (1pt), Ataque Especial (1pt), Arena (1pt), Gênio (1pt), Membros Elásticos (1pt), Voo (1pt), Tiro Múltiplo (2pts), Ataque Múltiplo (2pts)

### 5.6 Desvantagens base

Código de Honra (-1pt), Maldição (-1pt), Modelo Especial (-1pt), Inculto (-1pt)

### 5.7 Wizard Stages

1. **boas_vindas** — nome
2. **conceito** — descrição (sem raça/classe)
3. **caracteristicas** — distribui F/H/R/A/PdF
4. **vantagens** — compra com pontos
5. **desvantagens** — devolve pontos
6. **equipamentos** — Mestre IA sugere
7. **magias** — se comprou Magia, escolhe spells
8. **resumo**

---

## 6. D&D 5e — Mecânicas (SRD)

### 6.1 Atributos

| Atributo | Range | Modifier |
|---|---|---|
| STR, DEX, CON, INT, WIS, CHA | 3-20 | floor((score-10)/2) |

### 6.2 Criação

- Standard Array (15/14/13/12/10/8) ou Point Buy (27 pontos)
- Race + Class + Background
- Raças SRD: Human, Elf, Dwarf, Halfling, Gnome, Half-Elf, Half-Orc, Tiefling, Dragonborn
- Classes SRD (12): Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard
- Proficiency bonus: +2 (nv1) a +6 (nv17+)

### 6.3 Combate

```
Ataque:     d20 + ability mod + proficiency ≥ AC
AC:         10 + DEX mod + armor bonus
Dano:       weapon die + ability mod
HP:         hit die + CON mod (por nível)
Iniciativa: d20 + DEX mod
Spell DC:   8 + spellcasting mod + proficiency
Crítico:    nat 20 = dobra dados de dano
```

### 6.4 Spell Slots (full caster)

| Nível | 1st | 2nd | 3rd | 4th | 5th | 6th | 7th | 8th | 9th |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 2 | - | - | - | - | - | - | - | - |
| 5 | 4 | 3 | 2 | - | - | - | - | - | - |
| 10 | 4 | 3 | 3 | 3 | 2 | - | - | - | - |
| 20 | 4 | 3 | 3 | 3 | 3 | 2 | 2 | 1 | 1 |

### 6.5 Testes

```
d20 + ability mod + proficiency (se proficient) ≥ DC
Advantage: 2d20, usa maior
Disadvantage: 2d20, usa menor
```

### 6.6 Death Saves

HP=0 -> inconsciente. Cada turno: d20. ≥10=sucesso, <10=falha. 3 sucessos=estabiliza, 3 falhas=morte. Nat 1=2 falhas. Nat 20=volta com 1 HP.

### 6.7 Wizard Stages

1. **boas_vindas** — nome
2. **raca** — 9 raças SRD + bonuses
3. **classe** — 12 classes + hit die + proficiencies
4. **background** — 6 backgrounds SRD
5. **atributos** — Standard Array ou Point Buy
6. **skills** — proficiências
7. **equipamentos** — starting equipment
8. **spells** — se caster, cantrips + spells
9. **resumo**

### 6.8 Licença

SRD 5.1 CC-BY-4.0. Livre uso comercial com atribuição. Inclui mecânicas core, 9 raças, 1 subclass/classe, ~400 spells, ~300 monstros. Exclui Product Identity (Vigia Abissal, Sorvedor de Mentes, etc).

---

## 7. Mestre IA

### 7.1 Prompt de regras por sistema

Cada engine implementa `getRegrasMestrePrompt()` que retorna instruções para a IA sobre:

- Atributos e como funcionam
- Resolução de ataques e testes
- Magia/habilidades
- Terminologia correta
- Formato de resposta para parser

### 7.2 Integração

`backend/agents/Mestre/contexto/mestreContextBuilder.js` injeta o prompt de regras baseado em `historia.sistema`:

```javascript
const engine = getEngine(historia.sistema);
const regrasPrompt = engine.getRegrasMestrePrompt();
```

### 7.3 Geração de roteiro

O roteiro é gerado com contexto do sistema. Se o jogador quiser trocar o sistema da história, os personagens existentes dessa história são arquivados (marcados como `ativo: false`) e novos personagens devem ser criados no novo sistema. Não há conversão automática.

### 7.4 MVP: sem combate misto

No MVP, todos os personagens de uma história usam `historia.sistema`. `personagem.sistema` é setado automaticamente. Combate misto (personagens de sistemas diferentes) fica como feature futura.

---

## 8. Impacto no Código

### 8.1 Novos

- `backend/game-systems/` — engines, interfaces, prompts
- Enum `Sistema` + coluna `sistema` em 9 tabelas
- Tabelas `atributos_personagem` e `atributos_monstro`
- Seeds para catálogos 3D&T e D&D 5e
- Frontend: seletor de sistema, wizard stages, ficha por sistema

### 8.2 Modificados

- `combateHelper.js` → dispatcher via getEngine() + refatorar acesso a atributos (de `personagem.forca` para `engine.getAtributo(personagem, 'forca')`)
- `personagensHelper.js` → dispatcher + carregar atributos de `atributos_personagem`
- `testeHelper.js` → dispatcher via getEngine()
- `ownedActionsHelper.js` → filtrar por sistema
- `turnStateBuilder.js` → montar por sistema
- `bonusHelper.js` → refatorar acesso a atributos
- `evolucaoHelper.js` → refatorar acesso a atributos
- Wizard: `stagePolicy.js`, `MestreCriadorAgent.js`, prompts
- Queries de catálogo → WHERE sistema = ?
- Rotas de catálogo → ?sistema=x
- Seeds existentes → atualizar upsert para usar `{ nome, sistema }`

### 8.3 Não afetados

- Auth, usuários, amizades, feed, chat, websocket infra
- Sistema de imagens
- BullMQ, Redis, Socket.io

---

## 9. Ordem de Implementação

1. Schema: enum Sistema, coluna `sistema` em 9 tabelas, unique constraints atualizadas
2. Schema: criar `atributos_personagem` e `atributos_monstro`, migrar dados, dropar colunas hardcoded
3. Atualizar seeds existentes (upsert com `{ nome, sistema }`)
4. Refatorar acesso a atributos em todo o backend (`personagem.forca` → `getAtributo(personagem, 'forca')`)
5. Criar `backend/game-systems/` com registry, interface e engine Lunaria (extrair do código atual)
6. Refatorar helpers para usar dispatcher `getEngine(sistema)`
7. 3D&T engine (combat, character, test)
8. 3D&T catálogos (seeds vantagens, desvantagens, monstros)
9. 3D&T wizard (stages específicos)
10. 3D&T frontend (ficha, combate, seletores)
11. Testar 3D&T end-to-end
12. D&D 5e (repetir 7-11)

---

## 10. Fora de Escopo (futuro)

- Daemon (aguarda definição de licença e demanda)
- Combate misto (personagens de sistemas diferentes na mesma história)
- Conversão de personagem entre sistemas
- Editor de sistema custom (jogador cria suas próprias regras)
- Multiclassing D&D 5e (MVP: single class)
