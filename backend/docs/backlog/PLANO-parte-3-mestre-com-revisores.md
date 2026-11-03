# Plano Parte 3 - Mestre com Revisores Sob Demanda

## Objetivo

Manter um unico Mestre como voz final e adicionar revisores apenas quando a resposta precisar de validacao forte.

A revisao e feita via pipeline do Mestre. Nao ha agentes externos debatendo — o Mestre orquestra tudo.

## Direcao

- 1 Mestre principal (Narrador) como voz final
- 2 revisores sob demanda, acionados por heuristica
- infraestrutura de revisao enabled por default
- revisores nao rodam em toda mensagem
- sem debate permanente entre clones

## Papeis

### Narrador

Responsavel por:

- escrever a resposta final
- manter voz e estilo do Mestre
- entregar a mensagem ao jogador

### Arbitro mecanico

Responsavel por:

- validar regra
- dano
- teste
- cooldown
- status
- existencia real de habilidade, item, recurso e custo declarado
- coerencia com resultado mecanico

### Continuista

Responsavel por:

- checar coerencia com sessao
- respeitar NPCs e roteiro
- evitar repeticao
- evitar alucinacao
- impedir antecipacao indevida de arcos
- validar se fato previo alegado pelo jogador contradiz o que ja aconteceu

## Quando acionar os revisores

- combate com ambiguidade de regra, alegacao concreta relevante ou consequencia critica
- duvida de regra nao coberta pelo motor mecanico
- revelacoes importantes de historia
- alegacao concreta de item, habilidade, recurso, conhecimento ou preparo previo
- decisao com consequencia irreversivel

## Quando nao acionar

- todo combate indiscriminadamente
- rodadas de combate com intent claro e sem alegacao
- toda mensagem comum
- roleplay simples
- respostas curtas de continuacao

## Pipeline recomendado

1. resolver mecanica
2. validar alegacoes concretas do jogador
3. montar contexto
4. revisar coerencia e regra
5. narrar

## Por que isso e melhor que debate entre clones

- reduz latencia
- reduz custo
- evita respostas confusas
- mantem voz unica do Mestre
- permite revisao forte so quando realmente importa

## Arquitetura sugerida de 3 agentes

### Mestre principal

Entrada:

- acao do jogador
- contexto da sessao
- resultado mecanico ja resolvido

Saida:

- narrativa final
- metadados narrativos

### Revisor mecanico

Entrada:

- acao do jogador
- `CombatResult`
- estado do personagem e do combate
- alegacoes concretas do jogador sobre itens, habilidades e recursos

Saida:

- `ok`
- `contradicao`
- `regra_invalida`
- `faltou_resultado`
- `alegacao_inexistente`
- observacoes curtas e objetivas

### Revisor de continuidade

Entrada:

- historico
- resumo
- contexto da sessao
- blueprint condensado
- narrativa candidata

Saida:

- `ok`
- `repeticao`
- `alucinacao`
- `antecipa_roteiro`
- `npc_inconsistente`
- `fato_nao_sustentado`

## Regras de uso

- o Narrador continua sendo a unica voz entregue ao jogador
- revisores produzem flags curtas, nao texto final longo
- revisores nao devem abrir debate entre si
- quando nenhum risco relevante existir, a resposta segue sem revisao adicional

## Feature flags

- `REVIEWER_ENABLED=true|false` — gate global para ativar/desativar revisores
- default: `true` (revisores ativos)
- se `false`, o Mestre principal responde sozinho sem revisao
- futuramente: `MECHANICAL_REVIEWER_ENABLED`, `CONTINUITY_REVIEWER_ENABLED` como flags granulares (nao obrigatorias agora)
- revisores devem ser no-op quando a flag correspondente estiver desligada
- logs devem registrar quando um revisor foi pulado por flag

## Timeout e fallback

### Budget por revisor

- arbitro mecanico: 250-400ms
- continuista: 300-500ms
- sem retry em cascata no caminho critico

### Politica de falha

Arbitro mecanico:

- se a mecanica ja resolveu de forma autoritativa: fail-open com log
- se existe contradicao factual forte: fail-soft pedindo clarificacao ou bloqueando efeito impossivel

Continuista:

- fail-open com log, sem travar a resposta do Mestre

Regra geral:

- nunca travar indefinidamente a resposta do Mestre
- se ambos os revisores falharem, o Mestre responde sozinho com log de warning

### Divisao de responsabilidade

- Narrador = voz final
- Arbitro = validacao curta de regra/contradicao
- Continuista = repeticao/alucinacao/roteiro
- sem debate entre clones

## Integracao com o detector (Parte 2)

O detector de alegacoes concretas funciona como triagem factual curta antes da resposta final.

Divisao de responsabilidade:

- detector = triagem factual curta (item existe? habilidade existe? fato previo sustentado?)
- arbitro mecanico = validacao curta de regra e contradicao mecanica
- continuista = coerencia narrativa, repeticao, roteiro, NPCs
- o arbitro mecanico nao deve reimplementar todo o detector
- o continuista so usa o resultado do detector quando isso afetar coerencia ou fato previo

Pipeline:

- alegacao concreta dispara detector
- detector pode acionar o arbitro mecanico quando houver duvida de regra
- resposta critica pode acionar o continuista
- narrador recebe apenas o contexto final necessario

Ver `PLANO-parte-2-detector-de-alegacoes.md` para precedencia operacional e regras de integracao.

## Ordem de adocao sugerida

1. manter o Mestre atual como voz principal
2. adicionar detector de alegacoes concretas para item, habilidade e recurso
3. adicionar revisor mecanico so para combate e testes
4. adicionar revisor de continuidade em respostas sensiveis
5. so depois avaliar qualquer forma de orquestracao mais sofisticada

## Criterio de pronto

Esta parte esta pronta quando:

- a narrativa final continua com voz unica
- combate e testes passam por revisao mecanica apenas quando necessario
- respostas sensiveis deixam de repetir, alucinar ou antecipar arco com frequencia relevante
- o custo e a latencia continuam aceitaveis
- revisores podem ser desligados por feature flag sem impacto no fluxo
- timeout estourado nao trava resposta do Mestre

## Riscos residuais aceitos

- algumas respostas comuns podem continuar sem revisao para preservar fluidez
- detector e revisores podem inicialmente operar so em subset de fluxos criticos
