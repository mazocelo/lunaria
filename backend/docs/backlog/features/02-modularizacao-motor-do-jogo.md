# F-02 - Modularizacao do motor do jogo

## Tipo

Feature

## Prioridade

Alta

## Contexto

O arquivo `Backend/websocket/socketManager.js` ja passou de 4 mil linhas e concentra:

- autenticacao websocket
- sala
- turno
- testes
- roleplay
- combate
- narrativa do mestre
- transicoes de rodada
- emissao de eventos

Isso e um gargalo tecnico. Toda alteracao importante do jogo passa por um unico arquivo com risco alto de regressao.

## Problema atual

- muito acoplamento entre fluxo de jogo, transporte e persistencia
- custo alto para revisar mudancas
- dificuldade para testar partes isoladas
- maior chance de drift entre contrato, runtime e UI

## Como deve ser

O motor do jogo deve ser dividido por dominio, mantendo `socketManager` como fachada leve de eventos, nao como motor inteiro.

Divisao sugerida:

- `roomGateway`
- `turnEngine`
- `testEngine`
- `masterNarrationEngine`
- `combatEngine`
- `sessionEventBus`
- `stateProjector`

## Escopo

- reduzir responsabilidade direta do `socketManager`
- extrair modulos por dominio
- padronizar payloads e helpers compartilhados
- tornar mais claro o caminho entre evento recebido, mutacao de sessao e evento emitido

## Fora de escopo

- reescrever toda a logica do jogo do zero
- trocar socket.io
- mudar modelo de sessao Redis

## Arquivos mais impactados

- `Backend/websocket/socketManager.js`
- `Backend/websocket/utils/*`
- `Backend/helpers/acoesProcessor.js`
- `Backend/helpers/combateHelper.js`
- `Backend/agents/Mestre/contexto/*`

## Plano de execucao

1. Mapear blocos de responsabilidade do `socketManager`.
2. Extrair primeiro o que ja tem fronteira mais clara:
   - testes
   - turno
   - mensagens de sessao
3. Reduzir `socketManager` para:
   - bind de eventos
   - validacao inicial
   - encaminhamento para o motor correto
4. Criar contratos internos entre os modulos:
   - payload de entrada
   - resultado de mutacao
   - eventos a emitir
5. Padronizar logs por engine.
6. Fazer a segunda rodada de extracao:
   - combate
   - narracao do mestre
   - transicoes de rodada

## Criterios de aceite

- `socketManager.js` deixa de ser o centro de toda a logica de dominio.
- Cada engine tem responsabilidade clara.
- Uma mudanca de turno nao exige navegar por centenas de linhas de codigo nao relacionadas.
- O fluxo fica mais facil de testar e observar.

## Handoff para outra instancia

Objetivo: modularizar o motor do jogo e reduzir o acoplamento do `socketManager`.

Contexto atual:

- `Backend/websocket/socketManager.js` concentra quase tudo
- ja existem utilitarios em `Backend/websocket/utils/`
- o jogo tem estado rico de turno, teste, roleplay, combate e mestre

O que fazer:

- separar o motor por dominio
- deixar `socketManager` como gateway
- preservar o contrato publico atual enquanto a extracao acontece

Entregaveis:

- plano de extracao por fases
- novos modulos por dominio
- reducao mensuravel de tamanho e responsabilidade do `socketManager`

## Observacao de produto

Este item nao muda a experiencia visivel do jogador diretamente, mas e um multiplicador de velocidade para todo o resto do projeto.

---

## Auditoria (2026-03-14)

**Completude: ~100%**

### Metricas atuais

| Arquivo | Linhas |
|---------|--------|
| socketManager.js | 920 |
| combatEngine.js | 616 |
| testEngine.js | 588 |
| turnEngine.js | 589 |
| roomGateway.js | 779 |
| sessionEngine.js | 424 |
| sessionEventBus.js | 55 |
| stateProjector.js | 9 |
| respostaDispatcher.js | 232 |
| sessionMessages.js | 370 |
| testePipeline.js | 319 |
| turnStateMachine.js | 102 |
| masterCacheManager.js | -- |

### Feitos

- socketManager reduzido de ~4000+ para 920 linhas (-77%)
- 5 engines extraidos: combatEngine (616L), testEngine (588L), turnEngine (589L), roomGateway (779L), sessionEngine (424L)
- 5 utils compartilhados: respostaDispatcher (232L), sessionMessages (370L), testePipeline (319L), turnStateMachine (102L), masterCacheManager
- sessionEventBus (55L) e stateProjector (9L) criados e em uso
- socketManager agora e uma fachada com delegate methods
- combatEngine: 15 `io.to()` migrados para sendToRoom/EventBus
- respostaDispatcher: migrado de `ctx.io` para `ctx.sm`
- acoesProcessor: migrado de `io` para `sm` parameter
- Zero `io.to()` direto em engines/handlers/utils (restam apenas em sessionEventBus by design e historiaController canal diferente)
- 7 metodos duplicados removidos, 13 imports nao usados removidos
- **ISocketManager.js** — JSDoc typedef com 16+ metodos documentados (`sendToRoom`, `sendToUser`, `broadcastToAll`, `joinRoom`, `leaveRoom`, `criarMensagemMestre`, `getStats`, `getRoomState`, `setRoomState`, `lockRoom`, `unlockRoom`, `isRoomLocked`, `getMestreCache`, `setMestreCache`, `invalidateMestreCache`, `emitEvent`)
- **criarMensagemMestre** alias adicionado ao socketManager (encapsula emissao de `mensagem_mestre` com payload padronizado)
- **getStats() enriquecido** — retorna `rooms` (lista de roomIds ativos), `mestresCache` (contagem de entradas), `lockedRooms` (lista de salas bloqueadas), `uptime` (segundos desde init)

### Pendentes

Nenhum item pendente.

### Riscos

Nenhum risco aberto.
