# Multi-Sistema RPG — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multi-RPG-system support (Lunaria, 3D&T Alpha, D&D 5e) with isolated game engines per system.

**Architecture:** Game engine registry pattern. Each system implements a common interface (combat, character, test engines). Catalog tables gain `sistema` column. Character attributes move from hardcoded columns to flexible `atributos_personagem` table. Helpers become dispatchers via `getEngine(sistema)`.

**Tech Stack:** Node.js 22 + Express + Prisma (PostgreSQL) + Redis + Socket.io | React 19 + Vite + Zustand + Tailwind

**Spec:** `docs/superpowers/specs/2026-03-21-multi-sistema-rpg-design.md`

**Impact:** ~60+ files modified across backend and frontend. Divided into 3 incremental phases.

---

## Phase 1: Infrastructure (makes multi-system possible, Lunaria keeps working)

Phase 1 adds the `sistema` column, migrates attributes to flexible tables, creates the game-engine registry, and refactors all hardcoded attribute access. At the end of Phase 1, Lunaria works exactly as before but through the new multi-system architecture.

---

### Task 1: Schema — Enum Sistema + coluna sistema em tabelas

**Goal:** Add `Sistema` enum and `sistema` column to all catalog and entity tables. Update unique constraints to compound `[nome, sistema]`.

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Add the enum to the schema**

At the top of `backend/prisma/schema.prisma` (after `datasource db`), add:

```prisma
enum Sistema {
  lunaria
  tresdet
  dnd5e
  daemon
}
```

- [ ] **Step 2: BEFORE db push — Add `sistema` column via raw SQL with default**

**CRITICAL:** Adding a column with `@default(lunaria)` via `db push` works for new rows, but changing unique constraints simultaneously can cause issues. Add the column via raw SQL first so all existing rows get `'lunaria'`:

```bash
cd /opt/role-chat-game/backend
node -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  // Create the enum type first
  await p.\$executeRaw\`DO \$\$ BEGIN CREATE TYPE \"Sistema\" AS ENUM ('lunaria', 'tresdet', 'dnd5e', 'daemon'); EXCEPTION WHEN duplicate_object THEN null; END \$\$\`;

  // Add sistema column to each table with default 'lunaria'
  const tables = ['historias', 'personagens', 'habilidades_magias', 'classes', 'racas', 'equipamentos', 'vantagens', 'desvantagens', 'monstros'];
  for (const t of tables) {
    await p.\$executeRawUnsafe(\`ALTER TABLE \"\${t}\" ADD COLUMN IF NOT EXISTS sistema \"Sistema\" NOT NULL DEFAULT 'lunaria'\`);
    console.log('Added sistema to', t);
  }
  await p.\$disconnect();
})();
"
```

- [ ] **Step 3: BEFORE db push — Drop old unique constraints and create compound ones**

**CRITICAL:** The unique constraints must be changed via SQL BEFORE `prisma db push` to avoid data loss. The old `@unique` on `nome` alone must be replaced with `@@unique([nome, sistema])`.

```bash
cd /opt/role-chat-game/backend
node -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  // classes: drop @unique on nome, add @@unique([nome, sistema])
  await p.\$executeRaw\`ALTER TABLE classes DROP CONSTRAINT IF EXISTS classe_nome\`;
  await p.\$executeRaw\`CREATE UNIQUE INDEX IF NOT EXISTS classes_nome_sistema_key ON classes (nome, sistema)\`;
  console.log('classes: unique updated');

  // racas: drop @unique on nome, add @@unique([nome, sistema])
  await p.\$executeRaw\`ALTER TABLE racas DROP CONSTRAINT IF EXISTS raca_nome\`;
  await p.\$executeRaw\`CREATE UNIQUE INDEX IF NOT EXISTS racas_nome_sistema_key ON racas (nome, sistema)\`;
  console.log('racas: unique updated');

  // vantagens: drop @unique on nome, add @@unique([nome, sistema])
  await p.\$executeRaw\`ALTER TABLE vantagens DROP CONSTRAINT IF EXISTS habilidade_nome_key\`;
  await p.\$executeRaw\`CREATE UNIQUE INDEX IF NOT EXISTS vantagens_nome_sistema_key ON vantagens (nome, sistema)\`;
  console.log('vantagens: unique updated');

  // desvantagens: drop @unique on nome, add @@unique([nome, sistema])
  await p.\$executeRaw\`ALTER TABLE desvantagens DROP CONSTRAINT IF EXISTS desvantagens_nome_key\`;
  await p.\$executeRaw\`CREATE UNIQUE INDEX IF NOT EXISTS desvantagens_nome_sistema_key ON desvantagens (nome, sistema)\`;
  console.log('desvantagens: unique updated');

  // habilidades_magias: drop @@unique([nome]), add @@unique([nome, sistema])
  await p.\$executeRaw\`ALTER TABLE habilidades_magias DROP CONSTRAINT IF EXISTS habilidades_magias_nome_key\`;
  await p.\$executeRaw\`CREATE UNIQUE INDEX IF NOT EXISTS habilidades_magias_nome_sistema_key ON habilidades_magias (nome, sistema)\`;
  console.log('habilidades_magias: unique updated');

  // monstros: drop @unique on nome, add @@unique([nome, sistema])
  await p.\$executeRaw\`ALTER TABLE monstros DROP CONSTRAINT IF EXISTS monstros_nome_key\`;
  await p.\$executeRaw\`CREATE UNIQUE INDEX IF NOT EXISTS monstros_nome_sistema_key ON monstros (nome, sistema)\`;
  console.log('monstros: unique updated');

  // equipamentos: add NEW @@unique([nome, sistema]) — no existing unique on nome
  await p.\$executeRaw\`CREATE UNIQUE INDEX IF NOT EXISTS equipamentos_nome_sistema_key ON equipamentos (nome, sistema)\`;
  console.log('equipamentos: unique created');

  await p.\$disconnect();
})();
"
```

- [ ] **Step 4: Update the Prisma schema to match the DB state**

In `backend/prisma/schema.prisma`, update each model:

**`historias`** (line ~107): Add after `config`:
```prisma
  sistema             Sistema             @default(lunaria)
```

**`personagens`** (line ~169): Add after `agilidade`:
```prisma
  sistema             Sistema             @default(lunaria)
```

**`classes`** (line ~11): Replace `@unique(map: "classe_nome")` on `nome` with plain `@db.VarChar(100)`, and add at bottom:
```prisma
  sistema   Sistema @default(lunaria)
  @@unique([nome, sistema], map: "classes_nome_sistema_key")
```

**`racas`** (line ~213): Replace `@unique(map: "raca_nome")` on `nome` with plain `@db.VarChar(100)`, and add:
```prisma
  sistema   Sistema @default(lunaria)
  @@unique([nome, sistema], map: "racas_nome_sistema_key")
```

**`vantagens`** (line ~262): Replace `@unique(map: "habilidade_nome_key")` on `nome` with plain field, and add:
```prisma
  sistema   Sistema @default(lunaria)
  @@unique([nome, sistema], map: "vantagens_nome_sistema_key")
```

**`desvantagens`** (line ~27): Replace `@unique` on `nome` with plain field, and add:
```prisma
  sistema   Sistema @default(lunaria)
  @@unique([nome, sistema], map: "desvantagens_nome_sistema_key")
```

**`habilidades_magias`** (line ~512): Replace `@@unique([nome])` with:
```prisma
  sistema   Sistema @default(lunaria)
  @@unique([nome, sistema], map: "habilidades_magias_nome_sistema_key")
```

**`equipamentos`** (line ~76): Add:
```prisma
  sistema   Sistema @default(lunaria)
  @@unique([nome, sistema], map: "equipamentos_nome_sistema_key")
```

**`monstros`** (line ~339): Replace `@unique` on `nome` with plain `@db.VarChar(150)`, and add:
```prisma
  sistema   Sistema @default(lunaria)
  @@unique([nome, sistema], map: "monstros_nome_sistema_key")
```

- [ ] **Step 5: Run prisma db push + generate**

```bash
cd /opt/role-chat-game/backend
npx prisma db push
npx prisma generate
```

- [ ] **Step 6: Verify with a spot check**

```bash
cd /opt/role-chat-game/backend
node -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const c = await p.classes.findFirst();
  console.log('classes.sistema:', c?.sistema);
  const h = await p.historias.findFirst();
  console.log('historias.sistema:', h?.sistema);
  const m = await p.monstros.findFirst();
  console.log('monstros.sistema:', m?.sistema);
  await p.\$disconnect();
})();
"
```

All should print `lunaria`.

---

### Task 2: Schema — Tabelas atributos_personagem e atributos_monstro

**Goal:** Create flexible attribute tables, migrate existing data from 6 hardcoded columns, then drop the old columns.

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrate_atributos.js`

- [ ] **Step 1: Add new models to schema**

In `backend/prisma/schema.prisma`, add after the `personagens` model:

```prisma
model atributos_personagem {
  id              Int         @id @default(autoincrement())
  personagem_id   Int
  nome            String      @db.VarChar(50)
  valor           Int

  personagens personagens @relation(fields: [personagem_id], references: [id], onDelete: Cascade)

  @@unique([personagem_id, nome])
  @@index([personagem_id])
}
```

Add after the `monstros` model:

```prisma
model atributos_monstro {
  id          Int     @id @default(autoincrement())
  monstro_id  Int
  nome        String  @db.VarChar(50)
  valor       Int

  monstros monstros @relation(fields: [monstro_id], references: [id], onDelete: Cascade)

  @@unique([monstro_id, nome])
  @@index([monstro_id])
}
```

- [ ] **Step 2: Add reverse relations**

In the `personagens` model, add:
```prisma
  atributos_personagem  atributos_personagem[]
```

In the `monstros` model, add:
```prisma
  atributos_monstro     atributos_monstro[]
```

- [ ] **Step 3: Add `stats_sistema` JSON field**

In the `personagens` model, add:
```prisma
  stats_sistema         Json?
```

- [ ] **Step 4: Run prisma db push + generate (keep old columns for now)**

```bash
cd /opt/role-chat-game/backend
npx prisma db push
npx prisma generate
```

- [ ] **Step 5: Create migration script**

Create `backend/prisma/migrate_atributos.js`:

```javascript
/**
 * Migrates hardcoded attribute columns (forca, destreza, constituicao,
 * inteligencia, agilidade, carisma) from personagens and monstros into
 * the new atributos_personagem / atributos_monstro tables.
 *
 * Usage: node prisma/migrate_atributos.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ATTRS = ['forca', 'destreza', 'constituicao', 'inteligencia', 'agilidade', 'carisma'];

async function migratePersonagens() {
  const personagens = await prisma.personagens.findMany({
    select: { id: true, forca: true, destreza: true, constituicao: true, inteligencia: true, agilidade: true, carisma: true }
  });
  console.log(`Migrating ${personagens.length} personagens...`);

  let count = 0;
  for (const p of personagens) {
    const data = ATTRS.map(nome => ({
      personagem_id: p.id,
      nome,
      valor: p[nome] ?? 10,
    }));

    for (const row of data) {
      await prisma.atributos_personagem.upsert({
        where: { personagem_id_nome: { personagem_id: row.personagem_id, nome: row.nome } },
        create: row,
        update: { valor: row.valor },
      });
    }
    count++;
    if (count % 100 === 0) console.log(`  ${count}/${personagens.length}`);
  }
  console.log(`Done: ${count} personagens migrated.`);
}

async function migrateMonstros() {
  const monstros = await prisma.monstros.findMany({
    select: { id: true, forca: true, destreza: true, constituicao: true, inteligencia: true, agilidade: true, carisma: true }
  });
  console.log(`Migrating ${monstros.length} monstros...`);

  let count = 0;
  for (const m of monstros) {
    const data = ATTRS.map(nome => ({
      monstro_id: m.id,
      nome,
      valor: m[nome] ?? 10,
    }));

    for (const row of data) {
      await prisma.atributos_monstro.upsert({
        where: { monstro_id_nome: { monstro_id: row.monstro_id, nome: row.nome } },
        create: row,
        update: { valor: row.valor },
      });
    }
    count++;
    if (count % 100 === 0) console.log(`  ${count}/${monstros.length}`);
  }
  console.log(`Done: ${count} monstros migrated.`);
}

async function verify() {
  const pCount = await prisma.atributos_personagem.count();
  const mCount = await prisma.atributos_monstro.count();
  const pTotal = await prisma.personagens.count();
  const mTotal = await prisma.monstros.count();
  console.log(`\nVerification:`);
  console.log(`  atributos_personagem rows: ${pCount} (expected: ${pTotal * 6})`);
  console.log(`  atributos_monstro rows: ${mCount} (expected: ${mTotal * 6})`);
  if (pCount !== pTotal * 6) console.error('WARNING: personagem count mismatch!');
  if (mCount !== mTotal * 6) console.error('WARNING: monstro count mismatch!');
}

async function main() {
  await migratePersonagens();
  await migrateMonstros();
  await verify();
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 6: Run migration script**

```bash
cd /opt/role-chat-game/backend
node prisma/migrate_atributos.js
```

Verify output shows expected row counts.

- [ ] **Step 7: Drop old columns via SQL**

**Only after verifying migration data is correct:**

```bash
cd /opt/role-chat-game/backend
node -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const attrs = ['forca', 'destreza', 'constituicao', 'inteligencia', 'agilidade', 'carisma'];
  for (const attr of attrs) {
    await p.\$executeRawUnsafe(\`ALTER TABLE personagens DROP COLUMN IF EXISTS \"\${attr}\"\`);
    await p.\$executeRawUnsafe(\`ALTER TABLE monstros DROP COLUMN IF EXISTS \"\${attr}\"\`);
  }
  console.log('Dropped 6 attribute columns from personagens and monstros');
  await p.\$disconnect();
})();
"
```

- [ ] **Step 8: Update schema to remove old columns, run db push + generate**

Remove these 6 lines from the `personagens` model in `schema.prisma` (lines 178-183):
```
  forca                     Int?                     @default(10)
  inteligencia              Int?                     @default(10)
  carisma                   Int?                     @default(10)
  destreza                  Int?                     @default(10)
  constituicao              Int?                     @default(10)
  agilidade                 Int?                     @default(10)
```

Remove these 6 lines from the `monstros` model (lines 347-352):
```
  forca               Int                   @default(10)
  inteligencia        Int                   @default(8)
  destreza            Int                   @default(10)
  constituicao        Int                   @default(10)
  agilidade           Int                   @default(10)
  carisma             Int                   @default(5)
```

```bash
cd /opt/role-chat-game/backend
npx prisma db push
npx prisma generate
```

- [ ] **Step 9: Verify final state**

```bash
cd /opt/role-chat-game/backend
node -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const p1 = await p.personagens.findFirst({ include: { atributos_personagem: true } });
  console.log('Personagem:', p1?.nome, 'Atributos:', p1?.atributos_personagem?.length);
  const m1 = await p.monstros.findFirst({ include: { atributos_monstro: true } });
  console.log('Monstro:', m1?.nome, 'Atributos:', m1?.atributos_monstro?.length);
  await p.\$disconnect();
})();
"
```

Both should show 6 attributes.

---

### Task 3: Update all seeds — upsert with {nome, sistema}

**Goal:** Every seed that uses `upsert({ where: { nome } })` must be updated to use the compound unique `{ nome_sistema: { nome, sistema } }`.

**Files:**
- Modify: `backend/prisma/seed_habilidades.js`
- Modify: `backend/prisma/seed_hm_classe.js`
- Modify: `backend/prisma/seed_hm_raca.js`
- Modify: `backend/prisma/seed_hm_slots_classe.js`
- Modify: `backend/prisma/seed_pode_magia.js`
- Modify: `backend/prisma/seed_crafting.js`
- Modify: `backend/seed-from-json.js`

- [ ] **Step 1: Update `seed_habilidades.js`**

File: `backend/prisma/seed_habilidades.js`

At line 48, change:
```javascript
// OLD
await prisma.habilidades_magias.upsert({
  where: { nome: hab.nome },
  create: data,
  update: data,
});
```
To:
```javascript
// NEW
await prisma.habilidades_magias.upsert({
  where: { nome_sistema: { nome: hab.nome, sistema: 'lunaria' } },
  create: { ...data, sistema: 'lunaria' },
  update: data,
});
```

- [ ] **Step 2: Update `seed_crafting.js`**

File: `backend/prisma/seed_crafting.js`

Find every `upsert` call on `equipamentos`, `vantagens`, or `desvantagens` that uses `where: { nome }` and change to:
```javascript
where: { nome_sistema: { nome: item.nome, sistema: 'lunaria' } },
create: { ...data, sistema: 'lunaria' },
```

- [ ] **Step 3: Update `seed-from-json.js`**

File: `backend/seed-from-json.js`

This file does `deleteMany` + bulk inserts. For every table that now has `sistema`, ensure the insert data includes `sistema: 'lunaria'`. Example pattern:

```javascript
// For each catalog entry being inserted
const data = { ...entry, sistema: 'lunaria' };
```

For `upsert` calls, use the compound where:
```javascript
where: { nome_sistema: { nome, sistema: 'lunaria' } }
```

- [ ] **Step 4: Update remaining seed files**

Files: `seed_hm_classe.js`, `seed_hm_raca.js`, `seed_hm_slots_classe.js`, `seed_pode_magia.js`

These files query `habilidades_magias`, `classes`, `racas` by `findMany` — they don't use `upsert` on catalog tables directly. No unique key changes needed, but verify they still work:

```bash
cd /opt/role-chat-game/backend
node prisma/seed_hm_classe.js
node prisma/seed_hm_raca.js
node prisma/seed_hm_slots_classe.js
node prisma/seed_pode_magia.js
```

- [ ] **Step 5: Run seed_habilidades and seed_crafting to verify**

```bash
cd /opt/role-chat-game/backend
node prisma/seed_habilidades.js
node prisma/seed_crafting.js
```

Both should complete without errors.

---

### Task 4: Refactor backend attribute access — personagens & monstros

**Goal:** Create `atributosHelper.js` with functions to read/write flexible attributes. Update all files that access `personagem.forca`, `monstro.constituicao`, etc.

**Files:**
- Create: `backend/helpers/atributosHelper.js`
- Modify: `backend/helpers/personagensHelper.js` (lines 61-67)
- Modify: `backend/helpers/combateHelper.js` (lines 233, 244, 247, 431-432, 477-480, 489, 1070, 1089)
- Modify: `backend/helpers/bonusHelper.js` (line 9: ATRIBUTOS constant)
- Modify: `backend/helpers/testeHelper.js`
- Modify: `backend/helpers/turnStateBuilder.js`
- Modify: `backend/helpers/evolucaoHelper.js`
- Modify: `backend/Model/PersonagemSessao.js` (lines 70-76)
- Modify: `backend/Model/Monstro.js` (lines 214-229)
- Modify: `backend/websocket/engines/combatEngine.js` (lines 150, 480, 506)
- Modify: `backend/controllers/monstro/monstroController.js` (lines 174-179, 255-260)
- Modify: `backend/scripts/smoke-gameloop.js` (lines 72-75)

- [ ] **Step 1: Create `backend/helpers/atributosHelper.js`**

```javascript
/**
 * Helper de Atributos — acesso unificado a atributos flexiveis
 * Funciona com personagens e monstros que possuem relacao
 * atributos_personagem[] ou atributos_monstro[].
 */
import db from '../Model/index.js';

const LUNARIA_ATTRS = ['forca', 'destreza', 'constituicao', 'inteligencia', 'agilidade', 'carisma'];
const DEFAULT_VALUE = 10;

/**
 * Retorna valor de um atributo de um personagem ou monstro.
 * Espera que o objeto tenha atributos_personagem[] ou atributos_monstro[] carregado,
 * OU um campo 'atributos' (map pré-computado como { forca: 14, ... }).
 * @param {Object} entity - Personagem ou monstro com relacao carregada
 * @param {string} nome - Nome do atributo (ex: 'forca', 'F', 'STR')
 * @param {number} [fallback=10] - Valor padrao se atributo nao encontrado
 * @returns {number}
 */
export function getAtributo(entity, nome, fallback = DEFAULT_VALUE) {
  if (!entity) return fallback;

  // Pre-computed map (ex: { forca: 14, destreza: 12 })
  if (entity.atributosMap) {
    return entity.atributosMap[nome] ?? fallback;
  }

  // Relacao atributos_personagem ou atributos_monstro
  const attrs = entity.atributos_personagem || entity.atributos_monstro || [];
  const found = attrs.find(a => a.nome === nome);
  return found?.valor ?? fallback;
}

/**
 * Retorna map {nome: valor} de todos os atributos de uma entidade.
 * @param {Object} entity
 * @returns {Object}
 */
export function getAtributosMap(entity) {
  if (!entity) return {};
  if (entity.atributosMap) return entity.atributosMap;

  const attrs = entity.atributos_personagem || entity.atributos_monstro || [];
  const map = {};
  for (const a of attrs) {
    map[a.nome] = a.valor;
  }
  return map;
}

/**
 * Calcula modificador padrao Lunaria: floor((valor - 10) / 2)
 * @param {Object} entity
 * @param {string} nome
 * @returns {number}
 */
export function getModificador(entity, nome) {
  const valor = getAtributo(entity, nome);
  return Math.floor((valor - 10) / 2);
}

/**
 * Bulk set/update atributos para um personagem.
 * @param {number} personagemId
 * @param {Object} atributosMap - { forca: 14, destreza: 12, ... }
 */
export async function setAtributosPersonagem(personagemId, atributosMap) {
  const ops = Object.entries(atributosMap).map(([nome, valor]) =>
    db.prisma.atributos_personagem.upsert({
      where: { personagem_id_nome: { personagem_id: personagemId, nome } },
      create: { personagem_id: personagemId, nome, valor },
      update: { valor },
    })
  );
  return Promise.all(ops);
}

/**
 * Bulk set/update atributos para um monstro.
 * @param {number} monstroId
 * @param {Object} atributosMap - { forca: 14, destreza: 12, ... }
 */
export async function setAtributosMonstro(monstroId, atributosMap) {
  const ops = Object.entries(atributosMap).map(([nome, valor]) =>
    db.prisma.atributos_monstro.upsert({
      where: { monstro_id_nome: { monstro_id: monstroId, nome } },
      create: { monstro_id: monstroId, nome, valor },
      update: { valor },
    })
  );
  return Promise.all(ops);
}

/**
 * Lista de atributos base para Lunaria.
 */
export function getLunariaAtributosBase() {
  return LUNARIA_ATTRS;
}

export { DEFAULT_VALUE };
```

- [ ] **Step 2: Update `backend/helpers/personagensHelper.js` (lines 61-67)**

Replace the hardcoded attribute read block:

```javascript
// OLD (lines 61-68)
const atributosEfetivos = {
  forca: personagem.forca || 10,
  inteligencia: personagem.inteligencia || 10,
  carisma: personagem.carisma || 10,
  destreza: personagem.destreza || 10,
  constituicao: personagem.constituicao || 10,
  agilidade: personagem.agilidade || 10
};
```

With:
```javascript
// NEW
import { getAtributosMap } from './atributosHelper.js';
// ...
const atributosEfetivos = getAtributosMap(personagem);
```

This requires `personagem` to have `atributos_personagem` loaded. Update the query at line 30 (`db.Personagem.findByIdWithRelations`) to include `atributos_personagem: true` in the include clause.

Verify that `backend/Model/Personagem.js` `findByIdWithRelations` includes the new relation. If it does not, add:
```javascript
include: {
  // ... existing includes ...
  atributos_personagem: true,
}
```

- [ ] **Step 3: Update `backend/helpers/combateHelper.js`**

Import at top:
```javascript
import { getAtributo, getModificador } from './atributosHelper.js';
```

Replace each direct attribute access:

**`calcularHP` (line 232-237):**
```javascript
// OLD
const constituicao = personagem.constituicao || 10;
// NEW
const constituicao = getAtributo(personagem, 'constituicao');
```

**`calcularMana` (lines 244-247):**
```javascript
// OLD
const inteligencia = personagem.inteligencia || 10;
const modCha = Math.floor(((personagem.carisma || 10) - 10) / 2);
// NEW
const inteligencia = getAtributo(personagem, 'inteligencia');
const modCha = getModificador(personagem, 'carisma');
```

**`calcularEsquiva` (lines 431-432):**
```javascript
// OLD
const agilidade = personagem.agilidade || 10;
const destreza = personagem.destreza || 10;
// NEW
const agilidade = getAtributo(personagem, 'agilidade');
const destreza = getAtributo(personagem, 'destreza');
```

**`calcularStatsEfetivos` (lines 477-480):**
```javascript
// OLD
const modCON = Math.floor(((monstro.constituicao || 10) - 10) / 2);
const modFOR = Math.floor(((monstro.forca || 10) - 10) / 2);
const modAGI = Math.floor(((monstro.agilidade || 10) - 10) / 2);
const modDEX = Math.floor(((monstro.destreza || 10) - 10) / 2);
// NEW
const modCON = getModificador(monstro, 'constituicao');
const modFOR = getModificador(monstro, 'forca');
const modAGI = getModificador(monstro, 'agilidade');
const modDEX = getModificador(monstro, 'destreza');
```

Remove the raw attribute return at line 489:
```javascript
// OLD
constituicao: monstro.constituicao || 10,
// NEW
constituicao: getAtributo(monstro, 'constituicao'),
```

**Monster attack in `resolverTurnoMonstros` (~lines 1070, 1089):**
```javascript
// OLD
const modDEX = Math.floor(((monstro.destreza || 10) - 10) / 2);
const modForcaM = Math.floor(((monstro.forca || 10) - 10) / 2);
// NEW
const modDEX = getModificador(monstro, 'destreza');
const modForcaM = getModificador(monstro, 'forca');
```

- [ ] **Step 4: Update `backend/Model/PersonagemSessao.js` (lines 70-76)**

Replace the atributos_snapshot creation:

```javascript
// OLD (lines 70-76)
atributos_snapshot: {
  forca: personagem.forca || 10,
  inteligencia: personagem.inteligencia || 10,
  carisma: personagem.carisma || 10,
  destreza: personagem.destreza || 10,
  constituicao: personagem.constituicao || 10,
  agilidade: personagem.agilidade || 10
},
```

With:
```javascript
// NEW
import { getAtributosMap } from '../../helpers/atributosHelper.js';
// ...
atributos_snapshot: getAtributosMap(personagem),
```

Ensure the query that loads `personagem` in this file includes `atributos_personagem: true`.

- [ ] **Step 5: Update `backend/Model/Monstro.js` (lines 212-229)**

In the `calcularStats` method, replace direct attribute access:

```javascript
// OLD (lines 214, 218-229)
const modAgi = Math.floor(((monstro.agilidade || 10) - 10) / 2);
// ...
ataque: Math.round(monstro.ataque_base + Math.floor((monstro.forca - 10) / 2) + ...),
forca: monstro.forca,
destreza: monstro.destreza,
inteligencia: monstro.inteligencia,
constituicao: monstro.constituicao,
agilidade: monstro.agilidade,
carisma: monstro.carisma
```

With:
```javascript
// NEW
import { getAtributo, getModificador, getAtributosMap } from '../../helpers/atributosHelper.js';
// ...
const modAgi = getModificador(monstro, 'agilidade');
// ...
ataque: Math.round(monstro.ataque_base + getModificador(monstro, 'forca') + ...),
...getAtributosMap(monstro)
```

Ensure all queries that load monstros include `atributos_monstro: true`.

- [ ] **Step 6: Update `backend/websocket/engines/combatEngine.js`**

Import:
```javascript
import { getAtributo, getModificador } from '../../helpers/atributosHelper.js';
```

**Line 150 (initiative):**
```javascript
// OLD
const modBase = Math.floor(((monstro.agilidade || 10) - 10) / 2);
// NEW
const modBase = getModificador(monstro, 'agilidade');
```

**Lines 480, 506 (monster attack):**
```javascript
// OLD
const modDEX = Math.floor(((monstro.destreza || 10) - 10) / 2);
const modForca = Math.floor(((monstro.forca || 10) - 10) / 2);
// NEW
const modDEX = getModificador(monstro, 'destreza');
const modForca = getModificador(monstro, 'forca');
```

Ensure monstro instances loaded for combat include `atributos_monstro: true`.

- [ ] **Step 7: Update `backend/controllers/monstro/monstroController.js`**

**Lines 174-179 (create) and 255-260 (update):**

The controller accepts `forca`, `destreza`, etc. from the request body and writes them as columns. Now these must go to `atributos_monstro`.

In the **create** handler, after creating the monstro, add:
```javascript
import { setAtributosMonstro } from '../../helpers/atributosHelper.js';
// ...
const attrMap = {};
if (forca !== undefined) attrMap.forca = parseInt(forca);
if (inteligencia !== undefined) attrMap.inteligencia = parseInt(inteligencia);
if (destreza !== undefined) attrMap.destreza = parseInt(destreza);
if (constituicao !== undefined) attrMap.constituicao = parseInt(constituicao);
if (agilidade !== undefined) attrMap.agilidade = parseInt(agilidade);
if (carisma !== undefined) attrMap.carisma = parseInt(carisma);
if (Object.keys(attrMap).length > 0) {
  await setAtributosMonstro(novoMonstro.id, attrMap);
}
```

Remove the old lines that add `forca`, `destreza`, etc. directly to `dados`.

Same pattern for the **update** handler.

- [ ] **Step 8: Update `backend/scripts/smoke-gameloop.js` (lines 72-75)**

Replace:
```javascript
// OLD
assert.ok(personagem.forca >= 1, 'forca deve ser >= 1');
assert.ok(personagem.constituicao >= 1, 'constituicao deve ser >= 1');
assert.ok(personagem.destreza >= 1, 'destreza deve ser >= 1');
assert.ok(personagem.agilidade >= 1, 'agilidade deve ser >= 1');
```

With:
```javascript
// NEW
import { getAtributo } from '../helpers/atributosHelper.js';
// ...
// Load personagem with atributos_personagem included
assert.ok(getAtributo(personagem, 'forca') >= 1, 'forca deve ser >= 1');
assert.ok(getAtributo(personagem, 'constituicao') >= 1, 'constituicao deve ser >= 1');
assert.ok(getAtributo(personagem, 'destreza') >= 1, 'destreza deve ser >= 1');
assert.ok(getAtributo(personagem, 'agilidade') >= 1, 'agilidade deve ser >= 1');
```

Update the query that loads `personagem` to include `atributos_personagem: true`.

- [ ] **Step 9: Update `backend/helpers/bonusHelper.js`**

Line 9 has `const ATRIBUTOS = ['forca', 'inteligencia', 'carisma', 'destreza', 'constituicao', 'agilidade'];`. This constant stays as-is (it defines Lunaria attribute names for bonus parsing). No change needed, but verify it's still referenced correctly.

- [ ] **Step 10: Update all Prisma queries that load personagens/monstros**

Search the entire codebase for `findMany`, `findFirst`, `findUnique` on `personagens` and `monstros` tables and ensure they include the new relations when attributes are needed:

```javascript
include: { atributos_personagem: true }
// or
include: { atributos_monstro: true }
```

Key files to check:
- `backend/Model/Personagem.js` — `findByIdWithRelations`, any method that returns full personagem data
- `backend/Model/Monstro.js` — `findById`, `findByNome`, `findRandom`
- `backend/helpers/personagensHelper.js` — `buscarPersonagensCompletos`
- `backend/websocket/engines/combatEngine.js` — monster loading for combat

---

### Task 5: Add sistema filter to all catalog queries

**Goal:** Every catalog query must filter by `sistema` so that Lunaria queries only return Lunaria data, and future systems return their own data.

**Files:**
- Modify: `backend/routes/catalogos.js` (lines 9, 19, 29, 49)
- Modify: `backend/Model/Personagem.js` (lines 121, 156, 200)
- Modify: `backend/Model/PersonagemSessao.js` (lines 42, 50)
- Modify: `backend/controllers/personagem/personagemController.js` (lines 304, 309)
- Modify: `backend/agents/MestreCriador/catalogo/catalogoCriacao.js` (lines 39-42)
- Modify: `backend/scripts/audit-images.js` (lines 79-115)
- Modify: `backend/scripts/daily-image-job.js` (lines 71-112)
- Modify: `backend/scripts/batch-generate-images.js` (lines 161-213)
- Modify: `backend/scripts/smoke-gameloop.js` (line 134)
- Modify: `backend/scripts/validate-monsters.js` (line 102)
- Modify: `backend/scripts/rebalance-monsters.js` (line 209)

- [ ] **Step 1: Update `backend/routes/catalogos.js`**

Add `sistema` query param support to each route:

```javascript
// Pattern for each catalog route:
router.get('/habilidades', async (req, res) => {
  try {
    const { classe_id, nivel, sistema } = req.query;
    const where = {};
    if (sistema) where.sistema = sistema;
    else where.sistema = 'lunaria'; // default
    // ... rest of existing logic
  }
});
```

Apply this pattern to all routes in the file (`/raridades`, `/categorias-equipamento`, `/categorias-monstro`, `/habilidades`). Note: `raridades`, `categorias_equipamento`, and `categorias_monstro` do NOT have a `sistema` column (they are shared). Only filter on tables that have the column.

- [ ] **Step 2: Update Model methods that do `findAll`**

For `backend/agents/MestreCriador/catalogo/catalogoCriacao.js` (lines 38-43):

```javascript
// OLD
const [racas, classes, vantagens, desvantagens] = await Promise.all([
  db.Raca.findAll(),
  db.Classe.findAll(),
  db.Vantagem.findAll(),
  db.Desvantagem.findAll(),
]);
```

Update each Model's `findAll` to accept `sistema` parameter (or pass it through):

```javascript
// NEW
export async function fetchData(sistema = 'lunaria') {
  // ...
  const [racas, classes, vantagens, desvantagens] = await Promise.all([
    db.Raca.findAll(sistema),
    db.Classe.findAll(sistema),
    db.Vantagem.findAll(sistema),
    db.Desvantagem.findAll(sistema),
  ]);
  // ...
}
```

In each Model file (Raca, Classe, Vantagem, Desvantagem), update `findAll`:
```javascript
async findAll(sistema = 'lunaria') {
  return prisma.racas.findMany({ where: { sistema }, orderBy: { nome: 'asc' } });
}
```

- [ ] **Step 3: Update `backend/Model/Personagem.js` catalog queries**

Lines 121, 156, 200 — any queries on `vantagens`, `desvantagens`, `equipamentos` by FK (not by sistema). These are loaded by ID via join tables, so they don't need `sistema` filter (the FKs already point to the correct system's entries).

No change needed for FK-based queries. Only `findAll` type queries need the filter.

- [ ] **Step 4: Update `backend/controllers/personagem/personagemController.js`**

Lines 304, 309 — catalog lookups during character creation. Add `sistema` parameter from the request or from the historia being created for.

- [ ] **Step 5: Update image scripts**

For `audit-images.js`, `daily-image-job.js`, `batch-generate-images.js`:

These scripts iterate over catalog tables. Add `where: { sistema: 'lunaria' }` to each `findMany` call to avoid processing entries from other systems. Example:

```javascript
// OLD
const monstros = await prisma.monstros.findMany({ ... });
// NEW
const monstros = await prisma.monstros.findMany({ where: { sistema: 'lunaria' }, ... });
```

Apply to all catalog queries in:
- `backend/scripts/audit-images.js` (lines 79-115)
- `backend/scripts/daily-image-job.js` (lines 71-112)
- `backend/scripts/batch-generate-images.js` (lines 161-213)

- [ ] **Step 6: Update validation scripts**

For `validate-monsters.js` (line 102) and `rebalance-monsters.js` (line 209):

```javascript
// Add sistema filter
const monstros = await prisma.monstros.findMany({ where: { sistema: 'lunaria' } });
```

For `smoke-gameloop.js` (line 134):
```javascript
// OLD
const monstros = await prisma.monstros.findMany({ take: 5 });
// NEW
const monstros = await prisma.monstros.findMany({ where: { sistema: 'lunaria' }, take: 5 });
```

---

### Task 6: Restart + test backend

**Goal:** Verify Phase 1 schema changes don't break existing Lunaria functionality.

**Files:** None (testing only)

- [ ] **Step 1: Restart backend**

```bash
pm2 restart lunaria-back
```

- [ ] **Step 2: Check logs for errors**

```bash
pm2 logs lunaria-back --lines 50
```

Look for any Prisma errors, missing columns, or query failures.

- [ ] **Step 3: Run test suite**

```bash
cd /opt/role-chat-game/backend
npx vitest run
```

Fix any failing tests. Expected failures will be in tests that reference `personagem.forca` directly — update those to use `getAtributo()`.

- [ ] **Step 4: Run smoke test**

```bash
cd /opt/role-chat-game/backend
node scripts/smoke-gameloop.js
```

---

### Task 7: Create game-systems/ infrastructure

**Goal:** Create the game engine registry, interface, and extract Lunaria-specific logic into `backend/game-systems/lunaria/`.

**Files:**
- Create: `backend/game-systems/index.js`
- Create: `backend/game-systems/interface.js`
- Create: `backend/game-systems/lunaria/index.js`
- Create: `backend/game-systems/lunaria/combatEngine.js`
- Create: `backend/game-systems/lunaria/characterEngine.js`
- Create: `backend/game-systems/lunaria/testEngine.js`
- Create: `backend/game-systems/lunaria/constants.js`
- Create: `backend/game-systems/lunaria/prompts/regras.js`

- [ ] **Step 1: Create `backend/game-systems/index.js` — registry**

```javascript
/**
 * Game Systems Registry — dispatcher central para engines por sistema.
 * Uso: const engine = getEngine('lunaria');
 */
import lunariaEngine from './lunaria/index.js';

const engines = {
  lunaria: lunariaEngine,
};

/**
 * Retorna a engine para o sistema especificado.
 * @param {string} sistema - 'lunaria' | 'tresdet' | 'dnd5e' | 'daemon'
 * @returns {Object} Engine com interface padrao
 */
export function getEngine(sistema) {
  const engine = engines[sistema];
  if (!engine) throw new Error(`Sistema desconhecido: ${sistema}`);
  return engine;
}

export function getAvailableSystems() {
  return Object.keys(engines);
}
```

- [ ] **Step 2: Create `backend/game-systems/interface.js` — JSDoc contract**

```javascript
/**
 * Interface comum que toda game engine deve implementar.
 * Este arquivo serve como documentacao — nao ha enforcement em runtime.
 *
 * @typedef {Object} GameEngine
 *
 * @property {function(Object, Object, Object): {acertou: boolean, dano: number, critico: boolean, detalhes: string}} resolverAtaque
 * @property {function(Object, Object): {danoReduzido: number, detalhes: string}} resolverDefesa
 * @property {function(Object): number} calcularIniciativa
 * @property {function(Object, string, number): {sucesso: boolean, rolagem: number, detalhes: string}} resolverTeste
 *
 * @property {function(Object, number?): number} calcularHP
 * @property {function(Object): number} calcularMP
 * @property {function(Object): number} calcularAtaque
 * @property {function(Object): number} calcularDefesa
 * @property {function(): Array<{id: string, nome: string, sigla: string, min: number, max: number}>} getAtributosBase
 * @property {function(Object, string): number} getAtributo
 * @property {function(Object, string): number} getModificador
 * @property {function(number): Object} getProgressaoNivel
 *
 * @property {function(): Array<{id: string, titulo: string}>} getWizardStages
 * @property {function(Object): {valido: boolean, erros: string[]}} validarCriacao
 *
 * @property {function(): string} getRegrasMestrePrompt
 */
export default {};
```

- [ ] **Step 3: Create `backend/game-systems/lunaria/constants.js`**

```javascript
/**
 * Constantes do sistema Lunaria — atributos, limites, formulas.
 */
export const ATRIBUTOS = [
  { id: 'forca', nome: 'Forca', sigla: 'FOR', min: 1, max: 20 },
  { id: 'destreza', nome: 'Destreza', sigla: 'DES', min: 1, max: 20 },
  { id: 'constituicao', nome: 'Constituicao', sigla: 'CON', min: 1, max: 20 },
  { id: 'inteligencia', nome: 'Inteligencia', sigla: 'INT', min: 1, max: 20 },
  { id: 'agilidade', nome: 'Agilidade', sigla: 'AGI', min: 1, max: 20 },
  { id: 'carisma', nome: 'Carisma', sigla: 'CAR', min: 1, max: 20 },
];

export const ATRIBUTO_IDS = ATRIBUTOS.map(a => a.id);
export const ATRIBUTO_BASE = 60;
export const STAT_MAX = 20;
export const STAT_MIN = 1;
export const NIVEL_MAX = 20;
export const HP_MULT_DEFAULT = 5;
export const MANA_BASE = 10;
```

- [ ] **Step 4: Create `backend/game-systems/lunaria/characterEngine.js`**

Extract from `combateHelper.js` and `personagensHelper.js`:

```javascript
import { getAtributo, getModificador } from '../../helpers/atributosHelper.js';
import { ATRIBUTOS, HP_MULT_DEFAULT, MANA_BASE } from './constants.js';

export function calcularHP(personagem, multRaca = HP_MULT_DEFAULT) {
  const constituicao = getAtributo(personagem, 'constituicao');
  const nivel = personagem.nivel || 1;
  const modCON = Math.floor((constituicao - 10) / 2);
  return multRaca * (nivel + Math.max(1, modCON));
}

export function calcularMP(personagem) {
  const inteligencia = getAtributo(personagem, 'inteligencia');
  const nivel = personagem.nivel || 1;
  const modInt = Math.floor((inteligencia - 10) / 2);
  const modCha = getModificador(personagem, 'carisma');
  const modCaster = Math.max(modInt, modCha);
  return Math.max(5, MANA_BASE + nivel + modCaster * 2);
}

export function calcularAtaque(personagem) {
  const modDex = getModificador(personagem, 'destreza');
  const nivel = personagem.nivel || 1;
  return modDex + Math.floor(nivel / 2);
}

export function calcularDefesa(personagem) {
  return 10 + getModificador(personagem, 'agilidade');
}

export function getAtributosBase() {
  return ATRIBUTOS;
}

export function getProgressaoNivel(nivel) {
  return {
    pontosVantagem: 10 + (Math.min(nivel, 20) - 1),
    maxCustoDesvantagem: 3 + Math.floor((Math.min(nivel, 20) - 1) / 4),
    tierMax: 1 + Math.floor((Math.min(nivel, 20) - 1) / 4),
  };
}

export function validarCriacao(dados) {
  const erros = [];
  // Validate 60 total attribute points
  const total = ['forca', 'destreza', 'constituicao', 'inteligencia', 'agilidade', 'carisma']
    .reduce((sum, attr) => sum + (dados[attr] || 10), 0);
  if (total !== 60) erros.push(`Total de atributos deve ser 60, recebido: ${total}`);
  return { valido: erros.length === 0, erros };
}
```

- [ ] **Step 5: Create `backend/game-systems/lunaria/combatEngine.js`**

Extract Lunaria-specific combat formulas from `combateHelper.js`:

```javascript
import { getAtributo, getModificador } from '../../helpers/atributosHelper.js';

/**
 * Resolve ataque no sistema Lunaria.
 * d20 + modDEX + bonusNivel vs DC (10 + modAGI do alvo)
 */
export function resolverAtaque(atacante, defensor, acao = {}) {
  const rolagem = Math.floor(Math.random() * 20) + 1;
  const modDex = getModificador(atacante, 'destreza');
  const nivel = atacante.nivel || 1;
  const bonusNivel = Math.floor(nivel / 2);
  const totalAtaque = rolagem + modDex + bonusNivel;

  const dcEsquiva = 10 + getModificador(defensor, 'agilidade');
  const critico = rolagem === 20;
  const acertou = critico || totalAtaque >= dcEsquiva;

  return { acertou, critico, rolagem, totalAtaque, dcEsquiva, detalhes: `d20(${rolagem})+${modDex}+${bonusNivel}=${totalAtaque} vs DC${dcEsquiva}` };
}

export function calcularIniciativa(personagem) {
  const rolagem = Math.floor(Math.random() * 20) + 1;
  const modAgi = getModificador(personagem, 'agilidade');
  return rolagem + modAgi;
}

export function resolverTeste(personagem, atributo, dc) {
  const rolagem = Math.floor(Math.random() * 20) + 1;
  const mod = getModificador(personagem, atributo);
  const nivel = personagem.nivel || 1;
  const bonusNivel = Math.min(2, Math.floor(nivel / 6));
  const total = rolagem + mod + bonusNivel;
  const sucesso = total >= dc;
  return { sucesso, rolagem, total, dc, detalhes: `d20(${rolagem})+${mod}+${bonusNivel}=${total} vs DC${dc}` };
}
```

- [ ] **Step 6: Create `backend/game-systems/lunaria/testEngine.js`**

```javascript
import { getModificador } from '../../helpers/atributosHelper.js';

/**
 * Resolve teste de habilidade Lunaria.
 * d20 + mod_atributo + bonus_nivel vs DC
 */
export function resolverTeste(personagem, atributo, dc) {
  const rolagem = Math.floor(Math.random() * 20) + 1;
  const mod = getModificador(personagem, atributo);
  const nivel = personagem.nivel || 1;
  const bonusNivel = Math.min(2, Math.floor(nivel / 6));
  const total = rolagem + mod + bonusNivel;
  const sucesso = total >= dc;
  return { sucesso, rolagem, total, dc, detalhes: `d20(${rolagem})+${mod}+${bonusNivel}=${total} vs DC${dc}` };
}

export function calcularModificadorAtributo(valorAtributo) {
  return Math.floor(((valorAtributo || 10) - 10) / 2);
}

export function calcularBonusNivel(nivel) {
  return Math.min(2, Math.floor((nivel || 1) / 6));
}
```

- [ ] **Step 7: Create `backend/game-systems/lunaria/prompts/regras.js`**

```javascript
/**
 * Prompt de regras do sistema Lunaria para o Mestre IA.
 */
export function getRegrasMestrePrompt() {
  return `
## REGRAS DO SISTEMA: LUNARIA RPG

### Atributos
Os personagens possuem 6 atributos: Forca (FOR), Destreza (DES), Constituicao (CON), Inteligencia (INT), Agilidade (AGI) e Carisma (CAR). Cada atributo vai de 1 a 20. O modificador e: floor((valor - 10) / 2).

### Combate
- Ataque: d20 + modDES + bonusNivel vs DC de Esquiva do alvo (10 + modAGI)
- Dano: dado da arma + modFOR (corpo a corpo) ou modDES (distancia)
- Critico: d20 natural 20 = dano dobrado
- HP: multRaca * (nivel + max(1, modCON))
- Mana: 10 + nivel + max(modINT, modCAR) * 2
- Absorcao: max(0, modCON - 1) reduz dano recebido (crits ignoram)

### Testes de Habilidade
d20 + mod_atributo + bonus_nivel vs DC
- bonus_nivel: Nv1-5 +0, Nv6-11 +1, Nv12-20 +2

### Formato de Resposta para Combate
Ao narrar combate, use as formulas acima. Sempre inclua a rolagem, modificadores e resultado numerico.
`.trim();
}
```

- [ ] **Step 8: Create `backend/game-systems/lunaria/index.js` — exports**

```javascript
import * as combatEngine from './combatEngine.js';
import * as characterEngine from './characterEngine.js';
import * as testEngine from './testEngine.js';
import { ATRIBUTOS } from './constants.js';
import { getRegrasMestrePrompt } from './prompts/regras.js';

export default {
  id: 'lunaria',
  nome: 'Lunaria RPG',

  // Combat
  resolverAtaque: combatEngine.resolverAtaque,
  calcularIniciativa: combatEngine.calcularIniciativa,

  // Character
  calcularHP: characterEngine.calcularHP,
  calcularMP: characterEngine.calcularMP,
  calcularAtaque: characterEngine.calcularAtaque,
  calcularDefesa: characterEngine.calcularDefesa,
  getAtributosBase: characterEngine.getAtributosBase,
  getProgressaoNivel: characterEngine.getProgressaoNivel,
  validarCriacao: characterEngine.validarCriacao,

  // Tests
  resolverTeste: testEngine.resolverTeste,

  // Wizard
  getWizardStages: () => [
    { id: 'boas_vindas', titulo: 'O Chamado' },
    { id: 'raca', titulo: 'Linhagem' },
    { id: 'classe', titulo: 'Vocacao' },
    { id: 'background', titulo: 'Passado' },
    { id: 'desvantagens', titulo: 'Fraquezas' },
    { id: 'vantagens', titulo: 'Poderes' },
    { id: 'atributos', titulo: 'Atributos' },
    { id: 'equipamentos', titulo: 'Equipamentos' },
    { id: 'grimorio', titulo: 'Grimorio' },
    { id: 'resumo', titulo: 'Resumo' },
  ],

  // Mestre IA
  getRegrasMestrePrompt,
};
```

---

### Task 8: Refactor helpers to use dispatcher

**Goal:** Existing helpers (`combateHelper`, `personagensHelper`, `testeHelper`) become dispatchers that call `getEngine(sistema)` instead of hardcoding Lunaria formulas.

**Files:**
- Modify: `backend/helpers/combateHelper.js`
- Modify: `backend/helpers/personagensHelper.js`
- Modify: `backend/helpers/testeHelper.js`
- Modify: `backend/helpers/turnStateBuilder.js`
- Modify: `backend/agents/Mestre/contexto/mestreContextBuilder.js`

- [ ] **Step 1: Update `combateHelper.js` — delegate to engine**

Import at top:
```javascript
import { getEngine } from '../game-systems/index.js';
```

For `calcularHP` and `calcularMana`, keep them as they are for backwards compatibility BUT also add system-aware versions:

```javascript
/**
 * Calcula HP usando a engine do sistema do personagem.
 * Fallback para Lunaria se sistema nao definido.
 */
export function calcularHPSistema(personagem, multRaca = 5) {
  const sistema = personagem.sistema || 'lunaria';
  const engine = getEngine(sistema);
  return engine.calcularHP(personagem, multRaca);
}
```

Gradually replace callers to use the sistema-aware version. The existing `calcularHP` stays as a Lunaria-specific function used by the lunaria engine.

- [ ] **Step 2: Update `testeHelper.js` — delegate to engine**

Add at top:
```javascript
import { getEngine } from '../game-systems/index.js';
```

Add a new exported function:
```javascript
/**
 * Resolve teste de habilidade usando a engine do sistema.
 */
export function resolverTesteSistema(personagem, atributo, dc) {
  const sistema = personagem.sistema || 'lunaria';
  const engine = getEngine(sistema);
  return engine.resolverTeste(personagem, atributo, dc);
}
```

Update callers progressively to use `resolverTesteSistema`.

- [ ] **Step 3: Update `turnStateBuilder.js`**

Import:
```javascript
import { getEngine } from '../game-systems/index.js';
```

Where it calls `calcularHP` and `calcularMana`, make it system-aware:
```javascript
const engine = getEngine(personagem.sistema || 'lunaria');
const hpMax = engine.calcularHP(personagem, multRaca);
const mpMax = engine.calcularMP(personagem);
```

- [ ] **Step 4: Update `mestreContextBuilder.js` — inject system rules**

File: `backend/agents/Mestre/contexto/mestreContextBuilder.js`

Import:
```javascript
import { getEngine } from '../../../game-systems/index.js';
```

In the function that builds the context/prompt, inject system rules:
```javascript
// Get sistema from historia
const sistema = historia?.sistema || 'lunaria';
const engine = getEngine(sistema);
const regrasPrompt = engine.getRegrasMestrePrompt();
// Inject regrasPrompt into the system prompt
```

- [ ] **Step 5: Verify Lunaria engine produces identical results**

Run test suite and smoke tests:
```bash
cd /opt/role-chat-game/backend
npx vitest run
node scripts/smoke-gameloop.js
```

All tests must pass with the same results as before the refactor.

---

### Task 9: Frontend — sistema selector + attribute refactor

**Goal:** Add sistema field to historia creation, display it in UI, and refactor frontend to read attributes from flexible `atributos` array.

**Files:**
- Modify: `frontend/src/models/Personagem.js` (lines 22-27)
- Modify: `frontend/src/components/Jogo/Modals/FichaPersonagemModal.jsx` (lines 139-142)
- Modify: `frontend/src/Pages/Personagem/Wizard/components/AttributeDistributor.jsx`
- Modify: `frontend/src/utils/personagemBonus.js`
- Modify: `frontend/src/Pages/Personagem/Wizard/hooks/useBonusCalculation.js`
- Modify: historia creation form (wherever it lives)

- [ ] **Step 1: Refactor `frontend/src/models/Personagem.js`**

Replace hardcoded attribute fields:

```javascript
// OLD (lines 22-27)
this.forca = data.forca || 10;
this.destreza = data.destreza || 10;
this.constituicao = data.constituicao || 10;
this.inteligencia = data.inteligencia || 10;
this.agilidade = data.agilidade || 10;
this.carisma = data.carisma || 10;
```

With:
```javascript
// NEW
this.sistema = data.sistema || 'lunaria';
this.atributos = {};
if (Array.isArray(data.atributos_personagem)) {
  for (const a of data.atributos_personagem) {
    this.atributos[a.nome] = a.valor;
  }
} else if (data.atributos && typeof data.atributos === 'object') {
  Object.assign(this.atributos, data.atributos);
}
// Backwards compat: expose as flat fields for Lunaria
this.forca = this.atributos.forca ?? data.forca ?? 10;
this.destreza = this.atributos.destreza ?? data.destreza ?? 10;
this.constituicao = this.atributos.constituicao ?? data.constituicao ?? 10;
this.inteligencia = this.atributos.inteligencia ?? data.inteligencia ?? 10;
this.agilidade = this.atributos.agilidade ?? data.agilidade ?? 10;
this.carisma = this.atributos.carisma ?? data.carisma ?? 10;
this.stats_sistema = data.stats_sistema || null;
```

- [ ] **Step 2: Update `FichaPersonagemModal.jsx` (lines 139-142)**

Replace hardcoded attribute access:

```javascript
// OLD
const modAGI = Math.floor(((personagem.agilidade || 10) - 10) / 2);
const modDEX = Math.floor(((personagem.destreza || 10) - 10) / 2);
const modCON = Math.floor(((personagem.constituicao || 10) - 10) / 2);
const modFOR = Math.floor(((personagem.forca || 10) - 10) / 2);
```

With a system-aware approach:
```javascript
// NEW — use the flat compat fields which are populated from atributos
const getAttr = (nome) => personagem.atributos?.[nome] ?? personagem[nome] ?? 10;
const getMod = (nome) => Math.floor((getAttr(nome) - 10) / 2);

const modAGI = getMod('agilidade');
const modDEX = getMod('destreza');
const modCON = getMod('constituicao');
const modFOR = getMod('forca');
```

For the attribute display section, make it dynamic:
```javascript
// Render attributes dynamically based on sistema
const attrConfig = personagem.sistema === 'lunaria'
  ? [
      { key: 'forca', label: 'FOR' },
      { key: 'destreza', label: 'DES' },
      { key: 'constituicao', label: 'CON' },
      { key: 'inteligencia', label: 'INT' },
      { key: 'agilidade', label: 'AGI' },
      { key: 'carisma', label: 'CAR' },
    ]
  : Object.keys(personagem.atributos || {}).map(k => ({ key: k, label: k.toUpperCase() }));
```

- [ ] **Step 3: Update `AttributeDistributor.jsx`**

The `ATTR_CONFIG` constant at lines 4-28 is Lunaria-specific. Wrap it in a system check:

```javascript
const LUNARIA_ATTR_CONFIG = { /* existing ATTR_CONFIG */ };
const TRESDET_ATTR_CONFIG = { /* to be filled in Phase 2 */ };

function getAttrConfig(sistema) {
  if (sistema === 'tresdet') return TRESDET_ATTR_CONFIG;
  return LUNARIA_ATTR_CONFIG;
}
```

For now, only Lunaria config exists. The component should accept `sistema` as a prop and use the correct config.

- [ ] **Step 4: Update `personagemBonus.js`**

The `BONUS_ATTR_KEYS` constant at line 1 is Lunaria-specific. Keep it as-is for now (it's used for bonus parsing from race/class, which is Lunaria-only). Add a comment:

```javascript
// Lunaria-specific attribute keys for bonus parsing
export const BONUS_ATTR_KEYS = ['forca', 'destreza', 'constituicao', 'inteligencia', 'agilidade', 'carisma'];
```

- [ ] **Step 5: Add sistema to historia creation**

Find the historia creation form in the frontend and add a sistema selector:

```jsx
<select value={sistema} onChange={e => setSistema(e.target.value)}>
  <option value="lunaria">Lunaria RPG</option>
  <option value="tresdet" disabled>3D&T Alpha (em breve)</option>
  <option value="dnd5e" disabled>D&D 5e (em breve)</option>
</select>
```

On the backend, update historia creation to accept and store `sistema`:
```javascript
// In historia controller/service
const { nome, descricao, sistema, ...rest } = req.body;
await prisma.historias.create({ data: { ...rest, nome, descricao, sistema: sistema || 'lunaria' } });
```

- [ ] **Step 6: Add sistema display to historia list/detail**

Show a badge with the sistema name in historia cards and detail pages.

---

### Task 10: Build + deploy + test Phase 1

**Goal:** Ensure everything works end-to-end with the new architecture.

- [ ] **Step 1: Build frontend**

```bash
cd /opt/role-chat-game/frontend
sudo rm -rf dist && NODE_OPTIONS="--max-old-space-size=4096" npx vite build && sudo cp -r dist/* /var/www/lunaria-front/
```

- [ ] **Step 2: Restart backend**

```bash
pm2 restart lunaria-back
```

- [ ] **Step 3: Run full test suite**

```bash
cd /opt/role-chat-game/backend
npx vitest run
```

- [ ] **Step 4: Manual regression test**

Test the following flows:
1. Create a new historia (should default to Lunaria)
2. Create a new personagem through wizard (all stages)
3. Start a session and verify combat works
4. Verify monster combat formulas produce same results
5. Verify personagem ficha displays correctly

---

## Phase 2: 3D&T Alpha

Phase 2 adds the 3D&T Alpha system — engine, catalogs, wizard, and frontend support.

---

### Task 11: 3D&T game engine

**Goal:** Create the 3D&T Alpha game engine implementing the common interface.

**Files:**
- Create: `backend/game-systems/tresdet/index.js`
- Create: `backend/game-systems/tresdet/combatEngine.js`
- Create: `backend/game-systems/tresdet/characterEngine.js`
- Create: `backend/game-systems/tresdet/testEngine.js`
- Create: `backend/game-systems/tresdet/constants.js`
- Create: `backend/game-systems/tresdet/prompts/regras.js`
- Modify: `backend/game-systems/index.js` (register tresdet)

- [ ] **Step 1: Create `backend/game-systems/tresdet/constants.js`**

```javascript
export const ATRIBUTOS = [
  { id: 'F', nome: 'Forca', sigla: 'F', min: 0, max: 5 },
  { id: 'H', nome: 'Habilidade', sigla: 'H', min: 0, max: 5 },
  { id: 'R', nome: 'Resistencia', sigla: 'R', min: 0, max: 5 },
  { id: 'A', nome: 'Armadura', sigla: 'A', min: 0, max: 5 },
  { id: 'PdF', nome: 'Poder de Fogo', sigla: 'PdF', min: 0, max: 5 },
];

export const ATRIBUTO_IDS = ATRIBUTOS.map(a => a.id);

export const TIERS = {
  novato: { pontos: 6, label: 'Novato' },
  lutador: { pontos: 7, label: 'Lutador' },
  campeao: { pontos: 8, label: 'Campeao' },
  lenda: { pontos: 10, label: 'Lenda' },
  heroi: { pontos: 15, label: 'Heroi' },
};

export const DEFAULT_TIER = 'lutador';
export const HP_MULTIPLIER = 5;
export const PM_MULTIPLIER = 5;
```

- [ ] **Step 2: Create `backend/game-systems/tresdet/combatEngine.js`**

```javascript
import { getAtributo } from '../../helpers/atributosHelper.js';

function rolarD6() {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * 3D&T Attack: FA = F + H + 1d6 (melee) or PdF + H + 1d6 (ranged)
 * Defense: FD = A + H + 1d6
 * Damage: FA - FD (if positive)
 */
export function resolverAtaque(atacante, defensor, acao = {}) {
  const tipo = acao.tipo || 'melee';
  const H_atk = getAtributo(atacante, 'H', 0);
  const attrAtaque = tipo === 'ranged' ? getAtributo(atacante, 'PdF', 0) : getAtributo(atacante, 'F', 0);
  const d6Ataque = rolarD6();
  const FA = attrAtaque + H_atk + d6Ataque;

  const A_def = getAtributo(defensor, 'A', 0);
  const H_def = getAtributo(defensor, 'H', 0);
  const d6Defesa = rolarD6();
  const FD = A_def + H_def + d6Defesa;

  const dano = Math.max(0, FA - FD);
  const acertou = dano > 0;

  return {
    acertou,
    dano,
    critico: false, // 3D&T nao tem criticos no basico
    FA,
    FD,
    d6Ataque,
    d6Defesa,
    detalhes: `FA: ${attrAtaque}+${H_atk}+d6(${d6Ataque})=${FA} vs FD: ${A_def}+${H_def}+d6(${d6Defesa})=${FD} → dano ${dano}`,
  };
}

export function calcularIniciativa(personagem) {
  const H = getAtributo(personagem, 'H', 0);
  return rolarD6() + H;
}
```

- [ ] **Step 3: Create `backend/game-systems/tresdet/characterEngine.js`**

```javascript
import { getAtributo, getAtributosMap } from '../../helpers/atributosHelper.js';
import { ATRIBUTOS, TIERS, HP_MULTIPLIER, PM_MULTIPLIER } from './constants.js';

export function calcularHP(personagem) {
  const R = getAtributo(personagem, 'R', 0);
  return R * HP_MULTIPLIER;
}

export function calcularMP(personagem) {
  // PM only if personagem has Magia vantagem
  const temMagia = personagem.vantagens?.some(v =>
    ['Magia Branca', 'Magia Negra', 'Magia Elemental'].includes(v.nome || v.vantagem?.nome)
  );
  if (!temMagia) return 0;
  const R = getAtributo(personagem, 'R', 0);
  return R * PM_MULTIPLIER;
}

export function calcularAtaque(personagem, tipo = 'melee') {
  const H = getAtributo(personagem, 'H', 0);
  if (tipo === 'ranged') return getAtributo(personagem, 'PdF', 0) + H;
  return getAtributo(personagem, 'F', 0) + H;
}

export function calcularDefesa(personagem) {
  return getAtributo(personagem, 'A', 0) + getAtributo(personagem, 'H', 0);
}

export function getAtributosBase() {
  return ATRIBUTOS;
}

export function getProgressaoNivel() {
  // 3D&T uses point-buy, not level progression
  return { pontosVantagem: 0, maxCustoDesvantagem: 0, tierMax: 0 };
}

export function validarCriacao(dados) {
  const erros = [];
  const tier = dados.tier || 'lutador';
  const config = TIERS[tier];
  if (!config) {
    erros.push(`Tier invalido: ${tier}`);
    return { valido: false, erros };
  }

  const totalAttrs = ['F', 'H', 'R', 'A', 'PdF'].reduce((sum, attr) => sum + (dados[attr] || 0), 0);
  // Total must not exceed tier points (vantagens also consume points)
  if (totalAttrs > config.pontos) {
    erros.push(`Caracteristicas (${totalAttrs}) excedem pontos do tier ${tier} (${config.pontos})`);
  }

  // Each attr 0-5
  for (const attr of ['F', 'H', 'R', 'A', 'PdF']) {
    const val = dados[attr] || 0;
    if (val < 0 || val > 5) erros.push(`${attr} deve ser entre 0 e 5`);
  }

  return { valido: erros.length === 0, erros };
}
```

- [ ] **Step 4: Create `backend/game-systems/tresdet/testEngine.js`**

```javascript
import { getAtributo } from '../../helpers/atributosHelper.js';

function rolarD6() {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * 3D&T Tests:
 * - Simples: 1d6 <= caracteristica → sucesso
 * - Dificil: 1d6 <= caracteristica - 1
 * - Oposto: ambos rolam 1d6 + caracteristica, maior vence
 */
export function resolverTeste(personagem, atributo, dc, opcoes = {}) {
  const valor = getAtributo(personagem, atributo, 0);
  const rolagem = rolarD6();

  if (opcoes.tipo === 'oposto') {
    const total = rolagem + valor;
    return {
      sucesso: total >= dc,
      rolagem,
      total,
      dc,
      detalhes: `d6(${rolagem})+${atributo}(${valor})=${total} vs ${dc}`,
    };
  }

  // Simples ou dificil
  const alvo = opcoes.tipo === 'dificil' ? valor - 1 : valor;

  // Facil: automatico se caracteristica >= 1
  if (opcoes.tipo === 'facil' && valor >= 1) {
    return { sucesso: true, rolagem: 0, total: valor, dc: 0, detalhes: `Automatico (${atributo}=${valor} >= 1)` };
  }

  const sucesso = rolagem <= alvo;
  return {
    sucesso,
    rolagem,
    total: rolagem,
    dc: alvo,
    detalhes: `d6(${rolagem}) ${sucesso ? '<=' : '>'} ${atributo}(${alvo}) → ${sucesso ? 'sucesso' : 'falha'}`,
  };
}
```

- [ ] **Step 5: Create `backend/game-systems/tresdet/prompts/regras.js`**

```javascript
export function getRegrasMestrePrompt() {
  return `
## REGRAS DO SISTEMA: 3D&T ALPHA

### Caracteristicas
Personagens possuem 5 caracteristicas: Forca (F), Habilidade (H), Resistencia (R), Armadura (A) e Poder de Fogo (PdF). Cada uma vai de 0 a 5.

### Combate
- Forca de Ataque (FA): F + H + 1d6 (corpo a corpo) ou PdF + H + 1d6 (a distancia)
- Forca de Defesa (FD): A + H + 1d6
- Dano: FA - FD (se positivo, senao 0)
- HP: R x 5
- PM: R x 5 (apenas se tem vantagem Magia)
- Iniciativa: 1d6 + H

### Testes
- Simples: 1d6, sucesso se <= caracteristica
- Dificil: 1d6, sucesso se <= caracteristica - 1
- Facil: automatico se caracteristica >= 1
- Oposto: ambos rolam 1d6 + caracteristica, maior vence

### Vantagens e Desvantagens
Vantagens custam pontos e dao poderes especiais. Desvantagens devolvem pontos e impoem limitacoes.

### Terminologia
Use "caracteristica" ao inves de "atributo". Use FA/FD ao inves de "rolagem de ataque". Dano e sempre FA-FD.
`.trim();
}
```

- [ ] **Step 6: Create `backend/game-systems/tresdet/index.js`**

```javascript
import * as combatEngine from './combatEngine.js';
import * as characterEngine from './characterEngine.js';
import * as testEngine from './testEngine.js';
import { ATRIBUTOS, TIERS } from './constants.js';
import { getRegrasMestrePrompt } from './prompts/regras.js';

export default {
  id: 'tresdet',
  nome: '3D&T Alpha',

  resolverAtaque: combatEngine.resolverAtaque,
  calcularIniciativa: combatEngine.calcularIniciativa,

  calcularHP: characterEngine.calcularHP,
  calcularMP: characterEngine.calcularMP,
  calcularAtaque: characterEngine.calcularAtaque,
  calcularDefesa: characterEngine.calcularDefesa,
  getAtributosBase: characterEngine.getAtributosBase,
  getProgressaoNivel: characterEngine.getProgressaoNivel,
  validarCriacao: characterEngine.validarCriacao,

  resolverTeste: testEngine.resolverTeste,

  getWizardStages: () => [
    { id: 'boas_vindas', titulo: 'O Chamado' },
    { id: 'conceito', titulo: 'Conceito' },
    { id: 'caracteristicas', titulo: 'Caracteristicas' },
    { id: 'vantagens', titulo: 'Vantagens' },
    { id: 'desvantagens', titulo: 'Desvantagens' },
    { id: 'equipamentos', titulo: 'Equipamentos' },
    { id: 'magias', titulo: 'Magias' },
    { id: 'resumo', titulo: 'Resumo' },
  ],

  getTiers: () => TIERS,
  getRegrasMestrePrompt,
};
```

- [ ] **Step 7: Register 3D&T in the registry**

In `backend/game-systems/index.js`, add:

```javascript
import tresdetEngine from './tresdet/index.js';

const engines = {
  lunaria: lunariaEngine,
  tresdet: tresdetEngine,
};
```

---

### Task 12: 3D&T catalogs (seeds)

**Goal:** Create seed files for 3D&T-specific vantagens, desvantagens, and monstros.

**Files:**
- Create: `backend/prisma/seed_tresdet_vantagens.js`
- Create: `backend/prisma/seed_tresdet_desvantagens.js`
- Create: `backend/prisma/seed_tresdet_monstros.js`

- [ ] **Step 1: Create `backend/prisma/seed_tresdet_vantagens.js`**

```javascript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const VANTAGENS = [
  { nome: 'Magia Branca', descricao: 'Permite usar magias de cura e protecao.', custo: 1, tipo: ['ativa'], efeito: { tipo: 'magia', escola: 'branca' } },
  { nome: 'Magia Negra', descricao: 'Permite usar magias ofensivas e de destruicao.', custo: 1, tipo: ['ativa'], efeito: { tipo: 'magia', escola: 'negra' } },
  { nome: 'Magia Elemental', descricao: 'Permite manipular elementos naturais.', custo: 1, tipo: ['ativa'], efeito: { tipo: 'magia', escola: 'elemental' } },
  { nome: 'Ataque Especial', descricao: 'Golpe poderoso que causa dano adicional.', custo: 1, tipo: ['ativa'], dano_base: '1d6+2' },
  { nome: 'Arena', descricao: 'Bonus de +2 em FA e FD em um ambiente especifico.', custo: 1, tipo: ['passiva'] },
  { nome: 'Genio', descricao: 'Bonus em testes de inteligencia e conhecimento.', custo: 1, tipo: ['passiva'] },
  { nome: 'Membros Elasticos', descricao: 'Pode atacar a distancia usando F.', custo: 1, tipo: ['passiva'] },
  { nome: 'Voo', descricao: 'Pode voar, ignorando terreno e ganhando vantagem tatica.', custo: 1, tipo: ['passiva'] },
  { nome: 'Tiro Multiplo', descricao: 'Ataca dois alvos por turno com PdF.', custo: 2, tipo: ['ativa'] },
  { nome: 'Ataque Multiplo', descricao: 'Ataca dois alvos por turno com F.', custo: 2, tipo: ['ativa'] },
];

async function main() {
  console.log(`Inserindo ${VANTAGENS.length} vantagens 3D&T...`);
  for (const v of VANTAGENS) {
    await prisma.vantagens.upsert({
      where: { nome_sistema: { nome: v.nome, sistema: 'tresdet' } },
      create: { ...v, sistema: 'tresdet' },
      update: { descricao: v.descricao, custo: v.custo, tipo: v.tipo },
    });
  }
  console.log('Done.');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Create `backend/prisma/seed_tresdet_desvantagens.js`**

```javascript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const DESVANTAGENS = [
  { nome: 'Codigo de Honra', descricao: 'Segue um codigo rigido de conduta. Nao pode mentir, roubar ou atacar desarmados.', custo: -1 },
  { nome: 'Maldicao', descricao: 'Sofre de uma maldicao que o afeta em momentos criticos.', custo: -1 },
  { nome: 'Modelo Especial', descricao: 'Nao e humanoide, tem dificuldades sociais e com equipamentos.', custo: -1 },
  { nome: 'Inculto', descricao: 'Nao sabe ler nem escrever. Penalidade em testes de conhecimento.', custo: -1 },
];

async function main() {
  console.log(`Inserindo ${DESVANTAGENS.length} desvantagens 3D&T...`);
  for (const d of DESVANTAGENS) {
    await prisma.desvantagens.upsert({
      where: { nome_sistema: { nome: d.nome, sistema: 'tresdet' } },
      create: { ...d, sistema: 'tresdet' },
      update: { descricao: d.descricao, custo: d.custo },
    });
  }
  console.log('Done.');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: Create `backend/prisma/seed_tresdet_monstros.js`**

Create basic monsters with 3D&T stats (F/H/R/A/PdF):

```javascript
import { PrismaClient } from '@prisma/client';
import { setAtributosMonstro } from '../helpers/atributosHelper.js';
const prisma = new PrismaClient();

const MONSTROS = [
  { nome: 'Goblin', descricao: 'Criatura pequena e ardilosa.', hp_base: 5, dano_base: '1d6', xp_base: 20, atributos: { F: 1, H: 2, R: 1, A: 1, PdF: 0 } },
  { nome: 'Lobo', descricao: 'Predador rapido e feroz.', hp_base: 10, dano_base: '1d6+1', xp_base: 30, atributos: { F: 2, H: 3, R: 2, A: 1, PdF: 0 } },
  { nome: 'Esqueleto', descricao: 'Morto-vivo de ossos animados.', hp_base: 5, dano_base: '1d6', xp_base: 25, atributos: { F: 1, H: 1, R: 1, A: 2, PdF: 0 } },
  { nome: 'Ogro', descricao: 'Brutamontes enorme e estupido.', hp_base: 25, dano_base: '2d6', xp_base: 80, atributos: { F: 4, H: 1, R: 5, A: 2, PdF: 0 } },
  { nome: 'Dragao Menor', descricao: 'Jovem dragao com sopro de fogo.', hp_base: 30, dano_base: '2d6+2', xp_base: 150, atributos: { F: 4, H: 3, R: 6, A: 4, PdF: 4 } },
];

async function main() {
  console.log(`Inserindo ${MONSTROS.length} monstros 3D&T...`);
  for (const m of MONSTROS) {
    const { atributos, ...dados } = m;
    const monstro = await prisma.monstros.upsert({
      where: { nome_sistema: { nome: m.nome, sistema: 'tresdet' } },
      create: { ...dados, sistema: 'tresdet' },
      update: { descricao: dados.descricao },
    });
    await setAtributosMonstro(monstro.id, atributos);
  }
  console.log('Done.');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 4: Run all 3D&T seeds**

```bash
cd /opt/role-chat-game/backend
node prisma/seed_tresdet_vantagens.js
node prisma/seed_tresdet_desvantagens.js
node prisma/seed_tresdet_monstros.js
```

- [ ] **Step 5: Verify seeds**

```bash
cd /opt/role-chat-game/backend
node -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const v = await p.vantagens.count({ where: { sistema: 'tresdet' } });
  const d = await p.desvantagens.count({ where: { sistema: 'tresdet' } });
  const m = await p.monstros.count({ where: { sistema: 'tresdet' } });
  console.log('3D&T vantagens:', v);
  console.log('3D&T desvantagens:', d);
  console.log('3D&T monstros:', m);
  await p.\$disconnect();
})();
"
```

---

### Task 13: 3D&T wizard stages (backend)

**Goal:** Add 3D&T-specific wizard stages to the backend Mestre Criador.

**Files:**
- Modify: `backend/agents/MestreCriador/stages/stagePolicy.js`
- Modify: `backend/agents/MestreCriador/catalogo/catalogoCriacao.js`
- Modify or create: `backend/agents/MestreCriador/prompts/` (3D&T-specific prompts)

- [ ] **Step 1: Update `stagePolicy.js` — add 3D&T stage flow**

In `backend/agents/MestreCriador/stages/stagePolicy.js`:

Add a separate stage order for 3D&T:

```javascript
export const STAGE_ORDER_TRESDET = [
  'boas_vindas',
  'conceito',
  'caracteristicas',
  'vantagens',
  'desvantagens',
  'equipamentos',
  'magias',
  'resumo',
];

export const STAGE_POLICY_TRESDET = {
  boas_vindas: {
    allowedNext: ['conceito'],
    defaultNext: 'conceito',
    suggestionType: 'nome',
    supportsRefresh: false,
    supportsSkip: false,
    supportsAttributes: false,
    manualProgression: false,
  },
  conceito: {
    allowedNext: ['caracteristicas'],
    defaultNext: 'caracteristicas',
    suggestionType: 'conceito',
    supportsRefresh: true,
    supportsSkip: false,
    supportsAttributes: false,
    manualProgression: false,
  },
  caracteristicas: {
    allowedNext: ['vantagens'],
    defaultNext: 'vantagens',
    suggestionType: 'caracteristicas',
    supportsRefresh: false,
    supportsSkip: false,
    supportsAttributes: true,
    manualProgression: true,
  },
  vantagens: {
    allowedNext: ['desvantagens'],
    defaultNext: 'desvantagens',
    suggestionType: 'vantagem',
    supportsRefresh: true,
    supportsSkip: true,
    supportsAttributes: false,
    manualProgression: true,
  },
  desvantagens: {
    allowedNext: ['equipamentos'],
    defaultNext: 'equipamentos',
    suggestionType: 'desvantagem',
    supportsRefresh: true,
    supportsSkip: true,
    supportsAttributes: false,
    manualProgression: true,
  },
  equipamentos: {
    allowedNext: ['magias'],
    defaultNext: 'magias',
    suggestionType: 'equipamento',
    supportsRefresh: true,
    supportsSkip: true,
    supportsAttributes: false,
    manualProgression: true,
  },
  magias: {
    allowedNext: ['resumo'],
    defaultNext: 'resumo',
    suggestionType: 'magia',
    supportsRefresh: true,
    supportsSkip: true,
    supportsAttributes: false,
    manualProgression: true,
  },
  resumo: {
    allowedNext: [],
    defaultNext: null,
    suggestionType: null,
    supportsRefresh: false,
    supportsSkip: false,
    supportsAttributes: false,
    manualProgression: false,
  },
};
```

Export a function to get the correct policy:
```javascript
export function getStagePolicy(sistema) {
  if (sistema === 'tresdet') return { order: STAGE_ORDER_TRESDET, policy: STAGE_POLICY_TRESDET };
  return { order: STAGE_ORDER, policy: STAGE_POLICY };
}
```

- [ ] **Step 2: Update `catalogoCriacao.js` — filter by sistema**

```javascript
export async function fetchData(sistema = 'lunaria') {
  // ...
  const [racas, classes, vantagens, desvantagens] = await Promise.all([
    db.Raca.findAll(sistema),
    db.Classe.findAll(sistema),
    db.Vantagem.findAll(sistema),
    db.Desvantagem.findAll(sistema),
  ]);
  // ...
}
```

For 3D&T, `racas` and `classes` will return empty arrays (3D&T is classless/raceless). The wizard conceito stage handles this.

- [ ] **Step 3: Create 3D&T-specific prompts**

Create `backend/agents/MestreCriador/prompts/tresdetPrompts.js` with prompts for each 3D&T wizard stage (conceito, caracteristicas, vantagens, etc.). These should guide the Mestre Criador IA to help players build 3D&T characters using the correct terminology and rules.

---

### Task 14: 3D&T wizard stages (frontend)

**Goal:** Create frontend wizard components for 3D&T character creation.

**Files:**
- Create: `frontend/src/Pages/Personagem/Wizard/components/TresDetConceitoBlock.jsx`
- Create: `frontend/src/Pages/Personagem/Wizard/components/TresDetCaracteristicasBlock.jsx`
- Create: `frontend/src/Pages/Personagem/Wizard/components/TresDetVantagensBlock.jsx`
- Modify: `frontend/src/Pages/Personagem/Wizard/stages/stageConfig.js`
- Modify: `frontend/src/Pages/Personagem/Wizard/wizard.model.js`
- Modify: `frontend/src/Pages/Personagem/Wizard/wizard.view.jsx`
- Modify: `frontend/src/Pages/Personagem/Wizard/components/WizardChat.jsx`

- [ ] **Step 1: Create `TresDetConceitoBlock.jsx`**

Concept/description block for 3D&T (no race/class selection):

```jsx
// Simple text description of the character concept
// Shows name + concept description
// No race/class selectors (3D&T is classless/raceless)
```

- [ ] **Step 2: Create `TresDetCaracteristicasBlock.jsx`**

Point-buy distributor for F/H/R/A/PdF (range 0-5):

```jsx
// Similar to AttributeDistributor but with:
// - 5 attributes instead of 6
// - Range 0-5 instead of 1-20
// - Point-buy budget from tier selection
// - Radar chart with 5 vertices
// - Tier selector (Novato/Lutador/Campeao/Lenda/Heroi)
```

- [ ] **Step 3: Create `TresDetVantagensBlock.jsx`**

Advantage selection with point costs:

```jsx
// Shows available vantagens from 3D&T catalog
// Each vantagem has a point cost
// Player has remaining points from tier budget minus caracteristicas
// Desvantagens refund points
```

- [ ] **Step 4: Update `stageConfig.js` — add 3D&T stages**

Add `TRESDET_STAGES` array with config for each 3D&T stage (conceito, caracteristicas, vantagens, desvantagens, equipamentos, magias, resumo).

Export a function:
```javascript
export function getStages(sistema) {
  if (sistema === 'tresdet') return TRESDET_STAGES;
  return STAGES;
}
```

- [ ] **Step 5: Update wizard.model.js**

Add `sistema` to the wizard state. Load it from the historia being created for. Use it to determine which stages to show and which catalogs to load.

- [ ] **Step 6: Update wizard.view.jsx and WizardChat.jsx**

Render the correct stage components based on `sistema`. For 3D&T:
- Skip race/class stages
- Show conceito instead
- Show caracteristicas (F/H/R/A/PdF) instead of atributos (6 Lunaria stats)
- Use 3D&T vantagens/desvantagens catalogs

---

### Task 15: 3D&T frontend (ficha + combate)

**Goal:** Update ficha and combat UI to display 3D&T data correctly.

**Files:**
- Modify: `frontend/src/components/Jogo/Modals/FichaPersonagemModal.jsx`
- Modify: `frontend/src/components/Jogo/Chat/ActionDock.jsx` (if exists)

- [ ] **Step 1: Update FichaPersonagemModal for 3D&T**

When `personagem.sistema === 'tresdet'`:
- Display F/H/R/A/PdF instead of FOR/DES/CON/INT/AGI/CAR
- Show HP = R x 5, PM = R x 5 (if has Magia)
- Show FA and FD calculations instead of ATK/DC
- Show tier label (Lutador, Campeao, etc.)

- [ ] **Step 2: Update combat action UI for 3D&T**

When in a 3D&T combat:
- Show actions: "Ataque (F)", "Ataque (PdF)", "Defesa"
- Show FA/FD in combat results instead of d20 rolls
- Show "dano: FA - FD = X" format

- [ ] **Step 3: Update combat result display**

The combat log should display 3D&T-style results:
```
[Personagem] ataca [Alvo]: FA=8 vs FD=6 → 2 de dano
```
instead of:
```
[Personagem] ataca [Alvo]: d20(15)+3=18 vs DC12 → acertou
```

---

### Task 16: Test 3D&T end-to-end

**Goal:** Verify the complete 3D&T flow works.

- [ ] **Step 1: Create a 3D&T historia**

Create a new historia with `sistema: 'tresdet'` via the historia creation form.

- [ ] **Step 2: Create a 3D&T personagem through wizard**

Go through all wizard stages:
1. Name
2. Concept description
3. Distribute F/H/R/A/PdF
4. Select vantagens
5. Select desvantagens
6. Equipment
7. Magias (if has Magia vantagem)
8. Review/finalize

Verify personagem is created with correct attributes in `atributos_personagem` table.

- [ ] **Step 3: Verify combat with 3D&T rules**

Start a session, trigger combat, verify:
- FA/FD formulas are used (not d20)
- Damage = FA - FD
- Initiative = 1d6 + H
- Monster attacks use 3D&T rules

- [ ] **Step 4: Verify Mestre IA uses correct rules**

Check that the Mestre IA narrates using 3D&T terminology and rules (FA, FD, caracteristicas, etc.).

- [ ] **Step 5: Write automated tests**

Create `backend/tests/tresdetCombat.test.js`:
```javascript
// Test 3D&T combat engine
// - FA calculation: F + H + d6 (melee), PdF + H + d6 (ranged)
// - FD calculation: A + H + d6
// - Damage: FA - FD >= 0
// - Initiative: d6 + H
// - HP: R * 5
// - PM: R * 5 (with Magia)
```

---

### Task 17: Build + deploy Phase 2

- [ ] **Step 1: Run full test suite**

```bash
cd /opt/role-chat-game/backend
npx vitest run
```

- [ ] **Step 2: Build frontend**

```bash
cd /opt/role-chat-game/frontend
sudo rm -rf dist && NODE_OPTIONS="--max-old-space-size=4096" npx vite build && sudo cp -r dist/* /var/www/lunaria-front/
```

- [ ] **Step 3: Restart backend**

```bash
pm2 restart lunaria-back
```

- [ ] **Step 4: Smoke test both systems**

1. Test Lunaria flow (regression — must still work)
2. Test 3D&T flow (new)
3. Verify catalog separation (Lunaria catalogs don't show 3D&T entries and vice-versa)

- [ ] **Step 5: Enable 3D&T in sistema selector**

In the historia creation form, remove `disabled` from the 3D&T option:
```jsx
<option value="tresdet">3D&T Alpha</option>
```

---

## Phase 3: D&D 5e (future — outline only)

Phase 3 follows the same pattern as Phase 2. Detailed implementation plan will be written when Phase 2 is complete and validated. High-level outline below.

---

### Task 18: D&D 5e game engine

- Create `backend/game-systems/dnd5e/combatEngine.js`:
  - d20 + ability mod + proficiency vs AC
  - Damage: weapon die + ability mod
  - Critical: nat 20 = double damage dice
  - Initiative: d20 + DEX mod
  - Death saves: d20, 10+ success, <10 failure, 3 of either
- Create `backend/game-systems/dnd5e/characterEngine.js`:
  - Attributes: STR, DEX, CON, INT, WIS, CHA (3-20)
  - Modifier: floor((score - 10) / 2)
  - HP: hit die + CON mod per level
  - AC: 10 + DEX mod + armor bonus
  - Proficiency bonus: +2 (lv1) to +6 (lv17+)
  - Standard Array (15/14/13/12/10/8) or Point Buy (27 points)
- Create `backend/game-systems/dnd5e/testEngine.js`:
  - d20 + ability mod + proficiency (if proficient) vs DC
  - Advantage: 2d20 take highest
  - Disadvantage: 2d20 take lowest
- Create `backend/game-systems/dnd5e/constants.js`:
  - Spell slots table (full caster)
  - Proficiency bonus table
  - SRD race bonuses
  - SRD class hit dice and features
- Create `backend/game-systems/dnd5e/prompts/regras.js`
- Register in `backend/game-systems/index.js`

### Task 19: D&D 5e catalogs (seeds)

- SRD races: Human, Elf, Dwarf, Halfling, Gnome, Half-Elf, Half-Orc, Tiefling, Dragonborn (with attribute bonuses)
- SRD classes (12): Barbarian through Wizard (with hit die, saving throws, proficiencies, 1 subclass each)
- SRD backgrounds (6): Acolyte, Criminal, Folk Hero, Noble, Sage, Soldier
- SRD spells (~400): cantrips through 9th level
- SRD monsters (~300): with CR and D&D-style stats (STR/DEX/CON/INT/WIS/CHA)
- All entries have `sistema: 'dnd5e'`
- CC-BY-4.0 attribution included in data

### Task 20: D&D 5e wizard stages (backend)

- Stage flow: boas_vindas -> raca -> classe -> background -> atributos -> skills -> equipamentos -> spells -> resumo
- Backend stagePolicy for D&D
- D&D-specific prompts for Mestre Criador

### Task 21: D&D 5e wizard stages (frontend)

- Race selector with attribute bonuses display
- Class selector with hit die, proficiencies
- Background selector
- Standard Array / Point Buy distributor
- Skill proficiency picker
- Starting equipment selector
- Spell picker (cantrips + prepared spells for casters)

### Task 22: D&D 5e frontend (ficha + combate)

- Ficha: STR/DEX/CON/INT/WIS/CHA with modifiers, AC, proficiency bonus, spell slots
- Combat: d20 attack rolls, spell slot tracking, death saves
- Action economy: action, bonus action, reaction display

### Task 23: D&D 5e tests

- Combat engine unit tests
- Character creation validation tests
- Spell slot management tests
- Death save tests
- End-to-end flow test

### Task 24: Build + deploy Phase 3

- Full regression test (Lunaria + 3D&T + D&D)
- Build + deploy
- Enable D&D in sistema selector
