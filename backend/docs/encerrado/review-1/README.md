# Review 1 - Instrucoes

Este diretorio existe para registrar a primeira revisao formal do estado atual do `Backend` contra o backlog padrao.

O objetivo nao e implementar features nesta pasta. O objetivo e produzir analise reutilizavel, rastreavel e pronta para outras instancias continuarem o trabalho com o mesmo criterio.

## Objetivo

Validar se o codigo atual:

- corresponde ao backlog padrao
- nao reintroduziu regressao
- nao inflou o percentual de conclusao nos READMEs
- nao misturou implementacoes fora da frente correta
- nao deixou bugs de contrato ou seguranca escondidos atras da documentacao

## Fonte de verdade

Durante a revisao, use sempre esta ordem de prioridade:

1. codigo atual do workspace
2. backlog padrao em `Backend/docs/backlog/`
3. backlog derivado em `Backend/docs/backlog-2/`
4. READMEs de status e analise

Se houver divergencia entre documento e runtime, o codigo vence.

## Escopo padrao da revisao

As 6 frentes oficiais sao:

1. `F-01` contrato publico do websocket
2. `F-02` modularizacao do motor do jogo
3. `D-01` jobs duraveis para IA
4. `D-02` deploy e banco VPS
5. `D-03` observabilidade e admin do motor
6. `F-03` controles de produto para IA

## Regra principal

Esta pasta e para revisao, nao para implementacao.

Durante uma rodada de review:

- nao altere API publica
- nao ajuste comportamento de runtime
- nao reescreva backlog ainda
- primeiro confirme o problema no codigo
- so depois classifique o achado

Implementacoes devem acontecer em rodadas separadas, depois da consolidacao dos achados.

## Formato obrigatorio dos achados

Cada achado deve ter:

- severidade
- classificacao
- descricao objetiva
- impacto
- referencia de arquivo e linha
- recomendacao

Classificacoes permitidas:

- `Confirmado`
- `Parcial`
- `Hipotese`
- `Fora de escopo`

Severidades recomendadas:

- `Critica`
- `Alta`
- `Media`
- `Baixa`

## Status por frente

Ao final de cada frente, use apenas um destes status:

- `Concluida`
- `Parcial`
- `Regredida`
- `Superestimada no backlog`

## Estrutura recomendada por rodada

Cada rodada deve responder:

1. O backlog diz que esta frente esta pronta?
2. O runtime realmente confirma isso?
3. Houve drift entre documentacao e codigo?
4. Existe bug funcional, risco arquitetural ou so limpeza pendente?
5. O item fica no backlog principal ou migra para `backlog-2`?

## Ordem recomendada

Siga a ordem abaixo para manter coerencia com o backlog padrao:

1. websocket
2. modularizacao
3. jobs IA
4. deploy e banco
5. observabilidade/admin
6. controles de produto para IA

## Artefatos de entrada

Antes de iniciar uma review completa, abrir no minimo:

- `Backend/docs/backlog/README.md`
- `Backend/docs/backlog/README-analise-pendencias.md`
- os 6 arquivos oficiais das frentes
- `git status` do `Backend`
- os arquivos modificados da frente atual

## Artefatos de saida

Uma review fechada deve gerar:

- achados ordenados por severidade
- status real da frente
- pendencias imediatas
- itens que vao para `backlog-2`
- observacoes sobre docs inflados ou defasados

## Quando migrar item para backlog-2

Mova para `backlog-2` quando o item:

- nao for parte do escopo original da frente
- for vulnerabilidade, bug novo ou debito descoberto depois
- exigir outra rodada de arquitetura
- conflitar com a narrativa de "frente concluida"

## Sinais de alerta

Trate com atencao especial quando encontrar:

- auth que confia em payload do cliente
- docs marcando `~100%` sem correspondencia no runtime
- feature nova sem rota publica, sem polling ou sem consumo real
- retry/admin que funciona so para um tipo de job
- variavel removida do codigo mas ainda viva em env/documentacao
- rollback, migrate ou release com semantica incorreta

## Handoff para outra instancia

Se outra instancia continuar a review:

- nao resuma demais os achados
- preserve o vinculo entre achado e arquivo
- diferencie claramente bug confirmado de interpretacao
- registre se o problema esta no codigo, na documentacao ou nos dois

## Observacao

Se um README disser `100%`, isso nao encerra a discussao.

Nesta pasta, `100%` so vale quando:

- o runtime confirma
- a documentacao confere
- nao ha drift material
- nao ha bug aberto que contradiga a conclusao
