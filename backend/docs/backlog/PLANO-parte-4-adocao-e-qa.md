# Plano Parte 4 - Adocao, Ordem de Execucao e QA

## Objetivo

Transformar o plano consolidado em ordem pratica de execucao, com cortes seguros, criterio de sucesso e checklist de QA.

## Ordem combinada recomendada

### Etapa A - Estabilizar base do combate

Fazer primeiro:

- `combatPendingAction.js`
- `combatEventEmitter.js`
- unificacao do pos-teste

Resultado esperado:

- caminho feliz e fallback passam a emitir o mesmo comportamento essencial
- acao pendente e stale cleanup saem dos arquivos grandes

### Etapa B - Organizar nucleo mecanico

Fazer depois:

- handler map por intent
- separacao entre acao, rodada e finalizacao
- DTO interno de resultado

Resultado esperado:

- `combateHelper.js` deixa de ser o ponto de concentracao total
- crescimento do combate fica previsivel

### Etapa C - Adicionar revisao sob demanda do Mestre

Fazer depois da base mecanica:

- detector de alegacoes concretas do jogador
- revisor mecanico para combate e teste
- revisor de continuidade para respostas criticas
- manter um unico narrador final

Resultado esperado:

- o Mestre para de aceitar como fato itens, habilidades e recursos inexistentes
- respostas importantes ganham consistencia sem debate permanente

## Dependencias praticas

- Parte 1 e pre-requisito tecnico da Parte 3 quando houver fluxo de combate/teste envolvido
- Parte 2 pode comecar antes, mas rende melhor depois que a base mecanica estiver estabilizada
- Parte 4 nao cria arquitetura nova; ela organiza rollout e validacao

## Criterio de sucesso geral

O plano esta funcionando quando:

- combate e testes continuam coerentes sem duplicacao de logica
- fallback e caminho feliz emitem o mesmo comportamento essencial
- o Mestre nao precisa inventar regra
- o Mestre nao aceita como fato itens, habilidades e recursos inexistentes
- revisores entram so quando agregam valor real
- a narrativa final continua com voz unica

## Criterio de pronto do detector

O detector esta pronto quando:

- habilidade inexistente nunca vira efeito narrativo forte
- item inexistente nao vira equipamento valido em cena
- alegacao de recurso extra nao passa sem validacao
- fato previo inventado nao e aceito automaticamente
- acoes simples continuam fluindo sem friccao
- falso positivo fica baixo o suficiente para nao irritar o jogador

## QA do detector

### Casos obrigatorios

- habilidade inexistente
- magia inexistente
- item existente com alias
- item inexistente
- fato previo inventado
- conhecimento nao sustentado
- acao simples que nao deve disparar
- item ganho no mesmo turno
- cooldown e mana recem-alterados
- reconexao com teste pendente

### Resultado esperado

- bloqueia o que precisa bloquear
- nao trava acoes simples
- nao acusa mentira por atraso de sincronizacao
- usa tom nao acusatorio
- nao contradiz a mecanica ja validada

## QA de combate e continuidade

### Smoke QA

1. entrar em combate
2. atacar
3. validar dano, log, rodada e contra-ataque
4. enviar input vago e confirmar que nao consome acao
5. defender
6. fugir com sucesso e com falha
7. usar habilidade valida e invalida
8. validar teste pendente e continuidade pos-rolagem
9. sair e voltar no meio do combate

### Resultado esperado

- HP, log, rodada e eventos batem no backend e no cliente
- teste pendente nao trava fluxo
- rejoin nao duplica mensagens nem perde estado

## Sequencia recomendada para QA

1. fluxo basico de combate
2. inputs que nao devem consumir acao
3. defender e fugir
4. habilidades
5. pipeline de testes
6. reconexao e rejoin
7. status e DOT
8. finalizacao

## Riscos residuais aceitos

- rollout pode ser gradual por fluxo critico
- parte do detector pode entrar primeiro em modo observacao antes de hard block
- UI pode continuar consumindo compat temporaria enquanto backend estabiliza o shape final

## Resumo executivo

Se for preciso cortar escopo, a ordem minima segura e:

1. Parte 1
2. Parte 2 Fase 1
3. Parte 3 com revisor mecanico apenas em combate e testes
4. QA completo de combate, detector e rejoin
