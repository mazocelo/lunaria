# D-03 - Observabilidade e admin do motor

## Tipo

Discussao

## Prioridade

Maturar ideia

## Contexto

O motor do jogo ficou sofisticado. Hoje ele envolve:

- turno
- testes pendentes
- resumo consolidado
- contexto do mestre
- combate
- geracoes de IA
- audio
- imagens

O problema deixa de ser apenas "fazer funcionar" e passa a ser "entender rapido o que aconteceu quando algo sai do esperado".

## Pergunta central

Isso deve ser um sistema separado para admin?

## Recomendacao

Nao no primeiro momento.

Eu imagino duas fases:

### Fase 1 - Admin interno ao proprio produto

Criar uma area restrita para `admin/superadmin`, dentro do mesmo backend e frontend, reaproveitando:

- auth atual
- roles atuais
- websocket e APIs ja existentes

Telas sugeridas:

- sessoes ativas
- detalhe de sessao
- turno atual
- testes pendentes
- ultimo prompt do mestre
- ultimo output do mestre
- resumo consolidado
- jobs de IA recentes
- uso de tokens
- erros recentes

### Fase 2 - Observabilidade separada

Quando o volume crescer, ai sim vale considerar um sistema separado, mais tecnico, para:

- logs estruturados
- tracing
- dashboards
- alertas

## Porque nao separar logo de inicio

- maior custo de manutencao
- mais auth e permissao para resolver
- mais deploy para coordenar
- ainda nao ha volume suficiente para justificar outro sistema inteiro

## Como eu imagino a area admin interna

Modulo novo do produto, algo como:

- `/admin/motor`
- `/admin/motor/sessoes`
- `/admin/motor/sessoes/:roomId`
- `/admin/motor/jobs`
- `/admin/motor/uso-ia`

Capacidades da primeira versao:

- ver sessao ativa e estado do turno
- ver jogadores conectados
- ver `testesPendentes`
- ver `mestreContexto`
- ver resumo consolidado
- ver ultimo prompt e resposta do mestre
- ver falhas de geracao
- reprocessar job preso

## Dependencias tecnicas

- logs estruturados por evento
- persistencia minima de prompts/resultados
- endpoints admin dedicados
- guardas por role

## Criterios de aceite da fase 1

- um admin consegue entender o estado atual de uma sessao sem entrar no codigo
- um admin consegue diagnosticar porque um turno travou
- um admin consegue ver se um job de IA falhou e onde falhou
- um admin consegue ver consumo basico de tokens e tempo de resposta

## Handoff para outra instancia

Objetivo: desenhar a primeira versao de observabilidade/admin do motor do jogo.

Contexto atual:

- o sistema ja tem estado rico e logs espalhados
- falta uma superficie unica para inspecao operacional
- a recomendacao atual e nao separar em outro sistema ainda

O que fazer:

- projetar um modulo admin interno
- definir quais dados precisam ficar visiveis
- decidir que nivel de persistencia de prompt e output e aceitavel

Entregaveis:

- desenho da area admin
- endpoints e payloads
- backlog da fase 1

## Observacao de produto

Esse item nao e so tecnico. Ele reduz tempo de suporte, acelera debug e melhora a confianca para evoluir o motor.

---

## Auditoria (2026-03-14, atualizado pos-R13)

**Completude: ~97%**

### Feitos (infraestrutura base)

| Item | Evidencia |
|------|-----------|
| Auth JWT com roles | `authMiddleware.js`: requireSuperAdmin, requireOwnerOrSuperAdmin, requireResourceOwnerOrSuperAdmin |
| SuperAdminRoute no frontend | `Frontend/src/components/SuperAdminRoute.jsx` |
| `GET /websocket/stats` (superadmin) | `routes/websocket.js` — connectedUsers, activeRooms, totalRooms |
| `GET /billing/global` (admin/superadmin) | `routes/billing.js` — custos agregados |
| `GET /analytics` (superadmin) | `routes/analytics.js` — aggregations via analyticsService |
| Tracking de uso IA | `usageService.js` + tabela `api_usage` (tokens, custo, provider) |
| `ai_jobs` table com rastreamento | Status, last_error, attempts_made, timestamps, **request_prompt, response_text** |
| Rotas WebSocket admin | `/broadcast`, `/room/:roomId/message`, `/user/:userId/message` (superadmin) |

### Implementados (Phase 1 — 2026-03-13)

| # | Item | Evidencia |
|---|------|-----------|
| 1 | `GET /admin/motor/sessoes` — lista sessoes ativas com estado de turno | `routes/adminMotor.js` |
| 2 | `GET /admin/motor/sessoes/:roomId` — dump completo (estadoJogo, mestreContexto, testesPendentes, resumos, ultimas 20 msgs) | `routes/adminMotor.js` |
| 3 | `GET /admin/motor/jobs` — consulta ai_jobs com filtro (status, queue, entity_type) e paginacao | `routes/adminMotor.js` |
| 4 | `POST /admin/motor/jobs/:id/retry` — reprocessa job falhado via BullMQ | `routes/adminMotor.js` |
| 5 | **Tela AdminMotor no frontend** (MVVM pattern) | Pagina admin criada |
| 6 | **SuperAdminRoute** protegendo a pagina admin | Guard implementado |

### Implementados (Phase 2 parcial — Rodada 9+10+11+12)

| # | Item | Evidencia |
|---|------|-----------|
| 7 | `GET /admin/motor/worker/health` — status do worker via Redis heartbeat | `routes/adminMotor.js` (Rodada 9) |
| 8 | **Persistencia de prompts/respostas** — campos `request_prompt` e `response_text` em `ai_jobs` | Migration `add_ai_jobs_prompt_fields`, `roteiroGenerationService.js` (Rodada 10) |
| 9 | `GET /admin/motor/jobs/:id/prompt` — consultar prompt e response de um job | `routes/adminMotor.js` (Rodada 10) |
| 10 | **Pino structured logging** — facade `helpers/logger.js`, 6 arquivos criticos migrados | bin/www, socketManager, roteiroGenerationService, MestreAgent, processRoteiroJob, masterCacheManager (Rodada 11+12) |
| 11 | **Global error handlers** — `unhandledRejection` e `uncaughtException` com logger.fatal | bin/www (Rodada 11) |

### Pendentes (Phase 2 restante)

| # | Item | Prioridade |
|---|------|-----------|
| 1 | Migrar pino para ~83 arquivos restantes com `console.*` (incremental) | Baixa |
| 2 | `socketManager.getStats()` so retorna contadores basicos — sem detalhe de sessao | Baixa |

### Criterios de aceite vs estado atual

| Criterio | Status |
|----------|--------|
| Admin entende estado da sessao sem abrir codigo | **Atendido** (GET /admin/motor/sessoes/:roomId) |
| Admin diagnostica turno travado | **Atendido** (estadoJogo.fase, turnoAtual, testesPendentes visiveis) |
| Admin ve job de IA falho e onde falhou | **Atendido** (GET /admin/motor/jobs?status=failed + last_error) |
| Admin ve consumo de tokens e tempo de resposta | **Atendido** (GET /billing/global, GET /analytics, GET /admin/motor/jobs/:id/prompt) |
| Admin ve prompt e resposta da IA | **Atendido** (GET /admin/motor/jobs/:id/prompt) |
