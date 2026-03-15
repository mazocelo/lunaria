# Plano Parte 1 - Refactor Cirurgico do Combate

## Objetivo

Reduzir acoplamento e duplicacao no fluxo de combate, testes e continuidade sem redesign grande.

Este plano deriva do documento consolidado em `README-combat-refactor-and-master-orchestration.md`, mas isola apenas a frente de refactor do combate.

## Problema atual

Os arquivos abaixo concentram responsabilidades demais:

- `Backend/websocket/engines/masterNarrationEngine.js`
- `Backend/websocket/engines/testEngine.js`
- `Backend/helpers/combateHelper.js`
- `Backend/websocket/engines/combatEngine.js`
- `Backend/websocket/utils/respostaDispatcher.js`

Sintomas:

- criacao e limpeza de acao pendente espalhadas
- pos-teste com fluxo duplicado entre caminho feliz e fallback
- emissao de eventos de combate muito inline
- `combateHelper.js` acumulando acao, rodada, DOT, finalizacao e pos-teste
- dispatcher cada vez mais dependente de flags transitorias de sessao

## Principios

- Sem state machine nova so por arquitetura.
- Sem Strategy pesada.
- Sem refactor grande de `socketManager`.
- Extrair primeiro o que tira duplicacao operacional real.
- Preservar comportamento atual antes de mexer no nucleo mecanico.

## Ordem recomendada

1. extrair lifecycle da acao pendente
2. extrair emissor de eventos de combate
3. trocar branching por mapa de handlers
4. unificar sucesso e fallback pos-teste
5. so depois quebrar `combateHelper.js`

## Fase 1 - Orquestracao

### Entrega

Criar:

- `Backend/websocket/utils/combatPendingAction.js`

### Responsabilidades

- `createPendingCombatAction`
- `resolvePendingCombatAction`
- `clearPendingCombatAction`
- `cleanupStalePendingCombatAction`

### Arquivos impactados

- `Backend/websocket/engines/masterNarrationEngine.js`
- `Backend/websocket/engines/testEngine.js`

### Resultado esperado

- criacao, associacao de `testeId`, limpeza stale e destravamento de turno deixam de ficar duplicados
- `masterNarrationEngine.js` perde responsabilidade operacional
- `testEngine.js` deixa de reconstruir o mesmo fluxo varias vezes

## Fase 2 - Emissao e pos-teste

### Entrega

Criar:

- `Backend/websocket/engines/combatEventEmitter.js`

Extrair helper:

- `finalizeResolvedTestTurn({ sessao, roomId, resultadoCombatePosTeste, narracao })`

### Responsabilidades do emitter

Transformar `CombatResult` em:

- `combate_resultado_acao`
- `combate_jogador_ferido`
- `combate_monstro_derrotado`
- `combate_estado`
- `combate_finalizado`

### Arquivos impactados

- `Backend/websocket/engines/combatEngine.js`
- `Backend/websocket/engines/testEngine.js`

### Resultado esperado

- caminho feliz e fallback passam a emitir o mesmo conjunto essencial de efeitos
- `combatEngine.js` deixa de misturar leitura de resultado, emissao e persistencia

## Fase 3 - Nucleo mecanico

### Entrega

Dividir a logica hoje concentrada em `combateHelper.js` em:

- `resolveCombatAction(intent, state)`
- `applyRoundConsequences(state, result)`
- `finalizeCombatState(state, result)`

Trocar `if / else if` por:

```js
const COMBAT_INTENT_HANDLERS = {
  atacar: resolveAttack,
  defender: resolveDefense,
  fugir: prepareEscapeTest,
  usar_habilidade: resolveSkill,
};
```

Criar um DTO interno de resultado:

- `statusEffects`
- `playerAction`
- `enemyActions`
- `roundAdvance`
- `combatEnd`
- `pendingTest`

### Arquivos impactados

- `Backend/helpers/combateHelper.js`
- `Backend/websocket/engines/combatEngine.js`

### Resultado esperado

- `combateHelper.js` deixa de ser arquivo "faz tudo"
- intents de combate passam a crescer sem inflar branching
- o contrato entre helper, engine e emitter fica previsivel

## Log de combate

Ha um refactor transversal obrigatorio:

- normalizar log em um ponto unico

Objetivo:

- alinhar eventos ao vivo
- alinhar `combate_estado.log`
- alinhar o shape que a UI consome

Direcao:

- backend emitir shape consistente
- ou normalizador unico antes de persistir e antes de entregar ao frontend

## Fora de escopo

- event sourcing
- migracao geral para TypeScript
- redesign de UX de combate
- trocar o modelo do Mestre

## Criterio de pronto

Esta parte esta pronta quando:

- criacao e limpeza de acao pendente estiverem centralizadas
- pos-teste nao duplicar logica operacional
- emissao de eventos de combate sair de `combatEngine.js` inline
- `combateHelper.js` deixar de concentrar acao, rodada e finalizacao no mesmo bloco
- o log de combate tiver shape previsivel no ao vivo e no rejoin

## Riscos residuais aceitos

- algum arquivo ainda pode servir como facade/wrapper durante a migracao
- pode haver compat temporaria com DTO antigo enquanto o frontend e estabilizado
