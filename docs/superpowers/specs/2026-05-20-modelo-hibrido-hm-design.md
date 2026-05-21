# Modelo Híbrido do Sistema H&M (Habilidades & Magias) — Design Spec

**Data:** 2026-05-20
**Status:** Aprovado — REFERÊNCIA CANÔNICA
**Escopo:** Fechar o modelo de dados e o contrato de engines do sistema "Habilidades
& Magias" (prefixo `hm_`) de forma híbrida entre os sistemas de RPG suportados.
**Roadmap:** Passo 3.0 da Fase 3 do roadmap de saneamento. Destrava 3.3 (implementação
das engines) e 3.4.

---

## 0. Status de superseding

Esta spec é a **referência canônica** do sistema H&M. Ela **SUPERSEDE** os pontos
conflitantes das duas specs anteriores:

- **`2026-03-21-sistema-habilidades-magias-design.md`** — superseded nas seções:
  - **§2, linha "Tabela separada para magias? → Não"** — falso para 3D&T. 3D&T usa
    `magias_tresdet` (tabela própria). `habilidades_magias` é o catálogo apenas de
    Lunaria e D&D 5e.
  - **§3.1 "Campos `classe_id` e `raca_id` deprecados"** — a decisão de `raca_id` é
    redefinida nesta spec (§6.1): `raca_id` fica **legado mantido por
    compatibilidade**, não removido em sprint futuro sem migração.
  - **§3.2 "Nova tabela opcional: `hm_raca`"** — `hm_raca` **não é opcional**: é a
    **fonte de verdade** das habilidades raciais (§3.4 desta spec).
  - **§3.4 / §3.5 / §6 (slots, `pode_magia`, vantagens-slots)** — `hm_slots_classe`,
    progressão por slots e bônus de slots de vantagem são **Lunaria-only**. D&D 5e
    no MVP não usa preparação/slots vancianos; 3D&T não usa slots.
  - **§4 "Wizard — etapa Grimório"** — o comportamento descrito vale para Lunaria.
    Cada sistema define seu próprio fluxo de wizard via `getWizardStages()` da engine.
- **`2026-03-23-3det-magia-integrada-design.md`** (a memória do roadmap se refere a
  esta spec; não existe arquivo `2026-03-23-engine-boundaries-tresdet.md` no repo) —
  superseded nas seções:
  - **§"Decisões Técnicas" e §"Parte 2: Conjuração"** — confirmadas, mas o **contrato
    comum** das engines (`getMagiasConhecidas`/`getMagiasDisponiveis`/`getSlotsInfo`)
    passa a ser definido aqui (§5), não disperso entre as duas specs.
  - **§"Parte 2: Conjuração em Combate"** — a semântica "sem slots, só PM" é mantida,
    mas formalizada como o contrato `getSlotsInfo()` retornando `usaSlots: false`
    para 3D&T (§5.4).

As duas specs antigas receberam no topo a nota
`⚠️ Superseded by 2026-05-20-modelo-hibrido-hm-design.md`.

---

## 1. Problema

Duas specs aprovadas com 2 dias de diferença se contradiziam:

- `2026-03-21-sistema-habilidades-magias-design.md`: "catálogo unificado, **sem**
  tabela separada para magias".
- `2026-03-23-3det-magia-integrada-design.md`: magias de 3D&T vivem em
  `magias_tresdet`, tabela **própria e separada**.

O código de produção seguiu a spec de 23/03 (`magias_tresdet` +
`personagem_magia_tresdet` existem e estão populadas). As specs nunca foram
reconciliadas. Sem uma referência canônica, o passo 3.3 (implementação das engines
de magia) não sabe qual contrato seguir.

**Razão da divergência (legítima):** cada sistema de RPG digere magia de forma
estruturalmente diferente:

- **Lunaria** — magia por escola + nível, custo de mana, progressão por **slots de
  classe** (`hm_slots_classe`) e auto-escalamento por nível (`escalamento`).
- **D&D 5e** — magia por escola + nível. No MVP, entrega apenas magias
  **"conhecidas"** (sem preparação diária, sem slots vancianos).
- **3D&T Alpha** — magia por **Focus** elemental, custo em **PM**, **sem slots e sem
  níveis de magia**. Mecânica estruturalmente incompatível com `habilidades_magias`.

Forçar todos no mesmo schema (catálogo unificado puro) ou separar tudo (uma tabela
por sistema) são extremos ruins. A solução é **híbrida**.

---

## 2. Decisão: modelo HÍBRIDO

| Eixo | Decisão |
|---|---|
| Catálogo de Lunaria + D&D 5e | `habilidades_magias`, **uma linha por sistema**, discriminada pela coluna `sistema` |
| Catálogo de 3D&T | `magias_tresdet` — **tabela própria**, mecânica de Focus/PM |
| Vínculo classe ↔ habilidade (Lunaria/D&D) | `hm_classe` (N:N) |
| Vínculo raça ↔ habilidade racial (Lunaria/D&D) | `hm_raca` (N:N) — **fonte de verdade** |
| Vínculo personagem ↔ habilidade (Lunaria/D&D) | `hm_personagem` (N:N) |
| Vínculo personagem ↔ magia (3D&T) | `personagem_magia_tresdet` (N:N) |
| Slots de magia | `hm_slots_classe` — **Lunaria-only** |
| Escalamento automático por nível | coluna `escalamento` — **Lunaria-only** |
| Contrato comum | métodos da engine em `game-systems/<sistema>/` (§5), **não no schema** |

**Princípio.** O schema é deliberadamente heterogêneo: ele reflete a realidade de que
3D&T não cabe no mesmo molde de Lunaria/D&D. A **uniformidade** é obtida na camada de
engine — toda engine expõe `getMagiasConhecidas`, `getMagiasDisponiveis`,
`getSlotsInfo` com a **mesma assinatura** e tipos de retorno (§5), mesmo que a
implementação interna consulte tabelas diferentes. Quem consome a engine (combate,
wizard, ficha) não precisa saber em qual tabela a magia mora.

### 2.1 Decisões de produto fechadas

- **D&D 5e MVP** — entrega apenas magias **"conhecidas"** (`hm_personagem`). **Sem**
  preparação diária e **sem** slots vancianos. `getSlotsInfo()` da engine D&D 5e
  retorna `usaSlots: false` no MVP. Preparação/slots ficam fora de escopo (§8).
- **3D&T** — conjura **só por PM**, **sem slots**. `getSlotsInfo()` da engine 3D&T
  retorna `usaSlots: false`. A limitação de uso é o PM disponível, validado pela
  `combatEngine` de 3D&T (`parseCustoPM` já existe).
- **`hm_raca` é a fonte de verdade** das habilidades raciais (Lunaria/D&D). A coluna
  legada `habilidades_magias.raca_id` deixa de ser fonte de verdade (§6.1).
- **Lunaria** — único sistema que usa `hm_slots_classe`. `getSlotsInfo()` da engine
  Lunaria retorna `usaSlots: true` com a progressão real.
- **Migração de personagens antigos** — personagens muito antigos serão deletados; o
  critério de corte é definido na execução do passo de migração (Fase 3), não nesta
  spec.

---

## 3. Schema real em produção

Documentado a partir de `backend/prisma/schema.prisma` e da migration baseline
`backend/prisma/migrations/0_init/migration.sql` (Fase 1). Este é o estado **já
aplicado em produção** — a spec descreve o que existe, não o que será criado.

### 3.0 Enum `Sistema` (`schema.prisma:10-15`)

```prisma
enum Sistema {
  lunaria
  tresdet
  dnd5e
  daemon // TODO: not yet implemented
}
```

### 3.1 `habilidades_magias` — catálogo de Lunaria + D&D 5e (`schema.prisma:593-635`)

Catálogo de habilidades e magias dos sistemas baseados em **escola + nível**. Uma
linha por `(nome, sistema)`. Colunas relevantes:

- `id`, `nome VARCHAR(100)`, `descricao TEXT`, `descricao`
- `custo_mana INT @default(0)`, `dano_base`, `tipo @default('dano')`, `elemento`
- `nivel_requerido INT @default(1)`, `cooldown_turnos INT @default(0)`
- `classe_id INT?` — FK legada → `classes` (`ON DELETE SET NULL`)
- `raca_id INT?` — FK legada → `racas` (`ON DELETE SET NULL`) — ver §6.1
- `escola_magia VARCHAR(30)?` — **discriminador magia vs técnica**:
  `escola_magia IS NOT NULL AND escola_magia != 'nenhuma'` ⇒ magia; senão ⇒ técnica
  de combate.
- `escalamento JSONB?` — upgrades automáticos por nível (**Lunaria-only**)
- `categoria @default('combate_fisico')`, `efeito JSONB?`, `area_efeito JSONB?`
- `pre_requisito JSONB?`, `componente_material JSONB?`, `saving_throw VARCHAR(30)?`
- `usos_por_descanso INT?`, `tempo_conjuracao`, `usa_concentracao`, `alvo`, `alcance`
- `imagem VARCHAR(500)?`
- `sistema Sistema @default(lunaria)` — discrimina Lunaria vs D&D 5e
- **Unique:** `@@unique([nome, sistema])` (`habilidades_magias_nome_sistema_key`)
- **Índices:** `classe_id`, `nivel_requerido`, `raca_id`, `categoria`, `escola_magia`,
  `nome`
- **Relações:** `classe`, `raca`, `hm_classe[]`, `hm_raca[]`, `hm_personagem[]`,
  `receitas[]`

> A unique `[nome, sistema]` é o que permite a mesma habilidade existir como linha
> Lunaria **e** linha D&D 5e independentes. Mudanças em `habilidades_magias` **não
> podem quebrar** nenhum dos dois sistemas (regra multi-sistema do `backend/CLAUDE.md`).

### 3.2 `magias_tresdet` — catálogo de 3D&T (`schema.prisma:476-494`)

Tabela **própria** de magias do 3D&T. Mecânica de Focus + PM, incompatível com
`habilidades_magias`:

- `id`, `nome VARCHAR(120) @unique`, `descricao`, `escola VARCHAR(50)`
- `custo_pm VARCHAR(50)` — string (ex.: `"3"`, `"1 a 5"`, `"2 PMs por turno"`),
  parseada por `parseCustoPM` da `tresdet/combatEngine.js`
- `alcance`, `duracao`, `tipo @default('dano')`, `exigencias VARCHAR(200)?`
- `focus_requisito JSONB?` — array de requisitos de Focus (ex.:
  `[{fogo: 2}, {luz: 1}]`, AND entre itens)
- `efeito JSONB?`, `nivel_minimo INT @default(1)`
- **Unique:** `nome` (`magias_tresdet_nome_key`) — **não** discrimina por sistema (a
  tabela é exclusiva de 3D&T)
- **Índices:** `escola`, `tipo`
- **Relação:** `personagem_magia_tresdet[]`

### 3.3 `hm_classe` — vínculo classe ↔ habilidade Lunaria/D&D (`schema.prisma:637-646`)

```prisma
model hm_classe {
  id            Int @id @default(autoincrement())
  habilidade_id Int   // FK → habilidades_magias, ON DELETE CASCADE
  classe_id     Int   // FK → classes, ON DELETE CASCADE
  @@unique([habilidade_id, classe_id])
  @@index([classe_id])
}
```

Define **quais classes acessam cada habilidade/magia** (Lunaria e D&D 5e). É a base
do filtro de `getMagiasDisponiveis` (§5.3).

### 3.4 `hm_raca` — vínculo raça ↔ habilidade racial Lunaria/D&D (`schema.prisma:648-657`)

```prisma
model hm_raca {
  id            Int @id @default(autoincrement())
  habilidade_id Int   // FK → habilidades_magias, ON DELETE CASCADE
  raca_id       Int   // FK → racas, ON DELETE CASCADE
  @@unique([habilidade_id, raca_id])
  @@index([raca_id])
}
```

**Fonte de verdade das habilidades raciais.** Toda habilidade racial de Lunaria/D&D
deve ter um registro aqui. A leitura de habilidades raciais (combate, ficha, wizard)
**deve** passar por `hm_raca`, não pela coluna legada `habilidades_magias.raca_id`.

### 3.5 `hm_personagem` — habilidades conhecidas pelo personagem Lunaria/D&D (`schema.prisma:659-670`)

```prisma
model hm_personagem {
  id            Int      @id @default(autoincrement())
  personagem_id Int       // FK → personagens, ON DELETE CASCADE
  habilidade_id Int       // FK → habilidades_magias, ON DELETE CASCADE
  origem        String   @default("criacao")  // "criacao" | "npc" | "vantagem" | "racial"
  created_at    DateTime @default(now())
  @@unique([personagem_id, habilidade_id])
  @@index([personagem_id])
}
```

O **nível da magia conhecida = nível do personagem**: não há campo de nível no
vínculo. Os upgrades ativos saem de `escalamento` filtrado pelo nível do personagem.

### 3.6 `hm_slots_classe` — progressão de slots por classe/nível — **Lunaria-only** (`schema.prisma:672-680`)

```prisma
model hm_slots_classe {
  id        Int @id @default(autoincrement())
  classe_id Int  // FK → classes, ON DELETE CASCADE
  nivel     Int  // 1-20
  slots     Int @default(0)
  @@unique([classe_id, nivel])
}
```

Consultada por nível exato. Ausência de linha ⇒ 0 slots. **Só Lunaria a usa** — D&D
5e (MVP) e 3D&T ignoram esta tabela.

### 3.7 `personagem_magia_tresdet` — magias conhecidas pelo personagem 3D&T (`schema.prisma:990-1003`)

```prisma
model personagem_magia_tresdet {
  id               Int      @id @default(autoincrement())
  personagem_id    Int       // FK → personagens, ON DELETE CASCADE
  magia_tresdet_id Int       // FK → magias_tresdet, ON DELETE CASCADE
  origem           String   @default("criacao")  // "criacao" | "npc" | "evento"
  created_at       DateTime @default(now())
  @@unique([personagem_id, magia_tresdet_id])
  @@index([personagem_id])
}
```

Equivalente de 3D&T ao `hm_personagem`. **Não pode** ser fundida com `hm_personagem`:
esta tem FK para `habilidades_magias` (catálogo Lunaria/D&D), incompatível com
`magias_tresdet`.

### 3.8 `racas.pode_magia` (`schema.prisma:255`)

`pode_magia Boolean @default(true)` — raças sem aptidão mágica (Orc, Golem) têm
`false`, ignorando slots de magia em Lunaria.

### 3.9 Mapa de tabelas por sistema

| Conceito | Lunaria | D&D 5e | 3D&T |
|---|---|---|---|
| Catálogo de magias/habilidades | `habilidades_magias` (`sistema=lunaria`) | `habilidades_magias` (`sistema=dnd5e`) | `magias_tresdet` |
| Classe → habilidade | `hm_classe` | `hm_classe` | — (3D&T não tem classes formais) |
| Raça → habilidade racial | `hm_raca` | `hm_raca` | — |
| Personagem → conhecidas | `hm_personagem` | `hm_personagem` | `personagem_magia_tresdet` |
| Slots por nível | `hm_slots_classe` | — (MVP) | — |
| Escalamento por nível | `escalamento` (JSONB) | — (MVP) | — |
| Custo de conjuração | `custo_mana` (mana) | `custo_mana` (interpretação D&D na engine) | `custo_pm` (PM, string) |

---

## 4. Estado atual do código (investigação)

Levantamento feito para fundamentar as decisões de §6. Relevante para 3.3.

### 4.1 Engines (`game-systems/`)

- `game-systems/interface.js` — contrato JSDoc `GameEngine`. **Não declara** ainda os
  três métodos de magia (`getMagiasConhecidas`/`getMagiasDisponiveis`/`getSlotsInfo`).
  O passo 3.3 deve adicioná-los ao typedef.
- `game-systems/lunaria/index.js`, `tresdet/index.js`, `dnd5e/index.js` — agregam
  sub-engines. **Nenhum** expõe ainda os três métodos de magia.
- `tresdet/combatEngine.js` já tem `parseCustoPM` e `processarDescansoTresDet`
  (PM/descanso 3D&T).

### 4.2 Models (`Model/`)

- `HabilidadeMagia.js` — métodos `findByClasse`, `findByRaca`, `findPaginated`,
  `findByCategoria`, `findByEscolaMagia`, etc. **Ainda consultam a coluna legada
  `raca_id`** (ver §4.4) e os `classe_id`/`raca_id` diretos, **não** `hm_classe`/`hm_raca`.
- `HmClasse.js` — `findByClasse`, `findByHabilidade`, `vincular`, `desvincular`. Pronto.
- `HmRaca.js` — `findByRaca` + upsert. Pronto. Tabela `hm_raca` ainda precisa ser
  populada (passo de migração da Fase 3).
- `HmPersonagem.js` — `findByPersonagem`, `aprender`, `desaprender`, `contarMagias`.
  Pronto.
- `HmSlotsClasse.js` — `getSlots(classeId, nivel)`, `getProgressao(classeId)`. Pronto.

### 4.3 Controllers e rotas

- `controllers/habilidades-magias/habilidadesMagiasController.js` — controller
  **ativo**. Tem `obterSlots` (usa `HmSlotsClasse.getSlots`) e `obterDisponiveis`
  (usa `HmClasse.findByClasse`, filtra por nível e `escola_magia`).
- `routes/habilidades-magias.js` — router ativo. Expõe `GET /slots`, `GET
  /disponiveis`, CRUD.
- `routes/index.js:126-127` — **dois mounts para o mesmo router**:
  `/habilidades` e `/habilidades-magias`.
- **Órfãos (não importados em lugar nenhum):** `controllers/habilidades/`
  (cópia desatualizada — sem `obterSlots`/`obterDisponiveis`) e `routes/habilidades.js`.
  Ver §6.2.

### 4.4 Quem usa `habilidades_magias.raca_id` hoje

- `Model/HabilidadeMagia.js:56-62` — `findByRaca(raca_id)` filtra
  `where: { raca_id, sistema }`.
- `Model/HabilidadeMagia.js:42-54` — `findByClasse` usa `{ classe_id: null, raca_id:
  null }` para identificar habilidades **universais** (excluir as raciais do conjunto
  de classe).
- `Model/HabilidadeMagia.js:78-94` — `findPaginated` aceita filtro `raca_id`.
- `controllers/personagem/personagemController.js:225` — monta as habilidades do
  personagem chamando `HabilidadeMagia.findByRaca(personagemData.raca_id)`.
- `controllers/habilidades-magias/habilidadesMagiasController.js:49,62,123,137` —
  CRUD e listagem aceitam `raca_id` (escrita e filtro).
- Frontend: `HabilidadeMagiaService.js` consome `/habilidades` (ver §6.2), incluindo
  o filtro `raca_id` de listagem do admin.

**Conclusão:** `raca_id` ainda é a fonte de verdade *de facto* (a coluna está
populada; `hm_raca` está vazia). A migração para `hm_raca` é trabalho da Fase 3, não
desta spec.

---

## 5. Contrato das engines de magia (para o passo 3.3)

O passo 3.3 deve implementar **três métodos** em cada engine de
`game-systems/<sistema>/` e adicioná-los ao typedef `GameEngine` de `interface.js`.
Os três métodos têm **assinatura e formato de retorno idênticos** entre sistemas; só
a implementação interna (qual tabela consultar) varia.

> Convenção de camada: as engines são lógica de domínio pura. Elas **recebem** dados
> já carregados ou recebem o acesso a Model via parâmetro — seguem o padrão de
> `combatEngine` (recebe `personagem`, não consulta Prisma direto). A orquestração de
> I/O (chamar `HmPersonagem`, `HmClasse`, `HmSlotsClasse`, `personagem_magia_tresdet`)
> fica no **Service** que chama a engine. Decisão de granularidade exata (engine pura
> vs. engine recebe `db`) fica para o 3.3 seguir o padrão já existente nas sub-engines
> daquele sistema — mas o **contrato de retorno abaixo é obrigatório**.

### 5.1 Tipos de retorno

```js
/**
 * @typedef {Object} MagiaConhecida
 * @property {number} id            — id no catálogo do sistema
 * @property {'habilidades_magias'|'magias_tresdet'} fonte — tabela de origem
 * @property {string} nome
 * @property {string} tipo          — 'magia' | 'tecnica'
 * @property {string|null} escola   — escola_magia (Lunaria/D&D) ou escola (3D&T)
 * @property {number|string} custo  — custo_mana (number) ou custo_pm (string 3D&T)
 * @property {string} origem        — 'criacao' | 'npc' | 'vantagem' | 'racial' | 'evento'
 * @property {Object|null} upgradeAtivo — upgrade de escalamento ativo (Lunaria) ou null
 */

/**
 * @typedef {Object} SlotsInfo
 * @property {boolean} usaSlots     — true só para Lunaria
 * @property {number}  total        — total de slots no nível (0 se !usaSlots)
 * @property {number}  usados       — magias conhecidas que ocupam slot
 * @property {number}  livres       — total - usados
 * @property {string}  recurso      — 'slots' | 'mana' | 'pm'
 */
```

### 5.2 `getMagiasConhecidas(personagem)` — o que o personagem JÁ tem

Retorna `MagiaConhecida[]` — magias e técnicas que o personagem possui. Resolve os
bugs históricos (161 magias, habilidades de outras raças) porque lê apenas o vínculo
do personagem.

| Sistema | Implementação |
|---|---|
| **Lunaria** | `hm_personagem` JOIN `habilidades_magias` (`sistema=lunaria`). Para cada magia, resolve `upgradeAtivo` de `escalamento` filtrando pelo nível do personagem. `tipo` = `escola_magia ∉ {null,'nenhuma'}` ? `'magia'` : `'tecnica'`. |
| **D&D 5e** | `hm_personagem` JOIN `habilidades_magias` (`sistema=dnd5e`). `upgradeAtivo: null` (sem escalamento no MVP). Mesma regra de `tipo`. |
| **3D&T** | `personagem_magia_tresdet` JOIN `magias_tresdet`. `tipo: 'magia'` sempre; `custo` = `custo_pm` (string); `upgradeAtivo: null`. |

### 5.3 `getMagiasDisponiveis(personagem)` — o que o personagem PODE aprender

Retorna o subconjunto do catálogo que o personagem é elegível a aprender, **excluindo
o que já conhece**.

| Sistema | Implementação |
|---|---|
| **Lunaria** | `hm_classe` da classe do personagem ∪ habilidades raciais via `hm_raca` da raça; filtra `nivel_requerido <= nivel_personagem`; respeita `raca.pode_magia` para magias; aplica `escolas_extra` de vantagens. Remove o que já está em `hm_personagem`. |
| **D&D 5e** | `hm_classe` da classe (`sistema=dnd5e`) ∪ `hm_raca` da raça; filtra `nivel_requerido <= nivel_personagem`. Sem `escolas_extra` (fora do MVP). Remove o já conhecido. |
| **3D&T** | `magias_tresdet` cujo `focus_requisito` é satisfeito pelos Focus atuais do personagem (AND entre itens do array); filtra `nivel_minimo <= nivel`. Sem classe/raça. Remove o já conhecido. |

### 5.4 `getSlotsInfo(personagem)` — capacidade de magia

Retorna `SlotsInfo`. É o ponto onde o modelo híbrido fica explícito: só Lunaria tem
slots reais.

| Sistema | Retorno |
|---|---|
| **Lunaria** | `usaSlots: true`, `recurso: 'slots'`. `total` = `hm_slots_classe.getSlots(classe_id, nivel)` + Σ `vantagens.bonus.slots_magia_bonus`. `usados` = `HmPersonagem.contarMagias(personagem_id)`. `livres` = `total - usados`. |
| **D&D 5e** | `usaSlots: false`, `recurso: 'mana'`, `total: 0`, `usados: 0`, `livres: 0`. MVP só "conhecidas"; sem slots vancianos. |
| **3D&T** | `usaSlots: false`, `recurso: 'pm'`, `total: 0`, `usados: 0`, `livres: 0`. Limitação é PM disponível, validada na `combatEngine` (`parseCustoPM`). |

### 5.5 Quem consome o contrato

- **Wizard de criação** — etapa "Grimório" (Lunaria) / "Magias" (3D&T) usa
  `getMagiasDisponiveis` + `getSlotsInfo`.
- **Combate** — `ownedActionsHelper` / ActionDock usa `getMagiasConhecidas` para
  listar apenas o que o personagem tem.
- **Ficha** — painel de magias usa `getMagiasConhecidas`.

---

## 6. Decisões de schema resolvidas

### 6.1 Destino de `habilidades_magias.raca_id`

**Decisão: MANTER como coluna LEGADA, preenchida, por compatibilidade — NÃO deprecar
nem remover nesta fase.**

Racional:

1. `hm_raca` é a **fonte de verdade** das habilidades raciais (decisão de produto),
   **mas a tabela `hm_raca` está vazia** — a população é um passo de migração da
   Fase 3. Até lá, `raca_id` é a única fonte de fato.
2. `raca_id` tem **uso ativo não-trivial**: além de `findByRaca`, a coluna participa
   da identificação de habilidades **universais** em
   `HabilidadeMagia.findByClasse` (`{ classe_id: null, raca_id: null }`). Remover a
   coluna quebra essa query — não é um simples "campo morto".
3. O `backend/CLAUDE.md` exige que mudanças em entidades multi-sistema não quebrem
   nenhum sistema; dropar a coluna sem antes migrar leitura para `hm_raca` em todos os
   call sites é arriscado dentro do freeze de saneamento.

**Plano (a executar no 3.3/migração da Fase 3, fora do escopo desta spec):**

- A coluna `raca_id` permanece no schema, **populada**, marcada como **legada** (não
  fonte de verdade).
- Toda **leitura nova** de habilidades raciais usa `hm_raca`
  (`HmRaca.findByRaca`). `personagemController.js:225` migra de
  `HabilidadeMagia.findByRaca(raca_id)` para `HmRaca.findByRaca(raca_id)`.
- `HabilidadeMagia.findByClasse` para de usar `raca_id IS NULL` como proxy de
  "universal"; o conceito de universal passa a ser derivado de `hm_classe`/`hm_raca`.
- Enquanto houver leitor de `raca_id`, a migração que popular `hm_raca` deve manter
  `raca_id` **sincronizada** (espelho), para rollback seguro.
- Remoção da coluna fica como **dívida explícita pós-saneamento** — só após zero
  leitores e validação do QA. Não entra na Fase 3.

> Isto **redefine** o §3.1 da spec de 2026-03-21, que dizia "remover em sprint
> futuro" de forma genérica: a remoção fica condicionada a zero leitores e migração
> completa, não a um sprint arbitrário.

### 6.2 Alias de rota `/habilidades`

**Decisão: MANTER `/habilidades` como alias deprecado de `/habilidades-magias`.
Confirmada a recomendação. Custo zero, não quebra o frontend.**

Racional:

1. `routes/index.js:126-127` monta o **mesmo** router (`habilidadesMagiasRoutes`) em
   `/habilidades` e `/habilidades-magias`. Não há divergência de comportamento.
2. O frontend **ainda depende do alias**: `frontend/src/services/HabilidadeMagiaService.js:6`
   tem `this.baseUrl = '/habilidades'`. Remover o mount `/habilidades` quebraria o
   serviço imediatamente.
3. Manter o alias é **zero-custo** (uma linha de `router.use`) e está dentro do freeze
   de features.

**Plano:**

- `routes/index.js:126` (`/habilidades`) permanece, com um comentário marcando-o como
  **alias deprecado** — manter até o frontend migrar `HabilidadeMagiaService.baseUrl`
  para `/habilidades-magias`.
- `/habilidades-magias` é a rota **canônica**. Toda rota/serviço novo usa ela.
- Migração do frontend (`HabilidadeMagiaService.js:6` → `/habilidades-magias`) e
  remoção do alias ficam como **dívida pós-saneamento**, fora do escopo da Fase 3.
- **Limpeza recomendada (baixo risco, opcional no 3.3):** os órfãos
  `controllers/habilidades/` e `routes/habilidades.js` não são importados por nada
  (confirmado por `grep`) e são cópias desatualizadas — podem ser **deletados** para
  evitar que alguém edite o controller errado. Decisão final do executor; não é
  bloqueante.

---

## 7. Critérios de aceite (para o QA validar após 3.3)

1. `game-systems/interface.js` declara `getMagiasConhecidas`, `getMagiasDisponiveis`,
   `getSlotsInfo` no typedef `GameEngine`.
2. As três engines (`lunaria`, `tresdet`, `dnd5e`) exportam os três métodos com o
   retorno do §5.1.
3. `getMagiasConhecidas` de Lunaria/D&D lê `hm_personagem`; de 3D&T lê
   `personagem_magia_tresdet`. Personagem sem vínculo retorna `[]`, nunca o catálogo
   inteiro.
4. `getSlotsInfo` retorna `usaSlots: true` só para Lunaria; `false` para D&D 5e e 3D&T.
5. Habilidades raciais são lidas via `hm_raca` (não `raca_id`) nos call sites novos.
6. `GET /habilidades/...` e `GET /habilidades-magias/...` continuam respondendo
   idêntico (alias preservado).
7. Multi-sistema: criar/ver personagem de Lunaria, D&D 5e e 3D&T — nenhum quebra ao
   listar magias.

---

## 8. Fora de escopo

- Preparação diária e slots vancianos de D&D 5e (pós-MVP).
- Sistema de NPCs vendedores de magia in-game.
- Remoção física da coluna `raca_id` e do alias `/habilidades` (dívida
  pós-saneamento, condicionada a zero leitores).
- Sistema `daemon` (enum existe, sistema não implementado).
- Critério de corte de personagens antigos na migração (definido na execução da
  Fase 3).
- Regeneração de mana (Lunaria) e itens mágicos 3D&T.
