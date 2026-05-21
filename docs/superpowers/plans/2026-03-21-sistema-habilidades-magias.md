# Sistema de Habilidades & Magias — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reestruturar o sistema de habilidades/magias com tabelas de vínculo, slots por classe, aprendizado e nova etapa no wizard.

**Architecture:** Rename `habilidades` → `habilidades_magias` em todo o código. Criar 3 tabelas de vínculo (`hm_classe`, `hm_personagem`, `hm_slots_classe`) + campo `pode_magia` em `racas`. Adaptar combat engine, ownedActions e wizard. A tabela unificada diferencia magias de técnicas via `escola_magia`.

**Tech Stack:** Node.js 22 + Express + Prisma (PostgreSQL) + Redis + Socket.io | React 19 + Vite + Zustand + Tailwind

**Spec:** `docs/superpowers/specs/2026-03-21-sistema-habilidades-magias-design.md`

**Impact:** ~128 arquivos precisam de atualização. Dividido em 3 fases incrementais.

---

## Fase 1: Schema & Models (fundação)

### Task 1: Rename tabela `habilidades` → `habilidades_magias` no Prisma

**Files:**
- Modify: `backend/prisma/schema.prisma` (model definition lines 507-544, relations lines 19, 218, 710)

- [ ] **Step 1: Renomear o model no schema**

No `schema.prisma`:
1. Rename `model habilidades` → `model habilidades_magias` com `@@map("habilidades_magias")`
2. Atualizar a relation em `classes` (line 19): `habilidades_magias habilidades_magias[]`
3. Atualizar a relation em `racas` (line 218): `habilidades_magias habilidades_magias[]`
4. Atualizar a relation em `receitas` (line 710): `habilidade habilidades_magias?`
5. Substituir `@@unique([nome, classe_id])` por `@@unique([nome])` (classe_id será deprecado)

- [ ] **Step 2: Adicionar novas tabelas ao schema**

Adicionar após o model `habilidades_magias`:

```prisma
model hm_classe {
  id             Int                @id @default(autoincrement())
  habilidade_id  Int
  classe_id      Int
  habilidades_magias habilidades_magias @relation(fields: [habilidade_id], references: [id], onDelete: Cascade)
  classes            classes            @relation(fields: [classe_id], references: [id], onDelete: Cascade)
  @@unique([habilidade_id, classe_id])
  @@index([classe_id])
}

model hm_raca {
  id             Int                @id @default(autoincrement())
  habilidade_id  Int
  raca_id        Int
  habilidades_magias habilidades_magias @relation(fields: [habilidade_id], references: [id], onDelete: Cascade)
  racas              racas              @relation(fields: [raca_id], references: [id], onDelete: Cascade)
  @@unique([habilidade_id, raca_id])
  @@index([raca_id])
}

model hm_personagem {
  id             Int                @id @default(autoincrement())
  personagem_id  Int
  habilidade_id  Int
  origem         String             @default("criacao")
  created_at     DateTime           @default(now())
  personagens        personagens        @relation(fields: [personagem_id], references: [id], onDelete: Cascade)
  habilidades_magias habilidades_magias @relation(fields: [habilidade_id], references: [id], onDelete: Cascade)
  @@unique([personagem_id, habilidade_id])
  @@index([personagem_id])
}

model hm_slots_classe {
  id         Int      @id @default(autoincrement())
  classe_id  Int
  nivel      Int
  slots      Int      @default(0)
  classes classes @relation(fields: [classe_id], references: [id], onDelete: Cascade)
  @@unique([classe_id, nivel])
}
```

- [ ] **Step 3: Adicionar campo `pode_magia` na tabela `racas`**

No model `racas` do schema:
```prisma
pode_magia Boolean @default(true)
```

- [ ] **Step 4: Adicionar relations reversas**

No model `classes`, adicionar:
```prisma
hm_classe       hm_classe[]
hm_slots_classe hm_slots_classe[]
```

No model `racas`, adicionar:
```prisma
hm_raca hm_raca[]
```

No model `personagens`, adicionar:
```prisma
hm_personagem hm_personagem[]
```

No model `habilidades_magias`, adicionar:
```prisma
hm_classe      hm_classe[]
hm_raca        hm_raca[]
hm_personagem  hm_personagem[]
```

- [ ] **Step 5: ANTES do db push — Renomear tabela via SQL raw**

**CRÍTICO:** `prisma db push` com model renomeado CRIA tabela nova e DROPA a antiga (perda de dados). Deve-se renomear via SQL primeiro:

```bash
cd /opt/role-chat-game/backend
node -e "
const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();
(async()=>{
  // Verificar duplicatas de nome antes de mudar unique constraint
  const dupes=await p.\$queryRaw\`SELECT nome,COUNT(*)::int as qt FROM habilidades GROUP BY nome HAVING COUNT(*)>1\`;
  if(dupes.length>0){console.log('DUPLICATAS ENCONTRADAS:',dupes);process.exit(1);}
  // Renomear tabela e constraints
  await p.\$executeRaw\`ALTER TABLE habilidades DROP CONSTRAINT IF EXISTS habilidades_nome_classe_id_key\`;
  await p.\$executeRaw\`ALTER TABLE habilidades RENAME TO habilidades_magias\`;
  await p.\$executeRaw\`ALTER INDEX IF EXISTS habilidades_pkey RENAME TO habilidades_magias_pkey\`;
  console.log('Tabela renomeada com sucesso');
  await p.\$disconnect();
})();
"
```

- [ ] **Step 6: Aplicar schema (novas tabelas + pode_magia)**

```bash
npx prisma db push
npx prisma generate
```

- [ ] **Step 7: Criar backup de segurança**

```bash
pg_dump -t habilidades_magias -t hm_classe -t hm_raca -t hm_personagem -t hm_slots_classe lunaria > /tmp/hm_backup_$(date +%Y%m%d).sql
```

- [ ] **Step 6: Commit**

```bash
git add backend/prisma/schema.prisma
git commit -m "feat(schema): rename habilidades to habilidades_magias + new binding tables"
```

---

### Task 2: Rename Backend Model

**Files:**
- Rename: `backend/Model/Habilidade.js` → `backend/Model/HabilidadeMagia.js`
- Modify: `backend/Model/index.js`

- [ ] **Step 1: Renomear o arquivo**

```bash
mv backend/Model/Habilidade.js backend/Model/HabilidadeMagia.js
```

- [ ] **Step 2: Atualizar o Model internamente**

No `HabilidadeMagia.js`:
- Substituir `prisma.habilidades` → `prisma.habilidades_magias` (todos os occurrences)
- Substituir nome do export se necessário

- [ ] **Step 3: Atualizar `backend/Model/index.js`**

Substituir import e key:
- `import Habilidade from './Habilidade.js'` → `import HabilidadeMagia from './HabilidadeMagia.js'`
- `Habilidade: Habilidade(prisma)` → `HabilidadeMagia: HabilidadeMagia(prisma)`

**IMPORTANTE:** Manter alias `Habilidade` temporário para não quebrar 50+ referências de uma vez:
```javascript
const models = {
  HabilidadeMagia: HabilidadeMagia(prisma),
  // Legacy alias — remover quando todas as referências forem atualizadas
  get Habilidade() { return this.HabilidadeMagia; },
};
```

- [ ] **Step 4: Adicionar Models para as novas tabelas**

Criar `backend/Model/HmClasse.js`:
```javascript
const HmClasse = (prisma) => {
  const model = prisma.hm_classe;
  return {
    async findByHabilidade(habilidadeId) {
      return model.findMany({ where: { habilidade_id: habilidadeId }, include: { classes: true } });
    },
    async findByClasse(classeId) {
      return model.findMany({ where: { classe_id: classeId }, include: { habilidades_magias: true } });
    },
    async vincular(habilidadeId, classeId) {
      return model.upsert({
        where: { habilidade_id_classe_id: { habilidade_id: habilidadeId, classe_id: classeId } },
        create: { habilidade_id: habilidadeId, classe_id: classeId },
        update: {}
      });
    },
    async desvincular(habilidadeId, classeId) {
      return model.deleteMany({ where: { habilidade_id: habilidadeId, classe_id: classeId } });
    }
  };
};
export default HmClasse;
```

Criar `backend/Model/HmPersonagem.js`:
```javascript
const HmPersonagem = (prisma) => {
  const model = prisma.hm_personagem;
  return {
    async findByPersonagem(personagemId) {
      return model.findMany({
        where: { personagem_id: personagemId },
        include: { habilidades_magias: true }
      });
    },
    async aprender(personagemId, habilidadeId, origem = 'criacao') {
      return model.upsert({
        where: { personagem_id_habilidade_id: { personagem_id: personagemId, habilidade_id: habilidadeId } },
        create: { personagem_id: personagemId, habilidade_id: habilidadeId, origem },
        update: { origem }
      });
    },
    async desaprender(personagemId, habilidadeId) {
      return model.deleteMany({ where: { personagem_id: personagemId, habilidade_id: habilidadeId } });
    },
    async contarMagias(personagemId) {
      return model.count({
        where: {
          personagem_id: personagemId,
          habilidades_magias: {
            AND: [
              { escola_magia: { not: 'nenhuma' } },
              { escola_magia: { not: null } }
            ]
          }
        }
      });
    }
  };
};
export default HmPersonagem;
```

Criar `backend/Model/HmSlotsClasse.js`:
```javascript
const HmSlotsClasse = (prisma) => {
  const model = prisma.hm_slots_classe;
  return {
    async getSlots(classeId, nivel) {
      const row = await model.findUnique({
        where: { classe_id_nivel: { classe_id: classeId, nivel } }
      });
      return row?.slots || 0;
    },
    async getProgressao(classeId) {
      return model.findMany({ where: { classe_id: classeId }, orderBy: { nivel: 'asc' } });
    }
  };
};
export default HmSlotsClasse;
```

Criar `backend/Model/HmRaca.js`:
```javascript
const HmRaca = (prisma) => {
  const model = prisma.hm_raca;
  return {
    async findByRaca(racaId) {
      return model.findMany({ where: { raca_id: racaId }, include: { habilidades_magias: true } });
    },
    async vincular(habilidadeId, racaId) {
      return model.upsert({
        where: { habilidade_id_raca_id: { habilidade_id: habilidadeId, raca_id: racaId } },
        create: { habilidade_id: habilidadeId, raca_id: racaId },
        update: {}
      });
    }
  };
};
export default HmRaca;
```

- [ ] **Step 5: Registrar novos Models no index.js**

```javascript
import HmClasse from './HmClasse.js';
import HmRaca from './HmRaca.js';
import HmPersonagem from './HmPersonagem.js';
import HmSlotsClasse from './HmSlotsClasse.js';

// No objeto models:
HmClasse: HmClasse(prisma),
HmRaca: HmRaca(prisma),
HmPersonagem: HmPersonagem(prisma),
HmSlotsClasse: HmSlotsClasse(prisma),
```

- [ ] **Step 6: Commit**

```bash
git add backend/Model/
git commit -m "feat(models): rename Habilidade to HabilidadeMagia + new HM models"
```

---

### Task 3: Seeds para novas tabelas

**Files:**
- Create: `backend/prisma/seed_hm_classe.js`
- Create: `backend/prisma/seed_hm_slots_classe.js`
- Create: `backend/prisma/seed_pode_magia.js`
- Modify: `backend/prisma/seed_habilidades.js` (rename table reference)

- [ ] **Step 1: Seed `hm_classe`**

Criar `backend/prisma/seed_hm_classe.js`:
- Ler todas as habilidades_magias do banco
- Para cada uma com `classe_id != null`: criar vínculo com essa classe
- Para cada uma com `classe_id = null AND raca_id = null` (universais):
  - Se `escola_magia` é null ou 'nenhuma' (técnica): vincular a TODAS as classes
  - Se é magia: vincular a todas as classes que têm slots > 0
- Para cada uma com `raca_id != null`: NÃO vincular (são raciais, vão para `hm_raca`)

```bash
cd /opt/role-chat-game/backend && node prisma/seed_hm_classe.js
```

- [ ] **Step 2: Seed `hm_raca`** (dentro do mesmo script ou separado)

Criar `backend/prisma/seed_hm_raca.js`:
- Ler todas as habilidades_magias com `raca_id != null`
- Criar vínculo na tabela `hm_raca`

- [ ] **Step 3: Seed `hm_slots_classe`**

Criar `backend/prisma/seed_hm_slots_classe.js` com progressão para cada classe.
Consultar `backend/prisma/schema.prisma` e `mds/catalogos/classes_completo.json` para listar todas as classes e definir slots 1-20 para cada uma.

Valores base (ajustáveis):
- Classes full-caster (Mago, Feiticeiro, Druida): base 4, +1/nível
- Classes half-caster (Paladino, Ranger, Bardo): base 2, +1/2 níveis
- Classes minor-caster (Ninja, Monge): base 1, +1/3 níveis
- Classes sem magia (Guerreiro, Bárbaro): 0 em todos os níveis

- [ ] **Step 4: Seed `pode_magia` nas raças**

Criar `backend/prisma/seed_pode_magia.js`:
- Setar `pode_magia: false` para: Golem, Androide (e outras raças sem aptidão mágica conforme lore)
- Default é `true` para todas as outras

- [ ] **Step 5: Atualizar `seed_habilidades.js`**

Substituir `prisma.habilidades` → `prisma.habilidades_magias`

- [ ] **Step 6: Executar seeds**

**ORDEM IMPORTANTE:** `hm_slots_classe` ANTES de `hm_classe` (pois o seed de hm_classe consulta quais classes têm slots > 0).

```bash
cd /opt/role-chat-game/backend
node prisma/seed_habilidades.js
node prisma/seed_pode_magia.js
node prisma/seed_hm_slots_classe.js
node prisma/seed_hm_raca.js
node prisma/seed_hm_classe.js
```

- [ ] **Step 7: Commit**

```bash
git add backend/prisma/seed_*.js
git commit -m "feat(seeds): populate hm_classe, hm_raca, hm_slots_classe, pode_magia"
```

---

### Task 4: Migrar personagens existentes

**Files:**
- Create: `backend/prisma/migrate_personagem_habilidades.js`

- [ ] **Step 1: Script de migração**

Para cada personagem no banco:
1. Buscar classe_id e raca_id
2. Buscar `pode_magia` da raça
3. Buscar habilidades raciais via `hm_raca` → inserir em `hm_personagem` com `origem: "racial"`
4. Se `pode_magia`:
   - Buscar slots do nível 1 da classe via `hm_slots_classe`
   - Buscar magias disponíveis via `hm_classe` com `nivel_requerido <= 1` e `escola_magia != null/nenhuma`
   - Selecionar aleatórias até preencher slots
   - Inserir em `hm_personagem` com `origem: "criacao"`
5. Buscar técnicas de combate da classe (escola_magia = null/nenhuma) via `hm_classe`
   - Inserir todas com `nivel_requerido <= nivel_personagem` em `hm_personagem` com `origem: "criacao"`

- [ ] **Step 2: Executar migração**

```bash
cd /opt/role-chat-game/backend && node prisma/migrate_personagem_habilidades.js
```

- [ ] **Step 3: Verificar resultados**

```bash
node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{const t=await p.hm_personagem.count();const m=await p.hm_personagem.groupBy({by:['origem'],_count:true});console.log('Total vínculos:',t);console.log('Por origem:',JSON.stringify(m));await p.\$disconnect();})()"
```

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/migrate_personagem_habilidades.js
git commit -m "feat(migration): populate hm_personagem for existing characters"
```

---

## Fase 2: Backend — Adaptar Helpers e Combat Engine

### Task 5: Atualizar `personagensHelper.js`

**Files:**
- Modify: `backend/helpers/personagensHelper.js`

- [ ] **Step 1: Substituir busca de habilidades**

Trocar o bloco de linhas 42-64 (queries `findByClasse` + `findByRaca` + filtro manual) por:

```javascript
// Buscar habilidades/magias do personagem via tabela de vínculo
let habilidadesClasse = [];
let magiasUniversais = [];
try {
  const vinculos = await db.HmPersonagem.findByPersonagem(personagem.id);
  const todas = vinculos
    .map(v => v.habilidades_magias)
    .filter(Boolean);
  habilidadesClasse = todas.filter(h =>
    !h.escola_magia || h.escola_magia === 'nenhuma'
  );
  magiasUniversais = todas.filter(h =>
    h.escola_magia && h.escola_magia !== 'nenhuma'
  );
} catch (e) {
  log.warn({ err: e, personagemId: personagem.id }, 'Erro ao buscar habilidades do personagem');
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/helpers/personagensHelper.js
git commit -m "refactor: personagensHelper reads from hm_personagem"
```

---

### Task 6: Atualizar `ownedActionsHelper.js`

**Files:**
- Modify: `backend/helpers/ownedActionsHelper.js`

- [ ] **Step 1: Adaptar `getExplicitOwnedSkills` e `getExplicitOwnedSpells`**

O `personagemCompleto` agora terá `habilidadesClasse` e `magias` populados via `hm_personagem` (feito na Task 5). Os campos antigos (`habilidadesProprias`, `magiasConhecidas`, etc.) ficam como fallback.

Nenhuma mudança funcional necessária se a Task 5 popular os campos corretamente. Verificar que não há lógica quebrada.

- [ ] **Step 2: Commit (se houver mudanças)**

---

### Task 7: Atualizar `combateHelper.js` — resolução de habilidades

**Files:**
- Modify: `backend/helpers/combateHelper.js`

- [ ] **Step 1: Atualizar `_resolverHabilidade`**

Na função (linha ~1321), a busca por habilidade agora usa a lista que vem de `hm_personagem`. Se o personagem não tem a habilidade vinculada, retorna erro. Isso já é o comportamento atual — a mudança é que a lista fonte agora é filtrada corretamente.

Substituir referências a `db.Habilidade` → `db.HabilidadeMagia` onde necessário.

- [ ] **Step 2: Atualizar `selecionarHabilidadeMonstro`**

Monstros usam campo JSON `habilidades` — não afetado pelo rename de tabela. Nenhuma mudança necessária.

- [ ] **Step 3: Suporte a ambos formatos de `escalamento`**

Na função que resolve dano/efeito de habilidade, adicionar detecção de formato:
```javascript
function resolverEscalamento(habilidade, nivelPersonagem) {
  const esc = habilidade.escalamento;
  if (!esc) return {};
  // Formato novo: array de upgrades
  if (Array.isArray(esc.upgrades)) {
    const aplicaveis = esc.upgrades.filter(u => u.nivel <= nivelPersonagem);
    return aplicaveis.length > 0 ? aplicaveis[aplicaveis.length - 1] : {};
  }
  // Formato legado: { por_nivel, a_cada }
  if (esc.por_nivel && esc.a_cada) {
    const vezes = Math.floor((nivelPersonagem - 1) / esc.a_cada);
    return { dano_bonus: esc.por_nivel, multiplicador: vezes };
  }
  return {};
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/helpers/combateHelper.js
git commit -m "refactor: combateHelper uses HabilidadeMagia + escalamento dual format"
```

---

### Task 8: Rename em Controllers e Routes

**Files:**
- Rename: `backend/controllers/habilidades/habilidadesController.js` → `backend/controllers/habilidades-magias/habilidadesMagiasController.js`
- Rename: `backend/routes/habilidades.js` → `backend/routes/habilidades-magias.js`
- Modify: `backend/routes/index.js`
- Modify: `backend/routes/catalogos.js`

- [ ] **Step 1: Renomear controller**

```bash
mkdir -p backend/controllers/habilidades-magias
mv backend/controllers/habilidades/habilidadesController.js backend/controllers/habilidades-magias/habilidadesMagiasController.js
```

No controller, substituir `db.Habilidade` → `db.HabilidadeMagia` e `prisma.habilidades` → `prisma.habilidades_magias`.

- [ ] **Step 2: Renomear route**

```bash
mv backend/routes/habilidades.js backend/routes/habilidades-magias.js
```

Atualizar import do controller no route file.

- [ ] **Step 3: Atualizar `routes/index.js`**

```javascript
import habilidadesMagiasRoutes from './habilidades-magias.js';
// ...
'habilidades-magias': '/habilidades-magias',
// Manter rota legacy para não quebrar frontend durante transição:
router.use('/habilidades', authenticateToken, habilidadesMagiasRoutes);
router.use('/habilidades-magias', authenticateToken, habilidadesMagiasRoutes);
```

- [ ] **Step 4: Atualizar `routes/catalogos.js`**

Substituir `prisma.habilidades.findMany` → `prisma.habilidades_magias.findMany`.

- [ ] **Step 5: Commit**

```bash
git add backend/controllers/ backend/routes/
git commit -m "refactor: rename habilidades controller and routes to habilidades-magias"
```

---

### Task 9: Atualizar helpers, scripts e seed restantes (batch rename)

**Files:**
- Modify: `backend/helpers/claimDetector.js`
- Modify: `backend/helpers/turnStateBuilder.js`
- Modify: `backend/helpers/finalizacaoInicialHelper.js`
- Modify: `backend/helpers/finalizacaoPreviewHelper.js`
- Modify: `backend/helpers/catalogJsonHelper.js`
- Modify: `backend/helpers/testeHelper.js`
- Modify: `backend/helpers/intentClassifier.js`
- Modify: `backend/helpers/jsonSchemas.js`
- Modify: `backend/helpers/acoesProcessor.js`
- Modify: `backend/helpers/combat/combatRoundResult.js`
- Modify: `backend/controllers/personagem/personagemController.js` (mesmo padrão que personagensHelper — atualizar para hm_personagem)
- Modify: `backend/seed-from-json.js` (referencia `prisma.habilidades` diretamente)
- Modify: `backend/scripts/audit-images.js`
- Modify: `backend/scripts/daily-image-job.js`
- Modify: `backend/scripts/batch-generate-images.js`
- Modify: `backend/config/testesConfig.js`

- [ ] **Step 1: Em cada arquivo, substituir `db.Habilidade` → `db.HabilidadeMagia`**

Usar busca e substituição. Não alterar nomes de variáveis locais como `habilidades` (são nomes de variável, não referências ao Model).

- [ ] **Step 2: Commit**

```bash
git add backend/helpers/
git commit -m "refactor: update helper references from Habilidade to HabilidadeMagia"
```

---

### Task 10: Atualizar WebSocket engines e Agents

**Files:**
- Modify: `backend/websocket/engines/masterNarrationEngine.js`
- Modify: `backend/websocket/engines/combatEngine.js`
- Modify: `backend/agents/Personagem/finalizacao/FinalizacaoInicialAgent.js`
- Modify: `backend/agents/Personagem/finalizacao/prompts.js`
- Modify: `backend/agents/Mestre/catalogo/catalogoMestre.js`
- Modify: `backend/agents/Mestre/contexto/mestreContextBuilder.js`
- Modify: `backend/agents/Revisores/reviewOrchestrator.js`

- [ ] **Step 1: Substituir referências a `db.Habilidade` em cada arquivo**

- [ ] **Step 2: Verificar que monstros não são afetados** (usam JSON `habilidades`, não FK)

- [ ] **Step 3: Commit**

```bash
git add backend/websocket/ backend/agents/
git commit -m "refactor: update websocket engines and agents to HabilidadeMagia"
```

---

### Task 11: Restart e teste do backend

- [ ] **Step 1: Restart PM2**

```bash
cd /opt/role-chat-game/backend && pm2 restart lunaria-back
```

- [ ] **Step 2: Verificar logs de erro**

```bash
pm2 logs lunaria-back --lines 50 | grep -i "error\|cannot find\|undefined"
```

- [ ] **Step 3: Testar endpoint**

```bash
curl -s https://api.lunaria.app.br/habilidades | head -100
curl -s https://api.lunaria.app.br/habilidades-magias | head -100
```

- [ ] **Step 4: Commit se houver fixes**

---

## Fase 3: Frontend

### Task 12: Rename frontend service e store

**Files:**
- Rename: `frontend/src/services/HabilidadeService.js` → `frontend/src/services/HabilidadeMagiaService.js`
- Modify: `frontend/src/store/habilidade/states.js`
- Modify: `frontend/src/store/habilidade/actions.js`
- Modify: `frontend/src/utils/characterOwnedActions.js`

- [ ] **Step 1: Renomear service**

Atualizar `this.baseUrl = '/habilidades'` → `'/habilidades-magias'` (ou manter `/habilidades` se a rota legacy está ativa).

- [ ] **Step 2: Atualizar store**

Renomear internamente mas manter a interface pública igual (nomes de state/actions) para minimizar impacto nos componentes.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/ frontend/src/store/
git commit -m "refactor: rename frontend service and store to habilidades-magias"
```

---

### Task 13: Atualizar páginas e componentes frontend

**Files:**
- Modify: `frontend/src/Pages/Habilidade/Lista/habilidade-lista.model.js`
- Modify: `frontend/src/Pages/Habilidade/Lista/habilidade-lista.view.jsx`
- Modify: `frontend/src/Pages/Habilidade/Nova/` (3 arquivos)
- Modify: `frontend/src/Pages/Habilidade/Editar/` (3 arquivos)
- Modify: `frontend/src/Pages/Habilidade/Ver/` (3 arquivos)
- Modify: `frontend/src/Pages/Personagem/Ver/personagem-ver.view.jsx`
- Modify: `frontend/src/Pages/Monstro/Ver/monstro-ver.model.js`
- Modify: `frontend/src/components/sidebar/index.jsx`
- Modify: `frontend/src/components/Jogo/Chat/ActionDock.jsx`
- Modify: `frontend/src/components/Jogo/Etapas/EtapaJogoRPG.model.js`
- Modify: `frontend/src/components/Jogo/Etapas/EtapaJogoRPG.view.jsx`
- Modify: `frontend/src/models/Personagem.js`
- Modify: `frontend/src/models/Classe.js`
- Modify: `frontend/src/constants/routes.js` (HABILIDADES path)
- Modify: `frontend/src/services/index.js` (import/export do service)
- Modify: `frontend/src/store/habilidade/index.js` (store entry point)

- [ ] **Step 1: Sidebar** — Atualizar path `/habilidades` → `/habilidades-magias` e label

- [ ] **Step 2: Lista page** — Atualizar imports e referências ao store

- [ ] **Step 3: Personagem Ver** — Separar visualmente habilidades e magias na ficha

- [ ] **Step 4: Jogo/Combat** — ActionDock já recebe `habilidadesPersonagem` e `magiasPersonagem` do model. Verificar que a pipeline está correta.

- [ ] **Step 5: Wizard components** — Atualizar `EquipamentosBlock`, `DestinoResolutivaBlock`, `WizardCreationResultModal`, `FinalizacaoPanel`

- [ ] **Step 6: Commit**

```bash
git add frontend/src/
git commit -m "refactor: update frontend pages and components to habilidades-magias"
```

---

### Task 14: Nova etapa "Grimório" no wizard

**Files:**
- Create: `frontend/src/Pages/Personagem/Wizard/stages/GrimorioStage.jsx`
- Modify: `frontend/src/Pages/Personagem/Wizard/stages/stageConfig.js`
- Modify: `frontend/src/Pages/Personagem/Wizard/wizard.model.js`

- [ ] **Step 1: Atualizar stageConfig.js**

Separar etapa `equipamentos` em 3:
- `equipamentos` (etapa 8) — Mestre dá itens
- `habilidades_iniciais` (etapa 9) — Mestre dá técnicas de combate
- `grimorio` (etapa 10) — Jogador escolhe magias nos slots

Adicionar configuração do grimório:
```javascript
{
  id: 'grimorio',
  titulo: 'Grimório',
  subtitulo: 'Escolha suas magias iniciais',
  descricao: 'Selecione as magias que deseja conhecer',
  icone: '🔮',
  component: 'GrimorioStage',
  requireExplicitContinue: true,
  condicao: (dados) => dados.raca?.pode_magia !== false && dados.slotsDisponiveis > 0
}
```

- [ ] **Step 2: Criar `GrimorioStage.jsx`**

Componente que:
1. Consulta `hm_slots_classe` para obter slots disponíveis no nível 1
2. Consulta `hm_classe` para listar magias disponíveis (nivel_requerido <= 1)
3. Mostra grid de magias com seleção por checkbox
4. Mostra contador de slots usados/disponíveis
5. Ao confirmar, chama API para criar registros em `hm_personagem`

- [ ] **Step 3: Criar endpoint backend para grimório**

`POST /personagens/:id/magias` — recebe array de `habilidade_id` e cria vínculos.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/Pages/Personagem/Wizard/ backend/routes/ backend/controllers/
git commit -m "feat: add Grimório stage to character creation wizard"
```

---

### Task 15: Testes

**Files:**
- Modify: `backend/tests/ownedActionsHelper.test.js`
- Modify: `backend/tests/claimDetector.test.js`
- Modify: `backend/tests/combatIntegration.test.js`
- Modify: `backend/tests/gameEngine.test.js`
- Modify: All test fixtures referencing `habilidades`

- [ ] **Step 1: Atualizar fixtures**

Em todos os fixtures `.json` e test files, substituir referências ao Model `Habilidade` → `HabilidadeMagia`.

- [ ] **Step 2: Rodar testes**

```bash
cd /opt/role-chat-game/backend && npx vitest run 2>&1 | tail -20
```

- [ ] **Step 3: Corrigir falhas**

- [ ] **Step 4: Commit**

```bash
git add backend/tests/
git commit -m "test: update test fixtures for habilidades-magias rename"
```

---

### Task 16: Build e deploy frontend

- [ ] **Step 1: Corrigir CSS build** (pré-existente)

Em `frontend/src/index.css`:
1. Adicionar no `@theme inline`: `--font-family-fantasy: 'EB Garamond', serif; --font-family-modern: 'DM Sans', sans-serif;`
2. Remover `}` órfã da linha 1122

- [ ] **Step 2: Build**

```bash
cd /opt/role-chat-game/frontend
sudo rm -rf dist
NODE_OPTIONS="--max-old-space-size=4096" npx vite build
sudo cp -r dist/* /var/www/lunaria-front/
```

- [ ] **Step 3: Restart backend final**

```bash
pm2 restart lunaria-back
```

- [ ] **Step 4: Commit e tag**

```bash
git add .
git commit -m "feat: complete habilidades-magias system with slots and grimório"
```

---

## Resumo de Tasks

| Task | Descrição | Fase | Estimativa |
|---|---|---|---|
| 1 | Schema Prisma (rename + novas tabelas) | 1 | Médio |
| 2 | Backend Models (rename + novos) | 1 | Médio |
| 3 | Seeds (hm_classe, hm_slots, pode_magia) | 1 | Grande |
| 4 | Migrar personagens existentes | 1 | Médio |
| 5 | personagensHelper.js | 2 | Pequeno |
| 6 | ownedActionsHelper.js | 2 | Pequeno |
| 7 | combateHelper.js + escalamento | 2 | Médio |
| 8 | Controllers e Routes (rename) | 2 | Médio |
| 9 | Helpers restantes (batch rename) | 2 | Médio |
| 10 | WebSocket engines e Agents | 2 | Médio |
| 11 | Restart e teste backend | 2 | Pequeno |
| 12 | Frontend service e store | 3 | Pequeno |
| 13 | Frontend pages e components | 3 | Grande |
| 14 | Nova etapa Grimório no wizard | 3 | Grande |
| 15 | Testes | 3 | Médio |
| 16 | Build e deploy | 3 | Pequeno |
