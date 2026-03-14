# D-01 - Jobs duraveis para IA

## Tipo

Discussao

## Prioridade

Alta

## Status

Decisao fechada e v1 concluida

## Fechamento da v1

A primeira entrega foi implementada e validada no fluxo de `roteiro`.

Entregue:

- `BullMQ` sobre Redis para `roteiro`
- `worker` separado da API
- tabela `ai_jobs` no Postgres
- `POST /historias/:id/roteiro` respondendo `202`
- `GET /historias/:id/roteiro` com status persistido do job
- auto-geracao de roteiro ao criar historia tambem passando pela fila
- frontend tratando `queued` como estado de polling
- correcao do risco de `mestresCache` stale no `socketManager`

Validado:

- restart da API com job ainda enfileirado
- restart do worker com job ainda enfileirado
- falha forcada no provider com persistencia de `failed` em `ai_jobs`

Fora da v1 e mantido para a v2:

- observabilidade/admin de jobs
- migracao de `imagem`
- migracao de `audio`
- armazenamento de artefatos em R2

## Contexto

O projeto amadureceu, vai entrar em producao e ja roda em uma VPS robusta. Nesse cenario, jobs longos de IA nao podem mais depender do processo web continuar vivo.

Hoje ainda existem fluxos relevantes disparados em background no proprio processo da API, especialmente no controller de historia para geracao de roteiro. Isso funciona em baixo volume, mas falha no primeiro restart, deploy ou travamento do processo.

Pontos importantes do estado atual:

- o projeto ja depende de Redis em runtime para sessoes e websocket
- `roteiro` ja possui status de negocio (`generating`, `completed`, `error`)
- o fluxo ja emite eventos de socket quando termina ou falha
- `blueprintService` trabalha com timeout de 180s, entao o job ja e naturalmente longo
- `imagem` e `audio` devem seguir a mesma direcao em seguida

## Problema atual

- job em memoria morre se a API reiniciar
- deploy interrompe trabalho em andamento
- nao existe fila duravel real
- retry fica improvisado e perigoso para custo de IA
- observabilidade de job preso ou falho fica fraca

## Decisao recomendada

Adotar `BullMQ` sobre o Redis ja existente, com `worker` separado do processo web.

Desenho alvo:

- uma fila por tipo de job: `roteiro`, `imagem`, `audio`
- um servico `worker` inicialmente unico, consumindo essas filas com processors separados
- API apenas valida, persiste estado inicial e enfileira
- worker executa o processamento pesado, atualiza status e publica eventos
- Redis com persistencia habilitada e configuracao de producao
- Postgres continua como fonte de verdade do estado de negocio
- painel/admin e websocket viram apenas projecoes operacionais, nao a fonte primaria

## Por que esta e a melhor decisao agora

- Redis ja e infraestrutura critica do produto; BullMQ aproveita o que o sistema ja usa
- o custo operacional em uma VPS robusta e baixo: processo `api` + processo `worker`
- BullMQ encaixa bem em Node.js com retries, backoff, stalled jobs, prioridades e concorrencia
- separa o tempo de request do tempo de processamento sem empurrar jobs longos para dentro do banco primario
- permite endurecer deploy e restart sem reescrever o produto em torno de uma plataforma nova

## Alternativas consideradas

### `pg-boss`

Boa opcao quando o objetivo principal e concentrar tudo no Postgres.

Nao e a melhor decisao aqui porque:

- Redis ja existe no caminho critico, entao nao ha ganho real de simplificacao de stack
- queremos isolar jobs longos de IA do banco primario
- BullMQ conversa melhor com o uso atual de websocket, workers Node e fila por tipo

### `Temporal`

Ferramenta forte, mas acima da necessidade atual.

Nao e a melhor decisao agora porque:

- adiciona muito custo operacional e cognitivo
- exige maturidade maior de workflow distribuido para compensar
- o problema imediato e fila duravel com retry controlado, nao orquestracao complexa de longa duracao

## Decisoes fechadas

### Reutilizar o Redis existente?

Sim, desde que seja endurecido para producao:

- persistencia habilitada, preferencialmente `AOF`
- `maxmemory-policy noeviction` para nao descartar jobs sob pressao de memoria
- prefixo ou DB dedicado para as filas
- monitoracao basica de memoria, latencia e crescimento da fila

### Um worker unico ou separado por tipo?

Comecar com um processo `worker` unico e filas separadas por tipo.

Separar em multiplos processos apenas quando houver um destes sinais:

- `audio` passar a bloquear `roteiro`
- `imagem` consumir throughput de forma desbalanceada
- necessidade de escalar concorrencia por tipo

### Jobs devem ser idempotentes?

Sim. Esta nao e mais uma decisao aberta.

Regra base:

- um job ativo por entidade e por tipo
- exemplo: uma `historiaId` nao pode ter dois jobs ativos de `roteiro`
- reprocessamento manual deve criar nova tentativa controlada, nunca duplicacao silenciosa

### Qual retry e seguro para IA?

Retry automatico apenas para falhas transientes:

- timeout
- erro de rede
- `429`
- `5xx`

Politica inicial recomendada:

- `attempts: 3`
- backoff exponencial com jitter
- timeout do job acima do timeout interno do provider

Sem retry automatico para:

- erro de validacao
- prompt inconsistente
- dados insuficientes
- falha semantica do fluxo

## Requisitos de producao

- `api` e `worker` rodando em processos separados sob `systemd` ou `pm2`
- `worker` com shutdown gracioso para nao abandonar job no meio de deploy
- `QueueEvents` ou equivalente para logar `waiting`, `active`, `completed`, `failed`, `stalled`
- estado de negocio persistido no Postgres
- trilha operacional persistida em uma tabela de jobs ou campos equivalentes

Campos minimos recomendados para observabilidade:

- `jobId`
- `queue`
- `entityType`
- `entityId`
- `status`
- `attempts`
- `lastError`
- `queuedAt`
- `startedAt`
- `finishedAt`

## Escopo inicial recomendado

Primeira migracao: `roteiro`.

Motivos:

- ja existe status no dominio
- ja existe emissao de evento
- e o job mais claramente longo e sujeito a timeout
- remove o caso mais visivel de IIFE em memoria no controller

Fluxo alvo da primeira entrega:

1. API cria ou seleciona a historia
2. API grava status `queued` e metadados do job
3. API enfileira job `roteiro`
4. worker marca `generating`, chama `blueprintService` e persiste resultado
5. worker atualiza Redis da sessao se necessario
6. worker emite evento `roteiro_gerado` ou `roteiro_erro`

## Fase 2

Depois de `roteiro` estabilizado:

- observabilidade minima de jobs
- endpoint/admin para listar jobs, falhas e retries manuais
- mover `imagem`
- mover `audio`
- aplicar prioridade por fila
- criar fila de falha ou fluxo de reprocessamento explicito

## Criterios de aceite

- gerar roteiro nao depende mais do processo web continuar vivo
- restart da API nao perde job enfileirado
- deploy nao mata processamento sem recuperacao
- existe retry controlado apenas para falha transiente
- existe visibilidade clara de sucesso, falha, timeout e stalled job

## Handoff para outra instancia

Objetivo: usar a base duravel ja entregue em `roteiro` para expandir a plataforma de jobs.

Implementar nesta ordem:

1. observabilidade minima e admin de jobs
2. fila de `imagem`
3. fila de `audio`
4. prioridade e refinamento de retry por tipo
5. reprocessamento manual seguro

Resultado esperado:

- API mais leve
- processamento resiliente a restart
- base pronta para escalar `imagem` e `audio`

---

## Auditoria (2026-03-13)

**Completude: ~87%**

### v1 Feitos (17 itens)

- BullMQ v5.71.0 sobre Redis (`package.json`)
- Worker separado (`bin/worker`) com shutdown gracioso (SIGTERM/SIGINT)
- Tabela `ai_jobs` com indices (`[queue, status]`, `[entity_type, entity_id, created_at]`)
- POST retorna 202 com jobId (async-only, flag removida)
- GET com status persistido e serializeAiJob
- Auto-geracao por fila ao criar historia
- Idempotencia: um job ativo por entidade/tipo + lock Redis (TTL 10s)
- Retry: attempts 2, backoff fixed 30s
- Fila ROTEIRO em `queueNames.js`
- `queueNames.js` com stubs para IMAGE e AUDIO
- Persistencia de estado em Postgres (transacao atomica)
- Concorrencia configuravel via `BULLMQ_ROTEIRO_CONCURRENCY` (default 2)
- Fallback se enqueue falhar (marca failed atomicamente)
- ~~Feature flag `AI_ASYNC_ROTEIRO`~~ removida (Rodada 7) — async-only permanente
- **systemd service file** criado (`deploy/lunaria-worker.service`)
- **Worker reiniciado no CI/CD** (`systemctl restart lunaria-worker || true`)
- Admin endpoints implementados (GET jobs, POST retry) — ver D-03

### v1 Parciais

| Item | Estado atual | Recomendado |
|------|-------------|-------------|
| Flag | OFF (`false`) | Ligar quando worker estiver ativo na VPS |
| Stalled detection | Nenhum | Instanciar QueueEvents |

### v2 Nao iniciados

| Item | Status |
|------|--------|
| Fila de imagem (stub em queueNames.js) | Nao iniciado |
| Fila de audio (stub em queueNames.js) | Nao iniciado |
| Storage R2 | Nao iniciado |
| Prioridade por fila | Nao iniciado |

### Riscos

| Risco | Severidade |
|-------|-----------|
| ~~Worker sem Procfile nem systemd service~~ | ~~Critico~~ **RESOLVIDO** (`deploy/lunaria-worker.service` + CI/CD restart) |
| Flag OFF = infraestrutura bypassed, roteiro processa in-process | Alto |
| Sem deteccao de stalled jobs | Medio |
