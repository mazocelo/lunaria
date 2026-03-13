# D-01 - Jobs duraveis para IA

## Tipo

Discussao

## Prioridade

Alta

## Contexto

Parte relevante do sistema ainda roda geracoes longas em background no proprio processo web, em IIFEs disparadas pelos controllers. Isso ja e suficiente para funcionar em baixo volume, mas nao e o desenho ideal para:

- deploy frequente
- restart do dyno/processo
- filas maiores
- retentativa de falha
- observabilidade de jobs presos

Exemplos claros estao em:

- `Backend/controllers/historia/historiaController.js`
- geracao de roteiro
- geracao de imagem
- geracao de audio quando expandir para fila

## Problema atual

- job em memoria morre se o processo reiniciar
- dificil reprocessar com seguranca
- dificil saber o que ficou preso
- dificil separar tempo de request e tempo de processamento

## Como deve ser

O projeto precisa migrar as geracoes longas para um sistema de jobs duraveis com:

- fila persistida
- status de job
- retentativa
- timeout
- observabilidade basica

## Direcao recomendada

Fase 1 recomendada:

- Redis + BullMQ
- um worker separado do processo web
- jobs de:
  - roteiro
  - imagem
  - audio

Fase 2:

- prioridades por tipo
- DLQ ou fila de falha
- painel de jobs

## Decisoes a maturar

- Redis ja existente pode ser reutilizado?
- um worker unico basta ou precisa separar por tipo de job?
- jobs devem ser idempotentes por entidade?
- qual estrategia de retentativa e segura para IA e custo?

## Escopo sugerido para prova de conceito

1. mover geracao de roteiro para fila
2. registrar `jobId` na historia
3. exibir status via endpoint/socket
4. worker finaliza a historia e emite evento

## Criterios de aceite da POC

- gerar roteiro nao depende mais do processo web continuar vivo
- um restart do app nao perde o trabalho enfileirado
- existe reprocessamento controlado
- existe log claro de sucesso, falha e timeout

## Handoff para outra instancia

Objetivo: desenhar e implementar a primeira fila duravel para geracoes de IA.

Contexto atual:

- o projeto usa Redis
- os controllers ainda disparam jobs com IIFE em memoria
- roteiro e o melhor ponto inicial para migracao

O que fazer:

- escolher a tecnologia da fila
- mover primeiro o fluxo de roteiro
- definir status, retries e eventos

Entregaveis:

- worker separado
- enfileiramento de roteiro
- status de job persistido

## Observacao de arquitetura

Este item conversa diretamente com observabilidade e com endurecimento de deploy. Vale tratar como base tecnica transversal.
