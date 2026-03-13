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

## Auditoria (2026-03-13)

**Completude: ~48%** (analista: 55%, revisor: 48%)

### Metricas atuais

| Arquivo | Linhas |
|---------|--------|
| socketManager.js | 2.067 |
| combatEngine.js | 616 |
| testEngine.js | 588 |
| turnEngine.js | 589 |
| roomGateway.js | 779 |
| sessionEventBus.js | 55 |
| stateProjector.js | 9 |
| respostaDispatcher.js | 229 |
| sessionMessages.js | 370 |
| testePipeline.js | 319 |
| turnStateMachine.js | 102 |

### Feitos

- Extracao de 4 modulos: combatEngine, testEngine, turnEngine, roomGateway
- SessionEventBus e stateProjector criados e em uso
- 4 utils compartilhados (respostaDispatcher, sessionMessages, testePipeline, turnStateMachine)
- 7 metodos duplicados removidos, 13 imports nao usados removidos
- socketManager reduzido de ~4000+ para 2067 linhas

### Pendentes

| # | Item | Tamanho | Prioridade |
|---|------|---------|-----------|
| P1 | `masterNarrationEngine` nao extraido — `handleMensagemParaMestre` (L836-1160, 325L) monolitico | Grande | Alta |
| P2 | `handleAuthentication` (L501-633, 133L) nao extraido | Medio | Media |
| P3 | `handleMensagemRoleplay` (L1165-1291, 127L) nao extraido | Medio | Media |
| P4 | `handleChatMessage` (L650-760, 111L) nao extraido | Medio | Media |
| P5 | `obterSessaoHistoria` (L1508-1640, 133L) nao extraido | Medio | Media |
| P6 | `executarCompactacaoSeNecessaria` (L1385-1492, 108L) nao extraido | Medio | Baixa |
| P7 | `obterMestre` (L1763-1860, 98L) nao extraido | Medio | Baixa |
| P8 | `handleRpgAction` (L764-820, 57L) e `handleStatusUpdate` (L1303-1352, 50L) nao extraidos | Pequeno | Baixa |
| P9 | combatEngine: 15 `sm.io.to()` diretos (bypassa EventBus) | -- | Alta |
| P10 | SessionEventBus subutilizado: 5 usos no socketManager vs 10 `io.to().emit()` diretos | -- | Media |
| P11 | Acoplamento pesado: combatEngine 26 refs sm., testEngine 63, turnEngine 76, roomGateway 97 | -- | Media |
| P12 | Contratos internos entre modulos nao formalizados | -- | Baixa |

### Riscos

- Engines sao "pedacos do monolito em outros arquivos" — 262 refs `sm.` no total sem interface definida
- combatEngine bypassa totalmente o EventBus com emits diretos
- socketManager ainda longe de ser "fachada leve" (2067L, 5+ handlers grandes)
