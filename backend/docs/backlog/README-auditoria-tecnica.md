# README de Auditoria Tecnica

## Objetivo

Este documento define um padrao rigido e repetivel para revisar mudancas de:

- combate
- testes e contextual rolls
- websocket/backend -> frontend
- narracao do Mestre
- sincronizacao de estado em sessao e rejoin

O foco da auditoria e encontrar:

- bugs reais
- regressao comportamental
- inconsistencias de estado
- falhas de fallback, catch e cleanup
- contratos websocket quebrados
- mudancas que compilam, mas nao funcionam no fluxo real

Nao e guia de refactor amplo. E um playbook de revisao objetiva orientada a funcionamento.

## Regra central

O criterio principal da auditoria e: o codigo precisa funcionar.

Isso significa:

- perguntar "funciona de ponta a ponta?" antes de perguntar "ficou bem desenhado?"
- seguir cada fluxo relevante ate o consumidor final
- tratar `node --check` e `npm run build` como base minima, nao como prova suficiente

Nao e aceitavel fechar uma frente so com:

- check sintatico
- build
- leitura superficial do diff

Se o fluxo nao foi executado ou inspecionado ate o efeito final, isso precisa ser dito como limite real da revisao.

## Principios

- Priorizar comportamento real, nao estetica de codigo.
- Codigo "limpo" nao compensa fluxo quebrado.
- Revisar primeiro caminhos de erro, fallback e reconexao.
- Tratar backend, socket, store e UI como um fluxo unico.
- Se houver micro-fix suficiente, nao propor redesign grande.
- Se nao houver problema material, dizer explicitamente.
- Se nao houver prova minima do fluxo, nao declarar "fechado" por suposicao.

## Escopo padrao da revisao

Revisar:

- arquivos alterados na frente atual
- callsites imediatos
- listeners, DTOs, emitters e stores afetados
- qualquer fallback, catch ou cleanup relacionado
- o consumidor final do estado alterado

Evitar:

- expandir para areas nao tocadas
- transformar a revisao em brainstorming de arquitetura
- abrir duvida nova sem relacao com o bug real

## Evidencia minima obrigatoria

Para qualquer fluxo relevante alterado, a auditoria deve tentar provar pelo menos esta cadeia:

1. gatilho de entrada
2. logica backend que resolve a regra
3. evento emitido
4. DTO ou normalizacao no frontend
5. listener e atualizacao de store
6. efeito visivel na UI, ou consumidor final equivalente

Se o fluxo tiver fallback, erro, stale cleanup ou rejoin, essa mesma cadeia deve ser verificada tambem nesses caminhos.

Se alguma parte nao puder ser executada, a revisao deve dizer exatamente:

- o que nao foi validado
- por que nao foi validado
- qual risco isso deixa aberto

## Ordem de inspecao

### 1. Backend mecanico

Verificar:

- helper principal da feature
- engine que aplica a regra
- persistencia de sessao ou estado
- shape do resultado produzido

Exemplos nesta base:

- `Backend/helpers/combateHelper.js`
- `Backend/websocket/engines/combatEngine.js`
- `Backend/websocket/engines/testEngine.js`
- `Backend/websocket/engines/masterNarrationEngine.js`

### 2. Dispatcher e orquestracao

Verificar:

- guards
- flags de sessao
- ordem dos handlers
- duplicacao de emissao ou finalizacao

Exemplo:

- `Backend/websocket/utils/respostaDispatcher.js`

### 3. Contrato do evento

Verificar:

- evento emitido pelo backend
- shape do payload
- normalizacao no frontend
- atualizacao de store
- render na UI

Exemplos:

- `Frontend/src/store/socket/dtos.js`
- `Frontend/src/store/socket/listeners.js`
- `Frontend/src/components/Jogo/Gameplay/BatalhaUI.jsx`

### 4. Rejoin, sync e fallback

Verificar:

- `combate_estado`
- historico e log sincronizados
- teste pendente em reconexao
- fallback sem IA
- cleanup stale

### 5. Consumidor final

Verificar:

- se a UI realmente reage ao estado novo
- se o subtype novo tem render coerente
- se um fluxo ao vivo e um fluxo rejoin terminam no mesmo shape util
- se o jogador final recebe estado jogavel, nao so log tecnico

## Prioridades da auditoria

### Alta

- perde estado
- consome acao indevidamente
- finaliza fluxo duas vezes
- narrativa contradiz mecanica
- cliente nao recebe evento critico
- rejoin volta inconsistente
- fallback engole emissao mecanica ja resolvida
- catch limpa erro mas deixa estado parcialmente aplicado
- cleanup stale remove metade do estado e deixa lock pendente

### Media

- contrato parcial ou shape divergente
- UI nao reflete subtype novo
- cleanup incompleto
- label ou metadata incorretos
- fallback funciona, mas de forma degradada ou inconsistente

### Baixa

- logging irregular
- texto de UI ou log incompleto
- documentacao desatualizada
- residual pequeno sem impacto funcional direto

## Checklist de revisao

### Prova de funcionamento

- [ ] o caminho principal foi seguido ate o consumidor final
- [ ] pelo menos um caminho de erro ou fallback foi seguido ate o consumidor final
- [ ] rejoin ou reconexao foi inspecionado quando a frente toca estado persistido
- [ ] a revisao deixa claro o que foi realmente validado e o que nao foi

### Mecanica

- [ ] a acao realmente altera estado
- [ ] dano, efeito, rodada e finalizacao batem com a regra
- [ ] inputs invalidos nao consomem acao
- [ ] fallback nao ignora resultado mecanico ja calculado

### WebSocket

- [ ] o backend emite o evento certo
- [ ] o frontend escuta esse evento
- [ ] o payload recebido e compativel com DTO e listener
- [ ] nao ha subtype novo sem branch no cliente

### Store e UI

- [ ] HP, status e log atualizam no store
- [ ] a UI mostra o estado coerente
- [ ] `combate_estado` e fluxo ao vivo usam shape compativel
- [ ] reconexao nao perde campos importantes

### Testes pendentes e acao pendente

- [ ] criacao da pendencia e explicita
- [ ] cleanup stale remove tambem locks e testes associados
- [ ] sucesso e falha limpam o estado corretamente
- [ ] fallback pos-teste mantem emissao dos eventos

### Narrativa do Mestre

- [ ] nao inventa resultado contrario a mecanica
- [ ] nao vaza markup ou protocolo
- [ ] nao repete contexto ja dado
- [ ] respeita resultado de teste e finalizacao de combate

## Red flags automaticos

Se qualquer item abaixo aparecer, o default e nao fechar a frente:

- backend resolveu a mecanica, mas o cliente nao recebe o evento correspondente
- subtype novo entrou no backend sem branch equivalente em DTO, listener ou UI
- fallback usa texto alternativo, mas nao aplica os efeitos mecanicos ja calculados
- cleanup stale remove a acao pendente, mas nao remove lock ou teste associado
- rejoin carrega shape diferente do fluxo ao vivo
- o codigo depende de "a IA provavelmente respeita" onde deveria haver validacao dura

## Comandos de validacao

### Backend

```powershell
node --check Backend/helpers/combateHelper.js
node --check Backend/websocket/engines/combatEngine.js
node --check Backend/websocket/engines/testEngine.js
node --check Backend/websocket/engines/masterNarrationEngine.js
node --check Backend/websocket/utils/respostaDispatcher.js
```

### Frontend

```powershell
cd Frontend
npm run build
```

### Inspecao rapida de pontos criticos

```powershell
rg -n "combate_resultado_acao|combate_estado|resultado_teste|acaoPendenteCombate|testePendente|status_dano|status_efeito" Backend Frontend
```

## Formato obrigatorio da revisao

### 1. Achados

- listar primeiro os problemas
- ordenar por severidade
- incluir arquivo e linha aproximada
- explicar impacto real no produto ou jogo

### 2. Confirmado

- listar o que foi validado e esta correto

### 3. Validacao executada

- dizer quais checks rodaram
- dizer quais fluxos foram realmente inspecionados
- dizer claramente o que nao foi possivel validar

### 4. Veredito

- dizer se a frente esta fechada ou nao
- se nao estiver, apontar exatamente o que falta corrigir

## Modelo de resposta

```text
Achados
- Alta: descricao objetiva do bug com arquivo/linha e impacto
- Media: descricao objetiva do bug com arquivo/linha e impacto

Confirmado
- item validado
- item validado

Validacao executada
- checks rodados
- fluxo X inspecionado
- fluxo Y nao validado; risco residual Z

Veredito
- sem achados materiais
ou
- nao esta fechado; falta corrigir X, Y e Z
```

## Heuristicas uteis

- Se o backend ja resolveu a mecanica, o fallback tambem precisa emitir os efeitos.
- Se um subtype novo entrou no payload, a UI provavelmente precisa de branch nova.
- Se existe cleanup stale, ele deve limpar tambem lock e pendencia relacionada.
- Se `combate_estado` e evento ao vivo tiverem shape diferente, o rejoin tende a quebrar.
- Se a IA falha e o estado continua, o sistema precisa permanecer jogavel.
- Se a revisao nao consegue provar a cadeia backend -> evento -> store -> UI, o maximo aceitavel e "risco residual", nao "fechado".
- Se a validacao manual nao foi rodada, isso deve ser dito como limite real.
- Se a correcao depende de o consumidor interpretar um payload novo, ausencia de branch explicita e bug ate prova em contrario.

## Quando considerar a frente fechada

A frente pode ser considerada fechada quando:

- checks sintaticos passam
- build do frontend passa
- o fluxo principal foi inspecionado ate o consumidor final
- fallback e erro relevantes foram inspecionados quando existem
- rejoin e cleanup foram inspecionados quando a frente mexe com estado persistido
- nao ha achados alta ou media
- narrativa, mecanica e estado nao se contradizem
- a revisao deixou explicito o que ainda nao foi provado em execucao

## Resumo objetivo

Boa auditoria aqui significa:

- findings primeiro
- impacto real
- foco no fluxo completo
- foco em funcionar de verdade
- zero romantizacao de arquitetura
- zero "parece bom" sem validar backend, socket, store e UI juntos
