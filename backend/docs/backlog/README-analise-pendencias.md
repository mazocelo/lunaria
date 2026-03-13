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

## Status geral

| Ordem | Tema | Status | Resumo |
| --- | --- | --- | --- |
| 1 | Contrato publico do websocket | praticamente concluido | documentacao e catalogo do contrato ja foram alinhados ao runtime atual |
| 2 | Modularizacao do motor do jogo | parcialmente concluido | houve extracao para gateway/engines, mas ainda sobra limpeza de codigo antigo |
| 3 | Jobs duraveis para IA | parcialmente concluido | a v1 de roteiro async duravel foi fechada; expansao para imagem e TTS continua pendente |
| 4 | Observabilidade e admin do motor | pendente | ainda nao existe camada operacional suficiente para diagnostico sem abrir codigo |
| 5 | Controles de produto para IA | pendente | falta transformar os motores de geracao em ferramentas de direcao criativa |
| 6 | Deploy e banco para HostGator/VPS | pendente | continua dependente da estabilizacao das decisoes de motor, jobs e operacao |

## Analise por frente

### 1. Contrato publico do websocket

**Status:** praticamente concluido

**O que ja foi feito**

- o contrato publico do websocket foi revisado e documentado
- o caminho canonico de gameplay foi separado de eventos suportados por compatibilidade
- a documentacao estruturada foi alinhada ao runtime atual

**O que ainda pode aparecer**

- pequenos ajustes de documentacao quando o runtime mudar
- saneamento de exemplos se surgirem novos eventos canonicos

**Leitura pratica**

Nao e mais uma frente aberta de arquitetura. Ela agora entrou em modo de manutencao.

### 2. Modularizacao do motor do jogo

**Status:** parcialmente concluido

**O que ja foi feito**

- o `socketManager` deixou de carregar sozinho todo o peso do dominio
- surgiram extracoes como:
  - `roomGateway`
  - `turnEngine`
  - `testEngine`
  - `sessionEventBus`
  - `stateProjector`
- parte do runtime ja foi religada para usar essas extracoes de fato

**O que ainda falta**

- remover codigo antigo ainda duplicado no `socketManager`
- reduzir dependencia direta das engines em helpers e emissoes do manager
- usar `SessionEventBus` e `stateProjector` de forma mais completa
- medir novamente o tamanho e a responsabilidade residual do `socketManager`

**Leitura pratica**

Essa frente nao esta quebrada, mas tambem nao esta definitivamente encerrada. O trabalho mais arriscado ja foi feito; o que resta agora e consolidacao e limpeza final.

### 3. Jobs duraveis para IA

**Status:** parcialmente concluido

**Recorte atual**

- a v1 de roteiro async duravel foi concluida
- imagem, TTS, R2, admin e operacao mais rica ficaram para fases seguintes

**O que ja entrou**

- BullMQ + Redis como base da fila
- worker separado da API
- tabela `ai_jobs`
- enqueue de roteiro
- processamento de roteiro no worker
- auto-geracao de roteiro saindo do processo web
- polling de `GET /historias/:id/roteiro` aceitando `queued`
- migration aplicada no banco existente
- validacao real com:
  - restart da API
  - restart do worker
  - falha de provider
- correcao do risco de `mestresCache` stale por comparacao com `estadoJogo.historiaRoteiroAtualizadoEm`

**O que ainda falta nesta frente**

- jobs duraveis para imagem
- jobs duraveis para TTS
- storage de artefatos para audio async, se a fase de TTS pedir isso
- endpoints operacionais/admin para consulta e reprocessamento
- politicas de limpeza e retencao mais maduras para filas e artefatos

**Leitura pratica**

A frente deixou de ser uma discussao inicial e passou a ser expansao incremental. O roteiro async v1 serve como base para as proximas filas.

### 4. Observabilidade e admin do motor

**Status:** pendente

**O que falta construir**

- visao de sessao ativa
- estado de turno atual
- testes pendentes
- ultimo prompt e ultima resposta do mestre
- jobs ativos, falhos e reprocessados
- consumo operacional de IA
- trilha de erros que hoje se perde em logs

**Direcao recomendada**

Comecar com endpoints backend internos e uma camada de leitura/admin simples, sem UI dedicada na primeira rodada.

**Leitura pratica**

Essa frente fica muito mais valiosa agora que o motor esta mais modular e o roteiro async v1 foi fechado.

### 5. Controles de produto para IA

**Status:** pendente

**O que falta construir**

- modos explicitos de geracao de roteiro
- variacoes de proposta por intencao
- comparacao entre versoes
- direcao criativa por tema, tom, foco ou estilo
- maior controle do usuario sobre regeneracao alternativa

**Leitura pratica**

Essa frente impacta diretamente a experiencia, mas rende mais quando:

- o pipeline de IA estiver duravel
- houver observabilidade minima
- o estado do job estiver mais transparente

### 6. Deploy e banco para HostGator/VPS

**Status:** pendente

**O que falta construir**

- processo de release mais seguro
- migracoes mais maduras que `db push`
- subida e reinicio coordenado de:
  - backend
  - worker
  - frontend
- preparacao para dominio, TLS e proxy reverso
- operacao consistente fora do ambiente atual

**Leitura pratica**

Essa frente deve vir por ultimo, quando motor e jobs estiverem mais estabilizados.

## Ordem recomendada a partir do estado atual

1. limpar a modularizacao residual do motor do jogo
2. criar observabilidade e admin minima
3. expandir jobs duraveis para imagem
4. expandir jobs duraveis para TTS
5. adicionar controles de produto para IA
6. endurecer deploy e banco para HostGator/VPS

## Pendencias imediatas

Estas sao as pendencias mais concretas no curto prazo:

### P-01 Encerrar a limpeza da modularizacao

- remover copias antigas de metodos ja delegados
- reduzir codigo morto no `socketManager`
- revisar se toda emissao relevante ja passa por caminhos mais centralizados

### P-02 Criar observabilidade minima

- listar sessoes ativas
- expor estado de turno e testes pendentes
- expor jobs do motor e de IA
- facilitar debug sem abrir codigo ou depender so de log

### P-03 Planejar a expansao da fila de IA

- decidir se a proxima expansao vai ser imagem ou admin operacional
- manter imagem e TTS fora do processo web, seguindo o mesmo modelo do roteiro

## O que nao deve acontecer agora

Para evitar dispersao e overengineering, nao e recomendavel nesta fase:

- construir UI admin completa antes dos endpoints operacionais
- refatorar novamente o motor inteiro sem primeiro remover o codigo duplicado remanescente
- endurecer deploy final de HostGator antes da estabilizacao do runtime

## Resumo executivo

O projeto ja saiu da fase de exploracao e entrou numa fase de consolidacao estrutural.

O contrato publico do websocket esta praticamente resolvido.
A modularizacao do motor melhorou bastante, mas ainda precisa limpeza final.
Os jobs duraveis de IA ja deram o primeiro passo correto com roteiro async v1 fechado.

Depois disso, as frentes de maior retorno passam a ser:

1. observabilidade/admin minima
2. expansao dos jobs duraveis para outras midias
3. endurecimento do deploy e da operacao

## Handoff para outra instancia

Se outra instancia retomar daqui, a orientacao e:

1. tratar o websocket publico como frente praticamente fechada
2. considerar a modularizacao como parcialmente concluida, com limpeza final pendente
3. considerar o roteiro async v1 como base pronta para expansao
4. priorizar observabilidade e a proxima fila async sem reabrir discussoes ja fechadas
5. usar este arquivo como snapshot do estado das seis frentes
