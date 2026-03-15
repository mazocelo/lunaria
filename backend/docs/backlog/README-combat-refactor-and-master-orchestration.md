# Combat Refactor and Master Orchestration

## Context

O sistema de combate e continuidade de testes evoluiu bastante, mas a implementação atual ainda concentra responsabilidades demais em poucos arquivos:

- `Backend/websocket/engines/masterNarrationEngine.js`
- `Backend/websocket/engines/testEngine.js`
- `Backend/helpers/combateHelper.js`
- `Backend/websocket/engines/combatEngine.js`
- `Backend/websocket/utils/respostaDispatcher.js`

Ao mesmo tempo, o Mestre IA já acumula responsabilidades de:

- narrar
- arbitrar mecânica
- manter continuidade
- evitar repetição e alucinação

Este documento consolida dois planos complementares:

1. refactor incremental do combate/testes/continuidade
2. arquitetura enxuta de "clones" do Mestre, usando revisores sob demanda em vez de debate permanente
3. validação de alegações do jogador ("detector de mentira") para itens, habilidades, recursos e fatos declarados

## Princípios

- Sem redesign grande.
- Sem state machine nova só por arquitetura.
- Sem debate infinito entre agentes.
- Manter um único Mestre "voz final".
- Extrair primeiro o que reduz acoplamento e duplicação real.
- Priorizar fluxo seguro, baixo risco e legibilidade operacional.
- Validar alegações concretas do jogador contra o estado real antes de aceitar efeitos fortes como fato narrativo.
- Congelar contrato de evento e dono da persistência antes de extrair helpers.

## Parte 1: Refactor Cirúrgico do Combate

### Invariantes de integração

Antes de qualquer extração, esta parte deve tratar como contrato:

- ordem de emissão de eventos de combate
- shape websocket consumido por `dtos.js`, `listeners.js` e `BatalhaUI.jsx`
- ponto único responsável por persistir sessão e clone
- consistência entre fluxo ao vivo e rejoin

#### Ordem mínima a preservar

1. `combate_resultado_acao`
2. `combate_jogador_ferido`, `combate_monstro_derrotado` e `status_dano` quando aplicável
3. `combate_estado`
4. `combate_finalizado` quando aplicável

#### Dono da persistência

- `combatEventEmitter.js` apenas transforma `CombatResult` em eventos
- `combatEventEmitter.js` não persiste sessão nem clone
- `combatEngine.js` continua dono da persistência do combate normal
- `finalizeResolvedTestTurn(...)` continua dono da persistência no pós-teste

#### Compatibilidade de payload

- campos novos devem ser aditivos
- campos existentes não devem mudar de nome ou semântica sem ajustar frontend no mesmo pacote
- qualquer refactor precisa preservar rejoin, log de combate e smoke QA atual

### Onde o código está pedindo refactor

`masterNarrationEngine.js`
- resolve combate
- cria teste
- cria ação pendente
- faz cleanup stale
- persiste sessão
- emite solicitação de dado

`testEngine.js`
- repete bastante fluxo de sucesso/fallback pós-teste

`combateHelper.js`
- resolução da ação
- contra-ataque
- controle de rodada
- DOT/status
- finalização
- pós-teste

`combatEngine.js`
- emissão de eventos muito inline

`respostaDispatcher.js`
- cada vez mais dependente de flags transitórias de sessão

### Refactors recomendados, em ordem

#### 1. Extrair lifecycle da ação pendente

Criar:

- `Backend/websocket/utils/combatPendingAction.js`

Responsabilidades:

- `createPendingCombatAction`
- `resolvePendingCombatAction`
- `clearPendingCombatAction`
- `cleanupStalePendingCombatAction`

Objetivo:

- tirar de `masterNarrationEngine.js` e `testEngine.js` a lógica repetida de:
  - criar pendência
  - associar `testeId`
  - limpar stale
  - cancelar teste
  - destravar turno

#### 2. Separar resolução de ação da resolução de rodada

Dividir a lógica hoje concentrada em `combateHelper.js` em 3 camadas:

- `resolveCombatAction(intent, state)`
- `applyRoundConsequences(state, result)`
- `finalizeCombatState(state, result)`

Objetivo:

- separar intenção do jogador, efeitos da rodada e conclusão do combate
- reduzir o peso de `resolverMecanicaCombate()` e `finalizarAcaoCombatePosTeste()`

#### 3. Trocar branching por mapa de handlers

Substituir a cadeia de `if / else if` por um mapa simples:

```js
const COMBAT_INTENT_HANDLERS = {
  atacar: resolveAttack,
  defender: resolveDefense,
  fugir: prepareEscapeTest,
  usar_habilidade: resolveSkill,
};
```

Objetivo:

- reduzir acoplamento
- facilitar manutenção
- deixar crescimento do combate mais previsível

#### 4. Extrair emissor de eventos de combate

Criar:

- `Backend/websocket/engines/combatEventEmitter.js`

Responsabilidades:

- transformar `CombatResult` em:
  - `combate_resultado_acao`
  - `combate_jogador_ferido`
  - `combate_monstro_derrotado`
  - `combate_estado`
  - `combate_finalizado`

Objetivo:

- separar leitura do resultado, emissão socket e persistência
- reduzir lógica inline em `combatEngine.js`

#### 5. Unificar sucesso/fallback pós-teste

Extrair de `testEngine.js` um helper como:

- `finalizeResolvedTestTurn({ sessao, roomId, resultadoCombatePosTeste, narracao })`

Objetivo:

- impedir drift entre caminho feliz e fallback
- centralizar:
  - processar combate
  - limpar teste
  - atualizar sessão
  - emitir turno

#### 6. Criar DTO explícito de resultado de combate

Em vez do shape implícito atual, usar um contrato interno como:

- `statusEffects`
- `playerAction`
- `enemyActions`
- `roundAdvance`
- `combatEnd`
- `pendingTest`

Objetivo:

- reduzir espalhamento de `if (r.habilidade)` / `if (r.fuga)` / `if (r.statusEfeitosMonstro)`
- melhorar previsibilidade entre helper, engine e emitter

#### 7. Normalizar log de combate em um ponto único

Objetivo:

- alinhar:
  - eventos ao vivo
  - `combate_estado.log`
  - renderização da UI

Direção escolhida:

- backend passa a ser a fonte canônica do shape do log
- `combate_estado.log` e eventos ao vivo devem sair com o mesmo contrato
- frontend pode manter shim de compatibilidade apenas de forma temporária
- evitar dois normalizadores "donos" do mesmo contrato

### O que não fazer agora

- state machine formal de combate
- classes Strategy pesadas
- event sourcing
- refactor grande de `socketManager`
- migração geral do backend para TypeScript só por causa disso

### Ordem prática recomendada

1. `combatPendingAction.js`
2. `combatEventEmitter.js`
3. mapa de handlers de intents
4. unificação do pós-teste em `testEngine`
5. só depois quebrar `combateHelper.js`

### Plano incremental em 3 fases

#### Fase 1 — Orquestração

Escopo:

- extrair `combatPendingAction.js`
- centralizar stale cleanup
- centralizar create/clear/resolve de ação pendente

Resultado esperado:

- `masterNarrationEngine.js` e `testEngine.js` perdem duplicação operacional

#### Fase 2 — Emissão e pós-teste

Escopo:

- criar `combatEventEmitter.js`
- unificar sucesso/fallback pós-teste

Resultado esperado:

- caminhos feliz e fallback passam a emitir exatamente o mesmo conjunto de efeitos/eventos

#### Fase 3 — Núcleo mecânico

Escopo:

- handler map por intent
- separação entre ação, rodada e finalização
- DTO interno de `CombatResult`

Resultado esperado:

- `combateHelper.js` deixa de ser um arquivo "faz tudo"

## Parte 2: Mestre com Revisores Sob Demanda

### Direção recomendada

Sim para "clones", mas não como vários Mestres discutindo toda hora.

Modelo recomendado:

- **1 Mestre principal**
- **2 revisores sob demanda**
- sem debate permanente

### Papéis

#### Narrador

Responsável por:

- escrever a resposta final
- manter voz e estilo do Mestre
- entregar a mensagem ao jogador

#### Árbitro mecânico

Responsável por:

- validar regra
- dano
- teste
- cooldown
- status
- existência real de habilidade, item, recurso e custo declarado
- coerência com resultado mecânico

#### Continuísta

Responsável por:

- checar coerência com sessão
- respeitar NPCs e roteiro
- evitar repetição
- evitar alucinação
- impedir antecipação indevida de arcos
- validar se uma alegação de histórico/fato prévio do jogador contradiz o que já aconteceu

### Detector de mentira

Não deve ser um "agente debatendo toda fala". Deve ser uma checagem curta de coerência factual, acionada só quando o jogador faz uma alegação concreta que muda regra ou ficção.

Função:

- validar se o que o jogador afirma possuir, saber, poder usar ou já ter feito bate com o estado real
- impedir que o Mestre aceite como verdade narrativa algo que não existe na ficha, inventário, histórico ou contexto da sessão

Saída esperada:

- `ok`
- `suspeito`
- `inexistente`
- `incerto`

Resposta operacional:

- `ok`: segue normal
- `suspeito`: Mestre pede clarificação ou trata com cautela
- `inexistente`: Mestre rejeita narrativamente e/ou mecanicamente
- `incerto`: Mestre não confirma como fato; pode converter em pergunta, teste ou investigação

### Critério de precedência

Quando houver conflito entre camadas, a ordem de precedência deve ser:

1. mecânica
2. detector
3. narrativa

Regra prática:

- se a mecânica já validou explicitamente a habilidade ou recurso, o detector não deve bloquear depois
- se o detector encontrou inconsistência concreta antes da resolução, a narrativa não deve transformar isso em fato verdadeiro
- a narrativa final deve sempre obedecer ao estado mecânico e ao resultado do detector

### Fontes de verdade do detector

O detector não deve "achar" a resposta por bom senso. Ele deve consultar fontes explícitas, em ordem:

1. `turnState` do jogador
2. `sessao.personagensCompletos`
3. `estadoJogo.personagemSessao[userId]`
4. histórico canônico da sessão
5. contexto persistente do Mestre

Objetivo:

- item, habilidade e recurso devem ser validados contra estado atual
- conhecimento, pistas e fatos prévios devem ser validados contra histórico/contexto
- se a informação não existir em nenhuma dessas fontes, não deve virar fato narrativo automaticamente

### Janela de consistência para estado recém-alterado

O detector não deve olhar apenas para estado já consolidado. Ele também precisa considerar eventos que acabaram de acontecer e ainda podem não ter sido refletidos em todo o pipeline.

Casos importantes:

- item ganho no mesmo turno
- cooldown encerrado agora
- efeito aplicado agora
- recurso gasto ou restaurado agora
- ação mecânica já resolvida, mas ainda não refletida integralmente no prompt ou no store

Fontes adicionais a considerar antes de marcar algo como `inexistente`:

- ações mecânicas já processadas no turno atual
- pendências/transientes do turno atual
- mensagens e eventos emitidos no próprio ciclo da ação

Objetivo:

- evitar falso positivo por atraso de sincronização
- evitar dizer que o jogador "não tem" algo que acabou de ganhar

### O que o detector valida

- item citado pelo jogador existe no inventário atual
- habilidade ou magia existe na ficha real
- recurso declarado existe e está disponível
- custo/mana/cooldown são compatíveis
- equipamento forte ou raro já foi realmente obtido
- conhecimento alegado já foi descoberto em jogo
- relação com NPC, pista, chave, artefato ou evento passado bate com o histórico

### Heurísticas mínimas de disparo

O detector deve disparar quando o texto do jogador contiver padrões como:

- "eu saco", "eu puxo", "eu uso", "eu ativo", "eu conjuro"
- nomes de habilidades conhecidas
- nomes de equipamentos conhecidos
- menção a item específico + adjetivo forte
- "eu já tinha", "eu já sabia", "eu já combinei", "eu trouxe comigo"
- "como eu tinha preparado", "como eu sabia", "como já descobri"

Exemplos claros:

- "eu saco minha espada lendária"
- "uso meteoros infernais"
- "eu já tinha roubado a chave ontem"
- "eu sei a senha da catacumba"
- "uso minha shuriken elétrica"

Exemplos que não precisam disparar:

- "avanço com cautela"
- "fico em silêncio"
- "encaro o inimigo"
- "tento parecer confiante"
- "respiro fundo"

### Normalização e aliases

Antes de comparar uma alegação do jogador com inventário, habilidades ou contexto, o detector deve normalizar os nomes.

Normalização mínima obrigatória:

- lowercase
- trim
- remoção de acentos
- remoção de pontuação irrelevante
- singular/plural simples quando seguro

Aliases permitidos:

- variação com e sem acento
- nome resumido claramente equivalente
- nome composto vs versão curta conhecida

Exemplos:

- `shuriken elétrica` = `shuriken eletrica`
- `kunais` = `kunai` quando o inventário tiver item equivalente
- `poção de mana` = `pocao de mana`

Regra:

- matching parcial só deve ser usado quando for seguro e sem ambiguidade
- se houver mais de um candidato plausível, o resultado deve ser `suspeito` ou `incerto`, não `ok`

### Quando acionar

#### Ações simples que devem ativar

Estas ações não são "suspeitas", mas mexem com recursos concretos e devem disparar checagem leve:

- usar habilidade
- usar magia
- sacar item específico
- trocar para arma/equipamento específico
- beber poção
- usar pergaminho, bomba, ferramenta ou consumível
- alegar que possui um item-chave

#### Ações suspeitas que devem ativar com prioridade alta

- sacar item forte que nunca apareceu antes
- declarar arma lendária, relíquia, artefato ou munição especial inexistente
- usar habilidade/magia que não está na ficha
- alegar recurso extra não ganho
- dizer que "já tinha preparado isso antes" sem histórico que suporte
- afirmar que conhece senha, ritual, fraqueza, local secreto ou NPC sem pista anterior
- dizer que já tinha combinado algo com NPCs sem ter ocorrido em sessão

### Quando não acionar

- roleplay simples
- fala emocional
- descrição de postura, humor ou intenção
- flavor sem consequência mecânica
- continuação comum de conversa

### Regra anti-falso-positivo

O detector não deve travar narrativa por flavor leve.

Se a fala do jogador:

- não altera estado
- não cria vantagem mecânica
- não introduz item/habilidade/fato novo
- não contradiz o histórico

então a resposta deve ser:

- ignorar a checagem
- ou classificar como `ok` sem custo adicional

Exemplo:

- "seguro firme minha adaga" não precisa disparar validação dura se a arma não for o centro da ação
- "saco a Lâmina Solar Ancestral que herdei do rei" precisa disparar

### Hard block vs soft block

Nem toda inconsistência precisa ter o mesmo peso.

#### Hard block

Situações em que a alegação não deve produzir efeito como fato válido:

- habilidade inexistente
- magia inexistente
- item/equipamento inexistente
- mana insuficiente
- cooldown impossível
- recurso consumível inexistente
- artefato, relíquia ou equipamento forte não obtido

Resposta esperada:

- bloquear mecanicamente
- impedir que a narrativa trate a alegação como verdade
- responder com rejeição controlada ou falha coerente

#### Soft block

Situações em que a alegação não deve ser aceita imediatamente, mas também não precisa virar veto seco:

- fato prévio não sustentado
- preparo anterior não comprovado
- conhecimento incerto
- combinação prévia com NPC não registrada
- memória/improviso plausível, mas não confirmável

Resposta esperada:

- pedir clarificação
- converter em teste
- converter em investigação
- narrar com incerteza

### Resposta padrão por nível de confiança

#### `ok`

- seguir normalmente
- usar o item/habilidade/fato sem fricção

#### `suspeito`

- não aceitar como fato completo
- pedir clarificação curta
- ou narrar com incerteza

Exemplo:

- "Você tenta alcançar esse item, mas Corvus franze a testa. Não se recorda de você portar algo assim. O que exatamente você está usando?"

#### `inexistente`

- rejeitar a alegação
- não aplicar efeito mecânico
- se for combate, transformar em falha controlada ou orientação

Exemplo:

- "Você procura essa arma entre seus pertences, mas ela não está lá."

#### `incerto`

- não confirmar como verdade
- converter em:
  - pergunta
  - investigação
  - teste
  - lembrança incompleta

### Bypass controlado do Mestre

`inexistente` não deve significar sempre veto seco.

Em alguns casos, o Mestre pode converter uma alegação inválida em uma saída controlada, desde que não conceda gratuitamente o benefício alegado.

Exemplos aceitáveis:

- item inexistente vira improviso pobre
- técnica inexistente vira tentativa arriscada com teste
- "eu já tinha preparado isso" vira flashback curto com custo ou exigência

Regras:

- nunca conceder o benefício cheio de algo inexistente
- se houver improviso, adicionar custo, risco, limitação ou teste
- se a alegação for absurda ou quebrar o jogo, manter hard block

### Retcon e preparo prévio

Falta de prova no histórico não significa sempre veto. O sistema deve distinguir:

#### Retcon leve permitido

Pode ser aceito ou convertido em teste/custo quando:

- é plausível para a classe/ficha/personagem
- não contradiz fato já estabelecido
- não gera vantagem desproporcional
- parece preparação razoável, e não um item milagroso

Exemplos:

- "eu trouxe corda"
- "eu tinha separado uma tocha extra"
- "eu já deixei minhas ferramentas fáceis de alcançar"

#### Retcon bloqueado

Deve ser `soft block` forte ou `hard block` quando:

- contradiz algo já narrado
- cria recurso raro sem obtenção prévia
- concede conhecimento crítico sem pista
- tenta resolver cena importante por conveniência retroativa

Exemplos:

- "eu já tinha a chave da catacumba"
- "eu trouxe o artefato lendário escondido"
- "eu já sabia a fraqueza do boss sem nunca ter descoberto"

### Onde encaixar no pipeline

O detector deve rodar:

1. depois da sanitização da entrada
2. antes da narrativa final
3. antes da aplicação mecânica apenas quando a alegação puder alterar regra e ainda não houver validação mecânica autoritativa

Separação recomendada:

- combate/testes: antes da resolução apenas para alegações não cobertas pelo motor mecânico
- roleplay/exploração: antes da narração final

Precedência operacional:

- a mecânica continua autoritativa quando já existe validação real no backend
- o detector roda sempre antes da narrativa final
- o detector só roda antes da mecânica quando a alegação ainda não é coberta por validação mecânica nativa
- o detector não reabre nem invalida retroativamente uma ação que a mecânica já aceitou explicitamente

Integração com revisores:

- detector faz triagem factual curta
- árbitro mecânico não reimplementa todo o detector
- árbitro mecânico consome o sinal do detector quando houver alegação concreta relevante
- continuísta só usa o resultado do detector quando isso afetar coerência, retcon ou fato prévio

Objetivo:

- impedir que algo inexistente seja aceito cedo demais
- preservar espaço para improviso controlado em cena não mecânica
- evitar validação duplicada entre detector e revisores

### Plano mínimo de implementação

#### Fase 1 — Itens, habilidades e recursos

Cobrir:

- item citado existe no inventário
- habilidade/magia existe na ficha
- mana/cooldown/recurso disponível

Saída:

- alerta curto injetado no contexto do Mestre
- bloqueio mecânico quando aplicável

#### Fase 2 — Fatos e preparo prévio

Cobrir:

- "eu já sabia"
- "eu já tinha"
- "eu já combinei"
- "eu trouxe isso antes"

Saída:

- checagem contra histórico/contexto persistente
- `incerto` ou `inexistente` quando não houver suporte

#### Fase 3 — Ajuste fino

Cobrir:

- reduzir falso positivo
- melhorar parser de alegações
- melhorar mensagens de clarificação

### Formato interno sugerido

O detector pode produzir algo simples como:

```js
{
  status: 'ok' | 'suspeito' | 'inexistente' | 'incerto',
  tipo: 'item' | 'habilidade' | 'recurso' | 'fato_previo' | 'conhecimento',
  claim: 'texto resumido da alegação',
  motivo: 'não encontrado no inventário',
  fonte: 'turnState.inventario',
  acaoRecomendada: 'bloquear' | 'pedir_clarificacao' | 'converter_em_teste' | 'seguir'
}
```

Campos opcionais úteis:

- `blockLevel: 'hard' | 'soft'`
- `confidence: 0..1`
- `candidatos: []`
- `estadoTransitorioConsiderado: true | false`

### Observabilidade

Adicionar log estruturado apenas quando o detector disparar:

- `roomId`
- `userId`
- `tipo`
- `status`
- `claim`
- `fonte`
- `acaoRecomendada`

Objetivo:

- medir falso positivo
- entender quando o jogador está tentando forçar item/habilidade inexistente
- ajustar heurísticas sem depender só de percepção manual

### Tom da resposta ao jogador

O Mestre não deve soar acusatório.

Evitar:

- "isso é mentira"
- "você está tentando enganar o sistema"
- "isso não existe e você inventou"

Preferir:

- "você procura esse item entre seus pertences, mas ele não está lá"
- "você não encontra lastro para essa técnica no que domina hoje"
- "isso não bate com o que você carrega agora"
- "você tenta recorrer a esse preparo, mas não há sinal de que ele tenha sido estabelecido antes"

### Quando acionar os revisores

- combate com ambiguidade de regra, alegação concreta relevante ou consequência crítica
- dúvida de regra não coberta pelo motor mecânico
- revelações importantes de história
- alegação concreta de item, habilidade, recurso, conhecimento ou preparo prévio
- decisão com consequência irreversível

### Quando não acionar

- todo combate indiscriminadamente
- rodadas de combate com intent claro e sem alegação
- toda mensagem comum
- roleplay simples
- respostas curtas de continuação

### Pipeline recomendado

A revisão é feita via pipeline do Mestre. O Mestre orquestra tudo.

1. resolver mecânica
2. validar alegações concretas do jogador
3. montar contexto
4. revisar coerência/regra
5. narrar

### Feature flags

- `REVIEWER_ENABLED=true|false` — gate global para ativar/desativar revisores
- default: `true` (revisores ativos)
- se `false`, o Mestre principal responde sozinho sem revisão
- futuramente: `MECHANICAL_REVIEWER_ENABLED`, `CONTINUITY_REVIEWER_ENABLED` como flags granulares (não obrigatórias agora)
- revisores devem ser no-op quando a flag correspondente estiver desligada
- logs devem registrar quando um revisor foi pulado por flag
- enabled por default NÃO significa revisar toda mensagem

### Timeout e fallback

Budget por revisor:

- árbitro mecânico: 250-400ms
- continuísta: 300-500ms
- sem retry em cascata no caminho crítico

Política de falha:

Árbitro mecânico:

- se a mecânica já resolveu de forma autoritativa: fail-open com log
- se existe contradição factual forte: fail-soft pedindo clarificação ou bloqueando efeito impossível

Continuísta:

- fail-open com log, sem travar a resposta do Mestre

Regra geral:

- nunca travar indefinidamente a resposta do Mestre
- se ambos os revisores falharem, o Mestre responde sozinho com log de warning

### Divisão de responsabilidade

- Narrador = voz final
- Árbitro = validação curta de regra/contradição
- Continuísta = repetição/alucinação/roteiro
- sem debate entre clones

### Por que isso é melhor que debate entre clones

- reduz latência
- reduz custo
- evita respostas confusas
- mantém voz única do Mestre
- permite revisão forte só quando realmente importa

## Arquitetura sugerida de 3 agentes

### Mestre principal

Entrada:

- ação do jogador
- contexto da sessão
- resultado mecânico já resolvido

Saída:

- narrativa final
- metadados narrativos

### Revisor mecânico

Entrada:

- ação do jogador
- `CombatResult`
- estado do personagem e do combate
- alegações concretas do jogador sobre itens, habilidades e recursos

Saída:

- flags simples:
  - `ok`
  - `contradicao`
  - `regra_invalida`
  - `faltou_resultado`
- `alegacao_inexistente`
- observações curtas e objetivas

### Revisor de continuidade

Entrada:

- histórico
- resumo
- contexto da sessão
- blueprint condensado
- narrativa candidata

Saída:

- flags simples:
  - `ok`
  - `repeticao`
  - `alucinacao`
  - `antecipa_roteiro`
  - `npc_inconsistente`
  - `fato_nao_sustentado`

## Ordem de adoção sugerida

1. manter o Mestre atual como voz principal
2. adicionar detector de alegações concretas para item/habilidade/recurso
3. adicionar revisor mecânico só para combate e testes
4. adicionar revisor de continuidade em respostas sensíveis
5. só depois avaliar qualquer forma de orquestração mais sofisticada

## Plano combinado recomendado

### Etapa A — Estabilizar base do combate [CONCLUÍDA]

Entregue:

- `combatPendingAction.js` — lifecycle centralizado
- `combatEventEmitter.js` — emissão extraída de combatEngine
- unificação do pós-teste via `_processPostTestCombat`
- `normalizeCombatLogEntry` + `_pushCombatLog` — log normalizado no write
- `COMBAT_INTENT_HANDLERS` — handler map por intent

### Etapa B — Organizar núcleo mecânico [CONCLUÍDA]

Entregue:

- handler map por intent (COMBAT_INTENT_HANDLERS)
- separação entre ação, rodada e finalização via `createCombatRoundResult` DTO
- DTO interno de resultado (`combatRoundResult.js`) com 15 campos canônicos
- `combateHelper.js` funções puras extraídas e testadas (48 testes)

### Etapa C — Adicionar revisão sob demanda do Mestre [CONCLUÍDA]

Entregue:

- detector de alegações concretas (Fase 1: itens/habilidades, Fase 2: fatos prévios)
- hard block para itens/habilidades inexistentes, soft block para fatos sem evidência
- revisor mecânico (ArbitroMecanico) integrado com claimFlags
- revisor de continuidade (Continuista) integrado via reviewOrchestrator
- pipeline: detectar → validar → bloquear/avisar → narrar
- 92+ testes unitários cobrindo combate, detector, DTO e pipeline

## Critério de pronto do detector

O detector está pronto quando:

- habilidade inexistente nunca vira efeito narrativo forte
- item inexistente não vira equipamento válido em cena
- alegação de recurso extra não passa sem validação
- fato prévio inventado não é aceito automaticamente
- ações simples continuam fluindo sem fricção
- falso positivo fica baixo o suficiente para não irritar o jogador

## QA do detector

### Casos obrigatórios

- habilidade inexistente
- magia inexistente
- item existente com alias
- item inexistente
- fato prévio inventado
- conhecimento não sustentado
- ação simples que não deve disparar
- item ganho no mesmo turno
- cooldown/mana recém-alterados
- reconexão com teste pendente

### Resultado esperado

- o detector bloqueia o que precisa bloquear
- não trava ações simples
- não acusa mentira por atraso de sincronização
- usa tom não acusatório
- não contradiz a mecânica já validada

## Critério de sucesso

O plano está funcionando quando:

- combate/testes continuam coerentes sem duplicação de lógica
- fallback e caminho feliz emitem o mesmo comportamento essencial
- o Mestre não precisa "inventar" regra
- o Mestre não aceita como fato itens, habilidades e recursos inexistentes
- a narrativa final continua com voz única
- revisores entram só quando agregam valor real

## Resumo objetivo

Os melhores próximos passos são:

- extrair lifecycle da ação pendente
- extrair emissor de eventos
- trocar branching por mapa de handlers
- deduplicar o pós-teste
- adicionar detector de mentira para alegações concretas do jogador
- manter 1 Mestre principal com 2 revisores sob demanda

Isso melhora manutenção, consistência e previsibilidade sem over-engineering.
