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
| D-01 | Jobs duraveis para IA | concluido | ~98% | async-only, systemd service, CI/CD restart, stalled detection com DB update, worker health via Redis, lockDuration/stalledInterval/maxStalledCount. Restam filas IMAGE/AUDIO (v2) |
| D-02 | Deploy e banco VPS | concluido | ~95% | CI/CD com --ff-only, pg_dump backup, healthcheck robusto (DB+Redis), preflight checks, rollback automatico. Faltam lock de release, coordenacao multi-servico |
| D-03 | Observabilidade e admin do motor | concluido | ~95% | 5 endpoints /admin/motor (sessoes, jobs, retry, prompt, worker/health), persistencia de prompt/response no ai_jobs, tela AdminMotor frontend. Faltam logs estruturados (pino) |
| F-03 | Controles de produto para IA | concluido | ~95% | modos criativos (4+regenerate), historico de versoes com ativacao, endpoint detalhe de versao, fix URL mismatch, frontend service para comparacao. Faltam modal side-by-side, workflow avancado |

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

### D-01. Jobs duraveis para IA (~98%)

**Status:** v1 completa + stalled detection + worker health (Rodada 9)

**O que ja entrou (v1 + Rodada 9)**

- BullMQ v5.71.0 + Redis, worker separado (`bin/worker`) com shutdown gracioso
- Tabela `ai_jobs` com indices, POST 202, GET com status persistido
- Auto-geracao por fila, idempotencia com lock Redis, fallback se enqueue falhar
- Async-only permanente (sync path e feature flag removidos na Rodada 7)
- Redis sempre obrigatorio na startup validation
- systemd service file (`deploy/lunaria-worker.service`)
- Worker reiniciado no CI/CD (`systemctl restart lunaria-worker || true`)
- `queueNames.js` com stubs IMAGE e AUDIO
- **Stalled detection** (Rodada 9): QueueEvents listener atualiza `ai_jobs.last_error` na DB quando job fica stalled
- **Worker timeout config** (Rodada 9): lockDuration=120s, stalledInterval=30s, maxStalledCount=2
- **Worker health via Redis** (Rodada 9): heartbeat setex TTL 90s + `GET /admin/motor/worker/health` (healthy/stale/offline)

**O que ainda falta (v2)**

- Filas imagem e audio (stubs existem, processadores nao)
- Storage R2, prioridade por fila

**Leitura pratica**

v1 completa, stalled detection funcional, worker health observavel via API. Restam apenas filas de imagem/audio (v2) e storage R2.

### D-03. Observabilidade e admin do motor (~95%)

**Status:** Phase 1 + Phase 2 parcial (Rodada 10)

**O que ja existe**

- Auth JWT com roles (requireSuperAdmin, requireOwnerOrSuperAdmin)
- `GET /websocket/stats` (superadmin) — contadores basicos
- `GET /billing/global` e `GET /analytics` — custos e uso de IA
- Tabela `ai_jobs` com dados de status, erro, **prompt e response** (campos `request_prompt`, `response_text`)
- Rotas WebSocket admin para broadcast/mensagem direta
- 5 endpoints `/admin/motor` implementados (sessoes, sessao detail, jobs, retry, **jobs/:id/prompt**)
- Tela AdminMotor no frontend (MVVM pattern) protegida por SuperAdminRoute
- Expanded state sempre ativo (mana, cooldowns, concentracao, efeitos expirados)
- Blueprint V2 sempre ativo (roteiro condensado com segredos, dialogos, foreshadowing)
- Resumo estruturado sempre ativo (formato com secoes FATOS/ITENS/NPCS/COMBATE/DECISOES/PISTAS)
- **Persistencia de prompts/respostas** (Rodada 10): blueprintService retorna `{ roteiro, prompt, responseText }`, roteiroGenerationService persiste em `ai_jobs`

**O que falta construir**

- Logs estruturados (backend ainda usa `console.*` apenas, sem pino/winston)
- `socketManager.getStats()` so retorna contadores basicos — sem detalhe de sessao

**Leitura pratica**

Phase 1 completa + Phase 2 parcial. Persistencia de prompts IA funcional (prompt → DB → admin endpoint). Restam logs estruturados (pino) como unico gap significativo.

### F-03. Controles de produto para IA (~95%)

**Status:** modos criativos + historico de versoes + detalhe de versao + fix URL (Rodada 8+10)

**O que ja existe**

- Distincao `initial` vs `regenerate` (blueprintService.js:346-351)
- Temperaturas por modo via `MODE_TEMPERATURES` (initial=0.3, regenerate=0.7, criativos=0.6)
- Logica anti-repeticao sofisticada (`buildRegenerationBlock`) — tambem ativa para modos criativos
- 4 pilares sempre ativos (vantagens, desvantagens, habilidades, magias no prompt)
- Expanded state sempre ativo (mana, cooldowns, concentracao, alertas no turn state)
- Blueprint V2 sempre ativo (roteiro condensado expandido com segredos, dialogos)
- Resumo estruturado sempre ativo (formato FATOS/ITENS/NPCS/COMBATE/DECISOES/PISTAS)
- AI retry sempre ativo (1 retry em timeout)
- **4 modos criativos funcionais** (Rodada 8): darker, exploration, intrigue, political — cada um injeta diretivas especificas no prompt da IA
- **Seletor de modo no frontend** com dropdown antes do botao "Gerar"
- **Historico de versoes** com listagem e ativacao (tabela `roteiro_versoes` + endpoints + UI)
- Metadados de geracao (modo, modelo, temperatura, timestamp) persistidos em cada versao
- **Fix URL mismatch** (Rodada 10): rotas aliases `/roteiro-versoes` adicionadas (frontend chamava `/roteiro-versoes`, backend registrava `/roteiro/versoes`)
- **Endpoint detalhe de versao** (Rodada 10): `GET /:id/roteiro-versoes/:versaoId` retorna roteiro completo
- **Frontend service** (Rodada 10): `obterVersaoRoteiro()` para carregar conteudo completo de uma versao

**O que falta construir**

- Modal side-by-side com dois RoteiroViewer para comparacao visual
- Workflow avancado de aprovacao

**Leitura pratica**

Backend completo para comparacao (endpoints de listagem + detalhe + ativacao). Frontend service pronto. Faltam componentes visuais de comparacao (modal side-by-side).

### D-02. Deploy e banco VPS (~95%)

**Status:** core funcional + hardening avancado + preflight/rollback (Rodada 10)

**O que ja foi feito**

- `db push --accept-data-loss` eliminado de todo script executavel
- 3 pipelines CI/CD (Backend, Frontend, TTS) via GitHub Actions + SSH
- Migrations formais (0_baseline + ai_jobs) com baseline aplicado na VPS
- Deploy automatico no push para main com systemd restart
- `git pull --ff-only` em todos os 3 pipelines
- pg_dump backup antes de `prisma migrate deploy`
- Frontend CI/CD usa `npm ci`
- Redis sempre obrigatorio na startup validation (Rodada 7)
- Feature flags removidas — sem overhead de configuracao por ambiente
- **Healthcheck robusto** (Rodada 10): `/health` verifica DB (`SELECT 1`) e Redis (`PING`) com timeout 3s, retorna `ok`/`degraded` + checks detalhados
- **Preflight checks** (Rodada 10): `pg_isready` obrigatorio + `redis-cli ping` (warn-only) antes do deploy
- **Rollback automatico** (Rodada 10): se healthcheck falhar pos-deploy, restaura ultimo backup via pg_restore + git checkout HEAD~1 + restart

**O que falta construir**

- Lock de release (file-based ou Redis)
- Coordenacao entre deploys dos 3 servicos

**Leitura pratica**

Pipeline robusto com preflight → backup → deploy → healthcheck → rollback automatico. Restam lock de release e coordenacao multi-servico.

## Gaps residuais (todos incrementais)

| Front | Gap | Prioridade |
|-------|-----|-----------|
| D-01 | Filas IMAGE/AUDIO (stubs existem, processadores nao) | Baixa (v2) |
| D-01 | Storage R2 | Baixa (v2) |
| D-02 | Lock de release (file-based ou Redis) | Baixa |
| D-02 | Coordenacao entre deploys dos 3 servicos | Baixa |
| D-03 | Logs estruturados (pino) | Media |
| D-03 | socketManager.getStats() detalhe de sessao | Baixa |
| F-02 | Formalizar interfaces dos engines | Baixa |
| F-03 | Modal side-by-side com dois RoteiroViewer | Media |
| F-03 | Workflow avancado de aprovacao | Baixa |

## Resumo executivo (2026-03-14)

O projeto avancou significativamente desde a abertura das 6 frentes. **Rodada 10** fechou os 3 fronts restantes (D-03, D-02, F-03) em uma unica rodada:

- **F-01 (~100%)**: contrato WebSocket concluido, 65+ @event annotations, zero io.to() direto em engines/handlers/utils
- **F-02 (~100%)**: 5 engines + 5 utils extraidos, socketManager 4000+→920L (-77%), feature flags removidas
- **D-01 (~98%)**: async-only, stalled detection com DB update, worker health via Redis, lockDuration/stalledInterval/maxStalledCount. Restam filas IMAGE/AUDIO (v2)
- **D-02 (~95%)**: healthcheck robusto (DB+Redis), preflight checks, rollback automatico. Faltam lock de release, coordenacao multi-servico
- **D-03 (~95%)**: 5 endpoints admin, persistencia de prompt/response no ai_jobs, tela frontend. Faltam logs estruturados (pino)
- **F-03 (~95%)**: modos criativos, historico de versoes, fix URL mismatch, endpoint detalhe, frontend service. Faltam modal side-by-side, workflow avancado

Todas as 6 frentes estao acima de 95%. Gaps restantes sao incrementais (pino, lock, modal UI, filas v2).

## Handoff para outra instancia

1. F-01 concluido (~100%) — em manutencao, sem pendencias funcionais
2. F-02 concluido (~100%) — feature flags removidas, restam formalizacao de interfaces
3. D-01 v1 completa (~98%) — stalled detection + worker health + timeout config (Rodada 9). Restam filas IMAGE/AUDIO (v2)
4. D-02 concluido (~95%) — healthcheck robusto, preflight, rollback automatico. Faltam lock de release, coordenacao multi-servico
5. D-03 concluido (~95%) — 5 endpoints admin, persistencia prompt/response. Faltam logs estruturados (pino)
6. F-03 concluido (~95%) — modos criativos, historico versoes, fix URL, endpoint detalhe, frontend service. Faltam modal side-by-side
7. **Rodada 7 concluida**: toda infraestrutura de feature flags removida
8. **Rodada 8 concluida**: modos criativos funcionais (bug blueprintService.js:393 corrigido), diretivas por modo no prompt, MODE_TEMPERATURES, seletor frontend, painel de versoes
9. **Rodada 9 concluida**: stalled detection → DB update, worker heartbeat via Redis (setex TTL 90s), GET /admin/motor/worker/health, lockDuration/stalledInterval/maxStalledCount configurados
10. **Rodada 10 concluida**: D-03 (persistencia prompt/response + endpoint admin), D-02 (healthcheck DB/Redis + preflight + rollback), F-03 (fix URL mismatch + endpoint detalhe versao + frontend service)
11. cada documento individual tem secao "Auditoria" com detalhes completos
