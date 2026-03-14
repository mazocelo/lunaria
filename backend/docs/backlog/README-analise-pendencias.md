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
| F-01 | Contrato publico do websocket | concluido | ~99% | contrato JSON v2.1.0 completo, P5 annotations inline nos 3 handlers. Resta apenas respostaDispatcher (cosmético) |
| F-02 | Modularizacao do motor do jogo | concluido | ~92% | 7 engines/handlers extraidos, masterCacheManager extraido, socketManager 2067→1305L (-36.9%), zero io.to() direto no socketManager/engines/handlers |
| D-01 | Jobs duraveis para IA | em progresso | ~85% | systemd service, CI/CD restart, retry exponencial, stalled detection, worker heartbeat. Falta ligar flag e filas imagem/audio |
| D-02 | Deploy e banco VPS | parcialmente concluido | ~50% | CI/CD funcional nos 3 repos, db push eliminado. Faltam backup, rollback, healthcheck |
| D-03 | Observabilidade e admin do motor | em progresso | ~40% | Phase 1: 4 endpoints /admin/motor (sessoes, sessao detail, jobs, retry) |
| F-03 | Controles de produto para IA | pendente | ~15% | apenas initial/regenerate existe. Sem modos criativos, versionamento ou comparacao |

## Analise por frente

### F-01. Contrato publico do websocket (~99%)

**Status:** concluido

**O que ja foi feito**

- contrato JSON v2.1.0 completo (1063+ linhas), canonical_gameplay_path definido
- turno_estado_atualizado marcado authoritative, mestre_solicita_dados canonical
- 20 eventos legacy catalogados, 5 aliases documentados
- server_message documentado, pong/room_users removidos do test-websocket.html
- `dice_roll` echo documentado como server_to_client com payload completo
- `rpg_action` echo documentado como server_to_client com payload completo
- `rate_limit_exceeded` reclassificado de `canonical` para `planned` (nunca emitido)
- P5: annotations inline `// @event` em authHandler, chatHandler, masterNarrationEngine
- 3 listeners orfaos removidos do frontend (room_users, connection_error, authentication_error)

**O que ainda falta**

- P5: annotations inline nos handlers do backend (cosmético, baixa prioridade)

**Leitura pratica**

Concluido. Unico gap remanescente e cosmético (annotations inline).

### F-02. Modularizacao do motor do jogo (~92%)

**Status:** concluido

**O que ja foi feito**

- 7 modulos extraidos: combatEngine, testEngine, turnEngine, roomGateway, masterNarrationEngine, authHandler, chatHandler
- masterCacheManager extraido (85L) — cache LRU do Mestre IA
- SessionEventBus (55L) e stateProjector (9L) criados
- 4 utils compartilhados (respostaDispatcher, sessionMessages, testePipeline, turnStateMachine)
- combatEngine: 15 io.to() migrados para sendToRoom (EventBus)
- socketManager: 6 io.to() migrados para sendToRoom — zero io.to() direto restante
- chatHandler e masterNarrationEngine: 4 io.to() migrados para sendToRoom
- socketManager: 4000+ → 1305L (-67.4%)

**O que ainda falta**

- extrair camada de sessao: obterSessaoHistoria (133L), executarCompactacao (108L), obterMestre (98L)
- respostaDispatcher: 3 `ctx.io.to()` diretos (recebe io via contexto, nao usa EventBus)
- acoplamento residual: refs `sm.` nos engines sem interface definida

**Leitura pratica**

Extracao fisica ~92%. Engines usam sendToRoom via EventBus. Maior gap restante e a camada de sessao (obterSessaoHistoria, obterMestre) que ainda vive no socketManager.

### D-01. Jobs duraveis para IA (~55%)

**Status:** parcialmente concluido (v1 pronta, dormant)

**O que ja entrou (v1)**

- BullMQ v5.71.0 + Redis, worker separado (`bin/worker`) com shutdown gracioso
- Tabela `ai_jobs` com indices, POST 202, GET com status persistido
- Auto-geracao por fila, idempotencia com lock Redis, fallback se enqueue falhar
- Feature flag `AI_ASYNC_ROTEIRO` (default: false — dormant)

**O que ainda falta**

- **CRITICO**: Worker sem Procfile nem systemd service — nao e deployavel em producao
- Flag OFF = infraestrutura bypassed, roteiro processa in-process
- Backoff fixo 30s (deveria ser exponencial com jitter)
- Sem deteccao de stalled jobs (QueueEvents)
- Filas imagem e audio nao existem
- Storage R2, admin de jobs, reprocessamento manual — nao iniciados

**Leitura pratica**

v1 de roteiro existe no codigo mas **nao esta ativa em producao**. Antes de expandir, precisa: (1) criar service de deploy do worker, (2) ligar o flag, (3) ajustar retry policy.

### D-03. Observabilidade e admin do motor (~18%)

**Status:** infraestrutura base pronta, modulo admin nao existe

**O que ja existe**

- Auth JWT com roles (requireSuperAdmin, requireOwnerOrSuperAdmin)
- `GET /websocket/stats` (superadmin) — contadores basicos
- `GET /billing/global` e `GET /analytics` — custos e uso de IA
- Tabela `ai_jobs` com dados de status e erro (mas sem endpoint para consulta)
- Rotas WebSocket admin para broadcast/mensagem direta

**O que falta construir**

- Modulo `/admin/motor` completo (zero rotas existem)
- Listagem de sessoes ativas com estado de turno
- Inspecao de testesPendentes e mestreContexto por sessao
- Endpoint para listar/filtrar ai_jobs
- Persistencia de prompts/respostas do mestre (hoje so metricas)
- Logs estruturados (51+ console.log so no socketManager, sem winston/pino)
- Tela admin no frontend (SuperAdminRoute ja pronta)
- Reprocessamento manual de jobs

**Leitura pratica**

Quick wins: 3 endpoints (`GET /admin/motor/sessoes`, `GET /admin/motor/sessoes/:roomId`, `GET /admin/motor/jobs`) dariam visibilidade operacional imediata.

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

### D-02. Deploy e banco VPS (~50%)

**Status:** core funcional, hardening pendente

**O que ja foi feito**

- `db push --accept-data-loss` eliminado de todo script executavel
- 3 pipelines CI/CD (Backend, Frontend, TTS) via GitHub Actions + SSH
- Migrations formais (0_baseline + ai_jobs) com baseline aplicado na VPS
- Deploy automatico no push para main com systemd restart

**O que falta construir**

- Backup automatico antes de migracao
- Rollback operacional
- Healthcheck pos-deploy
- Preflight de saude
- Lock de release e coordenacao entre deploys
- `git pull --ff-only` nos pipelines (hoje sem --ff-only)
- Restart do worker no pipeline de deploy

**Leitura pratica**

Fase 1 resolvida. Fase 2 (hardening operacional) ainda nao iniciada.

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
- socketManager: 2067L → 1370L (-33.7%)

### ~~P-03 Criar observabilidade minima (D-03)~~ CONCLUIDO

- ~~`GET /admin/motor/sessoes` — listar sessoes ativas~~ feito
- ~~`GET /admin/motor/sessoes/:roomId` — dump completo~~ feito
- ~~`GET /admin/motor/jobs` — consultar ai_jobs com filtro~~ feito
- ~~`POST /admin/motor/jobs/:id/retry` — reprocessar job falhado~~ feito

### P-04 ~~Fechar gaps do contrato WebSocket (F-01)~~ CONCLUIDO

- ~~documentar `dice_roll` echo e `rpg_action` echo como server_to_client~~ feito
- ~~decidir sobre `rate_limit_exceeded`: implementar ou reclassificar~~ reclassificado como `planned`
- ~~remover 3 listeners orfaos do frontend~~ removidos

### P-05 Hardening de deploy (D-02)

- adicionar `--ff-only` ao `git pull` nos 3 pipelines
- adicionar backup pre-migracao (pg_dump)
- adicionar healthcheck pos-deploy

## O que nao deve acontecer agora

- construir UI admin completa antes dos endpoints operacionais
- refatorar o motor inteiro antes de resolver o acoplamento sm. nos engines
- expandir filas de IA (imagem/audio) antes de tornar o worker deployavel
- endurecer deploy antes de ter observabilidade minima

## Resumo executivo (2026-03-13)

O projeto avancou significativamente desde a abertura das 6 frentes:

- **F-01 (~99%)**: contrato WebSocket concluido, P5 annotations inline feitas nos 3 handlers
- **F-02 (~92%)**: 7 engines/handlers + masterCacheManager extraidos, socketManager 4000+→1305L (-67.4%), zero io.to() direto
- **D-01 (~85%)**: systemd service, CI/CD restart, retry exponencial, stalled detection, worker heartbeat. Falta ligar flag
- **D-02 (~50%)**: CI/CD funcional, db push eliminado, baseline aplicado
- **D-03 (~40%)**: Phase 1 quick wins: 4 endpoints /admin/motor implementados
- **F-03 (~15%)**: apenas initial/regenerate existe, feature nao iniciada

Proximos passos: (1) hardening deploy D-02, (2) Phase 2 observabilidade D-03, (3) controles de produto F-03.

## Handoff para outra instancia

1. F-01 esta em manutencao — so fechar os 4 gaps pontuais
2. F-02 precisa de mais uma rodada de extracao (masterNarrationEngine) e desacoplamento
3. D-01 precisa tornar o worker deployavel ANTES de qualquer expansao
4. D-02 Fase 1 esta feita, Fase 2 (hardening) e proxima
5. D-03 e F-03 sao as frentes mais verdes — comecar por quick wins de D-03
6. cada documento individual agora tem secao "Auditoria" com detalhes completos
