# Reconciliação de Drift, Sistema H&M e Deploy Controlado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sair de um estado de repositório com drift severo (arquivos usados em runtime nunca commitados, schema Prisma divergente do histórico de migrations) para um estado consistente, com o sistema de Habilidades & Magias (H&M) fechado e um deploy controlado em produção.

**Architecture:** Cinco fases sequenciais com freeze de features. Primeiro travamos o estado real (commit do drift), depois reconciliamos o banco com UMA migration de reconciliação (incluindo o rename `habilidades`→`habilidades_magias` como `ALTER TABLE ... RENAME`), saneamos os testes, fechamos o sistema H&M com o modelo híbrido decidido, e por fim publicamos e fazemos deploy controlado.

**Tech Stack:** Node.js 22 + Express 4 + Prisma 6 (PostgreSQL) + Redis/BullMQ + Socket.IO | React 19 + Vite 6 + Zustand 5 + Tailwind 4

**Specs:**
- `docs/superpowers/specs/2026-03-21-sistema-habilidades-magias-design.md`
- `docs/superpowers/specs/2026-03-23-engine-boundaries-tresdet.md`
- Spec do modelo híbrido H&M: a ser criada na Fase 3.0.

**Sequência:** Fase 0 → Fase 1 → (Fase 2 ∥ Fase 3) → Fase 4. **Freeze de features ativo** até o fim da Fase 4.

---

## Decisões travadas (não reabrir)

Estas decisões foram fechadas em 3 rodadas de revisão técnica. Implementar exatamente como descrito.

| # | Decisão |
|---|---------|
| D1 | **Modelo HÍBRIDO de magias.** `habilidades_magias` é a tabela unificada para Lunaria e D&D 5e (técnicas + magias). 3D&T usa tabela própria `magias_tresdet` (já existe). Nada de fundir os dois. |
| D2 | **D&D 5e MVP: só magias "conhecidas".** Sem preparação de magias, sem rituais. Slots existem mas o MVP entrega apenas a lista de conhecidas. |
| D3 | **3D&T usa só PM, sem slots.** Conjuração consome PM; descanso recupera R×d6. Sem sistema de slots para 3D&T. |
| D4 | **`hm_raca` é a fonte de verdade das habilidades raciais.** Seeds e runtime resolvem habilidade racial pelo vínculo `hm_raca`, não por coluna em `racas` nem por JSON. |
| D5 | **Personagens muito antigos serão DELETADOS na migração.** Critério de corte exato a definir via diagnóstico (Fase 3.7) — não deletar nada antes do diagnóstico aprovado pelo tech-lead. |
| D6 | **Rename de tabela é `ALTER TABLE ... RENAME`, nunca DROP+CREATE.** Vale para `habilidades`→`habilidades_magias` e qualquer outro rename. |
| D7 | **Dev usa `prisma db push`; NUNCA `migrate reset`.** Deploy usa `prisma migrate deploy`. A migration de reconciliação (Fase 1) é a exceção controlada: é escrita/editada à mão e aplicada com `migrate deploy`. |

---

## Visão geral das fases

| Fase | Título | Dono | Depende de | Bloqueia |
|------|--------|------|------------|----------|
| 0 | Travar o estado | dev-lunaria | — | Fase 1 |
| 1 | Migration de reconciliação | dev-lunaria (revisão tech-lead) | Fase 0 | Fases 2, 3 |
| 2 | Saneamento de testes | dev-lunaria | Fase 1 | Fase 4 |
| 3 | Fechar o sistema H&M | dev / designer / qa | Fase 1 | Fase 4 |
| 4 | Deploy controlado | dev / qa | Fases 2 e 3 | — (levanta o freeze) |

---

## Fase 0 — Travar o estado

**Dono:** dev-lunaria. **Objetivo:** o repositório passa a refletir o que o app realmente roda. Hoje `Model/index.js` (commitado) importa `Model/HabilidadeMagia.js` e `Model/Hm*.js` que **nunca foram commitados** — o HEAD do backend está quebrado. Esta fase é pré-requisito de tudo.

> O passo-a-passo executável detalhado da Fase 0 é entregue à parte para o dev-lunaria (ver "ENTREGA 2"). Resumo das sub-tarefas abaixo.

- [ ] **0.1** Commitar no submódulo `backend` todos os arquivos untracked usados em runtime: `Model/HabilidadeMagia.js`, `Model/Hm{Classe,Raca,Personagem,SlotsClasse}.js`, `controllers/habilidades-magias/`, `routes/habilidades-magias.js`, `game-systems/{dnd5e,lunaria}/*` e `game-systems/index.js` untracked, helpers (`atributosHelper.js`), seeds (`seed_hm_*.js`, `seed_dnd5e_*.js`, `seed_tresdet_monstros.js`, `seed_pode_magia.js`), scripts de migração de dados (`prisma/migrate_*.{cjs,js}`), specs/plans novos.
- [ ] **0.2** Commitar os arquivos modificados que pertencem ao mesmo conjunto de mudança (schema, models, controllers, routes/index.js, helpers, engines).
- [ ] **0.3** Criar/atualizar `.gitignore` (raiz e backend): adicionar os `.png` de auditoria/screenshots e `backend/.env.save`.
- [ ] **0.4** Gerar o inventário do drift de schema:
  ```bash
  cd /opt/role-chat-game/backend
  npx prisma migrate diff \
    --from-migrations prisma/migrations \
    --to-schema-datamodel prisma/schema.prisma \
    --script > /opt/role-chat-game/.drift-inventory.sql
  ```
- [ ] **0.5** Conferir no banco de **staging** se a tabela física se chama `habilidades` ou `habilidades_magias` (define se o rename já foi aplicado por `db push` ou não).
- [ ] **0.6** Confirmar com o tech-lead a lista de arquivos untracked "suspeitos" antes de commitar (ver ENTREGA 2).

**Critérios de aceite (qa-lunaria / tech-lead):**
- `git status` no submódulo `backend` não lista nenhum arquivo `.js` usado em runtime como untracked.
- O backend sobe (`bin/www`) sem erro de módulo não encontrado.
- `.drift-inventory.sql` existe e contém o DDL do drift (inclusive o rename da tabela `habilidades`).
- Nenhum `.png` nem `.env.save` aparece em `git status`.

---

## Fase 1 — Migration de reconciliação

**Dono:** dev-lunaria. **Revisão obrigatória:** tech-lead-lunaria. **Depende de:** Fase 0.

**Objetivo:** UMA única migration que reconcilia o histórico de migrations com o `schema.prisma` atual, sem perder dados e sem `db push`/`migrate reset`.

- [ ] **1.1 Gerar o esqueleto da migration**
  ```bash
  cd /opt/role-chat-game/backend
  npx prisma migrate diff \
    --from-migrations prisma/migrations \
    --to-schema-datamodel prisma/schema.prisma \
    --script > prisma/migrations/20260520_reconciliacao_drift/migration.sql
  ```
  (Criar o diretório antes; nome final `20260520120000_reconciliacao_drift` ou timestamp real.)

- [ ] **1.2 Editar o rename à mão** — Prisma gera o rename de tabela como `DROP TABLE "habilidades"` + `CREATE TABLE "habilidades_magias"`, **o que apaga todos os dados**. Substituir esse bloco por:
  ```sql
  ALTER TABLE "habilidades" RENAME TO "habilidades_magias";
  ```
  E renomear índices/constraints associados via `ALTER ... RENAME` em vez de drop/create:
  ```sql
  ALTER INDEX "habilidades_pkey" RENAME TO "habilidades_magias_pkey";
  ALTER INDEX "habilidades_nome_idx" RENAME TO "habilidades_magias_nome_idx";
  -- ... demais índices listados no baseline (linhas 776-794)
  ```
  Idem para FKs em `receitas`, `hm_*`.

- [ ] **1.3 Revisar todo o resto do diff** — confirmar que tabelas `hm_classe`, `hm_raca`, `hm_personagem`, `hm_slots_classe`, `magias_tresdet`, `personagem_magia_tresdet` e colunas novas (`sistema`, `pode_magia`, atributos flexíveis) entram com `CREATE TABLE`/`ADD COLUMN ... DEFAULT`, e que **nada** de DROP destrutivo sobrou.

- [ ] **1.4 Validar contra cópia de staging** — aplicar `npx prisma migrate deploy` numa cópia do banco de staging; confirmar que `prisma migrate status` fica limpo e que `prisma migrate diff --from-migrations ... --to-schema-datamodel ...` retorna vazio.

- [ ] **1.5 Tech-lead revisa o `migration.sql`** linha a linha antes de seguir.

**Critérios de aceite:**
- `npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --script` retorna vazio (sem drift).
- A migration aplicada numa cópia de staging preserva 100% das linhas de `habilidades`/`habilidades_magias`.
- Não há nenhum `DROP TABLE`/`DROP COLUMN` não intencional na migration.

---

## Fase 2 — Saneamento de testes

**Dono:** dev-lunaria. **Depende de:** Fase 1. **Pode rodar em paralelo com a Fase 3.**

**Objetivo:** suíte de testes verde e organizada.

- [ ] **2.1** Corrigir os ~120 testes de store quebrados: criar um helper `resetStore` que reinicia o estado **preservando as ações Zustand** definidas via `combine` (o reset ingênuo destrói as ações).
- [ ] **2.2** Separar `tests/scenarios/` num projeto Vitest próprio (config dedicada / `workspace`), e adicionar script `test:canonical` no `package.json` para rodar só os cenários canônicos.
- [ ] **2.3** Garantir que `npm test` (unit) e `npm run test:canonical` passam isolados e juntos.

**Critérios de aceite:**
- `npm test` verde, sem os 120 falhando.
- `npm run test:canonical` roda apenas `tests/scenarios/` e passa.
- Os dois projetos Vitest não vazam estado entre si.

---

## Fase 3 — Fechar o sistema H&M

**Dono:** dev-lunaria (designer-lunaria no 3.5, qa-lunaria valida). **Depende de:** Fase 1. **Pode rodar em paralelo com a Fase 2.**

- [ ] **3.0** Registrar a decisão do **modelo híbrido** (D1–D4) numa spec formal em `docs/superpowers/specs/2026-05-20-modelo-hibrido-hm-design.md`.
- [ ] **3.1** Migration formal H&M — se a Fase 1 não cobrir 100% das tabelas/índices H&M, escrever a migration complementar (mesmas regras: sem `db push`, rename via `ALTER`).
- [ ] **3.2** Resolver os controllers/rotas duplicados: hoje `routes/index.js` aponta `/habilidades` **e** `/habilidades-magias` para o mesmo `habilidades-magias.js`, e existe `controllers/habilidades/` + `controllers/habilidades-magias/` e o órfão `routes/habilidades.js`. Consolidar num só (canônico: `habilidades-magias`), remover o morto, manter `/habilidades` como alias deprecado se necessário.
- [ ] **3.3** Definir o contrato das engines: `getMagiasConhecidas`, `getMagiasDisponiveis`, `getSlotsInfo` implementados em cada engine (`game-systems/{lunaria,dnd5e,tresdet}/`), respeitando D2 (D&D só conhecidas) e D3 (3D&T só PM).
- [ ] **3.4** Migrar `helpers/ownedActionsHelper.js` (ou equivalente) para resolver as ações do personagem pelo vínculo real (`hm_personagem` / `personagem_magia_tresdet`), não por JSON.
- [ ] **3.5** Fechar o wizard do grimório Lunaria (designer + dev): etapa de seleção de magias/habilidades, tema "Vitral Arcano", camada View do MVVM (referência `src/Pages/Monstro/Ver/`).
- [ ] **3.6** Seeds idempotentes: `seed_hm_*` rodáveis múltiplas vezes sem duplicar; `hm_raca` como fonte de verdade das habilidades raciais (D4).
- [ ] **3.7** Diagnóstico de personagens antigos: script que classifica personagens por idade/estrutura de dados; tech-lead aprova o critério de corte; só então deletar (D5).

**Critérios de aceite:**
- Não há controller/rota duplicado para habilidades/magias.
- As 3 engines expõem o contrato; chamadas de combate/criação usam o vínculo real.
- Wizard grimório Lunaria funcional e validado pelo qa-lunaria.
- `seed_hm_*` roda 2x seguidas sem erro nem duplicata.
- Diagnóstico de personagens entregue e critério de corte aprovado antes de qualquer DELETE.

---

## Fase 4 — Deploy controlado

**Dono:** dev-lunaria (qa-lunaria valida). **Depende de:** Fases 2 e 3.

- [ ] **4.1** Publicar o monorepo `/opt/role-chat-game` e os repositórios individuais (`backend` → `mazocelo/Role-Chat-Game`, `frontend` → `mazocelo/RPG-FRONT`).
- [ ] **4.2** Aplicar a migration em produção: `npx prisma migrate deploy`.
- [ ] **4.3** Restart do PM2 (API + worker).
- [ ] **4.4** Rebuild do frontend:
  ```bash
  cd /opt/role-chat-game/frontend
  sudo rm -rf dist && NODE_OPTIONS="--max-old-space-size=4096" npx vite build && sudo cp -r dist/* /var/www/lunaria-front/
  ```
- [ ] **4.5** Smoke E2E com qa-lunaria (Playwright): login, criação de personagem (wizard grimório), sala de jogo, combate com magia/habilidade nos 3 sistemas.
- [ ] **4.6** Levantar o freeze de features.

**Critérios de aceite:**
- `prisma migrate status` limpo em produção.
- Smoke E2E do qa-lunaria passa nos 3 sistemas (Lunaria, 3D&T, D&D 5e).
- Frontend novo servido em `/var/www/lunaria-front/`.
- Monorepo e repos individuais sincronizados no mesmo commit.

---

## Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Prisma gera o rename como DROP+CREATE e apaga `habilidades` | Fase 1.2 obriga edição manual para `ALTER TABLE RENAME`; revisão tech-lead linha a linha. |
| `db push` já aplicou parte do drift no banco de staging/prod | Fase 0.5 confere o nome físico da tabela; Fase 1.4 valida contra cópia de staging antes de prod. |
| Deletar personagens antigos errado (perda de dados) | Fase 3.7 exige diagnóstico + aprovação do critério de corte antes de qualquer DELETE. |
| Frontend inteiro está praticamente uncommitted | Tratar no início da Fase 4.1 como item próprio; não é escopo da Fase 0. |
| Quebrar um dos 3 sistemas de RPG | qa-lunaria valida os 3 sistemas no smoke E2E (4.5); freeze impede features novas durante o trabalho. |
