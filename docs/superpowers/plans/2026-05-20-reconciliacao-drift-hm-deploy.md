# Reconciliação de Drift, Sistema H&M e Deploy Controlado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sair de um estado de repositório com drift severo (arquivos usados em runtime nunca commitados, schema Prisma divergente do histórico de migrations) para um estado consistente, com o sistema de Habilidades & Magias (H&M) fechado e um deploy controlado em produção.

**Architecture:** Cinco fases sequenciais com freeze de features. Primeiro travamos o estado real (commit do drift), depois reconciliamos o histórico de migrations via **re-baseline** (opção B): arquiva-se o histórico antigo, gera-se `0_init` a partir do `schema.prisma` atual e uma migration residual `fix_fks_indices` cobre o drift de índices/FKs já presente em produção. Em seguida saneamos os testes, fechamos o sistema H&M com o modelo híbrido decidido, e por fim publicamos e fazemos deploy controlado.

> **Nota de revisão (2026-05-21):** A Fase 1 foi re-especificada para a **opção B (re-baseline)**. O rename físico `habilidades`→`habilidades_magias` **já está aplicado em produção** (via `db push` anterior); a tabela física já se chama `habilidades_magias`. Portanto não há mais "migration de reconciliação" com `ALTER TABLE ... RENAME` — o `0_init` descreve o estado atual e a `fix_fks_indices` só ajusta 3 índices ausentes e 4 FKs com `ON DELETE` divergente. Detalhes nas seções abaixo.

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
| D6 | **Rename de tabela é `ALTER TABLE ... RENAME`, nunca DROP+CREATE.** Vale para `habilidades`→`habilidades_magias` e qualquer outro rename. **Histórico:** o rename `habilidades`→`habilidades_magias` já foi aplicado em produção por `db push` antes deste plano. A Fase 1 não precisa mais executá-lo — `0_init` já descreve a tabela com o nome final. |
| D7 | **Dev usa `prisma db push`; NUNCA `migrate reset`.** Deploy usa `prisma migrate deploy`. **A Fase 1 NÃO é mais "uma migration de reconciliação", é um re-baseline (opção B):** (1) o histórico de migrations antigo (13 diretórios) é arquivado em `prisma/migrations_archive/`; (2) `prisma migrate diff --from-empty --to-schema-datamodel` gera `0_init` (somente `CREATE`/`AddForeignKey`, zero DDL destrutivo); (3) uma migration residual `20260521120000_fix_fks_indices` cobre o drift remanescente de produção (3 índices + 4 FKs). Em produção, o re-baseline se completa com `DELETE` das linhas antigas de `_prisma_migrations`, `migrate resolve --applied 0_init` e `migrate deploy` da `fix_fks_indices` — feito numa janela de manutenção com PM2 parado. Nenhum `migrate reset` em momento algum. |

---

## Visão geral das fases

| Fase | Título | Dono | Depende de | Bloqueia |
|------|--------|------|------------|----------|
| 0 | Travar o estado | dev-lunaria | — | Fase 1 |
| 1 | Re-baseline do histórico de migrations (opção B) | dev-lunaria (revisão tech-lead) | Fase 0 | Fases 2, 3 |
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

## Fase 1 — Re-baseline do histórico de migrations (opção B)

**Dono:** dev-lunaria. **Revisão obrigatória:** tech-lead-lunaria. **Depende de:** Fase 0.

**Objetivo:** reconciliar o histórico de migrations com o `schema.prisma` atual via re-baseline, sem perder dados e sem `migrate reset`. A Fase 1 é dividida em **Round 1 (sem escrita em produção)** e **Round 2 (escrita em produção, janela de manutenção)**.

### Round 1 — Preparação e validação fora de produção (CONCLUÍDO em 2026-05-21, commit `7207b1c`)

- [x] **1.1 Backup** — `pg_dump -Fc` da produção em `.backups/role_chat_game_20260521_002725.dump` (2.471.582 bytes); `pg_restore --list` legível (520 entradas).
- [x] **1.2 Bookkeeping** — `migrate status` registrado em `.qa/migrate-status-pre.txt` (13 migrations, 12 aplicadas, `20260320120000_add_mult_raca` pendente). Contagens-base em `.qa/row-counts-pre.txt`.
- [x] **1.3 Arquivamento** — 13 diretórios de migration movidos via `git mv` para `prisma/migrations_archive/`; `prisma/migrations/` fica só com `migration_lock.toml`.
- [x] **1.4 Gerar `0_init`** — `prisma migrate diff --from-empty --to-schema-datamodel --script` → `prisma/migrations/0_init/migration.sql` (1353 linhas, 0 DDL destrutivo: `grep -iE 'DROP |ALTER COLUMN .* DROP'` vazio).
- [x] **1.5 Validar `0_init`** — aplicado num cluster PG14 efêmero limpo; `migrate diff` final vazio (`0_init ≡ schema.prisma`).
- [x] **1.6 Revisão tech-lead do `0_init`** — concluída neste checkpoint (ver abaixo).
- [x] **1.8 Migration residual `fix_fks_indices`** — `prisma/migrations/20260521120000_fix_fks_indices/migration.sql`: 3 `CREATE INDEX IF NOT EXISTS` + 4 FKs recriadas (`DROP CONSTRAINT IF EXISTS` + `ADD CONSTRAINT ... ON DELETE CASCADE`). Sem operação destrutiva de dados.
- [x] **1.9 Validar a cadeia completa** — `0_init` + `fix_fks_indices` aplicados no efêmero → `migrate diff` vazio, `migrate status` limpo. Cadeia testada também em DB fresca.
- [x] **1.10 Revisão tech-lead do `fix_fks_indices` + veredito** — concluída neste checkpoint (ver abaixo).

### Round 2 — Aplicação em produção (janela de manutenção, PM2 parado)

- [ ] **1.11** Parar PM2 (API + worker).
- [ ] **1.12** `DELETE` das 13 linhas antigas de `_prisma_migrations` em produção.
- [ ] **1.13** `prisma migrate resolve --applied 0_init` (marca o baseline como já aplicado, sem rodar o SQL).
- [ ] **1.14** `prisma migrate deploy` — aplica somente `20260521120000_fix_fks_indices`.
- [ ] **1.15** Verificar `prisma migrate status` limpo e `prisma migrate diff` vazio em produção.
- [ ] **1.16** Religar PM2 e smoke rápido.

> O passo-a-passo EXATO do Round 2 está detalhado no checkpoint de revisão (entrega ao dev-lunaria de 2026-05-21).

**Critérios de aceite:**
- `0_init` é 100% `CREATE`/`AddForeignKey`/`CreateIndex`/`CreateEnum`; zero `DROP`/`ALTER COLUMN` destrutivo.
- `0_init` cobre as 55 tabelas e 7 enums do `schema.prisma`, incluindo H&M (`hm_classe`, `hm_raca`, `hm_personagem`, `hm_slots_classe`) e 3D&T (`magias_tresdet`, `itens_tresdet`, `personagem_item_tresdet`, `personagem_magia_tresdet`).
- `fix_fks_indices` é idempotente (`IF EXISTS`/`IF NOT EXISTS`) e não toca dados.
- Após o Round 2: `prisma migrate status` limpo e `prisma migrate diff --from-migrations ... --to-schema-datamodel ...` vazio em produção; contagens de linhas idênticas às de `.qa/row-counts-pre.txt`.

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
- [x] **3.1** ~~Migration formal H&M~~ — **NÃO APLICÁVEL.** Com o re-baseline da Fase 1 (opção B), o `0_init` já descreve 100% das tabelas e índices H&M (`hm_classe`, `hm_raca`, `hm_personagem`, `hm_slots_classe` + suas FKs e índices únicos), confirmado na revisão tech-lead de 2026-05-21. Não há migration complementar a escrever; este passo está vazio por construção.
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
- [ ] **4.2** Aplicar migrations pendentes em produção: `npx prisma migrate deploy`. **Observação:** o re-baseline (`0_init` + `fix_fks_indices`) já foi aplicado em produção no Round 2 da Fase 1. Aqui o `migrate deploy` só aplica migrations **novas** criadas durante as Fases 2/3 (se houver). Se nenhuma migration nova foi criada nessas fases, este passo é um no-op e basta confirmar `prisma migrate status` limpo. Não usar `db push` em produção.
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
| `migrate resolve --applied 0_init` rodaria o SQL do `0_init` sobre uma base populada e falharia / corromperia | `migrate resolve --applied` **não executa** o SQL — apenas insere a linha em `_prisma_migrations`. O `0_init` nunca chega a rodar contra produção. Validado no Round 1 em cluster efêmero. |
| `_prisma_migrations` ficar inconsistente após o `DELETE` das 13 linhas antigas | Round 2 roda em janela de manutenção com PM2 parado; backup `pg_dump -Fc` feito na 1.1 permite restore; `migrate status` é verificado logo após (1.15). |
| `fix_fks_indices` recria FK enquanto o app escreve nas tabelas-alvo | Round 2 com PM2 parado: sem conexões da aplicação durante o `DROP/ADD CONSTRAINT`. O `ADD CONSTRAINT` valida as linhas existentes — se houver órfão, falha alto antes de qualquer dano. |
| Drift de produção difere do previsto (índices/FKs já existem ou faltam outros) | `fix_fks_indices` é idempotente (`IF EXISTS`/`IF NOT EXISTS`); Round 1 validou a cadeia completa em cluster efêmero; 1.15 confere `migrate diff` vazio em produção pós-aplicação. |
| Deletar personagens antigos errado (perda de dados) | Fase 3.7 exige diagnóstico + aprovação do critério de corte antes de qualquer DELETE. |
| Frontend inteiro está praticamente uncommitted | Tratar no início da Fase 4.1 como item próprio; não é escopo da Fase 0. |
| Quebrar um dos 3 sistemas de RPG | qa-lunaria valida os 3 sistemas no smoke E2E (4.5); freeze impede features novas durante o trabalho. |
