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
| F-01 | Contrato publico do websocket | praticamente concluido | ~89% | contrato JSON v2.1.0, canonical path, legacy catalogado. Faltam dice_roll echo e rate_limit_exceeded |
| F-02 | Modularizacao do motor do jogo | parcialmente concluido | ~48% | 4 engines extraidos, mas 5+ handlers grandes permanecem no socketManager (2067L). Acoplamento pesado (262 refs sm.) |
| D-01 | Jobs duraveis para IA | parcialmente concluido | ~55% | v1 roteiro com BullMQ pronta mas dormant (flag OFF). Worker nao deployavel. Filas imagem/audio pendentes |
| D-02 | Deploy e banco VPS | parcialmente concluido | ~50% | CI/CD funcional nos 3 repos, db push eliminado. Faltam backup, rollback, healthcheck |
| D-03 | Observabilidade e admin do motor | pendente | ~18% | infra auth/roles pronta, tracking de uso existe. Zero rotas /admin/motor |
| F-03 | Controles de produto para IA | pendente | ~15% | apenas initial/regenerate existe. Sem modos criativos, versionamento ou comparacao |

## Analise por frente

### F-01. Contrato publico do websocket (~89%)

**Status:** praticamente concluido

**O que ja foi feito**

- contrato JSON v2.1.0 completo (1063 linhas), canonical_gameplay_path definido
- turno_estado_atualizado marcado authoritative, mestre_solicita_dados canonical
- 20 eventos legacy catalogados, 5 aliases documentados
- server_message documentado, pong/room_users removidos do test-websocket.html

**O que ainda falta**

- documentar `dice_roll` echo como server_to_client (testEngine.js:99 emite, frontend depende)
- documentar `rpg_action` echo como server_to_client (socketManager.js:811 emite)
- decidir sobre `rate_limit_exceeded` (documentado mas nunca emitido): implementar ou marcar como planned
- remover 3 listeners orfaos do frontend (room_users, connection_error, authentication_error)

**Leitura pratica**

Em modo de manutencao com 4 gaps pontuais.

### F-02. Modularizacao do motor do jogo (~48%)

**Status:** parcialmente concluido

**O que ja foi feito**

- 4 modulos extraidos: combatEngine (616L), testEngine (588L), turnEngine (589L), roomGateway (779L)
- SessionEventBus (55L) e stateProjector (9L) criados
- 4 utils compartilhados (respostaDispatcher, sessionMessages, testePipeline, turnStateMachine)
- 7 duplicados e 13 imports removidos. socketManager: 4000+ -> 2067L

**O que ainda falta**

- extrair `masterNarrationEngine` (handleMensagemParaMestre, 325L — maior bloco monolitico)
- extrair handleAuthentication (133L), handleMensagemRoleplay (127L), handleChatMessage (111L)
- extrair camada de sessao: obterSessaoHistoria (133L), executarCompactacao (108L), obterMestre (98L)
- combatEngine: 15 `sm.io.to()` diretos (bypassa EventBus)
- SessionEventBus subutilizado (5 usos no socketManager vs 10 emits diretos)
- acoplamento pesado: 262 refs `sm.` nos engines sem interface definida

**Leitura pratica**

Extracao fisica em ~64%, mas qualidade da modularizacao (contratos, desacoplamento) ainda precisa consolidacao. Engines sao "pedacos do monolito em outros arquivos".

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

### P-01 Tornar worker deployavel (D-01, CRITICO)

- criar systemd service `lunaria-worker.service` na VPS
- adicionar restart do worker no pipeline CI/CD do backend
- ligar flag `AI_ASYNC_ROTEIRO` quando worker estiver ativo

### P-02 Continuar modularizacao do motor (F-02)

- extrair `masterNarrationEngine` (handleMensagemParaMestre, 325L)
- migrar combatEngine para usar sendToRoom ao inves de sm.io.to() direto
- centralizar emissoes no SessionEventBus

### P-03 Criar observabilidade minima (D-03)

- `GET /admin/motor/sessoes` — listar sessoes ativas
- `GET /admin/motor/sessoes/:roomId` — dump completo
- `GET /admin/motor/jobs` — consultar ai_jobs com filtro

### P-04 Fechar gaps do contrato WebSocket (F-01)

- documentar `dice_roll` echo e `rpg_action` echo como server_to_client
- decidir sobre `rate_limit_exceeded`: implementar ou reclassificar
- remover 3 listeners orfaos do frontend

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

- **F-01 (~89%)**: contrato WebSocket praticamente fechado, em manutencao
- **D-02 (~50%)**: CI/CD funcional, db push eliminado, baseline aplicado
- **D-01 (~55%)**: v1 roteiro pronta no codigo mas dormant — worker nao deployavel
- **F-02 (~48%)**: 4 engines extraidos, socketManager -48%, mas acoplamento pesado permanece
- **D-03 (~18%)**: infraestrutura auth pronta, zero endpoints admin
- **F-03 (~15%)**: apenas initial/regenerate existe, feature nao iniciada

Prioridades imediatas: (1) tornar worker deployavel, (2) continuar modularizacao, (3) observabilidade minima.

## Handoff para outra instancia

1. F-01 esta em manutencao — so fechar os 4 gaps pontuais
2. F-02 precisa de mais uma rodada de extracao (masterNarrationEngine) e desacoplamento
3. D-01 precisa tornar o worker deployavel ANTES de qualquer expansao
4. D-02 Fase 1 esta feita, Fase 2 (hardening) e proxima
5. D-03 e F-03 sao as frentes mais verdes — comecar por quick wins de D-03
6. cada documento individual agora tem secao "Auditoria" com detalhes completos
