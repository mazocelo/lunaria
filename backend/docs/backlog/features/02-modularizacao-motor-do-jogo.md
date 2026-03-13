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
