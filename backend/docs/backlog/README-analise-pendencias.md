# Analise das Pendencias

Este arquivo resume o estado atual das frentes abertas do projeto, com foco em:

- o que ja foi fechado
- o que esta parcialmente resolvido
- o que ainda depende de implementacao
- qual deve ser a ordem pratica depois da rodada atual

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
| 3 | Jobs duraveis para IA | parcialmente concluido | a v1 de roteiro async duravel esta em andamento, mas ainda precisa fechamento e validacao real |
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

- a v1 esta focada apenas em roteiro
- imagem, TTS, R2, admin e operacao mais rica ficaram para fases seguintes

**O que ja entrou ou esta entrando**

- BullMQ + Redis como base da fila
- worker separado da API
- tabela `ai_jobs`
- enqueue de roteiro
- processamento de roteiro no worker
- auto-geracao de roteiro saindo do processo web
- polling de `GET /historias/:id/roteiro` aceitando `queued`

**O que ainda falta para considerar a v1 fechada**

- invalidacao confiavel do cache do mestre quando o worker atualizar o roteiro de uma historia com sessao ativa
- aplicar migration no banco de dev/staging
- validar o fluxo real com:
  - API ativa
  - worker ativo
  - Redis ativo
  - restart da API
  - restart do worker
  - falha forzada do provider
- commitar a rodada de forma isolada e limpa

**Leitura pratica**

Nao avancar para imagem e TTS antes de fechar a validacao do roteiro async v1.

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

Essa frente fica muito mais valiosa depois de fechar melhor a modularizacao e a v1 de jobs duraveis.

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

## Ordem recomendada depois de fechar roteiro async v1

1. fechar a task 3 v1 de roteiro async duravel
2. limpar a modularizacao residual do motor do jogo
3. criar observabilidade e admin minima
4. expandir jobs duraveis para imagem
5. expandir jobs duraveis para TTS
6. adicionar controles de produto para IA
7. endurecer deploy e banco para HostGator/VPS

## Pendencias imediatas

Estas sao as pendencias mais concretas no curto prazo:

### P-01 Fechar a v1 de roteiro async

- invalidar `mestresCache` quando o worker atualizar um roteiro usado por sessao ativa
- aplicar migration no banco
- subir API + worker + Redis
- validar restart da API
- validar restart do worker
- validar falha forzada do provider

### P-02 Encerrar a limpeza da modularizacao

- remover copias antigas de metodos ja delegados
- reduzir codigo morto no `socketManager`
- revisar se toda emissao relevante ja passa por caminhos mais centralizados

### P-03 Preparar a proxima rodada operacional

- definir o recorte minimo de observabilidade
- decidir se a proxima expansao dos jobs vai ser imagem ou admin

## O que nao deve acontecer agora

Para evitar dispersao e overengineering, nao e recomendavel nesta fase:

- abrir imagem async e TTS async antes de fechar roteiro async v1
- construir UI admin completa antes dos endpoints operacionais
- refatorar novamente o motor inteiro sem primeiro remover o codigo duplicado remanescente
- endurecer deploy final de HostGator antes da estabilizacao do runtime

## Resumo executivo

O projeto ja saiu da fase de exploracao e entrou numa fase de consolidacao estrutural.

O contrato publico do websocket esta praticamente resolvido.
A modularizacao do motor melhorou bastante, mas ainda precisa limpeza final.
Os jobs duraveis de IA deram o primeiro passo correto com roteiro async v1, que ainda precisa fechamento operacional.

Depois disso, as frentes de maior retorno passam a ser:

1. observabilidade/admin minima
2. expansao dos jobs duraveis para outras midias
3. endurecimento do deploy e da operacao

## Handoff para outra instancia

Se outra instancia retomar daqui, a orientacao e:

1. tratar o websocket publico como frente praticamente fechada
2. considerar a modularizacao como parcialmente concluida, com limpeza final pendente
3. fechar o roteiro async v1 antes de abrir imagem ou TTS async
4. usar este arquivo como snapshot do estado das seis frentes
