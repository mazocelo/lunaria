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

## Status geral (atualizado 2026-03-13)

| Ordem | Tema | Status | % | Resumo |
| --- | --- | --- | --- | --- |
| F-01 | Contrato publico do websocket | concluido | ~100% | contrato JSON v2.1.0, 65+ @event annotations, zero io.to() direto em engines/handlers/utils |
| F-02 | Modularizacao do motor do jogo | concluido | ~98% | 5 engines + 5 utils + sessionEventBus + stateProjector, socketManager 4000+→920L (-77%), zero io.to() direto |
| D-01 | Jobs duraveis para IA | em progresso | ~87% | systemd service, CI/CD restart, queueNames IMAGE/AUDIO stubs. Falta ligar flag, stalled detection |
| D-02 | Deploy e banco VPS | parcialmente concluido | ~70% | CI/CD com --ff-only, pg_dump backup, healthcheck pos-deploy, /health endpoint. Faltam rollback, preflight, lock |
| D-03 | Observabilidade e admin do motor | em progresso | ~55% | 4 endpoints /admin/motor + tela AdminMotor frontend (MVVM). Faltam logs estruturados, persistencia prompts |
| F-03 | Controles de produto para IA | pendente | ~15% | apenas initial/regenerate existe. Sem modos criativos, versionamento ou comparacao |

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

### D-01. Jobs duraveis para IA (~87%)

**Status:** v1 completa e validada, flag OFF pendente ativacao na VPS

**O que ja entrou (v1)**

- BullMQ v5.71.0 + Redis, worker separado (`bin/worker`) com shutdown gracioso
- Tabela `ai_jobs` com indices, POST 202, GET com status persistido
- Auto-geracao por fila, idempotencia com lock Redis, fallback se enqueue falhar
- Feature flag `AI_ASYNC_ROTEIRO` (default: false)
- systemd service file (`deploy/lunaria-worker.service`)
- Worker reiniciado no CI/CD (`systemctl restart lunaria-worker || true`)
- `queueNames.js` com stubs IMAGE e AUDIO

**O que ainda falta**

- Ativar flag `AI_ASYNC_ROTEIRO` na VPS
- Stalled detection (instanciar QueueEvents)
- Filas imagem e audio (stubs existem, processadores nao)
- Storage R2, prioridade por fila

**Leitura pratica**

v1 completa e deployavel. Risco critico do worker sem service **resolvido**. Proximo passo: ativar flag na VPS e validar em producao.

### D-03. Observabilidade e admin do motor (~55%)

**Status:** Phase 1 implementada (endpoints + tela admin)

**O que ja existe**

- Auth JWT com roles (requireSuperAdmin, requireOwnerOrSuperAdmin)
- `GET /websocket/stats` (superadmin) — contadores basicos
- `GET /billing/global` e `GET /analytics` — custos e uso de IA
- Tabela `ai_jobs` com dados de status e erro
- Rotas WebSocket admin para broadcast/mensagem direta
- 4 endpoints `/admin/motor` implementados (sessoes, sessao detail, jobs, retry)
- Tela AdminMotor no frontend (MVVM pattern) protegida por SuperAdminRoute

**O que falta construir**

- Logs estruturados (backend ainda usa `console.*` apenas, sem pino/winston)
- Persistencia de prompts/respostas do mestre (hoje so metricas, conteudo se perde)
- `socketManager.getStats()` so retorna contadores basicos — sem detalhe de sessao

**Leitura pratica**

Phase 1 completa com endpoints e tela admin. Phase 2 foca em logging estruturado e persistencia de AI prompt/response.

### F-03. Controles de produto para IA (~15%)

**Status:** base minima existe, feature nao iniciada

**O que ja existe**

- Distincao `initial` vs `regenerate` (blueprintService.js:346-351)
- Temperaturas diferenciadas (0.3 vs 0.7)
- Logica anti-repeticao sofisticada (`buildRegenerationBlock`)

**O que falta construir**

- Modos criativos (sombrio, exploracao, intriga, etc.)
- Tabela `roteiro_versoes` (versionamento — hoje roteiro e sobrescrito)
- Metadados de geracao (modo, modelo, temperatura, timestamp)
- Comparacao side-by-side de propostas
- Workflow de aprovacao (marcar versao ativa)
- Seletor de modo no frontend (hoje so botao "Regenerar")

**Leitura pratica**

Depende de jobs duraveis e observabilidade para render valor completo.

### D-02. Deploy e banco VPS (~70%)

**Status:** core funcional + hardening parcial

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

**O que falta construir**

- Rollback operacional
- Preflight de saude
- Lock de release
- Coordenacao entre deploys dos 3 servicos

**Leitura pratica**

Fase 1 completa + parte da Fase 2 (backup, healthcheck, --ff-only). Restam rollback e coordenacao de deploys.

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
- ligar flag `AI_ASYNC_ROTEIRO` quando worker estiver ativo na VPS (pendente deploy)

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

- expandir filas de IA (imagem/audio) antes de ativar flag e validar v1 em producao
- investir em F-03 (controles de produto IA) antes de D-01 e D-03 estarem mais maduros
- separar observabilidade em sistema externo antes de explorar Phase 2 interna

## Resumo executivo (2026-03-13)

O projeto avancou significativamente desde a abertura das 6 frentes:

- **F-01 (~100%)**: contrato WebSocket concluido, 65+ @event annotations, zero io.to() direto em engines/handlers/utils
- **F-02 (~98%)**: 5 engines + 5 utils extraidos, socketManager 4000+→920L (-77%), zero io.to() direto
- **D-01 (~87%)**: v1 completa, systemd service, CI/CD restart, queueNames IMAGE/AUDIO stubs. Falta ligar flag
- **D-02 (~70%)**: CI/CD com --ff-only, pg_dump backup, healthcheck, /health endpoint. Faltam rollback, preflight, lock
- **D-03 (~55%)**: 4 endpoints /admin/motor + tela AdminMotor frontend. Faltam logs estruturados, persistencia prompts
- **F-03 (~15%)**: apenas initial/regenerate existe, feature nao iniciada

Proximos passos: (1) hardening deploy D-02, (2) Phase 2 observabilidade D-03, (3) controles de produto F-03.

## Handoff para outra instancia

1. F-01 concluido (~100%) — em manutencao, sem pendencias funcionais
2. F-02 concluido (~98%) — restam formalizacao de interfaces e reducao do masterNarrationEngine
3. D-01 v1 completa (~87%) — worker deployavel, proximo passo: ativar flag na VPS
4. D-02 avancado (~70%) — backup, healthcheck e --ff-only feitos. Faltam rollback, preflight, lock
5. D-03 em progresso (~55%) — Phase 1 completa (endpoints + tela admin). Phase 2: logs estruturados
6. F-03 pendente (~15%) — feature nao iniciada, depende de D-01 e D-03 para render valor
7. cada documento individual tem secao "Auditoria" com detalhes completos
