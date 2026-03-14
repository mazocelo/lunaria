# Backlog Estruturado

Este backlog foi organizado para ser reutilizado por outras instancias de trabalho.
Cada item tem contexto suficiente para uma outra instancia abrir o arquivo e continuar a execucao sem depender desta conversa.

## Status (2026-03-14, pos-R13)

Todas as 6 frentes originais estao acima de 95%. Gaps restantes sao incrementais.

| Ordem | Tema | % | Doc |
|-------|------|---|-----|
| F-01 | Contrato publico do websocket | ~100% | [features/01](./features/01-contrato-publico-websocket.md) |
| F-02 | Modularizacao do motor do jogo | ~100% | [features/02](./features/02-modularizacao-motor-do-jogo.md) |
| D-01 | Jobs duraveis para IA | ~98% | [discussoes/01](./discussoes/01-jobs-duraveis-ia.md) |
| D-02 | Deploy e banco VPS | ~95% | [discussoes/02](./discussoes/02-deploy-banco-hostgator.md) |
| D-03 | Observabilidade e admin do motor | ~97% | [discussoes/03](./discussoes/03-observabilidade-admin-motor.md) |
| F-03 | Controles de produto para IA | ~98% | [features/03](./features/03-controles-de-produto-para-ia.md) |

Para analise detalhada e handoff: [README-analise-pendencias.md](./README-analise-pendencias.md)

## Como usar

Cada arquivo foi separado por tipo:

- `features/`: backlog de implementacao direta
- `discussoes/`: backlog de decisao, arquitetura ou maturacao de ideia

Todos os arquivos seguem a mesma ideia:

- contexto atual do projeto
- problema observado
- estado desejado
- arquivos mais impactados
- plano de execucao
- criterios de aceite
- handoff pronto para outra instancia
- **auditoria** com % de completude e itens feitos/pendentes

## Historico de rodadas

| Rodada | Escopo | Fronts |
|--------|--------|--------|
| R1-R6 | Implementacao inicial das 6 frentes | F-01, F-02, D-01, D-02, D-03, F-03 |
| R7 | Remocao de feature flags (13 arquivos) | F-02, D-01 |
| R8 | Modos criativos + historico de versoes | F-03 |
| R9 | Stalled detection + worker health + timeout config | D-01 |
| R10 | Persistencia prompts + healthcheck robusto + preflight/rollback + fix URL + endpoint versao | D-03, D-02, F-03 |
| R11 | Pino logging (5 arquivos criticos) + unhandledRejection + N+1 fix personagemController | D-03, Perf |
| R12 | Indexes compostos DB (3 tabelas) + modal side-by-side comparacao roteiro + pino masterCacheManager | D-02, F-03, D-03 |
| R13 | Refactor EtapaJogoRPG.jsx monolito (1510L) → MVVM com 5 sub-hooks, elimina socketState anti-pattern | Tech Debt |
