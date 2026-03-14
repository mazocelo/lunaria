# Analise das Pendencias

Este arquivo resume o estado atual das frentes abertas do projeto, com foco em:

- o que ja foi fechado
- o que esta parcialmente resolvido
- o que ainda depende de implementacao
- qual deve ser a ordem pratica a partir do estado atual

Ele existe para servir como handoff rapido para outras instancias, sem precisar reconstruir o contexto a partir da conversa.

## Contexto

As seis frentes principais levantadas para amadurecer o projeto foram:

1. fechar o contrato publico do websocket
2. modularizar o motor do jogo
3. implementar jobs duraveis para IA
4. criar observabilidade e admin do motor
5. adicionar controles de produto para IA
6. endurecer deploy e banco para HostGator/VPS

Desde a abertura dessa lista, parte relevante do trabalho ja avancou. O objetivo deste README e registrar o ponto atual com honestidade tecnica.

## Status geral (atualizado 2026-03-14)

| Ordem | Tema | Status | % | Resumo |
| --- | --- | --- | --- | --- |
| F-01 | Contrato publico do websocket | concluido | ~100% | contrato JSON v2.1.0, 65+ @event annotations, zero io.to() direto em engines/handlers/utils |
| F-02 | Modularizacao do motor do jogo | concluido | ~100% | 5 engines + 5 utils + sessionEventBus + stateProjector, socketManager 4000+→920L (-77%), feature flags removidas |
| D-01 | Jobs duraveis para IA | concluido | ~95% | async-only (flag removida), systemd service, CI/CD restart, queueNames IMAGE/AUDIO stubs. Falta stalled detection |
| D-02 | Deploy e banco VPS | parcialmente concluido | ~88% | CI/CD com --ff-only, pg_dump backup, healthcheck pos-deploy, /health endpoint, Redis sempre obrigatorio. Faltam rollback, preflight, lock |
| D-03 | Observabilidade e admin do motor | em progresso | ~75% | 4 endpoints /admin/motor + tela AdminMotor frontend (MVVM), expanded state sempre ativo, blueprint V2, resumo estruturado. Faltam logs estruturados, persistencia prompts |
| F-03 | Controles de produto para IA | em progresso | ~45% | 4 pilares sempre ativos, mana/cooldowns/concentracao no state, resumo estruturado. Modos criativos cosmeticos (bug). Faltam modos funcionais, versionamento, comparacao |

## Analise por frente

### F-01. Contrato publico do websocket (~100%)

**Status:** concluido

**O que ja foi feito**

- contrato JSON v2.1.0 completo (1063+ linhas), canonical_gameplay_path definido
- turno_estado_atualizado marcado authoritative, mestre_solicita_dados canonical
- 20 eventos legacy catalogados, 5 aliases documentados
- server_message documentado, pong/room_users removidos do test-websocket.html
- `dice_roll` echo documentado como server_to_client com payload completo
- `rpg_action` echo documentado como server_to_client com payload completo
- `rate_limit_exceeded` reclassificado de `canonical` para `planned` (nunca emitido)
- 65+ `@event` annotations em todos engines/handlers/utils (combatEngine 15, testEngine 18, turnEngine 14, roomGateway 18, respostaDispatcher, testePipeline, acoesProcessor)
- ALL `io.to()` migradas para sendToRoom/EventBus — zero bypasses em engines/handlers/utils
- acoesProcessor.js migrado de `io` para `sm`, respostaDispatcher.js migrado de `ctx.io` para `ctx.sm`
- 3 listeners orfaos removidos do frontend (room_users, connection_error, authentication_error)

**O que ainda falta**

Nenhum pendente funcional.

**Leitura pratica**

Concluido. Unico risco operacional: divergencia JSON vs runtime sem validacao automatica em CI.

### F-02. Modularizacao do motor do jogo (~98%)

**Status:** concluido

**O que ja foi feito**

- socketManager reduzido de ~4000+ para 920 linhas (-77%), agora fachada com delegate methods
- 5 engines extraidos: combatEngine (616L), testEngine (588L), turnEngine (589L), roomGateway (779L), sessionEngine (424L)
- 5 utils: respostaDispatcher (232L), sessionMessages (370L), testePipeline (319L), turnStateMachine (102L), masterCacheManager
- sessionEventBus (55L) e stateProjector (9L) criados
- combatEngine: 15 io.to() migrados para sendToRoom/EventBus
- acoesProcessor.js migrado de `io` para `sm` parameter
- respostaDispatcher.js migrado de `ctx.io` para `ctx.sm`
- Zero io.to() direto em engines/handlers/utils

**O que ainda falta**

- Formalizar interfaces dos engines (262 refs `sm.` sem interface definida)
- masterNarrationEngine ainda grande (506L)

**Leitura pratica**

Extracao ~98%. socketManager e fachada leve (920L). Gaps restantes sao de formalizacao de interfaces, nao de extracao.

### D-01. Jobs duraveis para IA (~95%)

**Status:** v1 completa, async-only (feature flags removidas na Rodada 7)

**O que ja entrou (v1)**

- BullMQ v5.71.0 + Redis, worker separado (`bin/worker`) com shutdown gracioso
- Tabela `ai_jobs` com indices, POST 202, GET com status persistido
- Auto-geracao por fila, idempotencia com lock Redis, fallback se enqueue falhar
- Async-only permanente (sync path e feature flag removidos na Rodada 7)
- Redis sempre obrigatorio na startup validation
- systemd service file (`deploy/lunaria-worker.service`)
- Worker reiniciado no CI/CD (`systemctl restart lunaria-worker || true`)
- `queueNames.js` com stubs IMAGE e AUDIO

**O que ainda falta**

- Stalled detection (instanciar QueueEvents)
- Filas imagem e audio (stubs existem, processadores nao)
- Storage R2, prioridade por fila

**Leitura pratica**

v1 completa e async-only. Risco critico do worker sem service **resolvido**. Feature flags **removidas** — sistema opera direto sem transicao.

### D-03. Observabilidade e admin do motor (~75%)

**Status:** Phase 1 implementada + expanded state/blueprint V2/resumo estruturado sempre ativos

**O que ja existe**

- Auth JWT com roles (requireSuperAdmin, requireOwnerOrSuperAdmin)
- `GET /websocket/stats` (superadmin) — contadores basicos
- `GET /billing/global` e `GET /analytics` — custos e uso de IA
- Tabela `ai_jobs` com dados de status e erro
- Rotas WebSocket admin para broadcast/mensagem direta
- 4 endpoints `/admin/motor` implementados (sessoes, sessao detail, jobs, retry)
- Tela AdminMotor no frontend (MVVM pattern) protegida por SuperAdminRoute
- Expanded state sempre ativo (mana, cooldowns, concentracao, efeitos expirados)
- Blueprint V2 sempre ativo (roteiro condensado com segredos, dialogos, foreshadowing)
- Resumo estruturado sempre ativo (formato com secoes FATOS/ITENS/NPCS/COMBATE/DECISOES/PISTAS)
- Feature flags removidas — sem infraestrutura de flags no backend ou frontend

**O que falta construir**

- Logs estruturados (backend ainda usa `console.*` apenas, sem pino/winston)
- Persistencia de prompts/respostas do mestre (hoje so metricas, conteudo se perde)
- `socketManager.getStats()` so retorna contadores basicos — sem detalhe de sessao

**Leitura pratica**

Phase 1 completa com endpoints e tela admin. Expanded state, blueprint V2 e resumo estruturado ativos permanentemente. Phase 2 foca em logging estruturado e persistencia de AI prompt/response.

### F-03. Controles de produto para IA (~45%)

**Status:** base ativa com 4 pilares, expanded state e resumo estruturado. Modos criativos cosmeticos (bug conhecido)

**O que ja existe**

- Distincao `initial` vs `regenerate` (blueprintService.js:346-351)
- Temperaturas diferenciadas (0.3 vs 0.7)
- Logica anti-repeticao sofisticada (`buildRegenerationBlock`)
- 4 pilares sempre ativos (vantagens, desvantagens, habilidades, magias no prompt)
- Expanded state sempre ativo (mana, cooldowns, concentracao, alertas no turn state)
- Blueprint V2 sempre ativo (roteiro condensado expandido com segredos, dialogos)
- Resumo estruturado sempre ativo (formato FATOS/ITENS/NPCS/COMBATE/DECISOES/PISTAS)
- AI retry sempre ativo (1 retry em timeout)

**Bug conhecido**

- blueprintService.js:393 converte silenciosamente todos os modos criativos para 'initial' — modos sao 100% cosmeticos (so mudam UI, nao afetam prompt da IA)

**O que falta construir**

- Corrigir bug de modos cosmeticos (fazer modos afetarem o prompt da IA)
- Tabela `roteiro_versoes` (versionamento — hoje roteiro e sobrescrito)
- Metadados de geracao (modo, modelo, temperatura, timestamp)
- Comparacao side-by-side de propostas
- Workflow de aprovacao (marcar versao ativa)
- Seletor de modo no frontend (hoje so botao "Regenerar")

**Leitura pratica**

Base funcional ativa (4 pilares, expanded state, blueprint V2, resumo estruturado). Proximo passo critico: corrigir bug dos modos cosmeticos para que afetem o prompt da IA.

### D-02. Deploy e banco VPS (~88%)

**Status:** core funcional + hardening avancado

**O que ja foi feito**

- `db push --accept-data-loss` eliminado de todo script executavel
- 3 pipelines CI/CD (Backend, Frontend, TTS) via GitHub Actions + SSH
- Migrations formais (0_baseline + ai_jobs) com baseline aplicado na VPS
- Deploy automatico no push para main com systemd restart
- `git pull --ff-only` em todos os 3 pipelines
- pg_dump backup antes de `prisma migrate deploy`
- Healthcheck pos-deploy (`curl /health`)
- Endpoint `/health` criado
- Frontend CI/CD usa `npm ci`
- Redis sempre obrigatorio na startup validation (Rodada 7)
- Feature flags removidas — sem overhead de configuracao por ambiente

**O que falta construir**

- Rollback operacional
- Preflight de saude
- Lock de release
- Coordenacao entre deploys dos 3 servicos

**Leitura pratica**

Fase 1 completa + Fase 2 avancada (backup, healthcheck, --ff-only, Redis obrigatorio). Restam rollback e coordenacao de deploys.

## Ordem recomendada a partir do estado atual

1. limpar a modularizacao residual do motor do jogo
2. criar observabilidade e admin minima
3. expandir jobs duraveis para imagem
4. expandir jobs duraveis para TTS
5. adicionar controles de produto para IA
6. endurecer deploy e banco para HostGator/VPS

## Pendencias imediatas (atualizado 2026-03-13)

### ~~P-01 Tornar worker deployavel (D-01, CRITICO)~~ CONCLUIDO

- ~~criar systemd service `lunaria-worker.service` na VPS~~ feito (deploy/lunaria-worker.service)
- ~~adicionar restart do worker no pipeline CI/CD do backend~~ feito (ci-cd.yml)
- ~~retry exponencial + QueueEvents stalled detection~~ feito
- ~~ligar flag `AI_ASYNC_ROTEIRO`~~ flag removida (Rodada 7) — async-only permanente

### ~~P-02 Continuar modularizacao do motor (F-02)~~ CONCLUIDO

- ~~extrair `masterNarrationEngine` (handleMensagemParaMestre + handleMensagemRoleplay)~~ feito
- ~~extrair authHandler e chatHandler~~ feito
- ~~migrar combatEngine para usar sendToRoom ao inves de sm.io.to() direto~~ feito (15 calls migradas)
- socketManager: 4000+ → 920L (-77%)

### ~~P-03 Criar observabilidade minima (D-03)~~ CONCLUIDO

- ~~`GET /admin/motor/sessoes` — listar sessoes ativas~~ feito
- ~~`GET /admin/motor/sessoes/:roomId` — dump completo~~ feito
- ~~`GET /admin/motor/jobs` — consultar ai_jobs com filtro~~ feito
- ~~`POST /admin/motor/jobs/:id/retry` — reprocessar job falhado~~ feito

### P-04 ~~Fechar gaps do contrato WebSocket (F-01)~~ CONCLUIDO

- ~~documentar `dice_roll` echo e `rpg_action` echo como server_to_client~~ feito
- ~~decidir sobre `rate_limit_exceeded`: implementar ou reclassificar~~ reclassificado como `planned`
- ~~remover 3 listeners orfaos do frontend~~ removidos

### ~~P-05 Hardening de deploy (D-02)~~ PARCIALMENTE CONCLUIDO

- ~~adicionar `--ff-only` ao `git pull` nos 3 pipelines~~ feito
- ~~adicionar backup pre-migracao (pg_dump)~~ feito
- ~~adicionar healthcheck pos-deploy~~ feito
- rollback operacional (pendente)
- preflight de saude (pendente)
- lock de release (pendente)

## O que nao deve acontecer agora

- expandir filas de IA (imagem/audio) antes de validar v1 async em producao
- separar observabilidade em sistema externo antes de explorar Phase 2 interna

## Resumo executivo (2026-03-14)

O projeto avancou significativamente desde a abertura das 6 frentes. **Rodada 7** removeu toda a infraestrutura de feature flags (13 arquivos, 2 deletados, 11 editados):

- **F-01 (~100%)**: contrato WebSocket concluido, 65+ @event annotations, zero io.to() direto em engines/handlers/utils
- **F-02 (~100%)**: 5 engines + 5 utils extraidos, socketManager 4000+→920L (-77%), feature flags removidas
- **D-01 (~95%)**: async-only permanente (flag removida), systemd service, CI/CD restart. Falta stalled detection
- **D-02 (~88%)**: CI/CD com --ff-only, pg_dump backup, healthcheck, Redis obrigatorio. Faltam rollback, preflight, lock
- **D-03 (~75%)**: 4 endpoints admin + tela frontend, expanded state/blueprint V2/resumo estruturado ativos. Faltam logs estruturados, persistencia prompts
- **F-03 (~45%)**: 4 pilares, expanded state, blueprint V2, resumo estruturado ativos. Bug: modos criativos cosmeticos. Faltam modos funcionais, versionamento

Proximos passos: (1) Rodada 8 — corrigir modos criativos cosmeticos (F-03), (2) hardening deploy D-02, (3) Phase 2 observabilidade D-03.

## Handoff para outra instancia

1. F-01 concluido (~100%) — em manutencao, sem pendencias funcionais
2. F-02 concluido (~100%) — feature flags removidas, restam formalizacao de interfaces
3. D-01 v1 completa (~95%) — async-only permanente, feature flag removida. Falta stalled detection
4. D-02 avancado (~88%) — backup, healthcheck, --ff-only, Redis obrigatorio. Faltam rollback, preflight, lock
5. D-03 em progresso (~75%) — Phase 1 completa + expanded state/blueprint V2/resumo estruturado. Phase 2: logs estruturados
6. F-03 em progresso (~45%) — base funcional ativa, bug conhecido: modos criativos cosmeticos em blueprintService.js:393
7. **Rodada 7 concluida**: toda infraestrutura de feature flags removida (featureFlags.js deletado, FeatureFlagService.js deletado, isEnabled removido de 11 arquivos, sync path removido, 3 funcoes legado deletadas)
8. cada documento individual tem secao "Auditoria" com detalhes completos
